/** レッスン一覧。順番は推奨だが、開けるものは自由に選べる。 */

import { ROUTES, lessonPath } from '../app/routes';
import { useProgress } from '../app/useProgress';
import { ScreenHeader } from '../components/ScreenHeader/ScreenHeader';
import { LESSON_CATALOG } from '../lessons/lessonCatalog';
import { countCompletedLessons } from '../storage/progressStorage';
import type { PageProps } from './pageProps';
import './LessonsPage.css';

const STATUS_TEXT = {
  not_started: '未開始',
  in_progress: '途中まで',
  completed: '完了',
} as const;

export function LessonsPage({ navigate }: PageProps) {
  const { progress } = useProgress();
  const completed = countCompletedLessons(progress);

  return (
    <div className="stack">
      <ScreenHeader
        title="レッスン"
        monoLabel="BASIC COURSE / 5 LESSONS"
        onBack={() => navigate(ROUTES.home)}
        backLabel="トップへ"
        progressText={`${completed} / ${LESSON_CATALOG.length} 完了`}
        progressRatio={completed / LESSON_CATALOG.length}
      />

      <p className="note-text">
        上から順に進むのがおすすめです。1つのレッスンは5〜7分ほどで終わります。
      </p>

      <ul className="lesson-list">
        {LESSON_CATALOG.map((entry) => {
          const status = progress.lessons[entry.id].status;
          const available = entry.definition !== undefined;

          return (
            <li key={entry.id}>
              <button
                type="button"
                className="lesson-card"
                data-status={status}
                disabled={!available}
                onClick={() => navigate(lessonPath(entry.id))}
              >
                <span className="lesson-card__head">
                  <span className="mono-label">{entry.monoLabel}</span>
                  <span className="lesson-card__status mono-label">
                    {available ? STATUS_TEXT[status] : '準備中'}
                  </span>
                </span>
                <span className="lesson-card__title">{entry.title}</span>
                <span className="lesson-card__subtitle">{entry.subtitle}</span>
                <span className="lesson-card__meta mono-label">{entry.durationText}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="note-text">
        ※準備中のレッスンは順に追加します。先に「計器を見る」で自由に動かすこともできます。
      </p>

      <button type="button" className="button-secondary" onClick={() => navigate(ROUTES.instrument)}>
        計器を見る
        <span className="mono-label">INDICATOR</span>
      </button>
    </div>
  );
}

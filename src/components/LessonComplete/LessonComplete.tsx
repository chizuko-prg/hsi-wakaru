/**
 * レッスンの修了表示。
 *
 * 「最初の回答で正解した数」と「最後まで確認できたこと」を分けて伝える。
 * 合格・不合格を強く打ち出さない。目安に届かなくても行き止まりにしない。
 */

import type { LessonDefinition } from '../../lessons/lessonTypes';
import './LessonComplete.css';

export interface LessonCompleteProps {
  lesson: LessonDefinition;
  /** 最初の回答で正解した数。 */
  score: number;
  /** 採点対象の問題数。 */
  total: number;
  onReview: () => void;
  onBackToLessons: () => void;
  onNext?: () => void;
  /** 5レッスンすべて終えたか。終えていれば修了画面へ案内する。 */
  courseCompleted?: boolean;
  onCourseComplete?: () => void;
}

export function LessonComplete({
  lesson,
  score,
  total,
  onReview,
  onBackToLessons,
  onNext,
  courseCompleted = false,
  onCourseComplete,
}: LessonCompleteProps) {
  const copy = lesson.completion;
  const message = score >= lesson.passingScore ? copy.messageWhenStrong : copy.messageWhenMore;

  return (
    <div className="stack">
      <section className="card-header">
        <span className="card-header-title">{copy.title}</span>
        <span className="mono-label">COMPLETE</span>
      </section>

      <section className="card-body lesson-complete__body">
        <p className="body-text">{copy.completedLineTemplate.replace('{count}', String(total))}</p>

        <div className="lesson-complete__score">
          <span className="mono-label">FIRST TRY / 最初の回答で正解</span>
          <span className="readout">
            {score} / {total}
          </span>
        </div>

        <p className="note-text">{message}</p>
      </section>

      <section className="lesson-complete__learned">
        <h2 className="card-heading">学んだこと</h2>
        <ul className="lesson-complete__list">
          {copy.learned.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="card lesson-complete__next">
        <span className="mono-label">NEXT / つぎは</span>
        <p className="note-text">{copy.nextPreview}</p>
      </section>

      {/*
        主ボタンは1つだけ。優先順位は
        すべて終えた → 修了画面 / 次がある → 次のレッスン / それ以外 → 一覧
      */}
      {courseCompleted && onCourseComplete ? (
        <button type="button" className="button-primary" onClick={onCourseComplete}>
          学んだことを整理する
          <span className="mono-label">COURSE COMPLETE</span>
        </button>
      ) : copy.nextAvailable && onNext ? (
        <button type="button" className="button-primary" onClick={onNext}>
          次のレッスンへ
          <span className="mono-label">NEXT LESSON</span>
        </button>
      ) : (
        <button type="button" className="button-primary" onClick={onBackToLessons}>
          レッスン一覧へ
          <span className="mono-label">LESSON LIST</span>
        </button>
      )}

      <button type="button" className="button-quiet" onClick={onReview}>
        もう一度このレッスンを見る
      </button>
    </div>
  );
}

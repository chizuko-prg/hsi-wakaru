/** トップ画面。 */

import { ROUTES } from '../app/routes';
import { useProgress } from '../app/useProgress';
import { SafetyNote } from '../components/SafetyNote/SafetyNote';
import { LESSON_CATALOG } from '../lessons/lessonCatalog';
import { countCompletedLessons } from '../storage/progressStorage';
import type { PageProps } from './pageProps';
import './HomePage.css';

export function HomePage({ navigate }: PageProps) {
  const { progress } = useProgress();
  const completed = countCompletedLessons(progress);

  return (
    <div className="stack">
      <header className="home-hero">
        <span className="mono-label">HSI / 基礎学習</span>
        <h1 className="app-title">HSIわかる？</h1>
        <p className="body-text">
          いま自分は<strong>どちらを向いていて</strong>、<strong>どちらへ進むべきか</strong>。
          計器を動かしながら確かめよう。
        </p>
      </header>

      <SafetyNote variant="top" />

      <nav className="stack" aria-label="メニュー">
        <button type="button" className="button-primary" onClick={() => navigate(ROUTES.lessons)}>
          {completed === 0 ? 'はじめて学ぶ' : '学習のつづきへ'}
          <span className="mono-label">BASIC COURSE / 5 LESSONS</span>
        </button>

        <div className="home-progress card">
          <span className="mono-label">PROGRESS / 基本コース</span>
          <p className="home-progress__value readout-sm">
            {completed} / {LESSON_CATALOG.length} 完了
          </p>
        </div>

        <button
          type="button"
          className="button-secondary"
          onClick={() => navigate(ROUTES.instrument)}
        >
          計器を見る
          <span className="mono-label">INDICATOR</span>
        </button>

        <button type="button" className="button-secondary" onClick={() => navigate(ROUTES.freePlay)}>
          自由に動かす
          <span className="mono-label">FREE PLAY</span>
        </button>
      </nav>

      <section className="card home-about">
        <span className="mono-label">ABOUT / このアプリ</span>
        <p className="note-text">
          HSIは、飛行機の「向き」と「選んだコース」を1つにまとめて見る計器です。
          部品の名前を覚える教材ではなく、パイロットが計器を見て何を判断しているかを、
          自分で動かしながら理解します。
        </p>
      </section>

      <footer className="home-footer">
        <button type="button" className="button-quiet" onClick={() => navigate(ROUTES.about)}>
          About / 注意事項
        </button>
      </footer>
    </div>
  );
}

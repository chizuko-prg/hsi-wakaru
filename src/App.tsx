import { Analytics } from '@vercel/analytics/react';
import { ROUTES } from './app/routes';
import { useHashRoute } from './app/useHashRoute';
import { findLesson } from './lessons/lessonCatalog';
import { AboutPage } from './pages/AboutPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { HomePage } from './pages/HomePage';
import { InstrumentPage } from './pages/InstrumentPage';
import { LessonPage } from './pages/LessonPage';
import { LessonsPage } from './pages/LessonsPage';

export default function App() {
  const { path, segments, navigate } = useHashRoute();

  const screen = (() => {
    if (path === ROUTES.home) return <HomePage navigate={navigate} />;
    if (path === ROUTES.about) return <AboutPage navigate={navigate} />;
    if (path === ROUTES.instrument) return <InstrumentPage navigate={navigate} />;
    if (path === ROUTES.lessons) return <LessonsPage navigate={navigate} />;

    // 学習画面。修了表示も同じ画面の中で出す。
    if (segments[0] === 'lesson') {
      const lesson = findLesson(segments[1] ?? '');

      // key を付けて、レッスンを移ったら学習画面の状態を作り直す。
      if (lesson) {
        return <LessonPage key={lesson.id} navigate={navigate} lesson={lesson} />;
      }

      return (
        <ComingSoonPage
          navigate={navigate}
          title="レッスン"
          monoLabel="LESSON / 学習画面"
          plannedIn="次の段階"
          description="このレッスンはまだ準備中です。レッスン一覧から、公開済みのレッスンを開けます。"
        />
      );
    }

    // 以下は段階的に置き換える。それまでは行き止まりにしない。
    if (path === ROUTES.freePlay) {
      return (
        <ComingSoonPage
          navigate={navigate}
          title="自由に動かす"
          monoLabel="FREE PLAY / 自由操作"
          plannedIn="R6"
          description="レッスンを離れて、Heading・Course・風を自由に動かせるようにします。いまは「計器を見る」で同じことができます。"
        />
      );
    }

    if (path === ROUTES.courseComplete) {
      return (
        <ComingSoonPage
          navigate={navigate}
          title="基本コース修了"
          monoLabel="COMPLETE / 修了"
          plannedIn="R6"
        />
      );
    }

    // 知らないパスはトップへ落とす。
    return <HomePage navigate={navigate} />;
  })();

  return (
    <>
      <main className="shell">{screen}</main>
      <Analytics />
    </>
  );
}

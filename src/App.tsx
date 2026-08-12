import { Analytics } from '@vercel/analytics/react';
import { ROUTES } from './app/routes';
import { useHashRoute } from './app/useHashRoute';
import { findLesson } from './lessons/lessonCatalog';
import { AboutPage } from './pages/AboutPage';
import { CourseCompletePage } from './pages/CourseCompletePage';
import { FreePlayPage } from './pages/FreePlayPage';
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
    if (path === ROUTES.freePlay) return <FreePlayPage navigate={navigate} />;
    if (path === ROUTES.courseComplete) return <CourseCompletePage navigate={navigate} />;

    // 学習画面。修了表示も同じ画面の中で出す。
    if (segments[0] === 'lesson') {
      const lesson = findLesson(segments[1] ?? '');

      // key を付けて、レッスンを移ったら学習画面の状態を作り直す。
      if (lesson) {
        return <LessonPage key={lesson.id} navigate={navigate} lesson={lesson} />;
      }
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

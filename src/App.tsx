import { Analytics } from '@vercel/analytics/react';
import { ROUTES } from './app/routes';
import { useHashRoute } from './app/useHashRoute';
import { AboutPage } from './pages/AboutPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { HomePage } from './pages/HomePage';
import { InstrumentPage } from './pages/InstrumentPage';

export default function App() {
  const { path, navigate } = useHashRoute();

  const screen = (() => {
    if (path === ROUTES.home) return <HomePage navigate={navigate} />;
    if (path === ROUTES.about) return <AboutPage navigate={navigate} />;
    if (path === ROUTES.instrument) return <InstrumentPage navigate={navigate} />;

    // 以下は段階的に置き換える。それまでは行き止まりにしない。
    if (path === ROUTES.lessons || path.startsWith(`${ROUTES.lesson}/`)) {
      return (
        <ComingSoonPage
          navigate={navigate}
          title="レッスン"
          monoLabel="BASIC COURSE / 5 LESSONS"
          plannedIn="R2"
          description="HSIって何？ / HeadingとCourse / CDIを読む / Intercept / Tracking の5レッスンを追加します。"
        />
      );
    }

    if (path === ROUTES.freePlay) {
      return (
        <ComingSoonPage
          navigate={navigate}
          title="自由に動かす"
          monoLabel="FREE PLAY / 自由操作"
          plannedIn="R6"
          description="レッスンを離れて、Heading・Course・風を自由に動かせるようにします。"
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

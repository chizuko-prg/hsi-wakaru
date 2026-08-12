/**
 * 段階公開のあいだ、まだ実装していない画面の受け皿。
 * 行き止まりを作らないよう、必ず戻る手段と次に見られるものを置く。
 */

import { ROUTES } from '../app/routes';
import { ScreenHeader } from '../components/ScreenHeader/ScreenHeader';
import type { PageProps } from './pageProps';

export interface ComingSoonPageProps extends PageProps {
  title: string;
  monoLabel: string;
  /** 「R2」のような追加予定の段階。 */
  plannedIn: string;
  /** この画面で何ができるようになるかの一言。 */
  description?: string;
}

export function ComingSoonPage({
  navigate,
  title,
  monoLabel,
  plannedIn,
  description,
}: ComingSoonPageProps) {
  return (
    <div className="stack">
      <ScreenHeader
        title={title}
        monoLabel={monoLabel}
        onBack={() => navigate(ROUTES.home)}
        backLabel="トップへ"
      />

      <section className="card card-raised stack-tight">
        <span className="mono-label">IN PREPARATION / 準備中</span>
        <p className="body-text">この画面は{plannedIn}で追加します。</p>
        {description && <p className="note-text">{description}</p>}
      </section>

      <button type="button" className="button-primary" onClick={() => navigate(ROUTES.about)}>
        About / 注意事項を見る
        <span className="mono-label">ABOUT</span>
      </button>
    </div>
  );
}

/**
 * 依存を増やさない最小のハッシュルーター。
 * ブラウザの戻る操作が効き、Vercel側のリライト設定も不要になる。
 */

import { useCallback, useEffect, useSyncExternalStore } from 'react';

function currentPath(): string {
  const hash = window.location.hash.replace(/^#/, '');
  return hash === '' ? '/' : hash;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

export interface Router {
  path: string;
  /** パスの `/` 区切り。例: "/lesson/lesson1" -> ["lesson", "lesson1"] */
  segments: string[];
  navigate: (path: string) => void;
  back: () => void;
}

export function useHashRoute(): Router {
  const path = useSyncExternalStore(subscribe, currentPath, () => '/');

  const navigate = useCallback((next: string) => {
    if (currentPath() === next) return;
    window.location.hash = next;
  }, []);

  const back = useCallback(() => {
    window.history.back();
  }, []);

  useEffect(() => {
    // 画面を切り替えたら先頭から読ませる（操作後に勝手にスクロールはしない）。
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [path]);

  return {
    path,
    segments: path.split('/').filter(Boolean),
    navigate,
    back,
  };
}

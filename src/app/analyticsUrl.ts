import type { BeforeSendEvent } from '@vercel/analytics/react';

/**
 * Vercel Analytics に送るURLを「origin + pathname」だけにする。
 * クエリ文字列（?xxx）とハッシュ（#xxx）は取り除く。アプリ側のURL・ルーティングは変えない。
 *
 * 注意: ここで null を返すと、その閲覧が計測されなくなる。常にイベントを返すこと。
 */
export function stripQueryAndHash<T extends BeforeSendEvent>(event: T): T {
  return { ...event, url: event.url.split(/[?#]/)[0] };
}

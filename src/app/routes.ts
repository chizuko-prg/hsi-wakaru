/**
 * 画面の定義。
 * ルーティングはハッシュで行い、外部依存とサーバ側の設定を増やさない。
 */

export const ROUTES = {
  home: '/',
  lessons: '/lessons',
  lesson: '/lesson',
  courseComplete: '/course-complete',
  instrument: '/instrument',
  freePlay: '/free',
  about: '/about',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * レッスン学習画面のパス。
 * 修了表示は別ルートにせず、この画面の最後の状態として出す。
 * VORわかる？と同じ考え方で、結果を持たないまま修了URLを開かれる問題を作らない。
 */
export function lessonPath(lessonId: string): string {
  return `${ROUTES.lesson}/${lessonId}`;
}

/**
 * 0..359 の角度を「巻き戻さない連続値」に展開する。
 *
 * 359° から 0° へ値が飛んだとき、そのまま回転角に渡すと計器が359度ぶん逆回転する。
 * ±ボタンやレッスンの手順切り替えで起きるので、表示用の回転角はここを通す。
 *
 * 返す値は見た目のためだけのもので、判定には一切使わない。
 */

import { useRef } from 'react';
import { continuousAngle } from '../domain/hsi/angles';

export function useContinuousAngle(deg: number): number {
  const ref = useRef(deg);

  // 同じ値で二度呼ばれても結果が変わらないため、StrictMode の二重実行でもずれない。
  ref.current = continuousAngle(ref.current, deg);

  return ref.current;
}

/** 角度の扱いをここに集める。方位は北=0度、時計回り、0..359 で持つ。 */

export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** 0..359 に丸める。負の値も扱える。 */
export function normalize360(deg: number): number {
  const wrapped = deg % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

/**
 * a から b への最短の符号付き差。-180 < 結果 <= 180。
 * 正なら a は b の右（時計回り側）にある。
 */
export function signedAngleDiff(a: number, b: number): number {
  const diff = normalize360(a - b);
  return diff > 180 ? diff - 360 : diff;
}

/**
 * 方位を3桁で表す。例: 5 -> "005"。
 * 北は航空の慣習にあわせて "360" と表す（"000" とは書かない）。
 */
export function formatBearing(deg: number): string {
  const rounded = Math.round(normalize360(deg));
  return String(rounded === 0 ? 360 : rounded).padStart(3, '0');
}

/**
 * 前回の連続角に、最短経路でつながる次の連続角を返す。
 *
 * 359° から 0° へ値が飛んだとき、そのまま渡すと計器が359度ぶん逆回転してしまう。
 * 表示用の回転角はこの関数で「巻き戻さない連続値」に展開してから使う。
 * 判定には一切使わない、見た目のためだけの値。
 */
export function continuousAngle(previousContinuous: number, nextDeg: number): number {
  return previousContinuous + signedAngleDiff(nextDeg, previousContinuous);
}

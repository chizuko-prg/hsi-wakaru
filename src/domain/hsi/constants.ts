/** 判定に使う定数。学習用の目安であり、実機の認証仕様ではない。 */

/** CDIが振り切れる角度偏差。片側10度は一般的な学習上の目安。 */
export const CDI_FULL_SCALE_DEG = 10;

/** これ以下の横ずれは「中央」として扱う（距離の単位）。 */
export const CDI_CENTER_EPS = 0.01;

/** コースとラジアルがほぼ直角のとき、TO/FROMを判定しない幅。 */
export const TO_FROM_BOUNDARY_EPS_DEG = 1.5;

/** 局の直上とみなす半径。この中では通常の判定を行わない。 */
export const STATION_ZONE_RADIUS = 1.5;

/** レッスンや自由操作で自機を置く既定の距離。 */
export const DEFAULT_DISTANCE = 20;

/** 「ほぼ平行」とみなす角度。インターセプトの傾向判定に使う。 */
export const TREND_PARALLEL_EPS_DEG = 0.5;

/** 既定の対気速度。風の計算にだけ使う。 */
export const DEFAULT_TAS_KT = 100;

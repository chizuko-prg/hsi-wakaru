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

/**
 * 機首（または対地進路）がコースに「合っている」とみなす角度。
 *
 * 学習用のしきい値であって、実機の許容値ではない。
 * 手で飛ばせばこの程度の差は常に出るため、ここを0にすると
 * 「合わせた」と言えなくなる。
 */
export const COURSE_ALIGNED_EPS_DEG = 3;

/**
 * 「ほぼ平行」とみなす角度。コース線までの横距離が変わるかどうかの判定に使う。
 *
 * COURSE_ALIGNED_EPS_DEG と同じ値にしてある。ここを変えると、
 * 「機首はコースに合っています」と出ているのに「コースから離れている」と
 * 同時に表示される、という食い違いが起きる。
 * 無風では対地進路＝機首なので、2つのしきい値は一致していなければならない。
 */
export const TREND_PARALLEL_EPS_DEG = COURSE_ALIGNED_EPS_DEG;

/** 既定の対気速度。風の計算にだけ使う。 */
export const DEFAULT_TAS_KT = 100;

/**
 * 選べる風速。数値を覚えてもらうためではなく、強さの違いを見せるため。
 * レッスンで設定する風速は必ずこの中から選ぶ。
 * 選べない値にすると、風の操作画面でどのボタンも選ばれていない状態になる。
 */
export const WIND_SPEEDS_KT = [0, 10, 20, 30];

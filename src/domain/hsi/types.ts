/**
 * HSI学習アプリの中核となる型定義。
 * 表示層はここに定義した状態からのみ描画する。
 */

export type LessonId = 'lesson1' | 'lesson2' | 'lesson3' | 'lesson4' | 'lesson5';

export type LessonStatus = 'not_started' | 'in_progress' | 'completed';

export type ToFromState = 'TO' | 'FROM' | 'OFF';

export type CdiDirection = 'LEFT' | 'CENTER' | 'RIGHT' | 'OFF';

/**
 * コース線までの横距離が縮んでいるか。
 * CDIの左右からではなく、対地進路とコース線の関係から求める（Lesson 4の方向暗記防止）。
 */
export type InterceptTrend = 'closing' | 'holding' | 'opening' | 'unknown';

/** 航法計算用の世界座標。東が +x、北が +y（画面座標とは別物）。 */
export interface Point {
  x: number;
  y: number;
}

/** レッスン1つ分の進捗。 */
export interface LessonProgress {
  status: LessonStatus;
  /** 次に開いたとき、ここから再開する手順。回答内容は保存しない。 */
  lastStepId?: string;
  completedAt?: string;
}

/** 端末内に保存する学習記録のすべて。個人情報は含めない。 */
export interface AppProgress {
  schemaVersion: 1;
  lessons: Record<LessonId, LessonProgress>;
}

/** 風。fromDeg は風が吹いてくる方向（航空の慣習どおり）。 */
export interface Wind {
  fromDeg: number;
  speedKt: number;
}

/**
 * 画面に描かれるすべての情報の源となる状態。
 * ラジアル・TO/FROM・CDI・Track はここには持たず、必ず deriveHsiState で導出する。
 */
export interface HsiState {
  station: Point;
  aircraft: Point;
  /** 0..359。機首方位。コンパスローズの回転だけに使い、CDI判定には使わない。 */
  headingDeg: number;
  /** 0..359。選択コース（CRS）。headingとは独立。 */
  courseDeg: number;
  /** 風。null は無風。 */
  wind: Wind | null;
  /** 対気速度。風から対地進路を求めるときだけ使う。 */
  tasKt: number;
}

/**
 * 各ステップで見せる部品。不要な部品は隠して情報量を絞る。
 * Lesson 1・2 では planView を出さない。
 */
export interface VisibleElements {
  rose: boolean;
  headingReadout: boolean;
  courseArrow: boolean;
  courseReadout: boolean;
  cdi: boolean;
  toFrom: boolean;
  track: boolean;
  planView: boolean;
  wind: boolean;
}

export const ALL_VISIBLE: VisibleElements = {
  rose: true,
  headingReadout: true,
  courseArrow: true,
  courseReadout: true,
  cdi: true,
  toFrom: true,
  track: true,
  planView: true,
  wind: true,
};

export interface HsiDerivedState {
  /** 局から自機までの距離。 */
  distance: number;
  /** 局から見た自機の方位。局直上では null。 */
  radialDeg: number | null;
  /** 自機から局へ向かう方位。局直上では null。 */
  bearingToStationDeg: number | null;
  toFrom: ToFromState;
  /** TO/FROM切替境界にいるか。 */
  toFromBoundary: boolean;
  cdiDirection: CdiDirection;
  /** -1..1。負=左、正=右、0=中央。 */
  cdiDeflectionNormalized: number;
  /** 選択コース線からの角度偏差(0..90)。局直上では null。 */
  cdiAngularErrorDeg: number | null;
  /**
   * 自機がコース線から右へ何度ずれているか。-90..90。正=自機はコースの右側。
   * CDIの指示は必ずこの反対側になる（右にいるならコースは左）。
   */
  crossTrackAngleDeg: number | null;
  /** 局直上ゾーンにいるか。 */
  isStationZone: boolean;

  // --- 表示の回転量（実機HSIの層構造に対応する） ---
  /** コンパスローズの回転角。= -heading。回転の源はこれひとつだけ。 */
  roseRotationDeg: number;
  /** ローズの内側でコース／CDI層に与える回転角。= course。 */
  courseRotationDeg: number;
  /** 機首から見たコースのずれ。-180..180。正=コースは右。 */
  courseRelativeDeg: number;

  // --- Lesson 4 ---
  /** 機首とコースの差の大きさ(0..180)。インターセプト角。 */
  interceptAngleDeg: number;
  /** コース線までの横距離が縮んでいるか。CDIの左右だけからは求めない。 */
  interceptTrend: InterceptTrend;

  // --- Lesson 5 ---
  /** 対地進路。無風なら heading と同じ。 */
  trackDeg: number;
  /** 偏流角。track - heading。無風なら 0。 */
  driftAngleDeg: number;
  groundSpeedKt: number;
  /** コースを維持するために必要な機首方位。風が強すぎて解けないときは null。 */
  requiredHeadingDeg: number | null;
}

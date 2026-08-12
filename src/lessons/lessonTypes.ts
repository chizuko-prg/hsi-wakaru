/**
 * レッスンをデータとして持つための型。
 * 表示コンポーネント側にレッスン固有の条件分岐を書かないための土台。
 *
 * 手順の正解は、状態から決まるものであれば必ず deriveHsiState の算出値から
 * 組み立てる（テストで一致を担保する）。レッスンファイルに答えを二重管理しない。
 */

import { DEFAULT_DISTANCE } from '../domain/hsi/constants';
import { pointFromRadial } from '../domain/hsi/geometry';
import { normalize360 } from '../domain/hsi/angles';
import type { HsiState, LessonId, Point, VisibleElements, Wind } from '../domain/hsi/types';
import type { HsiPart } from '../components/HsiIndicator/HsiIndicator';

export interface LessonChoice {
  id: string;
  label: string;
}

export type StepCompletionRule = { type: 'tap_next' } | { type: 'answer'; value: string };

/** 手順の中で利用者が動かせるもの。 */
export type InteractControl = 'heading' | 'course' | 'position';

interface LessonStepBase {
  id: string;
  /** 画面上部に出す短い見出し。 */
  title: string;
  /** この手順で見せる部品。ここに無いものは画面に出さない。 */
  visible: VisibleElements;
  /** この手順の機首方位。省略時はレッスンの基準状態のまま。 */
  headingDeg?: number;
  /** この手順の選択コース。省略時はレッスンの基準状態のまま。 */
  courseDeg?: number;
  /** 局から見て自機を置く方向。 */
  aircraftRadialDeg?: number;
  /**
   * コース線から見て、自機を何度ずらした位置に置くか。
   * 正=コースの右側、負=コースの左側、0=コース上。局へ向かう側に置く。
   * 指定した場合は aircraftRadialDeg より優先する。
   */
  courseOffsetDeg?: number;
  /** この手順の風。指定しなければ基準状態のまま。 */
  wind?: Wind | null;
  /** 計器のどこに注目させるか。指定した部品以外を暗くする。 */
  spotlight?: HsiPart;
}

/** 略語とその意味。暗記を求めず、名前から役割を想像できるようにする。 */
export interface LessonTerm {
  abbr: string;
  full: string;
  description: string;
}

/** 説明だけの手順。 */
export interface TeachStep extends LessonStepBase {
  kind: 'teach';
  /** aha は「そういうことか」を狙う手順。カードの見た目を変える。 */
  explanationKind: 'normal' | 'aha';
  lines: string[];
  /** 用語カード。1手順に1つまで。 */
  terms?: LessonTerm[];
  /** 用語カードのあとに添える補足。 */
  note?: string;
  /** 主ボタンの文言。省略時は「次へ」。 */
  nextLabel?: string;
  completionRule: { type: 'tap_next' };
}

/** 自分で動かして、計器の変化を確かめる手順。 */
export interface InteractStep extends LessonStepBase {
  kind: 'interact';
  /**
   * この手順で動かせるもの。並べた順にスライダーを出す。
   * 次へ進むには、ここに挙げたすべてを動かしてもらう。
   */
  controls: InteractControl[];
  /**
   * 数字で見くらべたいもの。開始時の値といまの値を並べて出す。
   * 動かせないものも挙げられる。「変わっていない」ことを見せるのが狙い。
   */
  watch?: InteractControl[];
  lines: string[];
  /** 実際に動かしたあとに出す補足。 */
  changeNote: string;
  /** 動かす前に進めてしまわないよう、最低これだけ動かしてもらう。 */
  requiredChangeDeg?: number;
  nextLabel?: string;
  completionRule: { type: 'tap_next' };
}

/** 選択式の確認問題。 */
export interface QuizStep extends LessonStepBase {
  kind: 'quiz';
  prompt: string;
  choices: LessonChoice[];
  correctChoiceId: string;
  /** 正解後に出す「なぜそうなるか」。 */
  why: string;
  /** 段階的な手がかり。間違えるたびに1つずつ増やして見せる。強い否定表現は使わない。 */
  hints: string[];
  /**
   * 答えたあとにだけ足して見せる部品。visible に重ねる。
   *
   * 上空図はここに置く。問題を出している最中に見せてしまうと、
   * 計器を読まずに図から答えが分かってしまうため。
   * 答え合わせと理解の補助として、解いたあとに出す。
   */
  revealVisible?: Partial<VisibleElements>;
  /**
   * 完了画面の正解数に数えるか。
   * 学習の途中で挟む問いかけは数えず、確認問題だけを数える。
   */
  scored: boolean;
  completionRule: { type: 'answer'; value: string };
}

/** まとめ。 */
export interface SummaryStep extends LessonStepBase {
  kind: 'summary';
  lines: string[];
  nextLabel?: string;
  completionRule: { type: 'tap_next' };
}

export type LessonStep = TeachStep | InteractStep | QuizStep | SummaryStep;

/**
 * 完了画面の文言。
 * 「初回正解数」と「最後まで確認できたこと」を分けて伝え、
 * 合格・不合格を強く打ち出さない。
 */
export interface LessonCompletionCopy {
  title: string;
  /** 「学んだこと」に並べる要点。 */
  learned: string[];
  /** {count} を問題数へ置き換えて使う。 */
  completedLineTemplate: string;
  /** 初回正解が目安以上のときの一言。 */
  messageWhenStrong: string;
  /** 目安未満のときの一言。失敗として扱わない。 */
  messageWhenMore: string;
  nextPreview: string;
  /** 次のレッスンが未実装のあいだは false。 */
  nextAvailable: boolean;
}

export interface LessonDefinition {
  id: LessonId;
  /** 画面上部のmonoラベル。例: "LESSON 1" */
  monoLabel: string;
  title: string;
  subtitle: string;
  /** 一覧に出す所要時間の目安。 */
  durationText: string;
  /** このレッスンの基準状態。手順ごとの指定はここへ重ねる。 */
  baseState: HsiState;
  steps: LessonStep[];
  /** 初回正解数の目安。下回っても行き止まりにはしない。 */
  passingScore: number;
  /** 修了画面から進める次のレッスン。未実装のあいだは省略する。 */
  nextLessonId?: LessonId;
  completion: LessonCompletionCopy;
}

export function isQuizStep(step: LessonStep): step is QuizStep {
  return step.kind === 'quiz';
}

/** 採点対象の確認問題。 */
export function scoredQuizSteps(lesson: LessonDefinition): QuizStep[] {
  return lesson.steps.filter(isQuizStep).filter((step) => step.scored);
}

/** 完了画面に出す問題数。 */
export function countScoredQuizSteps(lesson: LessonDefinition): number {
  return scoredQuizSteps(lesson).length;
}

/**
 * 選択コースから courseOffsetDeg だけ横へずれた位置。
 * 局へ向かう側（コースの反対方位）に置くので、そのまま進めば局へ近づく。
 */
export function aircraftFromCourseOffset(
  station: Point,
  courseDeg: number,
  courseOffsetDeg: number,
): Point {
  return pointFromRadial(station, normalize360(courseDeg + 180 - courseOffsetDeg), DEFAULT_DISTANCE);
}

/**
 * 手順の初期状態を組み立てる。位置の計算はここだけに置く。
 * base には各レッスンの基準状態を渡す。
 */
export function buildStepState(step: LessonStep, base: HsiState): HsiState {
  const courseDeg = step.courseDeg ?? base.courseDeg;

  const aircraft =
    step.courseOffsetDeg !== undefined
      ? aircraftFromCourseOffset(base.station, courseDeg, step.courseOffsetDeg)
      : step.aircraftRadialDeg === undefined
        ? base.aircraft
        : pointFromRadial(base.station, step.aircraftRadialDeg, DEFAULT_DISTANCE);

  return {
    ...base,
    aircraft,
    courseDeg,
    headingDeg: step.headingDeg ?? base.headingDeg,
    wind: step.wind === undefined ? base.wind : step.wind,
  };
}

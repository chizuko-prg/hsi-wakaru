/**
 * 確認問題の記録。
 *
 * 数えるのは「最初の回答で正解した数」だけ。
 * 間違えた回数そのものは表に出さず、行き止まりも作らない。
 * この記録は端末に保存しない（画面を離れたら消える）。
 */

import type { LessonDefinition } from './lessonTypes';
import { scoredQuizSteps } from './lessonTypes';

export interface QuizAttempt {
  /** 選んだ選択肢。まだ答えていなければ null。 */
  selectedChoiceId: string | null;
  /** 正解までにたどり着いたか。 */
  solved: boolean;
  /** 最初の回答で正解したか。 */
  correctOnFirstTry: boolean;
  /** 間違えた回数。段階ヒントを何段まで出すかに使う。 */
  wrongCount: number;
}

export type QuizAttempts = Record<string, QuizAttempt>;

export const EMPTY_ATTEMPT: QuizAttempt = {
  selectedChoiceId: null,
  solved: false,
  correctOnFirstTry: false,
  wrongCount: 0,
};

export function attemptOf(attempts: QuizAttempts, stepId: string): QuizAttempt {
  return attempts[stepId] ?? EMPTY_ATTEMPT;
}

/** 1回の回答を記録した、新しい記録を返す。 */
export function withAnswer(
  attempts: QuizAttempts,
  stepId: string,
  choiceId: string,
  correct: boolean,
): QuizAttempts {
  const previous = attemptOf(attempts, stepId);

  // すでに正解している問題は、あとから選び直しても記録を変えない。
  if (previous.solved) return attempts;

  const isFirstAnswer = previous.selectedChoiceId === null && previous.wrongCount === 0;

  return {
    ...attempts,
    [stepId]: {
      selectedChoiceId: choiceId,
      solved: correct,
      correctOnFirstTry: correct && isFirstAnswer,
      wrongCount: correct ? previous.wrongCount : previous.wrongCount + 1,
    },
  };
}

/** 完了画面に出す「最初の回答で正解した数」。 */
export function countCorrectOnFirstTry(lesson: LessonDefinition, attempts: QuizAttempts): number {
  return scoredQuizSteps(lesson).filter((step) => attemptOf(attempts, step.id).correctOnFirstTry)
    .length;
}

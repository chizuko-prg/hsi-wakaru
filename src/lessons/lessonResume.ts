/**
 * 再開位置の決め方。
 *
 * 保存するのは手順のIDだけで、回答内容は保存しない。
 * 手順を入れ替えても壊れないよう、見つからないIDは先頭に戻す。
 */

import type { LessonProgress } from '../domain/hsi/types';
import type { LessonDefinition } from './lessonTypes';

export function resolveStartStepIndex(
  lesson: LessonDefinition,
  progress: LessonProgress | undefined,
): number {
  if (!progress || progress.status !== 'in_progress' || !progress.lastStepId) return 0;

  const index = lesson.steps.findIndex((step) => step.id === progress.lastStepId);
  return index < 0 ? 0 : index;
}

/**
 * 学習記録の読み書きをまとめる。
 * 画面をまたぐ共有状態は持たず、各画面が開いたときに端末から読み直す。
 */

import { useCallback, useState } from 'react';
import type { AppProgress, LessonId, LessonProgress } from '../domain/hsi/types';
import {
  clearProgress,
  loadProgress,
  saveProgress,
  withLessonProgress,
} from '../storage/progressStorage';

export interface ProgressController {
  progress: AppProgress;
  updateLesson: (lessonId: LessonId, update: Partial<LessonProgress>) => void;
  /** 学習記録だけを消す。他の保存内容には触れない。 */
  resetProgress: () => void;
}

export function useProgress(): ProgressController {
  const [progress, setProgress] = useState<AppProgress>(() => loadProgress());

  const updateLesson = useCallback((lessonId: LessonId, update: Partial<LessonProgress>) => {
    setProgress((prev) => {
      const next = withLessonProgress(prev, lessonId, update);
      saveProgress(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setProgress(clearProgress());
  }, []);

  return { progress, updateLesson, resetProgress: reset };
}

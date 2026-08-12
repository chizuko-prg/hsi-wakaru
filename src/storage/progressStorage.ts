/**
 * 学習記録の保存。
 *
 * 保存するのは次の3つだけ。
 * - 各レッスンの状態（未開始 / 進行中 / 完了）
 * - 再開できる手順の lastStepId
 * - 完了日時
 *
 * 個々の回答内容、初回正解数、スライダーの位置は保存しない。
 * 読み込みに失敗しても、決してアプリを止めない。
 */

import type { AppProgress, LessonId, LessonProgress, LessonStatus } from '../domain/hsi/types';

export const PROGRESS_KEY = 'hsiWakaru.progress.v1';

const SCHEMA_VERSION = 1;

export const LESSON_IDS: LessonId[] = ['lesson1', 'lesson2', 'lesson3', 'lesson4', 'lesson5'];

const STATUSES: LessonStatus[] = ['not_started', 'in_progress', 'completed'];

export function defaultProgress(): AppProgress {
  const lessons = {} as AppProgress['lessons'];
  for (const id of LESSON_IDS) {
    lessons[id] = { status: 'not_started' };
  }
  return { schemaVersion: SCHEMA_VERSION, lessons };
}

/** localStorage が使えない環境（無効化・プライベートモード等）でも落ちないようにする。 */
function defaultStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function sanitizeLesson(value: unknown): LessonProgress {
  if (typeof value !== 'object' || value === null) return { status: 'not_started' };

  const raw = value as Record<string, unknown>;
  const status = STATUSES.includes(raw.status as LessonStatus)
    ? (raw.status as LessonStatus)
    : 'not_started';

  const lesson: LessonProgress = { status };

  if (typeof raw.lastStepId === 'string' && raw.lastStepId.length > 0) {
    lesson.lastStepId = raw.lastStepId;
  }
  if (typeof raw.completedAt === 'string' && raw.completedAt.length > 0) {
    lesson.completedAt = raw.completedAt;
  }

  return lesson;
}

/**
 * 読み込んだ値を、必ず使える形へ整える。
 * 未知の schemaVersion や壊れた形は、安全に初期値へ戻す。
 */
export function sanitizeProgress(value: unknown): AppProgress {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return defaultProgress();
  }

  const raw = value as Record<string, unknown>;
  if (raw.schemaVersion !== SCHEMA_VERSION) return defaultProgress();

  const lessonsRaw =
    typeof raw.lessons === 'object' && raw.lessons !== null && !Array.isArray(raw.lessons)
      ? (raw.lessons as Record<string, unknown>)
      : {};

  const lessons = {} as AppProgress['lessons'];
  for (const id of LESSON_IDS) {
    lessons[id] = sanitizeLesson(lessonsRaw[id]);
  }

  return { schemaVersion: SCHEMA_VERSION, lessons };
}

export function loadProgress(storage: Storage | null = defaultStorage()): AppProgress {
  if (!storage) return defaultProgress();

  try {
    const raw = storage.getItem(PROGRESS_KEY);
    if (raw === null) return defaultProgress();
    return sanitizeProgress(JSON.parse(raw));
  } catch {
    // JSON解析に失敗しても、アプリを止めずに初期値で続ける。
    return defaultProgress();
  }
}

export function saveProgress(
  progress: AppProgress,
  storage: Storage | null = defaultStorage(),
): void {
  if (!storage) return;

  try {
    storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // 保存できなくても学習は続けられるようにする。
  }
}

export function clearProgress(storage: Storage | null = defaultStorage()): AppProgress {
  if (storage) {
    try {
      storage.removeItem(PROGRESS_KEY);
    } catch {
      // 消せなくても初期値を返す。
    }
  }
  return defaultProgress();
}

/** レッスンの進捗を1つ更新した、新しい記録を返す。 */
export function withLessonProgress(
  progress: AppProgress,
  lessonId: LessonId,
  update: Partial<LessonProgress>,
): AppProgress {
  return {
    ...progress,
    lessons: {
      ...progress.lessons,
      [lessonId]: { ...progress.lessons[lessonId], ...update },
    },
  };
}

/** 完了したレッスンの数。 */
export function countCompletedLessons(progress: AppProgress): number {
  return LESSON_IDS.filter((id) => progress.lessons[id].status === 'completed').length;
}

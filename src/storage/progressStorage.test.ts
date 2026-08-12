import { describe, expect, it } from 'vitest';
import {
  LESSON_IDS,
  PROGRESS_KEY,
  clearProgress,
  countCompletedLessons,
  defaultProgress,
  loadProgress,
  sanitizeProgress,
  saveProgress,
  withLessonProgress,
} from './progressStorage';

/** localStorage の代わり。テストの中だけで使う。 */
function memoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, value),
  };
}

describe('defaultProgress', () => {
  it('5レッスンぶんの未開始状態を返す', () => {
    const progress = defaultProgress();
    expect(Object.keys(progress.lessons).sort()).toEqual([...LESSON_IDS].sort());
    for (const id of LESSON_IDS) {
      expect(progress.lessons[id].status).toBe('not_started');
    }
  });
});

describe('sanitizeProgress', () => {
  it('壊れた値は初期値へ安全に戻す', () => {
    expect(sanitizeProgress(null)).toEqual(defaultProgress());
    expect(sanitizeProgress('文字列')).toEqual(defaultProgress());
    expect(sanitizeProgress([])).toEqual(defaultProgress());
    expect(sanitizeProgress({})).toEqual(defaultProgress());
  });

  it('知らない schemaVersion は初期値へ戻す', () => {
    expect(sanitizeProgress({ schemaVersion: 99, lessons: {} })).toEqual(defaultProgress());
  });

  it('知らない status は未開始として扱う', () => {
    const result = sanitizeProgress({
      schemaVersion: 1,
      lessons: { lesson1: { status: 'ぐちゃぐちゃ' } },
    });
    expect(result.lessons.lesson1.status).toBe('not_started');
  });

  it('正しい記録はそのまま残す', () => {
    const result = sanitizeProgress({
      schemaVersion: 1,
      lessons: { lesson1: { status: 'in_progress', lastStepId: 'turn' } },
    });
    expect(result.lessons.lesson1).toEqual({ status: 'in_progress', lastStepId: 'turn' });
    expect(result.lessons.lesson2.status).toBe('not_started');
  });

  it('レッスンが増えても、足りない分は未開始で埋める', () => {
    const result = sanitizeProgress({ schemaVersion: 1, lessons: { lesson1: { status: 'completed' } } });
    for (const id of LESSON_IDS) {
      expect(result.lessons[id]).toBeDefined();
    }
  });
});

describe('保存と読み込み', () => {
  it('保存した内容を読み戻せる', () => {
    const storage = memoryStorage();
    const progress = withLessonProgress(defaultProgress(), 'lesson1', {
      status: 'completed',
      completedAt: '2026-08-12T00:00:00.000Z',
    });

    saveProgress(progress, storage);
    expect(loadProgress(storage)).toEqual(progress);
  });

  it('保存先が使えなくてもアプリを止めない', () => {
    expect(loadProgress(null)).toEqual(defaultProgress());
    expect(() => saveProgress(defaultProgress(), null)).not.toThrow();
    expect(clearProgress(null)).toEqual(defaultProgress());
  });

  it('壊れた JSON が入っていても初期値で続ける', () => {
    const storage = memoryStorage({ [PROGRESS_KEY]: '{壊れている' });
    expect(loadProgress(storage)).toEqual(defaultProgress());
  });

  it('リセットは学習記録のキーだけを消す', () => {
    const storage = memoryStorage({ [PROGRESS_KEY]: '{}', 'other.key': 'のこす' });
    clearProgress(storage);
    expect(storage.getItem(PROGRESS_KEY)).toBeNull();
    expect(storage.getItem('other.key')).toBe('のこす');
  });
});

describe('countCompletedLessons', () => {
  it('完了したレッスンだけを数える', () => {
    let progress = defaultProgress();
    expect(countCompletedLessons(progress)).toBe(0);

    progress = withLessonProgress(progress, 'lesson1', { status: 'completed' });
    progress = withLessonProgress(progress, 'lesson2', { status: 'in_progress' });
    expect(countCompletedLessons(progress)).toBe(1);
  });
});

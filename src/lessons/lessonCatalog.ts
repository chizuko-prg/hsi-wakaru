/**
 * レッスンの一覧。
 * 未実装のレッスンも「これから何を学ぶか」を見せるために並べる。
 * 行き止まりにしないため、未実装のものは開けないことが分かる形で出す。
 */

import type { LessonId } from '../domain/hsi/types';
import { LESSON1 } from './lesson1';
import type { LessonDefinition } from './lessonTypes';

export interface LessonCatalogEntry {
  id: LessonId;
  monoLabel: string;
  title: string;
  subtitle: string;
  durationText: string;
  /** 実装済みのレッスン定義。未実装のあいだは undefined。 */
  definition?: LessonDefinition;
}

export const LESSON_CATALOG: LessonCatalogEntry[] = [
  {
    id: 'lesson1',
    monoLabel: LESSON1.monoLabel,
    title: LESSON1.title,
    subtitle: LESSON1.subtitle,
    durationText: LESSON1.durationText,
    definition: LESSON1,
  },
  {
    id: 'lesson2',
    monoLabel: 'LESSON 2',
    title: 'HeadingとCourse',
    subtitle: '2つは別ものだと確かめる',
    durationText: '約6分',
  },
  {
    id: 'lesson3',
    monoLabel: 'LESSON 3',
    title: 'CDIをHSIで読む',
    subtitle: 'コースは自分の左右どちらか',
    durationText: '約7分',
  },
  {
    id: 'lesson4',
    monoLabel: 'LESSON 4',
    title: 'Intercept',
    subtitle: 'コースを捕まえる',
    durationText: '約7分',
  },
  {
    id: 'lesson5',
    monoLabel: 'LESSON 5',
    title: 'Tracking',
    subtitle: '風があるとどうなるか',
    durationText: '約6分',
  },
];

export function findLesson(id: string): LessonDefinition | undefined {
  return LESSON_CATALOG.find((entry) => entry.id === id)?.definition;
}

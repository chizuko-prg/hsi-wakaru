/**
 * レッスンの一覧。
 * 未実装のレッスンも「これから何を学ぶか」を見せるために並べる。
 * 行き止まりにしないため、未実装のものは開けないことが分かる形で出す。
 */

import type { LessonId } from '../domain/hsi/types';
import { LESSON1 } from './lesson1';
import { LESSON2 } from './lesson2';
import { LESSON3 } from './lesson3';
import { LESSON4 } from './lesson4';
import { LESSON5 } from './lesson5';
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
    monoLabel: LESSON2.monoLabel,
    title: LESSON2.title,
    subtitle: LESSON2.subtitle,
    durationText: LESSON2.durationText,
    definition: LESSON2,
  },
  {
    id: 'lesson3',
    monoLabel: LESSON3.monoLabel,
    title: LESSON3.title,
    subtitle: LESSON3.subtitle,
    durationText: LESSON3.durationText,
    definition: LESSON3,
  },
  {
    id: 'lesson4',
    monoLabel: LESSON4.monoLabel,
    title: LESSON4.title,
    subtitle: LESSON4.subtitle,
    durationText: LESSON4.durationText,
    definition: LESSON4,
  },
  {
    id: 'lesson5',
    monoLabel: LESSON5.monoLabel,
    title: LESSON5.title,
    subtitle: LESSON5.subtitle,
    durationText: LESSON5.durationText,
    definition: LESSON5,
  },
];

export function findLesson(id: string): LessonDefinition | undefined {
  return LESSON_CATALOG.find((entry) => entry.id === id)?.definition;
}

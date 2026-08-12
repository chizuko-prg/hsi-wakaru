/**
 * Lesson 3「CDIをHSIで読む」
 *
 * CDIをはじめて教えるレッスンではない（VORわかる？で扱っている）。
 * ここでのねらいは「VORで見たCDIが、HSIでは機首の情報と一緒に出る」という接続。
 * TO/FROM は復習程度にとどめる。
 *
 * 上空図の扱いに気をつける:
 * - 説明とまとめの手順では出す（理解の補助）
 * - 確認問題では出さない。答えたあとにだけ出す（答え合わせ）
 * 問題を出している最中に上空図があると、計器を読まずに図を見て答えられてしまう。
 * この決まりは lesson3.test.ts で固定している。
 */

import { DEFAULT_DISTANCE, DEFAULT_TAS_KT } from '../domain/hsi/constants';
import { pointFromRadial } from '../domain/hsi/geometry';
import type { HsiState, VisibleElements } from '../domain/hsi/types';
import type { LessonDefinition } from './lessonTypes';

const STATION = { x: 0, y: 0 };

/** 説明の手順。上空図を出して、計器の見え方と対応づける。 */
const WITH_PLAN: VisibleElements = {
  rose: true,
  headingReadout: true,
  courseArrow: true,
  courseReadout: true,
  cdi: true,
  toFrom: true,
  track: false,
  planView: true,
  wind: false,
};

/** 確認問題の手順。計器だけを見て答えてもらう。 */
const INSTRUMENT_ONLY: VisibleElements = {
  ...WITH_PLAN,
  planView: false,
};

/** 答えたあとに上空図を足して答え合わせにする。 */
const REVEAL_PLAN = { planView: true } as const;

const BASE_STATE: HsiState = {
  station: STATION,
  aircraft: pointFromRadial(STATION, 180, DEFAULT_DISTANCE),
  headingDeg: 0,
  courseDeg: 0,
  wind: null,
  tasKt: DEFAULT_TAS_KT,
};

export const LESSON3: LessonDefinition = {
  id: 'lesson3',
  monoLabel: 'LESSON 3',
  title: 'CDIをHSIで読む',
  subtitle: 'コースは自分の左右どちらか',
  durationText: '約7分',
  baseState: BASE_STATE,
  passingScore: 2,
  steps: [
    {
      kind: 'teach',
      id: 'bridge',
      title: '真ん中の棒がCDIです',
      explanationKind: 'normal',
      visible: WITH_PLAN,
      headingDeg: 0,
      courseDeg: 0,
      courseOffsetDeg: 5,
      lines: [
        '真ん中にある紫の棒が CDI です。選んだコース線が、自分から見て左右どちらにあるかを示します。',
        'いま棒は左に寄っています。つまり、コース線は自分の左側にあります。',
        '下の図は、同じ状態を真上から見たものです。自機はコース線の右側にいます。だから、コースは自分から見て左にあります。',
      ],
      note: '上空図では自機が機首の向きに回りますが、計器の中では自機は上を向いたままです。同じ状態を別の見方で描いています。',
      nextLabel: '動かして確かめる',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'interact',
      id: 'move-position',
      title: '位置を動かしてみましょう',
      controls: ['position'],
      visible: WITH_PLAN,
      headingDeg: 0,
      courseDeg: 0,
      aircraftRadialDeg: 180,
      requiredChangeDeg: 6,
      lines: [
        'いまはコース線のちょうど上にいるので、CDIは中央です。',
        'つまみで自分の位置を動かしてください。上空図の自機と、計器のCDIが一緒に動きます。',
      ],
      changeNote:
        'コース線から離れるほど、CDIは大きく振れます。ドット1つで5度ぶんのずれです。棒が振れている側に、コース線があります。',
      nextLabel: '読んでみる',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'quiz',
      id: 'which-side',
      title: 'コースはどちら側',
      visible: INSTRUMENT_ONLY,
      revealVisible: REVEAL_PLAN,
      headingDeg: 0,
      courseDeg: 0,
      courseOffsetDeg: -7,
      scored: true,
      prompt: 'この表示のとき、選んだコース線は自分から見て左右どちらにありますか。',
      choices: [
        { id: 'LEFT', label: '左にある' },
        { id: 'RIGHT', label: '右にある' },
        { id: 'CENTER', label: 'ちょうどコース線の上にいる' },
      ],
      correctChoiceId: 'RIGHT',
      why: 'CDIの棒は右に振れています。棒が寄っている側に、コース線があります。下の図でも、自機はコース線の左側にいることが分かります。',
      hints: [
        '真ん中の紫の棒が、どちら側に寄っているかを見てください。',
        '棒はコース線のある方へ寄ります。棒が右なら、コースは右にあります。',
      ],
      completionRule: { type: 'answer', value: 'RIGHT' },
    },
    {
      kind: 'quiz',
      id: 'how-far',
      title: 'どれくらい離れている',
      visible: INSTRUMENT_ONLY,
      revealVisible: REVEAL_PLAN,
      headingDeg: 40,
      courseDeg: 0,
      courseOffsetDeg: 5,
      scored: true,
      prompt: 'この表示では、コース線からどれくらい離れていますか。',
      choices: [
        { id: 'dots-0', label: 'ずれていない（中央）' },
        { id: 'dots-1', label: 'ドット1つぶん' },
        { id: 'dots-2', label: 'ドット2つぶん（振り切れ）' },
      ],
      correctChoiceId: 'dots-1',
      why: '棒は中央から数えて1つ目のドットのところにあります。ドット1つで5度ぶんです。機首を 040 に変えてありますが、CDIの振れ方は変わりません。',
      hints: [
        '棒が、中央から数えて何個目のドットに来ているかを見てください。',
        '機首の向きは、CDIの振れ方には関係しません。棒の位置だけを見ます。',
      ],
      completionRule: { type: 'answer', value: 'dots-1' },
    },
    {
      kind: 'teach',
      id: 'tofrom-recap',
      title: 'TO / FROM のおさらい',
      explanationKind: 'normal',
      visible: WITH_PLAN,
      headingDeg: 0,
      courseDeg: 0,
      courseOffsetDeg: 5,
      lines: [
        'コース矢印のそばにある小さな三角が TO / FROM です。',
        '選んだコースをそのまま進んだとき、局へ近づく側なら上向き（TO）、離れる側なら下向き（FROM）になります。',
        'これも機首の向きでは決まりません。決めるのは「自分の位置」と「選んだコース」だけです。',
      ],
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'quiz',
      id: 'to-or-from',
      title: '近づく？ 離れる？',
      visible: INSTRUMENT_ONLY,
      revealVisible: REVEAL_PLAN,
      headingDeg: 90,
      courseDeg: 180,
      aircraftRadialDeg: 184,
      scored: true,
      prompt: 'この表示のまま選んだコースを進むと、局に近づきますか、離れますか。',
      choices: [
        { id: 'TO', label: '近づく' },
        { id: 'FROM', label: '離れる' },
        { id: 'depends', label: '機首の向き次第で決まる' },
      ],
      correctChoiceId: 'FROM',
      why: '三角は下向き（FROM）です。局から離れていく側のコースを選んでいます。機首がどちらを向いていても、この判断は変わりません。',
      hints: [
        'コース矢印のそばにある小さな三角が、上下どちらを向いているか見てください。',
        '下向きの三角は FROM。局から離れる側という意味です。',
      ],
      completionRule: { type: 'answer', value: 'FROM' },
    },
    {
      kind: 'summary',
      id: 'summary',
      title: 'ここまでのまとめ',
      visible: WITH_PLAN,
      headingDeg: 40,
      courseDeg: 0,
      courseOffsetDeg: 5,
      lines: [
        'CDIの棒が寄っている側に、選んだコース線がある。',
        'ドット1つで5度ぶんのずれ。中央ならコース線の上にいる。',
        'CDIもTO/FROMも、機首の向きでは変わらない。',
      ],
      nextLabel: 'レッスンを終える',
      completionRule: { type: 'tap_next' },
    },
  ],
  completion: {
    title: 'Lesson 3 修了',
    learned: [
      'CDIは、選んだコース線が自分の左右どちらにあるかを示すこと',
      'ドット1つで5度ぶんのずれであること',
      'CDIとTO/FROMは、機首の向きでは変わらないこと',
    ],
    completedLineTemplate: '確認問題 {count} 問を最後まで確認できました。',
    messageWhenStrong:
      '計器だけを見て、自分とコースの位置関係が読めています。次はそこへ近づく話に進みます。',
    messageWhenMore:
      '上空図つきの手順に戻って、図と計器を見くらべてみてください。対応が見えてくると読みやすくなります。',
    nextPreview:
      'Lesson 4 では、コースへ近づいて捕まえる（Intercept）を扱います。CDIが中央に来たら終わり、ではありません。',
    nextAvailable: false,
  },
};

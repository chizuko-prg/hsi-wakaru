/**
 * Lesson 1「HSIって何？」
 *
 * ねらいは1つだけ。
 * 「自分のしるしは動かない。回るのはまわりの目盛り」を体で分かること。
 *
 * ここでは部品の名前を並べない。覚える言葉は Heading と Course の2つだけ。
 * CDI・TO/FROM・上空図は一切出さない（情報量を絞るため）。
 * Course は最後に顔を見せるだけで、違いの学習は Lesson 2 で行う。
 */

import { DEFAULT_DISTANCE, DEFAULT_TAS_KT } from '../domain/hsi/constants';
import { pointFromRadial } from '../domain/hsi/geometry';
import type { HsiState, VisibleElements } from '../domain/hsi/types';
import type { LessonDefinition } from './lessonTypes';

const STATION = { x: 0, y: 0 };

/** 機首の話だけをする手順。コースもCDIも出さない。 */
const HEADING_ONLY: VisibleElements = {
  rose: true,
  headingReadout: true,
  courseArrow: false,
  courseReadout: false,
  cdi: false,
  toFrom: false,
  track: false,
  planView: false,
  wind: false,
};

/**
 * 目盛りから読み取ってもらう手順では、上の数値窓を出さない。
 * 出したままだと答えがそのまま書いてあることになり、読む練習にならない。
 */
const ROSE_WITHOUT_READOUT: VisibleElements = {
  ...HEADING_ONLY,
  headingReadout: false,
};

/** 最後にコースだけを足す。CDIとTO/FROMはまだ出さない。 */
const WITH_COURSE: VisibleElements = {
  ...HEADING_ONLY,
  courseArrow: true,
  courseReadout: true,
};

const BASE_STATE: HsiState = {
  station: STATION,
  aircraft: pointFromRadial(STATION, 180, DEFAULT_DISTANCE),
  headingDeg: 0,
  courseDeg: 0,
  wind: null,
  tasKt: DEFAULT_TAS_KT,
};

export const LESSON1: LessonDefinition = {
  id: 'lesson1',
  monoLabel: 'LESSON 1',
  title: 'HSIって何？',
  subtitle: 'まん中の自分は動かない',
  durationText: '約5分',
  baseState: BASE_STATE,
  passingScore: 2,
  steps: [
    {
      kind: 'teach',
      id: 'center',
      title: 'まん中にいるのは、あなた',
      explanationKind: 'normal',
      visible: HEADING_ONLY,
      headingDeg: 0,
      spotlight: 'aircraft',
      lines: [
        'HSIは、コックピットで「いま自分はどちらを向いているか」を見るための計器です。',
        'まん中にある飛行機のしるしが、あなたの飛行機です。これは動きません。いつも上を向いたままです。',
        'だから、画面の上がいつでも「自分の前」になります。',
      ],
      nextLabel: '動かしてみる',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'interact',
      id: 'turn',
      title: '向きを変えてみましょう',
      controls: ['heading'],
      visible: HEADING_ONLY,
      headingDeg: 0,
      requiredChangeDeg: 20,
      lines: [
        '下のつまみを動かして、機首の向きを変えてみてください。',
        '何が動いて、何が動かないか。そこだけ見てください。',
      ],
      changeNote:
        '飛行機のしるしは動かず、まわりの目盛りが回りました。実際の飛行機でも、自分が右を向けば外の景色は左へ流れます。目盛りはその見え方に合わせて回ります。',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'teach',
      id: 'heading-name',
      title: '上の三角が指している数字',
      explanationKind: 'aha',
      visible: HEADING_ONLY,
      headingDeg: 60,
      lines: [
        'いちばん上にある三角は、目盛りと違って動きません。',
        'この三角が指している数字が、いま向いている方向です。',
      ],
      terms: [
        {
          abbr: 'Heading',
          full: '機首方位',
          description: '飛行機の鼻が向いている方向。上の三角が指している数字を読みます。',
        },
      ],
      note: 'いま覚える言葉は、これだけで十分です。',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'quiz',
      id: 'read-heading',
      title: '読んでみましょう',
      visible: ROSE_WITHOUT_READOUT,
      headingDeg: 120,
      scored: true,
      prompt: 'いま、この飛行機はどちらを向いていますか。',
      choices: [
        { id: '060', label: '060°' },
        { id: '090', label: '090°' },
        { id: '120', label: '120°' },
        { id: '150', label: '150°' },
      ],
      correctChoiceId: '120',
      why: 'いちばん上の三角が指している目盛りを読みます。三角は 120 のところに来ています。',
      hints: [
        'いちばん上にある、動かない三角に注目してください。',
        'その三角が指している目盛りの数字が、いま向いている方向です。',
      ],
      completionRule: { type: 'answer', value: '120' },
    },
    {
      kind: 'quiz',
      id: 'what-moves',
      title: '動くのはどちら',
      visible: HEADING_ONLY,
      headingDeg: 30,
      scored: true,
      prompt: '機首の向きを変えたとき、画面で動くのはどれですか。',
      choices: [
        { id: 'aircraft', label: 'まん中の飛行機のしるし' },
        { id: 'rose', label: 'まわりの目盛り' },
        { id: 'both', label: '両方とも動く' },
      ],
      correctChoiceId: 'rose',
      why: '動くのは目盛りのほうです。飛行機のしるしはいつも上を向いたままなので、「画面の上＝自分の前」として読み取れます。',
      hints: [
        'さっき自分でつまみを動かしたときを思い出してください。',
        'まん中の飛行機は、動かずに上を向いたままでした。',
      ],
      completionRule: { type: 'answer', value: 'rose' },
    },
    {
      kind: 'teach',
      id: 'course-intro',
      title: 'もうひとつ、選べるものがあります',
      explanationKind: 'aha',
      visible: WITH_COURSE,
      headingDeg: 30,
      courseDeg: 90,
      // ここでは注目表示を使わない。
      // 矢印だけを明るくすると、比べる相手（上の三角と目盛り）が暗くなり、
      // 「2つが別の方向を指している」ことが見えなくなるため。
      lines: [
        'HSIには、いま向いている方向とは別に、「進みたい方向」を自分で選ぶしくみがあります。',
        '青い矢印がそれです。この矢印はいま 090 を指していますが、飛行機は 030 を向いたままです。',
      ],
      terms: [
        {
          abbr: 'Course',
          full: '選択コース',
          description: '自分で選ぶ、進みたい方向。いま向いている方向とは別に決めます。',
        },
      ],
      note: '2つの違いは次のレッスンでじっくり確かめます。ここでは「別ものが2つある」と分かれば十分です。',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'summary',
      id: 'summary',
      title: 'ここまでのまとめ',
      visible: WITH_COURSE,
      headingDeg: 30,
      courseDeg: 90,
      lines: [
        'まん中の飛行機は動かない。回るのはまわりの目盛り。',
        'いちばん上の三角が指している数字が Heading（いま向いている方向）。',
        'Heading とは別に、進みたい方向として Course を選べる。',
      ],
      nextLabel: 'レッスンを終える',
      completionRule: { type: 'tap_next' },
    },
  ],
  completion: {
    title: 'Lesson 1 修了',
    learned: [
      '自分のしるしは動かず、まわりの目盛りが回ること',
      'Heading は、上の三角が指している「いま向いている方向」',
      'Heading とは別に Course を選べること',
    ],
    completedLineTemplate: '確認問題 {count} 問を最後まで確認できました。',
    messageWhenStrong:
      'HSIの入口はつかめています。次は Heading と Course が本当に別ものであることを確かめましょう。',
    messageWhenMore:
      '最後まで進めたことが大事です。気になったところは、戻ってもう一度動かしてみてください。',
    nextPreview:
      'Lesson 2 では、Heading と Course を別々に動かして、片方を変えてももう片方が変わらないことを自分の手で確かめます。',
    nextAvailable: false,
  },
};

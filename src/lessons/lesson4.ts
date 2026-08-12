/**
 * Lesson 4「Intercept（コースを捕まえる）」
 *
 * このレッスンは、方向の暗記教材にしてはならない。守っている決まりは4つ。
 *
 * 1. 全手順で上空図と計器を同時に出す。片方だけを見て答えられる手順を作らない。
 * 2. 同じCDI表示のまま機首だけを変えた3つを並べ、起きていることが変わるのを見せる。
 * 3. 確認問題は「CDIはどちらか」ではなく「いま近づいているか」を問う。
 *    この答えは CDI の左右だけからは決まらない。
 * 4. 「CDIが中央＝終わり」で終わらせない。捕まえたあとコースへ機首を合わせ、
 *    Lesson 5 の Tracking へつなげる。
 *
 * これらは lesson4.test.ts で固定している。
 */

import {
  COURSE_ALIGNED_EPS_DEG,
  DEFAULT_DISTANCE,
  DEFAULT_TAS_KT,
} from '../domain/hsi/constants';
import { pointFromRadial } from '../domain/hsi/geometry';
import type { HsiState, VisibleElements } from '../domain/hsi/types';
import type { LessonDefinition } from './lessonTypes';

const STATION = { x: 0, y: 0 };

/** このレッスンは常にこの形。図と計器をいつも一緒に見せる。 */
const BOTH_VIEWS: VisibleElements = {
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

/** コースの右側にいる位置。CDIは左に振れる。 */
const RIGHT_OF_COURSE = 6;

const BASE_STATE: HsiState = {
  station: STATION,
  aircraft: pointFromRadial(STATION, 180, DEFAULT_DISTANCE),
  headingDeg: 0,
  courseDeg: 0,
  wind: null,
  tasKt: DEFAULT_TAS_KT,
};

export const LESSON4: LessonDefinition = {
  id: 'lesson4',
  monoLabel: 'LESSON 4',
  title: 'Intercept',
  subtitle: 'コースを捕まえる',
  durationText: '約8分',
  baseState: BASE_STATE,
  passingScore: 2,
  steps: [
    {
      kind: 'teach',
      id: 'setup',
      title: 'いま、コースの外にいます',
      explanationKind: 'normal',
      visible: BOTH_VIEWS,
      situation: true,
      headingDeg: 0,
      courseDeg: 0,
      courseOffsetDeg: RIGHT_OF_COURSE,
      lines: [
        'CDIは左に振れています。コース線は自分の左側にあります。',
        'ここから、コースまで近づいて乗る。これを Intercept（インターセプト）と呼びます。',
        'ただし「CDIが左だから左へ曲がる」と覚えてしまうと、あとで必ず行きづまります。次の画面で理由を見てください。',
      ],
      nextLabel: '3つ並べて見る',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'compare',
      id: 'same-cdi',
      title: '同じCDIでも、起きていることは違う',
      visible: BOTH_VIEWS,
      courseDeg: 0,
      courseOffsetDeg: RIGHT_OF_COURSE,
      lines: [
        '3つとも、同じ場所にいます。CDIの振れ方も3つとも同じです。',
        '違うのは機首の向きだけ。それでも、起きていることは3つとも違います。',
      ],
      cases: [
        {
          id: 'turn-in',
          label: 'A. 機首 320°',
          headingDeg: 320,
          courseDeg: 0,
          courseOffsetDeg: RIGHT_OF_COURSE,
          readouts: ['heading', 'cdi', 'trend'],
        },
        {
          id: 'parallel',
          label: 'B. 機首 360°',
          headingDeg: 0,
          courseDeg: 0,
          courseOffsetDeg: RIGHT_OF_COURSE,
          readouts: ['heading', 'cdi', 'trend'],
        },
        {
          id: 'turn-away',
          label: 'C. 機首 040°',
          headingDeg: 40,
          courseDeg: 0,
          courseOffsetDeg: RIGHT_OF_COURSE,
          readouts: ['heading', 'cdi', 'trend'],
        },
      ],
      note: 'CDIは「コース線がどちら側にあるか」しか教えてくれません。近づいているかどうかは、そこに自分の進んでいる向きを重ねて、はじめて分かります。',
      nextLabel: '自分で判断してみる',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'quiz',
      id: 'trend-away',
      title: 'いま、どうなっていますか',
      visible: BOTH_VIEWS,
      headingDeg: 40,
      courseDeg: 0,
      courseOffsetDeg: RIGHT_OF_COURSE,
      scored: true,
      prompt: 'CDIは左に振れています。このまま飛び続けると、コース線との距離はどうなりますか。',
      choices: [
        { id: 'closing', label: '近づいていく' },
        { id: 'holding', label: '変わらない' },
        { id: 'opening', label: '離れていく' },
      ],
      correctChoiceId: 'opening',
      why: 'コース線は左にありますが、機首は右を向いています。上の図を見ると、自機はコース線から離れる向きに進んでいます。CDIが左でも、離れていくことがあります。',
      hints: [
        '上の図で、自機の三角がどちらへ進んでいるか見てください。',
        'コース線は左にあるのに、機首は右を向いています。このまま進むとどうなりますか。',
      ],
      completionRule: { type: 'answer', value: 'opening' },
    },
    {
      kind: 'quiz',
      id: 'trend-in',
      title: 'CDIは同じままです',
      visible: BOTH_VIEWS,
      headingDeg: 320,
      courseDeg: 0,
      courseOffsetDeg: RIGHT_OF_COURSE,
      scored: true,
      prompt:
        '場所もCDIの振れ方も、さっきとまったく同じです。機首だけ変えました。いま、コース線との距離はどうなりますか。',
      choices: [
        { id: 'closing', label: '近づいていく' },
        { id: 'holding', label: '変わらない' },
        { id: 'opening', label: '離れていく' },
      ],
      correctChoiceId: 'closing',
      why: 'CDIはさっきと同じ振れ方ですが、答えは逆になりました。機首をコース線のほうへ向けたからです。CDIの振れ方だけでは、近づいているかどうかは決まりません。',
      hints: [
        'CDIの振れ方は、さっきの問題とまったく同じです。それでも答えは同じとはかぎりません。',
        '機首がコース線に向かっているか、離れる向きかを見てください。',
      ],
      completionRule: { type: 'answer', value: 'closing' },
    },
    {
      kind: 'interact',
      id: 'find-intercept',
      title: '自分で近づく向きを作る',
      controls: ['heading'],
      visible: BOTH_VIEWS,
      situation: true,
      headingDeg: 40,
      courseDeg: 0,
      courseOffsetDeg: RIGHT_OF_COURSE,
      requiredTrend: 'closing',
      lines: [
        'いまは離れていく向きです。機首を動かして、コースへ近づく状態を作ってください。',
        '下の「いま」の行を見ながら動かすと、どこで切り替わるかが分かります。',
      ],
      changeNote:
        'コースへ近づく向きになりました。コースに対して斜めに切り込む、この角度をインターセプト角と呼びます。角度が大きいほど早く近づきますが、行きすぎやすくもなります。',
      nextLabel: 'コースに着いたら',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'quiz',
      id: 'centered-then',
      title: 'CDIが中央に来ました',
      visible: BOTH_VIEWS,
      headingDeg: 40,
      courseDeg: 0,
      courseOffsetDeg: 0,
      scored: true,
      prompt:
        'CDIが中央に来ました。機首はそのままです。このまま飛び続けると、どうなりますか。',
      choices: [
        { id: 'holding', label: 'コース線の上を進み続ける' },
        { id: 'opening', label: 'コース線を横切って、反対側へ出ていく' },
        { id: 'auto', label: '自動的にコースに沿うようになる' },
      ],
      correctChoiceId: 'opening',
      why: 'コース線に着いただけで、進んでいる向きはまだコースと違います。このままだと横切って反対側へ出ていきます。CDIが中央に来たら終わり、ではありません。',
      hints: [
        '上の図で、自機の三角はコース線に対してどちらを向いていますか。',
        'コース線の上にいることと、コースに沿って進んでいることは別のことです。',
      ],
      completionRule: { type: 'answer', value: 'opening' },
    },
    {
      kind: 'interact',
      id: 'align-course',
      title: 'コースへ機首を合わせる',
      controls: ['heading'],
      visible: BOTH_VIEWS,
      situation: true,
      headingDeg: 40,
      courseDeg: 0,
      courseOffsetDeg: 0,
      // 状況表示の「合っています」と同じしきい値を使う。
      // 別の値にすると、合わせたのに次へ進めない（またはその逆）が起きる。
      requiredCourseAlignmentDeg: COURSE_ALIGNED_EPS_DEG,
      lines: [
        'コース線の上にいます。あとは、機首をコースの向きに合わせるだけです。',
        '機首を動かして、「機首はコースに合っています」と出る状態にしてください。',
      ],
      changeNote:
        'これでコースに乗りました。CDIは中央のまま、コース線に沿って進んでいきます。捕まえてから合わせる。この2段階でひとまとまりです。',
      nextLabel: 'この先の話',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'teach',
      id: 'to-tracking',
      title: '乗ったあとも、ずっと見ています',
      explanationKind: 'aha',
      visible: BOTH_VIEWS,
      situation: true,
      headingDeg: 0,
      courseDeg: 0,
      courseOffsetDeg: 0,
      lines: [
        'コースに乗りました。無風であれば、この機首のままコース線の上を進み続けられます。',
        'ただし、空には風があります。機首をコースに合わせていても、風に流されて少しずつコースから外れていきます。',
        'そうなるとCDIがまた振れはじめます。乗せ続けるために何をするか。それが次のレッスンです。',
      ],
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'summary',
      id: 'summary',
      title: 'ここまでのまとめ',
      visible: BOTH_VIEWS,
      headingDeg: 0,
      courseDeg: 0,
      courseOffsetDeg: 0,
      lines: [
        'CDIは「コース線がどちら側にあるか」だけを示す。',
        '近づいているかどうかは、CDIと自分の進む向きを合わせて考える。',
        'CDIが中央に来たら終わりではない。そこから機首をコースへ合わせて、はじめてコースに乗る。',
      ],
      nextLabel: 'レッスンを終える',
      completionRule: { type: 'tap_next' },
    },
  ],
  nextLessonId: 'lesson5',
  completion: {
    title: 'Lesson 4 修了',
    learned: [
      '同じCDI表示でも、機首が違えば近づくか離れるかが変わること',
      'コースへ斜めに切り込んで近づくこと（インターセプト角）',
      'CDIが中央に来たあと、機首をコースへ合わせてはじめてコースに乗ること',
    ],
    completedLineTemplate: '確認問題 {count} 問を最後まで確認できました。',
    messageWhenStrong:
      'CDIの左右だけで判断せず、進んでいる向きと合わせて読めています。次は風のある状態を見ます。',
    messageWhenMore:
      '3つ並べた画面に戻ってみてください。CDIが同じでも答えが違うところが、このレッスンの山です。',
    nextPreview:
      'Lesson 5 では、風があるときに機首と実際に進む方向がずれることを扱います。コースに乗せ続けるための考え方です。',
    nextAvailable: false,
  },
};

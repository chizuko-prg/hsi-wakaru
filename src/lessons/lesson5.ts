/**
 * Lesson 5「Tracking（コース維持）」
 *
 * ねらいは概念の理解ひとつ。
 * 「風があると、機首を向けた方向とは違う方向へ進む。だから機首を風上へ少し振る」
 *
 * このレッスンでやらないこと:
 * - Wind Correction Angle を計算させない
 * - 偏流角の数値を答えさせない、覚えさせない
 * - 風速や角度の組み合わせを暗記させない
 *
 * 出す数字は方位（機首・進む方向・コース）だけにとどめ、
 * 差の角度そのものは問わない。確認問題の答えもすべて言葉で選ばせる。
 * この決まりは lesson5.test.ts で固定している。
 */

import {
  COURSE_ALIGNED_EPS_DEG,
  DEFAULT_DISTANCE,
  DEFAULT_TAS_KT,
} from '../domain/hsi/constants';
import { pointFromRadial } from '../domain/hsi/geometry';
import type { HsiState, VisibleElements, Wind } from '../domain/hsi/types';
import type { LessonDefinition } from './lessonTypes';

const STATION = { x: 0, y: 0 };

/**
 * このレッスンの風。東から吹く。コース360に対して真横から当たる。
 * 風速は WindControl で選べる値から採る。選べない値にすると、
 * 風の操作画面でどのボタンも選ばれていない状態になってしまう。
 */
const CROSSWIND: Wind = { fromDeg: 90, speedKt: 20 };

/** 無風のあいだ。進む方向は出すが、風の表示はまだ出さない。 */
const NO_WIND_VIEW: VisibleElements = {
  rose: true,
  headingReadout: true,
  courseArrow: true,
  courseReadout: true,
  cdi: true,
  toFrom: false,
  track: true,
  planView: true,
  wind: false,
};

/** 風が入ったあと。 */
const WIND_VIEW: VisibleElements = {
  ...NO_WIND_VIEW,
  wind: true,
};

const BASE_STATE: HsiState = {
  station: STATION,
  aircraft: pointFromRadial(STATION, 180, DEFAULT_DISTANCE),
  headingDeg: 0,
  courseDeg: 0,
  wind: null,
  tasKt: DEFAULT_TAS_KT,
};

export const LESSON5: LessonDefinition = {
  id: 'lesson5',
  monoLabel: 'LESSON 5',
  title: 'Tracking',
  subtitle: '風があるとどうなるか',
  durationText: '約7分',
  baseState: BASE_STATE,
  passingScore: 2,
  steps: [
    {
      kind: 'teach',
      id: 'no-wind',
      title: 'まずは風のないところから',
      explanationKind: 'normal',
      visible: NO_WIND_VIEW,
      situation: true,
      headingDeg: 0,
      courseDeg: 0,
      courseOffsetDeg: 0,
      wind: null,
      lines: [
        '風のない空を飛んでいます。コースの上にいて、機首もコースに合っています。',
        '計器に「TRK / 進む方向」が増えました。実際に進んでいる方向です。',
        'いまは機首と同じ 360。風がなければ、この2つはいつも同じ値になります。',
      ],
      note: '上空図でも、機首から伸びる線と進む方向の矢印がぴったり重なっています。',
      nextLabel: '動かしてみる',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'interact',
      id: 'no-wind-turn',
      title: '風がなければ、いつも同じ',
      controls: ['heading'],
      watch: ['heading', 'track'],
      visible: NO_WIND_VIEW,
      situation: true,
      headingDeg: 0,
      courseDeg: 0,
      courseOffsetDeg: 0,
      wind: null,
      requiredChangeDeg: 30,
      lines: [
        '機首を動かしてみてください。下の2つの数字を見ていてください。',
        '機首を変えると、進む方向も同じだけ変わります。',
      ],
      changeNote:
        '風がないあいだ、機首と進む方向はいつも同じです。だから「コースに機首を合わせれば、コースの上を進める」が成り立ちます。',
      nextLabel: '風を入れる',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'teach',
      id: 'wind-on',
      title: '風が入りました',
      explanationKind: 'aha',
      visible: WIND_VIEW,
      situation: true,
      headingDeg: 0,
      courseDeg: 0,
      courseOffsetDeg: 0,
      wind: CROSSWIND,
      lines: [
        '機首はコースに合わせたまま、東から風を入れました。',
        '機首は 360 のままですが、進む方向が変わりました。風に押されて、西へ流されています。',
        '上空図を見ると、機首の向きと進む方向の矢印がずれているのが分かります。',
      ],
      note: '機首を合わせたのに、進む方向はコースからずれている。これが風のある空でいつも起きていることです。',
      nextLabel: '風を変えてみる',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'interact',
      id: 'wind-change',
      title: '風を変えると、流され方が変わる',
      controls: ['wind'],
      visible: WIND_VIEW,
      situation: true,
      headingDeg: 0,
      courseDeg: 0,
      courseOffsetDeg: 0,
      wind: CROSSWIND,
      requiredChangeDeg: 40,
      lines: [
        '風の向きと強さを変えてみてください。機首は 360 のままにしてあります。',
        '真後ろや真正面からの風では、ほとんど流されません。横から当たるほど大きく流されます。',
      ],
      changeNote:
        '横から当たる風ほど、進む方向が大きくずれます。強いほどずれも大きくなります。どれくらいずれるかを計算する必要はありません。ずれていることが見えれば十分です。',
      nextLabel: 'どうすればよいか',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'quiz',
      id: 'drifting-away',
      title: 'このまま飛ぶと',
      visible: WIND_VIEW,
      headingDeg: 0,
      courseDeg: 0,
      courseOffsetDeg: 0,
      wind: CROSSWIND,
      scored: true,
      prompt:
        '機首はコースにぴったり合っています。それでも、このまま飛び続けるとコースとの距離はどうなりますか。',
      choices: [
        { id: 'holding', label: 'コースの上を進み続ける' },
        { id: 'opening', label: '少しずつコースから離れていく' },
        { id: 'closing', label: 'コースへ近づいていく' },
      ],
      correctChoiceId: 'opening',
      why: '機首は合っていても、実際に進んでいる方向はコースからずれています。進んでいるのは機首の向きではなく、こちらの方向です。だんだんコースから離れ、CDIが振れはじめます。',
      hints: [
        '機首の向きと、進む方向の矢印は同じですか。',
        '飛行機が実際に動いていくのは、機首の向きではなく進む方向のほうです。',
      ],
      completionRule: { type: 'answer', value: 'opening' },
    },
    {
      kind: 'quiz',
      id: 'which-way',
      title: 'どちらへ向けますか',
      visible: WIND_VIEW,
      headingDeg: 0,
      courseDeg: 0,
      courseOffsetDeg: 0,
      wind: CROSSWIND,
      scored: true,
      prompt: 'コースの上を進み続けるには、機首をどちらへ向ければよいですか。',
      choices: [
        { id: 'upwind', label: '風が吹いてくる側へ、少し向ける' },
        { id: 'downwind', label: '風に押される側へ、少し向ける' },
        { id: 'none', label: '機首はコースに合わせたままでよい' },
      ],
      correctChoiceId: 'upwind',
      why: '流される分だけ、あらかじめ風上へ機首を振っておきます。すると押し戻されて、進む方向がコースと一致します。何度振るかは、計算しなくても計器を見ながら合わせられます。',
      hints: [
        '風は機体を押しています。押される向きと反対側を考えてみてください。',
        '押される分を打ち消すには、はじめから反対側へ向けておく必要があります。',
      ],
      completionRule: { type: 'answer', value: 'upwind' },
    },
    {
      kind: 'interact',
      id: 'hold-course',
      title: '進む方向をコースに合わせる',
      controls: ['heading'],
      watch: ['heading', 'track'],
      visible: WIND_VIEW,
      situation: true,
      headingDeg: 0,
      courseDeg: 0,
      courseOffsetDeg: 0,
      wind: CROSSWIND,
      requiredTrackAlignmentDeg: COURSE_ALIGNED_EPS_DEG,
      lines: [
        '機首を動かして、「進む方向」をコースに合わせてください。機首ではなく、進む方向のほうです。',
        '角度を計算する必要はありません。TRKの数字がコースと同じになるところを探すだけです。',
      ],
      changeNote:
        '進む方向がコースに合いました。機首はコースより少し風上を向いたままです。これでコースの上を進み続けられます。この機首の振り分けを Wind Correction Angle と呼びますが、値を覚える必要はありません。',
      nextLabel: 'まとめへ',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'teach',
      id: 'concept',
      title: '計算しなくても飛べます',
      explanationKind: 'aha',
      visible: WIND_VIEW,
      situation: true,
      // この風で進む方向がコースに合う機首。値は lesson5.test.ts で確かめている。
      headingDeg: 12,
      courseDeg: 0,
      courseOffsetDeg: 0,
      wind: CROSSWIND,
      lines: [
        '機首はコースより少し風上を向いています。それでも、進む方向はコースと同じ。これが Tracking です。',
        '実際の飛行では、風は刻々と変わります。だから一度合わせて終わりではありません。',
        'CDIが振れてきたら少し戻す。また振れたら少し戻す。この繰り返しでコースの上に居続けます。',
      ],
      note: '大事なのは「機首とコースが違っていても、それが正しいことがある」と分かることです。角度の計算は、必要になったときに学べば間に合います。',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'summary',
      id: 'summary',
      title: 'ここまでのまとめ',
      visible: WIND_VIEW,
      // この風で進む方向がコースに合う機首。値は lesson5.test.ts で確かめている。
      headingDeg: 12,
      courseDeg: 0,
      courseOffsetDeg: 0,
      wind: CROSSWIND,
      lines: [
        '風がなければ、機首と進む方向は同じ。',
        '風があると、機首を合わせても進む方向はずれる。',
        '機首を少し風上へ振って、進む方向をコースに合わせる。角度は計算しなくてよい。',
      ],
      nextLabel: 'レッスンを終える',
      completionRule: { type: 'tap_next' },
    },
  ],
  completion: {
    title: 'Lesson 5 修了',
    learned: [
      '風がないとき、機首と実際に進む方向は同じであること',
      '風があると、機首を合わせても進む方向はコースからずれること',
      '機首を少し風上へ振って、進む方向をコースに合わせること',
    ],
    completedLineTemplate: '確認問題 {count} 問を最後まで確認できました。',
    messageWhenStrong:
      '機首と進む方向を分けて考えられています。実機の計器を見たときも、同じ見方がそのまま使えます。',
    messageWhenMore:
      '風を入れた画面に戻って、機首を動かしながらTRKの数字を見てみてください。2つが別々に動くのが分かります。',
    nextPreview:
      '基本コースはここまでです。「計器を見る」で自由に動かして、これまでの見方を試してみてください。',
    nextAvailable: false,
  },
};

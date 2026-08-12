/**
 * Lesson 2「HeadingとCourse」
 *
 * ねらいは1つ。「2つは別ものだ」を、読むのではなく自分の手で確かめること。
 *
 * そのために、片方だけ動かす手順を2つ用意し、
 * どちらでも「もう片方は変わっていない」と数字で見えるようにしている。
 * 最後に両方動かして、好きな組み合わせを作れることを体験する。
 *
 * CDI・TO/FROM・上空図はまだ出さない（Lesson 3 から）。
 */

import { DEFAULT_DISTANCE, DEFAULT_TAS_KT } from '../domain/hsi/constants';
import { pointFromRadial } from '../domain/hsi/geometry';
import type { HsiState, VisibleElements } from '../domain/hsi/types';
import type { LessonDefinition } from './lessonTypes';

const STATION = { x: 0, y: 0 };

/** このレッスンの基本形。機首とコースの両方を見せる。 */
const BOTH: VisibleElements = {
  rose: true,
  headingReadout: true,
  courseArrow: true,
  courseReadout: true,
  cdi: false,
  toFrom: false,
  track: false,
  planView: false,
  wind: false,
};

/** 目盛りから読み取ってもらう手順では、答えになる数値窓を出さない。 */
const BOTH_WITHOUT_READOUTS: VisibleElements = {
  ...BOTH,
  headingReadout: false,
  courseReadout: false,
};

const BASE_STATE: HsiState = {
  station: STATION,
  aircraft: pointFromRadial(STATION, 180, DEFAULT_DISTANCE),
  headingDeg: 30,
  courseDeg: 90,
  wind: null,
  tasKt: DEFAULT_TAS_KT,
};

export const LESSON2: LessonDefinition = {
  id: 'lesson2',
  monoLabel: 'LESSON 2',
  title: 'HeadingとCourse',
  subtitle: '2つは別ものだと確かめる',
  durationText: '約6分',
  baseState: BASE_STATE,
  passingScore: 2,
  steps: [
    {
      kind: 'teach',
      id: 'recap',
      title: '2つの数字が出ています',
      explanationKind: 'normal',
      visible: BOTH,
      headingDeg: 30,
      courseDeg: 90,
      lines: [
        '上に2つの数字が出ています。左が Heading（いま向いている方向）、右が Course（選んだ進みたい方向）です。',
        'いまは機首が 030、コースが 090。同じではありません。',
        'この2つが本当に別ものなのか、片方ずつ動かして確かめていきます。',
      ],
      nextLabel: 'Headingだけ動かす',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'interact',
      id: 'heading-only',
      title: 'Headingだけ動かす',
      controls: ['heading'],
      watch: ['heading', 'course'],
      visible: BOTH,
      headingDeg: 30,
      courseDeg: 90,
      requiredChangeDeg: 30,
      lines: [
        '機首のつまみだけを動かします。動かしながら、Course（右の数字）を見ていてください。',
        '青い矢印は目盛りと一緒に回りますが、指している数字は変わりません。',
      ],
      changeNote:
        'Heading は変わりましたが、Course は 090 のままです。矢印が画面の中で回って見えたのは、目盛りごと回ったからで、選んだコースそのものは動いていません。',
      nextLabel: '今度はCourseだけ',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'interact',
      id: 'course-only',
      title: '今度はCourseだけ動かす',
      controls: ['course'],
      watch: ['heading', 'course'],
      visible: BOTH,
      headingDeg: 30,
      courseDeg: 90,
      requiredChangeDeg: 30,
      lines: [
        '今度はコースのつまみだけを動かします。Heading（左の数字）を見ていてください。',
        '目盛りは回りません。動くのは青い矢印だけです。',
      ],
      changeNote:
        'Course は変わりましたが、Heading は 030 のままです。コースを選び直しても、飛行機の向きは変わりません。コースを選ぶことと、そちらへ機首を向けることは別の操作です。',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'quiz',
      id: 'independent',
      title: 'どうなりますか',
      visible: BOTH,
      headingDeg: 30,
      courseDeg: 90,
      scored: true,
      prompt: 'コースを 090 から 180 に変えました。このとき Heading はどうなりますか。',
      choices: [
        { id: 'unchanged', label: '030 のまま変わらない' },
        { id: 'follows', label: 'コースと一緒に 180 になる' },
        { id: 'moves', label: '動いた分だけ一緒にずれる' },
      ],
      correctChoiceId: 'unchanged',
      why: 'コースを選び直しても、飛行機はまだ 030 を向いたままです。コースは「これから進みたい方向」を選ぶだけで、機体を動かす操作ではありません。',
      hints: [
        'さっき自分でコースのつまみを動かしたとき、左の数字はどうなっていましたか。',
        'コースを選ぶことと、そちらへ機首を向けることは、別々の操作でした。',
      ],
      completionRule: { type: 'answer', value: 'unchanged' },
    },
    {
      kind: 'interact',
      id: 'both',
      title: '両方を動かしてみる',
      controls: ['heading', 'course'],
      watch: ['heading', 'course'],
      visible: BOTH,
      headingDeg: 30,
      courseDeg: 90,
      requiredChangeDeg: 20,
      lines: [
        '2つのつまみを両方とも動かしてみてください。好きな組み合わせを作れます。',
        '機首とコースをわざと大きく離してみると、違いがよく分かります。',
      ],
      changeNote:
        '2つは好きな組み合わせにできます。実際の飛行でも、コースに乗るまでは機首とコースが違う方向を向いているのがふつうです。',
      nextLabel: '読み取ってみる',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'quiz',
      id: 'read-both',
      title: '2つとも読んでみましょう',
      visible: BOTH_WITHOUT_READOUTS,
      headingDeg: 60,
      courseDeg: 150,
      scored: true,
      prompt: 'いまの Heading と Course の組み合わせはどれですか。',
      choices: [
        { id: '060/150', label: 'Heading 060° ／ Course 150°' },
        { id: '150/060', label: 'Heading 150° ／ Course 060°' },
        { id: '060/060', label: 'Heading 060° ／ Course 060°' },
        { id: '090/150', label: 'Heading 090° ／ Course 150°' },
      ],
      correctChoiceId: '060/150',
      why: '上の三角が指している目盛りが Heading で 060。青い矢印の頭が指している目盛りが Course で 150 です。読む場所が2か所あります。',
      hints: [
        'Heading は、いちばん上の動かない三角が指している目盛りです。',
        'Course は、青い矢印の頭が指している目盛りです。矢印の向きそのものではなく、その先にある目盛りを読みます。',
      ],
      completionRule: { type: 'answer', value: '060/150' },
    },
    {
      kind: 'teach',
      id: 'why-two',
      title: 'なぜ2つあるのか',
      explanationKind: 'aha',
      visible: BOTH,
      headingDeg: 60,
      courseDeg: 150,
      lines: [
        '進みたい方向が決まっていても、いまその方向を向いているとはかぎりません。',
        'だから「いま向いている方向」と「進みたい方向」を、別々に表示しています。',
        'この2つがずれているとき、自分はコースからどれくらい離れているのか。それを読む道具が、次のレッスンで出てきます。',
      ],
      note: 'ここまでで、HSIの上半分の読み方は身についています。',
      completionRule: { type: 'tap_next' },
    },
    {
      kind: 'summary',
      id: 'summary',
      title: 'ここまでのまとめ',
      visible: BOTH,
      headingDeg: 60,
      courseDeg: 150,
      lines: [
        'Heading を変えても Course は変わらない。',
        'Course を変えても Heading は変わらない。',
        '2つは好きな組み合わせにできる。ずれているのがふつうの状態。',
      ],
      nextLabel: 'レッスンを終える',
      completionRule: { type: 'tap_next' },
    },
  ],
  nextLessonId: 'lesson3',
  completion: {
    title: 'Lesson 2 修了',
    learned: [
      'Heading を変えても Course は変わらないこと',
      'Course を変えても Heading は変わらないこと',
      '2つがずれているのは、おかしな状態ではないこと',
    ],
    completedLineTemplate: '確認問題 {count} 問を最後まで確認できました。',
    messageWhenStrong:
      '2つが別ものだとつかめています。次は「コースからどれくらい離れているか」を読みます。',
    messageWhenMore:
      '片方だけ動かす手順に戻って、もう一度数字を見くらべてみると、違いがはっきりします。',
    nextPreview:
      'Lesson 3 では、選んだコースが自分の左右どちらにあるかを示す CDI を読みます。真上から見た図と見くらべて、計器の見え方とつなげます。',
    nextAvailable: true,
  },
};

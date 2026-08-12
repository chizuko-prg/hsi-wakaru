/**
 * 基本コース修了画面。
 *
 * ここは「終わり」を祝う画面ではなく、学んだことを1枚に整理し直す画面。
 * レッスンごとにバラバラだった概念を、1本の流れとして並べる。
 * VORわかる？で学んだこととのつながりも、ここで言葉にしておく。
 */

import { ROUTES } from '../app/routes';
import { useProgress } from '../app/useProgress';
import { ScreenHeader } from '../components/ScreenHeader/ScreenHeader';
import { LESSON_CATALOG } from '../lessons/lessonCatalog';
import { countCompletedLessons } from '../storage/progressStorage';
import type { PageProps } from './pageProps';
import './CourseCompletePage.css';

/** 学んだ概念を、順を追って並べ直したもの。 */
const CONCEPTS = [
  {
    mono: 'LESSON 1',
    title: '自分は動かない',
    body: '自機のしるしは常に上を向いたまま。回るのはまわりの目盛りのほう。だから画面の上がいつでも自分の前になる。',
  },
  {
    mono: 'LESSON 2',
    title: '向きと、進みたい方向は別もの',
    body: 'Heading はいま向いている方向、Course は自分で選んだ進みたい方向。片方を変えても、もう片方は変わらない。2つがずれているのがふつうの状態。',
  },
  {
    mono: 'LESSON 3',
    title: 'コースは左右どちらにあるか',
    body: 'CDIの棒が寄っている側に、選んだコース線がある。ドット1つで5度ぶんのずれ。この読み取りに機首の向きは関係しない。',
  },
  {
    mono: 'LESSON 4',
    title: '近づいているかは、進む向きと合わせて考える',
    body: '同じCDI表示でも、機首が違えば近づくか離れるかは変わる。コースに着いたら、そこから機首をコースへ合わせてはじめてコースに乗る。',
  },
  {
    mono: 'LESSON 5',
    title: '風があると、機首と進む方向がずれる',
    body: '機首をコースに合わせても、風に流されてコースから外れていく。機首を少し風上へ振って、実際に進む方向をコースに合わせる。',
  },
];

export function CourseCompletePage({ navigate }: PageProps) {
  const { progress } = useProgress();
  const completed = countCompletedLessons(progress);
  const total = LESSON_CATALOG.length;
  const allDone = completed >= total;

  return (
    <div className="stack">
      <ScreenHeader
        title="基本コース修了"
        monoLabel="COMPLETE / 修了"
        onBack={() => navigate(ROUTES.lessons)}
        backLabel="レッスン一覧"
      />

      <section className="card-header">
        <span className="card-header-title">
          {allDone ? 'おつかれさまでした' : 'ここまでのまとめ'}
        </span>
        <span className="mono-label">
          {completed} / {total}
        </span>
      </section>

      <section className="card-body course-complete__lead">
        <p className="body-text">
          {allDone
            ? 'HSIの基本的な読み方をひととおり見てきました。ここで、学んだことを1本の流れに並べ直しておきます。'
            : 'まだ途中のレッスンがありますが、ここまでに出てきた考え方を並べておきます。'}
        </p>
      </section>

      <section className="course-complete__concepts" aria-label="学んだ概念">
        <h2 className="card-heading">学んだこと</h2>

        <ol className="course-complete__list">
          {CONCEPTS.map((concept) => (
            <li key={concept.mono} className="course-complete__item">
              <span className="mono-label">{concept.mono}</span>
              <h3 className="course-complete__item-title">{concept.title}</h3>
              <p className="note-text">{concept.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* シリーズのつながり。同じ場面を別の見方で扱っていることを示す。 */}
      <section className="course-complete__series">
        <h2 className="card-heading">VORわかる？ とのつながり</h2>
        <p className="note-text">
          VORわかる？で扱ったのは「自分はどこにいるのか」でした。地上局から見た自分の位置を、外から眺める見方です。
        </p>
        <p className="note-text">
          HSIわかる？で扱ったのは「自分はどちらを向いていて、どちらへ進むべきか」。同じ状況を、コックピットの中から見る見方です。
        </p>
        <p className="note-text">
          Lesson 3 で出てきたCDIは、どちらのアプリにも出てきました。同じ情報が、外から見た図では位置関係として、計器の中では針の振れとして表れます。この2つが結びつくと、実機の計器を見たときに迷いにくくなります。
        </p>
      </section>

      <section className="card course-complete__note">
        <span className="mono-label">STUDY ONLY / 学習専用</span>
        <p className="note-text">
          このアプリで扱ったのは概念だけです。実際の飛行、訓練、試験には使用できません。実機、公式資料、教官の指示を優先してください。
        </p>
      </section>

      <button type="button" className="button-primary" onClick={() => navigate(ROUTES.freePlay)}>
        自由に動かして確かめる
        <span className="mono-label">FREE PLAY</span>
      </button>

      <button type="button" className="button-secondary" onClick={() => navigate(ROUTES.lessons)}>
        レッスンをもう一度見る
        <span className="mono-label">LESSON LIST</span>
      </button>
    </div>
  );
}

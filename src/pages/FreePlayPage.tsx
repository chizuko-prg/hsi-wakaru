/**
 * 自由に動かす画面。
 *
 * ここは遊ぶ場所ではなく、レッスンで学んだ見方が身についたか自分で確かめる場所。
 * だから点数も、制限時間も、正解判定も置かない。
 * 代わりに「確かめること」を並べ、その状況をすぐ作れるようにしてある。
 *
 * 出題ではないので、状況の要約（SITUATION）は常に出しておく。
 */

import { useState } from 'react';
import { ROUTES } from '../app/routes';
import { useInstrumentMotion } from '../app/useInstrumentMotion';
import { aircraftRadialOf, useHsiState } from '../app/useHsiState';
import { AngleSlider } from '../components/AngleSlider/AngleSlider';
import { HsiIndicator } from '../components/HsiIndicator/HsiIndicator';
import { PlanView } from '../components/PlanView/PlanView';
import { SafetyNote } from '../components/SafetyNote/SafetyNote';
import { ScreenHeader } from '../components/ScreenHeader/ScreenHeader';
import { SituationStatus } from '../components/SituationStatus/SituationStatus';
import { WindControl } from '../components/WindControl/WindControl';
import { DEFAULT_DISTANCE, DEFAULT_TAS_KT } from '../domain/hsi/constants';
import { pointFromRadial } from '../domain/hsi/geometry';
import { ALL_VISIBLE, type HsiState } from '../domain/hsi/types';
import { aircraftFromCourseOffset } from '../lessons/lessonTypes';
import type { PageProps } from './pageProps';
import './FreePlayPage.css';

const STATION = { x: 0, y: 0 };

interface Checkpoint {
  id: string;
  /** どのレッスンで扱ったか。 */
  from: string;
  /** 確かめること。答えではなく、やってみることを書く。 */
  title: string;
  detail: string;
  state: Partial<HsiState>;
}

/**
 * 確かめること。
 * 「こうなるはず」と断言せず、自分で動かして確かめる形にしてある。
 */
const CHECKPOINTS: Checkpoint[] = [
  {
    id: 'heading-rose',
    from: 'LESSON 1',
    title: '機首を回して、動かないものを探す',
    detail:
      '機首のつまみを大きく動かしてください。まん中の飛行機は動かず、まわりの目盛りだけが回ります。',
    state: {
      aircraft: pointFromRadial(STATION, 180, DEFAULT_DISTANCE),
      headingDeg: 0,
      courseDeg: 0,
      wind: null,
    },
  },
  {
    id: 'independent',
    from: 'LESSON 2',
    title: '機首とコースを別々に動かす',
    detail:
      '片方を動かして、もう片方の数字が変わらないことを確かめてください。2つは別ものです。',
    state: {
      aircraft: pointFromRadial(STATION, 180, DEFAULT_DISTANCE),
      headingDeg: 30,
      courseDeg: 90,
      wind: null,
    },
  },
  {
    id: 'cdi-side',
    from: 'LESSON 3',
    title: 'CDIとコース線の位置を見くらべる',
    detail:
      '位置のつまみを動かして、CDIが振れる向きと、上空図での自分の位置を見くらべてください。',
    state: {
      aircraft: aircraftFromCourseOffset(STATION, 0, 6),
      headingDeg: 0,
      courseDeg: 0,
      wind: null,
    },
  },
  {
    id: 'same-cdi',
    from: 'LESSON 4',
    title: 'CDIはそのままで、機首だけ変える',
    detail:
      '機首だけを動かしてください。CDIの振れ方は変わらないのに、「いま」の行が近づく／変わらない／離れると変わります。',
    state: {
      aircraft: aircraftFromCourseOffset(STATION, 0, 6),
      headingDeg: 40,
      courseDeg: 0,
      wind: null,
    },
  },
  {
    id: 'wind-drift',
    from: 'LESSON 5',
    title: '風の中で、進む方向をコースに合わせる',
    detail:
      '機首はコースに合っていますが、風で流されています。機首を動かして、TRKをコースに合わせてください。',
    state: {
      aircraft: aircraftFromCourseOffset(STATION, 0, 0),
      headingDeg: 0,
      courseDeg: 0,
      wind: { fromDeg: 90, speedKt: 20 },
    },
  },
];

const INITIAL_STATE: HsiState = {
  station: STATION,
  aircraft: pointFromRadial(STATION, 180, DEFAULT_DISTANCE),
  headingDeg: 0,
  courseDeg: 0,
  wind: null,
  tasKt: DEFAULT_TAS_KT,
};

export function FreePlayPage({ navigate }: PageProps) {
  const hsi = useHsiState(INITIAL_STATE);
  const { state, derived } = hsi;
  const { motion, markInteracting } = useInstrumentMotion();

  const [activeId, setActiveId] = useState<string | null>(null);
  const active = CHECKPOINTS.find((point) => point.id === activeId) ?? null;

  const applyCheckpoint = (checkpoint: Checkpoint) => {
    setActiveId(checkpoint.id);
    hsi.reset({ ...INITIAL_STATE, ...checkpoint.state });
  };

  return (
    <div className="stack">
      <ScreenHeader
        title="自由に動かす"
        monoLabel="FREE PLAY / 自由操作"
        onBack={() => navigate(ROUTES.home)}
        backLabel="トップへ"
      />

      <SafetyNote variant="learning" />

      <p className="note-text">
        点数も制限時間もありません。レッスンで学んだ見方が身についたかを、自分で動かして確かめる場所です。
      </p>

      <HsiIndicator
        state={state}
        derived={derived}
        visible={ALL_VISIBLE}
        motion={motion}
      />

      <PlanView state={state} derived={derived} visible={ALL_VISIBLE} />

      <SituationStatus state={state} derived={derived} showTrack />

      <section className="free-controls stack-tight" aria-label="操作">
        <AngleSlider
          id="free-heading"
          label="HDG"
          sublabel="機首方位"
          tone="heading"
          value={state.headingDeg}
          onChange={hsi.setHeading}
          onInteract={markInteracting}
        />
        <AngleSlider
          id="free-course"
          label="CRS"
          sublabel="コース"
          tone="course"
          value={state.courseDeg}
          onChange={hsi.setCourse}
          onInteract={markInteracting}
        />
        <AngleSlider
          id="free-position"
          label="POS"
          sublabel="自機の位置"
          tone="position"
          value={aircraftRadialOf(state)}
          onChange={(deg) => hsi.setAircraftRadial(deg)}
          onInteract={markInteracting}
        />
        <WindControl wind={state.wind} onChange={hsi.setWind} onInteract={markInteracting} />
      </section>

      <section className="free-checks stack-tight" aria-label="確かめること">
        <span className="mono-label">CHECK / 確かめること</span>
        <p className="note-text">
          選ぶと、その状況を作ります。正解の表示は出しません。自分で動かして確かめてください。
        </p>

        <ul className="free-checks__list">
          {CHECKPOINTS.map((checkpoint) => (
            <li key={checkpoint.id}>
              <button
                type="button"
                className="free-check"
                aria-pressed={activeId === checkpoint.id}
                onClick={() => applyCheckpoint(checkpoint)}
              >
                <span className="mono-label">{checkpoint.from}</span>
                <span className="free-check__title">{checkpoint.title}</span>
              </button>
            </li>
          ))}
        </ul>

        {active && (
          <article className="card free-checks__detail">
            <span className="mono-label">{active.from} / やってみる</span>
            <p className="body-text">{active.detail}</p>
          </article>
        )}
      </section>

      <div className="stack-tight">
        <button
          type="button"
          className="button-quiet"
          onClick={() => {
            hsi.reset(INITIAL_STATE);
            setActiveId(null);
          }}
        >
          はじめの状態に戻す
        </button>

        <button type="button" className="button-primary" onClick={() => navigate(ROUTES.lessons)}>
          レッスンへ戻る
          <span className="mono-label">LESSON LIST</span>
        </button>
      </div>
    </div>
  );
}

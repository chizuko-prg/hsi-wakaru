/**
 * 計器を見る画面。
 * Heading・Course・自機の位置を自由に動かし、各部をタップして意味を確認する。
 *
 * ここで確かめてほしいこと:
 * - Heading を変えるとローズが回り、自機シンボルは動かない
 * - Course を変えてもローズは回らず、コース矢印とCDIだけが動く
 * - CDI は Heading をどれだけ回しても変わらない
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ROUTES } from '../app/routes';
import { aircraftRadialOf, useHsiState } from '../app/useHsiState';
import { AngleSlider } from '../components/AngleSlider/AngleSlider';
import { HsiIndicator, type HsiPart } from '../components/HsiIndicator/HsiIndicator';
import { LiveStatus } from '../components/LiveStatus/LiveStatus';
import { SafetyNote } from '../components/SafetyNote/SafetyNote';
import { ScreenHeader } from '../components/ScreenHeader/ScreenHeader';
import { formatBearing } from '../domain/hsi/angles';
import { cdiLabel, courseRelativeText, toFromLabel } from '../domain/hsi/describeState';
import { ALL_VISIBLE } from '../domain/hsi/types';
import type { PageProps } from './pageProps';
import './InstrumentPage.css';

interface PartInfo {
  id: HsiPart;
  chip: string;
  mono: string;
  title: string;
  lines: string[];
}

/** 部品の説明。用語を並べるのではなく、何を読み取るためのものかを書く。 */
const PARTS: PartInfo[] = [
  {
    id: 'aircraft',
    chip: '自機',
    mono: 'AIRCRAFT / 自機シンボル',
    title: '自分はいつも上を向いている',
    lines: [
      '真ん中の飛行機は動きません。いつも上を向いたままです。',
      'だから「画面の上＝自分の前」として読めます。まわりが回ることで、向きの変化を表します。',
    ],
  },
  {
    id: 'rose',
    chip: 'ローズ',
    mono: 'COMPASS ROSE / 方位目盛り',
    title: '回るのはこちら',
    lines: [
      '機首の向きを変えると、この目盛りが回ります。',
      '上の三角に来ている数字が、いまの機首方位です。',
    ],
  },
  {
    id: 'lubber',
    chip: '機首指標',
    mono: 'LUBBER LINE / 機首指標',
    title: 'ここが「いま向いている方向」',
    lines: [
      '上にある固定の三角。動きません。',
      'この三角が指している目盛りを読むと、機首方位が分かります。',
    ],
  },
  {
    id: 'courseArrow',
    chip: 'コース矢印',
    mono: 'COURSE / 選択コース',
    title: '進みたい方向を自分で選ぶ',
    lines: [
      '機首の向きとは別に、自分で選ぶ方向です。矢印の頭が、コースの進む向きを指します。',
      'コースを変えても機首は変わりません。機首を変えてもコースは変わりません。',
    ],
  },
  {
    id: 'cdi',
    chip: 'CDI',
    mono: 'CDI / コース偏位',
    title: '選んだコースは左右どちらにあるか',
    lines: [
      '真ん中の縦の棒。選んだコース線が、自分から見て左右どちらにあるかを示します。',
      '中央にあれば、いまコース線の上にいます。ドット1つぶんで5度ぶんのずれです。',
      'この棒は機首の向きでは動きません。機首をどれだけ回しても変わらないことを試してみてください。',
    ],
  },
  {
    id: 'toFrom',
    chip: 'TO / FROM',
    mono: 'TO / FROM',
    title: '局へ向かう側か、離れる側か',
    lines: [
      '選んだコースが、局へ向かう側なら上向き（TO）、離れる側なら下向き（FROM）の三角が出ます。',
      'これも機首の向きでは決まりません。',
    ],
  },
];

export function InstrumentPage({ navigate }: PageProps) {
  const hsi = useHsiState();
  const { state, derived } = hsi;

  const [spotlight, setSpotlight] = useState<HsiPart | null>(null);
  const [motion, setMotion] = useState<'calm' | 'fast'>('calm');
  const settleTimer = useRef<number | null>(null);

  // 操作している最中だけ計器の動きを短くし、指の動きから遅れないようにする。
  const markInteracting = useCallback(() => {
    setMotion('fast');
    if (settleTimer.current !== null) clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => setMotion('calm'), 260);
  }, []);

  useEffect(() => {
    return () => {
      if (settleTimer.current !== null) clearTimeout(settleTimer.current);
    };
  }, []);

  const focused = PARTS.find((part) => part.id === spotlight) ?? null;

  const crossTrack = derived.crossTrackAngleDeg;
  const positionText =
    crossTrack === null
      ? '局の直上付近にいます'
      : Math.abs(crossTrack) < 0.5
        ? '自機はコース線の上にいます'
        : `自機はコースの${crossTrack > 0 ? '右' : '左'}へ${Math.abs(Math.round(crossTrack))}°ずれています`;

  const statusText = `${[
    `機首 ${formatBearing(state.headingDeg)}°／コース ${formatBearing(state.courseDeg)}°`,
    courseRelativeText(derived.courseRelativeDeg),
    positionText,
    `CDIは${cdiLabel(derived.cdiDirection, derived.toFromBoundary)}、${toFromLabel(
      derived.toFrom,
      derived.toFromBoundary,
    )}`,
  ].join('。')}。`;

  return (
    <div className="stack">
      <ScreenHeader
        title="計器を見る"
        monoLabel="INDICATOR / HSI"
        onBack={() => navigate(ROUTES.home)}
        backLabel="トップへ"
      />

      <SafetyNote variant="learning" />

      <HsiIndicator
        state={state}
        derived={derived}
        visible={ALL_VISIBLE}
        motion={motion}
        spotlight={spotlight}
      />

      <LiveStatus text={statusText} />

      <section className="instrument-controls stack-tight" aria-label="操作">
        <AngleSlider
          id="hdg"
          label="HDG"
          sublabel="機首方位"
          tone="heading"
          value={state.headingDeg}
          onChange={hsi.setHeading}
          onInteract={markInteracting}
          hint="動かすと、目盛りが回ります。CDIは動きません。"
        />

        <AngleSlider
          id="crs"
          label="CRS"
          sublabel="コース"
          tone="course"
          value={state.courseDeg}
          onChange={hsi.setCourse}
          onInteract={markInteracting}
          hint="動かすと、コース矢印とCDIだけが動きます。"
        />

        <AngleSlider
          id="pos"
          label="POS"
          sublabel="自機の位置"
          tone="position"
          value={aircraftRadialOf(state, derived)}
          onChange={(deg) => hsi.setAircraftRadial(deg)}
          onInteract={markInteracting}
          hint="局から見て、自分がどの方向にいるか。CDIとTO/FROMはここで変わります。"
        />
      </section>

      <section className="instrument-parts stack-tight" aria-label="部品の説明">
        <span className="mono-label">PARTS / 部品を選ぶ</span>
        <div className="instrument-parts__chips">
          {PARTS.map((part) => (
            <button
              key={part.id}
              type="button"
              className="instrument-chip"
              aria-pressed={spotlight === part.id}
              onClick={() => setSpotlight(spotlight === part.id ? null : part.id)}
            >
              {part.chip}
            </button>
          ))}
        </div>

        {focused ? (
          <article className="card card-raised stack-tight">
            <span className="mono-label">{focused.mono}</span>
            <h2 className="card-heading">{focused.title}</h2>
            {focused.lines.map((line) => (
              <p key={line} className="body-text">
                {line}
              </p>
            ))}
            <button type="button" className="button-quiet" onClick={() => setSpotlight(null)}>
              全体表示に戻す
            </button>
          </article>
        ) : (
          <p className="note-text">
            部品を選ぶと、その部分だけを明るくして説明します。もう一度押すと全体表示に戻ります。
          </p>
        )}
      </section>

      <div className="instrument-footer stack-tight">
        <button
          type="button"
          className="button-quiet"
          onClick={() => {
            hsi.reset();
            setSpotlight(null);
          }}
        >
          はじめの状態に戻す
        </button>

        <button type="button" className="button-primary" onClick={() => navigate(ROUTES.lessons)}>
          順番に学ぶ
          <span className="mono-label">BASIC COURSE / 5 LESSONS</span>
        </button>
      </div>
    </div>
  );
}

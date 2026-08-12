/**
 * 上空図。真上から見た位置関係を描く。
 *
 * HSIとの決定的な違いは、ここでは自機が機首の向きに回ることと、北が常に上であること。
 * 「計器の中の見え方」と「外から見た位置関係」を対応づけるために使う。
 *
 * 使いどころは理解の補助と答え合わせ。
 * 確認問題で先に見せてしまうと、計器を読まずに答えが分かってしまうため、
 * どの手順で出すかはレッスンデータ側（visible.planView）が決める。
 */

import { formatBearing } from '../../domain/hsi/angles';
import { unitFromBearing } from '../../domain/hsi/geometry';
import type { HsiDerivedState, HsiState, Point, VisibleElements } from '../../domain/hsi/types';
import './PlanView.css';

const VIEW_W = 240;
const VIEW_H = 240;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;

/**
 * 局と自機の距離を、画面上でこの長さに合わせる。
 *
 * 縮尺を固定にすると、コース線からの横のずれが数ピクセルにしかならず、
 * 「どちら側にいるか」が図から読み取れなくなる。
 * 図を引き伸ばすのではなく、局と自機が画面いっぱいに離れるよう縮尺のほうを決める。
 * 角度の関係はそのままなので、図と計器の対応は崩れない。
 */
const FIT_PX = 180;

/** コース線を引く長さ（画面px）。枠からはみ出す分は切り取られる。 */
const COURSE_LINE_PX = 200;

/** 方位の単位ベクトルを画面座標の向きへ。 */
function screenDirection(bearingDeg: number): Point {
  const dir = unitFromBearing(bearingDeg);
  return { x: dir.x, y: -dir.y };
}

export interface PlanViewProps {
  state: HsiState;
  derived: HsiDerivedState;
  visible: Pick<VisibleElements, 'courseArrow' | 'cdi' | 'track' | 'wind'>;
  /** 見くらべのために小さく並べるとき。見出しと凡例を省く。 */
  compact?: boolean;
}

export function PlanView({ state, derived, visible, compact = false }: PlanViewProps) {
  const rel = {
    x: state.aircraft.x - state.station.x,
    y: state.aircraft.y - state.station.y,
  };
  const distance = Math.hypot(rel.x, rel.y);

  // 局と自機のちょうど真ん中を画面の中心に置き、2つが離れて見える縮尺にする。
  const scale = FIT_PX / Math.max(distance, 1);
  const center = {
    x: state.station.x + rel.x / 2,
    y: state.station.y + rel.y / 2,
  };

  /** 世界座標（東が+x、北が+y）を画面座標（yが下向き）へ。 */
  const toScreen = (point: Point): Point => ({
    x: CX + (point.x - center.x) * scale,
    y: CY - (point.y - center.y) * scale,
  });

  const station = toScreen(state.station);
  const aircraft = toScreen(state.aircraft);
  const courseDir = screenDirection(state.courseDeg);

  // コース線は局を通る直線として扱う。自機からその線へ下ろした垂線の足を求める。
  const worldCourseDir = unitFromBearing(state.courseDeg);
  const along = rel.x * worldCourseDir.x + rel.y * worldCourseDir.y;
  const foot = toScreen({
    x: state.station.x + worldCourseDir.x * along,
    y: state.station.y + worldCourseDir.y * along,
  });

  /*
   * コースの進む向きを示す矢じりの位置。
   * 局からの距離で決めると、コースの向きによっては枠の外へ出てしまう。
   * 画面の中心をコース線へ下ろした点を基準にすれば、どの向きでも必ず見える。
   */
  const centerAlong =
    (center.x - state.station.x) * worldCourseDir.x +
    (center.y - state.station.y) * worldCourseDir.y;
  const arrowBase = toScreen({
    x: state.station.x + worldCourseDir.x * centerAlong,
    y: state.station.y + worldCourseDir.y * centerAlong,
  });
  const arrowTip = { x: arrowBase.x + courseDir.x * 58, y: arrowBase.y + courseDir.y * 58 };

  const description = [
    `真上から見た図。北が上。自機は ${formatBearing(state.headingDeg)}度 を向いています。`,
    visible.courseArrow ? `コースは ${formatBearing(state.courseDeg)}度 の線です。` : '',
    visible.cdi && derived.crossTrackAngleDeg !== null && Math.abs(derived.crossTrackAngleDeg) >= 0.5
      ? `自機はコース線の${derived.crossTrackAngleDeg > 0 ? '右' : '左'}側にいます。`
      : '',
  ]
    .filter(Boolean)
    .join('');

  return (
    <figure className={compact ? 'plan-view plan-view--compact' : 'plan-view'}>
      {!compact && (
        <figcaption className="plan-view__caption">
          <span className="mono-label">PLAN VIEW / 真上から見た図</span>
        </figcaption>
      )}

      <svg
        className="plan-view__canvas"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={description}
      >
        {/* 北の向き。上空図では北が常に上を向く（計器とはここが違う）。 */}
        <g className="pv-north" aria-hidden="true">
          <line x1={18} y1={30} x2={18} y2={14} />
          <polygon points="18,10 14,18 22,18" />
          <text x={18} y={42} textAnchor="middle">
            N
          </text>
        </g>

        {visible.courseArrow && (
          <g className="pv-course">
            <line
              x1={station.x - courseDir.x * COURSE_LINE_PX}
              y1={station.y - courseDir.y * COURSE_LINE_PX}
              x2={station.x + courseDir.x * COURSE_LINE_PX}
              y2={station.y + courseDir.y * COURSE_LINE_PX}
            />
            {/* 進む向きを示す矢じり。 */}
            <polygon
              points={`${arrowTip.x},${arrowTip.y} ${arrowTip.x - courseDir.x * 15 - courseDir.y * 7},${
                arrowTip.y - courseDir.y * 15 + courseDir.x * 7
              } ${arrowTip.x - courseDir.x * 15 + courseDir.y * 7},${
                arrowTip.y - courseDir.y * 15 - courseDir.x * 7
              }`}
            />
          </g>
        )}

        {/* コース線からの横のずれ。CDIが示しているのはこの距離。 */}
        {visible.courseArrow && visible.cdi && (
          <line
            className="pv-crosstrack"
            x1={aircraft.x}
            y1={aircraft.y}
            x2={foot.x}
            y2={foot.y}
          />
        )}

        {/* 局。コース線の基準点。 */}
        <g className="pv-station">
          <circle cx={station.x} cy={station.y} r={7} />
          <circle className="pv-station__dot" cx={station.x} cy={station.y} r={2.5} />
        </g>

        {/* 実際に進んでいる向き。無風では機首と重なる。 */}
        {visible.track && (
          <g
            className="pv-track"
            transform={`translate(${aircraft.x} ${aircraft.y}) rotate(${derived.trackDeg})`}
          >
            <line x1={0} y1={0} x2={0} y2={-38} />
            <polygon points="0,-44 -4,-36 4,-36" />
          </g>
        )}

        {/* 自機。上空図では機首の向きに回る（HSIでは回らない）。 */}
        <g
          className="pv-aircraft"
          transform={`translate(${aircraft.x} ${aircraft.y}) rotate(${state.headingDeg})`}
        >
          <polygon points="0,-10 7,8 0,4 -7,8" />
        </g>

        {visible.wind && state.wind !== null && (
          <g
            className="pv-wind"
            transform={`translate(${VIEW_W - 30} 30) rotate(${state.wind.fromDeg + 180})`}
          >
            <line x1={0} y1={-12} x2={0} y2={12} />
            <polygon points="0,16 -5,6 5,6" />
          </g>
        )}
      </svg>

      {!compact && (
      <p className="plan-view__legend note-text">
        <span className="plan-view__key plan-view__key--aircraft">▲ 自機（機首の向きに回ります）</span>
        {visible.courseArrow && (
          <span className="plan-view__key plan-view__key--course">
            — コース線 {formatBearing(state.courseDeg)}°
          </span>
        )}
        {visible.wind && state.wind !== null && (
          <span className="plan-view__key">
            ↓ 風 {formatBearing(state.wind.fromDeg)}° / {state.wind.speedKt}kt
          </span>
        )}
      </p>
      )}
    </figure>
  );
}

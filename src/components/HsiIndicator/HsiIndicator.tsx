/**
 * HSI（Horizontal Situation Indicator）。
 * 実機の外観再現ではなく、学習に必要な要素だけを持つ。
 *
 * 層の構造がこの計器の本質。実機の考え方をそのまま形にしてある。
 *
 *   固定層（絶対に回さない）
 *     ├ ラバーライン（機首指標）
 *     └ 自機シンボル（常に上向き）
 *   回転層1  rotate(-heading)   コンパスローズ
 *     └ 回転層2  rotate(course) コース矢印・CDI・TO/FROM（一体で回る）
 *
 * この入れ子にしてあるので、
 * - Heading を変えるとローズごとコース矢印も回る
 * - Course を変えるとコース矢印とCDIだけが回る
 * が、条件分岐なしに構造から出てくる。
 */

import { useContinuousAngle } from '../../app/useContinuousAngle';
import { formatBearing, toRadians } from '../../domain/hsi/angles';
import type { HsiDerivedState, HsiState, VisibleElements } from '../../domain/hsi/types';
import './HsiIndicator.css';

/** 説明のために注目させられる部品。 */
export type HsiPart = 'rose' | 'lubber' | 'aircraft' | 'courseArrow' | 'cdi' | 'toFrom';

/*
 * 半径の配置。外側から内側へ。
 * ローズの数字（80）はコース矢印の頭（72）より外に置き、
 * コースを回しても数字が隠れないようにしている。
 */
const SIZE = 240;
const C = SIZE / 2;
const BEZEL_R = 112;
const FACE_R = 105;
const TICK_R = 102;
const LABEL_R = 80;
const COURSE_HEAD_TIP_R = 72;
const COURSE_HEAD_BASE_R = 58;
const TO_FROM_OUTER_R = 48;
const TO_FROM_INNER_R = 36;
const CDI_BAR_R = 30;

/** CDIが振り切れたときの横移動量（px）。ドットは半分ごとに置く。 */
const CDI_FULL_PX = 32;
const DOT_STEP = CDI_FULL_PX / 2;

const TICKS = Array.from({ length: 36 }, (_, i) => i * 10);

const ROSE_LABELS = [
  { deg: 0, text: 'N' },
  { deg: 30, text: '3' },
  { deg: 60, text: '6' },
  { deg: 90, text: 'E' },
  { deg: 120, text: '12' },
  { deg: 150, text: '15' },
  { deg: 180, text: 'S' },
  { deg: 210, text: '21' },
  { deg: 240, text: '24' },
  { deg: 270, text: 'W' },
  { deg: 300, text: '30' },
  { deg: 330, text: '33' },
];

/** 固定の指標を置く角度。ラバーライン以外の目安。 */
const FIXED_MARKS = [45, 90, 135, 180, 225, 270, 315];

/** 中心を原点として、方位 deg・半径 r の点を viewBox 座標で返す。 */
function polar(deg: number, r: number): { x: number; y: number } {
  const rad = toRadians(deg);
  return { x: C + Math.sin(rad) * r, y: C - Math.cos(rad) * r };
}

export interface HsiIndicatorProps {
  state: HsiState;
  derived: HsiDerivedState;
  visible: Pick<
    VisibleElements,
    'rose' | 'headingReadout' | 'courseArrow' | 'courseReadout' | 'cdi' | 'toFrom'
  >;
  /** スライダーを動かしている最中は短く、それ以外はゆっくり動かす。 */
  motion?: 'calm' | 'fast';
  /** 指定した部品だけを明るく残し、他を落とす。 */
  spotlight?: HsiPart | null;
}

export function HsiIndicator({
  state,
  derived,
  visible,
  motion = 'calm',
  spotlight = null,
}: HsiIndicatorProps) {
  // 359°→0° で1周ぶん逆回転しないよう、回転角は連続値に展開してから渡す。
  const roseRotation = useContinuousAngle(derived.roseRotationDeg);
  const courseRotation = useContinuousAngle(derived.courseRotationDeg);

  const partClass = (part: HsiPart, extra = '') => {
    const dimmed = spotlight !== null && spotlight !== part;
    return ['hsi-part', extra, dimmed ? 'is-dimmed' : ''].filter(Boolean).join(' ');
  };

  const showNeedle = visible.cdi && derived.cdiDirection !== 'OFF';
  const needleShift = derived.cdiDeflectionNormalized * CDI_FULL_PX;

  return (
    <div className="hsi">
      {(visible.headingReadout || visible.courseReadout) && (
        <div className="hsi__readouts">
          {visible.headingReadout && (
            <div className="hsi__readout hsi__readout--heading">
              <span className="mono-label">HDG / 機首方位</span>
              <span className="readout">{formatBearing(state.headingDeg)}°</span>
            </div>
          )}
          {visible.courseReadout && (
            <div className="hsi__readout hsi__readout--course">
              <span className="mono-label">CRS / コース</span>
              <span className="readout">{formatBearing(state.courseDeg)}°</span>
            </div>
          )}
        </div>
      )}

      <div className="hsi__face-wrap">
        <svg
          className="hsi__face"
          data-motion={motion}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={`HSIの表示。機首 ${formatBearing(state.headingDeg)}度、コース ${formatBearing(
            state.courseDeg,
          )}度。`}
        >
          <circle cx={C} cy={C} r={BEZEL_R} className="hsi-bezel" />
          <circle cx={C} cy={C} r={FACE_R} className="hsi-face" />

          {/* ---- 回転層1: コンパスローズ。回転の源は -heading だけ ---- */}
          {visible.rose && (
            <g
              className={partClass('rose', 'hsi-rotor')}
              style={{ transform: `rotate(${roseRotation}deg)` }}
            >
              {TICKS.map((deg) => {
                const major = deg % 30 === 0;
                const outer = polar(deg, TICK_R);
                const inner = polar(deg, TICK_R - (major ? 13 : 7));
                return (
                  <line
                    key={deg}
                    x1={outer.x}
                    y1={outer.y}
                    x2={inner.x}
                    y2={inner.y}
                    className={major ? 'hsi-tick hsi-tick--major' : 'hsi-tick'}
                  />
                );
              })}

              {ROSE_LABELS.map(({ deg, text }) => (
                // ローズと一緒に数字も回る。実機の回転カードと同じ見え方。
                <g key={deg} transform={`rotate(${deg} ${C} ${C})`}>
                  <text
                    x={C}
                    y={C - LABEL_R}
                    className={
                      text.length === 1 ? 'hsi-rose-label hsi-rose-label--cardinal' : 'hsi-rose-label'
                    }
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {text}
                  </text>
                </g>
              ))}

              {/* ---- 回転層2: コース矢印・CDI・TO/FROM。ローズの内側で course だけ回る ---- */}
              {visible.courseArrow && (
                <g
                  className="hsi-rotor hsi-course-layer"
                  style={{ transform: `rotate(${courseRotation}deg)` }}
                >
                  <g className={partClass('courseArrow')}>
                    {/* 頭。コースの進む向きを指す。 */}
                    <polygon
                      points={`${C},${C - COURSE_HEAD_TIP_R} ${C - 11},${C - COURSE_HEAD_BASE_R} ${
                        C + 11
                      },${C - COURSE_HEAD_BASE_R}`}
                      className="hsi-course-head"
                    />
                    {/* 尾。頭と同じ距離に置き、コース線が計器を貫いて見えるようにする。 */}
                    <line
                      x1={C}
                      y1={C + COURSE_HEAD_BASE_R}
                      x2={C}
                      y2={C + COURSE_HEAD_TIP_R}
                      className="hsi-course-shaft"
                    />
                    <line
                      x1={C - 11}
                      y1={C + COURSE_HEAD_TIP_R - 4}
                      x2={C + 11}
                      y2={C + COURSE_HEAD_TIP_R - 4}
                      className="hsi-course-shaft"
                    />
                  </g>

                  {visible.cdi && (
                    <g className={partClass('cdi')}>
                      {[-2, -1, 1, 2].map((step) => (
                        <circle
                          key={step}
                          cx={C + step * DOT_STEP}
                          cy={C}
                          r={3.6}
                          className="hsi-dot"
                        />
                      ))}
                      {showNeedle && (
                        <line
                          x1={C}
                          y1={C - CDI_BAR_R}
                          x2={C}
                          y2={C + CDI_BAR_R}
                          className={
                            derived.toFromBoundary ? 'hsi-cdi-bar hsi-cdi-bar--weak' : 'hsi-cdi-bar'
                          }
                          style={{ transform: `translateX(${needleShift}px)` }}
                        />
                      )}
                    </g>
                  )}

                  {visible.toFrom && !derived.toFromBoundary && (
                    <g className={partClass('toFrom')}>
                      {/* 三角はコース矢印の頭の側（TO）か尾の側（FROM）を向く。 */}
                      {derived.toFrom === 'TO' && (
                        <polygon
                          points={`${C},${C - TO_FROM_OUTER_R} ${C - 9},${C - TO_FROM_INNER_R} ${
                            C + 9
                          },${C - TO_FROM_INNER_R}`}
                          className="hsi-toFrom hsi-toFrom--to"
                        />
                      )}
                      {derived.toFrom === 'FROM' && (
                        <polygon
                          points={`${C},${C + TO_FROM_OUTER_R} ${C - 9},${C + TO_FROM_INNER_R} ${
                            C + 9
                          },${C + TO_FROM_INNER_R}`}
                          className="hsi-toFrom hsi-toFrom--from"
                        />
                      )}
                    </g>
                  )}
                </g>
              )}
            </g>
          )}

          {/* ---- 固定層。ここは何があっても回さない ---- */}
          <g className={partClass('lubber')}>
            <polygon
              points={`${C},${C - 99} ${C - 9},${C - 113} ${C + 9},${C - 113}`}
              className="hsi-lubber"
            />
            {FIXED_MARKS.map((deg) => {
              const outer = polar(deg, FACE_R);
              const inner = polar(deg, FACE_R - 7);
              return (
                <line
                  key={deg}
                  x1={outer.x}
                  y1={outer.y}
                  x2={inner.x}
                  y2={inner.y}
                  className="hsi-fixed-mark"
                />
              );
            })}
          </g>

          <g className={partClass('aircraft')}>
            {/* 自機シンボルは常に上向き。回転層の外にあるので絶対に回らない。 */}
            <line x1={C} y1={C - 13} x2={C} y2={C + 11} className="hsi-aircraft" />
            <line x1={C - 11} y1={C} x2={C + 11} y2={C} className="hsi-aircraft" />
            <line x1={C - 5} y1={C + 8} x2={C + 5} y2={C + 8} className="hsi-aircraft" />
          </g>
        </svg>
      </div>
    </div>
  );
}

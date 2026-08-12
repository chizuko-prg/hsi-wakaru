/**
 * いまの状況を文にして出す。
 *
 * Lesson 4 の要。CDIの左右だけを見て答える癖がつかないよう、
 * 「コースはどちら側か」と「いま近づいているか」を必ず分けて示す。
 * この2つは別の情報で、前者だけでは後者は決まらない。
 */

import { COURSE_ALIGNED_EPS_DEG } from '../../domain/hsi/constants';
import { cdiLabel, trendLabel } from '../../domain/hsi/describeState';
import type { HsiDerivedState, HsiState } from '../../domain/hsi/types';
import './SituationStatus.css';

export interface SituationStatusProps {
  state: HsiState;
  derived: HsiDerivedState;
  /** 機首とコースの差がこの値以内なら「合っている」とみなす。 */
  alignmentToleranceDeg?: number;
}

export function SituationStatus({
  state,
  derived,
  alignmentToleranceDeg = COURSE_ALIGNED_EPS_DEG,
}: SituationStatusProps) {
  const aligned = derived.interceptAngleDeg <= alignmentToleranceDeg;
  const relative = Math.round(derived.courseRelativeDeg);

  const headingText = aligned
    ? '機首はコースに合っています'
    : `コースは機首から${relative > 0 ? '右' : '左'}へ${Math.abs(relative)}°`;

  return (
    <section className="situation" aria-label="いまの状況">
      <span className="mono-label">SITUATION / いまの状況</span>

      <dl className="situation__list">
        <div className="situation__row">
          <dt className="situation__key">コースの位置</dt>
          <dd className="situation__value">
            {derived.cdiDirection === 'CENTER'
              ? 'コース線の上にいる'
              : `${cdiLabel(derived.cdiDirection, derived.toFromBoundary)}にある`}
          </dd>
        </div>

        <div className="situation__row">
          <dt className="situation__key">機首とコース</dt>
          <dd className="situation__value" data-aligned={aligned}>
            {headingText}
          </dd>
        </div>

        {/* ここが本題。CDIの左右からは決まらない。 */}
        <div className="situation__row situation__row--trend">
          <dt className="situation__key">いま</dt>
          <dd className="situation__value" data-trend={derived.interceptTrend}>
            {trendLabel(derived.interceptTrend)}
          </dd>
        </div>
      </dl>

      {/* 風があるときだけ、機首と実際に進む方向が違うことを添える。 */}
      {state.wind !== null && Math.abs(derived.driftAngleDeg) >= 0.5 && (
        <p className="note-text situation__note">
          風で流されているため、実際に進んでいる方向は機首とは違います。
        </p>
      )}
    </section>
  );
}

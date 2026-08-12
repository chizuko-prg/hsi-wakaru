/**
 * 動かす手順で「何が変わって、何が変わっていないか」を並べて見せる。
 *
 * Lesson 2 の学習内容そのもの。
 * 計器の見た目だけだと「変わらなかった」ことは気づきにくいので、
 * 開始時の値といまの値を数字で残しておく。
 */

import { formatBearing, signedAngleDiff } from '../../domain/hsi/angles';
import './ChangeWatch.css';

export interface ChangeWatchRow {
  /** "HDG" のような短い名前。 */
  label: string;
  /** "機首方位" のような日本語。 */
  sublabel: string;
  startDeg: number;
  currentDeg: number;
  tone: 'heading' | 'course' | 'position';
}

/** 1度でも動いたか。丸め誤差で「動いた」と言わないよう少し余裕を持たせる。 */
function hasChanged(startDeg: number, currentDeg: number): boolean {
  return Math.abs(signedAngleDiff(currentDeg, startDeg)) >= 0.5;
}

export function ChangeWatch({ rows }: { rows: ChangeWatchRow[] }) {
  return (
    <section className="change-watch" aria-label="変わったもの、変わらないもの">
      <span className="mono-label">WATCH / 見くらべる</span>

      <ul className="change-watch__list">
        {rows.map((row) => {
          const changed = hasChanged(row.startDeg, row.currentDeg);

          return (
            <li key={row.label} className="change-watch__row" data-tone={row.tone}>
              <span className="change-watch__name mono-label">
                {row.label} / {row.sublabel}
              </span>

              <span className="change-watch__values">
                <span className="change-watch__start">{formatBearing(row.startDeg)}°</span>
                <span className="change-watch__arrow" aria-hidden="true">
                  →
                </span>
                <span className="change-watch__current readout-sm">
                  {formatBearing(row.currentDeg)}°
                </span>
              </span>

              {/* 色だけに頼らず、必ず文字でも示す。 */}
              <span className="change-watch__mark" data-changed={changed}>
                {changed ? '変わった' : '変わっていない'}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

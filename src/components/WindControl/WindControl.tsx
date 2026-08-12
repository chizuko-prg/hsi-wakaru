/**
 * 風の条件を変える操作。
 *
 * 風向はスライダー、風速は決め打ちの選択にしてある。
 * 細かい数字を合わせる作業ではなく、「向きと強さが変わると流され方が変わる」
 * ことを体験してもらうための操作なので、刻みを細かくしない。
 */

import { formatBearing } from '../../domain/hsi/angles';
import { WIND_SPEEDS_KT } from '../../domain/hsi/constants';
import type { Wind } from '../../domain/hsi/types';
import { AngleSlider } from '../AngleSlider/AngleSlider';
import './WindControl.css';

export interface WindControlProps {
  wind: Wind | null;
  onChange: (wind: Wind | null) => void;
  onInteract?: () => void;
}

export function WindControl({ wind, onChange, onInteract }: WindControlProps) {
  const current: Wind = wind ?? { fromDeg: 0, speedKt: 0 };

  const setSpeed = (speedKt: number) => {
    onInteract?.();
    // 0kt は「風なし」として扱い、無風の状態と同じにする。
    onChange(speedKt === 0 ? null : { ...current, speedKt });
  };

  return (
    <div className="wind-control">
      <AngleSlider
        id="lesson-wind"
        label="WIND"
        sublabel="風が吹いてくる方向"
        tone="wind"
        value={current.fromDeg}
        onChange={(deg) => {
          onInteract?.();
          onChange({ fromDeg: deg, speedKt: current.speedKt });
        }}
        onInteract={onInteract}
        hint={
          current.speedKt === 0
            ? '風速が 0 のあいだは、向きを変えても何も起きません。'
            : `${formatBearing(current.fromDeg)}° から ${current.speedKt}kt の風。`
        }
      />

      <div className="wind-control__speeds">
        <span className="mono-label">SPEED / 風の強さ</span>
        <div className="wind-control__buttons">
          {WIND_SPEEDS_KT.map((speedKt) => (
            <button
              key={speedKt}
              type="button"
              className="wind-control__speed"
              aria-pressed={current.speedKt === speedKt}
              onClick={() => setSpeed(speedKt)}
            >
              {speedKt === 0 ? '無風' : `${speedKt}kt`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

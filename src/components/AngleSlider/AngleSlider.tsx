/**
 * 方位を選ぶスライダー。Heading / Course / 位置 で共通に使う。
 *
 * ネイティブの range を使う理由:
 * キーボード操作・読み上げ・タップ判定がそのまま手に入り、
 * ドラッグしないと操作できない部品を作らずに済むため。
 *
 * 0..359 の端（359→360=0）ではつまみが端から端へ飛ぶ。
 * 少しだけ動かしたい場合のために ±1 / ±10 のボタンを併設する。
 */

import { formatBearing, normalize360 } from '../../domain/hsi/angles';
import './AngleSlider.css';

export type AngleSliderTone = 'heading' | 'course' | 'position';

export interface AngleSliderProps {
  id: string;
  /** 英語monoの短い名前。例: "HDG" */
  label: string;
  /** 日本語の説明。例: "機首方位" */
  sublabel: string;
  value: number;
  onChange: (deg: number) => void;
  /** 操作が始まったことを知らせる。計器の動きを短くするために使う。 */
  onInteract?: () => void;
  tone?: AngleSliderTone;
  hint?: string;
}

const STEPS = [-10, -1, 1, 10];

export function AngleSlider({
  id,
  label,
  sublabel,
  value,
  onChange,
  onInteract,
  tone = 'heading',
  hint,
}: AngleSliderProps) {
  const normalized = normalize360(Math.round(value));
  const display = `${formatBearing(normalized)}°`;

  const change = (next: number) => {
    onInteract?.();
    onChange(normalize360(next));
  };

  return (
    <div className="angle-slider" data-tone={tone}>
      <div className="angle-slider__head">
        <label className="mono-label" htmlFor={id}>
          {label} / {sublabel}
        </label>
        <span className="angle-slider__value readout">{display}</span>
      </div>

      <input
        id={id}
        className="angle-slider__range"
        type="range"
        min={0}
        max={359}
        step={1}
        value={normalized}
        aria-valuetext={`${normalized}度`}
        onChange={(event) => change(Number(event.target.value))}
      />

      <div className="angle-slider__steps">
        {STEPS.map((step) => (
          <button
            key={step}
            type="button"
            className="angle-slider__step"
            onClick={() => change(normalized + step)}
            aria-label={`${sublabel}を${step > 0 ? `${step}度右へ` : `${Math.abs(step)}度左へ`}`}
          >
            {step > 0 ? `+${step}` : step}
          </button>
        ))}
      </div>

      {hint && <p className="note-text angle-slider__hint">{hint}</p>}
    </div>
  );
}

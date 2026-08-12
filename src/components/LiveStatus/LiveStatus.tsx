/**
 * いまの状態を文でも伝える。
 * 針の位置や色だけに頼らないための表示で、画面に1つだけ置く。
 *
 * 読み上げはスライダー操作中に連続して出ると邪魔になるので、
 * 値が落ち着いてから流す。目で読む文字はすぐに更新する。
 */

import { useDebouncedValue } from '../../app/useDebouncedValue';
import './LiveStatus.css';

export function LiveStatus({ text }: { text: string }) {
  const announced = useDebouncedValue(text, 600);

  return (
    <p className="live-status">
      <span className="mono-label">STATUS</span>
      <span className="live-status__text">{text}</span>
      <span className="visually-hidden" role="status" aria-live="polite">
        {announced}
      </span>
    </p>
  );
}

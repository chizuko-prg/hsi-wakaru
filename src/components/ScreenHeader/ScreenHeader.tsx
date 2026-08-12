/** 画面上部の共通ヘッダー。戻る手段を必ず持たせる（行き止まりを作らない）。 */

import './ScreenHeader.css';

export interface ScreenHeaderProps {
  title: string;
  monoLabel: string;
  onBack: () => void;
  backLabel?: string;
  /** 「2 / 6」のような進み具合。 */
  progressText?: string;
  progressRatio?: number;
}

export function ScreenHeader({
  title,
  monoLabel,
  onBack,
  backLabel = '戻る',
  progressText,
  progressRatio,
}: ScreenHeaderProps) {
  return (
    <header className="screen-header">
      <div className="screen-header__row">
        <button type="button" className="screen-header__back" onClick={onBack}>
          ← {backLabel}
        </button>
        {progressText && <span className="screen-header__progress mono-label">{progressText}</span>}
      </div>
      <div className="screen-header__titles">
        <span className="mono-label">{monoLabel}</span>
        <h1 className="screen-title">{title}</h1>
      </div>
      {progressRatio !== undefined && (
        <div
          className="screen-header__bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressRatio * 100)}
        >
          <div className="screen-header__bar-fill" style={{ width: `${progressRatio * 100}%` }} />
        </div>
      )}
    </header>
  );
}

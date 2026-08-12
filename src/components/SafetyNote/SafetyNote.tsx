/** 学習専用であることの表示。省略しない。 */

export type SafetyNoteVariant = 'top' | 'learning';

export function SafetyNote({ variant }: { variant: SafetyNoteVariant }) {
  // 学習画面では計器と説明を同時に見せたいので、帯を薄く小さくする。
  const className = variant === 'top' ? 'safety-strip' : 'safety-strip safety-strip--compact';

  return (
    <p className={className}>
      <span className="mono-label">STUDY ONLY</span>
      <span>
        {variant === 'top' ? '学習専用。実際の飛行判断・航法には使用できません。' : '学習専用'}
      </span>
    </p>
  );
}

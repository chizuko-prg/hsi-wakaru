/**
 * 説明カード。手順の言葉はすべてここに出す。
 * 種類で見た目を変えるだけで、文言はレッスンデータ側が持つ。
 */

import type { LessonTerm } from '../../lessons/lessonTypes';
import './ExplanationCard.css';

export type ExplanationKind = 'normal' | 'aha' | 'hint' | 'success';

export interface ExplanationCardProps {
  kind: ExplanationKind;
  /** 英語monoの小ラベル。 */
  monoLabel?: string;
  heading?: string;
  lines: string[];
  /** 用語カード。名前から役割を想像できるように、意味を必ず添える。 */
  terms?: LessonTerm[];
  note?: string;
}

const DEFAULT_LABEL: Record<ExplanationKind, string> = {
  normal: 'POINT / 説明',
  aha: 'KEY / ここが大事',
  hint: 'HINT / 手がかり',
  success: 'OK / 正解',
};

export function ExplanationCard({
  kind,
  monoLabel,
  heading,
  lines,
  terms,
  note,
}: ExplanationCardProps) {
  return (
    <section className={`explanation explanation--${kind}`}>
      <span className="mono-label">{monoLabel ?? DEFAULT_LABEL[kind]}</span>
      {heading && <h2 className="card-heading">{heading}</h2>}

      {lines.map((line) => (
        <p key={line} className="body-text">
          {line}
        </p>
      ))}

      {terms?.map((term) => (
        <dl key={term.abbr} className="explanation__term">
          <dt className="explanation__term-name">
            {term.abbr}
            <span className="explanation__term-full">{term.full}</span>
          </dt>
          <dd className="explanation__term-desc">{term.description}</dd>
        </dl>
      ))}

      {note && <p className="note-text">{note}</p>}
    </section>
  );
}

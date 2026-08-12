/**
 * 選択式の確認問題の選択肢。
 *
 * 間違えても行き止まりにしない。正解するまで何度でも選べる。
 * 色だけで正誤を伝えず、必ず文字でも示す。
 */

import type { LessonChoice } from '../../lessons/lessonTypes';
import './ChoiceList.css';

export interface ChoiceListProps {
  choices: LessonChoice[];
  /** いま選ばれている選択肢。まだ答えていなければ null。 */
  selectedId: string | null;
  correctId: string;
  /** 正解済みかどうか。正解後は選び直せないようにする。 */
  solved: boolean;
  onSelect: (choiceId: string) => void;
}

const OPTION_LABELS = ['OPTION A', 'OPTION B', 'OPTION C', 'OPTION D'];

export function ChoiceList({ choices, selectedId, correctId, solved, onSelect }: ChoiceListProps) {
  return (
    <ul className="choice-list">
      {choices.map((choice, index) => {
        const chosen = selectedId === choice.id;
        const isCorrect = choice.id === correctId;

        // 正解した後だけ、どれが正解だったかを示す。
        const state = solved && isCorrect ? 'correct' : chosen && !solved ? 'again' : 'idle';

        return (
          <li key={choice.id}>
            <button
              type="button"
              className="choice"
              data-state={state}
              disabled={solved}
              onClick={() => onSelect(choice.id)}
            >
              <span className="mono-label">{OPTION_LABELS[index] ?? `OPTION ${index + 1}`}</span>
              <span className="choice__label">{choice.label}</span>
              {state === 'correct' && <span className="choice__mark">正解</span>}
              {state === 'again' && <span className="choice__mark">もう一度</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

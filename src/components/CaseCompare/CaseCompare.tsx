/**
 * 複数の状態を並べて見くらべる。
 *
 * Lesson 4 でこれを使う理由:
 * CDIの振れ方がまったく同じでも、機首が違えば起きていることは違う。
 * 1つずつ順番に見せると気づけないので、同じ画面に並べて置く。
 *
 * 表示する値はすべて deriveHsiState から作る。
 * レッスンデータ側に「答え」を書き写さない。
 */

import { formatBearing } from '../../domain/hsi/angles';
import { deriveHsiState } from '../../domain/hsi/deriveHsiState';
import { cdiLabel, trendLabel } from '../../domain/hsi/describeState';
import type { HsiState, VisibleElements } from '../../domain/hsi/types';
import { buildCaseState, type CaseReadout, type LessonCase } from '../../lessons/lessonTypes';
import { HsiIndicator } from '../HsiIndicator/HsiIndicator';
import { PlanView } from '../PlanView/PlanView';
import './CaseCompare.css';

export interface CaseCompareProps {
  cases: LessonCase[];
  baseState: HsiState;
  visible: VisibleElements;
}

const READOUT_LABEL: Record<CaseReadout, string> = {
  heading: '機首',
  course: 'コース',
  cdi: 'CDI',
  trend: 'いま',
};

export function CaseCompare({ cases, baseState, visible }: CaseCompareProps) {
  // 並べるときは数値窓を出さない。読み取り行に同じ値が二重に出るのを避ける。
  const caseVisible: VisibleElements = {
    ...visible,
    headingReadout: false,
    courseReadout: false,
  };

  return (
    <section className="case-compare" aria-label="見くらべ">
      <ul className="case-compare__list">
        {cases.map((lessonCase) => {
          const state = buildCaseState(lessonCase, baseState);
          const derived = deriveHsiState(state);

          const value = (readout: CaseReadout): string => {
            switch (readout) {
              case 'heading':
                return `${formatBearing(state.headingDeg)}°`;
              case 'course':
                return `${formatBearing(state.courseDeg)}°`;
              case 'cdi':
                return derived.cdiDirection === 'CENTER'
                  ? '中央'
                  : `${cdiLabel(derived.cdiDirection, derived.toFromBoundary)}に振れる`;
              case 'trend':
                return trendLabel(derived.interceptTrend);
            }
          };

          return (
            <li key={lessonCase.id} className="case-compare__case">
              <h3 className="case-compare__label">{lessonCase.label}</h3>

              <div className="case-compare__views">
                <HsiIndicator state={state} derived={derived} visible={caseVisible} motion="calm" />
                {visible.planView && (
                  <PlanView state={state} derived={derived} visible={visible} compact />
                )}
              </div>

              <dl className="case-compare__readouts">
                {lessonCase.readouts.map((readout) => (
                  <div key={readout} className="case-compare__readout">
                    <dt className="mono-label">{READOUT_LABEL[readout]}</dt>
                    <dd
                      className="case-compare__value"
                      data-readout={readout}
                      data-trend={readout === 'trend' ? derived.interceptTrend : undefined}
                    >
                      {value(readout)}
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

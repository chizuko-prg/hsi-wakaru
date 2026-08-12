/**
 * 学習画面。
 *
 * レッスン固有の分岐はここに書かない。手順の種類ごとの出し分けだけを行い、
 * 文言・見せる部品・初期状態はすべてレッスンデータが持つ。
 * 修了表示も別ルートにせず、この画面の最後の状態として出す。
 */

import { useEffect, useMemo, useState } from 'react';
import { ROUTES, lessonPath } from '../app/routes';
import { useInstrumentMotion } from '../app/useInstrumentMotion';
import { aircraftRadialOf, useHsiState } from '../app/useHsiState';
import { useProgress } from '../app/useProgress';
import { AngleSlider } from '../components/AngleSlider/AngleSlider';
import { ChoiceList } from '../components/ChoiceList/ChoiceList';
import { ExplanationCard } from '../components/ExplanationCard/ExplanationCard';
import { HsiIndicator } from '../components/HsiIndicator/HsiIndicator';
import { LessonComplete } from '../components/LessonComplete/LessonComplete';
import { SafetyNote } from '../components/SafetyNote/SafetyNote';
import { ScreenHeader } from '../components/ScreenHeader/ScreenHeader';
import { signedAngleDiff } from '../domain/hsi/angles';
import type { HsiState } from '../domain/hsi/types';
import {
  attemptOf,
  countCorrectOnFirstTry,
  withAnswer,
  type QuizAttempts,
} from '../lessons/lessonScore';
import { resolveStartStepIndex } from '../lessons/lessonResume';
import {
  buildStepState,
  countScoredQuizSteps,
  type InteractControl,
  type InteractStep,
  type LessonDefinition,
} from '../lessons/lessonTypes';
import type { PageProps } from './pageProps';
import './LessonPage.css';

export interface LessonPageProps extends PageProps {
  lesson: LessonDefinition;
}

const CONTROL_LABEL: Record<InteractControl, { label: string; sublabel: string }> = {
  heading: { label: 'HDG', sublabel: '機首方位' },
  course: { label: 'CRS', sublabel: 'コース' },
  position: { label: 'POS', sublabel: '自機の位置' },
};

/** その手順で動かす値が、初期状態からどれだけ変わったか。 */
function changedAmountDeg(
  control: InteractControl,
  current: HsiState,
  initial: HsiState,
  currentRadial: number,
  initialRadial: number,
): number {
  switch (control) {
    case 'heading':
      return Math.abs(signedAngleDiff(current.headingDeg, initial.headingDeg));
    case 'course':
      return Math.abs(signedAngleDiff(current.courseDeg, initial.courseDeg));
    case 'position':
      return Math.abs(signedAngleDiff(currentRadial, initialRadial));
  }
}

export function LessonPage({ navigate, lesson }: LessonPageProps) {
  const { progress, updateLesson } = useProgress();

  const [stepIndex, setStepIndex] = useState(() =>
    resolveStartStepIndex(lesson, progress.lessons[lesson.id]),
  );
  const [attempts, setAttempts] = useState<QuizAttempts>({});
  const [finished, setFinished] = useState(false);

  const hsi = useHsiState();
  const { motion, markInteracting } = useInstrumentMotion();

  const step = lesson.steps[stepIndex];
  const stepInitial = useMemo(() => buildStepState(step, lesson.baseState), [step, lesson.baseState]);

  // 手順が変わるたびに、その手順の初期状態から始め直す。
  const { reset } = hsi;
  useEffect(() => {
    reset(stepInitial);
  }, [reset, stepInitial]);

  // 再開できるよう、いま見ている手順を記録する。回答内容は保存しない。
  useEffect(() => {
    if (finished) return;
    updateLesson(lesson.id, { status: 'in_progress', lastStepId: step.id });
  }, [finished, lesson.id, step.id, updateLesson]);

  const totalScored = countScoredQuizSteps(lesson);
  const score = countCorrectOnFirstTry(lesson, attempts);

  const goNext = () => {
    if (stepIndex + 1 < lesson.steps.length) {
      setStepIndex(stepIndex + 1);
      return;
    }
    setFinished(true);
    updateLesson(lesson.id, {
      status: 'completed',
      lastStepId: undefined,
      completedAt: new Date().toISOString(),
    });
  };

  if (finished) {
    const nextId = lesson.nextLessonId;

    return (
      <LessonComplete
        lesson={lesson}
        score={score}
        total={totalScored}
        onReview={() => {
          setStepIndex(0);
          setAttempts({});
          setFinished(false);
        }}
        onBackToLessons={() => navigate(ROUTES.lessons)}
        onNext={nextId ? () => navigate(lessonPath(nextId)) : undefined}
      />
    );
  }

  const attempt = attemptOf(attempts, step.id);
  const currentRadial = aircraftRadialOf(hsi.state, hsi.derived);
  const initialRadial = aircraftRadialOf(stepInitial, hsi.derived);

  const interactStep = step.kind === 'interact' ? (step as InteractStep) : null;
  const movedDeg = interactStep
    ? changedAmountDeg(interactStep.control, hsi.state, stepInitial, currentRadial, initialRadial)
    : 0;
  const moved = interactStep ? movedDeg >= (interactStep.requiredChangeDeg ?? 10) : false;

  const canGoNext = step.kind === 'quiz' ? attempt.solved : interactStep ? moved : true;

  const nextLabel =
    step.kind === 'quiz'
      ? '次へ'
      : (step.kind === 'teach' || step.kind === 'interact' || step.kind === 'summary') &&
          step.nextLabel
        ? step.nextLabel
        : '次へ';

  return (
    <div className="stack">
      <ScreenHeader
        title={step.title}
        monoLabel={`${lesson.monoLabel} / ${lesson.title}`}
        onBack={() => navigate(ROUTES.lessons)}
        backLabel="レッスン一覧"
        progressText={`${stepIndex + 1} / ${lesson.steps.length}`}
        progressRatio={(stepIndex + 1) / lesson.steps.length}
      />

      <SafetyNote variant="learning" />

      <HsiIndicator
        state={hsi.state}
        derived={hsi.derived}
        visible={step.visible}
        motion={motion}
        spotlight={step.spotlight ?? null}
      />

      {interactStep && (
        <AngleSlider
          id={`lesson-${interactStep.control}`}
          label={CONTROL_LABEL[interactStep.control].label}
          sublabel={CONTROL_LABEL[interactStep.control].sublabel}
          tone={interactStep.control}
          value={
            interactStep.control === 'heading'
              ? hsi.state.headingDeg
              : interactStep.control === 'course'
                ? hsi.state.courseDeg
                : currentRadial
          }
          onChange={
            interactStep.control === 'heading'
              ? hsi.setHeading
              : interactStep.control === 'course'
                ? hsi.setCourse
                : (deg) => hsi.setAircraftRadial(deg)
          }
          onInteract={markInteracting}
        />
      )}

      {step.kind === 'teach' && (
        <ExplanationCard
          kind={step.explanationKind}
          heading={step.title}
          lines={step.lines}
          terms={step.terms}
          note={step.note}
        />
      )}

      {interactStep && (
        <ExplanationCard
          kind={moved ? 'success' : 'normal'}
          monoLabel={moved ? 'FOUND / 気づき' : 'TRY / やってみる'}
          heading={step.title}
          lines={moved ? [interactStep.changeNote] : interactStep.lines}
        />
      )}

      {step.kind === 'summary' && (
        <ExplanationCard kind="normal" monoLabel="SUMMARY / まとめ" heading={step.title} lines={step.lines} />
      )}

      {step.kind === 'quiz' && (
        <section className="lesson-quiz stack-tight">
          <p className="lesson-quiz__prompt">{step.prompt}</p>

          <ChoiceList
            choices={step.choices}
            selectedId={attempt.selectedChoiceId}
            correctId={step.correctChoiceId}
            solved={attempt.solved}
            onSelect={(choiceId) =>
              setAttempts((prev) =>
                withAnswer(prev, step.id, choiceId, choiceId === step.correctChoiceId),
              )
            }
          />

          {attempt.solved && (
            <ExplanationCard kind="success" heading="そのとおりです" lines={[step.why]} />
          )}

          {/* 間違えるたびに手がかりを1つずつ増やす。強い否定表現は使わない。 */}
          {!attempt.solved && attempt.wrongCount > 0 && (
            <ExplanationCard
              kind="hint"
              heading="もう一度見てみましょう"
              lines={step.hints.slice(0, attempt.wrongCount)}
            />
          )}
        </section>
      )}

      {canGoNext ? (
        <button type="button" className="button-primary" onClick={goNext}>
          {nextLabel}
          <span className="mono-label">
            {stepIndex + 1 === lesson.steps.length ? 'FINISH' : 'NEXT'}
          </span>
        </button>
      ) : (
        <p className="lesson-hold note-text">
          {interactStep
            ? 'つまみを動かして、計器の変化を見てから次へ進みます。'
            : '選択肢から選ぶと、次へ進めます。'}
        </p>
      )}
    </div>
  );
}

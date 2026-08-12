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
import { CaseCompare } from '../components/CaseCompare/CaseCompare';
import { ChangeWatch, type ChangeWatchRow } from '../components/ChangeWatch/ChangeWatch';
import { ChoiceList } from '../components/ChoiceList/ChoiceList';
import { ExplanationCard } from '../components/ExplanationCard/ExplanationCard';
import { HsiIndicator } from '../components/HsiIndicator/HsiIndicator';
import { LessonComplete } from '../components/LessonComplete/LessonComplete';
import { PlanView } from '../components/PlanView/PlanView';
import { SafetyNote } from '../components/SafetyNote/SafetyNote';
import { ScreenHeader } from '../components/ScreenHeader/ScreenHeader';
import { SituationStatus } from '../components/SituationStatus/SituationStatus';
import { WindControl } from '../components/WindControl/WindControl';
import { signedAngleDiff } from '../domain/hsi/angles';
import { deriveHsiState } from '../domain/hsi/deriveHsiState';
import type { HsiState, VisibleElements } from '../domain/hsi/types';
import {
  attemptOf,
  countCorrectOnFirstTry,
  withAnswer,
  type QuizAttempts,
} from '../lessons/lessonScore';
import { LESSON_CATALOG } from '../lessons/lessonCatalog';
import { resolveStartStepIndex } from '../lessons/lessonResume';
import { countCompletedLessons } from '../storage/progressStorage';
import {
  buildStepState,
  countScoredQuizSteps,
  type LessonDefinition,
  type WatchTarget,
} from '../lessons/lessonTypes';
import type { PageProps } from './pageProps';
import './LessonPage.css';

export interface LessonPageProps extends PageProps {
  lesson: LessonDefinition;
}

const WATCH_LABEL: Record<WatchTarget, { label: string; sublabel: string }> = {
  heading: { label: 'HDG', sublabel: '機首方位' },
  course: { label: 'CRS', sublabel: 'コース' },
  position: { label: 'POS', sublabel: '自機の位置' },
  wind: { label: 'WIND', sublabel: '風の向き' },
  track: { label: 'TRK', sublabel: '進む方向' },
};

/**
 * その項目が指している角度。
 * 位置は「局から見た自機の方向」、進む方向は判定ロジックの算出値で表す。
 */
function watchValue(target: WatchTarget, state: HsiState): number {
  switch (target) {
    case 'heading':
      return state.headingDeg;
    case 'course':
      return state.courseDeg;
    case 'position':
      return aircraftRadialOf(state);
    case 'wind':
      return state.wind?.fromDeg ?? 0;
    case 'track':
      // 風の影響を含んだ実際の進行方向。ここでも判定ロジックを共有する。
      return deriveHsiState(state).trackDeg;
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
  const stepInitial = useMemo(
    () => buildStepState(step, lesson.baseState),
    [step, lesson.baseState],
  );

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
    // このレッスンを終えた時点で全部そろったなら、まとめの画面へ案内する。
    const courseCompleted = countCompletedLessons(progress) >= LESSON_CATALOG.length;

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
        courseCompleted={courseCompleted}
        onCourseComplete={() => navigate(ROUTES.courseComplete)}
      />
    );
  }

  const attempt = attemptOf(attempts, step.id);
  const interactStep = step.kind === 'interact' ? step : null;

  /*
   * 見せる部品。
   * 確認問題では、答えたあとにだけ足す部品がある（上空図の答え合わせ）。
   * 出題中に足してしまうと、計器を読まずに図で答えられてしまう。
   */
  const visible: VisibleElements =
    step.kind === 'quiz' && attempt.solved && step.revealVisible
      ? { ...step.visible, ...step.revealVisible }
      : step.visible;

  /*
   * 動かす手順を終えられる条件。3通りある。
   * - requiredTrend: 近づく状態を自分で作れたか（結果で見る）
   * - requiredCourseAlignmentDeg: 機首をコースへ合わせられたか
   * - どちらも無ければ、指定した角度ぶん動かしたか
   */
  const requiredChange = interactStep?.requiredChangeDeg ?? 10;
  const moved = !interactStep
    ? false
    : interactStep.requiredTrend !== undefined
      ? hsi.derived.interceptTrend === interactStep.requiredTrend
      : interactStep.requiredTrackAlignmentDeg !== undefined
        ? hsi.derived.trackCourseAngleDeg <= interactStep.requiredTrackAlignmentDeg
        : interactStep.requiredCourseAlignmentDeg !== undefined
          ? hsi.derived.interceptAngleDeg <= interactStep.requiredCourseAlignmentDeg
          : interactStep.controls.every(
              (control) =>
                Math.abs(
                  signedAngleDiff(
                    watchValue(control, hsi.state),
                    watchValue(control, stepInitial),
                  ),
                ) >= requiredChange,
            );

  const watchRows: ChangeWatchRow[] =
    interactStep?.watch?.map((target) => ({
      label: WATCH_LABEL[target].label,
      sublabel: WATCH_LABEL[target].sublabel,
      startDeg: watchValue(target, stepInitial),
      currentDeg: watchValue(target, hsi.state),
      tone: target === 'track' ? 'track' : target === 'wind' ? 'wind' : target,
    })) ?? [];

  const canGoNext = step.kind === 'quiz' ? attempt.solved : interactStep ? moved : true;
  const isLastStep = stepIndex + 1 === lesson.steps.length;

  const nextLabel = step.kind === 'quiz' ? '次へ' : (step.nextLabel ?? '次へ');

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

      {/* 見くらべの手順は、上に1つ出すのではなくケースごとに計器と図を持つ。 */}
      {step.kind === 'compare' ? (
        <>
          <ExplanationCard
            kind="normal"
            monoLabel="COMPARE / 見くらべる"
            heading={step.title}
            lines={step.lines}
          />
          <CaseCompare cases={step.cases} baseState={lesson.baseState} visible={step.visible} />
          {step.note && <ExplanationCard kind="aha" lines={[step.note]} />}
        </>
      ) : (
        <>
          <HsiIndicator
            state={hsi.state}
            derived={hsi.derived}
            visible={visible}
            motion={motion}
            spotlight={step.spotlight ?? null}
          />

          {visible.planView && (
            <PlanView state={hsi.state} derived={hsi.derived} visible={visible} />
          )}

          {step.situation && (
            <SituationStatus
              state={hsi.state}
              derived={hsi.derived}
              showTrack={visible.track}
            />
          )}
        </>
      )}

      {interactStep && (
        <div className="lesson-controls stack-tight">
          {interactStep.controls.map((control) =>
            control === 'wind' ? (
              <WindControl
                key={control}
                wind={hsi.state.wind}
                onChange={hsi.setWind}
                onInteract={markInteracting}
              />
            ) : (
              <AngleSlider
                key={control}
                id={`lesson-${control}`}
                label={WATCH_LABEL[control].label}
                sublabel={WATCH_LABEL[control].sublabel}
                tone={control}
                value={watchValue(control, hsi.state)}
                onChange={
                  control === 'heading'
                    ? hsi.setHeading
                    : control === 'course'
                      ? hsi.setCourse
                      : (deg) => hsi.setAircraftRadial(deg)
                }
                onInteract={markInteracting}
              />
            ),
          )}
        </div>
      )}

      {watchRows.length > 0 && <ChangeWatch rows={watchRows} />}

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
        <ExplanationCard
          kind="normal"
          monoLabel="SUMMARY / まとめ"
          heading={step.title}
          lines={step.lines}
        />
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
          <span className="mono-label">{isLastStep ? 'FINISH' : 'NEXT'}</span>
        </button>
      ) : (
        <p className="lesson-hold note-text">
          {!interactStep
            ? '選択肢から選ぶと、次へ進めます。'
            : interactStep.requiredTrend === 'closing'
              ? 'コースへ近づく向きを作ると、次へ進めます。'
              : interactStep.requiredTrackAlignmentDeg !== undefined
                ? '進む方向（TRK）をコースに合わせると、次へ進めます。'
                : interactStep.requiredCourseAlignmentDeg !== undefined
                  ? '機首をコースの向きに合わせると、次へ進めます。'
                  : interactStep.controls.length > 1
                    ? 'つまみを両方とも動かすと、次へ進めます。'
                    : 'つまみを動かして、計器の変化を見てから次へ進みます。'}
        </p>
      )}
    </div>
  );
}

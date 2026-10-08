import type {Draft, Stage} from './types.ts';
export function currentStage(draft: Draft): {stage: Stage; index: number; remaining: number; elapsed: number} {
  let ms = Math.min(draft.elapsedMs, draft.course.plannedDurationSeconds * 1000);
  for (let i = 0; i < draft.course.stages.length; i++) {
    const stage = draft.course.stages[i];
    if (ms < stage.durationSeconds * 1000 || i === draft.course.stages.length - 1) return {stage, index: i, remaining: Math.max(0, Math.ceil(stage.durationSeconds - ms / 1000)), elapsed: ms / 1000};
    ms -= stage.durationSeconds * 1000;
  }
  throw new Error('课程阶段无效。');
}
export function advance(draft: Draft, elapsedDelta: number): Draft {
  if (draft.state !== 'running') return draft;
  // A long scheduling gap is unknown activity, never backfill it as exercise.
  if (!Number.isFinite(elapsedDelta) || elapsedDelta < 0 || elapsedDelta > 10000) return {...draft, state: 'suspended'};
  const elapsedMs = Math.min(draft.elapsedMs + elapsedDelta, draft.course.plannedDurationSeconds * 1000);
  return {...draft, elapsedMs, state: elapsedMs >= draft.course.plannedDurationSeconds * 1000 ? 'completed' : 'running'};
}
export function workSeconds(draft: Draft): number {
  let remaining = draft.elapsedMs / 1000, total = 0;
  for (const stage of draft.course.stages) {const time = Math.min(stage.durationSeconds, Math.max(0, remaining)); if (stage.kind === 'work') total += time; remaining -= stage.durationSeconds;}
  return Math.floor(total);
}
export const formatTime = (seconds: number): string => {const time = Math.max(0, Math.round(seconds)); return `${Math.floor(time / 60).toString().padStart(2,'0')}:${(time % 60).toString().padStart(2,'0')}`;};

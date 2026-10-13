import type {Draft, Stage, StageResult} from './types.ts';
export const MAX_SESSION_MS=21600*1000;
export const initialStageProgress=(course:Draft['course'])=>course.stages.some(s=>s.repetitions!==undefined)?{index:0,elapsedMs:0,results:[]}:undefined;
export function currentStage(draft: Draft): {stage: Stage; index: number; remaining: number; elapsed: number} {
  if(draft.stageProgress){const progress=draft.stageProgress,index=Math.min(progress.index,draft.course.stages.length-1),stage=draft.course.stages[index];return {stage,index,remaining:stage.repetitions!==undefined?0:Math.max(0,Math.ceil(stage.durationSeconds-progress.elapsedMs/1000)),elapsed:progress.index===draft.course.stages.length?stage.durationSeconds:progress.elapsedMs/1000};}
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
  if(draft.stageProgress){
    const next=structuredClone(draft),progress=next.stageProgress!;
    let remaining=Math.min(elapsedDelta,Math.max(0,MAX_SESSION_MS-next.elapsedMs));
    while(remaining>0&&progress.index<next.course.stages.length){
      const stage=next.course.stages[progress.index],time=stage.repetitions!==undefined?remaining:Math.min(remaining,Math.max(0,stage.durationSeconds*1000-progress.elapsedMs));
      progress.elapsedMs+=time;next.elapsedMs+=time;remaining-=time;
      if(stage.repetitions!==undefined||progress.elapsedMs<stage.durationSeconds*1000)break;
      progress.results.push({stageId:stage.id,actualSeconds:progress.elapsedMs/1000,status:'completed'});progress.index++;progress.elapsedMs=0;
    }
    if(progress.index===next.course.stages.length)next.state='completed';
    else if(next.elapsedMs>=MAX_SESSION_MS)next.state='suspended';
    return next;
  }
  const elapsedMs = Math.min(draft.elapsedMs + elapsedDelta, draft.course.plannedDurationSeconds * 1000);
  return {...draft, elapsedMs, state: elapsedMs >= draft.course.plannedDurationSeconds * 1000 ? 'completed' : 'running'};
}
export function completeRepetitions(draft:Draft):Draft{
  const current=currentStage(draft);
  if(draft.state!=='running'||!draft.stageProgress||current.stage.repetitions===undefined)throw new Error('请在按次数动作开始后确认完成。');
  const next=structuredClone(draft),progress=next.stageProgress!;
  progress.results.push({stageId:current.stage.id,actualSeconds:progress.elapsedMs/1000,status:'completed',completedRepetitions:current.stage.repetitions});progress.index++;progress.elapsedMs=0;
  if(progress.index===next.course.stages.length)next.state='completed';
  return next;
}
export function sessionStageResults(draft:Draft):StageResult[]{
  if(draft.stageProgress){const progress=draft.stageProgress;return draft.course.stages.map((stage,index)=>progress.results[index]??{stageId:stage.id,actualSeconds:index===progress.index?progress.elapsedMs/1000:0,status:index===progress.index&&progress.elapsedMs>0?'partial':'skipped'});}
  let remaining=draft.elapsedMs/1000;
  return draft.course.stages.map(stage=>{const actual=Math.min(stage.durationSeconds,Math.max(0,remaining));remaining-=stage.durationSeconds;return {stageId:stage.id,actualSeconds:actual,status:actual===stage.durationSeconds?'completed':actual>0?'partial':'skipped'};});
}
export function sessionProgress(draft:Draft):number{
  if(draft.state==='completed')return 100;
  if(!draft.stageProgress)return draft.elapsedMs/(draft.course.plannedDurationSeconds*10);
  const progress=draft.stageProgress,stage=draft.course.stages[progress.index],completed=draft.course.stages.slice(0,progress.index).reduce((sum,s)=>sum+s.durationSeconds,0);
  return (completed+(stage?.repetitions===undefined?progress.elapsedMs/1000:0))/draft.course.plannedDurationSeconds*100;
}
export function workSeconds(draft: Draft): number {
  if(draft.stageProgress)return Math.floor(sessionStageResults(draft).reduce((sum,s,i)=>sum+(draft.course.stages[i].kind==='work'?s.actualSeconds:0),0));
  let remaining = draft.elapsedMs / 1000, total = 0;
  for (const stage of draft.course.stages) {const time = Math.min(stage.durationSeconds, Math.max(0, remaining)); if (stage.kind === 'work') total += time; remaining -= stage.durationSeconds;}
  return Math.floor(total);
}
export const formatTime = (seconds: number): string => {const time = Math.max(0, Math.round(seconds)); return `${Math.floor(time / 60).toString().padStart(2,'0')}:${(time % 60).toString().padStart(2,'0')}`;};

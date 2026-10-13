import type {Course,Snapshot,Stage} from './types.ts';

const rowing=(stage:Stage)=>!stage.adjustment&&(stage.exercise===undefined||stage.exercise==='row');
export function withRowingAdjustments(course:Course):Course{
  const stages:Stage[]=[],ids=new Set(course.stages.map(s=>s.id));let added=0;
  for(let index=0;index<course.stages.length;index++){
    const stage=course.stages[index],next=course.stages[index+1];stages.push(stage);
    if(!next||!rowing(stage)||!rowing(next)||stage.rpe.every((value,i)=>value===next.rpe[i]))continue;
    let id=course.id.slice(0,60)+'-adjust-'+index,suffix=0;while(ids.has(id))id=course.id.slice(0,60)+'-adjust-'+index+'-'+(++suffix);ids.add(id);
    stages.push({id,kind:'recovery',exercise:'row',adjustment:true,durationSeconds:5,rpe:[...next.rpe],cue:'按下一段目标手动调整划船机，5 秒后继续；未调好可暂停。'});added++;
  }
  if(!added)return course;
  return {...course,stages,plannedDurationSeconds:stages.reduce((sum,s)=>sum+s.durationSeconds,0),contentVersion:course.contentVersion.includes('+adjust-1')?course.contentVersion:course.contentVersion.slice(0,71)+'+adjust-1'};
}
export function refreshPendingAdjustments(state:Snapshot):void{
  if(state.draft)return;
  for(const item of state.scheduled){if(item.status!=='planned')continue;const course=withRowingAdjustments(item.course);if(course!==item.course){item.course=course;item.updatedAt=new Date().toISOString();item.version++;}}
}

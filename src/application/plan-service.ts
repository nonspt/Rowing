import type {Plan,Snapshot} from '../domain/types.ts';
import {addDays} from '../domain/plans.ts';
import {createFocusedPlan,focusedSchedule,syncPlanProgress,type PlanInput} from '../domain/focused-plans.ts';
export function adoptPlan(state:Snapshot,input:PlanInput):void{
  if(state.draft)throw new Error('请先完成或保留当前跟练，再更换计划。');
  if(!state.profile)throw new Error('本机设置尚未就绪，请刷新重试。');
  const result=createFocusedPlan(input,state.profile.timeZone);
  for(const p of state.plans)if(p.status==='active'){p.status='paused';p.updatedAt=new Date().toISOString();p.version++;}
  state.plans.push(result.plan);state.scheduled.push(...result.sessions);
}
export function editCustomPlan(state:Snapshot,id:string,input:PlanInput):void{
  if(state.draft)throw new Error('请先完成当前跟练，再编辑计划。');
  const p=state.plans.find(x=>x.id===id);
  if(!p?.training?.custom||!input.training.custom)throw new Error('只能编辑自定义计划。');
  const kept=state.scheduled.filter(x=>x.planId===id&&x.status!=='planned');
  if(kept.length&&(p.startDate!==input.startDate||p.training.mode!==input.training.mode||p.training.weeklyDays!==input.training.weeklyDays))throw new Error('已有进度时保留类型、日期与频次；可另存一个新计划。');
  if(kept.some(x=>x.week>=input.training.weeks))throw new Error('新周期不能短于已有进度。');
  const next=createFocusedPlan(input,p.timeZone).plan;
  const candidate:Plan={...p,title:next.title,startDate:next.startDate,training:next.training,updatedAt:new Date().toISOString(),version:p.version+1};
  const rebuilt=focusedSchedule(candidate).filter(x=>!kept.some(k=>k.week===x.week&&k.slot===x.slot)).map(x=>{
    const old=state.scheduled.find(y=>y.planId===id&&y.week===x.week&&y.slot===x.slot&&y.status==='planned');
    return old?{...x,id:old.id,createdAt:old.createdAt,version:old.version+1,linkedSessionId:old.linkedSessionId,localDate:p.startDate===candidate.startDate&&p.training!.weeklyDays===candidate.training!.weeklyDays?old.localDate:x.localDate}:x;
  });
  state.scheduled=state.scheduled.filter(x=>x.planId!==id||x.status!=='planned');state.scheduled.push(...rebuilt);
  Object.assign(p,candidate);if(p.status==='completed'&&rebuilt.length)p.status='paused';syncPlanProgress(p,state);
}
export function activatePlan(state:Snapshot,id:string):void{
  if(state.draft)throw new Error('请先完成当前跟练，再更换计划。');
  const p=state.plans.find(x=>x.id===id);if(!p)throw new Error('计划不存在。');
  if(p.status==='completed')throw new Error('本轮已结束，请再次使用以建立新一轮。');
  for(const x of state.plans)if(x.status==='active'&&x.id!==id){x.status='paused';x.updatedAt=new Date().toISOString();x.version++;}
  p.status='active';syncPlanProgress(p,state);
}
export function adjustPlanSession(state:Snapshot,id:string,action:'move'|'skip'|'restore',date?:string):void{
  const item=state.scheduled.find(x=>x.id===id),p=state.plans.find(x=>x.id===item?.planId);
  if(!item||!p||p.status!=='active'||item.status==='completed')throw new Error('这节课已改变，请刷新日程。');
  if(state.draft?.scheduledId===id)throw new Error('请先结束这节跟练。');
  if(action==='move'){
    if(!date||!/^\d{4}-\d\d-\d\d$/.test(date)||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw new Error('请选择有效日期。');
    const first=addDays(p.startDate,item.week*7),last=addDays(first,6);
    if(p.training&&(date<first||date>last))throw new Error('请选择这一周内的日期。');
    if(state.scheduled.some(x=>x.planId===p.id&&x.id!==id&&x.status!=='skipped'&&x.localDate===date))throw new Error('这天已有训练，请选择其他日期。');
    if(item.course.category==='interval'&&state.scheduled.some(x=>x.planId===p.id&&x.id!==id&&x.status!=='skipped'&&x.course.category==='interval'&&Math.abs(Date.parse(x.localDate)-Date.parse(date))<3*86400000))throw new Error('无氧课程之间保留至少 3 个日历日。');
    item.localDate=date;
  }else {
    if(action==='restore'){
      if(state.scheduled.some(x=>x.planId===p.id&&x.id!==id&&x.status!=='skipped'&&x.localDate===item.localDate))throw new Error('原日期已有训练，请先调整日程。');
      if(item.course.category==='interval'&&state.scheduled.some(x=>x.planId===p.id&&x.id!==id&&x.status!=='skipped'&&x.course.category==='interval'&&Math.abs(Date.parse(x.localDate)-Date.parse(item.localDate))<3*86400000))throw new Error('原日期恢复时间不足，请先调整日程。');
    }
    item.status=action==='skip'?'skipped':'planned';
  }
  item.updatedAt=new Date().toISOString();item.version++;syncPlanProgress(p,state);
}

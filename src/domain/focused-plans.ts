import {courseById} from '../content/courses.ts';
import {presets} from '../content/presets.ts';
import {newEntity} from './types.ts';
import type {Course,Plan,PlanTraining,Scheduled,Snapshot,Stage} from './types.ts';
import {addDays,localDate,scheduleWeek,weekStart} from './plans.ts';
import {validDate} from './validation.ts';
import {validateTrainingDefinition} from './plan-definition.ts';
export type PlanInput={title:string;startDate:string;training:PlanTraining};
export const planWeeks=(p:Plan)=>p.training?.weeks??4;
export const planMode=(p:Plan)=>p.training?.mode??(p.templateId==='P03'?'anaerobic':'aerobic');
export function makeCourse(training:PlanTraining,week:number,slot:number):Course{
  validateTrainingDefinition(training);
  if(!training.custom&&training.mode==='anaerobic'){
    const recovery=slot===1;
    if(recovery)return courseById('A01');
    const c=courseById(training.presetId==='AN03'&&week>0&&slot===2?'H02':'H01');
    if((week+1)%4===0){c.stages=[c.stages[0],...c.stages.slice(1,9),c.stages.at(-1)!];c.contentVersion='focused-1';c.status='draft';}
    c.plannedDurationSeconds=c.stages.reduce((s,x)=>s+x.durationSeconds,0);return c;
  }
  const custom=training.custom;
  const intro=training.presetId==='AE01',long=training.presetId==='AE03';
  const base=intro?8:long?20:15,limit=intro?15:long?30:20;
  const minutes=Math.min(limit,base+week),easier=!custom&&(week+1)%4===0;
  const config=custom??{warmupMinutes:intro?4:5,cooldownMinutes:intro?3:5,workSeconds:Math.max(base,Math.floor(minutes*(easier ? 0.8 : 1)))*60,recoverySeconds:0,repeats:1};
  const id=`${custom?'custom':training.presetId}-w${week}-s${slot}`;
  const interval=training.mode==='anaerobic';
  const stages:Stage[]=[{id:id+'-warmup',kind:'warmup',durationSeconds:config.warmupMinutes*60,rpe:[2,3],cue:'轻松划行，逐渐连贯。'}];
  for(let i=0;i<config.repeats;i++){
    stages.push({id:id+'-work-'+i,kind:'work',durationSeconds:config.workSeconds,rpe:interval?[7,8]:intro||easier?[3,4]:[4,5],cue:interval?'短时提高用力，保持动作稳定，不做极限冲刺。':'保持稳定用力与自然呼吸。'});
    if(config.recoverySeconds)stages.push({id:id+'-recovery-'+i,kind:'recovery',durationSeconds:config.recoverySeconds,rpe:[2,3],cue:'减小用力，充分恢复。'});
  }
  stages.push({id:id+'-cooldown',kind:'cooldown',durationSeconds:config.cooldownMinutes*60,rpe:[2,3],cue:'逐渐减小用力，轻松结束。'});
  return {id,title:interval?'自定义短间歇':custom?'自定义有氧':presets.find(x=>x.id===training.presetId)!.title,category:interval?'interval':'aerobic',description:'包含完整热身、主训练与放松。',suitability:interval?'已有规律划船基础':'按当日感受调整用力',level:interval?'regular':intro?'new':'basic',contentVersion:custom?'custom-1':'focused-1',status:'draft',stages,plannedDurationSeconds:stages.reduce((s,x)=>s+x.durationSeconds,0),focus:interval?'短工作段，充分恢复':'舒适稳定的持续划行',alternativeId:'A01'};
}
export function focusedSchedule(plan:Plan):Scheduled[]{
  if(!plan.training)throw new Error('旧版计划没有完整周期定义。');
  const t=plan.training;validateTrainingDefinition(t);
  const offsets=t.weeklyDays===1?[0]:t.weeklyDays===2?[0,3]:t.weeklyDays===3?[0,2,4]:[0,2,4,6];
  return Array.from({length:t.weeks},(_,week)=>offsets.map((day,slot)=>({...newEntity(),planId:plan.id,week,slot,localDate:addDays(plan.startDate,week*7+day),course:makeCourse(t,week,slot),status:'planned' as const}))).flat();
}
export function createFocusedPlan(input:PlanInput,timeZone:string):{plan:Plan;sessions:Scheduled[]}{
  validateTrainingDefinition(input.training);
  if(!input.title.trim()||input.title.length>60||!validDate(input.startDate))throw new Error('请输入 1–60 字的名称和有效开始日期。');
  const plan:Plan={...newEntity(),templateId:'FOCUSED',title:input.title.trim(),startDate:input.startDate,week:0,status:'active',ruleVersion:'focused-rules-1',templateVersion:input.training.custom?'custom-1':'focused-1',reason:'按完整周期安排，保留热身、恢复与放松。',timeZone,training:structuredClone(input.training)};
  return {plan,sessions:focusedSchedule(plan)};
}
export function syncPlanProgress(plan:Plan,state:Snapshot):void{
  if(plan.status!=='active')return;
  let pending=state.scheduled.filter(s=>s.planId===plan.id&&s.status==='planned');
  if(!plan.training&&!pending.length&&plan.week<3&&state.profile){
    plan.week++;state.scheduled.push(...scheduleWeek(plan,state.profile,state,addDays(plan.startDate,plan.week*7)));pending=state.scheduled.filter(s=>s.planId===plan.id&&s.status==='planned');
  }
  if(pending.length)plan.week=Math.min(...pending.map(s=>s.week));else{plan.status='completed';plan.week=planWeeks(plan)-1;}
  plan.updatedAt=new Date().toISOString();plan.version++;
}
export function focusedEligibility(course:Course,state:Snapshot,confirmed:boolean,now=Date.now()):string{
  if(course.category!=='interval')return '';
  if(!confirmed)return '请确认已具备规律划船基础，今天无疲劳或不适。';
  const intervals=state.workouts.filter(w=>w.course?.category==='interval'&&Date.parse(w.endedAt)<=now);
  if(intervals.some(w=>now-Date.parse(w.endedAt)<48*3600000))return '距上次无氧训练不足 48 小时，请继续恢复。';
  const zone=state.profile?.timeZone??Intl.DateTimeFormat().resolvedOptions().timeZone,start=weekStart(localDate(new Date(now),zone));
  if(intervals.filter(w=>localDate(new Date(w.startedAt),zone)>=start).length>=2)return '本周已有两次无氧训练，请休息或选择有氧计划。';
  if(course.id==='H02'&&!intervals.some(w=>w.course?.id==='H01'&&w.completionStatus==='completed'&&!w.feedback.discomfort))return '先完成 20 秒短间歇，再进行 30 秒进阶。';
  return '';
}

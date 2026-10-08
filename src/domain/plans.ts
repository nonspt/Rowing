import {courseById, planTemplates} from '../content/courses.ts';
import {newEntity, CONTENT_VERSION} from './types.ts';
import type {Course, Plan, Profile, Scheduled, Snapshot, Workout} from './types.ts';
export function localDate(date = new Date(), timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone): string {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone, year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  return ['year','month','day'].map(key => parts.find(p=>p.type===key)!.value).join('-');
}
export function addDays(key: string, days: number): string {const date = new Date(`${key}T12:00:00Z`); date.setUTCDate(date.getUTCDate()+days); return date.toISOString().slice(0,10);}
export function weekStart(key: string): string {const weekday = new Date(`${key}T12:00:00Z`).getUTCDay(); return addDays(key, -(weekday === 0 ? 6 : weekday-1));}
export function weekStats(workouts: Workout[], timeZone: string, now = new Date()) {
  const start = weekStart(localDate(now,timeZone)), end = addDays(start,7);
  const records = workouts.filter(w => {const day = localDate(new Date(w.startedAt),timeZone); return day >= start && day < end;});
  return {count: records.length, minutes: Math.round(records.reduce((sum,w)=>sum+w.activeDurationSeconds,0)/60), completed: records.filter(w=>w.completionStatus==='completed').length,
    days: Array.from({length:7},(_,i)=>{const day=addDays(start,i); return records.filter(w=>localDate(new Date(w.startedAt),timeZone)===day).reduce((sum,w)=>sum+w.activeDurationSeconds,0)/60;})};
}
export function intervalEligibility(state: Snapshot, now = Date.now()): {allowed: boolean; reason: string} {
  if (state.profile?.experience !== 'regular') return {allowed:false,reason:'先熟悉动作并建立规律的基础训练，再考虑高强度间歇。'};
  const recent = state.workouts.filter(w=>now-Date.parse(w.endedAt)<=14*86400000 && Date.parse(w.endedAt)<=now && w.completionStatus==='completed' && w.course?.category==='aerobic' && !w.feedback.discomfort && w.feedback.technique==='stable' && w.feedback.feeling==='good');
  if (recent.length < 3) return {allowed:false,reason:'最近 14 天先完成至少 3 次无不适、动作稳定的基础课。手动记录与自评不能替代专业评估。'};
  const interval = state.workouts.filter(w=>w.course?.category==='interval');
  if (interval.some(w=>now-Date.parse(w.endedAt)<48*3600000)) return {allowed:false,reason:'与上一节高强度课间隔至少 48 小时；疲劳时继续休息。'};
  const start = weekStart(localDate(new Date(now), state.profile.timeZone));
  if (interval.some(w=>localDate(new Date(w.startedAt),state.profile!.timeZone)>=start)) return {allowed:false,reason:'本周已记录高强度训练，优先安排基础课或休息。'};
  return {allowed:true,reason:'满足应用的展示条件。仍请按当日感受选择，这不是运动能力检测。'};
}
export function courseEligibility(course: Course, state: Snapshot): {allowed: boolean; reason: string} {
  if (course.category !== 'interval') return {allowed:true,reason:''};
  const basic = intervalEligibility(state);
  if (!basic.allowed) return basic;
  if (course.id==='H02' && !state.workouts.some(w=>w.course?.id==='H01' && w.completionStatus==='completed' && !w.feedback.discomfort && w.feedback.technique==='stable' && w.feedback.feeling==='good')) return {allowed:false,reason:'先稳定完成短间歇体验课，再主动选择进阶课。'};
  return basic;
}
export function suggestedTemplate(state: Snapshot): string {
  if (state.profile?.goal==='interval' && intervalEligibility(state).allowed) return 'P03';
  return state.profile?.experience !== 'new' && state.profile?.goal==='aerobic' && state.profile.availableMinutes>=25 ? 'P02' : 'P01';
}
export function previewPlan(templateId: string, state: Snapshot, startDate = localDate()): {plan: Plan; sessions: Scheduled[]} {
  const template = planTemplates.find(p=>p.id===templateId);
  if (!template || !state.profile) throw new Error('请先填写训练偏好。');
  if (templateId==='P03' && !intervalEligibility(state).allowed) throw new Error(intervalEligibility(state).reason);
  const plan: Plan = {...newEntity(), templateId, title:template.title, startDate, week:0, status:'active', ruleVersion:'plan-rules-1',templateVersion:CONTENT_VERSION,reason:'按经验、每周天数与单次时间安排；不足时间时保留完整短课，不删减热身与放松。',timeZone:state.profile.timeZone};
  return {plan, sessions: scheduleWeek(plan,state.profile,state)};
}
export function scheduleWeek(plan: Plan, profile: Profile, state: Snapshot, startDate = plan.startDate): Scheduled[] {
  const template = planTemplates.find(p=>p.id===plan.templateId)!;
  let ids: string[] = [...template.weeks[plan.week]];
  if (profile.weeklyDays===2) ids = plan.templateId==='P03' ? ids.slice(0,2) : [ids[0],ids[2]];
  if (profile.weeklyDays===4) ids.push('R01');
  const offsets = ids.length===2 ? [0,3] : ids.length===4 ? [0,2,4,6] : [0,2,5];
  return ids.map((id,i)=>{
    if (id==='H02' && !courseEligibility(courseById(id),state).allowed) id='H01';
    let course = courseById(id);
    if (course.plannedDurationSeconds>profile.availableMinutes*60) course=courseById(course.category==='technique' && profile.availableMinutes>=14 ? 'T01' : 'A01');
    return {...newEntity(),planId:plan.id, localDate:addDays(startDate,offsets[i]),week:plan.week,course,status:'planned'};
  });
}
export function canAdvancePlan(plan: Plan, state: Snapshot): boolean {
  const sessions=state.scheduled.filter(s=>s.planId===plan.id&&s.week===plan.week&&s.status==='completed');
  return sessions.length>=2 && sessions.every(s=>{const w=state.workouts.find(w=>w.id===s.linkedSessionId); return w && !w.feedback.discomfort && w.feedback.technique==='stable' && w.feedback.feeling==='good';});
}

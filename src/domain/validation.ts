import {validateTrainingDefinition} from './plan-definition.ts';
import type {Backup, Course, Snapshot, Workout} from './types.ts';
const fail = (message: string): never => {throw new Error(message);};
const object = (x: unknown): Record<string,unknown> => x!==null && typeof x==='object' && !Array.isArray(x) ? x as Record<string,unknown> : fail('备份包含无效对象。');
const str = (x: unknown, max=300): x is string => typeof x==='string' && x.length<=max;
const num = (x: unknown, min: number, max: number): x is number => typeof x==='number' && Number.isFinite(x) && x>=min && x<=max;
const iso = (x: unknown): x is string => str(x,40) && /^\d{4}-\d\d-\d\dT/.test(x) && Number.isFinite(Date.parse(x));
const id = (x: unknown): x is string => str(x,100) && /^[a-zA-Z0-9_-]+$/.test(x);
const entity = (x: unknown): Record<string,unknown> => {const o=object(x); if (!id(o.id)||!iso(o.createdAt)||!iso(o.updatedAt)||!num(o.version,1,1e9)||!Number.isInteger(o.version)) fail('数据 ID、日期或版本无效。'); return o;};
export function validateCourse(input: unknown): asserts input is Course {
  const c=object(input);
  if (!id(c.id)||!str(c.title,60)||!str(c.contentVersion,80)||!['technique','aerobic','habit','interval','recovery'].includes(String(c.category))||!['new','basic','regular'].includes(String(c.level))||!['draft','confirmed'].includes(String(c.status))||!str(c.description,1000)||!str(c.suitability,300)||!str(c.focus,300)||!id(c.alternativeId)) fail('课程信息无效。');
  if (!Array.isArray(c.stages)||c.stages.length<2||c.stages.length>100) fail('课程阶段无效。');
  let sum=0; const ids=new Set();
  for (const value of c.stages as unknown[]) {const s=object(value); if (!id(s.id)||ids.has(s.id)||!['warmup','work','recovery','cooldown'].includes(String(s.kind))||!num(s.durationSeconds,1,21600)||!Number.isInteger(s.durationSeconds)||!str(s.cue,300)||!Array.isArray(s.rpe)||s.rpe.length!==2||!num(s.rpe[0],0,10)||!num(s.rpe[1],s.rpe[0],10)) fail('课程阶段字段无效。'); ids.add(s.id); sum+=s.durationSeconds as number;}
  if (sum!==c.plannedDurationSeconds||sum>21600) fail('课程总时长与阶段不一致。');
}
export function validateWorkout(input: unknown): asserts input is Workout {
  const w=entity(input), f=object(w.feedback);
  if (!id(w.sessionId)||!str(w.title,60)||!iso(w.startedAt)||!iso(w.endedAt)||Date.parse(w.endedAt as string)<Date.parse(w.startedAt as string)||!num(w.activeDurationSeconds,1,21600)||!num(w.workDurationSeconds,0,w.activeDurationSeconds as number)||!['completed','ended-early'].includes(String(w.completionStatus))||!['guided','manual-entry'].includes(String(w.captureSource))) fail('记录的时间、来源或状态无效。');
  if(f.assessed!==undefined&&typeof f.assessed!=='boolean')fail('训练感受状态无效。');
  if (!num(f.rpe,0,10)||typeof f.discomfort!=='boolean'||!str(f.note,300)||!['stable','practice'].includes(String(f.technique))||!['good','tired'].includes(String(f.feeling))) fail('请检查用力程度、动作感受和备注（最多 300 字）。');
  if (w.course!==undefined) validateCourse(w.course);
  if (w.captureSource==='guided' && !w.course) fail('跟练记录缺少课程快照。');
  if (w.scheduledId!==undefined && !id(w.scheduledId)) fail('计划关联 ID 无效。');
  if (!Array.isArray(w.stageResults)||w.stageResults.length>100) fail('阶段记录无效。');
  for (const value of w.stageResults as unknown[]) {const s=object(value); if (!id(s.stageId)||!num(s.actualSeconds,0,21600)||!['completed','partial','skipped'].includes(String(s.status))) fail('阶段结果无效。');}
  const metrics=object(w.metrics);
  const specs: Record<string,{unit:string; max:number}> = {distance:{unit:'m',max:100000},pace:{unit:'s/500m',max:10800000},spm:{unit:'spm',max:100},power:{unit:'W',max:3000},calories:{unit:'kcal',max:20000}};
  for (const [key,value] of Object.entries(metrics)) {if (!specs[key]) fail('记录包含未知指标。'); if (value===null) continue; const m=object(value), spec=specs[key]; if (!num(m.value,Number.MIN_VALUE,spec.max)||m.unit!==spec.unit||!['manual','derived'].includes(String(m.source))||m.scope!=='whole-session') fail('请填写有效的设备读数；没有读数可留空。');}
}
export function validateSnapshot(input: unknown): asserts input is Snapshot {
  const s=object(input);
  if (s.schemaVersion!==2||!num(s.revision,0,1e12)||!Number.isInteger(s.revision)) fail('不支持的数据结构版本。');
  for (const key of ['workouts','plans','scheduled','lessons']) {if (!Array.isArray(s[key])||(s[key] as unknown[]).length>10000) fail('数据数组或数量无效。'); const ids=new Set(); for (const v of s[key] as unknown[]) {const e=entity(v); if (ids.has(e.id)) fail('备份中存在重复 ID。'); ids.add(e.id);}}
  const sessions=new Set();
  for (const w of s.workouts as unknown[]) {validateWorkout(w); if (sessions.has(w.sessionId)) fail('存在重复训练会话。'); sessions.add(w.sessionId);}
  if (s.profile!==null) {const p=entity(s.profile); if (!['new','basic','regular'].includes(String(p.experience))||!['technique','aerobic','habit','interval'].includes(String(p.goal))||![2,3,4].includes(p.weeklyDays as number)||![15,20,30,45].includes(p.availableMinutes as number)||!str(p.machine,60)||!str(p.timeZone,80)||typeof p.sound!=='boolean') fail('训练偏好无效。'); try {new Intl.DateTimeFormat('en',{timeZone:p.timeZone as string});} catch {fail('时区无效。');}}
  for (const value of s.plans as unknown[]) {const p=object(value); if(p.training!==undefined)validateTrainingDefinition(p.training);const total=(p.training as {weeks:number}|undefined)?.weeks??4;if(p.templateId==='FOCUSED'&&!p.training)fail('计划缺少训练定义。'); if (!['P01','P02','P03','FOCUSED'].includes(String(p.templateId))||!str(p.title,60)||!['active','paused','completed'].includes(String(p.status))||!num(p.week,0,total-1)||!Number.isInteger(p.week)||!str(p.ruleVersion,80)||!str(p.templateVersion,80)||!str(p.reason,1000)||!validDate(p.startDate)||!str(p.timeZone,80)) fail('计划信息无效。'); try {new Intl.DateTimeFormat('en',{timeZone:p.timeZone as string});} catch {fail('计划时区无效。');}}
  if ((s.plans as {status:string}[]).filter(p=>p.status==='active').length>1) fail('只能有一个活动计划。');
  for (const value of s.scheduled as unknown[]) {const item=object(value); if(item.slot!==undefined&&(!num(item.slot,0,3)||!Number.isInteger(item.slot)))fail('日程序号无效。'); validateCourse(item.course); if (!id(item.planId)||!(s.plans as {id:string}[]).some(p=>p.id===item.planId)||!validDate(item.localDate)||!num(item.week,0,((s.plans as {id:string;training?:{weeks:number}}[]).find(p=>p.id===item.planId)?.training?.weeks??4)-1)||!Number.isInteger(item.week)||!['planned','completed','skipped'].includes(String(item.status))) fail('计划日程或关联无效。'); if (item.linkedSessionId!==undefined && !(s.workouts as {id:string}[]).some(w=>w.id===item.linkedSessionId)) fail('日程关联的训练记录不存在。');}
  for (const value of s.lessons as unknown[]) {const l=object(value); if (!['setup','catch','drive','finish','recovery'].includes(String(l.id))||!iso(l.viewedAt)||!str(l.contentVersion,80)||!Array.isArray(l.selfChecks)||l.selfChecks.length!==4||!l.selfChecks.every(x=>typeof x==='boolean')) fail('学习进度无效。');}
  if (s.draft!==null) {const d=entity(s.draft); validateCourse(d.course); if (!['ready','running','paused','suspended','completed','ended-early'].includes(String(d.state))||!num(d.elapsedMs,0,(d.course as Course).plannedDurationSeconds*1000)||!iso(d.startedAt)||!str(d.owner,100)||!num(d.leaseUntil,0,1e15)||!num(d.revision,0,1e12)) fail('训练草稿无效。'); if(d.endedAt!==undefined&&!iso(d.endedAt)) fail('草稿结束时间无效。'); if(d.scheduledId!==undefined && !(s.scheduled as {id:string}[]).some(x=>x.id===d.scheduledId)) fail('草稿的日程关联不存在。');}
  if (s.lastBackupAt!==undefined && !iso(s.lastBackupAt)) fail('备份时间无效。');
}
export function validDate(value: unknown): value is string {return str(value,10)&&/^\d{4}-\d\d-\d\d$/.test(value)&&Number.isFinite(Date.parse(`${value}T00:00:00Z`))&&new Date(`${value}T00:00:00Z`).toISOString().slice(0,10)===value;}
export function parseBackup(text: string): Backup {
  if (new TextEncoder().encode(text).length>10*1024*1024) fail('文件超过 10MB，请选择较小备份。');
  let data: unknown;
  try {data=JSON.parse(text,(key,value)=>{if(['__proto__','prototype','constructor'].includes(key)) fail('文件包含不安全字段。'); return value;});} catch {return fail('文件不是有效的安全 JSON 备份。');}
  const b=object(data);
  if (b.format!=='home-rower-backup'||b.exportVersion!==1||![1,2].includes(b.schemaVersion as number)||!iso(b.exportedAt)||!str(b.appVersion,40)||!str(b.contentVersion,80)) fail('备份格式或版本不支持，请检查文件或升级应用。');
  const snapshot=object(b.data);
  if(snapshot.schemaVersion!==b.schemaVersion)fail('备份结构版本不一致。');
  if(snapshot.schemaVersion===1){if(!Array.isArray(snapshot.plans)||(snapshot.plans as {templateId:string;training?:unknown}[]).some(p=>p.templateId==='FOCUSED'||p.training!==undefined))fail('旧备份含不兼容的计划。');snapshot.schemaVersion=2;}
  validateSnapshot(b.data);
  b.schemaVersion=2;
  const counts=object(b.counts);
  for (const key of ['workouts','plans','scheduled','lessons'] as const) if(counts[key]!==b.data[key].length) fail('备份数量与内容不一致。');
  return structuredClone(data) as Backup;
}

import {adoptPlan,editCustomPlan,activatePlan,adjustPlanSession} from './plan-service.ts';
import {focusedEligibility,syncPlanProgress,type PlanInput} from '../domain/focused-plans.ts';
import {APP_VERSION, CONTENT_VERSION, newEntity} from '../domain/types.ts';
import type {Backup, Course, Draft, Feedback, Profile, Snapshot, Workout} from '../domain/types.ts';
import {canAdvancePlan, courseEligibility, localDate, previewPlan, scheduleWeek} from '../domain/plans.ts';
import {validateWorkout, validDate} from '../domain/validation.ts';
import {workSeconds} from '../domain/session.ts';
import {Repository} from '../repositories/repository.ts';
export type MetricInput = {distance:string;spm:string;power:string;calories:string};
export const blankMetrics = ():MetricInput=>({distance:'',spm:'',power:'',calories:''});
export function metricsFromInput(input: MetricInput, seconds:number):Workout['metrics'] {
  const result:Workout['metrics']={distance:null,spm:null,power:null,calories:null,pace:null};
  const units={distance:'m',spm:'spm',power:'W',calories:'kcal'} as const;
  for(const key of Object.keys(units) as (keyof MetricInput)[]) if(input[key].trim()) result[key]={value:Number(input[key]),unit:units[key],source:'manual',scope:'whole-session'};
  if(result.distance&&result.distance.value>0) result.pace={value:seconds/result.distance.value*500,unit:'s/500m',source:'derived',scope:'whole-session',formulaVersion:'pace-1'};
  return result;
}
export class AppService {
  readonly owner=crypto.randomUUID();
  readonly repository:Repository;
  constructor(repository:Repository) {this.repository=repository;}
  private writable(state:Snapshot) {if(state.draft && state.draft.owner!==this.owner && state.draft.leaseUntil>Date.now()) throw new Error('其他窗口正在训练，请在原窗口暂停或稍后重试。');}
  adoptFocusedPlan(input:PlanInput,revision:number) {return this.repository.update(s=>{this.writable(s);adoptPlan(s,input);},revision);}
  editFocusedPlan(id:string,input:PlanInput,revision:number) {return this.repository.update(s=>{this.writable(s);editCustomPlan(s,id,input);},revision);}
  activateFocusedPlan(id:string) {return this.repository.update(s=>{this.writable(s);activatePlan(s,id);});}
  adjustFocusedSession(id:string,action:'move'|'skip'|'restore',date?:string) {return this.repository.update(s=>{this.writable(s);adjustPlanSession(s,id,action,date);});}
  async beginScheduled(id:string,confirmed=false):Promise<Draft> {
    const result=await this.repository.update(s=>{if(s.draft)throw new Error('请先恢复或结束上次跟练。');const item=s.scheduled.find(x=>x.id===id),plan=s.plans.find(x=>x.id===item?.planId);if(!item||item.status!=='planned'||plan?.status!=='active')throw new Error('计划日程已改变，请重新选择。');const reason=focusedEligibility(item.course,s,confirmed);if(reason)throw new Error(reason);s.draft={...newEntity(),course:structuredClone(item.course),state:'ready',elapsedMs:0,startedAt:new Date().toISOString(),scheduledId:id,owner:this.owner,leaseUntil:Date.now()+15000,revision:0};});return result.draft!;
  }
  saveProfile(profile:Profile) {return this.repository.update(s=>{this.writable(s);s.profile=profile;});}
  saveLesson(id:string,checks:boolean[]) {return this.repository.update(s=>{this.writable(s);const old=s.lessons.find(l=>l.id===id),now=new Date().toISOString();s.lessons=s.lessons.filter(l=>l.id!==id);s.lessons.push({...newEntity(id),createdAt:old?.createdAt||now,version:(old?.version||0)+1,viewedAt:now,contentVersion:CONTENT_VERSION,selfChecks:checks});});}
  usePlan(templateId:string,expectedRevision:number) {return this.repository.update(s=>{this.writable(s);if(s.draft) throw new Error('先保存或结束当前训练，再切换计划。');const generated=previewPlan(templateId,s,localDate(new Date(),s.profile?.timeZone));for(const p of s.plans) if(p.status==='active') {p.status='paused';p.updatedAt=new Date().toISOString();p.version++;}s.plans.push(generated.plan);s.scheduled.push(...generated.sessions);},expectedRevision);}
  adjustSchedule(id:string,action:'skip'|'move',date?:string) {return this.repository.update(s=>{this.writable(s);const item=s.scheduled.find(x=>x.id===id);if(!item||item.status!=='planned') throw new Error('这节课已改变，请刷新列表。');if(s.draft?.scheduledId===id) throw new Error('请先结束该节训练。');if(action==='move'){if(!validDate(date)) throw new Error('请选择有效日期。');if(s.scheduled.some(x=>x.planId===item.planId&&x.id!==id&&x.status==='planned'&&x.localDate===date)) throw new Error('这天已有课程，请选择其他日期。');item.localDate=date;}else item.status='skipped';item.updatedAt=new Date().toISOString();item.version++;});}
  advancePlan(id:string,repeat=false) {return this.repository.update(s=>{this.writable(s);if(s.draft) throw new Error('请先保存当前训练。');const p=s.plans.find(p=>p.id===id);if(!p||p.status!=='active'||!s.profile) throw new Error('计划不可用。');if(!repeat&&!canAdvancePlan(p,s)) throw new Error('先完成至少两节无不适、动作稳定的课程；也可以重复当前周。');for(const x of s.scheduled) if(x.planId===id&&x.week===p.week&&x.status==='planned') {x.status='skipped';x.updatedAt=new Date().toISOString();x.version++;}if(!repeat&&p.week===3)p.status='completed';else{if(!repeat)p.week++;s.scheduled.push(...scheduleWeek(p,s.profile,s,localDate(new Date(),p.timeZone)));}p.updatedAt=new Date().toISOString();p.version++;});}
  async begin(course:Course,scheduledId?:string):Promise<Draft> {
    const result=await this.repository.update(s=>{if(s.draft) throw new Error('已有未保存训练，请先恢复或结束它。');const eligibility=courseEligibility(course,s);if(!eligibility.allowed) throw new Error(eligibility.reason); if(scheduledId&&!s.scheduled.some(x=>x.id===scheduledId&&x.status==='planned')) throw new Error('这节计划已改变，请重新选择。');s.draft={...newEntity(),course:structuredClone(course),state:'ready',elapsedMs:0,startedAt:new Date().toISOString(),scheduledId,owner:this.owner,leaseUntil:Date.now()+15000,revision:0};});
    return result.draft!;
  }
  async claim():Promise<Draft> {const result=await this.repository.update(s=>{if(!s.draft)throw new Error('训练草稿已不存在。');if(s.draft.owner!==this.owner&&s.draft.state==='running'&&s.draft.leaseUntil>Date.now())throw new Error('其他窗口正在训练，请在原窗口暂停或稍后重试。');s.draft.owner=this.owner;s.draft.leaseUntil=Date.now()+15000;s.draft.revision++;if(s.draft.state!=='completed'&&s.draft.state!=='ended-early')s.draft.state='suspended';});return result.draft!;}
  async checkpoint(draft:Draft):Promise<Draft> {const result=await this.repository.update(s=>{if(!s.draft||s.draft.id!==draft.id||s.draft.owner!==this.owner||s.draft.revision!==draft.revision) throw new Error('训练已在其他窗口改变，已暂停本窗口。请刷新恢复最新草稿。');s.draft={...draft,owner:this.owner,leaseUntil:Date.now()+15000,revision:draft.revision+1,updatedAt:new Date().toISOString()};});return result.draft!;}
  finish(draft:Draft,feedback:Feedback,input:MetricInput) {return this.repository.update(s=>{
    const old=s.workouts.find(w=>w.sessionId===draft.id); if(old)return;
    if(!s.draft||s.draft.id!==draft.id||s.draft.owner!==this.owner||s.draft.revision!==draft.revision)throw new Error('草稿已改变，请恢复最新训练后保存。');
    const seconds=Math.floor(draft.elapsedMs/1000); let remaining=draft.elapsedMs/1000;
    const record:Workout={...newEntity(draft.id),sessionId:draft.id,scheduledId:draft.scheduledId,title:draft.course.title,startedAt:draft.startedAt,endedAt:draft.endedAt||new Date().toISOString(),completionStatus:draft.state==='completed'?'completed':'ended-early',captureSource:'guided',activeDurationSeconds:seconds,workDurationSeconds:workSeconds(draft),course:draft.course,feedback,metrics:metricsFromInput(input,seconds),stageResults:draft.course.stages.map(stage=>{const actual=Math.min(stage.durationSeconds,Math.max(0,remaining));remaining-=stage.durationSeconds;return {stageId:stage.id,actualSeconds:actual,status:actual===stage.durationSeconds?'completed':actual>0?'partial':'skipped'};})};
    validateWorkout(record);s.workouts.push(record);const item=s.scheduled.find(x=>x.id===draft.scheduledId);if(item){item.linkedSessionId=record.id;if(record.completionStatus==='completed')item.status='completed';item.updatedAt=record.updatedAt;item.version++;const plan=s.plans.find(p=>p.id===item.planId);if(plan)syncPlanProgress(plan,s);}s.draft=null;
  });}
  saveManual(record:Workout,expectedVersion?:number) {validateWorkout(record);return this.repository.update(s=>{this.writable(s);const old=s.workouts.find(w=>w.id===record.id);if(expectedVersion!==undefined&&old?.version!==expectedVersion)throw new Error('记录已改变，请重新打开后编辑。');if(!old&&s.workouts.some(w=>w.sessionId===record.sessionId))throw new Error('训练会话已存在。');s.workouts=s.workouts.filter(w=>w.id!==record.id);s.workouts.push(record);});}
  deleteWorkout(id:string) {return this.repository.update(s=>{this.writable(s);s.workouts=s.workouts.filter(w=>w.id!==id);for(const x of s.scheduled) if(x.linkedSessionId===id){delete x.linkedSessionId;if(x.status==='completed')x.status='planned';x.version++;x.updatedAt=new Date().toISOString();}});}
  discardDraft() {return this.repository.update(s=>{this.writable(s);s.draft=null;});}
  async backup():Promise<Backup> {const data=await this.repository.read();if(data.draft){data.draft={...data.draft,owner:'',leaseUntil:0,state:data.draft.state==='running'?'suspended':data.draft.state};}return {format:'home-rower-backup',exportVersion:1,schemaVersion:2,appVersion:APP_VERSION,contentVersion:CONTENT_VERSION,exportedAt:new Date().toISOString(),counts:{workouts:data.workouts.length,plans:data.plans.length,scheduled:data.scheduled.length,lessons:data.lessons.length},data};}
  markBackup() {return this.repository.update(s=>{s.lastBackupAt=new Date().toISOString();});}
  importBackup(backup:Backup,expectedRevision:number) {return this.repository.update(s=>{
    this.writable(s);if(s.draft)throw new Error('先保存或丢弃当前草稿，再导入备份。');
    const incoming=structuredClone(backup.data);
    // Conservative merge: retain local conflicts. Remap unique-session duplicates.
    const merge=<T extends {id:string}>(local:T[],external:T[])=>[...local,...external.filter(x=>!local.some(y=>y.id===x.id))];
    s.profile ||= incoming.profile;
    s.lessons=merge(s.lessons,incoming.lessons);
    s.plans=merge(s.plans,incoming.plans.map(p=>({...p,status:p.status==='active'&&s.plans.some(p=>p.status==='active')?'paused':p.status})));
    const remap=new Map<string,string>(); for(const w of incoming.workouts){const local=s.workouts.find(x=>x.sessionId===w.sessionId);if(local)remap.set(w.id,local.id);}
    s.workouts=merge(s.workouts,incoming.workouts.filter(w=>!remap.has(w.id)));
    s.scheduled=merge(s.scheduled,incoming.scheduled.map(x=>({...x,linkedSessionId:x.linkedSessionId?remap.get(x.linkedSessionId)||x.linkedSessionId:undefined})));
    if(incoming.draft)s.draft={...incoming.draft,owner:'',leaseUntil:0,state:incoming.draft.state==='running'?'suspended':incoming.draft.state};
  },expectedRevision);}
}
export function importPreview(backup:Backup,local:Snapshot) {
  let added=0,duplicates=0,conflicts=0;
  for(const w of backup.data.workouts){const old=local.workouts.find(x=>x.id===w.id||x.sessionId===w.sessionId);if(!old)added++;else if(JSON.stringify(old)===JSON.stringify(w))duplicates++;else conflicts++;}
  return {added,duplicates,conflicts};
}

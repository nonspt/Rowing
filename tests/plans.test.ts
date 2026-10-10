import test from 'node:test';
import assert from 'node:assert/strict';
import {presets,planDurations} from '../src/content/presets.ts';
import {createFocusedPlan,focusedEligibility,syncPlanProgress,type PlanInput} from '../src/domain/focused-plans.ts';
import {validateTrainingDefinition} from '../src/domain/plan-definition.ts';
import {validateSnapshot,parseBackup} from '../src/domain/validation.ts';
import {emptySnapshot,newEntity,type Profile} from '../src/domain/types.ts';
import {Repository} from '../src/repositories/repository.ts';
import {AppService,blankMetrics} from '../src/application/service.ts';
import {adoptPlan,editCustomPlan,adjustPlanSession} from '../src/application/plan-service.ts';
import {courseById} from '../src/content/courses.ts';
const profile=():Profile=>({...newEntity('profile'),experience:'new',goal:'aerobic',weeklyDays:3,availableMinutes:30,machine:'通用',timeZone:'Asia/Shanghai',sound:false});
const input=():PlanInput=>({title:'我的有氧',startDate:'2026-10-12',training:{mode:'aerobic',weeks:6,weeklyDays:3,custom:{warmupMinutes:5,cooldownMinutes:5,workSeconds:900,recoverySeconds:0,repeats:1}}});
test('六种模板 × 五种周期：完整日程、完整热身放松、有氧与无氧分开',()=>{
  for(const preset of presets)for(const weeks of planDurations){
    const result=createFocusedPlan({title:preset.title,startDate:'2026-10-12',training:{mode:preset.mode,weeks,weeklyDays:preset.weeklyDays,presetId:preset.id}},'Asia/Shanghai');
    assert.equal(result.sessions.length,weeks*preset.weeklyDays);assert.equal(result.sessions.at(-1)!.week,weeks-1);
    const state=emptySnapshot();state.plans=[result.plan];state.scheduled=result.sessions;validateSnapshot(state);
    for(const s of result.sessions){assert.equal(s.course.stages[0].kind,'warmup');assert.equal(s.course.stages.at(-1)!.kind,'cooldown');assert.equal(s.course.plannedDurationSeconds,s.course.stages.reduce((sum,x)=>sum+x.durationSeconds,0));if(preset.mode==='aerobic')assert.equal(s.course.category,'aerobic');if(s.course.category==='interval')assert.equal(s.course.stages.at(-2)!.kind,'recovery');}
    const anaerobic=result.sessions.filter(s=>s.course.category==='interval');for(let i=1;i<anaerobic.length;i++)assert.ok(Date.parse(anaerobic[i].localDate)-Date.parse(anaerobic[i-1].localDate)>=3*86400000);
  }
});
test('自定义 1–52 周边界与参数限制，不接受危险间歇参数',()=>{
  for(const weeks of [1,52]){const i=input();i.training.weeks=weeks;assert.equal(createFocusedPlan(i,'Asia/Shanghai').sessions.length,weeks*3);}
  for(const weeks of [0,53,1.5])assert.throws(()=>createFocusedPlan({...input(),training:{...input().training,weeks}},'UTC'));
  assert.throws(()=>createFocusedPlan({...input(),startDate:'2026-02-30'},'UTC'));
  assert.throws(()=>createFocusedPlan({...input(),title:' '},'UTC'));
  const t={mode:'anaerobic',weeks:8,weeklyDays:2,custom:{warmupMinutes:8,cooldownMinutes:5,workSeconds:30,recoverySeconds:90,repeats:6}};
  validateTrainingDefinition(t);assert.throws(()=>validateTrainingDefinition({...t,weeklyDays:3}));assert.throws(()=>validateTrainingDefinition({...t,custom:{...t.custom,recoverySeconds:60}}));assert.throws(()=>validateTrainingDefinition({...t,custom:{...t.custom,warmupMinutes:5}}));
  assert.throws(()=>validateTrainingDefinition({...input().training,presetId:'AE01'}));
});
test('计划完成自动推进到第 5 周、12 周末；已跳过不计完成',()=>{
  const state=emptySnapshot();state.profile=profile();const i=input();i.training.weeks=12;adoptPlan(state,i);const p=state.plans[0];
  for(const s of state.scheduled.filter(x=>x.week<4))s.status='completed';syncPlanProgress(p,state);assert.equal(p.week,4);assert.equal(p.status,'active');
  state.scheduled.forEach(x=>x.status='skipped');syncPlanProgress(p,state);assert.equal(p.week,11);assert.equal(p.status,'completed');
});
test('编辑自定义保留已完成快照和 ID，只改未来；已有进度禁止改频次和类型',()=>{
  const state=emptySnapshot();state.profile=profile();adoptPlan(state,input());const p=state.plans[0],first=state.scheduled[0];first.status='completed';const original=structuredClone(first),pendingId=state.scheduled[1].id;state.scheduled[1].localDate='2026-10-15';
  const next=input();next.training.weeks=8;next.training.custom!.workSeconds=1200;editCustomPlan(state,p.id,next);
  assert.deepEqual(state.scheduled.find(s=>s.id===original.id),original);assert.equal(state.scheduled.find(s=>s.id===pendingId)!.course.plannedDurationSeconds,1800);assert.equal(state.scheduled.length,24);assert.equal(state.scheduled.find(s=>s.id===pendingId)!.localDate,'2026-10-15');validateSnapshot(state);
  assert.throws(()=>editCustomPlan(state,p.id,{...next,training:{...next.training,weeklyDays:2}}));
});
test('日程冲突及无氧恢复间隔不可绕过；跳过后可恢复',()=>{
  const state=emptySnapshot();state.profile=profile();adoptPlan(state,{title:'无氧',startDate:'2026-10-12',training:{mode:'anaerobic',weeks:4,weeklyDays:3,presetId:'AN02'}});
  const first=state.scheduled[0],second=state.scheduled[2];assert.throws(()=>adjustPlanSession(state,first.id,'move',second.localDate));assert.throws(()=>adjustPlanSession(state,first.id,'move','2026-10-15'));assert.throws(()=>adjustPlanSession(state,first.id,'move','2026-10-20'));
  adjustPlanSession(state,first.id,'skip');assert.equal(first.status,'skipped');adjustPlanSession(state,first.id,'restore');assert.equal(first.status,'planned');
});
test('跟练关联以存储快照为准，拒绝暂停计划；保存幂等及进度持久化',async()=>{
  const r=new Repository(false),s=new AppService(r);await s.saveProfile(profile());await s.adoptFocusedPlan(input(),(await r.read()).revision);
  const first=(await r.read()).scheduled[0],d=await s.beginScheduled(first.id);assert.deepEqual(d.course,first.course);
  d.elapsedMs=d.course.plannedDurationSeconds*1000;d.state='completed';d.endedAt=new Date().toISOString();const saved=await s.checkpoint(d);const f={rpe:0,discomfort:false,note:'',technique:'stable' as const,feeling:'good' as const,assessed:false};await s.finish(saved,f,blankMetrics());await s.finish(saved,f,blankMetrics());let state=await r.read();assert.equal(state.workouts.length,1);assert.equal(state.scheduled.find(x=>x.id===first.id)!.status,'completed');assert.equal(state.workouts[0].feedback.assessed,false);
  await s.adoptFocusedPlan(input(),state.revision);state=await r.read();await assert.rejects(()=>s.beginScheduled(state.scheduled.find(x=>x.planId===first.planId&&x.status==='planned')!.id));
});
test('自定义保存过期 revision 原子拒绝，旧内容不改变',async()=>{
  const r=new Repository(false),s=new AppService(r);await s.saveProfile(profile());const revision=(await r.read()).revision;await s.markBackup();await assert.rejects(()=>s.adoptFocusedPlan(input(),revision));assert.equal((await r.read()).plans.length,0);
});
test('无氧确认、48 小时、单周两次上限以及进阶前置',()=>{
  const state=emptySnapshot();state.profile=profile();const now=Date.parse('2026-10-16T12:00:00Z');
  assert.match(focusedEligibility(courseById('H01'),state,false,now),/确认/);assert.equal(focusedEligibility(courseById('H01'),state,true,now),'');assert.match(focusedEligibility(courseById('H02'),state,true,now),/先完成/);
  const w=(ended:string)=>({...newEntity(),sessionId:crypto.randomUUID(),title:'间歇',startedAt:ended,endedAt:ended,completionStatus:'completed' as const,captureSource:'guided' as const,activeDurationSeconds:1500,workDurationSeconds:120,course:courseById('H01'),stageResults:[],metrics:{},feedback:{rpe:7,discomfort:false,note:'',technique:'stable' as const,feeling:'good' as const}});
  state.workouts=[w('2026-10-15T12:00:00Z')];assert.match(focusedEligibility(courseById('H01'),state,true,now),/48/);
  state.workouts=[w('2026-10-12T12:00:00Z')];assert.equal(focusedEligibility(courseById('H02'),state,true,now),'');state.workouts.push(w('2026-10-14T10:00:00Z'));assert.match(focusedEligibility(courseById('H01'),state,true,now),/两次/);
});
test('v1 备份无损迁移，v2 长周期往返，拒绝错标版本',async()=>{
  const r=new Repository(false),s=new AppService(r);await s.saveProfile(profile());let b=await s.backup();const old={...b,schemaVersion:1,data:{...b.data,schemaVersion:1}};assert.equal(parseBackup(JSON.stringify(old)).data.schemaVersion,2);
  await s.adoptFocusedPlan(input(),b.data.revision);b=await s.backup();assert.deepEqual(parseBackup(JSON.stringify(b)).data.scheduled,b.data.scheduled);assert.throws(()=>parseBackup(JSON.stringify({...b,schemaVersion:1,data:{...b.data,schemaVersion:1}})));
});

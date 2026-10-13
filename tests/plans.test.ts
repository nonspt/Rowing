import test from 'node:test';
import assert from 'node:assert/strict';
import {presets,planDurations} from '../src/content/presets.ts';
import {createFocusedPlan,focusedEligibility,syncPlanProgress,type PlanInput} from '../src/domain/focused-plans.ts';
import {validateTrainingDefinition} from '../src/domain/plan-definition.ts';
import {validateSnapshot,parseBackup} from '../src/domain/validation.ts';
import {emptySnapshot,newEntity,type Profile} from '../src/domain/types.ts';
import {Repository} from '../src/repositories/repository.ts';
import {AppService,blankMetrics} from '../src/application/service.ts';
import {adoptPlan,editCustomPlan,adjustPlanSession,enablePlanCircuit,configurePlanCircuit} from '../src/application/plan-service.ts';
import {defaultCircuit,stageLabel,courseOutline} from '../src/domain/circuit.ts';
import {validateCourse} from '../src/domain/validation.ts';
import {advance,completeRepetitions,currentStage,initialStageProgress,sessionProgress,sessionStageResults,workSeconds} from '../src/domain/session.ts';
import type {Draft} from '../src/domain/types.ts';
import {courseById} from '../src/content/courses.ts';
const countedInput=():PlanInput=>({title:'计次组合',startDate:'2026-10-13',training:{mode:'anaerobic',weeks:2,weeklyDays:1,custom:{warmupMinutes:8,cooldownMinutes:5,workSeconds:20,recoverySeconds:100,repeats:3},circuit:{...defaultCircuit(),targets:{squat:{mode:'reps',repetitions:12},pushup:{mode:'time',seconds:15}}}}});
const tick=(draft:Draft,ms:number)=>{while(ms>0){const delta=Math.min(10000,ms);draft=advance(draft,delta);ms-=delta;}return draft;};
const runCounted=(draft:Draft,seconds=17)=>{draft={...draft,state:'running'};while(draft.state==='running'){const stage=currentStage(draft);draft=tick(draft,(stage.stage.repetitions!==undefined?seconds:stage.remaining)*1000);if(stage.stage.repetitions!==undefined)draft=completeRepetitions(draft);}return draft;};
test('动作可分别计时或计次，次数和动作类型严格校验，旧组合定义不变',()=>{
  const generated=createFocusedPlan(countedInput(),'UTC'),course=generated.sessions[0].course;
  assert.equal(course.contentVersion,'circuit-2+adjust-1');assert.equal(generated.plan.templateVersion,'circuit-2');assert.ok(course.stages.filter(s=>s.exercise==='squat').every(s=>s.repetitions===12));assert.ok(course.stages.filter(s=>s.exercise==='pushup').every(s=>s.repetitions===undefined&&s.durationSeconds===15));validateCourse(course);
  const state=emptySnapshot();state.plans=[generated.plan];state.scheduled=generated.sessions;validateSnapshot(state);
  for(const repetitions of [0,31,1.5,Infinity])assert.throws(()=>validateTrainingDefinition({...countedInput().training,circuit:{...defaultCircuit(),targets:{squat:{mode:'reps',repetitions}}}}));
  assert.throws(()=>validateTrainingDefinition({...countedInput().training,circuit:{...defaultCircuit(),targets:{squat:{mode:'reps',repetitions:12,seconds:20}}}}));
  assert.throws(()=>validateTrainingDefinition({...countedInput().training,circuit:{...defaultCircuit(),targets:{burpee:{mode:'reps',repetitions:12}}}}));
  for(const exercise of ['row','rest',undefined])assert.throws(()=>validateCourse({...course,stages:course.stages.map((s,i)=>i===0?{...s,exercise,repetitions:2}:s)}));
  assert.equal(createFocusedPlan({...countedInput(),training:{...countedInput().training,circuit:defaultCircuit()}},'UTC').sessions[0].course.contentVersion,'circuit-1+adjust-1');
});
test('计次段等待主动确认，超估算不自动前进；暂停、长间隔不补计',()=>{
  const course=createFocusedPlan(countedInput(),'UTC').sessions[0].course,setIndex=course.stages.findIndex(s=>s.repetitions!==undefined);
  let draft:Draft={...newEntity(),course,state:'running',elapsedMs:0,startedAt:new Date().toISOString(),owner:'test',leaseUntil:0,revision:0,stageProgress:initialStageProgress(course)};
  draft=tick(draft,course.stages.slice(0,setIndex).reduce((s,x)=>s+x.durationSeconds,0)*1000);assert.equal(currentStage(draft).stage.exercise,'squat');
  draft=tick(draft,60000);assert.equal(currentStage(draft).index,setIndex);assert.equal(currentStage(draft).elapsed,60);const progress=sessionProgress(draft),elapsed=draft.elapsedMs;
  assert.equal(sessionProgress(tick(draft,5000)),progress);assert.equal(advance({...draft,state:'paused'},5000).elapsedMs,elapsed);assert.equal(advance(draft,10001).elapsedMs,elapsed);assert.equal(advance(draft,10001).state,'suspended');
  assert.throws(()=>completeRepetitions({...draft,state:'paused'}));draft=completeRepetitions(draft);assert.equal(currentStage(draft).stage.exercise,'rest');assert.equal(draft.stageProgress!.results[setIndex].completedRepetitions,12);assert.equal(draft.stageProgress!.results[setIndex].actualSeconds,60);assert.ok(sessionProgress(draft)>progress);
});
test('计次完成按实际时间保存、次数有明确结果，完成整课与日程幂等',async()=>{
  const repository=new Repository(false),service=new AppService(repository);await service.adoptFocusedPlan(countedInput(),0);const draft=await service.beginScheduled((await repository.read()).scheduled[0].id,true),completed=runCounted(draft),saved=await service.checkpoint({...completed,endedAt:new Date().toISOString()});
  assert.notEqual(saved.elapsedMs,saved.course.plannedDurationSeconds*1000);assert.equal(saved.state,'completed');assert.equal(sessionProgress(saved),100);assert.ok(sessionStageResults(saved).every(s=>s.status==='completed'));
  const feedback={rpe:0,discomfort:false,note:'',technique:'stable' as const,feeling:'good' as const,assessed:false};await service.finish(saved,feedback,blankMetrics());await service.finish(saved,feedback,blankMetrics());const state=await repository.read(),record=state.workouts[0];validateSnapshot(state);
  assert.equal(state.workouts.length,1);assert.equal(record.activeDurationSeconds,saved.elapsedMs/1000);assert.equal(record.workDurationSeconds,60+3*17+3*15);assert.equal(state.scheduled[0].status,'completed');assert.deepEqual(record.stageResults.filter(s=>s.completedRepetitions!==undefined).map(s=>s.completedRepetitions),[12,12,12]);
});
test('计次提前结束不伪造次数，备份往返保留草稿游标并拒绝错标进度',async()=>{
  const repository=new Repository(false),service=new AppService(repository);await service.adoptFocusedPlan(countedInput(),0);let draft=await service.beginScheduled((await repository.read()).scheduled[0].id,true);const setIndex=draft.course.stages.findIndex(s=>s.repetitions!==undefined);draft={...draft,state:'running'};draft=tick(draft,draft.course.stages.slice(0,setIndex).reduce((s,x)=>s+x.durationSeconds,0)*1000+43000);draft={...draft,state:'paused'};await service.checkpoint(draft);
  const backup=await service.backup(),parsed=parseBackup(JSON.stringify(backup));assert.deepEqual(parsed.data.draft!.stageProgress,backup.data.draft!.stageProgress);const restored=new AppService(new Repository(false));await restored.importBackup(parsed,0);let claimed=await restored.claim();assert.equal(currentStage(claimed).stage.exercise,'squat');assert.equal(currentStage(claimed).elapsed,43);
  for(const change of [d=>delete d.stageProgress,d=>d.stageProgress.index++,d=>d.stageProgress.elapsedMs++,d=>d.stageProgress.results[0].actualSeconds--]){const invalid=structuredClone(backup);change(invalid.data.draft);assert.throws(()=>parseBackup(JSON.stringify(invalid)));}
  claimed=await restored.checkpoint({...claimed,state:'ended-early',endedAt:new Date().toISOString()});await restored.finish(claimed,{rpe:0,discomfort:false,note:'',technique:'stable',feeling:'good',assessed:false},blankMetrics());const state=await restored.repository.read(),result=state.workouts[0].stageResults[setIndex];assert.equal(result.actualSeconds,43);assert.equal(result.status,'partial');assert.equal(result.completedRepetitions,undefined);assert.equal(state.scheduled[0].status,'planned');
});
test('模板徒手设置只改待训练快照，保留完成、跳过、日期、ID；草稿与旧 revision 拒绝',async()=>{
  const state=emptySnapshot();state.profile=profile();adoptPlan(state,{title:'模板无氧',startDate:'2026-10-13',training:{mode:'anaerobic',weeks:4,weeklyDays:2,presetId:'AN01',circuit:defaultCircuit()}});state.scheduled[0].status='completed';state.scheduled[1].status='skipped';const before=structuredClone(state.scheduled),id=state.plans[0].id;configurePlanCircuit(state,id,countedInput().training.circuit!);validateSnapshot(state);assert.deepEqual(state.scheduled.slice(0,2),before.slice(0,2));for(const item of state.scheduled){assert.equal(item.id,before.find(s=>s.id===item.id)!.id);assert.equal(item.localDate,before.find(s=>s.id===item.id)!.localDate);}assert.ok(state.scheduled.filter(s=>s.status==='planned'&&s.course.category==='interval').every(s=>s.course.stages.some(x=>x.repetitions===12)));
  const repository=new Repository(false),service=new AppService(repository);await service.adoptFocusedPlan(countedInput(),0);const saved=await repository.read();await service.markBackup();await assert.rejects(()=>service.configureFocusedCircuit(saved.plans[0].id,defaultCircuit(),saved.revision));assert.deepEqual((await repository.read()).plans,saved.plans);
  await service.beginScheduled(saved.scheduled[0].id,true);const current=await repository.read();await assert.rejects(()=>service.configureFocusedCircuit(saved.plans[0].id,defaultCircuit(),current.revision));assert.deepEqual(await repository.read(),current);
});
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
  assert.deepEqual(state.scheduled.find(s=>s.id===original.id),original);assert.equal(state.scheduled.find(s=>s.id===pendingId)!.course.plannedDurationSeconds,1810);assert.equal(state.scheduled.length,24);assert.equal(state.scheduled.find(s=>s.id===pendingId)!.localDate,'2026-10-15');validateSnapshot(state);
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

test('组合模板：每轮独立恢复、换位、深蹲与俯卧撑；所有周期与总时长有效',()=>{
  for(const preset of presets.filter(p=>p.mode==='anaerobic'))for(const weeks of planDurations){
    const result=createFocusedPlan({title:preset.title,startDate:'2026-10-12',training:{mode:preset.mode,weeks,weeklyDays:preset.weeklyDays,presetId:preset.id,circuit:defaultCircuit()}},'UTC');
    const state=emptySnapshot();state.plans=[result.plan];state.scheduled=result.sessions;validateSnapshot(state);
    for(const {course} of result.sessions.filter(s=>s.course.category==='interval')){
      assert.equal(course.contentVersion,'circuit-1+adjust-1');const main=course.stages.slice(1,-1).filter(s=>!s.adjustment);assert.equal(main.length,(preset.id==='AN01'?3:4)*8);
      for(let i=0;i<main.length;i+=8){assert.deepEqual(main.slice(i,i+8).map(s=>s.exercise),['row','row','off-rower','squat','rest','pushup','rest','on-rower']);assert.ok(main[i+1].durationSeconds>=main[i].durationSeconds*3);assert.equal(main[i+2].durationSeconds,20);assert.equal(main[i+7].durationSeconds,20);assert.ok(main[i+4].durationSeconds>=main[i+3].durationSeconds*2);}
      assert.equal(course.stages.at(-2)!.kind,'recovery');assert.deepEqual(courseOutline(course).map(s=>s.label),['热身划船','快划','自重深蹲','俯卧撑','放松划船']);
    }
  }
});
test('组合参数：至少一个动作、禁止重复与未知动作、不足恢复或有氧混入',()=>{
  const t={mode:'anaerobic',weeks:4,weeklyDays:1,custom:{warmupMinutes:8,cooldownMinutes:5,workSeconds:20,recoverySeconds:100,repeats:3},circuit:defaultCircuit()};
  for(const circuit of [{...t.circuit,exercises:[]},{...t.circuit,exercises:['squat','squat']},{...t.circuit,exercises:['burpee']},{...t.circuit,workSeconds:31},{...t.circuit,workSeconds:30,restSeconds:40},{...t.circuit,restSeconds:Infinity}])assert.throws(()=>validateTrainingDefinition({...t,circuit}));
  assert.throws(()=>validateTrainingDefinition({...input().training,circuit:defaultCircuit()}));
  validateTrainingDefinition({...t,circuit:{exercises:['pushup'],workSeconds:10,restSeconds:30}});
});
test('旧无氧计划显式升级：保留完成、跳过、日期、ID 与原快照，不覆盖草稿',()=>{
  const state=emptySnapshot();state.profile=profile();adoptPlan(state,{title:'旧无氧',startDate:'2026-10-12',training:{mode:'anaerobic',weeks:4,weeklyDays:3,presetId:'AN02'}});
  const plan=state.plans[0];state.scheduled[0].status='completed';state.scheduled[1].status='skipped';state.scheduled[2].localDate='2026-10-18';const original=structuredClone(state.scheduled);
  enablePlanCircuit(state,plan.id);assert.deepEqual(state.scheduled.slice(0,2),original.slice(0,2));
  for(let i=2;i<state.scheduled.length;i++){assert.equal(state.scheduled[i].id,original[i].id);assert.equal(state.scheduled[i].localDate,original[i].localDate);}
  assert.equal(original[2].course.contentVersion,'1.0.0+adjust-1');assert.equal(state.scheduled[2].course.contentVersion,'circuit-1+adjust-1');validateSnapshot(state);
  const blocked=emptySnapshot();blocked.draft={} as Draft;assert.throws(()=>enablePlanCircuit(blocked,plan.id));assert.throws(()=>enablePlanCircuit(state,plan.id));
});
test('组合阶段边界与工作统计：换位和休息不计工作，徒手工作按实计入',()=>{
  const result=createFocusedPlan({title:'组合',startDate:'2026-10-12',training:{mode:'anaerobic',weeks:2,weeklyDays:2,presetId:'AN01',circuit:defaultCircuit()}},'UTC'),course=result.sessions[0].course;
  const draft:Draft={...newEntity(),course,state:'paused',elapsedMs:0,startedAt:new Date().toISOString(),owner:'',leaseUntil:0,revision:0};
  let elapsed=0,work=0;
  for(let i=0;i<course.stages.length;i++){const s=course.stages[i];draft.elapsedMs=elapsed*1000;assert.equal(currentStage(draft).index,i);assert.equal(stageLabel(currentStage(draft).stage),stageLabel(s));assert.equal(workSeconds(draft),work);elapsed+=s.durationSeconds;if(s.kind==='work')work+=s.durationSeconds;}
  draft.elapsedMs=elapsed*1000;assert.equal(workSeconds(draft),180);assert.equal(workSeconds(draft),work);
});
test('组合备份完整往返，旧无动作字段保持原值，拒绝无效动作元数据',async()=>{
  const r=new Repository(false),s=new AppService(r);await s.saveProfile(profile());await s.adoptFocusedPlan({title:'组合',startDate:'2026-10-12',training:{mode:'anaerobic',weeks:4,weeklyDays:2,presetId:'AN01',circuit:defaultCircuit()}},(await r.read()).revision);
  const b=await s.backup();assert.deepEqual(parseBackup(JSON.stringify(b)).data,b.data);const old=courseById('H01');validateCourse(old);assert.equal(old.stages[0].exercise,undefined);
  const bad=structuredClone(b.data.scheduled[0].course);bad.stages[1].exercise='burpee' as never;assert.throws(()=>validateCourse(bad));bad.stages[1].exercise='squat';bad.stages[1].kind='recovery';assert.throws(()=>validateCourse(bad));
});
test('组合升级 revision 冲突原子拒绝；自定义编辑保留完成快照',async()=>{
  const r=new Repository(false),s=new AppService(r);await s.saveProfile(profile());await s.adoptFocusedPlan({title:'旧无氧',startDate:'2026-10-12',training:{mode:'anaerobic',weeks:4,weeklyDays:2,presetId:'AN01'}},(await r.read()).revision);const before=await r.read();await s.markBackup();await assert.rejects(()=>s.enableFocusedCircuit(before.plans[0].id,before.revision));assert.deepEqual((await r.read()).scheduled,before.scheduled);
  const state=emptySnapshot();state.profile=profile();const i:PlanInput={title:'自定义组合',startDate:'2026-10-12',training:{mode:'anaerobic',weeks:2,weeklyDays:1,custom:{warmupMinutes:8,cooldownMinutes:5,workSeconds:20,recoverySeconds:100,repeats:3},circuit:defaultCircuit()}};adoptPlan(state,i);state.scheduled[0].status='completed';const saved=structuredClone(state.scheduled[0]);i.training.circuit={exercises:['pushup'],workSeconds:10,restSeconds:30};editCustomPlan(state,state.plans[0].id,i);assert.deepEqual(state.scheduled.find(x=>x.id===saved.id),saved);assert.equal(state.scheduled[1].course.stages.some(x=>x.exercise==='squat'),false);
});

test('删除全部数据清空完整快照、递增 revision；可从备份恢复',async()=>{
  const r=new Repository(false),s=new AppService(r);await s.saveProfile({...profile(),sound:true});
  await s.adoptFocusedPlan(input(),(await r.read()).revision);await s.saveLesson('catch',[true,false,true,false]);
  const item=(await r.read()).scheduled[0],draft=await s.beginScheduled(item.id);
  draft.state='ended-early';draft.elapsedMs=1000;const saved=await s.checkpoint(draft);
  await s.finish(saved,{rpe:0,discomfort:false,note:'',technique:'stable',feeling:'good',assessed:false},blankMetrics());
  await s.beginScheduled(item.id);await s.markBackup();const backup=await s.backup(),before=await r.read();
  await s.deleteAllData(before.revision);const cleared=await r.read();
  assert.deepEqual(cleared,{...emptySnapshot(),revision:before.revision+1});
  await assert.rejects(()=>s.checkpoint(saved));assert.deepEqual(await r.read(),cleared);
  await s.importBackup(backup,cleared.revision);const restored=await r.read();
  assert.deepEqual(restored.plans,backup.data.plans);assert.deepEqual(restored.workouts,backup.data.workouts);
  assert.deepEqual(restored.lessons,backup.data.lessons);assert.equal(restored.profile!.sound,true);assert.ok(restored.draft);
});

test('删除预览过期或其他窗口持有有效草稿时原子拒绝，保留所有数据',async()=>{
  const r=new Repository(false),first=new AppService(r),second=new AppService(r);
  await first.saveProfile(profile());await first.adoptFocusedPlan(input(),(await r.read()).revision);
  const revision=(await r.read()).revision;await first.markBackup();let state=await r.read();
  await assert.rejects(()=>first.deleteAllData(revision),/数据已改变/);assert.deepEqual(await r.read(),state);
  const draft=await first.beginScheduled(state.scheduled[0].id);draft.state='running';await first.checkpoint(draft);state=await r.read();
  await assert.rejects(()=>second.deleteAllData(state.revision),/其他窗口/);assert.deepEqual(await r.read(),state);
});

test('清空后可直接建立新计划，默认偏好恢复，不依赖刷新',async()=>{
  const r=new Repository(false),s=new AppService(r);await s.saveProfile({...profile(),sound:true});
  await s.deleteAllData((await r.read()).revision);assert.equal((await r.read()).profile,null);
  await s.adoptFocusedPlan(input(),(await r.read()).revision);const state=await r.read();
  assert.equal(state.profile!.sound,false);assert.equal(state.plans.length,1);assert.equal(state.scheduled.length,input().training.weeks*input().training.weeklyDays);validateSnapshot(state);
});

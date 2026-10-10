import test from 'node:test';
import assert from 'node:assert/strict';
import {courses,courseById,planTemplates} from '../src/content/courses.ts';
import {advance,currentStage,workSeconds} from '../src/domain/session.ts';
import {emptySnapshot,newEntity,APP_VERSION,CONTENT_VERSION} from '../src/domain/types.ts';
import type {Backup,Draft,Profile,Workout} from '../src/domain/types.ts';
import {addDays,canAdvancePlan,courseEligibility,intervalEligibility,previewPlan,weekStart,weekStats} from '../src/domain/plans.ts';
import {parseBackup,validateWorkout,validateCourse} from '../src/domain/validation.ts';
import {rowingPose,strokeStepIndex,strokeSteps} from '../src/domain/rowing-motion.ts';
import {AppService,blankMetrics,metricsFromInput} from '../src/application/service.ts';
import {Repository} from '../src/repositories/repository.ts';
const profile=():Profile=>({...newEntity('profile'),experience:'new',goal:'technique',weeklyDays:3,availableMinutes:30,machine:'通用',timeZone:'Asia/Shanghai',sound:false});
const draft=():Draft=>({...newEntity(),course:courseById('T01'),state:'running',elapsedMs:0,startedAt:new Date().toISOString(),owner:'test',leaseUntil:Date.now()+15000,revision:0});
const workout=():Workout=>({...newEntity(),sessionId:crypto.randomUUID(),title:'测试',startedAt:new Date().toISOString(),endedAt:new Date().toISOString(),completionStatus:'completed',captureSource:'manual-entry',activeDurationSeconds:900,workDurationSeconds:0,stageResults:[],feedback:{rpe:4,discomfort:false,note:'',technique:'stable',feeling:'good'},metrics:{distance:null,pace:null}});
test('官方动作规则：固定肢段、水平手柄路径、驱动及回桨顺序',()=>{
  const distance=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
  const catchPose=rowingPose(0),finish=rowingPose(.36);
  assert.ok(Math.abs(catchPose.knee.x-catchPose.ankle.x)<2,'入水位小腿接近垂直');
  assert.ok(catchPose.shoulder.x>catchPose.hip.x);assert.ok(finish.shoulder.x<finish.hip.x);
  assert.ok(finish.hand.x>finish.hip.x&&finish.hand.y>finish.shoulder.y,'手柄位于躯干前方下肋附近');
  for(let i=0;i<1000;i++){
    const progress=i/1000,p=rowingPose(progress);
    for(const [a,b,length]of [[p.hip,p.knee,90],[p.knee,p.ankle,80],[p.shoulder,p.elbow,49],[p.elbow,p.hand,49]] as const)assert.ok(Math.abs(distance(a,b)-length)<.0001);
    assert.equal(p.hand.y,170);assert.deepEqual(p.ankle,catchPose.ankle);
    if(progress<.19){assert.ok(Math.abs(distance(p.shoulder,p.hand)-98)<.0001);assert.ok(Math.abs((p.shoulder.x-p.hip.x)-(catchPose.shoulder.x-catchPose.hip.x))<.0001);}
    if(progress>=.36&&progress<=.64)assert.equal(p.hip.x,finish.hip.x,'回桨先手与躯干，再前滑');
    if(progress>=.48)assert.ok(Math.abs(distance(p.shoulder,p.hand)-98)<.0001,'屈膝前手臂已伸直');
  }
  assert.ok(distance(rowingPose(.999999).hip,catchPose.hip)<.001,'循环连续');
  assert.deepEqual(strokeSteps.map(s=>strokeStepIndex(s.start)),[0,1,2,3,4,5]);
});
test('内容确认升级兼容旧草案快照，不改写已保存记录',()=>{
  assert.equal(CONTENT_VERSION,'1.0.0');assert.ok(courses.every(c=>c.status==='confirmed'));
  const old={...structuredClone(courseById('T01')),status:'draft',contentVersion:'draft-1'};
  validateCourse(old);assert.equal(old.status,'draft');assert.equal(old.contentVersion,'draft-1');
  validateCourse(courseById('T01'));assert.throws(()=>validateCourse({...old,status:'unknown'}));
  const state=emptySnapshot();state.draft={...draft(),course:old,state:'paused'};
  const backup:Backup={format:'home-rower-backup',exportVersion:1,schemaVersion:1,appVersion:'0.1.0',contentVersion:'draft-1',exportedAt:new Date().toISOString(),counts:{workouts:0,plans:0,scheduled:0,lessons:0},data:state};
  assert.equal(parseBackup(JSON.stringify({...backup,data:{...state,schemaVersion:1}})).data.draft?.course.contentVersion,'draft-1');
});
test('10 门课程及全部 12 行计划符合文档时长，恢复段包含最后一次',()=>{
  assert.deepEqual(courses.map(c=>c.plannedDurationSeconds/60),[14,16,15,25,24,30,26,25,25,12]);
  const totals=planTemplates.map(p=>p.weeks.map(week=>week.reduce((sum,id)=>sum+courseById(id).plannedDurationSeconds/60,0)));
  assert.deepEqual(totals,[[45,44,55,64],[74,79,85,74],[75,75,80,55]]);
  assert.equal(courses.find(c=>c.id==='H01')!.stages.at(-2)!.kind,'recovery');
});
test('单调时间跨段、暂停和挂起不补算未知活动',()=>{
  let d=draft();for(let i=0;i<18;i++)d=advance(d,10000);
  assert.equal(currentStage(d).index,1);assert.equal(d.elapsedMs,180000);
  assert.equal(advance({...d,state:'paused'},5000).elapsedMs,d.elapsedMs);
  const lost=advance(d,10001);assert.equal(lost.state,'suspended');assert.equal(lost.elapsedMs,d.elapsedMs);
  assert.equal(advance(d,-1).state,'suspended');
});
test('完整训练精确结束，工作时长不包含恢复与热身',()=>{
  let d=draft();for(let i=0;i<84;i++)d=advance(d,10000);
  assert.equal(d.state,'completed');assert.equal(workSeconds(d),240);assert.equal(d.elapsedMs,840000);assert.equal(currentStage(d).remaining,0);
});
test('距离空值不伪造读数，配速仅用整次时间范围',()=>{
  assert.equal(metricsFromInput(blankMetrics(),900).pace,null);
  const metrics=metricsFromInput({...blankMetrics(),distance:'2000'},600);
  assert.equal(metrics.pace?.value,150);assert.equal(metrics.pace?.source,'derived');
  const w=workout();w.metrics=metricsFromInput({...blankMetrics(),distance:'0'},600);assert.throws(()=>validateWorkout(w));
  w.metrics={distance:null};w.feedback.note='x'.repeat(301);assert.throws(()=>validateWorkout(w));
});
test('跨时区周一归属，不使用 UTC 零点切分本地训练',()=>{
  const w=workout();w.startedAt='2026-10-04T16:30:00.000Z';w.endedAt='2026-10-04T16:45:00.000Z';
  assert.equal(weekStart('2026-10-05'),'2026-10-05');assert.equal(addDays('2026-12-31',1),'2027-01-01');
  assert.equal(weekStats([w],'Asia/Shanghai',new Date('2026-10-08')).count,1);
  assert.equal(weekStats([w],'UTC',new Date('2026-10-08')).count,0);
});
test('计划匹配可用时间，不丢弃热身放松；日期不自动升级',()=>{
  const state=emptySnapshot();state.profile=profile();state.profile.availableMinutes=15;
  const result=previewPlan('P02',state,'2026-10-08');
  assert.ok(result.sessions.every(s=>s.course.plannedDurationSeconds<=900));assert.equal(result.plan.week,0);assert.equal(canAdvancePlan(result.plan,state),false);
  assert.ok(result.sessions.every(s=>s.course.stages[0].kind==='warmup'&&s.course.stages.at(-1)!.kind==='cooldown'));
});
test('高强度条件、48 小时间隔与进阶体验要求',()=>{
  const state=emptySnapshot();state.profile=profile();assert.equal(intervalEligibility(state).allowed,false);state.profile.experience='regular';
  const now=Date.now();state.workouts=Array.from({length:3},(_,i)=>({...workout(),course:courseById('A02'),endedAt:new Date(now-(i+3)*86400000).toISOString()}));
  assert.equal(intervalEligibility(state,now).allowed,true);assert.equal(courseEligibility(courseById('H02'),state).allowed,false);
  state.workouts.push({...workout(),course:courseById('H01'),endedAt:new Date(now-3600000).toISOString()});assert.equal(intervalEligibility(state,now).allowed,false);
});
test('备份验证拒绝未来版本、重复会话、错误计数与危险字段',()=>{
  const data=emptySnapshot();data.profile=profile();data.workouts=[workout()];
  const backup:Backup={format:'home-rower-backup',exportVersion:1,schemaVersion:2,appVersion:APP_VERSION,contentVersion:CONTENT_VERSION,exportedAt:new Date().toISOString(),counts:{workouts:1,plans:0,scheduled:0,lessons:0},data};
  assert.equal(parseBackup(JSON.stringify(backup)).data.workouts.length,1);
  assert.throws(()=>parseBackup(JSON.stringify({...backup,schemaVersion:3})));
  assert.throws(()=>parseBackup(JSON.stringify({...backup,counts:{...backup.counts,workouts:2}})));
  assert.throws(()=>parseBackup('{"__proto__":{}}'));
  const duplicate=structuredClone(backup);duplicate.data.workouts.push({...data.workouts[0],id:crypto.randomUUID()});duplicate.counts.workouts++;assert.throws(()=>parseBackup(JSON.stringify(duplicate)));
});
test('保存幂等，冲突不覆盖，导入 revision 过期时保留原数据',async()=>{
  const repository=new Repository(false),service=new AppService(repository);await repository.initialize();await service.saveProfile(profile());
  const d=await service.begin(courseById('T01'));d.elapsedMs=10000;d.state='ended-early';const saved=await service.checkpoint(d);await service.finish(saved,{rpe:3,discomfort:false,note:'',technique:'stable',feeling:'good'},blankMetrics());await service.finish(saved,{rpe:3,discomfort:false,note:'',technique:'stable',feeling:'good'},blankMetrics());
  let state=await repository.read();assert.equal(state.workouts.length,1);const backup=await service.backup(),rev=state.revision;
  await service.markBackup();await assert.rejects(()=>service.importBackup(backup,rev));state=await repository.read();assert.equal(state.workouts.length,1);
  const changed=structuredClone(backup);changed.data.workouts[0].feedback.note='外部冲突';await service.importBackup(changed,state.revision);assert.equal((await repository.read()).workouts[0].feedback.note,'');
});
test('第二窗口不能抢占有效租约；旧 revision 检查点拒绝覆盖',async()=>{
  const repository=new Repository(false),first=new AppService(repository),second=new AppService(repository);await first.saveProfile(profile());const d=await first.begin(courseById('A01'));d.state='running';const running=await first.checkpoint(d);
  await assert.rejects(()=>second.claim());const paused=await first.checkpoint({...running,state:'paused'});const restored=await second.claim();assert.equal(restored.state,'suspended');await assert.rejects(()=>first.checkpoint(paused));assert.equal((await repository.read()).draft?.elapsedMs,0);
});

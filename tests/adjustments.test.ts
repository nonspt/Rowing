import test from 'node:test';
import assert from 'node:assert/strict';
import {courseById} from '../src/content/courses.ts';
import {withRowingAdjustments,refreshPendingAdjustments} from '../src/domain/rowing-adjustments.ts';
import {createFocusedPlan} from '../src/domain/focused-plans.ts';
import {withCircuit,defaultCircuit,stageLabel} from '../src/domain/circuit.ts';
import {validateCourse,parseBackup} from '../src/domain/validation.ts';
import {emptySnapshot,newEntity} from '../src/domain/types.ts';
import type {Course,Draft} from '../src/domain/types.ts';
import {Repository} from '../src/repositories/repository.ts';
import {AppService} from '../src/application/service.ts';

test('连续划船用力改变前插入五秒，目标跟随下一段，重复应用不增加时间',()=>{
  const source=courseById('A01'),before=structuredClone(source),course=withRowingAdjustments(source),adjustments=course.stages.filter(s=>s.adjustment);
  assert.equal(adjustments.length,2);assert.equal(course.plannedDurationSeconds,source.plannedDurationSeconds+10);assert.deepEqual(source,before);assert.equal(withRowingAdjustments(course),course);
  for(const stage of adjustments){assert.equal(stage.durationSeconds,5);assert.equal(stageLabel(stage),'调整设备');assert.deepEqual(stage.rpe,course.stages[course.stages.indexOf(stage)+1].rpe);}
  const equal:Course={...source,stages:source.stages.map(s=>({...s,rpe:[2,3]}))};assert.equal(withRowingAdjustments(equal),equal);validateCourse(course);
});
test('徒手、站立休息与换位之间不插入调整；组合调整时间只来自相邻划船',()=>{
  const source=withCircuit(courseById('H01'),defaultCircuit(),3),course=withRowingAdjustments(source);assert.equal(course.stages.filter(s=>s.adjustment).length,4);assert.equal(course.plannedDurationSeconds,1640);
  for(let i=0;i<course.stages.length;i++){if(course.stages[i].adjustment){assert.equal(course.stages[i-1].exercise,'row');assert.equal(course.stages[i+1].exercise,'row');}}
  assert.ok(course.stages.filter(s=>s.exercise==='rest').every(s=>stageLabel(s)==='站立休息'));validateCourse(course);
});
test('调整标记严格限制为五秒划船恢复段，非法备份字段拒绝',()=>{
  const source=withRowingAdjustments(courseById('A01'));for(const mutate of [(s:any)=>s.durationSeconds=6,(s:any)=>s.kind='work',(s:any)=>s.exercise='squat',(s:any)=>s.adjustment=false,(s:any)=>s.repetitions=12]){const invalid=structuredClone(source);mutate(invalid.stages.find(s=>s.adjustment));assert.throws(()=>validateCourse(invalid));}
});
test('待训练升级保留 ID / 日期；已完成、跳过和旧草稿保持原始快照',()=>{
  const state=emptySnapshot(),generated=createFocusedPlan({title:'测试',startDate:'2026-10-13',training:{mode:'aerobic',weeks:2,weeklyDays:3,presetId:'AE01'}},'UTC');state.plans=[generated.plan];state.scheduled=generated.sessions.map(item=>({...item,course:{...item.course,stages:item.course.stages.filter(s=>!s.adjustment),contentVersion:'focused-1',plannedDurationSeconds:item.course.plannedDurationSeconds-10}}));state.scheduled[0].status='completed';state.scheduled[1].status='skipped';const before=structuredClone(state.scheduled);
  refreshPendingAdjustments(state);assert.deepEqual(state.scheduled.slice(0,2),before.slice(0,2));for(let i=2;i<state.scheduled.length;i++){assert.equal(state.scheduled[i].id,before[i].id);assert.equal(state.scheduled[i].localDate,before[i].localDate);assert.equal(state.scheduled[i].version,before[i].version+1);}
  state.draft={...newEntity(),course:before[2].course,state:'paused',elapsedMs:1000,startedAt:new Date().toISOString(),owner:'old',leaseUntil:0,revision:0,scheduledId:before[2].id} as Draft;const snapshot=structuredClone(state);refreshPendingAdjustments(state);assert.deepEqual(state,snapshot);
});
test('调整段通过真实服务建立草稿，v2 备份往返保留，重复维护不递增 revision',async()=>{
  const repository=new Repository(false);await repository.initialize();const service=new AppService(repository);await service.adoptFocusedPlan({title:'测试',startDate:'2026-10-13',training:{mode:'aerobic',weeks:2,weeklyDays:3,presetId:'AE01'}},(await repository.read()).revision);const before=await repository.read();assert.equal((await service.refreshPendingCourses()).revision,before.revision);const draft=await service.beginScheduled(before.scheduled[0].id);assert.ok(draft.course.stages.some(s=>s.adjustment));const backup=await service.backup();assert.deepEqual(parseBackup(JSON.stringify(backup)).data,JSON.parse(JSON.stringify(backup.data)));
});

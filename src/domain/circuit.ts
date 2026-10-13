import type {Circuit,Course,Stage} from './types.ts';
import {stageNames} from '../content/courses.ts';

export const defaultCircuit=():Circuit=>({exercises:['squat','pushup'],workSeconds:20,restSeconds:40});
export const exerciseNames={squat:'自重深蹲',pushup:'俯卧撑'};
const cues={squat:'脚掌保持着地，髋膝一起屈伸；在可控范围内下蹲。',pushup:'收紧躯干，身体保持连贯；可改跪姿，不追求次数或力竭。'};
export function validateCircuit(input:unknown):asserts input is Circuit{
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('徒手组合参数无效。');
  const c=input as Record<string,unknown>;
  if(!Array.isArray(c.exercises)||c.exercises.length<1||c.exercises.length>2||new Set(c.exercises).size!==c.exercises.length||!c.exercises.every(x=>x==='squat'||x==='pushup'))throw new Error('请选择深蹲、俯卧撑中的至少一个动作，不可重复。');
  if(typeof c.workSeconds!=='number'||!Number.isInteger(c.workSeconds)||c.workSeconds<10||c.workSeconds>30||typeof c.restSeconds!=='number'||!Number.isInteger(c.restSeconds)||c.restSeconds<30||c.restSeconds>90||c.restSeconds<c.workSeconds*2)throw new Error('徒手段为 10–30 秒，休息为 30–90 秒且至少为动作时长的 2 倍。');
}
export function withCircuit(source:Course,circuit:Circuit,roundLimit?:number):Course{
  validateCircuit(circuit);
  if(source.category!=='interval')throw new Error('徒手组合仅用于无氧计划。');
  const course=structuredClone(source),works=source.stages.filter(s=>s.kind==='work').slice(0,roundLimit),stages:Stage[]=[{...source.stages[0],exercise:'row'}];
  for(let i=0;i<works.length;i++){
    const work=works[i],recovery=source.stages[source.stages.indexOf(work)+1];
    if(recovery?.kind!=='recovery')throw new Error('组合课缺少划船恢复段。');
    stages.push({...work,exercise:'row'},{...recovery,exercise:'row'});
    const append=(suffix:string,kind:Stage['kind'],exercise:Stage['exercise'],durationSeconds:number,rpe:[number,number],cue:string)=>stages.push({id:work.id+'-'+suffix,kind,exercise,durationSeconds,rpe,cue});
    append('off','recovery','off-rower',20,[1,2],'放稳手柄、解开脚带，站稳后离机；未准备好请暂停。');
    for(const exercise of circuit.exercises){
      append(exercise,'work',exercise,circuit.workSeconds,[4,6],cues[exercise]);
      append(exercise+'-rest','recovery','rest',circuit.restSeconds,[1,2],'停止动作，放松并自然呼吸；恢复不足时暂停。');
    }
    append('on','recovery','on-rower',20,[1,2],'坐稳并扣好脚带，准备划行；未准备好请暂停。');
  }
  stages.push({...source.stages.at(-1)!,exercise:'row'});
  return {...course,title:source.title+' · 徒手组合',contentVersion:'circuit-1',status:'draft',description:'划船间歇与徒手动作交替，包含独立恢复、离机和上机时间。',focus:'动作受控，保留恢复，不追求力竭。',stages,plannedDurationSeconds:stages.reduce((sum,s)=>sum+s.durationSeconds,0)};
}
export function stageLabel(stage:Stage):string{
  if(stage.exercise==='squat'||stage.exercise==='pushup')return exerciseNames[stage.exercise];
  if(stage.exercise==='rest')return '徒手休息';
  if(stage.exercise==='off-rower')return '离机准备';
  if(stage.exercise==='on-rower')return '返回划船机';
  if(stage.exercise==='row')return {warmup:'热身划船',work:'快划',recovery:'轻松划船',cooldown:'放松划船'}[stage.kind];
  return stageNames[stage.kind];
}
export const circuitRounds=(course:Course)=>course.stages.filter(s=>s.kind==='work'&&s.exercise==='row').length;
export function courseOutline(course:Course){
  const selected=course.stages.filter(s=>s.kind==='warmup'||s.kind==='work'||s.kind==='cooldown'),groups=new Map<string,{label:string;seconds:number;count:number}>();
  for(const stage of selected){const label=stageLabel(stage),key=label+'-'+stage.durationSeconds;const item=groups.get(key);if(item)item.count++;else groups.set(key,{label,seconds:stage.durationSeconds,count:1});}
  return [...groups.values()];
}

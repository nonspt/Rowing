import type {PlanTraining} from './types.ts';
import {planDurations,presets} from '../content/presets.ts';
const integer=(x:unknown,min:number,max:number)=>typeof x==='number'&&Number.isInteger(x)&&x>=min&&x<=max;
export function validateTrainingDefinition(input:unknown):asserts input is PlanTraining{
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('训练计划参数无效。');
  const p=input as Record<string,unknown>;
  if(!['aerobic','anaerobic'].includes(String(p.mode))||!integer(p.weeks,1,52)||!integer(p.weeklyDays,1,4))throw new Error('请选择有氧或无氧、1–52 周及每周 1–4 次。');
  if(p.custom===undefined){
    const preset=presets.find(x=>x.id===p.presetId);
    if(!preset||preset.mode!==p.mode||preset.weeklyDays!==p.weeklyDays||!(planDurations as readonly number[]).includes(p.weeks as number))throw new Error('模板、周期或每周频次无效。');
    return;
  }
  if(p.presetId!==undefined||!p.custom||typeof p.custom!=='object'||Array.isArray(p.custom))throw new Error('自定义计划不能同时指定模板。');
  const c=p.custom as Record<string,unknown>;
  if(!integer(c.warmupMinutes,p.mode==='anaerobic'?8:3,15)||!integer(c.cooldownMinutes,p.mode==='anaerobic'?5:3,15))throw new Error(p.mode==='anaerobic'?'无氧训练需 8–15 分钟热身、5–15 分钟放松。':'热身和放松分别为 3–15 分钟。');
  if(p.mode==='aerobic'){
    if(!integer(c.workSeconds,300,3600)||(c.workSeconds as number)%60!==0||c.repeats!==1||c.recoverySeconds!==0)throw new Error('有氧主训练为 5–60 分钟，按整分钟填写。');
  }else if(!integer(p.weeklyDays,1,2)||!integer(c.workSeconds,10,30)||!integer(c.recoverySeconds,60,180)||(c.recoverySeconds as number)<(c.workSeconds as number)*3||!integer(c.repeats,3,10))throw new Error('无氧每周 1–2 次：快划 10–30 秒、恢复 60–180 秒且至少为快划的 3 倍，3–10 组。');
}

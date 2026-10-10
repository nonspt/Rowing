import {useState} from 'react';
import {modeNames,planDurations,presets} from '../../content/presets.ts';
import {createFocusedPlan,planMode,planWeeks,type PlanInput} from '../../domain/focused-plans.ts';
import {localDate} from '../../domain/plans.ts';
import type {Plan,TrainingMode} from '../../domain/types.ts';
import {useApp} from '../context.ts';
import {Row,Section} from '../components/shared.tsx';
import {Sheet} from '../components/Sheet.tsx';
import {Icon} from '../components/Icon.tsx';
import {PlanEditor} from './PlanEditor.tsx';
export function PlanLibrary({onFinish}:{onFinish:()=>void}){
  const {data,service,perform,busy,notify}=useApp();
  const [mode,setMode]=useState<TrainingMode>('aerobic'),[weeks,setWeeks]=useState(4),[editor,setEditor]=useState<Plan|'new'|null>(null),[preview,setPreview]=useState<{input:PlanInput;revision:number}|null>(null),[limit,setLimit]=useState(5);
  const customPlans=data.plans.filter(p=>p.status!=='active'||p.training?.custom).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  const choose=(preset:typeof presets[number])=>setPreview({input:{title:preset.title,startDate:localDate(new Date(),data.profile?.timeZone),training:{mode:preset.mode,weeks,weeklyDays:preset.weeklyDays,presetId:preset.id}},revision:data.revision});
  const generated=preview?createFocusedPlan(preview.input,data.profile!.timeZone):null;
  return <>
    <div className="segmented" role="group" aria-label="计划类型">{(['aerobic','anaerobic'] as const).map(m=><button key={m} aria-pressed={mode===m} className={mode===m?'selected':''} onClick={()=>setMode(m)}>{modeNames[m]}计划</button>)}</div>
    <div className="duration-picker" role="group" aria-label="计划周期">{planDurations.map(w=><button key={w} className={weeks===w?'selected':''} aria-pressed={weeks===w} onClick={()=>setWeeks(w)}>{w} 周</button>)}</div>
    <div className="group">{presets.filter(p=>p.mode===mode).map(p=><Row key={p.id} icon={mode==='aerobic'?'heart':'train'} title={p.title} subtitle={`${p.minutes} 分钟 · 每周 ${p.weeklyDays} 次`} onClick={()=>choose(p)}/>)}</div>
    <button className="secondary full" disabled={busy||!!data.draft} onClick={()=>setEditor('new')}><Icon name="plus" size={20}/>自定义计划</button>
    {!!customPlans.length&&<Section title="已保存计划"><div className="group">{customPlans.slice(0,limit).map(p=><div className="saved-plan" key={p.id}><Row title={p.title} subtitle={`${modeNames[planMode(p)]} · ${planWeeks(p)} 周`} right={p.status==='active'?'当前':p.status==='completed'?'已结束':'继续'} onClick={()=>{if(p.status==='completed'){setPreview({input:{title:p.title,startDate:localDate(new Date(),data.profile?.timeZone),training:p.training??{mode:planMode(p),weeks:4,weeklyDays:planMode(p)==='anaerobic'?2:3,presetId:planMode(p)==='anaerobic'?'AN01':p.templateId==='P02'?'AE02':'AE01'}},revision:data.revision});return;}void perform(()=>service.activateFocusedPlan(p.id)).then(ok=>{if(ok)onFinish();});}}/>{p.training?.custom&&<button className="icon-button" aria-label={'编辑'+p.title} onClick={()=>setEditor(p)}><Icon name="settings" size={20}/></button>}</div>)}</div>{customPlans.length>limit&&<button className="text-button full" onClick={()=>setLimit(x=>x+10)}>更多计划</button>}</Section>}
    {preview&&generated&&<Sheet title="采用计划" onClose={()=>setPreview(null)}><span className="badge">{modeNames[preview.input.training.mode]} · {preview.input.training.weeks} 周</span><h3 className="detail-lead">{preview.input.title}</h3><p className="caption">每周 {preview.input.training.weeklyDays} 次 · 共 {generated.sessions.length} 次</p><label>开始日期<input type="date" required value={preview.input.startDate} onChange={e=>{try{createFocusedPlan({...preview.input,startDate:e.target.value},data.profile!.timeZone);setPreview({...preview,input:{...preview.input,startDate:e.target.value}});}catch(error){notify(error instanceof Error?error.message:'日期无效。');}}}/></label><div className="group">{generated.sessions.filter(s=>s.week===0).map(s=><Row key={s.slot} title={s.course.title} subtitle={s.localDate} right={`${Math.round(s.course.plannedDurationSeconds/60)} 分钟`}/>)}</div>{preview.input.training.mode==='anaerobic'&&<p className="caption">适合已有规律划船基础。短工作段搭配充分恢复。</p>}<button className="primary" disabled={busy||!!data.draft} onClick={()=>void perform(()=>service.adoptFocusedPlan(preview.input,preview.revision)).then(ok=>{if(ok){setPreview(null);onFinish();}})}>使用这个计划</button></Sheet>}
    {editor&&<PlanEditor existing={editor==='new'?undefined:editor} onClose={()=>{setEditor(null);onFinish();}}/>}
  </>;
}

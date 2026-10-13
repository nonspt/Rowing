import {useState} from 'react';
import {modeNames,planDurations,presets} from '../../content/presets.ts';
import {createFocusedPlan,planMode,planWeeks,type PlanInput} from '../../domain/focused-plans.ts';
import {localDate} from '../../domain/plans.ts';
import type {Plan,TrainingMode} from '../../domain/types.ts';
import {useApp} from '../context.ts';
import {Row,Section,Notice} from '../components/shared.tsx';
import {Sheet} from '../components/Sheet.tsx';
import {Icon} from '../components/Icon.tsx';
import {PlanEditor} from './PlanEditor.tsx';
import {defaultCircuit} from '../../domain/circuit.ts';
import {CourseOutline} from '../components/CourseOutline.tsx';
import {CircuitFields} from '../components/CircuitFields.tsx';
import {heartRateBands} from '../../content/heart-rate.ts';
export function PlanLibrary({onFinish}:{onFinish:()=>void}){
  const {data,service,perform,busy}=useApp();
  const [mode,setMode]=useState<TrainingMode>('aerobic'),[weeks,setWeeks]=useState(4),[editor,setEditor]=useState<Plan|'new'|null>(null),[preview,setPreview]=useState<{input:PlanInput;revision:number}|null>(null),[limit,setLimit]=useState(5);
  const customPlans=data.plans.filter(p=>p.status!=='active'||p.training?.custom).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  const choose=(preset:typeof presets[number])=>setPreview({input:{title:preset.title,startDate:localDate(new Date(),data.profile?.timeZone),training:{mode:preset.mode,weeks,weeklyDays:preset.weeklyDays,presetId:preset.id,...(preset.mode==='anaerobic'?{circuit:defaultCircuit()}:{})}},revision:data.revision});
  const timeZone=data.profile?.timeZone??Intl.DateTimeFormat().resolvedOptions().timeZone;
  let generated:ReturnType<typeof createFocusedPlan>|null=null,previewError='';
  if(preview){try{generated=createFocusedPlan(preview.input,timeZone);}catch(error){previewError=error instanceof Error?error.message:'请检查训练参数。';}}
  const structures=new Map<string,{course:NonNullable<typeof generated>['sessions'][number]['course'];weeks:number[]}>();
  for(const item of generated?.sessions??[]){const key=JSON.stringify([item.course.title,item.course.stages.map(s=>[s.kind,s.exercise,s.durationSeconds,s.repetitions,s.rpe,s.adjustment])]),found=structures.get(key);if(found){if(!found.weeks.includes(item.week+1))found.weeks.push(item.week+1);}else structures.set(key,{course:item.course,weeks:[item.week+1]});}
  return <>
    <div className="library-filters">
    <div className="segmented" role="group" aria-label="计划类型">{(['aerobic','anaerobic'] as const).map(m=><button key={m} aria-pressed={mode===m} className={mode===m?'selected':''} onClick={()=>setMode(m)}>{modeNames[m]}计划</button>)}</div>
    <div className="duration-picker" role="group" aria-label="计划周期">{planDurations.map(w=><button key={w} className={weeks===w?'selected':''} aria-pressed={weeks===w} onClick={()=>setWeeks(w)}>{w} 周</button>)}</div>
    </div>
    <div className="group template-grid">{presets.filter(p=>p.mode===mode).map(p=><Row key={p.id} icon={mode==='aerobic'?'heart':'train'} title={p.title} subtitle={`${p.subtitle} · ${p.minutes} 分钟 · 每周 ${p.weeklyDays} 次 · 心率估算 ${heartRateBands[p.id].join('–')} bpm`} onClick={()=>choose(p)}/>)}</div>
    <button className="secondary full library-create" disabled={busy||!!data.draft} onClick={()=>setEditor('new')}><Icon name="plus" size={20}/>自定义计划</button>
    {!!customPlans.length&&<Section title="已保存计划"><div className="group">{customPlans.slice(0,limit).map(p=><div className="saved-plan" key={p.id}><Row title={p.title} subtitle={`${modeNames[planMode(p)]} · ${planWeeks(p)} 周`} right={p.status==='active'?'当前':p.status==='completed'?'已结束':'继续'} onClick={()=>{if(p.status==='completed'){setPreview({input:{title:p.title,startDate:localDate(new Date(),data.profile?.timeZone),training:p.training??{mode:planMode(p),weeks:4,weeklyDays:planMode(p)==='anaerobic'?2:3,presetId:planMode(p)==='anaerobic'?'AN01':p.templateId==='P02'?'AE02':'AE01'}},revision:data.revision});return;}void perform(()=>service.activateFocusedPlan(p.id)).then(ok=>{if(ok)onFinish();});}}/>{p.training?.custom&&<button className="icon-button" aria-label={'编辑'+p.title} onClick={()=>setEditor(p)}><Icon name="settings" size={20}/></button>}</div>)}</div>{customPlans.length>limit&&<button className="text-button full" onClick={()=>setLimit(x=>x+10)}>更多计划</button>}</Section>}
    {preview&&<Sheet title="采用计划" onClose={()=>setPreview(null)} expanded><form onSubmit={e=>{e.preventDefault();if(!generated)return;void perform(()=>service.adoptFocusedPlan(preview.input,preview.revision)).then(ok=>{if(ok){setPreview(null);onFinish();}});}}>
      <label className="preset-start-date">开始日期<input type="date" required value={preview.input.startDate} onChange={e=>setPreview({...preview,input:{...preview.input,startDate:e.target.value}})}/></label>
      <div className="preset-structures">{preview.input.training.circuit&&<section className="editor-panel preset-bodyweight" aria-label="徒手训练结构"><CircuitFields value={preview.input.training.circuit} onChange={circuit=>setPreview({...preview,input:{...preview.input,training:{...preview.input.training,circuit}}})}/></section>}{[...structures.entries()].map(([key,item])=><section className="editor-panel preset-structure" key={key}><div className="outline-heading"><h3>{item.course.title}</h3><span className="caption">第 {item.weeks.join('、')} 周</span></div><CourseOutline course={item.course} compact includeAdjustments/></section>)}</div>
      {previewError&&<Notice tone="error">{previewError}</Notice>}<div className="editor-actions"><button className="primary" disabled={!generated||busy||!!data.draft}>使用这个计划</button></div>
    </form></Sheet>}
    {editor&&<PlanEditor existing={editor==='new'?undefined:editor} onClose={()=>{setEditor(null);onFinish();}}/>}
  </>;
}

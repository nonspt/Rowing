import {useState} from 'react';
import type {Plan,TrainingMode} from '../../domain/types.ts';
import type {PlanInput} from '../../domain/focused-plans.ts';
import {localDate} from '../../domain/plans.ts';
import {useApp} from '../context.ts';
import {Sheet} from '../components/Sheet.tsx';
export function PlanEditor({onClose,existing}:{onClose:()=>void;existing?:Plan}){
  const {data,service,perform,busy}=useApp(),initial=existing?.training,c=initial?.custom;
  const [title,setTitle]=useState(existing?.title??'我的有氧计划'),[mode,setMode]=useState<TrainingMode>(initial?.mode??'aerobic'),[weeks,setWeeks]=useState(initial?.weeks??4),[days,setDays]=useState(initial?.weeklyDays??3),[date,setDate]=useState(existing?.startDate??localDate(new Date(),data.profile?.timeZone)),[warm,setWarm]=useState(c?.warmupMinutes??5),[cool,setCool]=useState(c?.cooldownMinutes??5),[work,setWork]=useState(c?.workSeconds??900),[rest,setRest]=useState(c?.recoverySeconds??100),[repeats,setRepeats]=useState(c?.repeats??6);
  const [revision]=useState(data.revision),locked=!!existing&&data.scheduled.some(s=>s.planId===existing.id&&s.status!=='planned');
  const input=():PlanInput=>({title,startDate:date,training:{mode,weeks,weeklyDays:days,custom:{warmupMinutes:warm,cooldownMinutes:cool,workSeconds:work,recoverySeconds:mode==='aerobic'?0:rest,repeats:mode==='aerobic'?1:repeats}}});
  const save=(copy=false)=>void perform(()=>existing&&!copy?service.editFocusedPlan(existing.id,input(),revision):service.adoptFocusedPlan({...input(),startDate:copy?localDate(new Date(),data.profile?.timeZone):date},revision)).then(ok=>{if(ok)onClose();});
  return <Sheet title={existing?'编辑自定义计划':'自定义计划'} onClose={onClose}><form onSubmit={e=>{e.preventDefault();save();}}>
    <label>计划名称<input required maxLength={60} value={title} onChange={e=>setTitle(e.target.value)}/></label>
    <label>训练类型<select value={mode} disabled={locked} onChange={e=>{const next=e.target.value as TrainingMode;setMode(next);setWarm(next==='aerobic'?5:8);setCool(5);setWork(next==='aerobic'?900:20);setDays(next==='aerobic'?3:1);if(!existing)setTitle(next==='aerobic'?'我的有氧计划':'我的无氧计划');}}><option value="aerobic">有氧</option><option value="anaerobic">无氧</option></select></label>
    <div className="form-grid"><label>计划周期（周）<input type="number" required min={1} max={52} step={1} value={weeks} onChange={e=>setWeeks(Number(e.target.value))}/></label><label>每周训练<select value={days} disabled={locked} onChange={e=>setDays(Number(e.target.value))}>{Array.from({length:mode==='aerobic'?4:2},(_,i)=><option key={i} value={i+1}>{i+1} 次</option>)}</select></label></div>
    <label>开始日期<input type="date" required disabled={locked} value={date} onChange={e=>setDate(e.target.value)}/></label>
    {mode==='aerobic'?<label>主训练（分钟）<input type="number" required min={5} max={60} step={1} value={work/60} onChange={e=>setWork(Number(e.target.value)*60)}/></label>:<><div className="form-grid"><label>每组快划（秒）<input type="number" required min={10} max={30} step={1} value={work} onChange={e=>setWork(Number(e.target.value))}/></label><label>每组恢复（秒）<input type="number" required min={Math.max(60,work*3)} max={180} step={1} value={rest} onChange={e=>setRest(Number(e.target.value))}/></label></div><label>间歇组数<input type="number" required min={3} max={10} step={1} value={repeats} onChange={e=>setRepeats(Number(e.target.value))}/></label></>}
    <details className="disclosure"><summary>热身与放松</summary><div className="form-grid"><label>热身（分钟）<input type="number" required min={mode==='aerobic'?3:8} max={15} step={1} value={warm} onChange={e=>setWarm(Number(e.target.value))}/></label><label>放松（分钟）<input type="number" required min={mode==='aerobic'?3:5} max={15} step={1} value={cool} onChange={e=>setCool(Number(e.target.value))}/></label></div></details>
    {locked&&<p className="caption">已完成课程保持原安排，修改用于后续待训练课程。</p>}
    <button className="primary" disabled={busy}>{existing?'保存修改':'保存并使用'}</button>{existing&&<button className="secondary full" type="button" disabled={busy} onClick={()=>save(true)}>另存并使用</button>}
  </form></Sheet>;
}

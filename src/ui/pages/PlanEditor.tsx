import {useState} from 'react';
import type {Plan,TrainingMode,Circuit} from '../../domain/types.ts';
import {defaultCircuit} from '../../domain/circuit.ts';
import {CircuitFields} from '../components/CircuitFields.tsx';
import {RangeField} from '../components/RangeField.tsx';
import {PlanPanel} from '../components/PlanPanel.tsx';
import {SegmentedChoice} from '../components/SegmentedChoice.tsx';
import type {PlanInput} from '../../domain/focused-plans.ts';
import {localDate} from '../../domain/plans.ts';
import {useApp} from '../context.ts';
import {Sheet} from '../components/Sheet.tsx';
export function PlanEditor({onClose,existing}:{onClose:()=>void;existing?:Plan}){
  const {data,service,perform,busy}=useApp(),initial=existing?.training,c=initial?.custom;
  const [title,setTitle]=useState(existing?.title??'我的有氧计划'),[mode,setMode]=useState<TrainingMode>(initial?.mode??'aerobic'),[weeks,setWeeks]=useState(initial?.weeks??4),[days,setDays]=useState(initial?.weeklyDays??3),[date,setDate]=useState(existing?.startDate??localDate(new Date(),data.profile?.timeZone)),[warm,setWarm]=useState(c?.warmupMinutes??5),[cool,setCool]=useState(c?.cooldownMinutes??5),[work,setWork]=useState(c?.workSeconds??900),[rest,setRest]=useState(c?.recoverySeconds??100),[repeats,setRepeats]=useState(c?.repeats??6);
  const [revision]=useState(data.revision),locked=!!existing&&data.scheduled.some(s=>s.planId===existing.id&&s.status!=='planned');
  const [combo,setCombo]=useState(!!initial?.circuit||!existing),[circuit,setCircuit]=useState<Circuit>(initial?.circuit??defaultCircuit());
  const input=():PlanInput=>({title,startDate:date,training:{mode,weeks,weeklyDays:days,custom:{warmupMinutes:warm,cooldownMinutes:cool,workSeconds:work,recoverySeconds:mode==='aerobic'?0:rest,repeats:mode==='aerobic'?1:repeats},...(mode==='anaerobic'&&combo?{circuit}:{})}});
  const save=(copy=false)=>void perform(()=>existing&&!copy?service.editFocusedPlan(existing.id,input(),revision):service.adoptFocusedPlan({...input(),startDate:copy?localDate(new Date(),data.profile?.timeZone):date},revision)).then(ok=>{if(ok)onClose();});
  const changeWork=(value:number)=>{setWork(value);if(mode==='anaerobic')setRest(current=>Math.max(current,Math.min(180,value*3)));};
  const changeMode=(next:TrainingMode)=>{setMode(next);setWarm(next==='aerobic'?5:8);setCool(5);setWork(next==='aerobic'?900:20);setDays(next==='aerobic'?3:1);setRepeats(next==='anaerobic'?(existing?Math.max(3,repeats):3):1);if(!existing)setTitle(next==='aerobic'?'我的有氧计划':'我的无氧计划');};
  return <Sheet title={existing?'编辑自定义计划':'自定义计划'} onClose={onClose} expanded panels><form onSubmit={e=>{e.preventDefault();save();}}><div className={`editor-layout plan-panels ${mode==='anaerobic'&&combo?'three-panels':'two-panels'}`}><PlanPanel title="计划设置" className="editor-basics">
    <label>计划名称<input required maxLength={60} value={title} onChange={e=>setTitle(e.target.value)}/></label>
    <div className="choice-field"><span>训练类型</span><SegmentedChoice label="训练类型" value={mode} options={[{value:'aerobic',label:'有氧'},{value:'anaerobic',label:'无氧'}]} disabled={locked} onChange={changeMode}/></div>
    <RangeField label="每周训练" sliderLabel="调节每周训练次数" unit="次" min={1} max={5} value={days} disabled={locked} onChange={setDays}/>
    {mode==='anaerobic'&&days>2&&<p className="caption frequency-summary">每周 2 次间歇 + {days-2} 次恢复划行</p>}
    <RangeField label="计划周期（周）" sliderLabel="调节计划周数" unit="周" min={1} max={52} value={weeks} onChange={setWeeks}/>
    <label className="date-field"><span>开始日期</span><input type="date" required disabled={locked} value={date} onChange={e=>setDate(e.target.value)}/></label>
    </PlanPanel><PlanPanel title="划船训练" className="editor-training"><div className="training-fields">
    {mode==='aerobic'?<RangeField label="主训练（分钟）" sliderLabel="调节有氧时长" unit="分钟" min={5} max={60} value={work/60} onChange={value=>setWork(value*60)}/>:<><div className="choice-field"><span>训练组合</span><SegmentedChoice label="训练组合" value={combo?'circuit':'row'} options={[{value:'circuit',label:'划船+徒手'},{value:'row',label:'仅划船'}]} onChange={value=>setCombo(value==='circuit')}/></div><RangeField label="每组快划（秒）" sliderLabel="调节快划秒数" unit="秒" min={10} max={30} value={work} onChange={changeWork}/><RangeField label="每组恢复（秒）" sliderLabel="调节恢复秒数" unit="秒" min={Math.min(180,Math.max(60,work*3))} max={180} value={rest} onChange={setRest}/><RangeField label="间歇组数" sliderLabel="调节组数" unit="组" min={3} max={10} value={repeats} onChange={setRepeats}/></>}
    <RangeField label="热身（分钟）" sliderLabel="调节热身时长" unit="分钟" min={mode==='aerobic'?3:8} max={15} value={warm} onChange={setWarm}/><RangeField label="放松（分钟）" sliderLabel="调节放松时长" unit="分钟" min={mode==='aerobic'?3:5} max={15} value={cool} onChange={setCool}/>
    </div>
    </PlanPanel>{mode==='anaerobic'&&combo&&<PlanPanel title="徒手动作" className="editor-bodyweight"><CircuitFields value={circuit} onChange={setCircuit}/></PlanPanel>}</div>
    {locked&&<p className="caption">已完成课程保持原安排，修改用于后续待训练课程。</p>}
    <div className="editor-actions"><button className="primary" disabled={busy}>{existing?'保存修改':'保存并使用'}</button>{existing&&<button className="secondary" type="button" disabled={busy} onClick={()=>save(true)}>另存并使用</button>}</div>
  </form></Sheet>;
}

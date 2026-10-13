import {useState} from 'react';
import type {Plan} from '../../domain/types.ts';
import {defaultCircuit} from '../../domain/circuit.ts';
import {CircuitFields} from '../components/CircuitFields.tsx';
import {Sheet} from '../components/Sheet.tsx';
import {useApp} from '../context.ts';

export function CircuitEditor({plan,onClose}:{plan:Plan;onClose:()=>void}){
  const {data,service,perform,busy}=useApp();
  const [circuit,setCircuit]=useState(()=>structuredClone(plan.training?.circuit??defaultCircuit())),[revision]=useState(data.revision);
  return <Sheet title="徒手动作" onClose={onClose}><form onSubmit={e=>{e.preventDefault();void perform(()=>service.configureFocusedCircuit(plan.id,circuit,revision)).then(ok=>{if(ok)onClose();});}}>
    <CircuitFields value={circuit} onChange={setCircuit}/>
    <p className="caption">应用到待训练课程，保留已完成、已跳过的课程和日期。</p>
    <button className="primary full" disabled={busy||!!data.draft}>保存动作设置</button>
  </form></Sheet>;
}

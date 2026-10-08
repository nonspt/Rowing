import {useState} from 'react';
import {lessons,selfCheckLabels} from '../../content/lessons.ts';
import {courseById} from '../../content/courses.ts';
import {useApp} from '../context.ts';
import {Row,Section} from '../components/shared.tsx';
import {RowingDemonstration} from '../components/RowingDemonstration.tsx';
import {Sheet} from '../components/Sheet.tsx';
const OfficialReferences=()=> <div className="official-references"><a href="https://www.concept2.com/training/rowing-technique" target="_blank" rel="noopener noreferrer">Concept2 官方教学</a><a href="https://www.concept2.it/files/pdf/us/indoor-rowers/Dynamic_UserManual.pdf#page=7" target="_blank" rel="noopener noreferrer">官方动作图解</a></div>;
export function Learn(){const {data,openLesson}=useApp();return <>
  <div className="learn-intro"><RowingDemonstration/><p className="caption">驱动：腿 → 躯干 → 手臂<br/>回桨：手臂 → 躯干 → 腿</p></div>
  <Section title="动作要点" action={<span className="caption">{data.lessons.length} / 5 已浏览</span>}><div className="group">{lessons.map((l,i)=><Row key={l.id} icon={data.lessons.some(x=>x.id===l.id)?'check':'learn'} title={(i+1)+'. '+l.title} subtitle={l.subtitle} onClick={()=>openLesson(l.id)}/>)}</div></Section>
  <details className="disclosure"><summary>教学依据</summary><OfficialReferences/><p className="caption">按官方四阶段动作规则绘制的原创 SVG；演示速度不代表训练划频。设备设置以说明书为准。</p></details>
</>;}
export function LessonSheet({id,onClose}:{id:string;onClose:()=>void}){
  const {data,service,perform,openCourse,busy}=useApp();const initial=Math.max(0,lessons.findIndex(l=>l.id===id));
  const [index,setIndex]=useState(initial),[checks,setChecks]=useState<boolean[]>(data.lessons.find(l=>l.id===id)?.selfChecks||[false,false,false,false]);
  const lesson=lessons[index];
  return <Sheet title={lesson.title} onClose={onClose}>
    <RowingDemonstration phase={lesson.phase}/><ol className="lesson-points">{lesson.points.map(p=><li key={p}>{p}</li>)}</ol>
    <details className="disclosure"><summary>常见错误与练习</summary><p>{lesson.error}</p><p>{lesson.practice}</p><OfficialReferences/></details>
    <details className="disclosure"><summary>练习后的自检</summary><div className="group">{selfCheckLabels.map((text,i)=><label className="check-row" key={text}><input type="checkbox" checked={checks[i]} onChange={e=>setChecks(checks.map((x,n)=>n===i?e.target.checked:x))}/>{text}</label>)}</div><p className="caption">自检记录主观感受，出现不适请停止。</p></details>
    <button className="primary" disabled={busy} onClick={()=>void perform(()=>service.saveLesson(lesson.id,checks),'学习进度已保存。')}>保存学习与自检</button>
    <div className="button-pair"><button className="secondary" disabled={index===0} onClick={()=>{setIndex(index-1);setChecks(data.lessons.find(x=>x.id===lessons[index-1].id)?.selfChecks||[false,false,false,false]);}}>上一步</button><button className="secondary" disabled={index===lessons.length-1} onClick={()=>{setIndex(index+1);setChecks(data.lessons.find(x=>x.id===lessons[index+1].id)?.selfChecks||[false,false,false,false]);}}>下一步</button></div>
    <button className="text-button full" onClick={()=>{onClose();openCourse(courseById(lesson.course));}}>查看对应动作练习课</button>
  </Sheet>;
}

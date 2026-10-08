import {useState} from 'react';
import type {Course} from '../../domain/types.ts';
import {courseById,goalNames,stageNames} from '../../content/courses.ts';
import {courseEligibility} from '../../domain/plans.ts';
import {formatTime} from '../../domain/session.ts';
import {useApp} from '../context.ts';
import {Sheet} from '../components/Sheet.tsx';
import {Notice,Row} from '../components/shared.tsx';
export function CourseSheet({course,scheduledId,onClose}:{course:Course;scheduledId?:string;onClose:()=>void}){
  const {data,service,perform,openSession,openCourse,busy}=useApp();const [confirmed,setConfirmed]=useState(false),eligibility=courseEligibility(course,data);
  return <Sheet title={course.title} onClose={onClose}>
    <span className="badge">{goalNames[course.category]}</span><p className="detail-lead">{course.focus}</p>
    <div className="detail-stats"><div><strong>{course.plannedDurationSeconds/60}</strong><span>分钟 · 含热身放松</span></div><div><strong>{course.stages.find(s=>s.kind==='work')?.rpe.join('–')}</strong><span>用力程度 / 10</span></div></div>
    <details className="disclosure"><summary>课程与阶段安排</summary><p>{course.description}</p><p className="caption">适用：{course.suitability}</p><div className="group">{course.stages.map((s,i)=><Row key={s.id} title={(i+1)+'. '+stageNames[s.kind]} subtitle={'用力程度 '+s.rpe.join('–')+' / 10'} right={formatTime(s.durationSeconds)}/>)}</div></details>
    {!eligibility.allowed&&<Notice>{eligibility.reason}<button className="text-button full" onClick={()=>{onClose();openCourse(courseById(course.alternativeId));}}>查看轻松替代课</button></Notice>}
    {course.category==='interval'&&eligibility.allowed&&<label className="check-row"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>动作已熟悉，今天无疲劳或不适，主动选择此课</label>}
    <p className="caption safety-line">出现胸痛、头晕或明显异常不适时停止运动并及时求助。</p>
    <button className="primary" disabled={busy||!!data.draft||!eligibility.allowed||(course.category==='interval'&&!confirmed)} onClick={()=>void perform(async()=>{const draft=await service.begin(course,scheduledId);onClose();openSession(draft);})}>准备开始训练</button>
    {data.draft&&<p className="footnote">请先处理现有训练草稿。</p>}
  </Sheet>;
}

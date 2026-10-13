import type {Course} from '../../domain/types.ts';
import {courseOutline} from '../../domain/circuit.ts';
import {formatTime} from '../../domain/session.ts';
import {TrainingTimeline} from './TrainingTimeline.tsx';
export function CourseOutline({course,compact=false,includeAdjustments=false}:{course:Course;compact?:boolean;includeAdjustments?:boolean}){
  if(!compact)return <TrainingTimeline course={course}/>;
  return <div className="course-outline outline-summary" aria-label="训练结构摘要"><ol>{courseOutline(course,includeAdjustments).map((item,i)=><li key={i}><span className="outline-index">{String(i+1).padStart(2,'0')}</span><span>{item.label}</span><strong>{item.repetitions!==undefined?`${item.repetitions} 次`:formatTime(item.seconds)}{item.count>1?` × ${item.count}`:''}</strong></li>)}</ol></div>;
}

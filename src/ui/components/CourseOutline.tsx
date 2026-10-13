import type {Course} from '../../domain/types.ts';
import {courseOutline,circuitRounds} from '../../domain/circuit.ts';
import {formatTime} from '../../domain/session.ts';
export function CourseOutline({course}:{course:Course}){
  const rounds=circuitRounds(course);
  return <div className="course-outline"><div className="outline-heading"><h3>训练结构</h3><span className="caption">{rounds?`${rounds} 轮 · 含换位与恢复`:'含热身与放松'}</span></div><ol>{courseOutline(course).map((item,i)=><li key={item.label+'-'+item.seconds}><span className="outline-index">{String(i+1).padStart(2,'0')}</span><span>{item.label}</span><strong>{formatTime(item.seconds)}{item.count>1&&<small> × {item.count}</small>}</strong></li>)}</ol></div>;
}

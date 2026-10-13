import type {Course} from '../../domain/types.ts';
import {circuitRounds,stageLabel,stageTargetLabel} from '../../domain/circuit.ts';
import {formatTime} from '../../domain/session.ts';
export function CourseOutline({course}:{course:Course}){
  const rounds=circuitRounds(course);let elapsed=0,estimated=false,round=0;
  return <div className="course-outline"><div className="outline-heading"><h3>训练结构</h3><span className="caption">{course.stages.length} 段{rounds?` · ${rounds} 轮`:''}</span></div>
    <div className="timeline-scroll" tabIndex={0} role="region" aria-label="完整训练时间线"><ol>{course.stages.map(stage=>{
      const start=elapsed,approximate=estimated;elapsed+=stage.durationSeconds;if(stage.repetitions!==undefined)estimated=true;
      const isRound=rounds>0&&stage.kind==='work'&&stage.exercise==='row';if(isRound)round++;
      return <li className={`timeline-stage ${isRound?'round-start':''}`} key={stage.id} data-stage-id={stage.id}>
        <span className="outline-time">{approximate?'约 ':''}{formatTime(start)}</span><span className="timeline-marker" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/></svg></span>
        <span className="timeline-label">{isRound&&<small>第 {round} 轮 · </small>}{stageLabel(stage)}</span><strong>{stageTargetLabel(stage)}</strong>
      </li>;
    })}</ol></div>
  </div>;
}

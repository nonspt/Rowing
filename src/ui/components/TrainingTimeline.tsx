import {useEffect,useRef} from 'react';
import type {Course} from '../../domain/types.ts';
import {circuitRounds,stageLabel,stageTargetLabel} from '../../domain/circuit.ts';
import {formatTime} from '../../domain/session.ts';
import {Icon} from './Icon.tsx';

export function TrainingTimeline({course,currentIndex,className='course-outline'}:{course:Course;currentIndex?:number;className?:string}){
  const scroll=useRef<HTMLDivElement>(null),current=useRef<HTMLLIElement>(null);
  useEffect(()=>{
    const region=scroll.current,item=current.current;
    if(currentIndex===undefined||!region||!item)return;
    const reveal=()=>{
      if(region.clientHeight===0)return;
      const area=region.getBoundingClientRect(),row=item.getBoundingClientRect();
      if(row.top<area.top+8||row.bottom>area.bottom-8)region.scrollTo({top:region.scrollTop+row.top-area.top-(region.clientHeight-row.height)/2,behavior:'auto'});
    };
    reveal();
    // Also reveal restored stages after the dialog opens or its viewport changes.
    const observer=new ResizeObserver(reveal);observer.observe(region);
    return ()=>observer.disconnect();
  },[course.id,currentIndex]);
  const rounds=circuitRounds(course);let elapsed=0,estimated=false,round=0;
  return <section className={`${className} training-timeline`} aria-label="训练结构"><div className="outline-heading"><h3>训练结构</h3><span className="caption">{course.stages.length} 段{rounds?` · ${rounds} 轮`:''}</span></div>
    <div className="timeline-scroll" ref={scroll} tabIndex={0} role="region" aria-label="完整训练时间线"><ol>{course.stages.map((stage,index)=>{
      const start=elapsed,approximate=estimated;elapsed+=stage.durationSeconds;if(stage.repetitions!==undefined)estimated=true;
      const isRound=rounds>0&&stage.kind==='work'&&stage.exercise==='row';if(isRound)round++;
      const status=currentIndex===undefined?'preview':index<currentIndex?'completed':index===currentIndex?'current':'upcoming';
      return <li className={`timeline-stage ${isRound?'round-start':''}`} key={stage.id} ref={status==='current'?current:undefined} data-stage-id={stage.id} data-status={status} aria-current={status==='current'?'step':undefined}>
        <span className="timeline-marker" aria-hidden="true">{status==='completed'?<Icon name="check" size={16}/>:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4" fill={status==='current'?'currentColor':'none'}/></svg>}</span>
        <span className="timeline-copy"><span className="timeline-label">{isRound&&<small>第 {round} 轮 · </small>}{stageLabel(stage)}</span><small className="timeline-meta"><span className="outline-time">{approximate?'约 ':''}{formatTime(start)}</span>{currentIndex!==undefined&&<span className="timeline-status">{status==='completed'?'已完成':status==='current'?'当前':'待训练'}</span>}</small></span><strong>{stageTargetLabel(stage)}</strong>
      </li>;
    })}</ol></div>
  </section>;
}

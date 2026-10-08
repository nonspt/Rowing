import {useEffect,useRef,useState} from 'react';
import {phaseProgress,normalizeStroke,strokeStepIndex,strokeSteps} from '../../domain/rowing-motion.ts';
import {RowingFigure} from './RowingFigure.tsx';
import {Icon} from './Icon.tsx';
export function RowingDemonstration({phase=0}:{phase?:number}) {
  const initial=phaseProgress[phase%4],progressRef=useRef<number>(initial),container=useRef<HTMLDivElement>(null);
  const [progress,setProgress]=useState<number>(initial),[playing,setPlaying]=useState(true),[slow,setSlow]=useState(false);
  const [expanded,setExpanded]=useState(false),[reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible,setVisible]=useState(true),[foreground,setForeground]=useState(!document.hidden);
  const active=playing&&!reduced&&visible&&foreground,step=strokeStepIndex(progress);
  useEffect(()=>{progressRef.current=initial;setProgress(initial);},[initial]);
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(media.matches),hidden=()=>setForeground(!document.hidden);
    media.addEventListener('change',change);document.addEventListener('visibilitychange',hidden);
    const observer=new IntersectionObserver(entries=>setVisible(entries[0].isIntersecting));observer.observe(container.current!);
    return()=>{media.removeEventListener('change',change);document.removeEventListener('visibilitychange',hidden);observer.disconnect();};
  },[]);
  useEffect(()=>{
    if(!active)return;let frame=0,last:number|null=null,published=0;
    const animate=(now:number)=>{
      if(last!==null)progressRef.current=normalizeStroke(progressRef.current+Math.min(now-last,100)/(slow?9600:4800));
      last=now;if(now-published>=33){setProgress(progressRef.current);published=now;}
      frame=requestAnimationFrame(animate);
    };
    frame=requestAnimationFrame(animate);return()=>cancelAnimationFrame(frame);
  },[active,slow]);
  const select=(index:number)=>{setPlaying(false);progressRef.current=strokeSteps[index].start;setProgress(progressRef.current);};
  return <div ref={container} className="rowing-demo" data-playing={active} aria-label="划船动作演示">
    <RowingFigure progress={progress}/>
    <div className="demo-cue"><strong>{step<3?'驱动':'回桨'} · {strokeSteps[step].title}</strong></div>
    <div className="demo-controls"><button className="text-button" disabled={reduced} onClick={()=>setPlaying(!playing)} aria-label={reduced?'静态动作演示':playing?'暂停动作演示':'播放动作演示'}><Icon name={playing?'pause':'play'} size={18}/>{reduced?'静态演示':playing?'暂停':'播放'}</button><button className="text-button" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>分步查看<Icon name="chevron" size={16}/></button></div>
    {expanded&&<div className="demo-detail"><p className="caption">{strokeSteps[step].cue}</p><div className="demo-steps" role="group" aria-label="分步查看动作">{strokeSteps.map((s,i)=><button key={s.title} aria-pressed={step===i} onClick={()=>select(i)}>{i+1}. {s.title}</button>)}</div><button className="text-button" aria-pressed={slow} onClick={()=>setSlow(!slow)}>{slow?'恢复速度':'慢速演示'}</button><p className="footnote">{reduced?'已跟随系统减少动态效果，点选步骤查看。':'动作先后分步展示，实际划行应连贯。'}</p></div>}
  </div>;
}

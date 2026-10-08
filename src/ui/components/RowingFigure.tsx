import {useId} from 'react';
import {phaseProgress,rowingPose,strokeStepIndex,strokeSteps,type Point} from '../../domain/rowing-motion.ts';
export function RowingFigure({phase=0,progress,compact=false}:{phase?:number;progress?:number;compact?:boolean}) {
  const id=useId(),p=rowingPose(progress??phaseProgress[phase%4]);
  const step=strokeSteps[strokeStepIndex(progress??phaseProgress[phase%4])];
  const pt=(a:Point)=>`${a.x.toFixed(2)},${a.y.toFixed(2)}`;
  const line=(...points:Point[])=>points.map((p,i)=>`${i?'L':'M'}${pt(p)}`).join(' ');
  return <svg className={compact?'rowing-figure compact':'rowing-figure'} viewBox="60 65 440 215" role="img" aria-labelledby={id} data-stroke-step={step.title}>
    <title id={id}>{step.title}：{step.cue}依据 Concept2 官方动作教学绘制的侧视示意。</title>
    <ellipse cx="281" cy="267" rx="198" ry="7" fill="var(--figure-shadow)"/>
    <g fill="none" stroke="var(--figure-machine)" strokeLinecap="round" strokeLinejoin="round">
      <path d="M86 235H406M112 235l-12 25h38M380 235l12 25h31" strokeWidth="7"/>
      <circle cx="439" cy="216" r="39" strokeWidth="7" fill="var(--raised)"/>
      <circle cx="439" cy="216" r="25" strokeWidth="2"/>
      <path d="m394 230 10-60h20m-3 0 4-48h21" strokeWidth="5"/>
      <rect x="427" y="105" width="25" height="19" rx="3" strokeWidth="3" fill="var(--surface)"/>
      <path d="m312 225 27 27m-21-15 13-13" strokeWidth="7"/>
      <path d={`M${pt(p.hand)}H407`} strokeWidth="2.5"/>
    </g>
    <path d={`M${p.hip.x-15} 229h29`} stroke="var(--figure-machine)" strokeWidth="9" strokeLinecap="round"/>
    <path d={line(p.hip,p.knee,p.ankle)} fill="none" stroke="var(--figure-body)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="m323 233 15 10 8 1" fill="none" stroke="var(--text)" strokeWidth="9" strokeLinecap="round"/>
    <path d={line(p.hip,p.shoulder)} fill="none" stroke="var(--accent)" strokeWidth="23" strokeLinecap="round"/>
    <path d={line(p.shoulder,p.elbow,p.hand)} fill="none" stroke="var(--figure-skin)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx={p.head.x} cy={p.head.y} r="13" fill="var(--figure-skin)"/>
    <path d={`M${p.head.x-11} ${p.head.y-1}q-1-17 14-13l6 6`} fill="var(--figure-body)"/>
    <path d={`M${p.hand.x-2} ${p.hand.y-5}v10`} stroke="var(--text)" strokeWidth="5" strokeLinecap="round"/>
    <circle cx={p.head.x+8} cy={p.head.y-1} r="1.5" fill="var(--text)"/>
  </svg>;
}

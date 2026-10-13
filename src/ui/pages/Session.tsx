import {useEffect,useState,type CSSProperties} from 'react';
import type {Draft,Feedback} from '../../domain/types.ts';
import {currentStage,formatTime,sessionProgress} from '../../domain/session.ts';
import {followEffort,FOLLOW_EFFORT_MAX} from '../../domain/effort.ts';
import {stageLabel,circuitRounds,hasRepetitions,stageTargetLabel} from '../../domain/circuit.ts';
import {blankMetrics} from '../../application/service.ts';
import {SessionController} from '../../application/session-controller.ts';
import {TrainingFeedback} from '../../adapters/feedback.ts';
import {downloadJson} from '../../adapters/download.ts';
import {useApp} from '../context.ts';
import {Sheet} from '../components/Sheet.tsx';
import {Notice} from '../components/shared.tsx';
import {Icon} from '../components/Icon.tsx';
const unassessed=():Feedback=>({rpe:0,discomfort:false,note:'',technique:'stable',feeling:'good',assessed:false});
export function Session({initial,onClose}:{initial:Draft;onClose:()=>void}){
  const {service,data,perform,notify}=useApp(),[,render]=useState(0),[adapter]=useState(()=>new TrainingFeedback()),[controller]=useState(()=>new SessionController(initial,service,()=>render(x=>x+1),()=>adapter.beep(data.profile?.sound||false)));
  const [working,setWorking]=useState(false),[feedback,setFeedback]=useState(unassessed),[hint,setHint]=useState('');
  const draft=controller.draft,stage=currentStage(draft),summary=draft.state==='completed'||draft.state==='ended-early';
  const counted=stage.stage.repetitions!==undefined,progress=sessionProgress(draft);
  const effort=followEffort(stage.stage.rpe).join('–'),next=draft.course.stages[stage.index+1];
  const rounds=circuitRounds(draft.course),round=Math.max(1,draft.course.stages.slice(0,stage.index+1).filter(s=>s.kind==='work'&&s.exercise==='row').length);
  const roundText=stage.stage.kind==='warmup'?'热身':stage.stage.kind==='cooldown'?'放松':`${Math.min(round,rounds)} / ${rounds} 轮`;
  useEffect(()=>{const hidden=()=>{if(document.hidden&&controller.draft.state==='running'){void controller.pause(true);void adapter.release();}};document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',hidden);return()=>{document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',hidden);controller.dispose();void adapter.release();};},[controller,adapter]);
  useEffect(()=>{if(draft.state!=='running')void adapter.release();},[draft.state,adapter]);
  const act=async(task:()=>Promise<void>)=>{if(working)return;setWorking(true);try{await task();}catch(error){notify(error instanceof Error?error.message:'操作未完成，请重试。');}finally{setWorking(false);}};
  const start=()=>void act(async()=>{setHint(await adapter.enable(data.profile?.sound||false));await controller.start();});
  const close=()=>void act(async()=>{await controller.flush();const ok=await perform(()=>service.repository.read());if(ok)onClose();});
  const save=()=>void act(async()=>{await controller.flush();const ok=await perform(()=>draft.elapsedMs<1000?service.discardDraft():service.finish(controller.draft,feedback,blankMetrics()));if(ok)onClose();});
  return <Sheet title={summary?'跟练结束':'跟练'} onClose={close} wide>
    {summary?<div className="session-summary"><span className="badge">{draft.state==='completed'?'训练完成':'本次已结束'}</span><h3 className="detail-lead">{draft.course.title}</h3><div className="summary-time"><strong>{formatTime(Math.floor(draft.elapsedMs/1000))}</strong><span>实际跟练时长</span></div><SectionFeeling feedback={feedback} onChange={setFeedback}/><button className="primary full" disabled={working} onClick={save}>完成并返回计划</button></div>:<>
      <div className="session-top"><strong>{draft.course.title}</strong><span className="caption">{rounds?`${roundText} · `:''}{stage.index+1} / {draft.course.stages.length} 段</span></div>
      <div className="session-layout">
      <div className="timer-area"><span className="eyebrow">{draft.state==='ready'?'准备开始':draft.state==='paused'?'已暂停':draft.state==='suspended'?'已恢复':'正在跟练'}</span><h3 className="current-movement" aria-live="polite">{stageLabel(stage.stage)}</h3><div className="timer" aria-label={counted?`本段目标 ${stage.stage.repetitions} 次`:`本段剩余 ${stage.remaining} 秒`}>{counted?<>{stage.stage.repetitions}<span className="rep-unit">次</span></>:formatTime(stage.remaining)}</div><div className="session-time-meta"><span className="caption">已跟练 {formatTime(Math.floor(draft.elapsedMs/1000))}</span>{counted&&<span className="caption">本段已用 {formatTime(Math.floor(stage.elapsed))}</span>}<span className="caption">{hasRepetitions(draft.course)?'预计全程':'全程'} {formatTime(draft.course.plannedDurationSeconds)}</span></div><svg className="progress-track" viewBox="0 0 100 5" preserveAspectRatio="none" role="progressbar" aria-label="训练进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><rect width="100" height="5" rx="2.5" fill="var(--line)"/><rect width={progress} height="5" rx="2.5" fill="var(--accent-ink)"/></svg></div>
      <div className="session-targets"><div className="session-cue"><span className="effort-label">用力程度</span><div className="effort-reading" role="group" aria-label={`用力程度 ${effort}，上限 ${FOLLOW_EFFORT_MAX}`}><strong className="effort-value">{effort}</strong><span className="effort-max">/ {FOLLOW_EFFORT_MAX}</span></div><p className="effort-cue">{stage.stage.cue}</p></div>
      <div className="next-stage" role="group" aria-label="下一段">{next?<><span className="next-label">下一段</span><div className="next-reading"><strong className="next-kind">{stageLabel(next)}</strong><strong className="next-duration">{stageTargetLabel(next)}</strong></div></>:<strong className="next-kind">最后一段</strong>}</div>
      <div className="session-controls">{counted&&<button className="primary complete-set" disabled={working||draft.state!=='running'} onClick={()=>void act(()=>controller.completeSet())}>已完成 {stage.stage.repetitions} 次 · 下一段</button>}{draft.state==='running'?<button className="primary" disabled={working} onClick={()=>void act(()=>controller.pause())}><Icon name="pause" size={24}/>暂停训练</button>:<button className="primary" disabled={working} onClick={start}><Icon name="play" size={24}/>{draft.state==='ready'?'开始跟练':'继续训练'}</button>}<button className="secondary" disabled={working} onClick={()=>void act(()=>controller.end())}>结束跟练</button></div>
      </div></div>
      <p className="caption safety-line">切出或锁屏后暂停。出现不适请停止。</p>
      <ol className="session-queue" style={{'--queue-count':Math.min(5,draft.course.stages.length-stage.index)} as CSSProperties} aria-label="当前与后续阶段">{draft.course.stages.slice(stage.index,stage.index+5).map((s,i)=><li key={s.id} aria-current={i===0?'step':undefined}><span>{i===0?'当前':`接下来 ${i}`}</span><strong>{stageLabel(s)}</strong><small>{stageTargetLabel(s)}</small></li>)}</ol>
    </>}
    {controller.error&&<Notice tone="error">{controller.error}<button className="text-button" onClick={()=>void act(()=>controller.persist())}>重试保存</button><button className="text-button" onClick={()=>void act(async()=>{const backup=await service.backup();backup.data.draft={...controller.draft,owner:'',leaseUntil:0};downloadJson(backup,'home-rower-unsaved-session.json');})}>备份本次跟练</button></Notice>}
    {hint&&<p className="caption">{hint}</p>}
  </Sheet>;
}
function SectionFeeling({feedback,onChange}:{feedback:Feedback;onChange:(f:Feedback)=>void}){
  const options=[['轻松',3],['适中',5],['吃力',8],['不适',0]] as const;
  return <div className="feeling"><p className="caption">本次感受 · 可选</p><div className="duration-picker" role="group" aria-label="本次感受">{options.map(([label,rpe])=><button key={label} aria-pressed={!!feedback.assessed&&(label==='不适'?feedback.discomfort:!feedback.discomfort&&feedback.rpe===rpe)} className={feedback.assessed&&(label==='不适'?feedback.discomfort:!feedback.discomfort&&feedback.rpe===rpe)?'selected':''} onClick={()=>onChange({...feedback,rpe,discomfort:label==='不适',feeling:rpe>=8?'tired':'good',assessed:true})}>{label}</button>)}</div></div>;
}

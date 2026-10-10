import {useEffect,useState} from 'react';
import type {Draft,Feedback} from '../../domain/types.ts';
import {currentStage,formatTime} from '../../domain/session.ts';
import {stageNames} from '../../content/courses.ts';
import {blankMetrics} from '../../application/service.ts';
import {SessionController} from '../../application/session-controller.ts';
import {TrainingFeedback} from '../../adapters/feedback.ts';
import {downloadJson} from '../../adapters/download.ts';
import {useApp} from '../context.ts';
import {Sheet} from '../components/Sheet.tsx';
import {Notice} from '../components/shared.tsx';
import {Icon} from '../components/Icon.tsx';
import {RowingFigure} from '../components/RowingFigure.tsx';
const unassessed=():Feedback=>({rpe:0,discomfort:false,note:'',technique:'stable',feeling:'good',assessed:false});
export function Session({initial,onClose}:{initial:Draft;onClose:()=>void}){
  const {service,data,perform,notify}=useApp(),[,render]=useState(0),[adapter]=useState(()=>new TrainingFeedback()),[controller]=useState(()=>new SessionController(initial,service,()=>render(x=>x+1),()=>adapter.beep(data.profile?.sound||false)));
  const [working,setWorking]=useState(false),[feedback,setFeedback]=useState(unassessed),[hint,setHint]=useState('');
  const draft=controller.draft,stage=currentStage(draft),summary=draft.state==='completed'||draft.state==='ended-early';
  useEffect(()=>{const hidden=()=>{if(document.hidden&&controller.draft.state==='running'){void controller.pause(true);void adapter.release();}};document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',hidden);return()=>{document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',hidden);controller.dispose();void adapter.release();};},[controller,adapter]);
  useEffect(()=>{if(draft.state!=='running')void adapter.release();},[draft.state,adapter]);
  const act=async(task:()=>Promise<void>)=>{if(working)return;setWorking(true);try{await task();}catch(error){notify(error instanceof Error?error.message:'操作未完成，请重试。');}finally{setWorking(false);}};
  const start=()=>void act(async()=>{setHint(await adapter.enable(data.profile?.sound||false));await controller.start();});
  const close=()=>void act(async()=>{await controller.flush();const ok=await perform(()=>service.repository.read());if(ok)onClose();});
  const save=()=>void act(async()=>{await controller.flush();const ok=await perform(()=>draft.elapsedMs<1000?service.discardDraft():service.finish(controller.draft,feedback,blankMetrics()));if(ok)onClose();});
  return <Sheet title={summary?'跟练结束':'跟练'} onClose={close} wide>
    {summary?<><span className="badge">{draft.state==='completed'?'训练完成':'本次已结束'}</span><h3 className="detail-lead">{draft.course.title}</h3><div className="summary-time"><strong>{formatTime(Math.floor(draft.elapsedMs/1000))}</strong><span>实际跟练时长</span></div><SectionFeeling feedback={feedback} onChange={setFeedback}/><button className="primary full" disabled={working} onClick={save}>完成并返回计划</button></>:<>
      <div className="session-top"><strong>{draft.course.title}</strong><span className="caption">{stage.index+1} / {draft.course.stages.length}</span></div>
      <div className="timer-area"><span className="eyebrow">{draft.state==='ready'?'准备开始':draft.state==='paused'?'已暂停':draft.state==='suspended'?'已恢复':stageNames[stage.stage.kind]}</span><div className="timer" aria-label={`本段剩余 ${stage.remaining} 秒`}>{formatTime(stage.remaining)}</div><span className="caption">已跟练 {formatTime(Math.floor(draft.elapsedMs/1000))}</span><svg className="progress-track" viewBox="0 0 100 5" preserveAspectRatio="none" role="progressbar" aria-label="训练进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(draft.elapsedMs/(draft.course.plannedDurationSeconds*10))}><rect width="100" height="5" rx="2.5" fill="var(--line)"/><rect width={draft.elapsedMs/(draft.course.plannedDurationSeconds*10)} height="5" rx="2.5" fill="var(--accent)"/></svg></div>
      <div className="session-cue"><span>用力 {stage.stage.rpe.join('–')} / 10</span><h3>{stage.stage.cue}</h3><RowingFigure compact phase={stage.stage.kind==='recovery'?3:1}/></div>
      <p className="next-stage">{draft.course.stages[stage.index+1]?`下一段：${stageNames[draft.course.stages[stage.index+1].kind]} ${formatTime(draft.course.stages[stage.index+1].durationSeconds)}`:'最后一段'}</p>
      <div className="session-controls">{draft.state==='running'?<button className="primary" disabled={working} onClick={()=>void act(()=>controller.pause())}><Icon name="pause" size={20}/>暂停训练</button>:<button className="primary" disabled={working} onClick={start}><Icon name="play" size={20}/>{draft.state==='ready'?'开始跟练':'继续训练'}</button>}<button className="text-button" disabled={working} onClick={()=>void act(()=>controller.end())}>结束跟练</button></div>
      <p className="caption safety-line">切出或锁屏后暂停。出现不适请停止。</p>
    </>}
    {controller.error&&<Notice tone="error">{controller.error}<button className="text-button" onClick={()=>void act(()=>controller.persist())}>重试保存</button><button className="text-button" onClick={()=>void act(async()=>{const backup=await service.backup();backup.data.draft={...controller.draft,owner:'',leaseUntil:0};downloadJson(backup,'home-rower-unsaved-session.json');})}>备份本次跟练</button></Notice>}
    {hint&&<p className="caption">{hint}</p>}
  </Sheet>;
}
function SectionFeeling({feedback,onChange}:{feedback:Feedback;onChange:(f:Feedback)=>void}){
  const options=[['轻松',3],['适中',5],['吃力',8],['不适',0]] as const;
  return <div className="feeling"><p className="caption">本次感受 · 可选</p><div className="duration-picker" role="group" aria-label="本次感受">{options.map(([label,rpe])=><button key={label} aria-pressed={!!feedback.assessed&&(label==='不适'?feedback.discomfort:!feedback.discomfort&&feedback.rpe===rpe)} className={feedback.assessed&&(label==='不适'?feedback.discomfort:!feedback.discomfort&&feedback.rpe===rpe)?'selected':''} onClick={()=>onChange({...feedback,rpe,discomfort:label==='不适',feeling:rpe>=8?'tired':'good',assessed:true})}>{label}</button>)}</div></div>;
}

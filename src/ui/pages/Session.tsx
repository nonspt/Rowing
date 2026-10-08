import {useEffect,useState} from 'react';
import type {Draft} from '../../domain/types.ts';
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
import {RecordFields,initialFeedback} from '../components/RecordFields.tsx';
export function Session({initial,onClose}:{initial:Draft;onClose:()=>void}){
  const {service,data,perform,notify}=useApp(),[,render]=useState(0),[adapter]=useState(()=>new TrainingFeedback()),[controller]=useState(()=>new SessionController(initial,service,()=>render(x=>x+1),()=>adapter.beep(data.profile?.sound||false)));
  const [working,setWorking]=useState(false),[exit,setExit]=useState(false),[feedback,setFeedback]=useState(initialFeedback),[metrics,setMetrics]=useState(blankMetrics),[hint,setHint]=useState('');
  const draft=controller.draft,stage=currentStage(draft),summary=draft.state==='completed'||draft.state==='ended-early';
  useEffect(()=>{const hidden=()=>{if(document.hidden&&controller.draft.state==='running'){void controller.pause(true);void adapter.release();}};document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',hidden);return()=>{document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',hidden);controller.dispose();void adapter.release();};},[controller,adapter]);
  useEffect(()=>{if(draft.state!=='running')void adapter.release();},[draft.state,adapter]);
  const act=async(task:()=>Promise<void>)=>{if(working)return;setWorking(true);try{await task();}catch(error){notify(error instanceof Error?error.message:'操作未完成，请重试。');}finally{setWorking(false);}};
  const start=()=>void act(async()=>{setHint(await adapter.enable(data.profile?.sound||false));await controller.start();});
  const close=()=>{if(summary){setExit(true);return;}void act(async()=>{await controller.pause();setExit(true);});};
  return <Sheet title={summary?'训练摘要':'跟练'} onClose={close} wide>
    {summary?<><span className="badge">{draft.state==='completed'?'已完成所有阶段':'提前结束'} · 待保存</span><h3 className="detail-lead">{draft.course.title}</h3><div className="summary-time"><strong>{formatTime(Math.floor(draft.elapsedMs/1000))}</strong><span>实际跟练时长 · 排除暂停与挂起</span></div><form onSubmit={e=>{e.preventDefault();void act(async()=>{await controller.flush();const success=await perform(()=>service.finish(controller.draft,feedback,metrics),'训练记录已保存到本机。');if(success)onClose();});}}><RecordFields {...{feedback,setFeedback,metrics,setMetrics}}/><button className="primary" disabled={working}>保存训练记录</button></form>{controller.error&&<Notice tone="error">{controller.error}</Notice>}<button className="text-button full" onClick={()=>void act(async()=>{const backup=await service.backup();backup.data.draft={...controller.draft,owner:'',leaseUntil:0};downloadJson(backup,'home-rower-unsaved-session.json');setHint('已发起草稿备份下载，请确认文件已保存。');})}>下载包含本次草稿的备份</button></>:<>
      <div className="session-top"><span className="badge">{draft.course.title}</span><span className="caption">阶段 {stage.index+1} / {draft.course.stages.length}</span></div>
      <div className="timer-area"><span className="eyebrow">{draft.state==='ready'?'准备开始':draft.state==='paused'?'已暂停':draft.state==='suspended'?'训练曾中断':stageNames[stage.stage.kind]}</span><div className="timer" aria-label={`本段剩余 ${stage.remaining} 秒`}>{formatTime(stage.remaining)}</div><span className="caption">本段剩余 · 总计 {formatTime(Math.floor(draft.elapsedMs/1000))}</span><svg className="progress-track" viewBox="0 0 100 5" preserveAspectRatio="none" role="progressbar" aria-label="训练进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(draft.elapsedMs/(draft.course.plannedDurationSeconds*10))}><rect width="100" height="5" rx="2.5" fill="var(--line)"/><rect width={draft.elapsedMs/(draft.course.plannedDurationSeconds*10)} height="5" rx="2.5" fill="var(--accent)"/></svg></div>
      <div className="session-cue"><span>用力程度 {stage.stage.rpe.join('–')} / 10</span><h3>{stage.stage.cue}</h3><RowingFigure compact phase={stage.stage.kind==='recovery'?3:1}/></div>
      <p className="next-stage">{draft.course.stages[stage.index+1]?`下一段：${stageNames[draft.course.stages[stage.index+1].kind]} ${formatTime(draft.course.stages[stage.index+1].durationSeconds)}`:'最后一段，逐渐轻松结束。'}</p>
      {draft.state==='suspended'&&<Notice>已恢复至最近保存的位置，中断期间未计入训练。确认设备和身体状态后，再继续。</Notice>}
      {controller.error&&<Notice tone="error">{controller.error}<button className="text-button" onClick={()=>void act(()=>controller.persist())}>重试保存检查点</button></Notice>}
      {draft.state==='ready'&&<p className="caption">确认设备稳固、脚带合适，再开始。</p>}<div className="session-controls">{draft.state==='running'?<button className="primary" disabled={working} onClick={()=>void act(()=>controller.pause())}><Icon name="pause" size={20}/>暂停训练</button>:<button className="primary" disabled={working} onClick={start}><Icon name="play" size={20}/>{draft.state==='ready'?'开始跟练':'继续训练'}</button>}<button className="secondary" disabled={working} onClick={()=>void act(()=>controller.end())}>结束并填写记录</button></div>
      <p className="caption safety-line">切出或锁屏后暂停。出现不适请停止。</p>
    </>}
    {hint&&<Notice>{hint}</Notice>}
    {exit&&<Sheet title="离开这次训练" onClose={()=>setExit(false)}><p>{summary?'摘要尚未保存，退出后保留草稿。':'训练已暂停，退出后可从今日恢复。'}</p><button className="primary" onClick={()=>setExit(false)}>{summary?'继续填写记录':'返回训练'}</button><button className="secondary full" disabled={working} onClick={()=>void act(async()=>{await controller.flush();const ok=await perform(()=>service.repository.read());if(ok)onClose();})}>保留草稿并退出</button><button className="text-button danger full" disabled={working} onClick={()=>{if(!window.confirm('丢弃这次尚未保存的训练？这不会删除其他记录。'))return;void act(async()=>{const ok=await perform(()=>service.discardDraft(),'草稿已丢弃。');if(ok)onClose();});}}>丢弃本次草稿</button></Sheet>}
  </Sheet>;
}

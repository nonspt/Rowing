import {advance,currentStage} from '../domain/session.ts';
import type {Draft} from '../domain/types.ts';
import {AppService} from './service.ts';
export class SessionController {
  draft:Draft;
  private last=0;
  private timer?:ReturnType<typeof setInterval>;
  private lastSave=0;
  private queue:Promise<void>=Promise.resolve();
  error='';
  constructor(draft:Draft,private service:AppService,private changed:()=>void,private stageChanged:()=>void){this.draft=structuredClone(draft);if(this.draft.state==='running')this.draft.state='suspended';}
  private emit(){this.changed();}
  private tick=()=>{
    if(this.draft.state!=='running')return;
    const now=performance.now(),index=currentStage(this.draft).index;
    this.draft=advance(this.draft,now-this.last);this.last=now;
    if(currentStage(this.draft).index!==index)this.stageChanged();
    if(this.draft.state==='completed'){this.draft.endedAt=new Date().toISOString();this.stopTimer();}
    this.emit();
    if(now-this.lastSave>=5000||this.draft.state!=='running'){this.lastSave=now;void this.persist();}
  };
  private stopTimer(){if(this.timer)clearInterval(this.timer);this.timer=undefined;}
  persist():Promise<void>{
    this.queue=this.queue.then(async()=>{
      const submitted=structuredClone(this.draft);
      try{const saved=await this.service.checkpoint(submitted);this.draft.revision=saved.revision;this.draft.updatedAt=saved.updatedAt;this.draft.leaseUntil=saved.leaseUntil;this.error='';}
      catch(error){this.stopTimer();if(this.draft.state==='running')this.draft.state='paused';this.error=error instanceof Error?error.message:'检查点未保存，请重试或导出本次训练。';}
      this.emit();
    });
    return this.queue;
  }
  async start(){await this.queue;if(this.error)await this.persist();if(this.error)throw new Error(this.error);this.draft.state='running';this.last=performance.now();this.lastSave=this.last;this.timer=setInterval(this.tick,200);await this.persist();this.emit();}
  async pause(suspended=false){if(this.draft.state==='running')this.tick();this.stopTimer();if(this.draft.state!=='completed'&&this.draft.state!=='ended-early')this.draft.state=suspended?'suspended':'paused';await this.persist();this.emit();}
  async end(){await this.pause();if(this.draft.state!=='completed'){this.draft.state='ended-early';this.draft.endedAt=new Date().toISOString();}await this.persist();this.emit();}
  async flush(){if(this.draft.state==='running')await this.pause();else await this.persist();if(this.error)throw new Error(this.error);}
  dispose(){this.stopTimer();}
}

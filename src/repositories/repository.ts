import {emptySnapshot} from '../domain/types.ts';
import type {Snapshot} from '../domain/types.ts';
import {validateSnapshot} from '../domain/validation.ts';
const stores = ['profiles','lessonProgress','plans','scheduledSessions','drafts','workouts','meta'] as const;
const storeMap = {profiles:'profile',lessonProgress:'lessons',plans:'plans',scheduledSessions:'scheduled',drafts:'draft',workouts:'workouts'} as const;
export class Repository {
  private database?: IDBDatabase;
  private temporary = emptySnapshot();
  readonly persistent: boolean;
  private channel?: BroadcastChannel;
  constructor(persistent=true) {this.persistent=persistent; if(typeof BroadcastChannel!=='undefined') {this.channel=new BroadcastChannel('home-rower-changes');(this.channel as BroadcastChannel&{unref?:()=>void}).unref?.();}}
  subscribe(listener:()=>void):()=>void {if(!this.channel) return ()=>{}; const handler=()=>listener(); this.channel.addEventListener('message',handler); return ()=>this.channel?.removeEventListener('message',handler);}
  async initialize():Promise<void> {
    if(!this.persistent) return;
    await new Promise<void>((resolve,reject)=>{
      const request=indexedDB.open('home-rower-db',2);
      const timeout=setTimeout(()=>reject(new Error('数据库打开超时。请关闭其他版本的窗口后重试，原数据未删除。')),8000);
      request.onupgradeneeded=()=>{for(const name of stores) if(!request.result.objectStoreNames.contains(name)) {const store=request.result.createObjectStore(name,{keyPath:'id'}); if(name==='workouts') {store.createIndex('sessionId','sessionId',{unique:true}); store.createIndex('startedAt','startedAt');}}const meta=request.transaction!.objectStore('meta'),previous=meta.get('app');previous.onsuccess=()=>{if(previous.result)meta.put({...previous.result,schemaVersion:2});};};
      request.onblocked=()=>{clearTimeout(timeout); reject(new Error('数据库升级被其他窗口阻止。请关闭旧窗口后重试。'));};
      request.onerror=()=>{clearTimeout(timeout); reject(new Error('本机数据库不可用。请保留网站数据并尝试普通浏览模式。'));};
      request.onsuccess=()=>{clearTimeout(timeout); this.database=request.result; this.database.onversionchange=()=>{this.database?.close(); this.database=undefined; this.channel?.postMessage({type:'versionchange'});}; resolve();};
    });
    await this.read(); // Invalid persisted data must never be replaced by defaults.
  }
  private transaction(mutator?: (state:Snapshot)=>void, expectedRevision?:number):Promise<Snapshot> {
    if(!this.persistent) {const next=structuredClone(this.temporary); if(expectedRevision!==undefined&&next.revision!==expectedRevision) return Promise.reject(new Error('数据已改变，请重新预览后再操作。')); if(mutator){mutator(next); next.revision++;validateSnapshot(next);this.temporary=next;} return Promise.resolve(structuredClone(next));}
    if(!this.database) return Promise.reject(new Error('数据库连接已关闭，请刷新重试。原数据仍保留。'));
    return new Promise((resolve,reject)=>{
      const tx=this.database!.transaction([...stores],mutator?'readwrite':'readonly');
      const rows: Record<string,unknown[]>={}; let left=stores.length; let result:Snapshot; let failure:unknown;
      tx.onabort=()=>reject(failure||new Error('本机保存未完成，原数据未修改。请重试或导出当前记录。'));
      tx.onerror=()=>{failure ||= new Error('本机存储发生错误，可能空间不足。请导出数据后重试。');};
      tx.oncomplete=()=>{if(mutator) this.channel?.postMessage({type:'changed'}); resolve(result);};
      for(const name of stores) {
        const req=tx.objectStore(name).getAll();
        req.onsuccess=()=>{
          rows[name]=req.result;
          if(--left!==0) return;
          try {
            const meta=rows.meta[0] as {revision?:number;lastBackupAt?:string}|undefined;
            result={...emptySnapshot(),revision:meta?.revision||0,lastBackupAt:meta?.lastBackupAt,
              profile:(rows.profiles[0]||null) as Snapshot['profile'], draft:(rows.drafts[0]||null) as Snapshot['draft'],
              lessons:rows.lessonProgress as Snapshot['lessons'],plans:rows.plans as Snapshot['plans'],scheduled:rows.scheduledSessions as Snapshot['scheduled'],workouts:rows.workouts as Snapshot['workouts']};
            validateSnapshot(result);
            if(!mutator) return;
            if(expectedRevision!==undefined&&result.revision!==expectedRevision) throw new Error('数据已改变，请重新预览后再操作。');
            // Mutators can update entities in place. Freeze the comparison before
            // mutation; comparing against the live getAll arrays loses changes.
            const before=new Map(Object.keys(storeMap).map(name=>[name,JSON.stringify(rows[name])]));
            mutator(result); result.revision++; validateSnapshot(result);
            // Write only changed stores. Checkpoints do not rewrite all workout history.
            for(const [name,key] of Object.entries(storeMap)) {
              const value=result[key as keyof Snapshot]; const array=Array.isArray(value)?value:value?[value]:[];
              if(JSON.stringify(array)===before.get(name)) continue;
              const store=tx.objectStore(name); store.clear(); for(const item of array) store.put(item);
            }
            tx.objectStore('meta').put({id:'app',revision:result.revision,schemaVersion:2,lastBackupAt:result.lastBackupAt});
          } catch(error) {failure=error;tx.abort();}
        };
      }
    });
  }
  read():Promise<Snapshot> {return this.transaction();}
  update(mutator:(state:Snapshot)=>void,expectedRevision?:number):Promise<Snapshot> {return this.transaction(mutator,expectedRevision);}
}

import type {Repository} from '../repositories/repository.ts';
export type PwaState={ready:boolean;update:boolean;error?:string};
export async function registerPwa(repository:Repository,changed:(state:PwaState)=>void):Promise<()=>void> {
  if(!import.meta.env.PROD||!('serviceWorker' in navigator)||!window.isSecureContext)return ()=>{};
  try {
    const url=new URL('sw.js',document.baseURI),registration=await navigator.serviceWorker.register(url,{scope:new URL('./',document.baseURI).pathname});
    const update=()=>changed({ready:!!navigator.serviceWorker.controller,update:!!registration.waiting});
    registration.addEventListener('updatefound',()=>registration.installing?.addEventListener('statechange',update));
    const message=async(event:MessageEvent)=>{if(event.data?.type==='CHECK_UPDATE'){try{const snapshot=await repository.read();event.ports[0]?.postMessage({busy:!!snapshot.draft});}catch{event.ports[0]?.postMessage({busy:true});}}};
    navigator.serviceWorker.addEventListener('message',message);
    navigator.serviceWorker.addEventListener('controllerchange',update);
    await navigator.serviceWorker.ready;update();
    return ()=>{navigator.serviceWorker.removeEventListener('message',message);navigator.serviceWorker.removeEventListener('controllerchange',update);};
  }catch{changed({ready:false,update:false,error:'离线资源暂未准备好，请联网重新打开。'});return ()=>{};}
}
export async function applyPwaUpdate(repository:Repository):Promise<void>{
  const snapshot=await repository.read();if(snapshot.draft)throw new Error('请先保存或丢弃训练草稿，再更新。');
  const registration=await navigator.serviceWorker.getRegistration();if(!registration?.waiting)throw new Error('暂时没有等待更新的版本。');
  const previous=navigator.serviceWorker.controller;
  await new Promise<void>((resolve,reject)=>{const channel=new MessageChannel(),timeout=setTimeout(()=>reject(new Error('更新检查超时，请稍后重试。')),7000);channel.port1.onmessage=e=>{clearTimeout(timeout);if(e.data?.ok)resolve();else reject(new Error('其他窗口有未保存训练或未响应，请关闭其他窗口后更新。'));};registration.waiting!.postMessage({type:'APPLY_UPDATE'},[channel.port2]);});
  if(navigator.serviceWorker.controller===previous)await new Promise<void>((resolve,reject)=>{const done=()=>{clearTimeout(timeout);navigator.serviceWorker.removeEventListener('controllerchange',done);resolve();};const timeout=setTimeout(()=>{navigator.serviceWorker.removeEventListener('controllerchange',done);reject(new Error('新版本尚未接管，请稍后重新打开。'));},5000);navigator.serviceWorker.addEventListener('controllerchange',done);});
  window.location.reload();
}

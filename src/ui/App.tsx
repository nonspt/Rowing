import {useCallback,useEffect,useRef,useState} from 'react';
import {AppService} from '../application/service.ts';
import {Repository} from '../repositories/repository.ts';
import {emptySnapshot,type Draft} from '../domain/types.ts';
import {AppContext} from './context.ts';
import {useTheme} from './hooks/useTheme.ts';
import {applyPwaUpdate,registerPwa} from '../adapters/pwa.ts';
import {Icon} from './components/Icon.tsx';
import {Notice} from './components/shared.tsx';
import {Plans} from './pages/Plans.tsx';
import {Settings,defaultProfile} from './pages/Settings.tsx';
import {Session} from './pages/Session.tsx';
import {Toast} from './components/Toast.tsx';
export function App(){
  const [service,setService]=useState<AppService|null>(null),[data,setData]=useState(emptySnapshot),[initialError,setInitialError]=useState(''),[busy,setBusy]=useState(false),[toast,setToast]=useState(''),[settings,setSettings]=useState(false),[session,setSession]=useState<Draft|null>(null),[online,setOnline]=useState(navigator.onLine),[pwa,setPwa]=useState({ready:false,update:false});
  const theme=useTheme(),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),busyRef=useRef(false),mainRef=useRef<HTMLElement>(null);
  const notify=useCallback((message:string)=>{setToast(message);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setToast(''),7000);},[]);
  const initialize=async(persistent=true)=>{setInitialError('');const repository=new Repository(persistent);try{await repository.initialize();let next=await repository.read();if(!next.profile)next=await repository.update(s=>{s.profile=defaultProfile();});setService(new AppService(repository));setData(next);}catch(error){setInitialError(error instanceof Error?error.message:'计划打开失败。');}};
  useEffect(()=>{void initialize();if(location.hash!=='#/plans')history.replaceState(null,'','#/plans');const connection=()=>setOnline(navigator.onLine);window.addEventListener('online',connection);window.addEventListener('offline',connection);return()=>{window.removeEventListener('online',connection);window.removeEventListener('offline',connection);if(timer.current)clearTimeout(timer.current);};},[]);
  useEffect(()=>{if(!service)return;const unsubscribe=service.repository.subscribe(()=>{void service.repository.read().then(setData).catch(e=>notify(e.message));});let cleanup=()=>{};void registerPwa(service.repository,state=>{setPwa(state);if(state.error)notify(state.error);}).then(fn=>cleanup=fn);return()=>{unsubscribe();cleanup();};},[service,notify]);
  const perform=async(task:()=>Promise<unknown>,success?:string):Promise<boolean>=>{if(busyRef.current)return false;busyRef.current=true;setBusy(true);try{await task();if(service)setData(await service.repository.read());if(success)notify(service&&!service.repository.persistent?'仅保留在本次打开中，关闭前请导出备份。':success);return true;}catch(error){notify(error instanceof Error?error.message:'保存未完成，请重试。原数据未删除。');return false;}finally{busyRef.current=false;setBusy(false);}};
  if(!service)return <main className="startup"><Icon name="row" size={48}/><h1>划船机</h1>{initialError?<><Notice tone="error">{initialError}</Notice><button className="primary" onClick={()=>void initialize()}>重试打开计划</button><button className="secondary full" onClick={()=>void initialize(false)}>使用临时模式</button><p className="caption">原数据保留；临时内容关闭后会丢失。</p></>:<p role="status">正在打开训练计划…</p>}</main>;
  return <AppContext.Provider value={{data,service,busy,perform,notify,openSession:setSession,theme:theme.theme,setTheme:theme.setTheme,themeError:theme.error,offlineReady:pwa.ready,updateAvailable:pwa.update,applyUpdate:async()=>{await perform(()=>applyPwaUpdate(service.repository));}}}>
    <a className="skip-link" href="#main" onClick={e=>{e.preventDefault();mainRef.current?.focus();}}>跳到主要内容</a>
    <div className="app-shell"><header className="topbar"><h1>训练计划</h1><button className="icon-button" aria-label="打开设置" onClick={()=>setSettings(true)}><Icon name="settings"/></button></header><main id="main" tabIndex={-1} ref={mainRef} className="page">{!service.repository.persistent&&<Notice tone="warning">临时模式：关闭前请导出计划备份。</Notice>}{!online&&<div className="offline-pill"><Icon name="offline" size={17}/>{pwa.ready?'离线可跟练':'离线资源尚未就绪'}</div>}<Plans/></main></div>
    {pwa.update&&!data.draft&&<button className="update-pill" onClick={()=>setSettings(true)}>更新应用</button>}
    {toast&&<Toast message={toast} onClose={()=>setToast('')}/>}{settings&&<Settings onClose={()=>setSettings(false)}/>}{session&&<Session initial={session} onClose={()=>setSession(null)}/>}
  </AppContext.Provider>;
}

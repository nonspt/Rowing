import {useCallback,useEffect,useRef,useState} from 'react';
import {AppService} from '../application/service.ts';
import {Repository} from '../repositories/repository.ts';
import {emptySnapshot,type Course,type Draft} from '../domain/types.ts';
import {AppContext} from './context.ts';
import {useTheme} from './hooks/useTheme.ts';
import {applyPwaUpdate,registerPwa} from '../adapters/pwa.ts';
import {Icon,type IconName} from './components/Icon.tsx';
import {Notice} from './components/shared.tsx';
import {Today} from './pages/Today.tsx';
import {Training} from './pages/Training.tsx';
import {Learn,LessonSheet} from './pages/Learn.tsx';
import {History} from './pages/History.tsx';
import {Settings,ProfileForm} from './pages/Settings.tsx';
import {CourseSheet} from './pages/CourseSheet.tsx';
import {Session} from './pages/Session.tsx';
import {Toast} from './components/Toast.tsx';
const tabs:[string,string,IconName][]=[['today','今日','today'],['training','训练','train'],['learn','学习','learn'],['history','记录','history']];
const getTab=()=>tabs.some(([key])=>location.hash===`#/${key}`)?location.hash.slice(2):'today';
export function App(){
  const [service,setService]=useState<AppService|null>(null),[data,setData]=useState(emptySnapshot),[initialError,setInitialError]=useState(''),[busy,setBusy]=useState(false),[toast,setToast]=useState(''),[tab,setTab]=useState(getTab),[settings,setSettings]=useState(false),[setup,setSetup]=useState(false),[course,setCourse]=useState<{course:Course;scheduledId?:string}|null>(null),[lesson,setLesson]=useState<string|null>(null),[session,setSession]=useState<Draft|null>(null),[online,setOnline]=useState(navigator.onLine),[pwa,setPwa]=useState({ready:false,update:false});
  const theme=useTheme(),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),scrolls=useRef<Record<string,number>>({}),busyRef=useRef(false),mainRef=useRef<HTMLElement>(null);
  const notify=useCallback((message:string)=>{setToast(message);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setToast(''),7000);},[]);
  const initialize=async(persistent=true)=>{setInitialError('');const repository=new Repository(persistent);try{await repository.initialize();const next=await repository.read();setService(new AppService(repository));setData(next);if(!next.profile)setSetup(true);}catch(error){setInitialError(error instanceof Error?error.message:'初始化失败。');}};
  useEffect(()=>{void initialize();const hash=()=>setTab(getTab()),connection=()=>setOnline(navigator.onLine);window.addEventListener('hashchange',hash);window.addEventListener('online',connection);window.addEventListener('offline',connection);return()=>{window.removeEventListener('hashchange',hash);window.removeEventListener('online',connection);window.removeEventListener('offline',connection);if(timer.current)clearTimeout(timer.current);};},[]);
  useEffect(()=>{if(!service)return;const unsubscribe=service.repository.subscribe(()=>{void service.repository.read().then(setData).catch(e=>notify(e.message));});let cleanup=()=>{};void registerPwa(service.repository,state=>{setPwa(state);if(state.error)notify(state.error);}).then(fn=>cleanup=fn);return()=>{unsubscribe();cleanup();};},[service,notify]);
  useEffect(()=>{if(mainRef.current){window.scrollTo(0,scrolls.current[tab]||0);mainRef.current.focus({preventScroll:true});}},[tab]);
  const navigate=(next:string)=>{scrolls.current[tab]=window.scrollY;location.hash=`/${next}`;};
  const perform=async(task:()=>Promise<unknown>,success?:string):Promise<boolean>=>{if(busyRef.current)return false;busyRef.current=true;setBusy(true);try{await task();if(service)setData(await service.repository.read());if(success)notify(service&&!service.repository.persistent&&!success.startsWith('已发起')?'操作已完成，内容仅保留在本次打开中。尚未永久保存，关闭前请导出备份。':success);return true;}catch(error){notify(error instanceof Error?error.message:'操作失败，原数据未删除，请重试。');return false;}finally{busyRef.current=false;setBusy(false);}};
  if(!service)return <main className="startup"><Icon name="row" size={48}/><h1>划船机</h1>{initialError?<><Notice tone="error">{initialError}</Notice><button className="primary" onClick={()=>void initialize()}>重试打开本机数据</button><button className="secondary full" onClick={()=>void initialize(false)}>使用临时模式</button><p className="footnote">临时模式不覆盖旧数据库。关闭前请导出记录；关闭后临时数据会丢失。</p></>:<p role="status">正在打开本机记录…</p>}</main>;
  return <AppContext.Provider value={{data,service,busy,perform,notify,openCourse:(course,scheduledId)=>setCourse({course,scheduledId}),openSession:setSession,openLesson:setLesson,navigate,theme:theme.theme,setTheme:theme.setTheme,themeError:theme.error,offlineReady:pwa.ready,updateAvailable:pwa.update,applyUpdate:async()=>{await perform(()=>applyPwaUpdate(service.repository));}}}>
    <a className="skip-link" href="#main" onClick={e=>{e.preventDefault();mainRef.current?.focus();}}>跳到主要内容</a>
    <div className="app-shell"><header className="topbar"><h1>{tabs.find(t=>t[0]===tab)?.[1]}</h1><button className="icon-button" aria-label="打开设置" onClick={()=>setSettings(true)}><Icon name="settings"/></button></header><main id="main" tabIndex={-1} ref={mainRef} className="page">{!service.repository.persistent&&<Notice tone="warning">临时模式：记录尚未永久保存。关闭前请在设置中导出备份。</Notice>}{!online&&<div className="offline-pill"><Icon name="offline" size={17}/>当前离线 · {pwa.ready?'已就绪内容可使用':'本机记录仍可查看'}</div>}{tab==='today'?<Today/>:tab==='training'?<Training/>:tab==='learn'?<Learn/>:<History/>}</main></div>
    <nav className="tabbar" aria-label="主要导航">{tabs.map(([key,label,icon])=><a key={key} href={`#/${key}`} onClick={()=>{scrolls.current[tab]=window.scrollY;}} className={tab===key?'active':''} aria-current={tab===key?'page':undefined}><Icon name={icon}/><span>{label}</span></a>)}</nav>
    {pwa.update&&!data.draft&&!settings&&<button className="update-pill" onClick={()=>setSettings(true)}>有新版本 · 查看更新</button>}
    {toast&&<Toast message={toast} onClose={()=>setToast('')}/>}
    {settings&&<Settings onClose={()=>setSettings(false)}/>}{setup&&<ProfileForm first onClose={()=>setSetup(false)}/>}{course&&<CourseSheet {...course} onClose={()=>setCourse(null)}/>}{lesson&&<LessonSheet id={lesson} onClose={()=>setLesson(null)}/>}{session&&<Session initial={session} onClose={()=>setSession(null)}/>}
  </AppContext.Provider>;
}

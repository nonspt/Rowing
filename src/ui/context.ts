import {createContext,useContext} from 'react';
import type {AppService} from '../application/service.ts';
import type {Course,Draft,Snapshot} from '../domain/types.ts';
import type {Theme} from './hooks/useTheme.ts';
export type AppContextValue={data:Snapshot;service:AppService;busy:boolean;perform:(task:()=>Promise<unknown>,success?:string)=>Promise<boolean>;notify:(message:string)=>void;openCourse:(course:Course,scheduledId?:string)=>void;openSession:(draft:Draft)=>void;openLesson:(id:string)=>void;navigate:(tab:string)=>void;theme:Theme;setTheme:(theme:Theme)=>void;themeError:string;offlineReady:boolean;updateAvailable:boolean;applyUpdate:()=>Promise<void>};
export const AppContext=createContext<AppContextValue|null>(null);
export function useApp(){const value=useContext(AppContext);if(!value)throw new Error('应用上下文未初始化。');return value;}

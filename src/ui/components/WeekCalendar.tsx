import {useEffect,useState} from 'react';
import type {Scheduled} from '../../domain/types.ts';
import {addDays,localDate} from '../../domain/plans.ts';
export function WeekCalendar({startDate,sessions,timeZone}:{startDate:string;sessions:Scheduled[];timeZone:string}){
  const days=['日','一','二','三','四','五','六'];
  const [today,setToday]=useState(()=>localDate(new Date(),timeZone));
  useEffect(()=>{const refresh=()=>setToday(localDate(new Date(),timeZone));refresh();const timer=setInterval(refresh,60000);document.addEventListener('visibilitychange',refresh);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};},[timeZone]);
  return <div className="week-calendar" aria-label="本周训练与休息">{Array.from({length:7},(_,i)=>{const date=addDays(startDate,i),item=sessions.find(s=>s.localDate===date),status=item?.status,isToday=date===today;return <div key={date} className={`${status==='planned'?'training-day':''} ${isToday?'current-day':''}`} aria-current={isToday?'date':undefined}><span>{isToday?'今天':`周${days[new Date(date+'T12:00:00Z').getUTCDay()]}`}</span><strong>{Number(date.slice(-2))}</strong><small>{status==='planned'?'训练':status==='completed'?'完成':status==='skipped'?'跳过':'休息'}</small></div>;})}</div>;
}

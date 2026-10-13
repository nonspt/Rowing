import type {Scheduled} from '../../domain/types.ts';
import {addDays} from '../../domain/plans.ts';
export function WeekCalendar({startDate,sessions}:{startDate:string;sessions:Scheduled[]}){
  const days=['日','一','二','三','四','五','六'];
  return <div className="week-calendar" aria-label="本周训练与休息">{Array.from({length:7},(_,i)=>{const date=addDays(startDate,i),item=sessions.find(s=>s.localDate===date),status=item?.status;return <div key={date} className={status==='planned'?'training-day':''}><span>周{days[new Date(date+'T12:00:00Z').getUTCDay()]}</span><strong>{Number(date.slice(-2))}</strong><small>{status==='planned'?'训练':status==='completed'?'完成':status==='skipped'?'跳过':'休息'}</small></div>;})}</div>;
}

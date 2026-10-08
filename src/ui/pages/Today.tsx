import {useApp} from '../context.ts';
import {courseById} from '../../content/courses.ts';
import {localDate,weekStats} from '../../domain/plans.ts';
import {Section,Row,Notice} from '../components/shared.tsx';
import {RowingFigure} from '../components/RowingFigure.tsx';
import {WeeklyChart} from '../components/WeeklyChart.tsx';
export function Today(){
  const {data,perform,service,openSession,openCourse,openLesson,navigate}=useApp();
  const zone=data.profile?.timeZone||Intl.DateTimeFormat().resolvedOptions().timeZone,today=localDate(new Date(),zone),stats=weekStats(data.workouts,zone);
  const plan=data.plans.find(p=>p.status==='active'),pending=data.scheduled.filter(s=>s.planId===plan?.id&&s.week===plan?.week&&s.status==='planned').sort((a,b)=>a.localDate.localeCompare(b.localDate));
  const due=pending.find(s=>s.localDate<=today),course=due?.course||courseById(data.profile?.experience==='new'?'T01':'A01'),rest=!!plan&&!due;
  return <>
    {data.draft&&<Notice><strong>继续上次训练</strong><button className="text-button" onClick={()=>void perform(async()=>openSession(await service.claim()))}>恢复上次训练</button></Notice>}
    <div className="today-card">
      <div className="today-course"><div><span className="caption">{rest?'恢复日':'今日推荐'}</span><h2>{rest?'轻松恢复':course.title}</h2><p className="caption">{rest?'12 分钟':course.plannedDurationSeconds/60+' 分钟'} · {rest?'轻松划行':'含热身与放松'}</p></div><RowingFigure compact phase={2}/></div>
      <button className="primary" disabled={!!data.draft} aria-label="查看今日训练" onClick={()=>openCourse(rest?courseById('R01'):course,due?.id)}>查看训练</button>
    </div>
    <Section title="本周" action={<button className="text-button" onClick={()=>navigate('history')}>查看记录</button>}>
      <div className="stats-card"><div><strong>{stats.count}<small>次</small></strong><span>训练</span></div><div><strong>{stats.minutes}<small>分钟</small></strong><span>累计时长</span></div><div><strong>{stats.completed}<small>次</small></strong><span>完整完成</span></div></div>
      <details className="disclosure weekly-disclosure"><summary>每日训练</summary><WeeklyChart minutes={stats.days}/></details>
    </Section>
    <div className="group"><Row icon="history" title="训练计划" subtitle={plan?plan.title:'选择四周计划'} onClick={()=>navigate('training')} right={plan?'第 '+(plan.week+1)+' 周':undefined}/><Row icon="learn" title="动作教学" subtitle="看演示，练顺序" onClick={()=>openLesson('recovery')}/></div>
  </>;
}

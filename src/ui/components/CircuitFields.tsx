import type {BodyweightExercise,Circuit,ExerciseTarget} from '../../domain/types.ts';
import {exerciseNames,exerciseTarget} from '../../domain/circuit.ts';
import {RangeField} from './RangeField.tsx';
export function CircuitFields({value,onChange}:{value:Circuit;onChange:(value:Circuit)=>void}){
  const minimum=(c:Circuit)=>Math.min(90,Math.max(30,...c.exercises.map(exercise=>{const target=exerciseTarget(c,exercise);return target.mode==='time'?target.seconds*2:30;})));
  const change=(c:Circuit)=>onChange({...c,restSeconds:Math.max(c.restSeconds,minimum(c))});
  const setTarget=(exercise:BodyweightExercise,target:ExerciseTarget)=>change({...value,targets:{...value.targets,[exercise]:target}});
  return <fieldset className="circuit-fields"><legend>每轮徒手动作</legend><div className="exercise-target-grid">
    {(['squat','pushup'] as const).map(exercise=>{const target=exerciseTarget(value,exercise),enabled=value.exercises.includes(exercise),name=exerciseNames[exercise];return <div className="exercise-target-row" key={exercise}>
      <label className="check-row"><input type="checkbox" checked={enabled} onChange={e=>change({...value,exercises:e.target.checked?[...value.exercises,exercise]:value.exercises.filter(x=>x!==exercise)})}/><span>{name}</span></label>
      {enabled&&<><label>计算方式<select aria-label={name+'计算方式'} value={target.mode} onChange={e=>setTarget(exercise,e.target.value==='time'?{mode:'time',seconds:value.workSeconds}:{mode:'reps',repetitions:exercise==='squat'?12:8})}><option value="time">按时间</option><option value="reps">按次数</option></select></label>
      <RangeField label={target.mode==='time'?'时长（秒）':'次数（次）'} name={name+(target.mode==='time'?'时长（秒）':'次数（次）')} sliderLabel={'调节'+name+(target.mode==='time'?'时长':'次数')} unit={target.mode==='time'?'秒':'次'} min={target.mode==='time'?10:1} max={30} value={target.mode==='time'?target.seconds:target.repetitions} onChange={n=>setTarget(exercise,target.mode==='time'?{mode:'time',seconds:n}:{mode:'reps',repetitions:n})}/></>}
    </div>;})}</div>
    <RangeField label="动作后休息（秒）" sliderLabel="调节站立休息秒数" unit="秒" min={minimum(value)} max={90} value={value.restSeconds} onChange={restSeconds=>onChange({...value,restSeconds})}/>
    <p className="caption">按次数完成后点击确认；离机、上机各 20 秒。恢复不足可暂停。</p>
  </fieldset>;
}

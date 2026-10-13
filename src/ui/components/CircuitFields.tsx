import type {BodyweightExercise,Circuit,ExerciseTarget} from '../../domain/types.ts';
import {exerciseNames,exerciseTarget} from '../../domain/circuit.ts';

export function CircuitFields({value,onChange}:{value:Circuit;onChange:(value:Circuit)=>void}){
  const setTarget=(exercise:BodyweightExercise,target:ExerciseTarget)=>onChange({...value,targets:{...value.targets,[exercise]:target}});
  const minimumRest=Math.max(30,...value.exercises.map(exercise=>{const target=exerciseTarget(value,exercise);return target.mode==='time'?target.seconds*2:30;}));
  return <fieldset className="circuit-fields"><legend>每轮徒手动作</legend>
    {(['squat','pushup'] as const).map(exercise=>{const target=exerciseTarget(value,exercise),enabled=value.exercises.includes(exercise),name=exerciseNames[exercise];return <div className="exercise-target-row" key={exercise}>
      <label className="check-row"><input type="checkbox" checked={enabled} onChange={e=>onChange({...value,exercises:e.target.checked?[...value.exercises,exercise]:value.exercises.filter(x=>x!==exercise)})}/><span>{name}</span></label>
      {enabled&&<div className="form-grid"><label>计算方式<select aria-label={name+'计算方式'} value={target.mode} onChange={e=>setTarget(exercise,e.target.value==='time'?{mode:'time',seconds:value.workSeconds}:{mode:'reps',repetitions:exercise==='squat'?12:8})}><option value="time">按时间</option><option value="reps">按次数</option></select></label>
      <label>{target.mode==='time'?'时长（秒）':'次数（次）'}<input aria-label={name+(target.mode==='time'?'时长（秒）':'次数（次）')} type="number" required min={target.mode==='time'?10:1} max={30} step={1} value={target.mode==='time'?target.seconds:target.repetitions} onChange={e=>setTarget(exercise,target.mode==='time'?{mode:'time',seconds:Number(e.target.value)}:{mode:'reps',repetitions:Number(e.target.value)})}/></label></div>}
    </div>;})}
    <label>动作后休息（秒）<input type="number" required min={minimumRest} max={90} step={1} value={value.restSeconds} onChange={e=>onChange({...value,restSeconds:Number(e.target.value)})}/></label>
    <p className="caption">按次数完成后点击确认；离机、上机各 20 秒。恢复不足可暂停。</p>
  </fieldset>;
}

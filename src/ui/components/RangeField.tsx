import {useId} from 'react';

export function RangeField({label,sliderLabel,name,unit,value,min,max,step=1,disabled=false,onChange}:{label:string;sliderLabel:string;name?:string;unit:string;value:number;min:number;max:number;step?:number;disabled?:boolean;onChange:(value:number)=>void}){
  const id=useId(),safe=Math.min(max,Math.max(min,Number.isFinite(value)?value:min));
  return <div className="range-field"><div className="range-heading"><label htmlFor={id}>{label}</label><div className="range-value"><input id={id} aria-label={name??label} type="number" required min={min} max={max} step={step} value={value} disabled={disabled} onChange={e=>onChange(Number(e.target.value))}/><span aria-hidden="true">{unit}</span></div></div><input type="range" min={min} max={max} step={step} value={safe} disabled={disabled} aria-label={sliderLabel} aria-valuetext={`${safe} ${unit}`} onChange={e=>onChange(Number(e.target.value))}/><div className="range-limits" aria-hidden="true"><span>{min} {unit}</span><span>{max} {unit}</span></div></div>;
}

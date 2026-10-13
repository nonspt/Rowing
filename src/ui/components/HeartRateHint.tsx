import type {Course,Stage} from '../../domain/types.ts';
import {heartRateBand,heartRateSource} from '../../content/heart-rate.ts';

export function HeartRateHint({presetId,course,stage,compact=false}:{presetId?:string;course?:Course;stage?:Stage;compact?:boolean}){
  const band=heartRateBand(presetId,course,stage);if(!band)return null;
  const interval=presetId?.startsWith('AN')&&(!course||course.category==='interval'),note=interval?'短间歇以用力与动作为主，不追赶心率；恢复参考 94–113 bpm。':'连续划行参考区间，以体感调整；不是实测心率。';
  return <div className={`heart-rate-hint ${compact?'compact':''}`} aria-label={`估算心率参考 ${band[0]} 至 ${band[1]} bpm。${note}`}><div className="heart-rate-reading"><span>{compact?'估算心率':'建议心率 · 估算'}</span><strong>{band[0]}–{band[1]} <small>bpm</small></strong></div>{!compact&&<><p className="caption">{note}</p><p className="caption heart-rate-source">个体差异及药物可影响心率。<a href={heartRateSource} target="_blank" rel="noopener noreferrer">估算依据</a></p></>}</div>;
}

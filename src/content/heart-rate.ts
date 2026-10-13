import type {Course,Stage} from '../domain/types.ts';

// Approximate reference bands only; no personal measurements are retained.
export const heartRateBands:Record<string,readonly [number,number]>={AE01:[94,113],AE02:[113,132],AE03:[103,122],AN01:[132,150],AN02:[141,160],AN03:[141,160]};
export const heartRateSource='https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/target-heart-rates';
export function heartRateBand(presetId:string|undefined,course?:Course,stage?:Stage){
  if(!presetId||!heartRateBands[presetId])return null;
  if(course&&course.category!=='interval'&&presetId.startsWith('AN'))return heartRateBands.AE01;
  if(stage?.adjustment)return null;
  if(stage&&(stage.exercise==='squat'||stage.exercise==='pushup'))return null;
  if(stage&&stage.kind!=='work')return heartRateBands.AE01;
  return heartRateBands[presetId];
}

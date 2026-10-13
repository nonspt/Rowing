import {newEntity,type Profile} from './types.ts';
export function defaultProfile():Profile {
  return {...newEntity('profile'),experience:'new',goal:'aerobic',weeklyDays:3,availableMinutes:30,machine:'通用家用划船机',timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,sound:false};
}

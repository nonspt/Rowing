import type {TrainingMode} from '../domain/types.ts';
export const planDurations=[2,4,6,8,12] as const;
export const modeNames:Record<TrainingMode,string>={aerobic:'有氧',anaerobic:'无氧'};
export const presets=[
  {id:'AE01',mode:'aerobic',title:'轻松有氧',subtitle:'轻松连续划行，建立耐力',weeklyDays:3,minutes:'15–22'},
  {id:'AE02',mode:'aerobic',title:'基础耐力',subtitle:'稳定用力，逐步延长时间',weeklyDays:3,minutes:'25–30'},
  {id:'AE03',mode:'aerobic',title:'长时有氧',subtitle:'适合已经适应持续划行',weeklyDays:3,minutes:'30–40'},
  {id:'AN01',mode:'anaerobic',title:'无氧适应',subtitle:'每周一节短间歇，搭配轻松有氧',weeklyDays:2,minutes:'15–25'},
  {id:'AN02',mode:'anaerobic',title:'短间歇强化',subtitle:'每周两节短间歇，间隔恢复',weeklyDays:3,minutes:'15–25'},
  {id:'AN03',mode:'anaerobic',title:'无氧进阶',subtitle:'逐步从 20 秒工作段过渡至 30 秒',weeklyDays:3,minutes:'15–25'},
] as const;

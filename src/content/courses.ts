import type {Course, Stage} from '../domain/types.ts';
import {CONTENT_VERSION} from '../domain/types.ts';
export const goalNames = {technique: '动作练习', aerobic: '有氧基础', habit: '建立习惯', interval: '高强度间歇', recovery: '轻松恢复'};
export const stageNames = {warmup: '热身', work: '工作段', recovery: '轻松恢复', cooldown: '放松'};
const stage = (kind: Stage['kind'], seconds: number, rpe: [number, number], cue: string): Stage => ({id: '', kind, durationSeconds: seconds, rpe, cue});
const build = (id: string, title: string, category: Course['category'], warm: number, work: number, recover: number, repeats: number, cool: number, rpe: [number, number], level: Course['level'], focus: string): Course => {
  const stages = [stage('warmup', warm * 60, [2, 3], '先轻松划行，让动作逐渐连贯。')];
  for (let i = 0; i < repeats; i++) {stages.push(stage('work', work, rpe, focus)); if (recover) stages.push(stage('recovery', recover, [2, 3], '减小用力，保持舒适的呼吸与动作。'));}
  stages.push(stage('cooldown', cool * 60, [2, 3], '逐渐减小用力，轻松结束本次训练。'));
  return {id, title, category, stages: stages.map((s, i) => ({...s, id: `${id}-${i}`})), plannedDurationSeconds: stages.reduce((sum, s) => sum + s.durationSeconds, 0), level, contentVersion: CONTENT_VERSION, status: 'confirmed', focus,
    description: category === 'interval' ? '较短的受控高强度工作段，搭配充分轻松恢复，练习短间歇表现。' : category === 'technique' ? '把注意力放在动作顺序与协调上，用轻松划行建立稳定的动作。' : '按照自己的舒适程度练习，先稳定完成，再逐步增加训练时间。',
    suitability: level === 'new' ? '刚开始或希望重新练习动作的用户' : level === 'regular' ? '已有规律训练经验且熟悉动作的用户' : '已适应连续轻松划行的用户', alternativeId: category === 'interval' ? 'A01' : 'R01'};
};
export const courses: Course[] = [
  build('T01', '动作起步', 'technique', 3, 60, 60, 4, 3, [2, 3], 'new', '腿先发力，再带动躯干，最后拉柄。'),
  build('T02', '回桨节奏', 'technique', 4, 120, 60, 3, 3, [3, 4], 'new', '先伸手，再从髋部前倾，手过膝后再屈膝。'),
  build('A01', '轻松连续', 'aerobic', 4, 480, 0, 1, 3, [3, 4], 'new', '保持能轻松交流的用力，肩颈放松。'),
  build('A02', '有氧基础', 'aerobic', 5, 900, 0, 1, 5, [4, 6], 'basic', '保持舒适稳定，按感受调整用力。'),
  build('A03', '有氧分段', 'aerobic', 4, 180, 60, 4, 4, [4, 5], 'basic', '每段稳定完成，不需要追求更快。'),
  build('A04', '稳定耐力', 'aerobic', 5, 1200, 0, 1, 5, [4, 6], 'basic', '用力均匀，保持自然呼吸。'),
  build('M01', '受控节奏', 'aerobic', 6, 180, 120, 3, 5, [6, 7], 'regular', '节奏稳定，动作失去控制时减小用力。'),
  build('H01', '短间歇体验', 'interval', 8, 20, 100, 6, 5, [7, 8], 'regular', '短时提高用力，保持动作规范，不做极限冲刺。'),
  build('H02', '短间歇进阶', 'interval', 8, 30, 90, 6, 5, [7, 8], 'regular', '在动作稳定的前提下完成较强工作段。'),
  build('R01', '恢复划行', 'recovery', 3, 360, 0, 1, 3, [2, 3], 'new', '轻松划行；如果疲劳，也可以直接休息。'),
];
export const courseById = (id: string): Course => {const course = courses.find(c => c.id === id); if (!course) throw new Error('课程不存在，请重新选择。'); return structuredClone(course);};
export const planTemplates = [
  {id: 'P01', title: '动作与习惯', subtitle: '从第一桨开始，建立自己的节奏', goal: 'technique', weeks: [['T01','T02','A01'],['T01','A01','A01'],['T02','A01','A03'],['A01','A03','A02']]},
  {id: 'P02', title: '有氧基础', subtitle: '舒适、稳定，逐步积累耐力', goal: 'aerobic', weeks: [['A02','A03','A02'],['A02','A03','A04'],['A04','A02','A04'],['A02','A03','A02']]},
  {id: 'P03', title: '有氧与短间歇', subtitle: '每周一节可选高强度课，其余稳定有氧', goal: 'interval', weeks: [['A02','H01','A02'],['A02','H01','A02'],['A02','H02','A04'],['A01','H01','A01']]},
] as const;

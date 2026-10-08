// Original side-view geometry based on Concept2's four stroke phases.
// These proportions illustrate sequence, not prescribed joint angles.
export type Point = {x: number; y: number};
export type RowingPose = {hip: Point; knee: Point; ankle: Point; shoulder: Point; elbow: Point; hand: Point; head: Point};
export const strokeSteps = [
  {title: '蹬腿', cue: '腿部启动，手臂保持伸展。', start: 0},
  {title: '打开躯干', cue: '腿部接近伸展，再从髋部打开躯干。', start: .19},
  {title: '拉柄', cue: '最后弯肘，手柄到下肋附近。', start: .28},
  {title: '伸手', cue: '先伸直手臂，腿保持伸展。', start: .36},
  {title: '前倾', cue: '手臂伸展后，从髋部向前倾。', start: .48},
  {title: '屈膝', cue: '手柄已过膝，再屈膝前滑。', start: .64},
] as const;
const keys = [
  {at: 0, seat: 259, lean: 18, pull: 0},
  {at: .19, seat: 162, lean: 18, pull: 0},
  {at: .28, seat: 162, lean: -18, pull: 0},
  {at: .36, seat: 162, lean: -18, pull: 1},
  {at: .48, seat: 162, lean: -18, pull: 0},
  {at: .64, seat: 162, lean: 18, pull: 0},
  {at: 1, seat: 259, lean: 18, pull: 0},
];
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const normalizeStroke = (value: number) => value>=0&&value<1?value:((value % 1) + 1) % 1;
export const strokeStepIndex = (progress: number) => {
  const p = normalizeStroke(progress);
  return strokeSteps.reduce<number>((found,step,index)=>step.start<=p+1e-9?index:found,0);
};
// Two-link inverse kinematics fixes limb lengths during interpolation.
function joint(start: Point, end: Point, first: number, second: number, bend: number): Point {
  const dx = end.x - start.x, dy = end.y - start.y;
  const distance = Math.max(.001, Math.hypot(dx, dy));
  const along = (first * first - second * second + distance * distance) / (2 * distance);
  const height = Math.sqrt(Math.max(0, first * first - along * along));
  return {x: start.x + along * dx / distance - bend * height * dy / distance,
    y: start.y + along * dy / distance + bend * height * dx / distance};
}
export function rowingPose(progress: number): RowingPose {
  const p = normalizeStroke(progress), index = Math.max(0, keys.reduce((found,k,index)=>k.at<=p?index:found,0));
  const a = keys[index], b = keys[index + 1];
  const t = (p - a.at) / (b.at - a.at), eased = t * t * (3 - 2 * t);
  const hip = {x: mix(a.seat, b.seat, eased), y: 214}, ankle = {x: 330, y: 238};
  const lean = mix(a.lean, b.lean, eased) * Math.PI / 180;
  const shoulder = {x: hip.x + Math.sin(lean) * 80, y: hip.y - Math.cos(lean) * 80};
  const pull = mix(a.pull, b.pull, eased), handY = 170;
  const extendedX = shoulder.x + Math.sqrt(98 * 98 - (handY - shoulder.y) ** 2);
  const hand = {x: mix(extendedX, hip.x + 12, pull), y: handY};
  return {hip, ankle, shoulder, hand, knee: joint(hip, ankle, 90, 80, -1),
    elbow: joint(shoulder, hand, 49, 49, 1),
    head: {x: shoulder.x + Math.sin(lean) * 23, y: shoulder.y - Math.cos(lean) * 23}};
}
export const phaseProgress = [0, .19, .36, .64] as const;

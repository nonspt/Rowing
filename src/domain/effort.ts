export const FOLLOW_EFFORT_MAX=16;
const COURSE_EFFORT_MAX=10;

// Course snapshots keep their validated 0–10 scale; follow-along uses whole 0–16 levels.
export function followEffort(rpe:readonly [number,number]):[number,number]{
  return [Math.round(rpe[0]*FOLLOW_EFFORT_MAX/COURSE_EFFORT_MAX),Math.round(rpe[1]*FOLLOW_EFFORT_MAX/COURSE_EFFORT_MAX)];
}

import { HEIGHT, type Course, type Island } from "./courses";

export const STEP = 1 / 90;
export interface Controls {
  direction: number;
  jump: boolean;
  lift: boolean;
}
export type GameEvent = "jump" | "spring" | "pickup" | "flag" | "fall" | "win";
export interface Run {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number;
  time: number;
  ground: number | null;
  jumps: number;
  grace: number;
  jumpBuffer: number;
  collected: Set<number>;
  flagged: boolean;
  finished: boolean;
  returns: number;
}
// Tọa độ y là vị trí bàn chân; toàn bộ va chạm dùng đơn vị thế giới, độc lập với kích thước màn hình.
export function newRun(course: Course): Run {
  return {
    x: 50,
    y: course.mode === "jump" ? course.islands[0].y : 140,
    vx: 0,
    vy: 0,
    facing: 1,
    time: 0,
    ground: course.mode === "jump" ? 0 : null,
    jumps: 0,
    grace: 0,
    jumpBuffer: 0,
    collected: new Set(),
    flagged: false,
    finished: false,
    returns: 0,
  };
}
export function islandX(island: Island, time: number) {
  return (
    island.x + (island.drift ?? 0) * Math.sin(time * 1.8 + island.x * 0.017)
  );
}
export function stormY(y: number, x: number, time: number) {
  return y + Math.sin(time * 1.6 + x * 0.09) * 9;
}
const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

function respawn(course: Course, run: Run) {
  const start = newRun(course);
  const point = run.flagged ? course.checkpoint : start;
  run.x = point.x;
  run.y = point.y;
  run.vx = 0;
  run.vy = 0;
  run.jumps = 0;
  run.grace = 0;
  run.jumpBuffer = 0;
  run.facing = 1;
  run.ground =
    course.mode === "jump"
      ? course.islands.findIndex(
          (i) => i.y === point.y && point.x >= i.x && point.x <= i.x + i.width,
        )
      : null;
  run.returns++;
}

function stepJump(
  c: Course,
  r: Run,
  input: Controls,
  dt: number,
  events: GameEvent[],
) {
  const oldY = r.y;
  if (input.jump) r.jumpBuffer = 0.12;
  else r.jumpBuffer = Math.max(0, r.jumpBuffer - dt);
  if (r.ground !== null) {
    const support = c.islands[r.ground];
    r.x += islandX(support, r.time) - islandX(support, r.time - dt);
    r.grace = 0.1;
    r.jumps = 0;
  } else {
    r.grace = Math.max(0, r.grace - dt);
    if (!r.grace && r.jumps === 0) r.jumps = 1;
  }
  const target = input.direction * c.speed;
  const change = dt * (input.direction === 0 ? 1450 : 1150);
  r.vx += clamp(target - r.vx, -change, change);
  if (input.direction) r.facing = Math.sign(input.direction);
  r.x = clamp(r.x + r.vx * dt, 10, c.goal + 20);
  if (r.jumpBuffer > 0 && r.jumps < 2) {
    r.vy = r.jumps === 0 ? -260 : -231;
    r.ground = null;
    r.grace = 0;
    r.jumps++;
    r.jumpBuffer = 0;
    events.push("jump");
  }
  r.vy += 620 * dt;
  r.y += r.vy * dt;
  r.ground = null;
  if (r.vy >= 0) {
    for (let i = 0; i < c.islands.length; i++) {
      const island = c.islands[i],
        x = islandX(island, r.time);
      if (r.x + 8 < x || r.x - 8 > x + island.width) continue;
      const overSpring =
        island.spring !== undefined && Math.abs(r.x - x - island.spring) < 13;
      const cap = island.y - 17;
      const hitsCap = oldY <= cap && r.y >= cap;
      const hitsGround = oldY <= island.y + 0.2 && r.y >= island.y;
      if (overSpring && (hitsCap || hitsGround)) {
        r.y = hitsCap ? cap : island.y;
        r.vy = -376;
        r.jumps = 1;
        events.push("spring");
        break;
      }
      if (!hitsGround) continue;
      r.y = island.y;
      r.vy = 0;
      r.ground = i;
      r.jumps = 0;
      break;
    }
  }
  for (const island of c.islands) {
    if (
      island.thorns !== undefined &&
      Math.abs(r.x - islandX(island, r.time) - island.thorns) < 15 &&
      r.y > island.y - 11 &&
      r.y - 24 < island.y + 2
    ) {
      respawn(c, r);
      events.push("fall");
      return;
    }
  }
  if (r.y > HEIGHT + 30) {
    respawn(c, r);
    events.push("fall");
    return;
  }
  if (
    !r.flagged &&
    r.ground !== null &&
    r.y === c.checkpoint.y &&
    Math.abs(r.x - c.checkpoint.x) < 33
  ) {
    r.flagged = true;
    events.push("flag");
  }
}
function stepGlide(
  c: Course,
  r: Run,
  input: Controls,
  dt: number,
  events: GameEvent[],
) {
  r.vx = c.speed;
  r.x += r.vx * dt;
  const wind = c.winds?.find((w) => r.x >= w.x && r.x <= w.x + w.width);
  r.vy = clamp(
    r.vy + ((input.lift ? -370 : 310) + (wind?.force ?? 0)) * dt,
    -120,
    115,
  );
  r.y += r.vy * dt;
  if (
    r.y < 18 ||
    r.y > HEIGHT - 5 ||
    c.storms.some(
      (s) =>
        Math.abs(r.x - s.x) < 21 &&
        Math.abs(r.y - 15 - stormY(s.y, s.x, r.time)) < 16,
    )
  ) {
    respawn(c, r);
    events.push("fall");
    return;
  }
  if (!r.flagged && r.x >= c.checkpoint.x) {
    r.flagged = true;
    events.push("flag");
  }
}

/** Nearest distance from a gem to the travelled path of Buddy's torso.
 * Resolves fast-frame tunnelling and near-overlaps consistently at every FPS.
 */
export function withinPickupPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  gem: { x: number; y: number },
  radius: number,
): boolean {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const segmentLengthSquared = dx * dx + dy * dy;
  const projection = segmentLengthSquared > 0
    ? Math.max(0, Math.min(1,
      ((gem.x - start.x) * dx + (gem.y - start.y) * dy) / segmentLengthSquared))
    : 0;
  const px = start.x + projection * dx;
  const py = start.y + projection * dy;
  return (gem.x - px) ** 2 + (gem.y - py) ** 2 <= radius ** 2;
}

export function advance(
  course: Course,
  run: Run,
  input: Controls,
  dt = STEP,
): GameEvent[] {
  const events: GameEvent[] = [];
  if (run.finished) return events;
  const initial = { x: run.x, y: run.y - 16 };
  run.time += dt;
  if (course.mode === "jump") stepJump(course, run, input, dt, events);
  else stepGlide(course, run, input, dt, events);
  if (events.includes("fall")) return events;
  // The gem artwork is wider than the old 20px collision circle.
  // A slightly forgiving swept pickup area prevents visible overlaps failing.
  const radius = course.mode === "jump" ? 30 : 31;
  const end = { x: run.x, y: run.y - 16 };
  for (let i = 0; i < course.gems.length; i++) {
    const gem = course.gems[i];
    if (
      !run.collected.has(i) &&
      withinPickupPath(initial, end, gem, radius)
    ) {
      run.collected.add(i);
      events.push("pickup");
    }
  }
  if (
    run.x >= course.goal &&
    (course.mode === "glide" || run.ground === course.islands.length - 1)
  ) {
    run.finished = true;
    events.push("win");
  }
  return events;
}

export function cameraX(course: Course, run: Run, width: number) {
  return clamp(run.x - width * 0.29, 0, Math.max(0, course.goal + 90 - width));
}

export const arrows = ["up", "right", "down", "left"] as const;
export type Arrow = (typeof arrows)[number];
export const vectors: Record<Arrow, [number, number]> = {
  up: [0, -1],
  right: [1, 0],
  down: [0, 1],
  left: [-1, 0],
};
export type MotionId = "duong-chay" | "hung-sao" | "vu-dieu" | "ran-vuon";
export const isMotion = (id: string): id is MotionId =>
  ["duong-chay", "hung-sao", "vu-dieu", "ran-vuon"].includes(id);
interface Base {
  level: number;
  t: number;
  score: number;
  goal: number;
  end: "won" | "lost" | null;
  notice: string;
}
interface Runner extends Base {
  id: "duong-chay";
  distance: number;
  speed: number;
  y: number;
  vy: number;
  rocks: number[];
  passed: number;
}
interface Drop {
  lane: number;
  born: number;
  kind: "star" | "moon" | "storm";
  resolved: boolean;
}
interface Catch extends Base {
  id: "hung-sao";
  lane: number;
  next: number;
  serial: number;
  items: Drop[];
  hearts: number;
}
interface Dance extends Base {
  id: "vu-dieu";
  notes: { dir: Arrow; at: number }[];
  index: number;
  misses: number;
  window: number;
}
interface Snake extends Base {
  id: "ran-vuon";
  body: number[];
  stones: number[];
  apple: number;
  dir: Arrow;
  queued: Arrow;
  acc: number;
  seed: number;
  started: boolean;
}
export type World = Runner | Catch | Dance | Snake;
export const cols = 13,
  rows = 10;
export function makeWorld(id: MotionId, level: number): World {
  const base = { level, t: 0, score: 0, goal: 0, end: null, notice: "" };
  if (id === "duong-chay") {
    const rocks = Array.from(
      { length: 5 + level },
      (_, i) => 250 + i * (196 + level * 4) + (i % 3) * 15,
    );
    return {
      ...base,
      id,
      distance: 0,
      speed: 111 + level * 7,
      y: 0,
      vy: 0,
      rocks,
      passed: 0,
      goal: rocks.length,
    };
  }
  if (id === "hung-sao")
    return {
      ...base,
      id,
      lane: 1,
      next: 0.55,
      serial: 0,
      items: [],
      hearts: 4,
      goal: 10 + 2 * level,
    };
  if (id === "vu-dieu") {
    const notes = Array.from({ length: 8 + level * 2 }, (_, i) => ({
      dir: arrows[(i * 3 + Math.floor(i / 3) + level) % 4],
      at: 2.2 + i * (1.02 - level * 0.047),
    }));
    return {
      ...base,
      id,
      notes,
      index: 0,
      misses: 0,
      window: 0.37 - level * 0.016,
      goal: notes.length,
    };
  }
  const stones = [17, 110, 35, 93, 37, 106, 21, 47, 81, 27].slice(0, level * 2);
  return {
    ...base,
    id,
    body: [68, 67, 66],
    stones,
    apple: 72,
    dir: "right",
    queued: "right",
    acc: 0,
    seed: level + 11,
    started: false,
    goal: 3 + level,
  };
}
/** Stars catch once they enter Buddy's basket area, not a fraction of a second
 * after they have already visually touched it. More forgiving at high levels.
 */
export const dropDuration = (level: number) => 2.95 - level * 0.12;
export const starCatchProgress = 0.78;
export const catchTimeLimit = (level: number) => 42 + level * 2;
export const maxDanceMisses = 4;
export function beatInput(w: World, command: Arrow | "jump" | number) {
  if (w.end) return;
  if (
    w.id === "duong-chay" &&
    (command === "jump" || command === "up") &&
    w.y <= 0
  ) {
    w.vy = 255;
    w.y = 0.001;
  }
  if (w.id === "hung-sao") {
    if (typeof command === "number") w.lane = Math.max(0, Math.min(3, command));
    else if (command === "left" || command === "right")
      w.lane = Math.max(0, Math.min(3, w.lane + (command === "left" ? -1 : 1)));
  }
  if (w.id === "vu-dieu" && typeof command === "string" && command !== "jump") {
    const note = w.notes[w.index];
    if (!note) return;
    const offset = Math.abs(note.at - w.t);
    if (offset > w.window) {
      w.notice = "Chờ nốt vào vòng sáng.";
      return;
    }
    if (command === note.dir) {
      w.score += offset < w.window * 0.5 ? 3 : 2;
      w.notice = offset < w.window * 0.5 ? "Đúng nhịp!" : "Bắt được nốt!";
    } else {
      w.misses++;
      w.notice = "Lệch hướng rồi.";
    }
    w.index++;
    if (w.misses >= maxDanceMisses) w.end = "lost";
    else if (w.index === w.goal) w.end = "won";
  }
  if (
    w.id === "ran-vuon" &&
    typeof command === "string" &&
    command !== "jump"
  ) {
    const [dx, dy] = vectors[w.dir],
      [nx, ny] = vectors[command];
    if (dx + nx !== 0 || dy + ny !== 0) {
      w.queued = command;
      w.started = true;
    }
  }
}
export function advanceWorld(w: World, dt: number) {
  if (w.end) return;
  w.t += dt;
  if (w.id === "duong-chay") {
    w.distance += w.speed * dt;
    w.vy -= 600 * dt;
    w.y = Math.max(0, w.y + w.vy * dt);
    if (!w.y) w.vy = 0;
    const gap = w.rocks[w.passed] - w.distance;
    if (gap < 13 && gap > -13 && w.y < 17) {
      w.end = "lost";
      w.notice = "Vấp đá trên đường chạy.";
      return;
    }
    if (gap < -13) {
      w.passed++;
      w.score = w.passed;
    }
    if (w.distance > w.rocks[w.rocks.length - 1] + 70) w.end = "won";
  } else if (w.id === "hung-sao") {
    if (w.t >= w.next) {
      const n = w.serial++;
      w.items.push({
        lane: (n * 3 + Math.floor(n / 3) + w.level) % 4,
        born: w.t,
        kind: n % 5 === 4 ? "storm" : n % 3 === 2 ? "moon" : "star",
        resolved: false,
      });
      w.next += 1.13 - w.level * 0.045;
    }
    for (const drop of w.items) {
      if (drop.resolved) continue;
      const age = w.t - drop.born;
      const duration = dropDuration(w.level);
      // Stars/moons are collected as soon as they overlap the basket lane.
      // Late lane changes still work until the item reaches the ground.
      if (drop.kind !== "storm" &&
        drop.lane === w.lane && age >= duration * starCatchProgress &&
        age <= duration + 0.14) {
        drop.resolved = true;
        const pts = drop.kind === "moon" ? 3 : 2;
        w.score += pts;
        w.notice = `+ ${pts} điểm · Bắt được rồi!`;
      } else if (age >= duration) {
        drop.resolved = true;
        if (drop.kind === "storm" && drop.lane === w.lane) {
          w.hearts--;
          w.notice = "Mây giông! Chuyển làn để tránh nhé.";
        }
      }
    }
    w.items = w.items.filter((x) => !x.resolved);
    if (w.score >= w.goal) w.end = "won";
    else if (!w.hearts || w.t >= catchTimeLimit(w.level)) w.end = "lost";
  } else if (w.id === "vu-dieu") {
    if (w.index < w.notes.length && w.t > w.notes[w.index].at + w.window) {
      w.index++;
      w.misses++;
      w.notice = "Lỡ một nốt.";
      if (w.misses >= maxDanceMisses) w.end = "lost";
      else if (w.index === w.goal) w.end = "won";
    }
  } else if (w.started) {
    w.acc += dt;
    const speed = 0.36 - w.level * 0.018;
    if (w.acc < speed) return;
    w.acc -= speed;
    w.dir = w.queued;
    const [dx, dy] = vectors[w.dir],
      x = (w.body[0] % cols) + dx,
      y = Math.floor(w.body[0] / cols) + dy,
      h = y * cols + x;
    const eating = h === w.apple;
    if (
      x < 0 ||
      y < 0 ||
      x >= cols ||
      y >= rows ||
      w.stones.includes(h) ||
      w.body.slice(0, eating ? undefined : -1).includes(h)
    ) {
      w.end = "lost";
      return;
    }
    w.body.unshift(h);
    if (!eating) {
      w.body.pop();
      return;
    }
    w.score++;
    if (w.score >= w.goal) {
      w.end = "won";
      return;
    }
    const empty = Array.from({ length: cols * rows }, (_, i) => i).filter(
      (i) => !w.body.includes(i) && !w.stones.includes(i),
    );
    w.seed = (w.seed * 48271) % 2147483647;
    w.apple = empty[w.seed % empty.length];
  }
}

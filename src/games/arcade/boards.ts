import type { Point } from "./courses";

export const expeditions = [
  {
    mode: "river",
    slug: "suoi-den-long",
    title: "Suối đèn lồng",
    genre: "Vượt suối",
    blurb: "Nhảy lên bè tre, đón đèn hoa và tìm đường về bến.",
  },
  {
    mode: "ice",
    slug: "hang-bang",
    title: "Hang băng pha lê",
    genre: "Trượt băng",
    blurb: "Lướt đến vách đá, gom pha lê và thắp sáng cổng hang.",
  },
] as const;
export type BoardMode = (typeof expeditions)[number]["mode"];
export type Direction = "up" | "left" | "down" | "right";
export const vectors: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  down: { x: 0, y: 1 },
  right: { x: 1, y: 0 },
};
export interface Board {
  mode: BoardMode;
  title: string;
  target: number;
  rows: string[];
  speeds: number[];
  width: number;
  start: Point;
  exit: Point;
  gems: Point[];
}
function board(
  mode: BoardMode,
  title: string,
  target: number,
  layout: string,
  speeds: number[] = [],
): Board {
  const rows = layout.split("/"),
    gems: Point[] = [];
  let start = { x: 0, y: 0 },
    exit = { x: 0, y: 0 };
  rows.forEach((row, y) =>
    [...row].forEach((tile, x) => {
      if (tile === "S") start = { x, y };
      if (tile === "E") exit = { x, y };
      if (tile === "*") gems.push({ x, y });
    }),
  );
  return {
    mode,
    title,
    target,
    rows,
    speeds,
    width: rows[0].length,
    start,
    exit,
    gems,
  };
}
export const boards: Record<BoardMode, Board[]> = {
  river: [
    board(
      "river",
      "Bến hoa súng",
      1,
      "...E.../==~*==~/~~~==*=/...F.../~=*==~~/...S...",
      [0, -0.48, 0.55, 0, 0.46, 0],
    ),
    board(
      "river",
      "Rặng tre xanh",
      2,
      ".E...../=~~=*~=/~~===*~/...F.../~=*~~==/==~~=*~/.....S.",
      [0, 0.65, -0.59, 0, 0.7, -0.57, 0],
    ),
    board(
      "river",
      "Đầm cá bạc",
      3,
      ".....E./~==~~*=/==*~~~=/...F.../~~=*~==/==~~~*=/~*==~~=/...S...",
      [0, -0.8, 0.65, 0, -0.72, 0.82, -0.58, 0],
    ),
    board(
      "river",
      "Chợ nổi chiều thu",
      3,
      "..E..../==~~*~~/~~=*~~=/=*~~==~/...F.../~==~*~~/~~*==~~/=~~==*~/....S..",
      [0, 0.88, -0.78, 0.68, 0, 0.91, -0.85, 0.69, 0],
    ),
    board(
      "river",
      "Khúc sông xoáy",
      4,
      ".....E./*~~==~~/~~=~~*=/=*~~~==/...F.../=~~*~~=/~==~~~*/~~=*~~=/==~~~*~/..S....",
      [0, -1.02, 0.85, -0.73, 0, 1, -0.88, 1.05, -0.72, 0],
    ),
    board(
      "river",
      "Lễ hội hoa đăng",
      5,
      ".E...../~*~~=~~/=~~*~~=/~~==~*~/...F.../~==~~~*/~~=~~*=/=*~~~=~/~~*~==~/.....S.",
      [0, 1.13, -0.97, 1.03, 0, -1.15, 0.89, -1.05, 0.76, 0],
    ),
  ],
  ice: [
    board(
      "ice",
      "Giọt băng đầu tiên",
      3,
      "#######/##.#..#/#..E#.#/#.....#/#*...##/#..S..#/#######",
    ),
    board(
      "ice",
      "Ngã rẽ lam ngọc",
      5,
      "#######/##.*.##/#..#..#/#...*.#/#S....#/###.E.#/#######",
    ),
    board(
      "ice",
      "Vòm thạch anh",
      7,
      "########/#......#/#*...E.#/##.#...#/#....#.#/#*....##/#..S.###/########",
    ),
    board(
      "ice",
      "Phòng gương",
      9,
      "########/#..E.#.#/#...*###/##...*.#/#.S....#/#....*.#/#.#....#/########",
    ),
    board(
      "ice",
      "Mạch sáng dưới hồ",
      12,
      "#########/#.......#/#...#..S#/##..E...#/#.##*.#*#/#....#.*#/#.....#.#/#...#.###/#########",
    ),
    board(
      "ice",
      "Trái tim sông băng",
      15,
      "#########/##...#.E#/###S...##/#.....#.#/#.#...#.#/#.*...#.#/#..#..*##/##.*.#*##/#########",
    ),
  ],
};
export const bitCount = (bits: number) =>
  bits.toString(2).replace(/0/g, "").length;
type Snapshot = { x: number; y: number; mask: number; moves: number };
type Motion = { from: Point; to: Point; elapsed: number; duration: number };
export interface BoardRun extends Snapshot {
  time: number;
  falls: number;
  flag: Point;
  won: boolean;
  motion: Motion | null;
  queued: Direction | null;
  undo: Snapshot[];
  flash: number;
  notice: string;
}
export function startBoard(b: Board): BoardRun {
  return {
    ...b.start,
    mask: 0,
    moves: 0,
    time: 0,
    falls: 0,
    flag: { ...b.start },
    won: false,
    motion: null,
    queued: null,
    undo: [],
    flash: 0,
    notice: "",
  };
}
const wrap = (n: number, w: number) => ((n % w) + w) % w;
export const raftX = (b: Board, x: number, y: number, t: number) =>
  wrap(x + b.speeds[y] * t + 0.5, b.width) - 0.5;
export function raftAt(b: Board, x: number, y: number, t: number) {
  const source = wrap(Math.round(x - b.speeds[y] * t), b.width);
  return b.rows[y][source] === "~" ? -1 : source;
}
function pickup(b: Board, r: BoardRun, x: number, y: number) {
  const i = b.gems.findIndex((p) => p.x === x && p.y === y);
  if (i >= 0 && !(r.mask & (1 << i))) {
    r.mask |= 1 << i;
    r.flash = 0.36;
  }
}
export function icePath(
  b: Board,
  position: Point,
  mask: number,
  dir: Direction,
) {
  let { x, y } = position;
  const d = vectors[dir],
    full = (1 << b.gems.length) - 1;
  while (b.rows[y + d.y]?.[x + d.x] && b.rows[y + d.y][x + d.x] !== "#") {
    x += d.x;
    y += d.y;
    const gem = b.gems.findIndex((p) => p.x === x && p.y === y);
    if (gem >= 0) mask |= 1 << gem;
    if (x === b.exit.x && y === b.exit.y && mask === full) break;
  }
  return { x, y, mask };
}
export function moveBoard(b: Board, r: BoardRun, dir: Direction) {
  if (r.won) return false;
  if (r.motion) {
    r.queued = dir;
    return false;
  }
  const from = { x: r.x, y: r.y },
    d = vectors[dir];
  const to =
    b.mode === "ice"
      ? icePath(b, from, r.mask, dir)
      : { x: Math.round(r.x) + d.x, y: r.y + d.y };
  if (
    to.x < 0 ||
    to.y < 0 ||
    to.x >= b.width ||
    to.y >= b.rows.length ||
    (to.x === r.x && to.y === r.y)
  )
    return false;
  if (b.mode === "ice") r.undo.push({ ...from, moves: r.moves, mask: r.mask });
  r.moves++;
  const distance = Math.abs(r.x - to.x) + Math.abs(r.y - to.y);
  r.motion = {
    from,
    to,
    elapsed: 0,
    duration: b.mode === "ice" ? 0.09 + distance * 0.092 : 0.19,
  };
  return true;
}
export function undoSlide(r: BoardRun) {
  const last = r.undo.pop();
  if (!last || r.won) return false;
  Object.assign(r, last, {
    motion: null,
    queued: null,
    flash: 0,
    notice: "Đã lùi một lượt trượt.",
  });
  return true;
}
function splash(r: BoardRun) {
  Object.assign(r, r.flag, {
    motion: null,
    queued: null,
    flash: 0.45,
    notice: "Trượt chân! Bạn nhỏ đã về bến nghỉ.",
  });
  r.falls++;
}
export function tickBoard(b: Board, r: BoardRun, dt: number) {
  if (r.won) return;
  r.time += dt;
  r.flash = Math.max(0, r.flash - dt);
  const m = r.motion;
  if (!m) {
    if (b.mode === "river" && b.speeds[r.y]) {
      r.x += b.speeds[r.y] * dt;
      if (r.x < -0.45 || r.x > b.width - 0.55) splash(r);
    }
    return;
  }
  m.elapsed = Math.min(m.duration, m.elapsed + dt);
  const f = m.elapsed / m.duration;
  r.x = m.from.x + (m.to.x - m.from.x) * f;
  r.y = m.from.y + (m.to.y - m.from.y) * f;
  if (b.mode === "ice") pickup(b, r, Math.round(r.x), Math.round(r.y));
  if (f < 1) return;
  r.x = m.to.x;
  r.y = m.to.y;
  r.motion = null;
  if (b.mode === "river") {
    if (b.speeds[r.y]) {
      const raft = raftAt(b, r.x, r.y, r.time);
      if (raft < 0) {
        splash(r);
        return;
      }
      pickup(b, r, raft, r.y);
    } else if (b.rows[r.y].includes("F") && r.flag.y !== r.y) {
      r.flag = { x: b.rows[r.y].indexOf("F"), y: r.y };
      r.notice = "Đã đến bến nghỉ. Nếu ngã, bạn sẽ trở lại đây.";
    }
  }
  if (r.x === b.exit.x && r.y === b.exit.y) {
    r.won = bitCount(r.mask) >= (b.mode === "river" ? b.target : b.gems.length);
    if (!r.won)
      r.notice =
        b.mode === "river"
          ? `Còn thiếu ${b.target - bitCount(r.mask)} đèn hoa để mở bến vàng.`
          : "Cổng đang chờ đủ pha lê.";
  }
  const dir = r.queued;
  r.queued = null;
  if (dir && !r.won) moveBoard(b, r, dir);
}

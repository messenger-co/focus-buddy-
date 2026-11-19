export const worlds = [
  {
    id: "maze",
    name: "Mê cung đồi rêu",
    task: "Tìm chìa khóa rồi mở cánh cổng vàng giữa hàng cây.",
  },
  {
    id: "parkour",
    name: "Bậc thềm trên mây",
    task: "Bước trên đảo nổi. Bật nhảy xa để vượt một ô trống và chạm cờ cuối đường.",
  },
  {
    id: "puzzle",
    name: "Xưởng chuyển hàng",
    task: "Đẩy từng thùng gỗ lên các bệ sáng. Hãy chừa đường để vòng ra sau thùng.",
  },
  {
    id: "collect",
    name: "Thung lũng pha lê",
    task: "Thu đủ pha lê rồi về bến trước khi dùng hết số bước.",
  },
  {
    id: "play",
    name: "Sân màu của Buddy",
    task: "Nhớ các ô Buddy làm sáng, rồi nhắc lại đúng thứ tự bằng các phím hướng.",
  },
] as const;
export type Game = (typeof worlds)[number]["id"];
export const directions = ["up", "right", "down", "left"] as const;
export type Direction = (typeof directions)[number];
const dx = [0, 1, 0, -1],
  dy = [-1, 0, 1, 0];
export interface Board {
  game: Game;
  level: number;
  width: number;
  height: number;
  cells: string[];
  start: number;
  exit: number;
  gems: number[];
  boxes: number[];
  goals: number[];
  sequence: Direction[];
  budget: number;
}
export interface State {
  pos: number;
  boxes: number[];
  jewels: number;
  count: number;
  moves: number;
  respawn: number;
  result: "play" | "won" | "lost";
  note: string;
}
export function nextCell(b: Board, p: number, d: Direction, stride = 1) {
  const i = directions.indexOf(d),
    x = (p % b.width) + stride * dx[i],
    y = Math.floor(p / b.width) + stride * dy[i];
  return x < 0 || y < 0 || x >= b.width || y >= b.height ? -1 : y * b.width + x;
}
const walk = (b: Board, n: number) =>
  n >= 0 && b.cells[n] !== "#" && b.cells[n] !== "~";
function random(seed: number) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const layouts = [
  ["######", "#....#", "#SBo.#", "#....#", "######"],
  ["######", "#...o#", "#..B.#", "#S...#", "######"],
  ["#######", "#o...o#", "#.B.B.#", "#..S..#", "#######"],
  ["#######", "#..o..#", "#..B#.#", "#.BS.o#", "#.....#", "#######"],
  ["#######", "#o...o#", "#..B..#", "#.BSB.#", "#..o..#", "#######"],
  ["########", "#o..#..#", "#..B..o#", "#.B.S..#", "#...B.o#", "########"],
];
const trails = [
  "rRdr",
  "rDldrR",
  "RuUrDr",
  "rUrRddL",
  "RdDlLulU",
  "uRrDdLulUurR",
];
function parkour(level: number) {
  let x = 0,
    y = 0;
  const stops = [[x, y]];
  for (const c of trails[level]) {
    const i = "urdl".indexOf(c.toLowerCase()),
      n = c.toLowerCase() === c ? 1 : 2;
    x += dx[i] * n;
    y += dy[i] * n;
    stops.push([x, y]);
  }
  const minX = Math.min(...stops.map((s) => s[0])),
    minY = Math.min(...stops.map((s) => s[1]));
  const w = Math.max(...stops.map((s) => s[0])) - minX + 1,
    h = Math.max(...stops.map((s) => s[1])) - minY + 1;
  const rows = Array.from({ length: h }, () => Array<string>(w).fill("~"));
  stops.forEach(([a, b], i) => {
    rows[b - minY][a - minX] =
      i === 0
        ? "S"
        : i === stops.length - 1
          ? "G"
          : i === Math.floor(stops.length / 2)
            ? "C"
            : ".";
  });
  return rows.map((r) => r.join(""));
}
function maze(level: number, seed: number) {
  const w = 7 + 2 * Math.floor(level / 2),
    cells = Array.from({ length: w }, () => Array<string>(w).fill("#")),
    rng = random(seed);
  const stack = [[1, 1]];
  cells[1][1] = ".";
  while (stack.length) {
    const [x, y] = stack.at(-1)!;
    const options = directions
      .map((_, i) => [x + dx[i] * 2, y + dy[i] * 2])
      .filter(
        ([a, b]) =>
          a > 0 && b > 0 && a < w - 1 && b < w - 1 && cells[b][a] === "#",
      );
    if (!options.length) {
      stack.pop();
      continue;
    }
    const [a, b] = options[Math.floor(rng() * options.length)];
    cells[(y + b) / 2][(x + a) / 2] = cells[b][a] = ".";
    stack.push([a, b]);
  }
  return cells;
}
const held = (mask: number, i: number) => (mask & (1 << i)) !== 0;
export function collected(mask: number) {
  let n = 0;
  for (; mask; mask >>>= 1) n += mask & 1;
  return n;
}
export function collectDistance(b: Board) {
  const goal = (1 << b.gems.length) - 1,
    queue = [[b.start, 0, 0]],
    seen = new Set<number>();
  for (let i = 0; i < queue.length; i++) {
    const [p, mask, d] = queue[i];
    if (p === b.exit && mask === goal) return d;
    for (const dir of directions) {
      const n = nextCell(b, p, dir);
      if (!walk(b, n)) continue;
      const gem = b.gems.indexOf(n),
        m = gem < 0 ? mask : mask | (1 << gem),
        key = m * b.cells.length + n;
      if (!seen.has(key)) {
        seen.add(key);
        queue.push([n, m, d + 1]);
      }
    }
  }
  return Infinity;
}
export function makeBoard(game: Game, level: number): Board {
  const seed = 125 + level * 37 + (game === "collect" ? 214 : 0),
    rng = random(seed);
  let rows: string[];
  if (game === "puzzle") rows = layouts[level];
  else if (game === "parkour") rows = parkour(level);
  else if (game === "play")
    rows = ["#####", "##.##", "#.S.#", "##.##", "#####"];
  else {
    const cells = maze(level, seed),
      free = cells.flatMap((row, y) =>
        row.flatMap((c, x) =>
          c === "." && (x !== 1 || y !== 1) ? [[x, y]] : [],
        ),
      );
    for (let i = free.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [free[i], free[j]] = [free[j], free[i]];
    }
    cells[1][1] = "S";
    let furthest = free.reduce((a, b) => (a[0] + a[1] > b[0] + b[1] ? a : b));
    cells[furthest[1]][furthest[0]] = "G";
    free
      .filter(([x, y]) => cells[y][x] === ".")
      .slice(0, game === "maze" ? 1 : 2 + Math.floor(level / 2))
      .forEach(([x, y]) => {
        cells[y][x] = "*";
      });
    rows = cells.map((r) => r.join(""));
  }
  const cells = rows.join("").split(""),
    find = (c: string) => cells.flatMap((v, i) => (v === c ? [i] : []));
  const b: Board = {
    game,
    level,
    width: rows[0].length,
    height: rows.length,
    cells,
    start: cells.indexOf("S"),
    exit: cells.indexOf("G"),
    boxes: find("B"),
    goals: find("o"),
    gems: find("*"),
    sequence: Array.from(
      { length: 3 + level },
      () => directions[Math.floor(rng() * 4)],
    ),
    budget: 0,
  };
  if (game === "collect")
    b.budget = collectDistance(b) + Math.max(2, 8 - level);
  return b;
}
export const start = (b: Board): State => ({
  pos: b.start,
  boxes: [...b.boxes],
  jewels: 0,
  count: 0,
  moves: 0,
  respawn: b.start,
  result: "play",
  note: "",
});
export function move(b: Board, s: State, d: Direction, jump = false): State {
  if (s.result !== "play") return s;
  if (b.game === "play") {
    const correct = b.sequence[s.count] === d,
      count = s.count + Number(correct);
    return {
      ...s,
      count,
      pos: nextCell(b, b.start, d),
      moves: s.moves + 1,
      result: !correct ? "lost" : count === b.sequence.length ? "won" : "play",
      note: correct ? "Đúng nhịp!" : "Buddy vừa chọn một hướng khác.",
    };
  }
  const n = nextCell(b, s.pos, d, b.game === "parkour" && jump ? 2 : 1);
  if (!walk(b, n)) {
    if (b.game === "parkour")
      return {
        ...s,
        pos: s.respawn,
        moves: s.moves + 1,
        note: "Trượt chân! Bạn đã trở về bệ nghỉ.",
      };
    return { ...s, note: "Lối này có vách chắn." };
  }
  let boxes = s.boxes;
  const index = boxes.indexOf(n);
  if (index >= 0) {
    const dest = nextCell(b, n, d);
    if (!walk(b, dest) || boxes.includes(dest))
      return { ...s, note: "Thùng cần một ô trống phía sau." };
    boxes = [...boxes];
    boxes[index] = dest;
  }
  const gem = b.gems.indexOf(n),
    jewels = gem < 0 ? s.jewels : s.jewels | (1 << gem);
  const won =
    b.game === "puzzle"
      ? boxes.every((x) => b.goals.includes(x))
      : n === b.exit && collected(jewels) === b.gems.length;
  const moves = s.moves + 1,
    lost = b.game === "collect" && moves >= b.budget && !won;
  return {
    ...s,
    boxes,
    jewels,
    moves,
    pos: n,
    respawn: b.cells[n] === "C" ? n : s.respawn,
    result: won ? "won" : lost ? "lost" : "play",
    note: lost
      ? "Đã dùng hết số bước. Hãy tìm lối ngắn hơn."
      : b.cells[n] === "C"
        ? "Đã tới bệ nghỉ."
        : gem >= 0 && !held(s.jewels, gem)
          ? "Đã nhặt vật phẩm!"
          : n === b.exit && !won
            ? "Cổng chờ đủ vật phẩm."
            : "",
  };
}

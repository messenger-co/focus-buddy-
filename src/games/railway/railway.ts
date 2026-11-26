// Các hướng tăng dần theo chiều kim đồng hồ, bắt đầu ở hướng bắc.
export const directions = ["Bắc", "Đông", "Nam", "Tây"] as const;
const dx = [0, 1, 0, -1],
  dy = [-1, 0, 1, 0];
export const routes = [
  {
    name: "Bến đầu làng",
    width: 4,
    height: 3,
    row: 1,
    steps: "ENESE",
    lanterns: 1,
  },
  {
    name: "Đồng đom đóm",
    width: 4,
    height: 4,
    row: 0,
    steps: "ESSENESS",
    lanterns: 2,
  },
  {
    name: "Vòng quanh ao sen",
    width: 5,
    height: 4,
    row: 2,
    steps: "NEESSENNE",
    lanterns: 2,
  },
  {
    name: "Đèo trăng khuyết",
    width: 5,
    height: 4,
    row: 0,
    steps: "EEESWWSSEENE",
    lanterns: 3,
  },
  {
    name: "Qua hai thung lũng",
    width: 6,
    height: 5,
    row: 3,
    steps: "ENNEENESSWSESE",
    lanterns: 3,
  },
  {
    name: "Ga Ngân Hà",
    width: 6,
    height: 5,
    row: 4,
    steps: "NNNESENNEESWSESWSEE",
    lanterns: 4,
  },
  {
    name: "Cầu gỗ rừng thông",
    width: 6,
    height: 5,
    row: 1,
    steps: "EESSEENNE",
    lanterns: 3,
  },
  {
    name: "Đồi hoa hướng dương",
    width: 6,
    height: 5,
    row: 0,
    steps: "ESSSENNEESSE",
    lanterns: 4,
  },
  {
    name: "Bến cảng sương mai",
    width: 7,
    height: 5,
    row: 2,
    steps: "NEESSEENNNESSE",
    lanterns: 4,
  },
  {
    name: "Hành trình sao chổi",
    width: 7,
    height: 6,
    row: 5,
    steps: "NNENNEESSSEENNNE",
    lanterns: 5,
  },
] as const;

export type Tile = "straight" | "curve" | "trees" | "pond";
export type Board = {
  width: number;
  height: number;
  start: number;
  exit: number;
  tiles: Tile[];
  initial: number[];
  lanterns: number[];
};
export function neighbor(
  cell: number,
  direction: number,
  width: number,
  height: number,
) {
  const x = (cell % width) + dx[direction],
    y = Math.floor(cell / width) + dy[direction];
  return x < 0 || x >= width || y < 0 || y >= height ? -1 : y * width + x;
}
export function sockets(tile: Tile, turn: number): number[] {
  if (tile === "straight") return [turn % 2, (turn % 2) + 2];
  if (tile === "curve") return [turn % 4, (turn + 1) % 4];
  return [];
}
export function makeBoard(level: number): Board {
  const route = routes[level];
  const { width, height, row } = route;
  const start = row * width;
  const tiles: Tile[] = Array.from(
    { length: width * height },
    (_, i) => ["trees", "pond", "trees", "curve"][(i * 3 + level) % 4] as Tile,
  );
  const initial = tiles.map((_, i) => (i + level) % 4);
  const path = [start];
  const turns = [...route.steps].map((s) => "NESW".indexOf(s));
  let cell = start,
    incoming = 3;
  for (const [i, outgoing] of [...turns, 1].entries()) {
    const shape = incoming === (outgoing + 2) % 4 ? "straight" : "curve";
    tiles[cell] = shape;
    const correct = [0, 1, 2, 3].find((turn) => {
      const ends = sockets(shape, turn);
      return ends.includes(incoming) && ends.includes(outgoing);
    })!;
    const change = i === 0 ? 1 : (i * i + 3 * level + (i % 3)) % 4;
    initial[cell] = (correct + change) % (shape === "straight" ? 2 : 4);
    if (i < turns.length) {
      cell = neighbor(cell, outgoing, width, height);
      path.push(cell);
      incoming = (outgoing + 2) % 4;
    }
  }
  const lanterns = Array.from(
    { length: route.lanterns },
    (_, i) =>
      path[Math.floor(((i + 1) * (path.length - 1)) / (route.lanterns + 1))],
  );
  return { width, height, start, exit: cell, tiles, initial, lanterns };
}

export type Journey = {
  path: number[];
  stop: "arrived" | "gap" | "loop" | "missed";
  fault: number;
};
export function followRails(board: Board, turns: readonly number[]): Journey {
  const path: number[] = [],
    seen = new Set<number>();
  let cell = board.start,
    incoming = 3;
  while (!seen.has(cell)) {
    const ends = sockets(board.tiles[cell], turns[cell]);
    if (!ends.includes(incoming))
      return {
        path,
        stop: "gap",
        fault: ends.length ? cell : (path.at(-1) ?? cell),
      };
    seen.add(cell);
    path.push(cell);
    const outgoing = ends.find((direction) => direction !== incoming)!;
    if (cell === board.exit && outgoing === 1) {
      const missed = board.lanterns.find((tile) => !seen.has(tile));
      return {
        path,
        stop: missed === undefined ? "arrived" : "missed",
        fault: missed ?? -1,
      };
    }
    const next = neighbor(cell, outgoing, board.width, board.height);
    if (next < 0) return { path, stop: "gap", fault: cell };
    cell = next;
    incoming = (outgoing + 2) % 4;
  }
  return { path, stop: "loop", fault: cell };
}

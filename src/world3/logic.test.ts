import { describe, expect, it } from "vitest";
import {
  directions,
  makeBoard,
  move,
  start,
  worlds,
  type Direction,
  type Board,
} from "./logic";
// Tìm đường bằng đúng thao tác của người chơi, kể cả khi phải đẩy thùng.
function solution(b: Board) {
  if (b.game === "play") return b.sequence.map((d) => [d, false] as const);
  const queue = [
      { s: start(b), previous: -1, d: "up" as Direction, jump: false },
    ],
    seen = new Set<string>();
  for (let i = 0; i < queue.length; i++) {
    const { s } = queue[i];
    if (s.result === "won") {
      const path: [Direction, boolean][] = [];
      while (queue[i].previous >= 0) {
        path.push([queue[i].d, queue[i].jump]);
        i = queue[i].previous;
      }
      return path.reverse();
    }
    for (const d of directions)
      for (const jump of b.game === "parkour" ? [false, true] : [false]) {
        const n = move(b, s, d, jump);
        const key = [
          n.pos,
          n.jewels,
          ...[...n.boxes].sort((a, c) => a - c),
        ].join("/");
        if (n.result !== "lost" && !seen.has(key)) {
          seen.add(key);
          queue.push({ s: n, previous: i, d, jump });
        }
      }
  }
  return [];
}
describe("Các thế giới thu nhỏ", () => {
  for (const { id } of worlds)
    it(`chơi được cả sáu chặng ${id}`, () => {
      for (let i = 0; i < 6; i++) {
        const b = makeBoard(id, i),
          path = solution(b);
        expect(path.length).toBeGreaterThan(0);
        let s = start(b);
        for (const [d, j] of path) s = move(b, s, d, j);
        expect(s.result).toBe("won");
      }
    });
});

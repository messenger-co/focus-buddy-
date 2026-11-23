import { describe, expect, it } from "vitest";
import {
  advanceWorld,
  beatInput,
  makeWorld,
  arrows,
  vectors,
  cols,
  rows,
  dropDuration,
  starCatchProgress,
  catchTimeLimit,
  maxDanceMisses,
  type Arrow,
} from "./motion";
describe("Điều khiển trong câu lạc bộ", () => {
  for (const id of ["duong-chay", "hung-sao", "vu-dieu", "ran-vuon"] as const)
    it(`có đường về đích ở sáu mức ${id}`, () => {
      for (let level = 0; level < 6; level++) {
        const w = makeWorld(id, level);
        for (let frame = 0; !w.end && frame < 12000; frame++) {
          if (
            w.id === "duong-chay" &&
            w.rocks[w.passed] - w.distance < w.speed * 0.44
          )
            beatInput(w, "jump");
          if (w.id === "hung-sao" && w.items.length) {
            const d = w.items[0];
            beatInput(w, d.kind === "storm" ? (d.lane + 1) % 4 : d.lane);
          }
          if (
            w.id === "vu-dieu" &&
            w.notes[w.index] &&
            w.t >= w.notes[w.index].at
          )
            beatInput(w, w.notes[w.index].dir);
          if (w.id === "ran-vuon") {
            const q: { cell: number; first: Arrow | null }[] = [
                { cell: w.body[0], first: null },
              ],
              seen = new Set([w.body[0]]);
            let next: Arrow | null = null;
            for (let i = 0; i < q.length && !next; i++)
              for (const dir of arrows) {
                const [dx, dy] = vectors[dir],
                  x = (q[i].cell % cols) + dx,
                  y = Math.floor(q[i].cell / cols) + dy,
                  n = y * cols + x;
                if (
                  x < 0 ||
                  x >= cols ||
                  y < 0 ||
                  y >= rows ||
                  w.stones.includes(n) ||
                  w.body.includes(n) ||
                  seen.has(n)
                )
                  continue;
                const first = q[i].first ?? dir;
                if (n === w.apple) {
                  next = first;
                  break;
                }
                seen.add(n);
                q.push({ cell: n, first });
              }
            if (next) beatInput(w, next);
            advanceWorld(w, 0.34 - level * 0.026);
            continue;
          }
          advanceWorld(w, 1 / 90);
        }
        expect(w.end).toBe("won");
      }
    });
});


describe("Friendly timing and collectible reliability", () => {
  it("collects a visible star before it reaches the last pixel of the basket", () => {
    const w = makeWorld("hung-sao", 5);
    w.lane = 2;
    w.next = 999;
    const duration = dropDuration(5);
    w.items = [{
      lane: 2, born: 0, kind: "star", resolved: false,
    }];
    advanceWorld(w, duration * (starCatchProgress + 0.01));
    expect(w.score).toBe(2);
    expect(w.items).toHaveLength(0);
    expect(w.notice).toContain("Bắt được");
  });
  it("gives players a late chance to switch lanes without awarding storm points", () => {
    const w = makeWorld("hung-sao", 4);
    w.next = 999;
    w.items = [
      { lane: 3, born: 0, kind: "moon", resolved: false },
      { lane: 2, born: 0, kind: "storm", resolved: false },
    ];
    advanceWorld(w, dropDuration(4) * 0.81);
    expect(w.score).toBe(0);
    beatInput(w, 3);
    advanceWorld(w, 0.12);
    expect(w.score).toBe(3);
    expect(w.hearts).toBe(4);
    advanceWorld(w, 0.5);
    expect(w.hearts).toBe(4);
  });
  it("gives slower drops and more time for high-level star catching", () => {
    expect(dropDuration(5)).toBeGreaterThan(2);
    expect(catchTimeLimit(5)).toBeGreaterThan(45);
    expect(makeWorld("hung-sao", 5)).toMatchObject({ hearts: 4, goal: 20 });
    expect(maxDanceMisses).toBe(4);
    expect(makeWorld("vu-dieu", 5).goal).toBeGreaterThan(8);
  });
});

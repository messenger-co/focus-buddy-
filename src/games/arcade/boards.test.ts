import { describe, expect, it, vi } from "vitest";
import { paintBoard } from "./boardArt";
import {
  boards,
  bitCount,
  moveBoard,
  startBoard,
  tickBoard,
  undoSlide,
  type Direction,
} from "./boards";

const key: Record<string, Direction> = {
  u: "up",
  l: "left",
  d: "down",
  r: "right",
};
// Mỗi ký tự là một phím; w giữ nguyên vị trí trong một nhịp bè trôi.
const raftRoutes = [
  "ululluuuwddururr",
  "ulwluuururrulllll",
  "ullwuwwluruururdrruu",
  "uulllwwwduuurrrurwwwuruullldul",
  "rrwuuwudrruuululluluurrr",
  "uulwwurudddurllulruuuruuulldul",
];
const iceRoutes = [
  "lur",
  "ururd",
  "luruldr",
  "drulurdul",
  "ldlurduldrdr",
  "drdrduldlururur",
];

describe("Hai chuyến đi mới", () => {
  for (const [i, b] of boards.ice.entries()) {
    it(`thu đủ pha lê và đến cổng đúng số lượt ở ${b.title}`, () => {
      const r = startBoard(b);
      for (const k of iceRoutes[i]) {
        expect(moveBoard(b, r, key[k])).toBe(true);
        while (r.motion) tickBoard(b, r, 1 / 90);
      }
      expect(r.won).toBe(true);
      expect(r.moves).toBe(b.target);
      expect(bitCount(r.mask)).toBe(b.gems.length);
    });
  }
  for (const [i, b] of boards.river.entries()) {
    it(`đủ đường nhặt mọi đèn hoa và qua suối ở ${b.title}`, () => {
      const r = startBoard(b);
      for (const k of raftRoutes[i]) {
        if (k !== "w") moveBoard(b, r, key[k]);
        for (let step = 0; step < 16; step++) tickBoard(b, r, 0.016);
      }
      expect(r.won).toBe(true);
      expect(r.falls).toBe(0);
      expect(bitCount(r.mask)).toBe(b.gems.length);
      expect(r.flag.y).toBeLessThan(b.start.y);
    });
  }
  it("lùi lượt trượt trả lại cả vị trí, pha lê và số bước", () => {
    const b = boards.ice[0],
      r = startBoard(b);
    moveBoard(b, r, "left");
    while (r.motion) tickBoard(b, r, 0.016);
    const before = { x: r.x, y: r.y, mask: r.mask, moves: r.moves };
    moveBoard(b, r, "up");
    while (r.motion) tickBoard(b, r, 0.016);
    expect(r.mask).not.toBe(before.mask);
    expect(undoSlide(r)).toBe(true);
    expect(r).toMatchObject(before);
  });
  it("cổng sông đợi đủ đèn và bè chở bạn nhỏ khi đứng yên", () => {
    const b = boards.river[0],
      r = startBoard(b);
    Object.assign(r, { x: b.exit.x - 1, y: b.exit.y });
    moveBoard(b, r, "right");
    while (r.motion) tickBoard(b, r, 0.016);
    expect(r.won).toBe(false);
    expect(r.notice).toContain("thiếu");
    Object.assign(r, { x: 1, y: 1 });
    tickBoard(b, r, 0.1);
    expect(r.x).toBeCloseTo(1 + b.speeds[1] * 0.1);
    Object.assign(r, { x: -0.44, mask: 1, flag: { x: 3, y: 3 } });
    tickBoard(b, r, 0.1);
    expect(r).toMatchObject({ x: 3, y: 3, mask: 1, falls: 1 });
  });
});

it("chờ khung đủ rộng để vẽ lại khi đổi trang hoặc xoay màn hình", () => {
  const board = boards.river[0];
  const canvas = document.createElement("canvas");
  const sprite = document.createElement("div");
  const setTransform = vi.fn();
  const brush = { setTransform } as unknown as CanvasRenderingContext2D;
  for (const view of [{ w: 1, h: 1 }, { w: 10, h: 320 }, { w: 390, h: 12 }]) {
    paintBoard(canvas, brush, sprite, view, board, startBoard(board), true);
    paintBoard(canvas, brush, sprite, view, board, startBoard(board), true, true);
  }
  expect(setTransform).not.toHaveBeenCalled();
});

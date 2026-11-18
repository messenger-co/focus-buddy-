import { describe, expect, it } from "vitest";
import { courses, HEIGHT } from "./courses";
import { advance, islandX, newRun, STEP, stormY } from "./simulation";

const idle = { direction: 0, jump: false, lift: false };

// Mỗi mốc là một lần nhấn nhảy trên đường chạy sang phải, tính từ đầu chặng.
const jumpRoutes = [
  [128, 262, 397, 815, 1123, 1302],
  [378, 532, 671, 826, 1104, 1532],
  [212, 376, 1048, 1351, 1495],
];

describe("Các chặng phiêu lưu", () => {
  courses.jump.forEach((course, index) => {
    it(`có thể chạy và nhảy đến cổng ở ${course.title}`, () => {
      const run = newRun(course);
      let nextJump = 0;
      const events = new Set<string>();
      for (let step = 0; step < 1500 && !run.finished; step++) {
        const jump = run.x >= jumpRoutes[index][nextJump];
        if (jump) nextJump++;
        for (const event of advance(course, run, {
          ...idle,
          direction: 1,
          jump,
        }))
          events.add(event);
      }
      expect(run.finished).toBe(true);
      expect(run.returns).toBe(0);
      expect([...events]).toEqual(
        expect.arrayContaining(["flag", "pickup", "spring", "win"]),
      );
      expect(advance(course, run, idle)).toEqual([]);
    });
  });

  for (const course of courses.glide) {
    it(`có thể lượn qua mọi vòng sáng ở ${course.title}`, () => {
      const run = newRun(course);
      const path = [{ x: run.x, y: run.y - 16 }, ...course.gems];
      let ring = 1;
      for (let step = 0; step < 2500 && !run.finished; step++) {
        const ahead = run.x + 18;
        while (ring < path.length - 1 && ahead > path[ring].x) ring++;
        const from = path[ring - 1],
          to = path[ring];
        const ratio = Math.min(1, (ahead - from.x) / (to.x - from.x));
        const target = from.y + (to.y - from.y) * ratio + 16;
        advance(course, run, { ...idle, lift: run.y + run.vy * 0.22 > target });
      }
      expect(run.finished).toBe(true);
      expect(run.collected.size).toBe(course.gems.length);
      expect(run.flagged).toBe(true);
      expect(run.returns).toBe(0);
    });
  }
});

describe("Điều khiển và va chạm", () => {
  it("cho nhảy hai lần trên không và nạp lại khi chạm đất", () => {
    const course = courses.jump[0],
      run = newRun(course);
    const jump = () => advance(course, run, { ...idle, jump: true });
    expect(jump()).toContain("jump");
    for (let i = 0; i < 15; i++) advance(course, run, idle);
    expect(jump()).toContain("jump");
    expect(jump()).not.toContain("jump");
    for (let i = 0; i < 180 && run.ground === null; i++)
      advance(course, run, idle);
    expect(run.ground).toBe(0);
    expect(jump()).toContain("jump");
  });

  it("đảo trôi mang bạn nhỏ theo, nấm bật ngay khi chạm mũ", () => {
    const c = courses.jump[0],
      r = newRun(c);
    const moving = c.islands.findIndex((i) => i.drift !== undefined),
      island = c.islands[moving];
    Object.assign(r, {
      x: islandX(island, 0) + 25,
      y: island.y,
      ground: moving,
    });
    for (let i = 0; i < 30; i++) advance(c, r, idle);
    expect(r.x - islandX(island, r.time)).toBeCloseTo(25);
    const spring = c.islands.find((i) => i.spring !== undefined)!;
    Object.assign(r, {
      x: spring.x + spring.spring!,
      y: spring.y - 18,
      vy: 140,
      ground: null,
    });
    expect(advance(c, r, idle)).toContain("spring");
    expect(r.y).toBeLessThan(spring.y);
    expect(r.vy).toBeLessThan(-300);
  });

  it("giữ tinh thể và hồi sinh ở cờ khi chạm gai, ván mới bắt đầu lại", () => {
    const c = courses.jump[0],
      r = newRun(c);
    Object.assign(r, { x: c.gems[0].x, y: c.gems[0].y + 16, ground: null });
    expect(advance(c, r, idle)).toContain("pickup");
    expect(advance(c, r, idle)).not.toContain("pickup");
    Object.assign(r, c.checkpoint, { ground: null, vy: 0 });
    expect(advance(c, r, idle)).toContain("flag");
    const hazard = c.islands.find((i) => i.thorns !== undefined)!;
    Object.assign(r, {
      x: hazard.x + hazard.thorns!,
      y: hazard.y,
      ground: null,
    });
    expect(advance(c, r, idle)).toContain("fall");
    expect(r.x).toBe(c.checkpoint.x);
    expect(r.collected.size).toBe(1);
    expect(newRun(c).collected.size).toBe(0);
  });

  it("phải hạ cánh ở cổng mới về đích", () => {
    const c = courses.jump[0],
      r = newRun(c);
    const last = c.islands.at(-1)!;
    Object.assign(r, { x: c.goal, y: last.y - 30, ground: null });
    expect(advance(c, r, idle)).not.toContain("win");
    for (let i = 0; i < 90 && !r.finished; i++) advance(c, r, idle);
    expect(r.finished).toBe(true);
  });

  it.each([true, false])(
    "giữ một độ điều khiển bay (giữ = %s) sẽ phải thử lại",
    (lift) => {
      const c = courses.glide[0],
        r = newRun(c);
      for (let i = 0; i < 200 && !r.returns; i++)
        advance(c, r, { ...idle, lift });
      expect(r.returns).toBe(1);
      expect(r.x).toBe(newRun(c).x);
      expect(r.finished).toBe(false);
    },
  );

  it("chạm mây giông sau cờ thì tiếp tục từ giữa chặng", () => {
    const c = courses.glide[0],
      r = newRun(c);
    Object.assign(r, { x: c.checkpoint.x, y: HEIGHT / 2 });
    expect(advance(c, r, idle)).toContain("flag");
    const cloud = c.storms.find((s) => s.x > c.checkpoint.x)!;
    Object.assign(r, {
      x: cloud.x,
      y: stormY(cloud.y, cloud.x, r.time + STEP) + 15,
    });
    expect(advance(c, r, idle)).toContain("fall");
    expect(r.x).toBe(c.checkpoint.x);
  });
});

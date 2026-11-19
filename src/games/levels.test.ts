import { describe, expect, it, vi } from "vitest";
import { levelKey, readScore, recordScore, LEVELS } from "./levels";
import { courses } from "./arcade/courses";
import { boards } from "./arcade/boards";
import { quickTitles, numberTrail, numberPuzzle, wordSets } from "./puzzles";

describe("Các chặng và tiến trình đã lưu", () => {
  it("cả chín trò đều có sáu chặng riêng", () => {
    const shelves = [
      ...Object.values(courses),
      ...Object.values(boards),
      ...Object.values(quickTitles),
    ];
    expect(shelves).toHaveLength(9);
    for (const shelf of shelves) expect(shelf).toHaveLength(LEVELS);
    for (const [level, words] of wordSets.entries()) {
      expect(words.length).toBeGreaterThanOrEqual(3);
      const trail = numberTrail(level);
      expect(new Set(trail).size).toBe(trail.length);
      for (let round = 0; round < 5; round++) {
        const p = numberPuzzle(round, level);
        expect(p.options).toContain(p.answer);
        expect(new Set(p.options).size).toBe(4);
      }
    }
  });
  it("hiện đủ số để phân biệt bước tăng dần với dãy cộng hai số liền trước", () => {
    const random = vi.spyOn(Math, "random").mockReturnValue(0);
    try {
      expect(numberPuzzle(1, 1)).toMatchObject({
        shown: [2, 3, 5, 8, 12],
        answer: 17,
      });
      expect(numberPuzzle(0, 4)).toMatchObject({
        shown: [2, 3, 5, 8, 13],
        answer: 21,
      });
    } finally {
      random.mockRestore();
    }
  });
  it("đọc lại kỷ lục cũ và giữ kỷ lục sáu chặng tách biệt", () => {
    const old = "focus-buddy-arcade-v1/jump/grove";
    localStorage.setItem(old, JSON.stringify({ count: 4, seconds: 7 }));
    expect(readScore(levelKey("dao-may", 0))?.count).toBe(4);
    for (const slug of [
      "dao-may",
      "canh-luon",
      "hang-bang",
      "suoi-den-long",
      "noi-so",
    ]) {
      expect(
        new Set(Array.from({ length: 6 }, (_, i) => levelKey(slug, i))).size,
      ).toBe(6);
    }
    expect(readScore(levelKey("dao-may", 3))).toBeNull();
  });
  it("ưu tiên nhiều vật phẩm hoặc ít lượt trượt, sau đó xét thời gian", () => {
    const key = levelKey("hang-bang", 2);
    const first = { count: 2, seconds: 9, moves: 9 },
      better = { count: 2, seconds: 12, moves: 8 };
    expect(recordScore(key, first, 2)).toEqual(first);
    expect(recordScore(key, better, 2)).toEqual(better);
    expect(recordScore(key, { ...first, seconds: 5 }, 2)).toEqual(better);
    expect(recordScore(key, { ...better, seconds: 10 }, 2).seconds).toBe(10);
  });
});

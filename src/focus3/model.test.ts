import { describe, it, expect } from "vitest";
import { createDemoProgress, demoReducer, readDemoProgress } from "../state";
import {
  planFor,
  MINUTE,
  faceMs,
  elapsedMs,
  studyWeek,
  latestBreak,
  focusModes,
  presetPatchForMinutes,
  isPresetActive,
  tabTitleForFocus,
} from "./model";

const at = Date.parse("2026-11-18T15:00:00Z");
describe("Phiên học nâng cao", () => {
  it("áp dụng đúng thời lượng từng chế độ và giới hạn giá trị tùy chỉnh", () => {
    for (const m of focusModes) {
      const p = planFor(m.id, 19, 6),
        s = demoReducer(
          createDemoProgress(),
          { type: "start", id: "1", plan: p },
          at,
        ).progress.focus_sessions[0];
      expect(s.mode).toBe(m.id);
      expect((Date.parse(s.ends_at) - at) / MINUTE).toBe(
        m.id === "custom" ? 19 : m.minutes,
      );
    }
    expect(planFor("custom", -5, 1000)).toMatchObject({
      minutes: 1,
      breakMinutes: 60,
    });
  });
  it("tạm dừng qua tải lại, giữ thời gian, lưu ghi chú và chỉ cộng đúng số điểm", () => {
    let p = demoReducer(
      createDemoProgress(),
      { type: "start", id: "a", plan: planFor("quick", 20, 2, "Đọc sách") },
      at,
    ).progress;
    p = demoReducer(p, { type: "pause", id: "a" }, at + 2 * MINUTE).progress;
    p = readDemoProgress({ getItem: () => JSON.stringify(p) });
    expect(faceMs(p.focus_sessions[0], at + 12 * MINUTE)).toBe(3 * MINUTE);
    expect(() =>
      demoReducer(p, { type: "complete", id: "a" }, at + 12 * MINUTE),
    ).toThrow();
    p = demoReducer(p, { type: "resume", id: "a" }, at + 12 * MINUTE).progress;
    p = demoReducer(
      p,
      { type: "note", id: "a", text: "Đã hiểu chương 2" },
      at + 12 * MINUTE,
    ).progress;
    // Mở lại tab muộn hơn một giờ vẫn dùng giờ kết thúc thật.
    p = demoReducer(
      p,
      { type: "complete", id: "a" },
      at + 80 * MINUTE,
    ).progress;
    expect(p.profile.total_xp).toBe(12);
    expect(elapsedMs(p.focus_sessions[0])).toBe(5 * MINUTE);
    expect(p.focus_sessions[0]).toMatchObject({
      note: "Đã hiểu chương 2",
      completed_at: new Date(at + 15 * MINUTE).toISOString(),
    });
    expect(Date.parse(latestBreak(p.focus_sessions)!.break_ends_at!)).toBe(
      at + 17 * MINUTE,
    );
    expect(
      demoReducer(p, { type: "complete", id: "a" }, at + 90 * MINUTE).progress
        .profile.total_xp,
    ).toBe(12);
    expect(
      latestBreak(
        demoReducer(p, { type: "endBreak", id: "a" }, at + 80 * MINUTE).progress
          .focus_sessions,
      ),
    ).toBeUndefined();
  });
  it("bấm giờ lưu phần đã học khi kết thúc trong lúc tạm dừng, cộng thống kê theo ngày Việt Nam", () => {
    let p = demoReducer(
      createDemoProgress(),
      { type: "start", id: "1", plan: planFor("stopwatch", 0, 0) },
      at,
    ).progress;
    p = demoReducer(
      p,
      { type: "pause", id: "1" },
      at + 8 * MINUTE + 10,
    ).progress;
    p = demoReducer(
      p,
      { type: "complete", id: "1" },
      at + 15 * MINUTE,
    ).progress;
    expect(p.profile.total_xp).toBe(20);
    expect(elapsedMs(p.focus_sessions[0])).toBe(8 * MINUTE + 10);
    expect(studyWeek(p.focus_sessions, at + 15 * MINUTE)).toMatchObject({
      total: 8,
      previousTotal: 0,
      delta: 8,
      trend: "up",
      streak: 1,
    });
    expect(latestBreak(p.focus_sessions)).toBeUndefined();
  });

  it("so sánh xu hướng học tập tuần này với tuần trước (tăng, giảm, ổn định và bỏ qua phiên quá 14 ngày)", () => {
    const DAY = 86_400_000;
    const makeDone = (id: string, daysAgo: number, mins: number) => {
      const start = at - daysAgo * DAY;
      const end = start + mins * MINUTE;
      return {
        id,
        started_at: new Date(start).toISOString(),
        ends_at: new Date(end).toISOString(),
        completed_at: new Date(end).toISOString(),
        status: "completed" as const,
        minutes: mins,
        mode: "classic" as const,
        paused_ms: 0,
      };
    };

    // No sessions -> flat baseline
    expect(studyWeek([], at)).toMatchObject({
      total: 0,
      previousTotal: 0,
      delta: 0,
      trend: "flat",
    });

    // Current week (50 min) > previous week (20 min), ignoring a 60-min session from 15 days ago
    const upSessions = [
      makeDone("c1", 0, 25),
      makeDone("c2", 3, 25),
      makeDone("p1", 7, 20),
      makeDone("old", 15, 60),
    ];
    expect(studyWeek(upSessions, at)).toMatchObject({
      total: 50,
      previousTotal: 20,
      delta: 30,
      trend: "up",
    });

    // Current week (15 min) < previous week (45 min)
    const downSessions = [
      makeDone("c1", 1, 15),
      makeDone("p1", 8, 25),
      makeDone("p2", 13, 20),
    ];
    expect(studyWeek(downSessions, at)).toMatchObject({
      total: 15,
      previousTotal: 45,
      delta: -30,
      trend: "down",
    });

    // Equal non-zero weeks (30 min vs 30 min) -> flat
    const flatSessions = [makeDone("c1", 2, 30), makeDone("p1", 10, 30)];
    expect(studyWeek(flatSessions, at)).toMatchObject({
      total: 30,
      previousTotal: 30,
      delta: 0,
      trend: "flat",
    });
  });

  it("ánh xạ đúng các mức thời lượng nhanh sang chế độ chuẩn và cập nhật tiêu đề tab trình duyệt", () => {
    expect(presetPatchForMinutes(15)).toEqual({ mode: "custom", custom: 15 });
    expect(presetPatchForMinutes(20)).toEqual({ mode: "classic" });
    expect(presetPatchForMinutes(25)).toEqual({ mode: "pomodoro" });
    expect(presetPatchForMinutes(45)).toEqual({ mode: "deep" });
    expect(presetPatchForMinutes(60)).toEqual({ mode: "long" });

    for (const mins of [15, 20, 25, 45, 60]) {
      const patch = presetPatchForMinutes(mins);
      const p = planFor(patch.mode, patch.custom ?? 20);
      expect(p.minutes).toBe(mins);
      expect(isPresetActive(patch.mode, patch.custom ?? 20, mins)).toBe(true);
    }

    expect(
      tabTitleForFocus({
        page: "Góc của bạn",
        active: { mode: "pomodoro", paused_at: null },
        remaining: 12 * MINUTE + 5_000,
        restLeft: 0,
      }),
    ).toBe("12:05 · Đang tập trung · Focus Buddy");
    expect(
      tabTitleForFocus({
        page: "Góc của bạn",
        active: { mode: "classic", paused_at: "2026-11-18T15:05:00Z" },
        remaining: 10 * MINUTE,
        restLeft: 0,
        english: true,
      }),
    ).toBe("10:00 · Paused · Focus Buddy");
    expect(
      tabTitleForFocus({
        page: "Giờ tập trung",
        remaining: 0,
        restLeft: 3 * MINUTE + 40_000,
      }),
    ).toBe("03:40 · Giờ nghỉ · Focus Buddy");
    expect(
      tabTitleForFocus({
        page: "Góc của bạn",
        remaining: 0,
        restLeft: 0,
      }),
    ).toBe("Góc của bạn · Focus Buddy");
  });
});

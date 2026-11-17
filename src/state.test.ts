import { beforeEach, describe, expect, it } from "vitest";
import {
  createDemoProgress,
  demoReducer,
  DEMO_STORAGE_KEY,
  FOCUS_DURATION_MS,
  readDemoProgress,
  vietnamDay,
} from "./state";

describe("Tiến trình dùng thử", () => {
  beforeEach(() => localStorage.clear());

  it("không cấp điểm tập trung trước 20 phút và chỉ thưởng một lần", () => {
    const now = Date.parse("2026-11-17T10:00:00Z");
    let progress = demoReducer(
      createDemoProgress(),
      { type: "start", id: "focus-a" },
      now,
    ).progress;
    expect(() =>
      demoReducer(
        progress,
        { type: "complete", id: "focus-a" },
        now + FOCUS_DURATION_MS - 1,
      ),
    ).toThrow("chưa đủ 20 phút");
    progress = demoReducer(
      progress,
      { type: "complete", id: "focus-a" },
      now + FOCUS_DURATION_MS,
    ).progress;
    expect(progress.profile.total_xp).toBe(50);
    progress = demoReducer(
      progress,
      { type: "complete", id: "focus-a" },
      now + FOCUS_DURATION_MS + 1000,
    ).progress;
    expect(progress.profile.total_xp).toBe(50);
    expect(progress.counts?.focus).toBe(1);
  });

  it("giữ đúng thời điểm kết thúc khi mở lại trang và không tạo hai phiên cùng lúc", () => {
    const now = Date.parse("2026-11-17T10:00:00Z");
    const first = demoReducer(
      createDemoProgress(),
      { type: "start", id: "focus-a" },
      now,
    ).progress;
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(first));
    const reopened = readDemoProgress();
    expect(Date.parse(reopened.focus_sessions[0].ends_at)).toBe(
      now + FOCUS_DURATION_MS,
    );
    const second = demoReducer(
      reopened,
      { type: "start", id: "focus-b" },
      now + 90_000,
    ).progress;
    expect(second.focus_sessions).toHaveLength(1);
    expect(second.focus_sessions[0].id).toBe("focus-a");
  });

  it("phiên kết thúc sớm không được nhận điểm", () => {
    const start = demoReducer(
      createDemoProgress(),
      { type: "start", id: "focus-a" },
      0,
    ).progress;
    const cancelled = demoReducer(
      start,
      { type: "cancel", id: "focus-a" },
      1000,
    ).progress;
    expect(() =>
      demoReducer(
        cancelled,
        { type: "complete", id: "focus-a" },
        FOCUS_DURATION_MS,
      ),
    ).toThrow("kết thúc sớm");
    expect(cancelled.profile.total_xp).toBe(0);
  });

  it("chấm bài đúng và không thưởng lại bài đã hoàn thành", () => {
    let response = demoReducer(createDemoProgress(), {
      type: "exercise",
      id: "logic-1",
      answer: 0,
    });
    expect(response.result).toMatchObject({ correct: false, awarded_xp: 0 });
    response = demoReducer(response.progress, {
      type: "exercise",
      id: "logic-1",
      answer: 2,
    });
    expect(response.result).toMatchObject({ correct: true, awarded_xp: 30 });
    response = demoReducer(response.progress, {
      type: "exercise",
      id: "logic-1",
      answer: 2,
    });
    expect(response.result).toMatchObject({ correct: true, awarded_xp: 0 });
    expect(response.progress.profile.total_xp).toBe(30);
  });

  it("điểm danh dùng ngày Việt Nam và chỉ thưởng một lần mỗi ngày", () => {
    const beforeMidnight = Date.parse("2026-11-17T16:59:59Z");
    const midnight = beforeMidnight + 1000;
    expect(vietnamDay(beforeMidnight)).toBe("2026-11-17");
    expect(vietnamDay(midnight)).toBe("2026-11-18");
    let progress = demoReducer(
      createDemoProgress(),
      { type: "checkin", mood: "great" },
      beforeMidnight,
    ).progress;
    progress = demoReducer(
      progress,
      { type: "checkin", mood: "okay" },
      beforeMidnight,
    ).progress;
    expect(progress.profile.total_xp).toBe(10);
    progress = demoReducer(
      progress,
      { type: "checkin", mood: "tired" },
      midnight,
    ).progress;
    expect(progress.profile.total_xp).toBe(20);
    expect(progress.check_ins).toHaveLength(2);
  });

  it("dữ liệu cục bộ hỏng hoặc bị chặn không làm ứng dụng ngừng chạy", () => {
    localStorage.setItem(DEMO_STORAGE_KEY, "{invalid");
    expect(readDemoProgress().profile.total_xp).toBe(0);
    expect(
      readDemoProgress({
        getItem: () => {
          throw new Error("blocked");
        },
      }).focus_sessions,
    ).toEqual([]);
    localStorage.setItem(
      DEMO_STORAGE_KEY,
      JSON.stringify({ profile: { total_xp: 100 } }),
    );
    expect(readDemoProgress().profile.total_xp).toBe(0);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";

const cloud = vi.hoisted(() => ({
  session: null as null | {
    access_token: string;
    user: { id: string; email: string };
  },
  onAuth: null as null | ((event: string, session: unknown) => void),
  rpc: vi.fn(() => {
    throw new Error("Không được gọi cơ sở dữ liệu");
  }),
  from: vi.fn(() => {
    throw new Error("Không được đọc bảng");
  }),
}));
vi.mock("./cloud", () => ({
  apiConfigured: true,
  cloudConfigured: true,
  authRedirectUrl: () => "https://example.github.io/focus-buddy-/",
  friendlyError: (error: unknown, fallback: string) =>
    error instanceof Error ? error : new Error(fallback),
  supabase: {
    rpc: cloud.rpc,
    from: cloud.from,
    auth: {
      getSession: async () => ({
        data: { session: cloud.session },
        error: null,
      }),
      onAuthStateChange: (
        callback: (event: string, session: unknown) => void,
      ) => {
        cloud.onAuth = callback;
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                cloud.onAuth = null;
              },
            },
          },
        };
      },
      signOut: async () => ({ error: null }),
      signInWithOtp: async () => ({ error: null }),
    },
  },
}));
afterEach(() => {
  cleanup();
  cloud.session = null;
  cloud.onAuth = null;
  vi.clearAllMocks();
});
import {
  createDemoProgress,
  demoReducer,
  DEMO_STORAGE_KEY,
  FOCUS_DURATION_MS,
  readDemoProgress,
  vietnamDay,
  useBuddy,
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

  it("thói quen hằng ngày thưởng +5 điểm mỗi mục một lần/ngày và không cộng trùng khi bật tắt lại", () => {
    const day1 = Date.parse("2026-11-17T10:00:00Z");
    const day2 = Date.parse("2026-11-18T10:00:00Z");
    const first = demoReducer(createDemoProgress(), { type: "habit", id: "water" }, day1);
    expect(first.result).toMatchObject({ awarded_xp: 5, total_xp: 5 });
    expect(first.progress.daily_habits?.[vietnamDay(day1)]).toEqual(["water"]);
    // Toggle off -> keeps XP, removes checkmark
    const off = demoReducer(first.progress, { type: "habit", id: "water" }, day1);
    expect(off.result).toMatchObject({ awarded_xp: 0, total_xp: 5 });
    expect(off.progress.daily_habits?.[vietnamDay(day1)]).toBeUndefined();
    // Toggle back on same day -> no duplicate XP farming
    const reOn = demoReducer(off.progress, { type: "habit", id: "water" }, day1);
    expect(reOn.result).toMatchObject({ awarded_xp: 0, total_xp: 5 });
    expect(reOn.progress.daily_habits?.[vietnamDay(day1)]).toEqual(["water"]);
    // Another habit same day -> +5 XP
    const secondHabit = demoReducer(reOn.progress, { type: "habit", id: "stretch" }, day1);
    expect(secondHabit.result).toMatchObject({ awarded_xp: 5, total_xp: 10 });
    // Next Vietnam day -> resets and awards +5 XP again
    const nextDay = demoReducer(secondHabit.progress, { type: "habit", id: "water" }, day2);
    expect(nextDay.result).toMatchObject({ awarded_xp: 5, total_xp: 15 });
    // Invalid habit throws
    expect(() =>
      demoReducer(nextDay.progress, { type: "habit", id: "unknown" }, day2),
    ).toThrow("Thói quen không hợp lệ");
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

describe("Tiến trình trên thiết bị và tùy chỉnh bạn nhỏ", () => {
  beforeEach(() => localStorage.clear());

  it("nâng cấp bản lưu cũ và bỏ dữ liệu bảng xếp hạng mà giữ nguyên điểm", () => {
    const legacy = demoReducer(createDemoProgress(), {
      type: "exercise",
      id: "logic-1",
      answer: 2,
    }).progress;
    const profile = legacy.profile as unknown as Record<string, unknown>;
    delete profile.buddy_name;
    delete profile.accessory;
    delete profile.scene;
    delete profile.theme;
    profile.leaderboard_opt_in = true;
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(legacy));
    const migrated = readDemoProgress();
    expect(migrated.profile).toMatchObject({
      total_xp: 30,
      buddy_name: "",
      accessory: "none",
      scene: "garden",
      theme: "meadow",
    });
    expect(migrated.profile).not.toHaveProperty("leaderboard_opt_in");
    expect(migrated.completed_exercises).toEqual(["logic-1"]);
  });

  it("lưu nhân vật, màu, tên, phụ kiện và cảnh nền mới", () => {
    const initial = createDemoProgress();
    const preferences = {
      ...initial.profile,
      companion: "axolotl" as const,
      color: "sky" as const,
      buddy_name: "  Rồng Bông  ",
      accessory: "satchel" as const,
      theme: "tide" as const,
      scene: "space" as const,
      total_xp: 9999,
    };
    const result = demoReducer(initial, { type: "preferences", preferences });
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(result.progress));
    expect(readDemoProgress().profile).toMatchObject({
      companion: "axolotl",
      color: "sky",
      buddy_name: "Rồng Bông",
      accessory: "satchel",
      theme: "tide",
      scene: "space",
      total_xp: 0,
    });
    expect(() =>
      demoReducer(initial, {
        type: "preferences",
        preferences: { ...preferences, buddy_name: "x".repeat(25) },
      }),
    ).toThrow("24 ký tự");
  });

  it("giữ tiến trình khi đăng nhập, làm bài, đăng xuất và đổi tài khoản; không gọi DB", async () => {
    const old = demoReducer(createDemoProgress(), {
      type: "exercise",
      id: "logic-1",
      answer: 2,
    }).progress;
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(old));
    cloud.session = {
      access_token: "test-token",
      user: { id: "student-a", email: "a@example.test" },
    };
    const { result } = renderHook(() => useBuddy());
    await waitFor(() => expect(result.current.mode).toBe("online"));
    expect(result.current.progress.profile.total_xp).toBe(30);
    await act(async () => {
      await result.current.checkIn("great");
    });
    expect(result.current.progress.profile.total_xp).toBe(40);
    expect(
      JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY)!).profile.total_xp,
    ).toBe(40);
    await act(async () => {
      await result.current.signOut();
    });
    expect(result.current.mode).toBe("demo");
    expect(result.current.progress.profile.total_xp).toBe(40);
    act(() =>
      cloud.onAuth?.("SIGNED_IN", {
        access_token: "other-token",
        user: { id: "student-b", email: "b@example.test" },
      }),
    );
    expect(result.current.mode).toBe("online");
    expect(result.current.progress.profile.total_xp).toBe(40);
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.progress.profile.total_xp).toBe(40);
    expect(cloud.rpc).not.toHaveBeenCalled();
    expect(cloud.from).not.toHaveBeenCalled();
    expect(result.current).not.toHaveProperty("loadLeaderboard");
  });
});

import type { FocusSession } from "../state";
export const MINUTE = 60_000;
export const focusModes = [
  { id: "classic", name: "Tập trung", minutes: 20 },
  { id: "pomodoro", name: "Pomodoro", minutes: 25 },
  { id: "deep", name: "Tập trung sâu", minutes: 45 },
  { id: "exam", name: "Ôn thi", minutes: 40 },
  { id: "reading", name: "Đọc sách", minutes: 20 },
  { id: "homework", name: "Làm bài tập", minutes: 30 },
  { id: "quick", name: "Tập trung nhanh", minutes: 5 },
  { id: "long", name: "Phiên dài", minutes: 60 },
  { id: "custom", name: "Tự chọn", minutes: 20 },
  { id: "stopwatch", name: "Bấm giờ", minutes: 0 },
] as const;
export type FocusMode = (typeof focusModes)[number]["id"];
export type FocusPlan = {
  mode: FocusMode;
  minutes: number;
  breakMinutes: number;
  goal: string;
  taskId: string;
};
export function planFor(
  mode?: string,
  customMinutes = 20,
  breakMinutes = 5,
  goal = "",
  taskId = "",
): FocusPlan {
  const m = focusModes.find((x) => x.id === mode) ?? focusModes[0];
  const bound = (n: number, min: number, max: number, fallback: number) =>
    Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
  return {
    mode: m.id,
    minutes: m.id === "custom" ? bound(customMinutes, 1, 180, 20) : m.minutes,
    breakMinutes: bound(breakMinutes, 0, 60, 5),
    goal: goal.trim().slice(0, 180),
    taskId: taskId.slice(0, 100),
  };
}
export const clockText = (ms: number, countUp = false) => {
  const s = Math.max(0, (countUp ? Math.floor : Math.ceil)(ms / 1000));
  return (
    String(Math.floor(s / 60)).padStart(2, "0") +
    ":" +
    String(s % 60).padStart(2, "0")
  );
};
export const plannedMs = (s: FocusSession) =>
  s.mode === "stopwatch" ? 0 : (s.minutes ?? 20) * MINUTE;
export function elapsedMs(s: FocusSession, now = Date.now()) {
  const end = s.paused_at ?? s.completed_at ?? s.cancelled_at;
  const value = Math.max(
    0,
    (end ? Date.parse(end) : now) -
      Date.parse(s.started_at) -
      (s.paused_ms ?? 0),
  );
  return s.mode === "stopwatch" ? value : Math.min(plannedMs(s), value);
}
export const sessionMinutes = (s: FocusSession) =>
  Math.floor(elapsedMs(s) / MINUTE);
export const studyReward = (ms: number) =>
  Math.min(50, Math.floor((Math.max(0, ms) / MINUTE) * 2.5));
export function faceMs(s: FocusSession, now: number) {
  return s.mode === "stopwatch"
    ? elapsedMs(s, now)
    : Math.max(
        0,
        Date.parse(s.ends_at) - (s.paused_at ? Date.parse(s.paused_at) : now),
      );
}
export function latestBreak(rows: FocusSession[]) {
  const s = rows[0];
  return s?.status === "completed" && s.break_ends_at && !s.break_dismissed
    ? s
    : undefined;
}
const day = (t: number) =>
  new Date(t + 7 * 60 * MINUTE).toISOString().slice(0, 10);
export type WeekTrend = "up" | "down" | "flat";
export function studyWeek(sessions: FocusSession[], now: number) {
  const totals = new Map<string, number>();
  for (const s of sessions) {
    if (s.status !== "completed") continue;
    const key = day(Date.parse(s.completed_at ?? s.ends_at));
    totals.set(key, (totals.get(key) ?? 0) + elapsedMs(s));
  }
  const days = Array.from({ length: 7 }, (_, i) => {
    const key = day(now - (6 - i) * 86400000);
    return { day: key, minutes: Math.floor((totals.get(key) ?? 0) / MINUTE) };
  });
  const total = days.reduce((s, d) => s + d.minutes, 0);
  const previousTotal = Array.from({ length: 7 }, (_, i) => {
    const key = day(now - (13 - i) * 86400000);
    return Math.floor((totals.get(key) ?? 0) / MINUTE);
  }).reduce((s, m) => s + m, 0);
  const delta = total - previousTotal;
  const trend: WeekTrend = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  let streak = 0,
    offset = totals.has(day(now)) ? 0 : 1;
  while (totals.has(day(now - offset * 86400000))) {
    streak++;
    offset++;
  }
  return { days, total, previousTotal, delta, trend, streak };
}

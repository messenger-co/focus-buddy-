import type { FocusSession } from "../state";
import { elapsedMs, MINUTE } from "../focus3/model";

export type DayPeriod = "morning" | "afternoon" | "evening" | "late";

export interface TimeContext {
  period: DayPeriod;
  eyebrow: string;
  subtitle: string;
  buddyLine: string;
}

const DAY_MS = 86_400_000;
const VN_OFFSET_MS = 7 * 60 * MINUTE;

export function vietnamHour(nowMs: number): number {
  return new Date(nowMs + VN_OFFSET_MS).getUTCHours();
}

export function vietnamDayKey(nowMs: number): string {
  return new Date(nowMs + VN_OFFSET_MS).toISOString().slice(0, 10);
}

export function timeOfDayContext(nowMs: number, english = false): TimeContext {
  const hour = vietnamHour(nowMs);
  if (hour >= 5 && hour < 12) {
    return english
      ? {
          period: "morning",
          eyebrow: "FRESH MORNING START",
          subtitle: "Kick off the day with one focused block before distractions pile up.",
          buddyLine: "Ready to tackle your top priority this morning?",
        }
      : {
          period: "morning",
          eyebrow: "BUỔI SÁNG TỈNH TÁO",
          subtitle: "Khởi động ngày mới bằng một phiên tập trung gọn gàng trước khi bận rộn.",
          buddyLine: "Sáng nay mình cùng giải quyết việc quan trọng nhất nhé!",
        };
  }
  if (hour >= 12 && hour < 18) {
    return english
      ? {
          period: "afternoon",
          eyebrow: "AFTERNOON MOMENTUM",
          subtitle: "Keep a steady rhythm — short focused blocks add up fast.",
          buddyLine: "Steady afternoon pace wins the day. I'm right here with you!",
        }
      : {
          period: "afternoon",
          eyebrow: "NHỊP HỌC BUỔI CHIỀU",
          subtitle: "Giữ nhịp độ đều đặn — từng khối thời gian nhỏ sẽ tạo ra khác biệt lớn.",
          buddyLine: "Buổi chiều giữ nhịp đều là tuyệt nhất, mình ở ngay đây!",
        };
  }
  if (hour >= 18 && hour < 22) {
    return english
      ? {
          period: "evening",
          eyebrow: "EVENING DEEP FOCUS",
          subtitle: "Wrap up today's goal cleanly so you can unwind guilt-free.",
          buddyLine: "One focused sprint tonight and we cross the finish line!",
        }
      : {
          period: "evening",
          eyebrow: "BUỔI TỐI TẬP TRUNG",
          subtitle: "Hoàn tất nốt mục tiêu hôm nay rồi nghỉ ngơi thật trọn vẹn.",
          buddyLine: "Còn một chặng nhỏ tối nay thôi, cùng về đích nhé!",
        };
  }
  return english
    ? {
        period: "late",
        eyebrow: "QUIET LATE-NIGHT DESK",
        subtitle: "Wrap up one calm session and get a good night's rest.",
        buddyLine: "It's peaceful out here — one short session, then time to rest.",
      }
    : {
        period: "late",
        eyebrow: "GÓC HỌC ĐÊM YÊN TĨNH",
        subtitle: "Hoàn thành một phiên ngắn yên tĩnh rồi nhớ nghỉ ngơi sớm giữ sức nhé.",
        buddyLine: "Đêm yên tĩnh lắm, xong phiên ngắn này mình cùng nghỉ nhé.",
      };
}

export interface HeatmapCell {
  day: string;
  shortLabel: string;
  minutes: number;
  checkedIn: boolean;
  intensity: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
}

export interface StudyHeatmap {
  cells: HeatmapCell[];
  activeDays: number;
  totalDays: number;
}

export function studyHeatmap(
  sessions: FocusSession[],
  checkIns: ReadonlyArray<{ day: string }>,
  nowMs: number,
  totalDays = 21,
): StudyHeatmap {
  const minutesByDay = new Map<string, number>();
  for (const s of sessions) {
    if (s.status !== "completed") continue;
    const stamp = Date.parse(s.completed_at ?? s.ends_at);
    if (!Number.isFinite(stamp)) continue;
    const key = vietnamDayKey(stamp);
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + elapsedMs(s));
  }
  const checkedDays = new Set(checkIns.map((c) => c.day));
  const todayKey = vietnamDayKey(nowMs);
  const cells: HeatmapCell[] = [];
  let activeDays = 0;

  for (let i = totalDays - 1; i >= 0; i--) {
    const key = vietnamDayKey(nowMs - i * DAY_MS);
    const mins = Math.floor((minutesByDay.get(key) ?? 0) / MINUTE);
    const checkedIn = checkedDays.has(key);
    let intensity: 0 | 1 | 2 | 3 | 4 = 0;
    if (mins >= 60) intensity = 4;
    else if (mins >= 30) intensity = 3;
    else if (mins >= 15) intensity = 2;
    else if (mins > 0 || checkedIn) intensity = 1;
    if (intensity > 0) activeDays++;
    const [, m, d] = key.split("-");
    cells.push({
      day: key,
      shortLabel: `${Number(d)}/${Number(m)}`,
      minutes: mins,
      checkedIn,
      intensity,
      isToday: key === todayKey,
    });
  }

  return { cells, activeDays, totalDays };
}

export interface DailySpotlight {
  id: string;
  title: string;
  summary: string;
  current: number;
  target: number;
  unit: string;
  pct: number;
  completed: boolean;
  actionLabel: string;
  actionType: "focus" | "missions" | "habits" | "mood";
}

function dayHash(dayKey: string): number {
  let h = 0;
  for (let i = 0; i < dayKey.length; i++) {
    h = (h * 31 + dayKey.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function dailySpotlight({
  dayKey,
  todayMinutes,
  dayGoal,
  habitsDone,
  exercisesDone,
  hasMoodToday,
  english = false,
}: {
  dayKey: string;
  todayMinutes: number;
  dayGoal: number;
  habitsDone: number;
  exercisesDone: number;
  hasMoodToday: boolean;
  english?: boolean;
}): DailySpotlight {
  const safeGoal = Math.max(15, dayGoal);
  const pool: Omit<DailySpotlight, "pct" | "completed">[] = [
    {
      id: "sprint-15",
      title: english ? "15-minute ignition sprint" : "Bứt phá 15 phút đầu ngày",
      summary: english
        ? "Complete 15 minutes of uninterrupted study to build momentum."
        : "Hoàn thành 15 phút tập trung trọn vẹn để bật nhịp học tập hôm nay.",
      current: Math.min(15, todayMinutes),
      target: 15,
      unit: english ? "min" : "phút",
      actionLabel: english ? "Start 15m" : "Bắt đầu 15p",
      actionType: "focus",
    },
    {
      id: "self-care-3",
      title: english ? "Triple self-care streak" : "Chăm sóc bản thân (3 thói quen)",
      summary: english
        ? "Check off 3 daily habits to stay hydrated, relaxed, and sharp."
        : "Đánh dấu 3 thói quen tốt hôm nay để giữ năng lượng và cộng thêm điểm XP.",
      current: Math.min(3, habitsDone),
      target: 3,
      unit: english ? "habits" : "thói quen",
      actionLabel: english ? "Go to habits" : "Xem thói quen",
      actionType: "habits",
    },
    {
      id: "deep-25",
      title: english ? "One full Pomodoro block" : "Chinh phục 1 phiên Pomodoro 25 phút",
      summary: english
        ? "Reach 25 focused minutes today — long enough for real flow."
        : "Đạt 25 phút tập trung trong hôm nay để vào trạng thái học sâu.",
      current: Math.min(25, todayMinutes),
      target: 25,
      unit: english ? "min" : "phút",
      actionLabel: english ? "Start 25m" : "Học ngay 25p",
      actionType: "focus",
    },
    {
      id: "daily-goal",
      title: english ? "Hit your daily study target" : "Chạm mốc mục tiêu ngày",
      summary: english
        ? `Complete your full ${safeGoal}-minute target to light up today's square.`
        : `Hoàn thành đủ ${safeGoal} phút tập trung để thắp sáng ô hoạt động hôm nay.`,
      current: Math.min(safeGoal, todayMinutes),
      target: safeGoal,
      unit: english ? "min" : "phút",
      actionLabel: english ? "Focus now" : "Vào giờ học",
      actionType: "focus",
    },
    {
      id: "exercise-spark",
      title: english ? "Sharpen your mind with a quiz" : "Luyện trí với bài tập nhanh",
      summary: english
        ? "Answer a practice question in Study Missions to earn +30 XP."
        : "Thử sức một câu hỏi tư duy trong Nhiệm vụ học tập để nhận +30 điểm.",
      current: Math.min(1, exercisesDone),
      target: 1,
      unit: english ? "quiz" : "bài",
      actionLabel: english ? "Open missions" : "Mở bài tập",
      actionType: "missions",
    },
    {
      id: "mindful-combo",
      title: english ? "Mindful study combo" : "Combo lắng nghe & tập trung",
      summary: english
        ? "Log your mood today and finish 20 minutes of focused work."
        : "Điểm danh cảm xúc hôm nay và hoàn thành tối thiểu 20 phút tập trung.",
      current: (hasMoodToday ? 1 : 0) + (todayMinutes >= 20 ? 1 : 0),
      target: 2,
      unit: english ? "steps" : "bước",
      actionLabel: hasMoodToday
        ? english
          ? "Focus 20m"
          : "Tập trung 20p"
        : english
          ? "Check in mood"
          : "Điểm danh ngay",
      actionType: hasMoodToday ? "focus" : "mood",
    },
  ];

  const chosen = pool[dayHash(dayKey) % pool.length];
  const pct = Math.min(100, Math.round((chosen.current / Math.max(1, chosen.target)) * 100));
  return {
    ...chosen,
    pct,
    completed: chosen.current >= chosen.target,
  };
}

export function firstStepHint({
  todayMinutes,
  dayGoal,
  streak,
  habitsDone,
  english = false,
}: {
  todayMinutes: number;
  dayGoal: number;
  streak: number;
  habitsDone: number;
  english?: boolean;
}): string {
  if (todayMinutes >= dayGoal && dayGoal > 0) {
    return english
      ? "Daily goal achieved! Every extra minute builds your lead."
      : "Bạn đã hoàn thành mục tiêu hôm nay — phong độ rất ấn tượng!";
  }
  if (todayMinutes > 0) {
    const left = Math.max(1, dayGoal - todayMinutes);
    return english
      ? `${left} more minutes to reach today's goal${streak > 1 ? ` · ${streak}-day streak` : ""}.`
      : `Còn ${left} phút nữa là chạm mục tiêu hôm nay${streak > 1 ? ` · chuỗi ${streak} ngày` : ""}.`;
  }
  if (habitsDone > 0) {
    return english
      ? "Nice warm-up! Start a 15-minute session to light up today's square."
      : "Khởi động rất tốt! Thêm 1 phiên 15 phút để thắp sáng ô học hôm nay.";
  }
  return english
    ? "Start one 15-minute session to ignite your first streak."
    : "Chỉ cần 1 phiên 15 phút đầu tiên để thắp sáng chuỗi ngày học.";
}

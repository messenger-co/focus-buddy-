import { describe, expect, it } from "vitest";
import {
  dailySpotlight,
  firstStepHint,
  studyHeatmap,
  timeOfDayContext,
  vietnamHour,
} from "./engagement";
import type { FocusSession } from "../state";

const makeSession = (id: string, iso: string, minutes: number): FocusSession => {
  const start = Date.parse(iso);
  const end = start + minutes * 60_000;
  return {
    id,
    mode: "classic",
    minutes,
    status: "completed",
    started_at: new Date(start).toISOString(),
    ends_at: new Date(end).toISOString(),
    completed_at: new Date(end).toISOString(),
  };
};

describe("engagement helpers", () => {
  it("computes Vietnam time-of-day greetings across all 4 periods", () => {
    // 02:00 UTC = 09:00 VN (morning)
    const morning = Date.parse("2026-11-26T02:00:00Z");
    expect(vietnamHour(morning)).toBe(9);
    expect(timeOfDayContext(morning).period).toBe("morning");

    // 08:00 UTC = 15:00 VN (afternoon)
    const afternoon = Date.parse("2026-11-26T08:00:00Z");
    expect(timeOfDayContext(afternoon).period).toBe("afternoon");

    // 13:00 UTC = 20:00 VN (evening)
    const evening = Date.parse("2026-11-26T13:00:00Z");
    expect(timeOfDayContext(evening).period).toBe("evening");

    // 16:30 UTC = 23:30 VN (late)
    const late = Date.parse("2026-11-26T16:30:00Z");
    expect(timeOfDayContext(late).period).toBe("late");
    expect(timeOfDayContext(late, true).eyebrow).toContain("LATE-NIGHT");
  });

  it("builds a 21-day study heatmap with 5 intensity levels", () => {
    const now = Date.parse("2026-11-26T05:00:00Z"); // 12:00 VN on 2026-11-26
    const sessions = [
      makeSession("s1", "2026-11-26T01:00:00Z", 65), // intensity 4
      makeSession("s2", "2026-11-25T01:00:00Z", 35), // intensity 3
      makeSession("s3", "2026-11-24T01:00:00Z", 20), // intensity 2
      makeSession("s4", "2026-11-23T01:00:00Z", 5),  // intensity 1
    ];
    const checkIns = [{ day: "2026-11-22", mood: "great" as const }];
    const map = studyHeatmap(sessions, checkIns, now, 21);

    expect(map.cells).toHaveLength(21);
    expect(map.activeDays).toBe(5);
    expect(map.cells[20].isToday).toBe(true);
    expect(map.cells[20].intensity).toBe(4);
    expect(map.cells[19].intensity).toBe(3);
    expect(map.cells[18].intensity).toBe(2);
    expect(map.cells[17].intensity).toBe(1);
    expect(map.cells[16].intensity).toBe(1);
    expect(map.cells[16].checkedIn).toBe(true);
    expect(map.cells[15].intensity).toBe(0);
  });

  it("rotates deterministic daily spotlights and computes completion accurately", () => {
    const first = dailySpotlight({
      dayKey: "2026-11-26",
      todayMinutes: 0,
      dayGoal: 40,
      habitsDone: 0,
      exercisesDone: 0,
      hasMoodToday: false,
    });
    const sameDay = dailySpotlight({
      dayKey: "2026-11-26",
      todayMinutes: 45,
      dayGoal: 40,
      habitsDone: 4,
      exercisesDone: 2,
      hasMoodToday: true,
    });
    expect(first.id).toBe(sameDay.id);
    expect(first.completed).toBe(false);
    expect(sameDay.completed).toBe(true);
    expect(sameDay.pct).toBe(100);

    const distinctIds = new Set(
      ["2026-11-21", "2026-11-22", "2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26"].map(
        (dayKey) =>
          dailySpotlight({
            dayKey,
            todayMinutes: 0,
            dayGoal: 40,
            habitsDone: 0,
            exercisesDone: 0,
            hasMoodToday: false,
          }).id,
      ),
    );
    expect(distinctIds.size).toBeGreaterThanOrEqual(4);
  });

  it("produces motivating contextual hints for empty, partial, and complete days", () => {
    expect(
      firstStepHint({ todayMinutes: 0, dayGoal: 40, streak: 0, habitsDone: 0 }),
    ).toContain("15 phút");
    expect(
      firstStepHint({ todayMinutes: 25, dayGoal: 40, streak: 3, habitsDone: 1 }),
    ).toContain("15 phút");
    expect(
      firstStepHint({ todayMinutes: 40, dayGoal: 40, streak: 3, habitsDone: 1 }),
    ).toContain("hoàn thành");
  });
});

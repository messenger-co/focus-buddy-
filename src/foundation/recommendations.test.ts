import { describe, expect, it } from "vitest";
import { buildStudyRecommendations } from "./recommendations";

describe("buildStudyRecommendations", () => {
  it("prioritizes starting a 20-minute focus block when no minutes logged today", () => {
    const recs = buildStudyRecommendations({
      todayMinutes: 0,
      dayGoal: 40,
      weekMinutes: 60,
      weekGoal: 200,
      weekTrend: "flat",
      completedExercises: 0,
      totalExercises: 12,
      habitsDone: 1,
      totalHabits: 5,
      hasActiveSession: false,
      hour: 9,
    });
    expect(recs[0].id).toBe("first-focus-block");
    expect(recs[0].action).toEqual({
      type: "focus",
      minutes: 20,
      goal: "Tập trung học sâu",
    });
  });

  it("recommends calm library audio first and lighter 15m block when mood is tired", () => {
    const recs = buildStudyRecommendations({
      todayMinutes: 0,
      dayGoal: 40,
      weekMinutes: 80,
      weekGoal: 200,
      weekTrend: "flat",
      completedExercises: 2,
      totalExercises: 12,
      habitsDone: 0,
      totalHabits: 5,
      mood: "tired",
      hasActiveSession: false,
      hour: 21,
    });
    expect(recs[0].id).toBe("ambient-audio");
    const focusRec = recs.find((r) => r.id === "first-focus-block");
    expect(focusRec?.action).toEqual({
      type: "focus",
      minutes: 15,
      goal: "Tập trung học sâu",
    });
  });

  it("surfaces remaining daily target and weekly recovery challenge when trailing last week", () => {
    const recs = buildStudyRecommendations({
      todayMinutes: 25,
      dayGoal: 40,
      weekMinutes: 45,
      weekGoal: 200,
      weekTrend: "down",
      completedExercises: 3,
      totalExercises: 12,
      habitsDone: 3,
      totalHabits: 5,
      hasActiveSession: false,
      hour: 15,
    });
    expect(recs[0].id).toBe("finish-daily-goal");
    expect(recs[1].id).toBe("golden-20min-challenge");
  });

  it("supports English copy cleanly", () => {
    const recs = buildStudyRecommendations({
      todayMinutes: 45,
      dayGoal: 40,
      weekMinutes: 210,
      weekGoal: 200,
      weekTrend: "up",
      completedExercises: 12,
      totalExercises: 12,
      habitsDone: 5,
      totalHabits: 5,
      hasActiveSession: false,
      hour: 16,
      english: true,
    });
    expect(recs.some((r) => r.id === "goal-met-reset")).toBe(true);
    expect(recs.every((r) => r.title.length > 0 && r.reason.length > 0)).toBe(true);
  });
});

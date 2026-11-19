import { describe, expect, it } from "vitest";
import { CHALLENGES } from "./challenges";

describe("Twenty-minute study challenges", () => {
  it("provides five unique activities and five independently gradable prompts each", () => {
    expect(CHALLENGES).toHaveLength(5);
    expect(new Set(CHALLENGES.map((challenge) => challenge.id)).size).toBe(CHALLENGES.length);
    for (const challenge of CHALLENGES) {
      expect(challenge.title.length).toBeGreaterThan(5);
      expect(challenge.scenario.length).toBeGreaterThan(40);
      expect(challenge.questions).toHaveLength(5);
      for (const question of challenge.questions) {
        expect(question.prompt.length).toBeGreaterThan(15);
        expect(question.rubric.length).toBeGreaterThan(15);
      }
    }
  });
  it("retains quantitative solutions from the source material", () => {
    const byId = (id: string) => CHALLENGES.find((challenge) => challenge.id === id);
    expect(byId("hanh-tinh-xanh")?.questions[2].rubric).toContain("75");
    expect(byId("bi-mat-suc-khoe")?.questions[2].rubric).toContain("14");
    expect(byId("hanh-trinh-an-toan")?.questions[2].rubric).toContain("12");
  });
});

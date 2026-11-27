import { describe, expect, it, beforeEach } from "vitest";
import {
  parseAppearance,
  resetAppearance,
  updateAppearance,
} from "./appearance";
import { isDarkTheme, palette, paletteLibrary } from "./themes";
import { ACHIEVEMENTS, DAILY_QUOTES, EXERCISES } from "../data";

describe("appearance & themes", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("parses fontScale and fontStyle safely with defaults", () => {
    expect(parseAppearance(null).fontScale).toBe("normal");
    expect(parseAppearance(JSON.stringify({ fontScale: "large" })).fontScale).toBe("large");
    expect(parseAppearance(JSON.stringify({ fontScale: "compact" })).fontScale).toBe("compact");
    expect(parseAppearance(JSON.stringify({ fontScale: "invalid" })).fontScale).toBe("normal");
    expect(parseAppearance(null).fontStyle).toBe("editorial");
    expect(parseAppearance(JSON.stringify({ fontStyle: "magazine" })).fontStyle).toBe("magazine");
    expect(parseAppearance(JSON.stringify({ fontStyle: "classic" })).fontStyle).toBe("classic");
    expect(parseAppearance(JSON.stringify({ fontStyle: "comic" })).fontStyle).toBe("editorial");
  });

  it("updates and resets appearance back to defaults", () => {
    updateAppearance({
      accent: 196,
      backdrop: "stars",
      motion: "minimal",
      fontScale: "large",
      fontStyle: "magazine",
    });
    const saved = parseAppearance(localStorage.getItem("focus-buddy-appearance-v3"));
    expect(saved.fontScale).toBe("large");
    expect(saved.fontStyle).toBe("magazine");
    expect(saved.accent).toBe(196);
    expect(document.documentElement.dataset.fontScale).toBe("large");
    expect(document.documentElement.dataset.fontStyle).toBe("magazine");

    resetAppearance();
    const afterReset = parseAppearance(localStorage.getItem("focus-buddy-appearance-v3"));
    expect(afterReset.fontScale).toBe("normal");
    expect(afterReset.fontStyle).toBe("editorial");
    expect(afterReset.accent).toBeNull();
    expect(afterReset.backdrop).toBe("plain");
    expect(document.documentElement.dataset.fontScale).toBe("normal");
    expect(document.documentElement.dataset.fontStyle).toBe("editorial");
  });

  it("identifies dark and light themes accurately", () => {
    expect(paletteLibrary.length).toBeGreaterThanOrEqual(22);
    expect(isDarkTheme("meadow")).toBe(false);
    expect(isDarkTheme("matcha")).toBe(false);
    expect(isDarkTheme("charcoal")).toBe(true);
    expect(isDarkTheme("nord")).toBe(true);
    expect(isDarkTheme("espresso")).toBe(true);
    expect(isDarkTheme("nonexistent")).toBe(false);
  });

  it("exposes study-card and readable dark highlight tokens", () => {
    const darkPal = palette("nord");
    expect(darkPal["--study-card"]).toMatch(/^hsl\(/);
    expect(darkPal["--highlight"]).toMatch(/76%\)$/);
    const lightPal = palette("matcha");
    expect(lightPal["--study-card"]).toMatch(/^hsl\(/);
  });

  it("provides expanded exercises, quotes, and achievements", () => {
    expect(EXERCISES.length).toBeGreaterThanOrEqual(9);
    expect(EXERCISES[0].id).toBe("logic-1");
    expect(DAILY_QUOTES.length).toBeGreaterThanOrEqual(8);
    expect(ACHIEVEMENTS.some((a) => a.id === "steady-habit")).toBe(true);
    expect(ACHIEVEMENTS.some((a) => a.id === "curious-scholar")).toBe(true);
  });
});

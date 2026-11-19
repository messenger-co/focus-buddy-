import { describe, expect, it } from "vitest";
import { russianShortcut, danceGifUrl, meowImageUrl, swowImageUrl, callerImageUrl, trackUrl } from "./russianShortcut";

describe("Russian Easter egg shortcut and assets", () => {
  const trigger = {
    ctrlKey: true, shiftKey: true, altKey: false, metaKey: false,
    repeat: false, code: "Digit5",
  };
  it("activates only on Ctrl + Shift + 5, not when typing normally", () => {
    expect(russianShortcut(trigger)).toBe(true);
    expect(russianShortcut({ ...trigger, code: "Numpad5" })).toBe(true);
    expect(russianShortcut({ ...trigger, ctrlKey: false })).toBe(false);
    expect(russianShortcut({ ...trigger, shiftKey: false })).toBe(false);
    expect(russianShortcut({ ...trigger, altKey: true })).toBe(false);
    expect(russianShortcut({ ...trigger, repeat: true })).toBe(false);
    expect(russianShortcut({ ...trigger, code: "Digit6" })).toBe(false);
  });
  it("references the exact assets, rather than shipping copies", () => {
    expect(danceGifUrl).toContain("lets-dance-dancing.gif");
    expect(meowImageUrl).toContain("meowpng.webp");
    expect(swowImageUrl).toContain("swow.webp");
    expect(callerImageUrl).toContain("image.png");
    expect(decodeURIComponent(trackUrl)).toContain(
      "ТРИ-ПОЛОСКИ-KOLM-TRIIPU-THREE-STRIPES_007_128k.m4a",
    );
  });
});

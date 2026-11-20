import { describe, expect, it } from "vitest";
import { findGames } from "./library";
import {
  initialLook,
  parseWardrobe,
  presets,
  validateLook,
} from "../buddy3/wardrobe";

describe("Kệ trò chơi", () => {
  it("kết hợp tìm không dấu, nhóm và trò đã ghim", () => {
    expect([
      ...findGames("dAo May", "adventure", ["dao-may", "hang-bang"]),
    ]).toEqual(["dao-may"]);
    expect(findGames("pha lê", "quick", null).size).toBe(0);
    expect([...findGames("", "quick", ["lat-the", "dao-xanh"])]).toEqual([
      "lat-the",
    ]);
    expect(findGames("", "all", null).size).toBe(26);
  });
});

describe("Bộ học của Buddy", () => {
  it("mở trang phục đã lưu từ phiên bản cũ với sách mặc định", () => {
    const old = { garment: "sweater", hat: "winter", x: 6, y: -3 };
    const base = { companion: "fox", color: "mint", accessory: "none" };
    const store = parseWardrobe(
      JSON.stringify({
        look: old,
        outfits: [{ name: "Mùa đông", base, look: old }],
      }),
    );
    expect(store.look).toMatchObject({ ...old, studyTool: "book" });
    expect(store.outfits[0].look).toEqual(store.look);
    expect(validateLook({ ...old, studyTool: "missing" }).studyTool).toBe(
      initialLook.studyTool,
    );
  });
  it("ghi nhận đúng dụng cụ và trang phục của ba bộ mới", () => {
    const kits = presets.filter((p) => p.look.studyTool);
    expect(kits.map((p) => p.look.studyTool)).toEqual([
      "journal",
      "sketchpad",
      "chart",
    ]);
    for (const kit of kits)
      expect(validateLook(kit.look)).toMatchObject(kit.look);
  });
});

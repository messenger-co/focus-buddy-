import { describe, expect, it } from "vitest";
import { decodeCommunityStatus, roomEntryMode, roomErrorMessage } from "./room";

describe("discussion room entry and diagnostics", () => {
  it("never bypasses server moderation or verified-email requirements", () => {
    expect(roomEntryMode({ enabled: false, verified: false })).toBe("self-study");
    expect(roomEntryMode({ enabled: false, verified: true })).toBe("self-study");
    expect(roomEntryMode({ enabled: true, verified: false })).toBe("self-study");
    expect(roomEntryMode({ enabled: true, verified: true })).toBe("live");
  });

  it("decodes public rooms and invited private rooms without changing permissions", () => {
    expect(decodeCommunityStatus({
      enabled: true, verified: true, moderator: false,
      rooms: [
        { id: "tu-hoc", name: "Bàn tự học", description: "Đặt mục tiêu.", private: false },
        { id: "rieng", name: "Nhóm riêng", description: "Chỉ người được mời.", private: true },
      ],
    })).toEqual({
      enabled: true, verified: true, moderator: false,
      rooms: [
        { id: "tu-hoc", name: "Bàn tự học", description: "Đặt mục tiêu.", private: false },
        { id: "rieng", name: "Nhóm riêng", description: "Chỉ người được mời.", private: true },
      ],
    });
  });

  it("rejects malformed server responses instead of pretending the room is open", () => {
    expect(() => decodeCommunityStatus(null)).toThrow("không hợp lệ");
    expect(() => decodeCommunityStatus({ enabled: true, verified: true, rooms: [] }))
      .toThrow("chưa đầy đủ");
    expect(() => decodeCommunityStatus({
      enabled: true, verified: true, moderator: false,
      rooms: [{ id: "../admin", name: "Dangerous", description: "No" }],
    })).toThrow("không hợp lệ");
  });

  it("turns missing RPC, invalid auth and network problems into actionable notices", () => {
    expect(roomErrorMessage({
      code: "PGRST202", message: "Could not find function public.fb_community_status",
    })).toContain("migration");
    expect(roomErrorMessage({
      code: "42501", message: "permission denied",
    })).toContain("email");
    expect(roomErrorMessage(new Error("Failed to fetch"))).toContain("mạng");
    expect(roomErrorMessage(new Error("Phòng đang đóng."))).toBe("Phòng đang đóng.");
    expect(roomErrorMessage(new Error("Internal SQL diagnostics with private details")))
      .not.toContain("private details");
  });
});

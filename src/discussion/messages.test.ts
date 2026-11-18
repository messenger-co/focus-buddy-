// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createWriter, readNote, signNote } from "./messages";

describe("Tin nhắn phòng học", () => {
  it("xác nhận văn bản tiếng Việt, biệt danh và phòng gửi", async () => {
    const a = await createWriter(),
      b = await createWriter();
    const note = await signNote(a, "học", "  Cùng ôn hình học nhé 🌿  ");
    expect(await readNote(note, "học")).toMatchObject({
      id: note.id,
      author: a.author,
      body: "Cùng ôn hình học nhé 🌿",
    });
    expect(await readNote({ ...note, author: b.author }, "học")).toBeNull();
    expect(
      await readNote({ ...note, body: "Nội dung khác" }, "học"),
    ).toBeNull();
    expect(await readNote(note, "đọc sách")).toBeNull();
  });
  it("từ chối văn bản quá dài, ký tự điều khiển và dữ liệu sai cấu trúc", async () => {
    const a = await createWriter();
    for (const text of [" ", "a".repeat(321), "Ẩn\u202ehướng"]) {
      await expect(signNote(a, "học", text)).rejects.toThrow();
    }
    expect(await readNote({ id: "giả", body: "Xin chào" }, "học")).toBeNull();
  });
});

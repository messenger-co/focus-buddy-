import { describe, expect, it } from "vitest";
import { prepareChatMessages, readSSE, type ChatMessage } from "./chat";

function streamChunks(text: string, size: number): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  return new ReadableStream({
    start(controller) {
      for (let i = 0; i < bytes.length; i += size)
        controller.enqueue(bytes.slice(i, i + size));
      controller.close();
    },
  });
}

describe("Đọc câu trả lời trực tiếp", () => {
  it("cắt ngữ cảnh theo giới hạn ký tự, số tin và số byte nhưng giữ câu hỏi mới", () => {
    const history: ChatMessage[] = Array.from({ length: 20 }, (_, index) => ({
      role: index % 2 ? "assistant" : "user",
      content: "🌱".repeat(1000),
    }));
    history.push({ role: "user", content: "Bạn giúp mình lập kế hoạch nhé." });
    const prepared = prepareChatMessages(history);
    expect(prepared.length).toBeLessThanOrEqual(12);
    expect(
      prepared.reduce((total, message) => total + message.content.length, 0),
    ).toBeLessThanOrEqual(8000);
    expect(
      new TextEncoder().encode(JSON.stringify({ messages: prepared }))
        .byteLength,
    ).toBeLessThanOrEqual(24000);
    expect(prepared.at(-1)).toEqual(history.at(-1));
  });

  it("không âm thầm cắt câu hỏi quá dài", () => {
    expect(() =>
      prepareChatMessages([{ role: "user", content: "a".repeat(4001) }]),
    ).toThrow("4.000");
  });

  it("giữ nguyên dấu tiếng Việt qua các gói một byte và dòng CRLF", async () => {
    const events =
      ': keepalive\r\n\r\ndata: {"choices":[{"delta":{"content":"Chào bạn 🌱"}}]}\r\n\r\ndata: {"choices":[{"delta":{"content":"!"}}]}\r\n\r\ndata: [DONE]\r\n\r\n';
    let response = "";
    await readSSE(streamChunks(events, 1), (text) => {
      response += text;
    });
    expect(response).toBe("Chào bạn 🌱!");
  });

  it("báo lỗi khi kết nối ngắt trước sự kiện hoàn tất", async () => {
    const events = 'data: {"choices":[{"delta":{"content":"Chào"}}]}\n\n';
    await expect(
      readSSE(streamChunks(events, 7), () => undefined),
    ).rejects.toThrow("Kết nối đã ngắt");
  });

  it("nhận lỗi từ nhà cung cấp trong luồng", async () => {
    await expect(
      readSSE(
        streamChunks('data: {"error":{"message":"error"}}\n\n', 9),
        () => undefined,
      ),
    ).rejects.toThrow("chưa thể trả lời");
  });

  it("dừng đọc khi người dùng hủy", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      readSSE(
        streamChunks("data: [DONE]\n\n", 10),
        () => undefined,
        controller.signal,
      ),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});

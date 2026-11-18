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

// Việc nhận câu trả lời mẫu không được hiển thị như AI đã kết nối.
describe("Trạng thái triển khai AI", () => {
  it("báo rõ ngoại tuyến khi chưa có cấu hình", async () => {
    const { getChatReadiness } = await import("./chat");
    const result = await getChatReadiness();
    expect(result.ready).toBe(false);
    expect(result.message).toContain("Chưa kết nối");
  });
});

describe("Không báo AI trực tuyến khi dịch vụ chưa sẵn sàng", () => {
  it("giải thích hàm chưa triển khai khi nhận 404", async () => {
    const { getChatReadiness } = await import("./chat");
    const result = await getChatReadiness(
      "https://example.test/chat/health",
      async () => new Response("{}", { status: 404 }),
    );
    expect(result.ready).toBe(false);
    expect(result.message).toContain("chưa được triển khai");
  });
  it("chỉ báo sẵn sàng khi HTTP thành công và ready=true", async () => {
    const { getChatReadiness } = await import("./chat");
    expect(
      (
        await getChatReadiness("https://example.test/health", async () =>
          Response.json({ ready: true }, { status: 503 }),
        )
      ).ready,
    ).toBe(false);
    expect(
      await getChatReadiness("https://example.test/health", async () =>
        Response.json({ ready: true, model: "google/gemma-4-31b-it:free" }),
      ),
    ).toMatchObject({ ready: true, model: "google/gemma-4-31b-it:free" });
  });
});

it("không báo sẵn sàng khi máy chủ vẫn dùng mô hình cũ", async () => {
  const { getChatReadiness } = await import("./chat");
  for (const model of [
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "google/gemma-4-31b-it",
    undefined,
  ]) {
    const result = await getChatReadiness(
      "https://example.test/health",
      async () => Response.json({ ready: true, model }),
    );
    expect(result.ready).toBe(false);
    expect(result.message).toContain("Google Gemma 4 31B");
  }
});

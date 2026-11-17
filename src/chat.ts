import { apiBaseUrl, apiConfigured, supabase } from "./cloud";

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** Giữ ngữ cảnh gần nhất trong hạn mức của Edge Function, luôn giữ nguyên câu hỏi mới. */
export function prepareChatMessages(messages: ChatMessage[]): ChatMessage[] {
  const last = messages.at(-1);
  if (!last || last.role !== "user" || !last.content.trim())
    throw new Error("Bạn viết câu hỏi trước khi gửi nhé.");
  if (last.content.length > 4000)
    throw new Error("Câu hỏi cần ngắn hơn hoặc bằng 4.000 ký tự.");
  const selected: ChatMessage[] = [{ ...last, content: last.content.trim() }];
  let total = selected[0].content.length;
  for (
    let index = messages.length - 2;
    index >= 0 && selected.length < 12;
    index--
  ) {
    const message = messages[index];
    const content = message.content.trim().slice(0, 4000);
    if (!content || total + content.length > 8000) break;
    selected.unshift({ role: message.role, content });
    total += content.length;
  }
  while (
    selected.length > 1 &&
    new TextEncoder().encode(JSON.stringify({ messages: selected }))
      .byteLength > 24000
  )
    selected.shift();
  return selected;
}

/** Đọc từng sự kiện SSE kể cả khi một ký tự UTF-8 hoặc một sự kiện bị chia qua nhiều gói. */
export async function readSSE(
  stream: ReadableStream<Uint8Array>,
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let dataLines: string[] = [];
  let ended = false;
  let receivedContent = false;
  const emit = () => {
    if (!dataLines.length) return;
    const data = dataLines.join("\n");
    dataLines = [];
    if (data.trim() === "[DONE]") {
      ended = true;
      return;
    }
    let event: {
      choices?: { delta?: { content?: string } }[];
      error?: unknown;
    };
    try {
      event = JSON.parse(data);
    } catch {
      throw new Error("Phản hồi từ trợ lý bị gián đoạn. Bạn thử gửi lại nhé.");
    }
    if (event.error)
      throw new Error("Trợ lý chưa thể trả lời lúc này. Bạn thử lại sau nhé.");
    const content = event.choices?.[0]?.delta?.content;
    if (typeof content === "string" && content.length) {
      receivedContent = true;
      onDelta(content);
    }
  };
  const acceptLine = (rawLine: string) => {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
    if (line === "") emit();
    else if (line.startsWith("data:"))
      dataLines.push(line.slice(5).replace(/^ /, ""));
  };
  const abort = () => {
    void reader.cancel().catch(() => undefined);
  };
  signal?.addEventListener("abort", abort, { once: true });
  try {
    while (!ended) {
      if (signal?.aborted)
        throw new DOMException("Đã dừng câu trả lời.", "AbortError");
      const { value, done } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      let newline: number;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        acceptLine(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
        if (ended) break;
      }
    }
    if (signal?.aborted)
      throw new DOMException("Đã dừng câu trả lời.", "AbortError");
    if (!ended) {
      if (buffer) acceptLine(buffer);
      emit();
    }
    if (!receivedContent)
      throw new Error("Trợ lý chưa trả về nội dung. Bạn thử lại nhé.");
    if (!ended)
      throw new Error("Kết nối đã ngắt trước khi trợ lý trả lời xong.");
  } finally {
    signal?.removeEventListener("abort", abort);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

export async function streamChat(
  messages: ChatMessage[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!apiConfigured || !supabase)
    throw new Error(
      "Trợ lý trực tuyến chưa được cấu hình. Bạn có thể dùng gợi ý mẫu trong chế độ dùng thử.",
    );
  // Tạo phiên khách tự động khi chưa có phiên; không cần email hoặc đăng nhập.
  const { data: existing, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError)
    throw new Error("Chưa khôi phục được phiên trò chuyện. Bạn hãy thử lại.");
  let session = existing.session;
  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.session)
      throw new Error(
        "Chưa mở được phiên khách. Chủ trang cần bật Anonymous Sign-Ins trong Supabase.",
      );
    session = data.session;
  }
  const preparedMessages = prepareChatMessages(messages);
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ messages: preparedMessages }),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(
      "Chưa kết nối được với trợ lý. Bạn kiểm tra mạng rồi thử lại nhé.",
    );
  }
  if (!response.ok) {
    let message =
      response.status === 429
        ? "Bạn đã gửi nhiều câu hỏi. Hãy nghỉ một chút rồi quay lại nhé."
        : "Trợ lý chưa sẵn sàng. Bạn thử lại sau nhé.";
    try {
      const body = (await response.json()) as { error?: string };
      if (typeof body.error === "string" && /[à-ỹÀ-ỸđĐ]/u.test(body.error))
        message = body.error;
    } catch {
      /* Giữ thông báo mặc định nếu máy chủ không trả về JSON. */
    }
    throw new Error(message);
  }
  if (!response.body)
    throw new Error(
      "Trình duyệt chưa đọc được câu trả lời. Bạn thử trình duyệt mới hơn nhé.",
    );
  await readSSE(response.body, onDelta, signal);
}

/** Kiểm tra chức năng đã triển khai trước khi hiển thị AI trực tuyến. */
export async function getChatReadiness(
  endpoint = apiConfigured ? `${apiBaseUrl}/chat/health` : "",
  fetcher: typeof fetch = fetch,
): Promise<{ ready: boolean; message: string; model?: string }> {
  if (!endpoint)
    return {
      ready: false,
      message: "Chưa kết nối dịch vụ AI. Các gợi ý ngoại tuyến vẫn dùng được.",
    };
  try {
    const response = await fetcher(endpoint, {
      signal: AbortSignal.timeout(10000),
    });
    if (response.status === 404)
      return {
        ready: false,
        message:
          "Hàm trò chuyện chưa được triển khai. Chủ trang cần triển khai hàm chat và thêm khóa OpenRouter trong Supabase Secrets.",
      };
    const data = (await response.json()) as { ready?: boolean; model?: string };
    return response.ok && data.ready === true
      ? {
          ready: true,
          message: "Đã kết nối dịch vụ AI.",
          model: typeof data.model === "string" ? data.model : undefined,
        }
      : {
          ready: false,
          message:
            "Dịch vụ AI chưa được cấu hình đầy đủ. Chủ trang cần kiểm tra khóa OpenRouter và mô hình miễn phí.",
        };
  } catch {
    return {
      ready: false,
      message:
        "Chưa kiểm tra được kết nối AI. Bạn kiểm tra mạng hoặc dùng gợi ý ngoại tuyến nhé.",
    };
  }
}

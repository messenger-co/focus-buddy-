import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ArrowUp, BookOpen, ChevronDown, FileText, LoaderCircle, Paperclip, Square, Trash2, X } from "lucide-react";
import { streamChat, getChatReadiness, ChatRateLimitError } from "../chat";
import type { Profile } from "../state";
import {
  clearHistory,
  keepsHistory,
  readHistory,
  saveHistory,
  setHistoryPreference,
  type Turn,
} from "./history";
import { modes, type Language, type StudyMode } from "./modes";
import {
  ACCEPTED_ATTACHMENTS, MAX_ATTACHMENTS, composeAttachmentMessage,
  readTextAttachment, type TextAttachment,
} from "./attachments";
import { Answer, CopyButton } from "./Answer";
import "./assistant.css";

const Companion = lazy(() => import("../components/Companion"));
export default function Assistant({
  configured,
  profile,
}: {
  configured: boolean;
  profile: Profile;
}) {
  const lang: Language = document.documentElement.lang.startsWith("en")
    ? "en"
    : "vi";
  const t = (vi: string, en: string) => (lang === "vi" ? vi : en);
  const [mode, setMode] = useState<StudyMode>("tutor"),
    [turns, setTurns] = useState<Turn[]>(readHistory),
    [save, setSave] = useState(keepsHistory);
  const [input, setInput] = useState(""),
    [attachments, setAttachments] = useState<TextAttachment[]>([]),
    [readingAttachment, setReadingAttachment] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [offline, setOffline] = useState(false),
    [attempt, setAttempt] = useState(0),
    [clear, setClear] = useState(false),
    [cooldown, setCooldown] = useState(0);
  const [readiness, setReadiness] = useState<Awaited<
    ReturnType<typeof getChatReadiness>
  > | null>(null);
  const controller = useRef<AbortController | null>(null),
    inputEl = useRef<HTMLTextAreaElement>(null),
    fileInput = useRef<HTMLInputElement>(null),
    attachmentIndex = useRef(0),
    log = useRef<HTMLDivElement>(null),
    nearBottom = useRef(true);
  const latest = useRef(turns);
  function update(rows: Turn[]) {
    latest.current = rows;
    setTurns(rows);
  }
  useEffect(() => {
    if (!configured || offline) return;
    let active = true;
    setReadiness(null);
    getChatReadiness().then((result) => {
      if (active) setReadiness(result);
    });
    return () => {
      active = false;
    };
  }, [configured, attempt, offline]);
  useEffect(
    () => () => {
      const request = controller.current;
      controller.current = null;
      request?.abort();
    },
    [],
  );
  useEffect(() => {
    const area = log.current;
    if (area && nearBottom.current) area.scrollTop = area.scrollHeight;
  }, [turns, busy]);
  useEffect(() => {
    if (!cooldown) return;
    const timeout = setTimeout(
      () => setCooldown(0),
      Math.max(0, cooldown - Date.now()),
    );
    return () => clearTimeout(timeout);
  }, [cooldown]);
  const wantsAI = configured && !offline,
    live = wantsAI && readiness?.ready === true,
    blocked = wantsAI && !live;
  const source = live || wantsAI ? "live" : "sample";
  const displayed = turns.filter((r) => r.source === source);
  function stop() {
    const request = controller.current;
    if (!request) return;
    controller.current = null;
    request.abort();
    setBusy(false);
    const rows = latest.current.filter((row) => row.content.trim());
    update(rows);
    saveHistory(rows);
    setNotice(t("Đã dừng trả lời.", "Response stopped."));
  }

  async function chooseFiles(incoming: FileList | File[]) {
    const files = Array.from(incoming);
    if (!files.length) return;
    if (!live) {
      setError(t(
        "Cần kết nối AI trực tuyến để gửi nội dung tệp.",
        "Connect to the online AI to send file contents.",
      ));
      return;
    }
    if (readingAttachment || busy) return;
    if (files.length + attachments.length > MAX_ATTACHMENTS) {
      setError(t("Tối đa 3 tệp cho mỗi câu hỏi.", "Maximum 3 files per message."));
      return;
    }
    setReadingAttachment(true);
    setError("");
    try {
      const loaded: TextAttachment[] = [];
      for (const file of files) {
        attachmentIndex.current++;
        loaded.push(await readTextAttachment(file, String(attachmentIndex.current)));
      }
      setAttachments((current) => [...current, ...loaded].slice(0, MAX_ATTACHMENTS));
      setNotice(t(
        "Đã đọc văn bản từ tệp trên thiết bị. Chỉ một đoạn trích sẽ được gửi cùng câu hỏi.",
        "Files read locally. Only a text excerpt will be sent with your question.",
      ));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message :
        t("Không đọc được tệp.", "Could not read this file."));
    } finally {
      setReadingAttachment(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  async function send(e?: FormEvent) {
    e?.preventDefault();
    if (
      (!input.trim() && !attachments.length) ||
      busy ||
      readingAttachment ||
      controller.current ||
      blocked ||
      (live && cooldown > Date.now())
    ) return;
    if (attachments.length && !live) {
      setError(t("Chỉ gửi tệp khi AI đã kết nối.", "Attachments require a live AI connection."));
      return;
    }
    const question = input.trim() || t(
      "Hãy giúp mình đọc và hiểu tài liệu đính kèm.",
      "Please help me understand the attached document.",
    );
    let attachmentPrompt = question;
    let partial = false;
    if (attachments.length) {
      try {
        const composed = composeAttachmentMessage(question, attachments);
        attachmentPrompt = composed.content;
        partial = composed.partial;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : t(
          "Tệp đính kèm quá dài.", "Attachment is too long.",
        ));
        return;
      }
    }
    // Display and (optionally) save only filenames, NEVER extracted file text.
    const visibleQuestion = question + (attachments.length
      ? "\n\n📎 " + attachments.map((file) => file.name).join(", ")
      : "");
    const submittedFiles = attachments;
    const next = [
      ...turns,
      { role: "user" as const, content: visibleQuestion, source } as Turn,
    ].slice(-38);
    nearBottom.current = true;
    setInput("");
    setAttachments([]);
    setError("");
    setNotice("");
    setClear(false);
    if (!live) {
      const sample =
        mode === "tutor" && /mệt|buồn|nghỉ|tired/i.test(question)
          ? modes.coach
          : modes[mode];
      const end: Turn[] = [
        ...next,
        {
          role: "assistant",
          source: "sample",
          content: lang === "vi" ? sample.example : sample.exampleEn,
        },
      ];
      update(end);
      saveHistory(end);
      return;
    }
    const req = new AbortController();
    controller.current = req;
    setBusy(true);
    let reply = "";
    const response = (incomplete: boolean): Turn[] => [
      ...next,
      { role: "assistant", source: "live", content: reply, incomplete },
    ];
    update(response(true));
    try {
      // Các tin soạn sẵn ngoại tuyến không được chuyển sang cuộc trò chuyện trực tuyến.
      const context = next
        .filter((row) => row.source === "live" && !row.incomplete)
        .map(({ role, content }) => ({ role, content }));
      if (submittedFiles.length && context.length)
        context[context.length - 1].content = attachmentPrompt;
      // Hàm cũ chỉ đọc danh sách tin nhắn. Gửi lựa chọn như một yêu cầu của học sinh.
      if (!readiness?.studyModes && context.length) {
        const last = context[context.length - 1];
        const prompt =
          lang === "en"
            ? `Please answer in English as my ${modes[mode].en.toLowerCase()}.\n`
            : `Mình muốn dùng chế độ “${modes[mode].vi}”. Hãy trả lời bằng tiếng Việt.\n`;
        if (prompt.length + last.content.length <= 4000)
          last.content = prompt + last.content;
        else
          context.splice(context.length - 1, 0, {
            role: "user",
            content: prompt,
          });
      }
      await streamChat(
        context,
        (part) => {
          if (controller.current !== req) return;
          reply += part;
          update(response(true));
        },
        req.signal,
        readiness?.studyModes ? { mode, language: lang } : undefined,
      );
      if (controller.current === req) {
        const end = response(false);
        update(end);
        saveHistory(end);
        setNotice(partial
          ? t("AI chỉ nhận một đoạn trích từ tài liệu. Muốn hỏi phần khác, hãy đính kèm lại tệp.", "The AI received only an excerpt. Reattach the file to ask about another section.")
          : submittedFiles.length
            ? t("Đã trả lời theo đoạn trích đính kèm. Hãy đính kèm lại khi hỏi tiếp về tệp.", "Answered using the attached excerpt. Reattach it for file-specific follow-ups.")
            : t("Đã trả lời xong.", "Answer complete."));
      }
    } catch (cause) {
      if (controller.current !== req || req.signal.aborted) return;
      const end = reply ? response(true) : next;
      update(end);
      saveHistory(end);
      if (cause instanceof ChatRateLimitError) {
        const seconds = cause.retryAfter;
        setCooldown(Date.now() + seconds * 1000);
        const wait =
          seconds < 60
            ? t(`${seconds} giây`, `${seconds} seconds`)
            : t(
                `${Math.ceil(seconds / 60)} phút`,
                `${Math.ceil(seconds / 60)} min`,
              );
        setError(
          t(
            `Đã chạm hạn mức. Bạn có thể gửi tiếp sau khoảng ${wait}.`,
            `Rate limit reached. Try again in about ${wait}.`,
          ),
        );
      } else
        setError(
          lang === "vi" && cause instanceof Error
            ? cause.message
            : t(
                "Chưa kết nối được với trợ lý.",
                "The request did not finish. Check your connection and session, then try again.",
              ),
        );
      if (!reply) { setInput(input); setAttachments(submittedFiles); }
    } finally {
      if (controller.current === req) {
        controller.current = null;
        setBusy(false);
      }
    }
  }
  function switchHistory(checked: boolean) {
    if (!setHistoryPreference(checked)) {
      setError(
        t(
          "Trình duyệt chưa cho phép lưu lịch sử.",
          "This browser cannot save chat history.",
        ),
      );
      return;
    }
    setSave(checked);
    if (checked) saveHistory(latest.current);
  }
  const recent = displayed.at(-1);
  return (
    <section className="ai-desk">
      <header className="ai-buddy-line">
        <div className="ai-live-art">
          <Suspense fallback={<BookOpen size={28} />}>
            <Companion
              kind={profile.companion}
              color={profile.color}
              accessory={profile.accessory}
              size={76}
              reaction={
                busy ? "wave" : recent?.role === "assistant" ? "happy" : "idle"
              }
            />
          </Suspense>
        </div>
        <div>
          <strong>
            {profile.buddy_name || t("Bạn đồng hành học tập", "Study buddy")}
          </strong>
          <p>
            {live
              ? "Groq · GPT-OSS 120B"
              : blocked
                ? readiness
                  ? t("AI chưa sẵn sàng", "AI unavailable")
                  : t("Đang kiểm tra kết nối…", "Checking connection…")
                : t(
                    "Ngoại tuyến · Câu trả lời được soạn sẵn, không phải AI trực tiếp",
                    "Ready-to-use study prompts · Works offline",
                  )}
          </p>
        </div>
      </header>
      <div className="ai-options">
        <label className="ai-mode">
          {t("Chế độ học", "Learning mode")}
          <span>
            <select
              value={mode}
              disabled={busy}
              onChange={(e) => {
                setMode(e.target.value as StudyMode);
                setNotice("");
              }}
            >
              {(Object.keys(modes) as StudyMode[]).map((id) => (
                <option key={id} value={id}>
                  {modes[id][lang]}
                </option>
              ))}
            </select>
            <ChevronDown size={15} />
          </span>
        </label>
        <label className="ai-history">
          <input
            type="checkbox"
            checked={save}
            onChange={(e) => switchHistory(e.target.checked)}
          />
          {t("Lưu lịch sử trên máy này", "Save history on this device")}
        </label>
      </div>
      {blocked && (
        <div className="ai-status-panel" role="status">
          <p>
            {readiness
              ? lang === "vi"
                ? readiness.message
                : "The chat service is unavailable. You can use the offline examples."
              : t(
                  "Đang kết nối với trợ lý AI. Bạn có thể chọn gợi ý học tập trong lúc này.",
                  "Connecting to the AI assistant. Study prompts are available in the meantime.",
                )}
          </p>
          {readiness && (
            <div>
              <button type="button" onClick={() => setAttempt((v) => v + 1)}>
                {t("Kiểm tra lại", "Check again")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOffline(true);
                  setError("");
                  setNotice("");
                }}
              >
                {t("Dùng gợi ý ngoại tuyến", "Use offline examples")}
              </button>
            </div>
          )}
        </div>
      )}
      {offline && configured && (
        <button
          type="button"
          className="ai-text-button"
          onClick={() => {
            setReadiness(null);
            setOffline(false);
            setError("");
            setNotice("");
          }}
        >
          {t("Kết nối lại AI", "Reconnect AI")}
        </button>
      )}
      <div
        className="ai-conversation"
        ref={log}
        aria-label={t("Hội thoại", "Conversation")}
        role="region"
        tabIndex={0}
        onScroll={() => {
          const box = log.current;
          if (box)
            nearBottom.current =
              box.scrollHeight - box.scrollTop - box.clientHeight < 70;
        }}
      >
        {!displayed.length && (
          <div className="ai-start">
            <BookOpen size={22} />
            <p>
              {t(
                "Hôm nay mình cùng khám phá điều gì?",
                "What shall we explore together today?",
              )}
            </p>
            <button
              type="button"
              onClick={() => {
                setInput(
                  lang === "vi" ? modes[mode].prompt : modes[mode].english,
                );
                inputEl.current?.focus();
              }}
            >
              {lang === "vi" ? modes[mode].prompt : modes[mode].english}
            </button>
          </div>
        )}
        {displayed.map((row, i) => (
          <article
            key={i}
            className={`ai-turn ai-${row.role}`}
            aria-label={
              row.role === "user"
                ? t("Bạn", "You")
                : t("Bạn đồng hành", "Buddy")
            }
          >
            <small>
              {row.role === "user"
                ? t("Bạn", "You")
                : live
                  ? "Buddy · Groq"
                  : t("Ví dụ ngoại tuyến", "Offline example")}
            </small>
            {row.role === "user" ? (
              <p className="ai-question">{row.content}</p>
            ) : row.content ? (
              <Answer text={row.content} lang={lang} />
            ) : (
              <span>{t("Đang suy nghĩ…", "Thinking…")}</span>
            )}
            {row.role === "assistant" &&
              row.content &&
              (!busy || i < displayed.length - 1) && (
                <div className="ai-turn-tools">
                  {row.incomplete && (
                    <span>{t("Trả lời dở", "Partial answer")}</span>
                  )}
                  <CopyButton lang={lang} text={row.content} />
                </div>
              )}
          </article>
        ))}
      </div>
      <div role="status" className="ai-notice">
        {notice}
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {!!attachments.length && (
        <div className="ai-attachments" aria-label={t("Tệp đã chọn", "Selected files")}>
          {attachments.map((file) => (
            <div className="ai-attachment-chip" key={file.id}>
              <FileText size={16} />
              <span><strong>{file.name}</strong>
                <small>{file.totalCharacters > file.excerpt.length
                  ? t("Tài liệu dài · chỉ gửi đoạn trích", "Long file · excerpt only")
                  : t("Văn bản đã đọc", "Text extracted")}</small>
              </span>
              <button type="button" disabled={busy || readingAttachment}
                aria-label={t("Bỏ tệp ", "Remove file ") + file.name}
                onClick={() => setAttachments((current) => current.filter((entry) => entry.id !== file.id))}>
                <X size={15}/>
              </button>
            </div>
          ))}
        </div>
      )}
      {readingAttachment && <p className="ai-file-status" role="status"><LoaderCircle size={15} className="ai-spin"/> {t("Đang đọc tệp trên thiết bị…", "Reading files on your device…")}</p>}
      <form onSubmit={send} className="ai-composer"
        onDragOver={(event) => { if (event.dataTransfer.types.includes("Files")) event.preventDefault(); }}
        onDrop={(event) => {
          if (!event.dataTransfer.files.length) return;
          event.preventDefault();
          void chooseFiles(event.dataTransfer.files);
        }}>
        <input ref={fileInput} type="file" className="ai-file-input"
          tabIndex={-1} accept={ACCEPTED_ATTACHMENTS} multiple
          aria-label={t("Chọn tệp tài liệu", "Choose document files")}
          disabled={!live || busy || readingAttachment || attachments.length >= MAX_ATTACHMENTS}
          onChange={(event) => { if (event.target.files) void chooseFiles(event.target.files); }}/>
        <button type="button" className="ai-attach-button"
          disabled={!live || busy || readingAttachment || attachments.length >= MAX_ATTACHMENTS}
          title={t("Đính kèm TXT, DOCX, MD, CSV, JSON hoặc mã nguồn", "Attach TXT, DOCX, MD, CSV, JSON or code")}
          aria-label={t("Đính kèm tài liệu", "Attach document")}
          onClick={() => fileInput.current?.click()}>
          <Paperclip size={19}/>
        </button>
        <textarea
          aria-label={t("Tin nhắn cho bạn đồng hành", "Message for Buddy")}
          ref={inputEl}
          value={input}
          disabled={blocked}
          rows={2}
          maxLength={4000}
          placeholder={t("Viết câu hỏi của bạn…", "Write your question…")}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              void send();
            }
          }}
        />
        {busy ? (
          <button
            type="button"
            onClick={stop}
            aria-label={t("Dừng trả lời", "Stop generation")}
            title={t("Dừng trả lời", "Stop generation")}
          >
            <Square fill="currentColor" size={16} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={
              (!input.trim() && !attachments.length) || blocked || readingAttachment || (live && cooldown > Date.now())
            }
            aria-label={t("Gửi tin nhắn", "Send message")}
          >
            <ArrowUp size={19} />
          </button>
        )}
      </form>
      <p className="ai-attachment-help">{t(
        "📎 Tối đa 3 tệp, 2 MB/tệp: TXT, DOCX, MD, CSV, JSON, mã nguồn. PDF và ảnh chưa hỗ trợ; hãy chuyển thành văn bản. Chỉ trích đoạn được gửi tới Groq, không lưu tệp lên cloud.",
        "📎 Up to 3 files, 2 MB each: TXT, DOCX, MD, CSV, JSON, code. PDF/images are not supported yet; convert them to text. Only excerpts go to Groq; files are not stored in the cloud.",
      )}</p>
      <div className="ai-footer">
        <small>
          {live
            ? t(
                "Kiểm tra lại thông tin quan trọng trước khi sử dụng nhé.",
                "Check important facts before relying on an answer.",
              )
            : t(
                "Gợi ý mẫu hoạt động ngay trên thiết bị.",
                "Examples work on this device.",
              )}
        </small>
        {!!turns.length && !clear && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setClear(true)}
            className="ai-text-button"
          >
            <Trash2 size={13} />
            {t("Xóa hội thoại", "Clear chat")}
          </button>
        )}
        {clear && (
          <div className="ai-confirm">
            <span>
              {t("Xóa cả lịch sử đã lưu?", "Clear saved history too?")}
            </span>
            <button
              type="button"
              onClick={() => {
                clearHistory();
                update([]);
                setClear(false);
                setNotice(t("Đã xóa hội thoại.", "Chat cleared."));
              }}
            >
              {t("Xóa", "Clear")}
            </button>
            <button type="button" onClick={() => setClear(false)}>
              {t("Giữ lại", "Keep")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

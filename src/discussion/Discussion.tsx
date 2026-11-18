import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Coffee,
  EyeOff,
  Library,
  MessageCircle,
  MessagesSquare,
  Radio,
  RefreshCw,
  Send,
  Users,
} from "lucide-react";
import { supabase } from "../cloud";
import {
  channelName,
  STUDY_ROOMS,
  MESSAGE_LENGTH,
  SEND_INTERVAL_MS,
  VISIBLE_MESSAGES,
  nickname,
  sessionWriter,
  signNote,
  type DisplayNote,
  type Note,
  type StudyRoom,
} from "./messages";
import { connectRoom, type RoomStatus } from "./room";
import "./discussion.css";

const roomIcons = { "tu-hoc": Coffee, "go-bai": BookOpen, "doc-sach": Library };
const clock = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
});
const muteKey = "focus-buddy-muted-v1";
function initialMuted(): string[] {
  try {
    const data: unknown = JSON.parse(sessionStorage.getItem(muteKey) || "[]");
    return Array.isArray(data)
      ? data
          .filter(
            (id): id is string =>
              typeof id === "string" && /^[\w-]{87}$/.test(id),
          )
          .slice(-120)
      : [];
  } catch {
    return [];
  }
}

function Room({ room, leave }: { room: StudyRoom; leave: () => void }) {
  const topic = channelName(room.id, window.location.origin);
  const [status, setStatus] = useState<RoomStatus>("joining");
  const [attempt, setAttempt] = useState(0);
  const [self, setSelf] = useState("");
  const [messages, setMessages] = useState<DisplayNote[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [muted, setMuted] = useState(initialMuted);
  const mutedRef = useRef(muted);
  const connection = useRef<Awaited<ReturnType<typeof connectRoom>>>(null);
  const attemptedAt = useRef(0);
  const sendingRef = useRef(false);
  const retryNote = useRef<Note | null>(null);
  const seen = useRef(new Set<string>());
  const recent = useRef(new Map<string, number>());
  const list = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  function append(note: DisplayNote, own = false) {
    if (mutedRef.current.includes(note.author)) return;
    const key = note.author + note.id;
    if (seen.current.has(key)) return;
    const received = Date.now();
    if (
      !own &&
      received - (recent.current.get(note.author) ?? 0) < SEND_INTERVAL_MS - 450
    )
      return;
    seen.current.add(key);
    recent.current.delete(note.author);
    recent.current.set(note.author, received);
    if (seen.current.size > 256)
      seen.current.delete(seen.current.values().next().value!);
    if (recent.current.size > 128)
      recent.current.delete(recent.current.keys().next().value!);
    setMessages((prev) => [...prev.slice(1 - VISIBLE_MESSAGES), note]);
  }
  useEffect(() => {
    if (!supabase) {
      setStatus("offline");
      return;
    }
    const client = supabase;
    const stop = new AbortController();
    setStatus("joining");
    setError("");
    setSending(false);
    sendingRef.current = false;
    void sessionWriter()
      .then(async (writer) => {
        if (stop.signal.aborted) return;
        setSelf(writer.author);
        const joined = await connectRoom(
          client,
          topic,
          stop.signal,
          setStatus,
          append,
        );
        if (!stop.signal.aborted) connection.current = joined;
      })
      .catch(() => {
        if (!stop.signal.aborted) {
          setError(
            "Trình duyệt chưa mở được phiên thảo luận. Hãy thử lại trên kết nối HTTPS.",
          );
          setStatus("offline");
        }
      });
    return () => {
      stop.abort();
      connection.current = null;
    };
  }, [topic, attempt]);
  useEffect(() => {
    if (list.current && follow.current)
      list.current.scrollTop = list.current.scrollHeight;
  }, [messages]);
  function updateMuted(ids: string[]) {
    const next = ids.slice(-120);
    mutedRef.current = next;
    setMuted(next);
    try {
      sessionStorage.setItem(muteKey, JSON.stringify(next));
    } catch {
      /* Tùy chọn vẫn có hiệu lực cho lần mở này. */
    }
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    const target = connection.current;
    if (!target || status !== "online" || sendingRef.current || !draft.trim())
      return;
    if (Date.now() - attemptedAt.current < SEND_INTERVAL_MS) {
      setError("Chờ ba giây giữa hai tin nhắn nhé.");
      return;
    }
    const original = draft;
    sendingRef.current = true;
    setSending(true);
    setError("");
    attemptedAt.current = Date.now();
    try {
      const note =
        retryNote.current?.body === original.trim()
          ? retryNote.current
          : await signNote(await sessionWriter(), topic, original);
      retryNote.current = note;
      await target.send(note);
      if (connection.current !== target) return;
      retryNote.current = null;
      follow.current = true;
      append({ ...note, received: Date.now() }, true);
      setDraft((text) => (text === original ? "" : text));
    } catch (e) {
      if (connection.current === target)
        setError(
          e instanceof Error && /[À-ỹ]/u.test(e.message)
            ? e.message
            : "Chưa gửi được tin nhắn. Bạn thử lại nhé.",
        );
    } finally {
      if (connection.current === target) {
        setSending(false);
        sendingRef.current = false;
      }
    }
  }
  const Icon = roomIcons[room.id];
  return (
    <section className="discussion-page">
      <button className="room-back" onClick={leave}>
        <ArrowLeft size={16} />
        Rời phòng
      </button>
      <div className="discussion-room">
        <header className="discussion-room-head">
          <span className={`topic-icon topic-${room.id}`}>
            <Icon />
          </span>
          <div>
            <h1>{room.name}</h1>
            <p role="status">
              <i className={status === "online" ? "is-online" : ""} />
              {status === "online"
                ? "Đã kết nối"
                : status === "joining"
                  ? "Đang vào phòng…"
                  : "Mất kết nối"}
            </p>
          </div>
        </header>
        {status === "offline" && (
          <div className="room-reconnect" role="status">
            Chưa kết nối được với phòng.{" "}
            <button onClick={() => setAttempt((n) => n + 1)}>
              <RefreshCw size={14} />
              Kết nối lại
            </button>
          </div>
        )}
        <div
          className="message-wall"
          ref={list}
          onScroll={(e) => {
            const el = e.currentTarget;
            follow.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 55;
          }}
          role="log"
          aria-label="Tin nhắn trong phòng"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.length === 0 && (
            <div className="room-empty">
              <MessagesSquare size={28} />
              <p>
                {status === "online"
                  ? "Bạn đã vào phòng. Hãy đặt câu hỏi đầu tiên bạn muốn trao đổi."
                  : "Tin nhắn mới sẽ hiện ở đây khi kết nối."}
              </p>
            </div>
          )}
          {messages.map((m) => (
            <article
              className={`chat-note ${m.author === self ? "own-note" : ""}`}
              key={m.author + m.id}
            >
              <div className="note-meta">
                <strong>
                  {m.author === self ? "Bạn" : nickname(m.author)}
                </strong>
                <time dateTime={new Date(m.received).toISOString()}>
                  {clock.format(m.received)}
                </time>
                {m.author !== self && (
                  <button
                    title="Ẩn người này"
                    aria-label={`Ẩn tin từ ${nickname(m.author)}`}
                    onClick={() => {
                      updateMuted([...mutedRef.current, m.author]);
                      setMessages((old) =>
                        old.filter((x) => x.author !== m.author),
                      );
                    }}
                  >
                    <EyeOff size={15} />
                  </button>
                )}
              </div>
              <p>{m.body}</p>
            </article>
          ))}
        </div>
        <form className="public-composer" onSubmit={send}>
          <label htmlFor="public-note">Tin nhắn công khai</label>
          <div>
            <input
              id="public-note"
              autoComplete="off"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={MESSAGE_LENGTH}
              placeholder="Trao đổi bài học với các bạn…"
            />
            <button
              className="button primary"
              disabled={!draft.trim() || status !== "online" || sending}
              aria-label="Gửi vào phòng"
            >
              <Send size={17} />
            </button>
          </div>
          <div className="composer-detail">
            <span>
              {self
                ? `Biệt danh của bạn: ${nickname(self)}`
                : "Đang tạo biệt danh…"}
            </span>
            <span>
              {draft.length}/{MESSAGE_LENGTH}
            </span>
          </div>
        </form>
        {error && (
          <p className="room-error" role="alert">
            {error}
          </p>
        )}
      </div>
      {muted.length > 0 && (
        <details className="muted-list">
          <summary>Đã ẩn {muted.length} biệt danh</summary>
          {muted.map((id) => (
            <button
              key={id}
              onClick={() =>
                updateMuted(mutedRef.current.filter((k) => k !== id))
              }
            >
              Bỏ ẩn {nickname(id)}
            </button>
          ))}
        </details>
      )}
    </section>
  );
}

export default function Discussion() {
  const [room, setRoom] = useState<StudyRoom | null>(null);
  if (room)
    return <Room key={room.id} room={room} leave={() => setRoom(null)} />;
  return (
    <div className="discussion-page">
      <header className="discussion-heading">
        <div>
          <Users size={25} />
          <h1>Phòng thảo luận</h1>
          <p>Chọn một bàn để hỏi bài hoặc trao đổi cùng các bạn đang có mặt.</p>
        </div>
        <div className="talk-emblem" aria-hidden="true">
          <MessageCircle />
          <MessagesSquare />
        </div>
      </header>
      {!supabase && (
        <p role="status" className="room-reconnect">
          Cần kết nối Supabase để vào phòng thảo luận công khai.
        </p>
      )}
      <div className="discussion-topics">
        {STUDY_ROOMS.map((topic) => {
          const Icon = roomIcons[topic.id];
          return (
            <article key={topic.id} className={`topic-card topic-${topic.id}`}>
              <span className="topic-icon">
                <Icon size={25} />
              </span>
              <div>
                <small>{topic.subject}</small>
                <h2>{topic.name}</h2>
                <p>{topic.description}</p>
              </div>
              <button
                className="topic-join"
                disabled={!supabase}
                onClick={() => setRoom(topic)}
                aria-label={`Vào phòng ${topic.name}`}
              >
                Vào phòng <ArrowRight size={15} />
              </button>
            </article>
          );
        })}
      </div>
      <aside className="room-guidance">
        <Radio size={21} />
        <div>
          <strong>Trò chuyện trực tiếp bằng biệt danh</strong>
          <p>
            Mọi người trong phòng đều đọc được tin bạn gửi. Bạn chỉ thấy tin mới
            kể từ lúc vào phòng. Hãy giữ riêng số điện thoại, địa chỉ và thông
            tin trường lớp. Bạn có thể ẩn một người hoặc rời phòng bất cứ lúc
            nào.
          </p>
        </div>
      </aside>
    </div>
  );
}

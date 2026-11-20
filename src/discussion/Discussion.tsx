import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Flag,
  MessageSquare,
  Pin,
  Shield,
  Users,
} from "lucide-react";
import { supabase } from "../cloud";
import {
  aliases,
  buddies,
  themes,
  interests,
  rooms,
  reportReasons,
} from "./catalog";
import {
  rpc,
  type Room,
  type Status,
  type Profile,
  type Message,
  type Feed,
  type Review,
} from "./room";
import "./discussion.css";

const clock = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
});
const closed: Status = {
  enabled: false,
  verified: false,
  moderator: false,
  rooms: rooms.map(([id, name, description]) => ({ id, name, description })),
};
const messageOf = (e: unknown) =>
  e instanceof Error ? e.message : "Chưa thực hiện được. Bạn thử lại nhé.";

function ProfileEditor({
  initial,
  submit,
}: {
  initial: Profile;
  submit: (p: Profile) => Promise<void>;
}) {
  const [p, setP] = useState(initial);
  return (
    <details className="room-profile">
      <summary>Biệt danh và hình đại diện</summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(p);
        }}
      >
        {(
          [
            ["alias", "Biệt danh", aliases.map((v) => [v, v])],
            ["buddy", "Bạn đồng hành", Object.entries(buddies)],
            ["theme", "Màu hồ sơ", Object.entries(themes)],
            [
              "interest",
              "Sở thích",
              interests.map((v) => [v, v || "Để trống"]),
            ],
          ] as const
        ).map(([k, label, options]) => (
          <label key={k}>
            {label}
            <select
              value={p[k]}
              onChange={(e) => setP({ ...p, [k]: e.target.value })}
            >
              {options.map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button className="button secondary">Lưu hồ sơ</button>
      </form>
    </details>
  );
}

function Moderation({ refresh }: { refresh: () => void }) {
  const [items, setItems] = useState<Review[]>([]),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(() => {
    void rpc<Review[]>("fb_moderation_queue")
      .then(setItems)
      .catch((e) => setNotice(messageOf(e)));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  async function act(id: string, a: string) {
    if (busy) return;
    setBusy(true);
    try {
      await rpc("fb_moderate", { p_message: id, p_action: a });
      load();
      refresh();
      setNotice("Đã ghi nhận quyết định.");
    } catch (e) {
      setNotice(messageOf(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="room-moderation">
      <h2>Hàng chờ kiểm duyệt</h2>
      <button onClick={load}>Cập nhật hàng chờ</button>
      {items.length === 0 && <p>Hiện chưa có mục nào trong hàng chờ.</p>}
      {items.map((m) => (
        <article key={m.id}>
          <small>
            {m.room} · {m.alias}
          </small>
          <p>{m.body}</p>
          {m.reasons.length > 0 && (
            <p>Báo cáo: {m.reasons.map((v) => reportReasons[v]).join(", ")}</p>
          )}
          <div className="room-tools">
            {(m.state === "pending"
              ? [
                  ["approve", "Duyệt"],
                  ["remove", "Từ chối"],
                ]
              : [
                  ["remove", "Gỡ tin"],
                  ["resolve", "Đóng báo cáo"],
                ]
            ).map(([a, t]) => (
              <button key={a} disabled={busy} onClick={() => void act(m.id, a)}>
                {t}
              </button>
            ))}
            <button
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    "Tạm ngừng tài khoản này trong 7 ngày và gỡ tin?",
                  )
                )
                  void act(m.id, "suspend");
              }}
            >
              Tạm ngừng 7 ngày
            </button>
          </div>
        </article>
      ))}
      <p role="status">{notice}</p>
    </section>
  );
}

function StudyRoom({
  room,
  status,
  leave,
}: {
  room: Room;
  status: Status;
  leave: () => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null),
    [feed, setFeed] = useState<Feed>({ online: 0, messages: [] }),
    [attempt, setAttempt] = useState(0);
  const [draft, setDraft] = useState(""),
    [search, setSearch] = useState(""),
    [reply, setReply] = useState<Message | null>(null),
    [report, setReport] = useState(""),
    [reason, setReason] = useState("hurtful");
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false);
  const seq = useRef(0),
    live = useRef(false),
    busyRef = useRef(false),
    bump = useRef<() => void>(() => {});
  // Chỉ lưu và hiển thị bản tin do PostgreSQL trả về sau kiểm tra quyền.
  const load = useCallback(async () => {
    const n = ++seq.current;
    try {
      const data = await rpc<Feed>("fb_room_feed", {
        p_room: room.id,
        p_search: search,
      });
      if (live.current && n === seq.current) {
        setFeed(data);
        setReady(true);
      }
    } catch (e) {
      if (live.current && n === seq.current) {
        setFeed({ online: 0, messages: [] });
        setReady(false);
        setError(messageOf(e));
      }
    }
  }, [room.id, search]);
  useEffect(() => {
    bump.current = () => void load();
    if (profile) {
      const id = setTimeout(bump.current, 180);
      return () => clearTimeout(id);
    }
  }, [load, profile]);
  useEffect(() => {
    let canceled = false;
    live.current = true;
    setReady(false);
    setError("");
    let stop: () => void = () => {};
    void rpc<Profile>("fb_room_join", { p_room: room.id })
      .then((p) => {
        if (canceled) return;
        setProfile(p);
        bump.current();
        const client = supabase!;
        const c = client
          .channel("focus-buddy-room:" + room.id, { config: { private: true } })
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "fb_room_updates",
              filter: `room=eq.${room.id}`,
            },
            () => bump.current(),
          )
          .subscribe();
        const poll = window.setInterval(() => {
          if (!document.hidden) bump.current();
        }, 15000);
        stop = () => {
          clearInterval(poll);
          void client.removeChannel(c);
        };
      })
      .catch((e) => {
        if (!canceled) setError(messageOf(e));
      });
    return () => {
      canceled = true;
      live.current = false;
      ++seq.current;
      stop();
    };
  }, [room.id, attempt]);
  async function action(work: () => Promise<unknown>, ok: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await work();
      if (live.current) {
        setNotice(ok);
        bump.current();
      }
    } catch (e) {
      if (live.current) setError(messageOf(e));
    } finally {
      busyRef.current = false;
      if (live.current) setBusy(false);
    }
  }
  function feedback(m: Message, a: string, value = "", ok = "Đã cập nhật.") {
    return action(
      () =>
        rpc("fb_room_feedback", {
          p_message: m.id,
          p_action: a,
          p_value: value,
        }),
      ok,
    );
  }
  async function exit() {
    try {
      await rpc("fb_room_leave", { p_room: room.id });
    } catch {
      /* Chỉ báo có mặt tự hết hạn sau hai phút. */
    }
    leave();
  }
  return (
    <section className="discussion-page">
      <button className="room-back" onClick={() => void exit()}>
        <ArrowLeft size={16} /> Rời phòng
      </button>
      <div className="discussion-room">
        <header className="discussion-room-head">
          <div>
            <h1>{room.name}</h1>
            <p>{room.description}</p>
            {ready && (
              <small>{feed.online} người vừa hoạt động trong 2 phút qua</small>
            )}
          </div>
        </header>
        {profile && (
          <ProfileEditor
            initial={profile}
            submit={(p) =>
              action(async () => {
                await rpc("fb_room_profile", {
                  p_alias: p.alias,
                  p_buddy: p.buddy,
                  p_theme: p.theme,
                  p_interest: p.interest,
                });
                setProfile(p);
              }, "Đã lưu hồ sơ phòng học.")
            }
          />
        )}
        <label className="room-search">
          Tìm trong phòng
          <input
            type="search"
            value={search}
            maxLength={80}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Từ khóa bài học"
          />
        </label>
        <div className="moderated-feed" aria-label="Tin nhắn trong phòng">
          {ready && !feed.messages.length && (
            <p>
              {search
                ? "Chưa có kết quả phù hợp."
                : "Chưa có tin nhắn. Bạn có thể gửi câu hỏi để người điều hành duyệt."}
            </p>
          )}
          {feed.messages.map((m) => (
            <article key={m.id} className={"room-post theme-" + m.theme}>
              <header>
                <span aria-hidden="true">{buddies[m.buddy]}</span>
                <b>{m.alias}</b>
                <time dateTime={m.created}>
                  {clock.format(new Date(m.created))}
                </time>
                {m.pinned && <Pin size={15} aria-label="Đã ghim" />}
              </header>
              {m.interest && <small>{m.interest}</small>}
              {m.reply && <blockquote>{m.reply}</blockquote>}
              <p>{m.body}</p>
              {m.state === "pending" ? (
                <small>Chờ người điều hành duyệt</small>
              ) : (
                <div className="room-tools">
                  {["🌱", "💡", "👏"].map((em, i) => (
                    <button
                      key={em}
                      disabled={busy}
                      aria-label={["Động viên", "Ý hay", "Vỗ tay"][i]}
                      aria-pressed={m.myReaction === em}
                      onClick={() =>
                        void feedback(m, "react", m.myReaction === em ? "" : em)
                      }
                    >
                      {em} {m.reactions[em] || ""}
                    </button>
                  ))}
                  <button onClick={() => setReply(m)}>Trả lời</button>
                  {!m.mine && (
                    <>
                      <button onClick={() => setReport(m.id)}>Báo cáo</button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void feedback(
                            m,
                            "block",
                            "",
                            "Đã chặn trao đổi với người gửi.",
                          )
                        }
                      >
                        Chặn người gửi
                      </button>
                    </>
                  )}
                  {status.moderator && (
                    <>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void action(
                            () =>
                              rpc("fb_moderate", {
                                p_message: m.id,
                                p_action: m.pinned ? "unpin" : "pin",
                              }),
                            "Đã đổi trạng thái ghim.",
                          )
                        }
                      >
                        {m.pinned ? "Bỏ ghim" : "Ghim"}
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void action(
                            () =>
                              rpc("fb_moderate", {
                                p_message: m.id,
                                p_action: "remove",
                              }),
                            "Đã gỡ tin.",
                          )
                        }
                      >
                        Gỡ tin
                      </button>
                    </>
                  )}
                </div>
              )}
              {m.mine && (
                <button
                  className="room-text-btn"
                  onClick={() =>
                    void action(
                      () => rpc("fb_room_delete", { p_message: m.id }),
                      "Đã xóa tin của bạn.",
                    )
                  }
                >
                  Xóa tin của tôi
                </button>
              )}
              {report === m.id && (
                <div className="room-tools">
                  <label>
                    Lý do{" "}
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    >
                      {Object.entries(reportReasons).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    disabled={busy}
                    onClick={() => {
                      void feedback(
                        m,
                        "report",
                        reason,
                        "Đã chuyển báo cáo cho người điều hành.",
                      );
                      setReport("");
                    }}
                  >
                    Gửi báo cáo
                  </button>
                  <button onClick={() => setReport("")}>Hủy</button>
                </div>
              )}
            </article>
          ))}
        </div>
        {!ready && (
          <button
            className="button secondary"
            onClick={() => setAttempt((a) => a + 1)}
          >
            Kết nối lại
          </button>
        )}
        <form
          className="public-composer"
          onSubmit={(e) => {
            e.preventDefault();
            void action(async () => {
              await rpc("fb_room_send", {
                p_room: room.id,
                p_body: draft,
                p_reply: reply?.id ?? null,
              });
              setDraft("");
              setReply(null);
            }, "Tin đã được gửi để duyệt.");
          }}
        >
          {reply && (
            <div>
              Trả lời {reply.alias}
              <button type="button" onClick={() => setReply(null)}>
                Hủy trả lời
              </button>
            </div>
          )}
          <label htmlFor="room-draft">Câu hỏi hoặc ý kiến học tập</label>
          <div>
            <input
              id="room-draft"
              maxLength={320}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={!ready || busy}
            />
            <button
              className="button primary"
              disabled={!ready || busy || !draft.trim()}
            >
              Gửi duyệt
            </button>
          </div>
        </form>
        <p role="alert" className="room-error">
          {error}
        </p>
        <p role="status">{notice}</p>
      </div>
      {status.moderator && <Moderation refresh={() => bump.current()} />}
      <details className="room-profile">
        <summary>Quyền riêng tư</summary>
        <p>
          Tin học tập được giữ tối đa 30 ngày. Lệnh xóa dữ liệu cộng đồng cũng
          xóa hồ sơ hiển thị, lượt tham gia và cảm xúc của bạn.
        </p>
        <button
          disabled={busy}
          onClick={() => {
            if (
              window.confirm(
                "Xóa tin nhắn, hồ sơ hiển thị và lượt tham gia cộng đồng của bạn?",
              )
            )
              void action(async () => {
                await rpc("fb_room_erase");
                leave();
              }, "Đã xóa.");
          }}
        >
          Xóa dữ liệu cộng đồng của tôi
        </button>
      </details>
    </section>
  );
}

export default function Discussion({
  openAccount,
}: {
  openAccount: () => void;
}) {
  const [status, setStatus] = useState<Status>(closed),
    [room, setRoom] = useState<Room | null>(null),
    [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    let disposed = false;
    let call = 0;
    async function update() {
      const n = ++call;
      try {
        const data = await rpc<Status>("fb_community_status");
        if (!disposed && n === call) setStatus(data);
      } catch {
        if (!disposed && n === call) setStatus(closed);
      }
    }
    void update();
    const { data } =
      supabase?.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT" || event === "SIGNED_IN") {
          setRoom(null);
          setStatus(closed);
          setTimeout(() => {
            if (!disposed) void update();
          }, 0);
        }
      }) ?? {};
    return () => {
      disposed = true;
      data?.subscription.unsubscribe();
    };
  }, []);
  if (room && status.enabled && status.verified)
    return (
      <StudyRoom
        key={room.id}
        room={room}
        status={status}
        leave={() => setRoom(null)}
      />
    );
  return (
    <div className="discussion-page">
      <header className="discussion-heading">
        <div>
          <Users size={23} />
          <h1>Phòng thảo luận</h1>
          <p>
            Chọn một chủ đề để tự học hoặc trao đổi trong phòng có người duyệt.
          </p>
        </div>
        <div className="talk-emblem" aria-hidden="true">
          <BookOpen />
          <MessageSquare />
        </div>
      </header>
      <aside className="room-guidance">
        <Shield size={22} />
        <div>
          <strong>
            {status.enabled ? "Nội quy phòng học" : "Góc học theo chủ đề"}
          </strong>
          <p>
            {!status.enabled
              ? "Phòng đang ở chế độ tự học. Mỗi chủ đề có một hoạt động để bắt đầu."
              : !status.verified
                ? "Đăng nhập bằng email đã xác minh trong Cài đặt để gửi bài cho người điều hành."
                : "Nội dung được người điều hành duyệt trước khi hiện cho bạn học."}{" "}
            Giữ riêng họ tên thật, trường lớp, địa chỉ và thông tin liên hệ. Tôn
            trọng người khác và dùng nút báo cáo khi cần.
          </p>
        </div>
      </aside>
      {status.enabled && !status.verified && (
        <button
          type="button"
          className="button secondary room-sign-in"
          onClick={openAccount}
        >
          Đăng nhập để thảo luận
        </button>
      )}
      <div className="discussion-topics">
        {status.rooms.map((topic) => (
          <article key={topic.id} className="topic-card">
            <span className="topic-icon">
              <BookOpen size={23} />
            </span>
            <div>
              <h2>{topic.name}</h2>
              <p>{topic.description}</p>
            </div>
            {status.enabled && status.verified ? (
              <button className="topic-join" onClick={() => setRoom(topic)}>
                Vào phòng <ArrowRight size={15} />
              </button>
            ) : (
              <button
                className="topic-join"
                aria-expanded={preview === topic.id}
                onClick={() =>
                  setPreview(preview === topic.id ? null : topic.id)
                }
              >
                {preview === topic.id ? "Thu gọn" : "Mở bài tự học"}{" "}
                <ArrowRight size={15} />
              </button>
            )}
            {preview === topic.id && (
              <p className="topic-exercise">
                {rooms.find((x) => x[0] === topic.id)?.[3] ??
                  "Chọn một câu hỏi muốn giải đáp và ghi lại những gì bạn đã biết."}
              </p>
            )}
          </article>
        ))}
      </div>
      <p className="room-policy">
        <Flag size={16} /> Bài đăng được kiểm duyệt; phòng học chỉ hỗ trợ văn
        bản và cảm xúc có sẵn.
      </p>
    </div>
  );
}

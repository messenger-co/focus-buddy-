import { locale } from "../foundation/language";
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { paletteLibrary } from "../foundation/themes";
import { NavLink } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  Coffee,
  Gamepad2,
  Headphones,
  Leaf,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Plus,
  Sparkles,
  Sprout,
  VolumeX,
  X,
} from "lucide-react";
import type { useBuddy } from "../state";
import {
  clockText,
  faceMs,
  plannedMs,
  planFor,
  focusModes,
  sessionMinutes,
  studyReward,
  studyWeek,
  elapsedMs,
  latestBreak,
  MINUTE,
  type FocusPlan,
} from "./model";
import {
  dress,
  studyTools,
  useWardrobe,
  type Wardrobe,
} from "../buddy3/wardrobe";
import {
  useFocusSettings,
  soundscapes,
  selectedPlan,
  type Soundscape,
} from "./settings";
import { useAmbience } from "./useAmbience";
import "./focus.css";
const Companion = lazy(() => import("../components/Companion"));
const formatDay = (d: string) =>
  new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(d + "T12:00:00Z"));
function NumberField({
  name,
  value,
  onSave,
  min,
  max,
}: {
  name: string;
  value: number;
  onSave: (n: number) => void;
  min: number;
  max: number;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const save = (v: string) => {
    const n = Number(v);
    if (v && Number.isInteger(n) && n >= min && n <= max) onSave(n);
  };
  return (
    <label className="f3-field">
      {name}
      <input
        type="number"
        min={min}
        max={max}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          save(e.target.value);
        }}
        onBlur={() => setDraft(String(value))}
      />
    </label>
  );
}
function NoteEditor({
  note,
  onEdit,
}: {
  note: string;
  onEdit: (s: string) => void;
}) {
  const [draft, setDraft] = useState(note);
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (document.activeElement !== input.current) setDraft(note);
  }, [note]);
  return (
    <textarea
      ref={input}
      value={draft}
      maxLength={1600}
      placeholder="Bạn đã hiểu thêm điều gì? Lần sau nên bắt đầu từ đâu?"
      onChange={(e) => {
        setDraft(e.target.value);
        onEdit(e.target.value);
      }}
    />
  );
}
export default function FocusPage({
  buddy,
  now,
  busy,
  start,
  cancel,
  finish,
}: {
  buddy: ReturnType<typeof useBuddy>;
  now: number;
  busy: boolean;
  start: (p: FocusPlan) => Promise<void>;
  cancel: () => Promise<void>;
  finish: () => Promise<void>;
}) {
  const [settings, write] = useFocusSettings(),
    audio = useAmbience(settings.volume);
  const { look } = useWardrobe();
  const [taskName, setTaskName] = useState(""),
    [confirm, setConfirm] = useState(false),
    [expanded, setExpanded] = useState(false),
    [feedback, setFeedback] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const rows = buddy.progress.focus_sessions,
    p = buddy.progress.profile;
  const active = rows.find((s) => s.status === "active"),
    rest = latestBreak(rows);
  const plan = selectedPlan(settings);
  const phase = active ? "study" : rest ? "rest" : "ready";
  const mode = active?.mode ?? plan.mode,
    watch = mode === "stopwatch",
    paused = !!active?.paused_at;
  const breakLeft = rest
    ? Math.max(0, Date.parse(rest.break_ends_at!) - now)
    : 0;
  const ms = active
    ? faceMs(active, now)
    : rest
      ? breakLeft
      : plan.minutes * MINUTE;
  const duration = active
    ? plannedMs(active)
    : rest
      ? (rest.break_minutes ?? 5) * MINUTE
      : plan.minutes * MINUTE;
  const ratio =
    watch && active
      ? (ms % MINUTE) / MINUTE
      : Math.max(0, Math.min(1, duration ? ms / duration : 0));
  const name = focusModes.find((item) => item.id === mode)?.name ?? "Tập trung";
  const currentDay = new Date(now + 7 * 60 * MINUTE).toISOString().slice(0, 10);
  const stats = useMemo(
    () => studyWeek(rows, Date.parse(currentDay + "T06:00:00Z")),
    [rows, currentDay],
  );
  const recent = rows.filter((s) => s.status === "completed").slice(0, 8);
  const report = (work: Promise<unknown>) => {
    void work.catch((e) =>
      setFeedback(e instanceof Error ? e.message : "Chưa lưu được thay đổi."),
    );
  };
  const dismiss = () => {
    if (rest) report(buddy.changeFocus(rest.id, "endBreak"));
  };
  function toggle() {
    if (busy) return;
    if (active) {
      report(buddy.changeFocus(active.id, paused ? "resume" : "pause"));
    } else if (rest) dismiss();
    else void start(plan);
  }
  async function full() {
    if (!root.current) return;
    if (expanded) {
      if (document.fullscreenElement)
        await document.exitFullscreen().catch(() => {});
      setExpanded(false);
    } else {
      try {
        if (root.current.requestFullscreen)
          await root.current.requestFullscreen();
      } catch {
        /* Dùng chế độ phủ toàn khung trên thiết bị di động. */
      }
      setExpanded(true);
    }
  }
  useEffect(() => {
    const changed = () => setExpanded(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (
        e.altKey ||
        e.metaKey ||
        e.ctrlKey ||
        e.repeat ||
        e.isComposing ||
        document.querySelector('[role="dialog"],dialog[open]') ||
        (e.target as HTMLElement)?.closest?.(
          "input,select,textarea,button,a,[contenteditable=true],summary",
        )
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.code === "KeyF") {
        e.preventDefault();
        void full();
      } else if (e.code === "Escape") {
        setExpanded(false);
        setConfirm(false);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  });
  useEffect(() => {
    if (paused || phase === "rest") audio.stop();
  }, [paused, phase, audio.stop]);
  const noteRow = active ?? rest ?? recent[0];
  const night =
    typeof window !== "undefined" &&
    (new Date(now).getHours() >= 19 ||
      new Date(now).getHours() < 7 ||
      paletteLibrary.some(([id, , , dark]) => id === p.theme && dark));
  return (
    <div
      ref={root}
      className={`focus3 ${expanded ? "f3-expanded" : ""}`}
      data-look={settings.look}
    >
      <header className="f3-heading">
        <div>
          <h1>Giờ tập trung</h1>
          <p>
            {active?.goal ||
              rest?.goal ||
              "Chọn một mục tiêu nhỏ, bật đồng hồ và tận hưởng khoảng thời gian của riêng bạn."}
          </p>
        </div>
        <button
          className="button secondary"
          onClick={() => void full()}
          aria-pressed={expanded}
        >
          {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          <span>{expanded ? "Thu nhỏ" : "Toàn màn hình"}</span>
        </button>
      </header>
      <div className="f3-grid">
        <section className="card f3-clock" data-phase={phase}>
          <div className="f3-clock-head">
            {rest ? <Coffee size={17} /> : <BookOpen size={17} />}
            <strong>{rest ? "Giờ nghỉ" : name}</strong>
            <span>
              {active
                ? paused
                  ? "Đã tạm dừng"
                  : "Đang học"
                : rest
                  ? breakLeft
                    ? "Đang nghỉ"
                    : "Đã nghỉ xong"
                  : "Sẵn sàng"}
            </span>
          </div>
          <div className="f3-dial">
            <svg viewBox="0 0 240 240" aria-hidden="true">
              <circle className="f3-track" cx="120" cy="120" r="106" />
              <circle
                className="f3-fill"
                cx="120"
                cy="120"
                r="106"
                pathLength="100"
                strokeDasharray="100"
                strokeDashoffset={100 * (1 - ratio)}
                transform="rotate(-90 120 120)"
              />
            </svg>
            <div>
              <span
                role="timer"
                className="f3-time"
                aria-label={`${watch && active ? "Thời gian đã học" : "Thời gian còn lại"} ${clockText(ms, watch && !!active)}`}
              >
                {clockText(ms, watch && !!active)}
              </span>
              <span>
                {rest
                  ? "Nghỉ giữa phiên"
                  : watch
                    ? "Thời gian đã học"
                    : "Phút và giây"}
              </span>
            </div>
          </div>
          <div className="f3-actions">
            {rest ? (
              <button className="button primary" onClick={dismiss}>
                <ArrowRight size={16} />
                {breakLeft > 0 ? "Trở lại bàn học" : "Chuẩn bị phiên tiếp"}
              </button>
            ) : (
              <button
                className="button primary"
                disabled={busy}
                onClick={toggle}
              >
                {active && !paused ? <Pause size={16} /> : <Play size={16} />}{" "}
                {active
                  ? paused
                    ? "Tiếp tục phiên học"
                    : "Tạm dừng phiên học"
                  : "Bắt đầu phiên tập trung"}
              </button>
            )}
            {active && (
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => (watch ? void finish() : setConfirm(true))}
              >
                {watch ? "Lưu thời gian học" : "Kết thúc sớm"}
              </button>
            )}
          </div>
          {confirm && active && (
            <div className="f3-confirm">
              <p>
                Kết thúc phiên sớm sẽ không cộng điểm. Ghi chú của bạn vẫn được
                lưu.
              </p>
              <button
                className="button secondary"
                onClick={() => setConfirm(false)}
              >
                Tiếp tục tập trung
              </button>{" "}
              <button
                className="button primary"
                onClick={() => {
                  setConfirm(false);
                  void cancel();
                }}
              >
                Kết thúc phiên
              </button>
            </div>
          )}
          {rest ? (
            <div className="f3-recess">
              <p>
                {breakLeft
                  ? "Bạn có thể đứng dậy, nhìn ra xa hoặc chơi một ván ngắn."
                  : "Đã tới giờ học tiếp. Bạn có thể bắt đầu khi sẵn sàng."}
              </p>
              <NavLink to="/tro-choi?ghim=1">
                <Bookmark size={15} />
                Trò chơi đã ghim
              </NavLink>
              {breakLeft > 0 && (
                <div>
                  <NavLink to="/tro-choi/noi-so">
                    <Gamepad2 size={15} />
                    Bước chân con số · 1 phút
                  </NavLink>
                  <NavLink to="/tro-choi/lat-the">
                    <Leaf size={15} />
                    Lật lá · 2 phút
                  </NavLink>
                </div>
              )}
            </div>
          ) : (
            <p className="f3-tip">
              {paused
                ? "Đồng hồ đứng yên cho tới khi bạn tiếp tục."
                : active
                  ? watch
                    ? "Lưu phiên khi học xong."
                    : "Phiên sẽ được khôi phục khi mở lại trang."
                  : watch
                    ? "Bấm giờ và tự kết thúc khi hoàn thành."
                    : `Hoàn thành phiên này nhận ${studyReward(plan.minutes * MINUTE)} điểm.`}
            </p>
          )}
          {!rest && (
            <NavLink className="focus-games-link" to="/tro-choi">
              <Gamepad2 size={16} />
              Chơi một ván tập trung
            </NavLink>
          )}
        </section>
        <aside className="card f3-friend">
          <Suspense fallback={<Sprout size={40} />}>
            <Companion
              kind={p.companion}
              color={p.color}
              accessory={p.accessory}
              size={180}
              paused={!!active}
              activity={
                rest
                  ? breakLeft > 0 && now - Date.parse(rest.completed_at!) < 6500
                    ? "celebrate"
                    : "stretch"
                  : "study"
              }
              night={night}
            />
          </Suspense>
          <h2>
            {rest
              ? "Đến lúc nghỉ ngơi một chút rồi"
              : active
                ? "Mình đang học cùng bạn"
                 : "Góc tập trung đang chờ bạn"}
          </h2>
          <p>
            {active && elapsedMs(active, now) >= 45 * MINUTE
              ? "Đã học được một lúc rồi. Hãy thả lỏng vai và nhìn xa một chút."
              : rest
                ? "Uống một ngụm nước và nghỉ mắt trước khi bắt đầu việc tiếp theo."
                : active?.goal || "Mỗi phiên chỉ cần một mục tiêu nhỏ."}
          </p>
          <label className="f3-field f3-study-tool">
            Dụng cụ khi học
            <select
              aria-label="Dụng cụ khi học"
              value={look.studyTool}
              onChange={(e) =>
                dress({ studyTool: e.target.value as Wardrobe["studyTool"] })
              }
            >
              {Object.entries(studyTools).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <div className="f3-sound">
            <label className="f3-field">
              Âm thanh nền
              <select
                aria-label="Âm thanh nền"
                value={settings.sound}
                onChange={(e) => {
                  const sound = e.target.value as Soundscape;
                  write({ sound });
                  void audio.play(sound);
                }}
              >
                {Object.entries(soundscapes).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {settings.sound !== "off" && (
              <button
                aria-label={
                  audio.playing ? "Tắt âm thanh nền" : "Phát âm thanh nền"
                }
                className="f3-icon"
                onClick={() =>
                  audio.playing ? audio.stop() : void audio.play(settings.sound)
                }
              >
                {audio.playing ? (
                  <VolumeX size={18} />
                ) : (
                  <Headphones size={18} />
                )}
              </button>
            )}
          </div>
          {settings.sound !== "off" && (
            <label className="f3-volume">
              <span>Âm lượng</span>
              <output aria-hidden="true">{settings.volume}%</output>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={settings.volume}
                aria-label="Âm lượng nền"
                aria-valuetext={settings.volume + "%"}
                onChange={(e) => write({ volume: Number(e.target.value) })}
              />
            </label>
          )}
          {audio.error && <p role="status">{audio.error}</p>}
        </aside>
      </div>
      {!expanded && (
        <>
          <section className="card f3-plan">
            <h2>Thiết lập phiên học</h2>
            <fieldset disabled={!!active || !!rest}>
              <div className="f3-fields">
                <label className="f3-field">
                  Chế độ học
                  <select
                    value={settings.mode}
                    onChange={(e) =>
                      write({ mode: planFor(e.target.value).mode })
                    }
                  >
                    {focusModes.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                        {m.minutes > 0 && m.id !== "custom"
                          ? ` · ${m.minutes} phút`
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>
                {settings.mode === "custom" && (
                  <NumberField
                    name="Thời lượng (phút)"
                    value={settings.custom}
                    min={1}
                    max={180}
                    onSave={(custom) => write({ custom })}
                  />
                )}
                <NumberField
                  name="Thời gian nghỉ (phút)"
                  value={settings.breakMinutes}
                  min={0}
                  max={60}
                  onSave={(breakMinutes) => write({ breakMinutes })}
                />
                <label className="f3-field">
                  Gắn việc học
                  <select
                    value={settings.task}
                    onChange={(e) => write({ task: e.target.value })}
                  >
                    <option value="">Tự đặt mục tiêu</option>
                    {settings.tasks
                      .filter((t) => !t.done || t.id === settings.task)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="f3-field f3-wide">
                  Mục tiêu của phiên
                  <input
                    maxLength={180}
                    value={settings.goal}
                    placeholder={
                      plan.goal || "Ví dụ: đọc chương 2 và ghi ba ý chính"
                    }
                    onChange={(e) => write({ goal: e.target.value })}
                  />
                </label>
              </div>
            </fieldset>
            <div className="f3-looks" aria-label="Màu mặt đồng hồ">
              <span>Viền đồng hồ</span>
              {(
                [
                  ["leaf", "Lá non"],
                  ["ocean", "Nước biển"],
                  ["dusk", "Hoàng hôn"],
                ] as const
              ).map(([id, n]) => (
                <button
                  key={id}
                  className="f3-swatch"
                  data-color={id}
                  aria-label={n}
                  aria-pressed={settings.look === id}
                  onClick={() => write({ look: id })}
                >
                  {settings.look === id && <Check size={14} />}
                </button>
              ))}
            </div>
          </section>
          <div className="f3-lower">
            <section className="card f3-week">
              <h2>Bảy ngày học tập</h2>
              <p>
                {stats.total} phút trong tuần · {stats.streak} ngày học liên
                tiếp
              </p>
              <div className="f3-bars" aria-label="Số phút học theo ngày">
                {stats.days.map((d) => (
                  <div
                    key={d.day}
                    title={`${formatDay(d.day)} · ${d.minutes} phút`}
                  >
                    <b>{d.minutes}</b>
                    <i
                      style={
                        {
                          "--bar": `${Math.min(100, (100 * d.minutes) / Math.max(settings.dayGoal, ...stats.days.map((x) => x.minutes)))}%`,
                        } as CSSProperties
                      }
                    />
                    <small>{formatDay(d.day).slice(0, 2)}</small>
                  </div>
                ))}
              </div>
              <div className="f3-target">
                <span>
                  Hôm nay{" "}
                  <strong>
                    {stats.days[6].minutes}/{settings.dayGoal} phút
                  </strong>
                </span>
                <progress
                  value={stats.days[6].minutes}
                  max={settings.dayGoal}
                />
                <span>
                  Bảy ngày{" "}
                  <strong>
                    {stats.total}/{settings.weekGoal} phút
                  </strong>
                </span>
                <progress value={stats.total} max={settings.weekGoal} />
              </div>
              <details>
                <summary>Điều chỉnh mục tiêu</summary>
                <div className="f3-fields">
                  <NumberField
                    name="Phút mỗi ngày"
                    value={settings.dayGoal}
                    min={1}
                    max={480}
                    onSave={(dayGoal) => write({ dayGoal })}
                  />
                  <NumberField
                    name="Phút mỗi tuần"
                    value={settings.weekGoal}
                    min={1}
                    max={3360}
                    onSave={(weekGoal) => write({ weekGoal })}
                  />
                </div>
              </details>
            </section>
            <section className="card f3-tasks">
              <h2>Việc học của bạn</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const title = taskName.trim();
                  if (!title || settings.tasks.length >= 80) return;
                  const id = crypto.randomUUID();
                  write({
                    tasks: [...settings.tasks, { id, title, done: false }],
                    ...(!active && !rest ? { task: id } : {}),
                  });
                  setTaskName("");
                }}
              >
                <input
                  aria-label="Việc học mới"
                  maxLength={100}
                  placeholder="Thêm việc cho phiên sau"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                />
                <button
                  className="f3-icon"
                  aria-label="Thêm việc học"
                  disabled={!taskName.trim() || settings.tasks.length >= 80}
                >
                  <Plus size={18} />
                </button>
              </form>
              <ul>
                {settings.tasks.map((t) => (
                  <li key={t.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={() =>
                          write({
                            tasks: settings.tasks.map((item) =>
                              item.id === t.id
                                ? { ...item, done: !item.done }
                                : item,
                            ),
                            ...(settings.task === t.id && !t.done
                              ? { task: "" }
                              : {}),
                          })
                        }
                      />
                      {t.title}
                    </label>
                    <button
                      className="f3-icon"
                      aria-label={`Xóa việc ${t.title}`}
                      onClick={() =>
                        write({
                          tasks: settings.tasks.filter((x) => x.id !== t.id),
                          ...(settings.task === t.id ? { task: "" } : {}),
                        })
                      }
                    >
                      <X size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          {noteRow && (
            <section className="card f3-notes">
              <h2>Nhật ký phiên học</h2>
              <label className="f3-field">
                {active
                  ? "Ghi chú cho phiên đang học"
                  : "Ghi chú cho phiên vừa xong"}
                <NoteEditor
                  key={noteRow.id}
                  note={noteRow.note ?? ""}
                  onEdit={(text) =>
                    report(buddy.saveSessionNote(noteRow.id, text))
                  }
                />
              </label>
              {recent.length > 0 && (
                <details>
                  <summary>Các phiên gần đây</summary>
                  <ul>
                    {recent.map((s) => (
                      <li key={s.id}>
                        <CheckCircle2 size={16} />
                        <div>
                          <strong>
                            {s.goal ||
                              focusModes.find(
                                (m) => m.id === (s.mode ?? "classic"),
                              )?.name}
                          </strong>
                          <small>
                            {new Date(
                              s.completed_at ?? s.ends_at,
                            ).toLocaleDateString("vi-VN")}{" "}
                            · {sessionMinutes(s)} phút
                          </small>
                          {s.note && <p>{s.note}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </section>
          )}
          <p className="f3-shortcuts">
            <Sparkles size={14} />
            Phím cách để bắt đầu hoặc tạm dừng · F để toàn màn hình
          </p>
        </>
      )}
      {feedback && <p role="status">{feedback}</p>}
    </div>
  );
}

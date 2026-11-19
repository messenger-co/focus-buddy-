import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import {
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Flame,
  Flower2,
  Gamepad2,
  Headphones,
  Puzzle,
  MessagesSquare,
  Heart,
  Home,
  Leaf,
  LoaderCircle,
  Menu,
  Moon,
  Play,
  Settings,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import FocusPage from "./focus3/FocusPage";
import {
  clockText,
  elapsedMs,
  faceMs,
  latestBreak,
  sessionMinutes,
  studyReward,
  type FocusPlan,
} from "./focus3/model";
import { useBuddy, vietnamDay } from "./state";
import Assistant from "./ai3/Assistant";
import {
  COMPANIONS,
  EXERCISES,
  type CompanionKind,
  type CompanionColor,
  type Mood,
} from "./data";
import { Palette, Box as BoxIcon } from "lucide-react";
import { MotionConfig } from "motion/react";
import { palette, paletteLibrary } from "./foundation/themes";
import { useAppearance } from "./foundation/appearance";
import { english as inEnglish } from "./foundation/language";
import Boundary from "./foundation/Boundary";
import StudyNook from "./foundation/StudyNook";
import { russianShortcut } from "./easterEgg/russianShortcut";
const ThemeStudio = lazy(() => import("./foundation/ThemeStudio"));
const World = lazy(() => import("./world3/World"));
const Journal = lazy(() => import("./foundation/Journal"));
const Games = lazy(() => import("./games/Games"));
const Music = lazy(() => import("./music/Music"));
const Challenges = lazy(() => import("./challenges/Challenges"));
const Discussion = lazy(() => import("./discussion/Discussion"));
const BuddyStudio = lazy(() => import("./components/BuddyStudio"));
const Companion = lazy(() => import("./components/Companion"));
const RussianEgg = lazy(() => import("./easterEgg/RussianEgg"));
type Buddy = ReturnType<typeof useBuddy>;
const navItems = [
  { to: "/", icon: Home, label: "Góc của bạn" },
  { to: "/tap-trung", icon: Clock3, label: "Giờ tập trung" },
  { to: "/nhiem-vu", icon: BookOpen, label: "Nhiệm vụ học tập" },
  { to: "/ban-dong-hanh", icon: Heart, label: "Bạn đồng hành" },
  { to: "/tro-choi", icon: Gamepad2, label: "Trò chơi tập trung" },
  { to: "/the-gioi-3d", icon: BoxIcon, label: "Phòng học 3D" },
  { to: "/giao-dien", icon: Palette, label: "Xưởng giao diện" },
  { to: "/thu-thach", icon: Puzzle, label: "20 phút thử thách" },
  { to: "/am-nhac", icon: Headphones, label: "Góc âm nhạc" },
  { to: "/thao-luan", icon: MessagesSquare, label: "Phòng thảo luận" },
  { to: "/hanh-trinh", icon: TrendingUp, label: "Hành trình của bạn" },
];
const number = (n: number) => n.toLocaleString("vi-VN");
const today = () => vietnamDay();
function useNow(ticking: boolean) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const id = setInterval(update, ticking ? 1000 : 60_000);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", update);
    };
  }, [ticking]);
  return now;
}
function timerText(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
function BuddyArt({
  buddy,
  sleepy = false,
  size = 250,
}: {
  buddy: Buddy;
  sleepy?: boolean;
  size?: number;
}) {
  return (
    <Suspense
      fallback={
        <div className="art-placeholder">
          <Sprout size={56} />
        </div>
      }
    >
      <Companion
        kind={buddy.progress.profile.companion as CompanionKind}
        color={buddy.progress.profile.color as CompanionColor}
        accessory={buddy.progress.profile.accessory}
        paused={buddy.progress.focus_sessions.some(
          (s) => s.status === "active",
        )}
        sleepy={sleepy}
        size={size}
      />
    </Suspense>
  );
}
function Modal({
  title,
  children,
  close,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input, textarea, a[href], [tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className={`modal ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
      >
        <header className="modal-head">
          <h2>{title}</h2>
          <button className="icon-button" aria-label="Đóng" onClick={close}>
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
function App() {
  const buddy = useBuddy();
  const appearance = useAppearance();
  const dark = Boolean(
    paletteLibrary.find((t) => t[0] === buddy.progress.profile.theme)?.[3],
  );
  useEffect(() => {
    document.documentElement.dataset.motion = appearance.motion;
    document.documentElement.dataset.palette = dark ? "dark" : "light";
  }, [appearance.motion, dark]);
  const navigate = useNavigate();
  const location = useLocation();
  const [menu, setMenu] = useState(false);
  const [settings, setSettings] = useState(false);
  const [chat, setChat] = useState(false);
  const [russianEgg, setRussianEgg] = useState(false);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!russianShortcut(event)) return;
      event.preventDefault();
      event.stopPropagation();
      // Never persist: reload always exits this Easter egg.
      setRussianEgg(true);
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, []);
  const [sleepy, setSleepy] = useState(false);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const completed = useRef("");
  const active = buddy.progress.focus_sessions.find(
    (s) => s.status === "active",
  );
  const rest = latestBreak(buddy.progress.focus_sessions);
  const now = useNow(
    Boolean(
      (active && !active.paused_at) ||
      (rest && Date.parse(rest.break_ends_at!) > Date.now()),
    ),
  );
  const remaining = active ? faceMs(active, now) : 1200000;
  const restLeft = rest
    ? Math.max(0, Date.parse(rest.break_ends_at!) - now)
    : 0;
  const notifiedBreak = useRef("");
  useEffect(() => {
    if (!rest || restLeft > 0 || notifiedBreak.current === rest.id) return;
    notifiedBreak.current = rest.id;
    if (now - Date.parse(rest.break_ends_at!) < 60000)
      setToast("Giờ nghỉ đã kết thúc. Bàn học đang chờ bạn.");
  }, [rest?.id, restLeft]);
  const act = async (fn: () => Promise<unknown>, message?: string) => {
    setBusy(true);
    try {
      await fn();
      if (message) setToast(message);
    } catch (e) {
      setToast(
        e instanceof Error ? e.message : "Chưa thể hoàn tất. Bạn thử lại nhé.",
      );
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    setMenu(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 6500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (
      active &&
      !active.paused_at &&
      active.mode !== "stopwatch" &&
      remaining <= 0 &&
      completed.current !== active.id
    ) {
      completed.current = active.id;
      void act(
        () => buddy.completeFocus(),
        `Đã hoàn thành phiên học · +${studyReward(elapsedMs(active, now))} điểm.`,
      );
    }
  }, [active?.id, remaining]);
  const startWithPlan = (plan?: FocusPlan) =>
    act(async () => {
      await buddy.startFocus(plan);
      setSleepy(false);
      navigate("/tap-trung");
    });
  const start = () => startWithPlan();
  const checkIn = (mood: Mood) =>
    act(
      () => buddy.checkIn(mood),
      mood === "tired"
        ? "Cảm ơn bạn đã chia sẻ. Mình sẽ cùng bạn đi chậm lại."
        : "Đã lưu cảm xúc hôm nay. Thêm 10 điểm cho bạn!",
    );
  const page =
    navItems.find(
      (item) =>
        item.to === location.pathname ||
        (item.to !== "/" && location.pathname.startsWith(item.to + "/")),
    )?.label || "Góc của bạn";
  return (
    <MotionConfig
      reducedMotion={
        appearance.motion === "off" || appearance.motion === "minimal"
          ? "always"
          : "user"
      }
    >
      <div
        data-theme={buddy.progress.profile.theme}
        data-easter={russianEgg ? "russian" : undefined}
        data-palette={dark ? "dark" : "light"}
        data-motion={appearance.motion}
        data-backdrop={appearance.backdrop}
        style={
          palette(
            buddy.progress.profile.theme,
            appearance.accent,
          ) as CSSProperties
        }
        className={`app ${active ? "focus-active" : ""}`}
      >
        <a
          className="skip-link"
          href="#main-content"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("main-content")?.focus();
          }}
        >
          Bỏ qua điều hướng
        </a>
        {menu && (
          <button
            className="sidebar-scrim"
            aria-label="Đóng trình đơn"
            onClick={() => setMenu(false)}
          />
        )}
        <aside className={`sidebar ${menu ? "sidebar-open" : ""}`}>
          <NavLink to="/" className="brand">
            <span className="brand-mark">
              <Sprout size={25} />
            </span>
            <span>
              Bạn Đồng Hành<small>CÙNG BẠN MỖI NGÀY</small>
            </span>
          </NavLink>
          <div className="sidebar-label">KHÔNG GIAN HỌC TẬP</div>
          <nav aria-label="Điều hướng chính">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "selected" : ""}`
                }
              >
                <Icon size={19} strokeWidth={1.7} />
                <span>{label}</span>
                {to === "/tap-trung" && active && <span className="live-dot" />}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="gentle-note">
              <Flower2 size={24} />
              <p>
                Mỗi bước nhỏ đều
                <br />
                là một bước tiến.
              </p>
              <span>Bạn đang làm rất tốt rồi.</span>
            </div>
            <button className="nav-item" onClick={() => setSettings(true)}>
              <Settings size={19} />
              <span>Cài đặt & tài khoản</span>
            </button>
            <div className="sidebar-profile">
              <span className="avatar">
                <Leaf size={21} />
              </span>
              <div>
                <strong>{buddy.progress.profile.display_name}</strong>
                <small>
                  Cấp {buddy.progress.profile.level} · Mầm nhỏ chăm chỉ
                </small>
              </div>
              <button
                className="icon-button"
                aria-label="Mở tài khoản"
                onClick={() => setSettings(true)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="icon-button mobile-menu"
                aria-label="Mở trình đơn"
                onClick={() => setMenu(true)}
              >
                <Menu size={21} />
              </button>
              <span>Không gian học tập</span>
              <ChevronRight size={14} />
              <strong>{page}</strong>
            </div>
            <div className="topbar-right">
              <span
                className={`mode-tag ${buddy.mode === "online" ? "online" : ""}`}
              >
                <span />
                Lưu trên thiết bị
              </span>
              <button
                className="avatar small"
                onClick={() => setSettings(true)}
                aria-label="Tài khoản của bạn"
              >
                <Leaf size={17} />
              </button>
            </div>
          </header>
          <main id="main-content" tabIndex={-1}>
            {buddy.loading && (
              <div className="inline-notice">
                <LoaderCircle size={16} className="spin" /> Đang tải góc học tập
                của bạn…
              </div>
            )}
            {buddy.error && (
              <div className="inline-notice error" role="alert">
                {buddy.error}
              </div>
            )}
            <Boundary key={location.pathname}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <Dashboard
                      buddy={buddy}
                      now={now}
                      sleepy={sleepy}
                      setSleepy={setSleepy}
                      busy={busy}
                      start={start}
                      checkIn={checkIn}
                      remaining={remaining}
                      openChat={() => setChat(true)}
                    />
                  }
                />
                <Route
                  path="/tap-trung"
                  element={
                    <FocusPage
                      buddy={buddy}
                      now={now}
                      busy={busy}
                      start={startWithPlan}
                      cancel={() =>
                        act(
                          () => buddy.cancelFocus(),
                          "Phiên đã kết thúc. Hãy quay lại khi bạn sẵn sàng.",
                        )
                      }
                      finish={() =>
                        act(
                          () => buddy.completeFocus(),
                          "Đã lưu phiên tập trung.",
                        )
                      }
                    />
                  }
                />
                <Route
                  path="/nhiem-vu"
                  element={<MissionsPage buddy={buddy} busy={busy} />}
                />
                <Route
                  path="/ban-dong-hanh"
                  element={
                    <Suspense
                      fallback={
                        <div className="inline-notice">
                          Đang mở khu vườn của bạn…
                        </div>
                      }
                    >
                      <BuddyStudio
                        profile={buddy.progress.profile}
                        paused={!!active}
                        onSave={(changes) =>
                          buddy.savePreferences({
                            ...buddy.progress.profile,
                            ...changes,
                          })
                        }
                      />
                    </Suspense>
                  }
                />
                <Route
                  path="/tro-choi/:slug?"
                  element={
                    <Suspense fallback={<p>Đang mở trò chơi…</p>}>
                      <>
                        {rest && (
                          <NavLink className="f3-break-banner" to="/tap-trung">
                            <Clock3 size={17} />
                            {restLeft > 0
                              ? `Giờ nghỉ còn ${clockText(restLeft)}`
                              : "Hết giờ nghỉ. Trở lại bàn học"}
                            <ArrowRight size={16} />
                          </NavLink>
                        )}
                        <Games
                          profile={buddy.progress.profile}
                          countdown={
                            active
                              ? clockText(
                                  remaining,
                                  active.mode === "stopwatch",
                                )
                              : null
                          }
                        />
                      </>
                    </Suspense>
                  }
                />
                <Route
                  path="/thu-thach"
                  element={
                    <Suspense fallback={<p>Đang mở thử thách…</p>}>
                      <Challenges />
                    </Suspense>
                  }
                />
                <Route
                  path="/am-nhac"
                  element={
                    <Suspense fallback={<p>Đang mở góc âm nhạc…</p>}>
                      <Music />
                    </Suspense>
                  }
                />
                <Route
                  path="/thao-luan"
                  element={
                    <Suspense fallback={<p>Đang mở phòng thảo luận…</p>}>
                      <Discussion />
                    </Suspense>
                  }
                />
                <Route
                  path="/hanh-trinh"
                  element={<ProgressPage buddy={buddy} />}
                />
                <Route
                  path="/giao-dien"
                  element={
                    <Suspense fallback={<p>Đang tải giao diện…</p>}>
                      <ThemeStudio
                        theme={buddy.progress.profile.theme}
                        onTheme={(theme) =>
                          act(() =>
                            buddy.savePreferences({
                              ...buddy.progress.profile,
                              theme,
                            }),
                          )
                        }
                      />
                    </Suspense>
                  }
                />
                <Route
                  path="/the-gioi-3d/*"
                  element={
                    <Suspense fallback={<p>Đang mở phòng học…</p>}>
                      <World profile={buddy.progress.profile} />
                    </Suspense>
                  }
                />
                <Route
                  path="*"
                  element={
                    <div className="empty-state">
                      <Sprout size={40} />
                      <h1>Về góc học tập của bạn nhé</h1>
                      <p>
                        Trang này chưa có. Những điều thú vị vẫn đang chờ bạn ở
                        trang chính.
                      </p>
                      <NavLink className="button primary" to="/">
                        Trở về
                      </NavLink>
                    </div>
                  }
                />
              </Routes>
            </Boundary>
            <footer className="page-footer">
              <Sprout size={14} />
              <span>
                Không cần hoàn hảo. Chỉ cần tiến bộ hơn một chút mỗi ngày.
              </span>
              <span className="footer-version">Focus Buddy · 3.0</span>
            </footer>
          </main>
        </div>
        {!chat &&
          !location.pathname.startsWith("/the-gioi-3d") &&
          location.pathname !== "/thao-luan" &&
          !location.pathname.startsWith("/tro-choi/") && (
            <button className="chat-launch" onClick={() => setChat(true)}>
              <Sparkles size={18} />
              <span>Trò chuyện cùng bạn</span>
            </button>
          )}
        {toast && (
          <div className="toast" role="status">
            <CheckCheck size={20} />
            <span>{toast}</span>
            <button
              className="icon-button"
              aria-label="Đóng thông báo"
              onClick={() => setToast("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {settings && (
          <SettingsModal buddy={buddy} close={() => setSettings(false)} />
        )}
        {chat && <ChatModal buddy={buddy} close={() => setChat(false)} />}
        {russianEgg && (
          <Suspense fallback={<div className="russian-egg-loading" role="status">Открываем секретный режим…</div>}>
            <RussianEgg profile={buddy.progress.profile} close={() => setRussianEgg(false)} />
          </Suspense>
        )}
      </div>
    </MotionConfig>
  );
}
function PageTitle({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
function Dashboard({
  buddy,
  now,
  sleepy,
  setSleepy,
  busy,
  start,
  checkIn,
  remaining,
  openChat,
}: {
  buddy: Buddy;
  now: number;
  sleepy: boolean;
  setSleepy: (v: boolean) => void;
  busy: boolean;
  start: () => void;
  checkIn: (m: Mood) => void;
  remaining: number;
  openChat: () => void;
}) {
  const navigate = useNavigate();
  const active = buddy.progress.focus_sessions.find(
    (s) => s.status === "active",
  );
  const sessions = buddy.progress.focus_sessions.filter(
    (s) => s.status === "completed",
  );
  const mood = buddy.progress.check_ins.find((c) => c.day === today());
  const visibleWidgets = useAppearance().widgets.join(" ");
  const companionName =
    buddy.progress.profile.buddy_name ||
    COMPANIONS.find((c) => c.id === buddy.progress.profile.companion)?.name ||
    "Cáo Mây";
  return (
    <>
      <PageTitle
        eyebrow="MỘT NGÀY MỚI, MỘT KHỞI ĐẦU NHỎ"
        title={`${inEnglish ? "Hello" : "Chào"} ${buddy.progress.profile.display_name},`}
        description="Hôm nay, mình cùng tiến bộ một chút nhé."
      >
        <div className="date-chip">
          <Sun size={17} />
          {new Intl.DateTimeFormat("vi-VN", {
            weekday: "long",
            day: "numeric",
            month: "numeric",
            timeZone: "Asia/Ho_Chi_Minh",
          }).format(new Date(now))}
        </div>
      </PageTitle>
      <div className="stats-row">
        <Stat
          icon={<Flame size={21} />}
          label="Ngày đã điểm danh"
          value={number(
            buddy.progress.counts?.checkin ?? buddy.progress.check_ins.length,
          )}
          unit="ngày"
          color="peach"
        />
        <Stat
          icon={<Clock3 size={21} />}
          label="Thời gian đã tập trung"
          value={number(
            sessions.reduce((sum, s) => sum + sessionMinutes(s), 0),
          )}
          unit="phút"
          color="mint"
        />
        <Stat
          icon={<Sparkles size={21} />}
          label="Điểm kinh nghiệm"
          value={number(buddy.progress.profile.total_xp)}
          unit="điểm"
          color="lavender"
        />
      </div>
      <div className="desk-links">
        <NavLink to="/the-gioi-3d">
          <BoxIcon size={18} /> Khám phá phòng 3D <ChevronRight size={15} />
        </NavLink>
        <NavLink to="/ban-dong-hanh">
          <Heart size={18} /> Ghé xưởng Buddy <ChevronRight size={15} />
        </NavLink>
        <NavLink to="/giao-dien">
          <Palette size={18} /> Đổi giao diện <ChevronRight size={15} />
        </NavLink>
      </div>
      <div className="dashboard-grid" data-widgets={visibleWidgets}>
        <div className="dashboard-main">
          <section className="focus-hero">
            <div className="hero-copy">
              <span className="hero-label">
                <span className="live-dot" />
                {active
                  ? "PHIÊN TẬP TRUNG ĐANG DIỄN RA"
                  : "DÀNH MỘT KHOẢNG NHỎ CHO BẠN"}
              </span>
              <h2>
                {active ? (
                  <>
                    Bạn đang làm tốt lắm.
                    <br />
                    Cứ tiếp tục nhé.
                  </>
                ) : (
                  <>
                    Chỉ 20 phút,
                    <br />
                    một bước tiến mới.
                  </>
                )}
              </h2>
              <p>
                {active
                  ? active.mode === "stopwatch"
                    ? `Đã học ${clockText(remaining, true)} trong phiên bấm giờ.`
                    : `Còn ${timerText(remaining)} để hoàn thành mục tiêu hôm nay.`
                  : "Gác lại những xao nhãng. Cùng người bạn nhỏ hoàn thành điều bạn muốn làm."}
              </p>
              <button
                disabled={busy}
                className="button primary"
                onClick={active ? () => navigate("/tap-trung") : start}
              >
                <Play size={16} fill="currentColor" />
                {active ? "Trở lại phiên tập trung" : "Bắt đầu tập trung"}
                <ArrowRight size={17} />
              </button>
              <span className="hero-reward">
                <Sparkles size={13} /> Hoàn thành phiên · +50 điểm
              </span>
            </div>
            <StudyNook>
              <BuddyArt buddy={buddy} sleepy={sleepy} size={190} />
            </StudyNook>
          </section>
          <section className="card missions-card">
            <div className="section-heading">
              <div>
                <span className="section-kicker">TỪNG BƯỚC NHỎ</span>
                <h2>Nhiệm vụ khởi đầu</h2>
              </div>
              <NavLink className="text-link" to="/nhiem-vu">
                Xem tất cả <ArrowRight size={15} />
              </NavLink>
            </div>
            <MissionRows buddy={buddy} />
          </section>
          <section className="daily-thought">
            <span className="quote-mark">“</span>
            <div>
              <span>MỘT LỜI NHẮN NHỎ</span>
              <p>Chậm cũng được, miễn là bạn vẫn bước tiếp.</p>
            </div>
            <Flower2 size={32} strokeWidth={1.2} />
          </section>
        </div>
        <div className="dashboard-side">
          <section className="card friend-card">
            <div className="section-heading">
              <h2>Bạn nhỏ của bạn</h2>
              <NavLink
                to="/ban-dong-hanh"
                className="icon-button"
                aria-label="Tùy chỉnh bạn đồng hành"
              >
                <Settings size={17} />
              </NavLink>
            </div>
            <div className="friend-scene">
              <div className="friend-halo" />
              <BuddyArt buddy={buddy} sleepy={sleepy} size={210} />
              <span className="friend-plant">
                <Sprout size={27} />
              </span>
            </div>
            <h3>
              {companionName}
              <span className="tiny-tag">
                Cấp {buddy.progress.profile.level}
              </span>
            </h3>
            <p>
              {sleepy
                ? "Mình nghỉ một chút rồi cùng học tiếp nhé."
                : active
                  ? "Mình sẽ yên lặng ở đây cùng bạn."
                  : "Mình sẵn sàng đồng hành cùng bạn rồi!"}
            </p>
            <div className="xp-label">
              <span>
                <Leaf size={12} /> Cùng nhau lớn lên
              </span>
              <strong>{buddy.progress.profile.total_xp % 100}/100 điểm</strong>
            </div>
            <div className="progress-track">
              <span
                style={{ width: `${buddy.progress.profile.total_xp % 100}%` }}
              />
            </div>
            <button className="friend-rest" onClick={() => setSleepy(!sleepy)}>
              {sleepy ? <Sun size={15} /> : <Moon size={15} />}
              {sleepy ? "Chào ngày mới" : "Cho bạn nhỏ nghỉ ngơi"}
            </button>
          </section>
          <section className="card mood-card">
            <span className="section-kicker">LẮNG NGHE BẢN THÂN</span>
            <h2>Hôm nay bạn thấy sao?</h2>
            <p>
              {mood
                ? "Cảm xúc của bạn đã được ghi nhận hôm nay."
                : "Cảm xúc nào cũng xứng đáng được lắng nghe."}
            </p>
            <div className="mood-options">
              {(
                [
                  { id: "great", emoji: "☺", label: "Rất vui" },
                  { id: "okay", emoji: "◡", label: "Bình thường" },
                  { id: "tired", emoji: "☾", label: "Hơi mệt" },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  className={`mood-option ${mood?.mood === m.id ? "chosen" : ""}`}
                  disabled={!!mood || busy}
                  onClick={() => checkIn(m.id)}
                >
                  <span className={`mood-face ${m.id}`}>{m.emoji}</span>
                  {m.label}
                  {mood?.mood === m.id && <Check size={12} />}
                </button>
              ))}
            </div>
          </section>
          <button className="assistant-card" onClick={openChat}>
            <span>
              <Sparkles size={21} />
            </span>
            <div>
              <strong>Cần một chút gợi ý?</strong>
              <small>Cùng trò chuyện, cùng gỡ rối.</small>
            </div>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </>
  );
}
function Stat({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <div className="stat-card">
      <span className={`stat-icon ${color}`}>{icon}</span>
      <div>
        <span className="stat-label">{label}</span>
        <strong>
          {value} <small>{unit}</small>
        </strong>
      </div>
      <span className="stat-detail">
        <TrendingUp size={15} />
      </span>
    </div>
  );
}
function MissionRows({ buddy }: { buddy: Buddy }) {
  const navigate = useNavigate();
  return (
    <div className="mission-list">
      {buddy.progress.missions.map((mission, i) => (
        <button
          className="mission-row"
          key={mission.id}
          onClick={() =>
            navigate(
              mission.id === "focus-first"
                ? "/tap-trung"
                : mission.id === "checkin-first"
                  ? "/"
                  : "/nhiem-vu",
            )
          }
        >
          <span
            className={`mission-icon ${["mint", "lavender", "peach"][i % 3]}`}
          >
            {mission.completed ? (
              <Check size={21} />
            ) : i === 0 ? (
              <Clock3 size={21} />
            ) : i === 1 ? (
              <BookOpen size={21} />
            ) : (
              <Heart size={21} />
            )}
          </span>
          <div>
            <strong>{mission.title}</strong>
            <span>{mission.description}</span>
          </div>
          <span className={`reward-tag ${mission.completed ? "done" : ""}`}>
            {mission.completed ? "Đã hoàn thành" : `+${mission.reward_xp} điểm`}
          </span>
          <ChevronRight size={15} />
        </button>
      ))}
    </div>
  );
}
function MissionsPage({ buddy }: { buddy: Buddy; busy: boolean }) {
  const [exercise, setExercise] = useState<(typeof EXERCISES)[number] | null>(
    null,
  );
  const [choice, setChoice] = useState<number | null>(null);
  const [result, setResult] = useState<{
    correct: boolean;
    awarded_xp: number;
    explanation: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    if (!exercise || choice === null) return;
    setSubmitting(true);
    setError("");
    try {
      setResult(await buddy.submitExercise(exercise.id, choice));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <>
      <PageTitle
        eyebrow="HỌC MỘT ĐIỀU MỚI"
        title="Những nhiệm vụ nhỏ, niềm vui lớn"
        description="Khám phá theo nhịp của bạn. Mỗi lần thử đều là một cơ hội để học."
      />
      <section className="card">
        <div className="section-heading">
          <h2>Mục tiêu đầu tiên</h2>
          <Target size={20} />
        </div>
        <MissionRows buddy={buddy} />
      </section>
      <div className="section-heading standalone">
        <div>
          <span className="section-kicker">VỪA HỌC, VỪA KHÁM PHÁ</span>
          <h2>Thử thách dành cho bạn</h2>
        </div>
        <span className="muted">3 bài tập ngắn</span>
      </div>
      <div className="exercise-grid">
        {EXERCISES.map((ex, i) => (
          <button
            className="card exercise-card"
            key={ex.id}
            onClick={() => {
              setExercise(ex);
              setChoice(null);
              setResult(null);
              setError("");
            }}
          >
            <span
              className={`exercise-art ${["mint", "peach", "lavender"][i]}`}
            >
              {i === 0 ? (
                <Target size={40} strokeWidth={1.3} />
              ) : i === 1 ? (
                <Sprout size={44} strokeWidth={1.3} />
              ) : (
                <BookOpen size={40} strokeWidth={1.3} />
              )}
              <span>0{i + 1}</span>
            </span>
            <span className="section-kicker">{ex.subject}</span>
            <h3>{ex.title}</h3>
            <p>{ex.question}</p>
            <div>
              <span className="reward-tag">
                {buddy.progress.completed_exercises.includes(ex.id) ? (
                  <>
                    <Check size={14} />
                    Đã hoàn thành
                  </>
                ) : (
                  "+30 điểm"
                )}
              </span>
              <ArrowRight size={18} />
            </div>
          </button>
        ))}
      </div>
      {exercise && (
        <Modal title={exercise.title} close={() => setExercise(null)}>
          <span className="pill">
            {exercise.subject} · +30 điểm lần đầu trả lời đúng
          </span>
          <h3 className="exercise-question">{exercise.question}</h3>
          <div className="answer-options">
            {exercise.options.map((option, i) => (
              <button
                key={option}
                aria-label={`Đáp án ${String.fromCharCode(65 + i)}: ${option}`}
                aria-pressed={choice === i}
                disabled={submitting || result?.correct}
                onClick={() => {
                  setChoice(i);
                  setResult(null);
                }}
                className={`answer-option ${choice === i ? "selected" : ""}`}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                {option}
                {choice === i && <Check size={17} />}
              </button>
            ))}
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {result && (
            <div
              className={`exercise-feedback ${result.correct ? "correct" : ""}`}
              role="status"
            >
              <strong>
                {result.correct
                  ? `Đúng rồi! ${result.awarded_xp ? `+${result.awarded_xp} điểm` : "Bạn đã nhận điểm cho bài này."}`
                  : "Gần đúng rồi, thử suy nghĩ thêm nhé."}
              </strong>
              <p>{result.explanation}</p>
            </div>
          )}
          <div className="button-row">
            <button
              className="button secondary"
              onClick={() => setExercise(null)}
            >
              {result?.correct ? "Hoàn tất" : "Để sau"}
            </button>
            {!result?.correct && (
              <button
                className="button primary"
                disabled={choice === null || submitting}
                onClick={() => void submit()}
              >
                {submitting ? "Đang kiểm tra…" : "Kiểm tra câu trả lời"}
              </button>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
function ProgressPage({ buddy }: { buddy: Buddy }) {
  const sessions = buddy.progress.focus_sessions.filter(
    (s) => s.status === "completed",
  );
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - 6 + i);
    const key = vietnamDay(date);
    return {
      key,
      label: new Intl.DateTimeFormat("vi-VN", {
        weekday: "short",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(date),
      minutes:
        sessions.filter(
          (s) => s.completed_at && vietnamDay(new Date(s.completed_at)) === key,
        ).length * 20,
    };
  });
  const max = Math.max(20, ...days.map((d) => d.minutes));
  return (
    <>
      <PageTitle
        eyebrow="NHÌN LẠI ĐỂ BƯỚC TIẾP"
        title="Mỗi nỗ lực đều được ghi nhận"
        description="Đây là hành trình của riêng bạn. Không cần so sánh, chỉ cần tiếp tục."
      />
      <div className="stats-row">
        <Stat
          icon={<Leaf size={21} />}
          label="Cấp độ hiện tại"
          value={String(buddy.progress.profile.level)}
          unit="cấp"
          color="mint"
        />
        <Stat
          icon={<Clock3 size={21} />}
          label="Phiên đã hoàn thành"
          value={String(buddy.progress.counts?.focus ?? sessions.length)}
          unit="phiên"
          color="peach"
        />
        <Stat
          icon={<BookOpen size={21} />}
          label="Bài tập đã hoàn thành"
          value={String(
            buddy.progress.counts?.exercise ??
              buddy.progress.completed_exercises.length,
          )}
          unit="bài"
          color="lavender"
        />
      </div>
      <section className="card chart-card">
        <div className="section-heading">
          <div>
            <span className="section-kicker">ĐỀU ĐẶN TỪNG NGÀY</span>
            <h2>7 ngày vừa qua</h2>
          </div>
          <span className="muted">Phút tập trung · Giờ Việt Nam</span>
        </div>
        <div
          className="bar-chart"
          role="img"
          aria-label={days
            .map((d) => `${d.label}: ${d.minutes} phút`)
            .join(", ")}
        >
          {days.map((d) => (
            <div className="bar-column" key={d.key}>
              <strong>{d.minutes}</strong>
              <div className="bar-track">
                <span
                  style={{ height: `${Math.max(2, (d.minutes / max) * 100)}%` }}
                />
              </div>
              <span>{d.label}</span>
            </div>
          ))}
        </div>
        {!sessions.length && (
          <p className="chart-empty">
            Phiên tập trung đầu tiên sẽ gieo mầm cho biểu đồ này.
          </p>
        )}
      </section>
      <Suspense fallback={null}>
        <Journal />
      </Suspense>
      <div className="section-heading standalone">
        <h2>Những dấu mốc đáng nhớ</h2>
        <Award size={22} />
      </div>
      <div className="achievement-grid">
        {buddy.progress.achievements.map((a, i) => (
          <div
            className={`card achievement ${a.earned ? "earned" : ""}`}
            key={a.id}
          >
            <span>
              {i % 3 === 0 ? (
                <Sprout size={29} />
              ) : i % 3 === 1 ? (
                <Flame size={29} />
              ) : (
                <Star size={29} />
              )}
            </span>
            <h3>{a.title}</h3>
            <p>{a.description}</p>
            <small>{a.earned ? "Đã mở khóa" : "Đang chờ bạn khám phá"}</small>
          </div>
        ))}
      </div>
    </>
  );
}
function SettingsModal({ buddy, close }: { buddy: Buddy; close: () => void }) {
  const [name, setName] = useState(buddy.progress.profile.display_name);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const run = async (fn: () => Promise<unknown>, text: string) => {
    setBusy(true);
    setMessage("");
    setFailed(false);
    try {
      await fn();
      setMessage(text);
    } catch (e) {
      setFailed(true);
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Góc nhỏ của bạn" close={close}>
      <section className="settings-section">
        <label htmlFor="nickname">Biệt danh của bạn</label>
        <p className="muted">
          Một biệt danh dễ thương là đủ. Bạn không cần dùng tên thật.
        </p>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void run(
              () =>
                buddy.savePreferences({
                  ...buddy.progress.profile,
                  display_name: name.trim(),
                }),
              "Đã lưu biệt danh.",
            );
          }}
        >
          <input
            id="nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={3}
            maxLength={24}
            required
            placeholder="Ví dụ: Mầm Xanh"
          />
          <button
            className="button secondary"
            disabled={busy || name.trim().length < 3}
          >
            Lưu biệt danh
          </button>
        </form>
      </section>
      <section className="settings-section">
        <h3>Kết nối trợ lý AI</h3>
        <p className="muted">
          {buddy.apiConfigured
            ? "Bạn có thể trò chuyện với AI mà không cần email hay đăng nhập. Ứng dụng tự tạo phiên khách khi gửi câu hỏi đầu tiên."
            : "AI trực tuyến chưa được cấu hình. Các gợi ý ngoại tuyến vẫn dùng được mà không cần tài khoản."}
        </p>
      </section>
      <section className="settings-section">
        <h3>Nhẹ nhàng với bạn</h3>
        <p className="muted">
          Ứng dụng tự giảm chuyển động khi bạn bật tùy chọn này trên thiết bị.
          Khi tập trung, hoạt ảnh trang trí sẽ tạm dừng.
        </p>
      </section>
      {message && (
        <p className={failed ? "form-error" : "form-success"} role="status">
          {message}
        </p>
      )}
    </Modal>
  );
}
function ChatModal({ buddy, close }: { buddy: Buddy; close: () => void }) {
  return (
    <Modal
      title={
        document.documentElement.lang.startsWith("en")
          ? "Study with Buddy"
          : "Mình cùng gỡ rối nhé"
      }
      close={close}
      wide
    >
      <Assistant
        configured={buddy.apiConfigured}
        profile={buddy.progress.profile}
      />
    </Modal>
  );
}
export default App;

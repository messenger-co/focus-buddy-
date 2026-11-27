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
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Coffee,
  Cloud,
  Droplets,
  Eye,
  RefreshCw,
  Flame,
  Flower2,
  Gamepad2,
  Headphones,
  Puzzle,
  MessagesSquare,
  Globe,
  Heart,
  Home,
  Keyboard,
  Leaf,
  LoaderCircle,
  Menu,
  Minus,
  Moon,
  Play,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Target,
  TrendingUp,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { selectedPlan, useFocusSettings } from "./focus3/settings";
import FocusPage from "./focus3/FocusPage";
import {
  clockText,
  elapsedMs,
  faceMs,
  isPresetActive,
  latestBreak,
  MINUTE,
  plannedMs,
  presetPatchForMinutes,
  QUICK_DURATIONS,
  studyWeek,
  studyReward,
  tabTitleForFocus,
  type FocusPlan,
} from "./focus3/model";
import { useBuddy, vietnamDay } from "./state";
import Assistant from "./ai3/Assistant";
import {
  COMPANIONS,
  DAILY_HABITS,
  DAILY_QUOTES,
  EXERCISES,
  type CompanionKind,
  type CompanionColor,
  type HabitIcon,
  type Mood,
} from "./data";
import { Palette, Box as BoxIcon } from "lucide-react";
import { MotionConfig } from "motion/react";
import { isDarkTheme, palette, type ThemeId } from "./foundation/themes";
import { useAppearance } from "./foundation/appearance";
import {
  dailySpotlight,
  firstStepHint,
  studyHeatmap,
  timeOfDayContext,
} from "./foundation/engagement";
import {
  english as inEnglish,
  language,
  locale,
  switchLanguage,
} from "./foundation/language";
import Boundary from "./foundation/Boundary";
import StudyNook from "./foundation/StudyNook";
import LocalBackup from "./foundation/LocalBackup";
import SiteStatus from "./foundation/SiteStatus";
import CampaignShowcase, { CampaignFigureCard } from "./foundation/CampaignShowcase";
import { checkSupabaseConnection, cloudCheckText, type CloudCheck } from "./cloudHealth";
import "./cloudHealth.css";
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
  { to: "/tro-choi", icon: Gamepad2, label: "Trò chơi tập trung" },
  { to: "/am-nhac", icon: Headphones, label: "Góc âm nhạc" },
  { to: "/nhiem-vu", icon: BookOpen, label: "Nhiệm vụ học tập" },
  { to: "/thu-thach", icon: Puzzle, label: "20 phút thử thách" },
  { to: "/ban-dong-hanh", icon: Heart, label: "Bạn đồng hành" },
  { to: "/thao-luan", icon: MessagesSquare, label: "Phòng thảo luận" },
  { to: "/hanh-trinh", icon: TrendingUp, label: "Hành trình của bạn" },
  { to: "/the-gioi-3d", icon: BoxIcon, label: "Phòng học 3D" },
  { to: "/giao-dien", icon: Palette, label: "Xưởng giao diện" },
];
const number = (n: number) => n.toLocaleString(locale);
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
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, a[href], [tabindex="0"]',
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
  const dark = isDarkTheme(buddy.progress.profile.theme);
  const lastLightTheme = useRef<ThemeId>("meadow");
  const lastDarkTheme = useRef<ThemeId>("charcoal");
  useEffect(() => {
    if (dark) lastDarkTheme.current = buddy.progress.profile.theme;
    else lastLightTheme.current = buddy.progress.profile.theme;
  }, [dark, buddy.progress.profile.theme]);
  useEffect(() => {
    document.documentElement.dataset.motion = appearance.motion;
    document.documentElement.dataset.palette = dark ? "dark" : "light";
    document.documentElement.dataset.fontScale = appearance.fontScale;
    document.documentElement.dataset.fontStyle = appearance.fontStyle;
  }, [appearance.motion, appearance.fontScale, appearance.fontStyle, dark]);
  const navigate = useNavigate();
  const location = useLocation();
  const [menu, setMenu] = useState(false);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const menuPanel = useRef<HTMLElement>(null);
  const lastPath = useRef(location.pathname);
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
    if (lastPath.current === location.pathname) return;
    lastPath.current = location.pathname;
    setMenu(false);
    document.getElementById("main-content")?.focus({ preventScroll: true });
    document.documentElement.scrollTop = 0;
  }, [location.pathname]);
  function dismissMenu() {
    setMenu(false);
    requestAnimationFrame(() =>
      menuTrigger.current?.focus({ preventScroll: true }),
    );
  }
  function openSettings() {
    setMenu(false);
    setSettings(true);
  }
  useEffect(() => {
    if (!menu) return;
    const close =
      menuPanel.current?.querySelector<HTMLButtonElement>(".drawer-close");
    close?.focus({ preventScroll: true });
    const layout = window.matchMedia("(min-width: 761px)");
    const resize = () => {
      if (layout.matches) setMenu(false);
    };
    const keys = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dismissMenu();
        return;
      }
      if (e.key !== "Tab") return;
      const items = menuPanel.current?.querySelectorAll<HTMLElement>(
        "a[href], button:not(:disabled)",
      );
      if (!items?.length) return;
      const first = items[0],
        last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    layout.addEventListener("change", resize);
    document.addEventListener("keydown", keys);
    return () => {
      layout.removeEventListener("change", resize);
      document.removeEventListener("keydown", keys);
    };
  }, [menu]);
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
  useEffect(() => {
    document.title = tabTitleForFocus({
      page,
      active,
      remaining,
      restLeft,
      english: inEnglish,
    });
  }, [page, active?.id, active?.mode, active?.paused_at, remaining, restLeft]);
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
        data-font-scale={appearance.fontScale}
        data-font-style={appearance.fontStyle}
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
          <>
            <button
              className="sidebar-scrim"
              aria-label="Đóng trình đơn"
              tabIndex={-1}
              aria-hidden="true"
              onClick={dismissMenu}
            />
            <aside
              ref={menuPanel}
              id="main-sidebar"
              className="sidebar mobile-drawer sidebar-open"
              role="dialog"
              aria-modal="true"
              aria-label="Trình đơn học tập"
            >
              <button
                className="drawer-close icon-button"
                aria-label="Đóng trình đơn"
                onClick={dismissMenu}
              >
                <X size={20} />
              </button>
              <NavLink to="/" className="brand" onClick={() => setMenu(false)}>
                <span className="brand-mark">
                  <Sprout size={23} />
                </span>
                <span>
                  Bạn Đồng Hành<small>THCS ĐỒNG GIAO · POPCORN BRAIN RESET</small>
                </span>
              </NavLink>
              <div className="sidebar-label">KHÔNG GIAN HỌC TẬP</div>
              <nav aria-label="Điều hướng di động">
                {navItems.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMenu(false)}
                    end={to === "/"}
                    className={({ isActive }) =>
                      `nav-item ${isActive ? "selected" : ""}`
                    }
                  >
                    <Icon size={18} strokeWidth={1.8} />
                    <span>{label}</span>
                    {to === "/tap-trung" && active && <span className="live-dot" />}
                  </NavLink>
                ))}
              </nav>
              <div className="sidebar-bottom">
                <div className="gentle-note">
                  <Flower2 size={22} />
                  <p>Mỗi bước nhỏ đều là một bước tiến.</p>
                  <span>Bạn đang làm rất tốt rồi.</span>
                </div>
                <button
                  className="nav-item"
                  onClick={() => {
                    setMenu(false);
                    setChat(true);
                  }}
                >
                  <Sparkles size={18} />
                  <span>Mở trợ lý AI</span>
                </button>
                <button className="nav-item" onClick={openSettings}>
                  <Settings size={18} />
                  <span>Tài khoản & cài đặt</span>
                </button>
              </div>
            </aside>
          </>
        )}
        <div className="workspace workspace-topnav" inert={menu}>
          <header className="site-header">
            <div className="masthead-bar">
              <div className="masthead-inner">
                <div className="masthead-left">
                  <button
                    className="icon-button mobile-menu"
                    ref={menuTrigger}
                    aria-expanded={menu}
                    aria-controls="main-sidebar"
                    aria-label="Mở trình đơn"
                    onClick={() => setMenu(true)}
                  >
                    <Menu size={21} />
                  </button>
                  <NavLink to="/" className="masthead-brand">
                    <span className="brand-mark">
                      <Sprout size={22} />
                    </span>
                    <span className="masthead-brand-copy">
                      <strong>Focus Buddy</strong>
                      <small>THCS Đồng Giao · Popcorn Brain Reset</small>
                    </span>
                  </NavLink>
                </div>
                <div className="topbar-right masthead-tools">
                  {(active || rest) && location.pathname !== "/tap-trung" && (
                    <NavLink
                      to="/tap-trung"
                      className="session-return"
                      aria-label={active ? "Quay về phiên học" : "Quay về giờ nghỉ"}
                    >
                      {active ? <Clock3 size={15} /> : <Coffee size={15} />}
                      <span>
                        {active
                          ? clockText(remaining, active.mode === "stopwatch")
                          : clockText(restLeft)}
                      </span>
                    </NavLink>
                  )}
                  <button
                    type="button"
                    className="masthead-ai-btn"
                    aria-label="Trò chuyện cùng bạn"
                    onClick={() => setChat(true)}
                  >
                    <Sparkles size={15} aria-hidden="true" />
                    <span>Trợ lý AI</span>
                  </button>
                  <button
                    type="button"
                    className="topbar-tool"
                    aria-label={
                      dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"
                    }
                    title={
                      dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"
                    }
                    onClick={() =>
                      void act(() =>
                        buddy.savePreferences({
                          ...buddy.progress.profile,
                          theme: dark
                            ? lastLightTheme.current
                            : lastDarkTheme.current,
                        }),
                      )
                    }
                  >
                    {dark ? <Sun size={16} /> : <Moon size={16} />}
                  </button>
                  <button
                    type="button"
                    className="topbar-tool topbar-lang"
                    aria-label="Đổi ngôn ngữ giao diện"
                    title="Đổi ngôn ngữ (Tiếng Việt / English)"
                    onClick={() => switchLanguage(language === "en" ? "vi" : "en")}
                  >
                    <Globe size={15} />
                    <span>{language === "en" ? "EN" : "VI"}</span>
                  </button>
                  <span
                    className={`mode-tag ${buddy.mode === "online" ? "online" : ""}`}
                  >
                    Lưu trên thiết bị
                  </span>
                  <button
                    type="button"
                    className="masthead-account-btn"
                    onClick={openSettings}
                    aria-label="Cài đặt & tài khoản"
                    title="Cài đặt & tài khoản"
                  >
                    <span className="avatar small">
                      <Leaf size={15} />
                    </span>
                    <span className="masthead-account-meta">
                      <strong>{buddy.progress.profile.display_name}</strong>
                      <small>Cấp {buddy.progress.profile.level}</small>
                    </span>
                    <Settings size={14} className="masthead-account-gear" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
            <div className="topnav-strip">
              <nav className="topnav-inner" aria-label="Điều hướng chính">
                {navItems.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    className={({ isActive }) =>
                      `topnav-link${isActive ? " active" : ""}`
                    }
                  >
                    <Icon size={15} strokeWidth={2} aria-hidden="true" />
                    <span>{label}</span>
                    {to === "/tap-trung" && active && (
                      <span className="live-dot topnav-live-dot" aria-hidden="true" />
                    )}
                  </NavLink>
                ))}
              </nav>
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
                      start={startWithPlan}
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
                      <Discussion openAccount={() => setSettings(true)} />
                    </Suspense>
                  }
                />
                <Route
                  path="/hanh-trinh"
                  element={<ProgressPage buddy={buddy} now={now} />}
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
              <Sprout size={14} aria-hidden="true" />
              <span>
                Không cần hoàn hảo. Chỉ cần tiến bộ hơn một chút mỗi ngày.
              </span>
            </footer>
          </main>
        </div>
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
        <SiteStatus />
        {settings && (
          <SettingsModal buddy={buddy} close={() => setSettings(false)} />
        )}
        {chat && <ChatModal buddy={buddy} close={() => setChat(false)} />}
        {russianEgg && (
          <Suspense
            fallback={
              <div className="russian-egg-loading" role="status">
                Открываем секретный режим…
              </div>
            }
          >
            <RussianEgg close={() => setRussianEgg(false)} />
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
  start: (plan: FocusPlan) => void;
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
  const appearance = useAppearance();
  const visibleWidgets = appearance.widgets.join(" ");
  const reducedMotion =
    appearance.motion === "off" || appearance.motion === "minimal";
  const [settings, writeSettings] = useFocusSettings();
  const [editingGoals, setEditingGoals] = useState(false);
  const [dayGoalDraft, setDayGoalDraft] = useState(String(settings.dayGoal));
  const [weekGoalDraft, setWeekGoalDraft] = useState(String(settings.weekGoal));
  const [moodBurst, setMoodBurst] = useState(0);
  useEffect(() => {
    setDayGoalDraft(String(settings.dayGoal));
    setWeekGoalDraft(String(settings.weekGoal));
  }, [settings.dayGoal, settings.weekGoal]);
  const plan = selectedPlan(settings);
  const stopwatch = (active?.mode ?? plan.mode) === "stopwatch";
  const plannedReward = studyReward(
    active ? plannedMs(active) : plan.minutes * MINUTE,
  );
  const rest = active ? undefined : latestBreak(buddy.progress.focus_sessions);
  const restMs = rest ? Math.max(0, Date.parse(rest.break_ends_at!) - now) : 0;
  const minutes = Math.floor(
    sessions.reduce((sum, s) => sum + elapsedMs(s), 0) / MINUTE,
  );
  const [quoteIdx, setQuoteIdx] = useState(0);
  const weekStats = studyWeek(sessions, now);
  const todayMinutes = weekStats.days[6]?.minutes ?? 0;
  const dailyPct = Math.min(
    100,
    Math.round((todayMinutes / Math.max(1, settings.dayGoal)) * 100),
  );
  const weeklyPct = Math.min(
    100,
    Math.round((weekStats.total / Math.max(1, settings.weekGoal)) * 100),
  );
  const todayKey = today();
  const habitsDoneToday = (buddy.progress.daily_habits?.[todayKey] ?? []).length;
  const timeCtx = timeOfDayContext(now, inEnglish);
  const heatmap = studyHeatmap(sessions, buddy.progress.check_ins, now, 21);
  const spotlight = dailySpotlight({
    dayKey: todayKey,
    todayMinutes,
    dayGoal: settings.dayGoal,
    habitsDone: habitsDoneToday,
    exercisesDone: buddy.progress.completed_exercises.length,
    hasMoodToday: !!mood,
    english: inEnglish,
  });
  const stepHint = firstStepHint({
    todayMinutes,
    dayGoal: settings.dayGoal,
    streak: weekStats.streak,
    habitsDone: habitsDoneToday,
    english: inEnglish,
  });
  const checkInCount =
    buddy.progress.counts?.checkin ?? buddy.progress.check_ins.length;
  const animCheckIns = useAnimatedNumber(checkInCount, reducedMotion);
  const animMinutes = useAnimatedNumber(minutes, reducedMotion);
  const animXp = useAnimatedNumber(buddy.progress.profile.total_xp, reducedMotion);
  const xpToNext = 100 - (buddy.progress.profile.total_xp % 100);
  const weeklyTrendShort =
    weekStats.trend === "up"
      ? `+${weekStats.delta} ${inEnglish ? "min" : "phút"}`
      : weekStats.trend === "down"
        ? `−${Math.abs(weekStats.delta)} ${inEnglish ? "min" : "phút"}`
        : inEnglish
          ? "Steady"
          : "Ổn định";
  const weeklyTrendNote =
    weekStats.trend === "up"
      ? inEnglish
        ? `Up ${weekStats.delta} min compared to last week (${weekStats.previousTotal} min)`
        : `Tăng ${weekStats.delta} phút so với tuần trước (${weekStats.previousTotal} phút)`
      : weekStats.trend === "down"
        ? inEnglish
          ? `Down ${Math.abs(weekStats.delta)} min compared to last week (${weekStats.previousTotal} min)`
          : `Giảm ${Math.abs(weekStats.delta)} phút so với tuần trước (${weekStats.previousTotal} phút)`
        : inEnglish
          ? `Same as last week (${weekStats.previousTotal} min)`
          : `Bằng tuần trước (${weekStats.previousTotal} phút)`;
  const companionName =
    buddy.progress.profile.buddy_name ||
    COMPANIONS.find((c) => c.id === buddy.progress.profile.companion)?.name ||
    "Cáo Mây";
  const handleSpotlightAction = () => {
    if (spotlight.actionType === "focus") {
      if (active || rest) navigate("/tap-trung");
      else start(plan);
    } else if (spotlight.actionType === "missions") {
      navigate("/nhiem-vu");
    } else if (spotlight.actionType === "habits") {
      document.getElementById("daily-habits-card")?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "center",
      });
    } else if (spotlight.actionType === "mood") {
      document.getElementById("mood-checkin-card")?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "center",
      });
    }
  };
  return (
    <>
      <PageTitle
        eyebrow={timeCtx.eyebrow}
        title={`${inEnglish ? "Hello" : "Chào"} ${buddy.progress.profile.display_name},`}
        description={timeCtx.subtitle}
      >
        <div className="date-chip">
          <Sun size={17} />
          {new Intl.DateTimeFormat(locale, {
            weekday: "long",
            day: "numeric",
            month: "numeric",
            timeZone: "Asia/Ho_Chi_Minh",
          }).format(new Date(now))}
        </div>
      </PageTitle>
      <div className="stats-row stats-ribbon">
        <Stat
          icon={<Flame size={20} />}
          label="Ngày đã điểm danh"
          value={number(animCheckIns.display)}
          unit="ngày"
          hint={
            weekStats.streak > 0
              ? inEnglish
                ? `${weekStats.streak}-day focus streak`
                : `Chuỗi ${weekStats.streak} ngày tập trung`
              : inEnglish
                ? "Log mood to earn +10 XP"
                : "Điểm danh ngay để nhận +10 điểm"
          }
          pulsing={animCheckIns.pulsing}
          color="peach"
        />
        <Stat
          icon={<Clock3 size={20} />}
          label="Thời gian đã tập trung"
          value={number(animMinutes.display)}
          unit="phút"
          hint={
            todayMinutes > 0
              ? inEnglish
                ? `${todayMinutes} min logged today`
                : `Hôm nay đã học ${todayMinutes} phút`
              : inEnglish
                ? "Start with a 15-min block"
                : "Khởi động bằng phiên 15 phút"
          }
          pulsing={animMinutes.pulsing}
          color="mint"
        />
        <Stat
          icon={<Sparkles size={20} />}
          label="Điểm kinh nghiệm"
          value={number(animXp.display)}
          unit="điểm"
          hint={
            inEnglish
              ? `Level ${buddy.progress.profile.level} · ${xpToNext} XP to next`
              : `Cấp ${buddy.progress.profile.level} · còn ${xpToNext} điểm lên cấp`
          }
          pulsing={animXp.pulsing}
          color="lavender"
        />
      </div>
      <section
        className="daily-goal-strip card"
        aria-label="Mục tiêu tập trung hôm nay và trong tuần"
      >
        <div className="goal-strip-grid">
          <div className={`goal-item${dailyPct >= 100 ? " goal-met" : ""}`}>
            <div className="daily-goal-head">
              <span className="daily-goal-title">
                <Target size={16} />
                <strong>Mục tiêu hôm nay</strong>
              </span>
              <span className="daily-goal-nums">
                <strong>{todayMinutes}</strong>/{settings.dayGoal} phút ·{" "}
                {weekStats.streak} ngày liên tiếp
              </span>
            </div>
            <div className="progress-track">
              <span style={{ width: `${dailyPct}%` }} />
            </div>
          </div>
          <div className={`goal-item${weeklyPct >= 100 ? " goal-met" : ""}`}>
            <div className="daily-goal-head">
              <span className="daily-goal-title">
                <TrendingUp size={16} />
                <strong>Mục tiêu tuần</strong>
              </span>
              <span className="daily-goal-nums weekly-goal-meta">
                <span>
                  <strong>{weekStats.total}</strong>/{settings.weekGoal} phút
                </span>
                <span
                  className={`weekly-trend trend-${weekStats.trend}`}
                  data-trend={weekStats.trend}
                  title={weeklyTrendNote}
                  aria-label={weeklyTrendNote}
                >
                  {weekStats.trend === "up" ? (
                    <ArrowUpRight size={13} strokeWidth={2.5} aria-hidden="true" />
                  ) : weekStats.trend === "down" ? (
                    <ArrowDownRight size={13} strokeWidth={2.5} aria-hidden="true" />
                  ) : (
                    <Minus size={13} strokeWidth={2.5} aria-hidden="true" />
                  )}
                  <span>{weeklyTrendShort}</span>
                </span>
                <button
                  type="button"
                  className={`goal-edit-btn${editingGoals ? " active" : ""}`}
                  aria-expanded={editingGoals}
                  aria-label="Điều chỉnh mục tiêu tập trung"
                  title="Điều chỉnh mục tiêu"
                  onClick={() => setEditingGoals((v) => !v)}
                >
                  <SlidersHorizontal size={13} />
                </button>
              </span>
            </div>
            <div className="progress-track">
              <span style={{ width: `${weeklyPct}%` }} />
            </div>
          </div>
        </div>
        <div className="study-heatmap-row">
          <div className="study-heatmap-meta">
            <span className="study-heatmap-title">
              <strong>{inEnglish ? "21-day study rhythm" : "Nhịp học 21 ngày"}</strong>
              <span className="study-heatmap-count">
                {heatmap.activeDays}/{heatmap.totalDays}{" "}
                {inEnglish ? "active days" : "ngày có hoạt động"}
              </span>
            </span>
            <span className="study-heatmap-nudge">{stepHint}</span>
          </div>
          <div className="study-heatmap-bar">
            <div
              className="study-heatmap-cells"
              role="img"
              aria-label={
                inEnglish
                  ? `21-day activity heatmap: ${heatmap.activeDays} active days`
                  : `Nhịp học 21 ngày: ${heatmap.activeDays} ngày có hoạt động`
              }
            >
              {heatmap.cells.map((cell) => {
                const label =
                  cell.minutes > 0
                    ? inEnglish
                      ? `${cell.shortLabel}: ${cell.minutes} min focused`
                      : `${cell.shortLabel}: ${cell.minutes} phút tập trung`
                    : cell.checkedIn
                      ? inEnglish
                        ? `${cell.shortLabel}: Checked in`
                        : `${cell.shortLabel}: Đã điểm danh`
                      : inEnglish
                        ? `${cell.shortLabel}: No activity yet`
                        : `${cell.shortLabel}: Chưa có hoạt động`;
                return (
                  <span
                    key={cell.day}
                    className={`heat-cell lvl-${cell.intensity}${cell.isToday ? " is-today" : ""}`}
                    title={label}
                  />
                );
              })}
            </div>
            <div className="study-heatmap-legend" aria-hidden="true">
              <span>{inEnglish ? "Less" : "Ít"}</span>
              <i className="heat-cell lvl-0" />
              <i className="heat-cell lvl-1" />
              <i className="heat-cell lvl-2" />
              <i className="heat-cell lvl-3" />
              <i className="heat-cell lvl-4" />
              <span>{inEnglish ? "More" : "Nhiều"}</span>
            </div>
          </div>
        </div>
        {editingGoals && (
          <form
            className="goal-editor-row"
            onSubmit={(e) => {
              e.preventDefault();
              const nextDay = Math.max(1, Math.min(480, Math.round(Number(dayGoalDraft) || settings.dayGoal)));
              const nextWeek = Math.max(1, Math.min(3360, Math.round(Number(weekGoalDraft) || settings.weekGoal)));
              writeSettings({ dayGoal: nextDay, weekGoal: nextWeek });
              setEditingGoals(false);
            }}
          >
            <label>
              <span>Phút mỗi ngày</span>
              <input
                type="number"
                min={1}
                max={480}
                value={dayGoalDraft}
                onChange={(e) => setDayGoalDraft(e.target.value)}
              />
            </label>
            <label>
              <span>Phút mỗi tuần</span>
              <input
                type="number"
                min={1}
                max={3360}
                value={weekGoalDraft}
                onChange={(e) => setWeekGoalDraft(e.target.value)}
              />
            </label>
            <button type="submit" className="button primary goal-save-btn">
              <Check size={14} /> Xong
            </button>
          </form>
        )}
      </section>
      <div className="dashboard-grid" data-widgets={visibleWidgets}>
        <div className="dashboard-main">
          <section className="focus-hero">
            <div className="hero-copy">
              <span className="hero-label">
                {active && !active.paused_at && (
                  <span className="live-dot live-active" aria-hidden="true" />
                )}
                {active
                  ? active.paused_at
                    ? "PHIÊN HỌC TẠM DỪNG"
                    : "ĐANG TẬP TRUNG"
                  : rest
                    ? "GIỜ NGHỈ"
                    : "PHIÊN HỌC TIẾP THEO"}
              </span>
              <h2>
                {active
                  ? active.goal || "Học cùng Buddy"
                  : rest
                    ? restMs
                      ? "Đến giờ nghỉ rồi"
                      : "Sẵn sàng học tiếp?"
                    : plan.goal ||
                      (stopwatch
                        ? "Bấm giờ cùng Buddy"
                        : inEnglish
                          ? `Focus for ${plan.minutes} minutes`
                          : `Tập trung ${plan.minutes} phút`)}
              </h2>
              <p>
                {active
                  ? stopwatch
                    ? "Thời gian đã học"
                    : "Thời gian còn lại"
                  : rest
                    ? restMs
                      ? "Thời gian nghỉ còn lại"
                      : "Bắt đầu khi bạn sẵn sàng."
                    : "Đồng hồ sẽ dùng chế độ và mục tiêu bạn đã chọn."}
                {(active || (rest && restMs > 0)) && (
                  <>
                    {" "}
                    ·{" "}
                    <strong>
                      {clockText(
                        active ? remaining : restMs,
                        !!active && stopwatch,
                      )}
                    </strong>
                  </>
                )}
              </p>
              {!active && !rest && (
                <div
                  className="hero-durations"
                  role="group"
                  aria-label="Chọn nhanh thời lượng tập trung"
                >
                  {QUICK_DURATIONS.map((mins) => {
                    const chosen = isPresetActive(
                      settings.mode,
                      settings.custom,
                      mins,
                    );
                    return (
                      <button
                        key={mins}
                        type="button"
                        className={`hero-dur-btn${chosen ? " active" : ""}`}
                        aria-pressed={chosen}
                        onClick={() =>
                          writeSettings(presetPatchForMinutes(mins))
                        }
                      >
                        {mins}
                        {inEnglish ? "m" : "p"}
                      </button>
                    );
                  })}
                </div>
              )}
              <button
                disabled={busy}
                className="button primary"
                onClick={
                  active || rest
                    ? () => navigate("/tap-trung")
                    : () => start(plan)
                }
              >
                <Play size={16} fill="currentColor" />
                {active
                  ? "Trở lại phiên tập trung"
                  : rest
                    ? "Về đồng hồ"
                    : "Bắt đầu tập trung"}
                <ArrowRight size={17} />
              </button>
              {!rest && (
                <span className="hero-reward">
                  <Sparkles size={13} />
                  {stopwatch
                    ? "Tính điểm theo thời gian đã học"
                    : inEnglish
                      ? `Complete this session · +${plannedReward} XP`
                      : `Hoàn thành phiên · +${plannedReward} điểm`}
                </span>
              )}
            </div>
            <StudyNook>
              <BuddyArt buddy={buddy} sleepy={sleepy} size={190} />
            </StudyNook>
          </section>
          <section
            className={`card spotlight-card${spotlight.completed ? " done" : ""}`}
            aria-label={inEnglish ? "Today's spotlight challenge" : "Thử thách hôm nay"}
          >
            <div className="spotlight-top">
              <div className="spotlight-copy">
                <span className="spotlight-kicker">
                  <Zap size={13} aria-hidden="true" />
                  {inEnglish ? "TODAY'S SPOTLIGHT" : "THỬ THÁCH HÔM NAY"}
                </span>
                <h2>{spotlight.title}</h2>
                <p>{spotlight.summary}</p>
              </div>
              {spotlight.completed ? (
                <span className="spotlight-done-tag">
                  <Check size={14} strokeWidth={2.5} />
                  {inEnglish ? "Completed" : "Đã hoàn thành"}
                </span>
              ) : (
                <button
                  type="button"
                  className="button spotlight-cta"
                  disabled={busy}
                  onClick={handleSpotlightAction}
                >
                  {spotlight.actionLabel}
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
            <div className="spotlight-foot">
              <div className="progress-track spotlight-track">
                <span style={{ width: `${spotlight.pct}%` }} />
              </div>
              <span className="spotlight-nums">
                <strong>
                  {spotlight.current}/{spotlight.target}
                </strong>{" "}
                {spotlight.unit}
              </span>
            </div>
          </section>
          <DailyHabitsCard buddy={buddy} busy={busy} />
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
              <p>{DAILY_QUOTES[quoteIdx % DAILY_QUOTES.length]}</p>
            </div>
            <button
              type="button"
              className="quote-next"
              aria-label="Lời nhắn khác"
              title="Đổi lời nhắn khác"
              onClick={() => setQuoteIdx((n) => (n + 1) % DAILY_QUOTES.length)}
            >
              <RefreshCw size={15} />
            </button>
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
                  : timeCtx.buddyLine}
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
          <section id="mood-checkin-card" className="card mood-card">
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
                  onClick={() => {
                    setMoodBurst((n) => n + 1);
                    checkIn(m.id);
                  }}
                >
                  <span className={`mood-face ${m.id}`}>{m.emoji}</span>
                  {m.label}
                  {mood?.mood === m.id && <Check size={12} />}
                </button>
              ))}
            </div>
            {moodBurst > 0 && (
              <span key={moodBurst} className="spark-burst mood-burst" aria-hidden="true">
                <i /><i /><i /><i /><i /><i />
              </span>
            )}
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
      <CampaignShowcase />
    </>
  );
}
function habitIcon(kind: HabitIcon) {
  switch (kind) {
    case "water":
      return <Droplets size={17} />;
    case "stretch":
      return <Activity size={17} />;
    case "eyes":
      return <Eye size={17} />;
    case "desk":
      return <CheckCircle2 size={17} />;
    case "breathe":
      return <Wind size={17} />;
  }
}
function DailyHabitsCard({ buddy, busy }: { buddy: Buddy; busy: boolean }) {
  const day = today();
  const checked = new Set(buddy.progress.daily_habits?.[day] ?? []);
  const rewarded = new Set(buddy.progress.daily_habit_rewards?.[day] ?? []);
  const [xpPop, setXpPop] = useState<{ id: string; amount: number; seq: number } | null>(null);
  const popTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (popTimer.current !== null) window.clearTimeout(popTimer.current);
    },
    [],
  );
  const doneCount = DAILY_HABITS.filter((h) => checked.has(h.id)).length;
  const pct = Math.round((doneCount / DAILY_HABITS.length) * 100);
  const allDone = doneCount === DAILY_HABITS.length;

  async function onToggle(id: string) {
    if (busy) return;
    try {
      const res = await buddy.toggleHabit(id);
      if (res.awarded_xp > 0) {
        if (popTimer.current !== null) window.clearTimeout(popTimer.current);
        setXpPop((prev) => ({
          id,
          amount: res.awarded_xp,
          seq: (prev?.seq ?? 0) + 1,
        }));
        popTimer.current = window.setTimeout(() => setXpPop(null), 950);
      }
    } catch {
      /* Lỗi đã được hiển thị qua trạng thái buddy.error. */
    }
  }

  return (
    <section
      id="daily-habits-card"
      className={`card habits-card ${allDone ? "habits-all-done" : ""}`}
      aria-label="Thói quen hằng ngày"
    >
      <div className="section-heading habits-head">
        <div>
          <span className="section-kicker">CHĂM SÓC BẢN THÂN</span>
          <h2>Thói quen hôm nay</h2>
        </div>
        <span className={`habits-counter ${allDone ? "complete" : ""}`}>
          {allDone ? (
            <>
              <Sparkles size={13} /> Đủ {doneCount}/{DAILY_HABITS.length}
            </>
          ) : (
            `${doneCount}/${DAILY_HABITS.length}`
          )}
        </span>
      </div>
      <div className="progress-track habits-progress">
        <span style={{ width: `${pct}%` }} />
      </div>
      <div className="habit-list" role="group" aria-label="Danh sách thói quen hôm nay">
        {DAILY_HABITS.map((habit) => {
          const isDone = checked.has(habit.id);
          const gotReward = rewarded.has(habit.id);
          const showPop = xpPop?.id === habit.id;
          return (
            <button
              key={habit.id}
              type="button"
              role="checkbox"
              aria-checked={isDone}
              disabled={busy}
              className={`habit-item ${isDone ? "done" : ""}`}
              onClick={() => void onToggle(habit.id)}
            >
              <span className="habit-box" aria-hidden="true">
                {isDone && <Check size={14} strokeWidth={2.8} />}
              </span>
              <span className={`habit-icon icon-${habit.icon}`} aria-hidden="true">
                {habitIcon(habit.icon)}
              </span>
              <span className="habit-copy">
                <strong>{habit.label}</strong>
                <small>{habit.hint}</small>
              </span>
              <span className={`habit-reward ${gotReward ? "earned" : ""}`}>
                {gotReward ? (
                  <>
                    <Check size={12} /> +{habit.reward} điểm
                  </>
                ) : (
                  `+${habit.reward} điểm`
                )}
              </span>
              {showPop && (
                <>
                  <span key={xpPop.seq} className="habit-xp-pop" aria-hidden="true">
                    +{xpPop.amount} XP
                  </span>
                  <span key={`b-${xpPop.seq}`} className="spark-burst" aria-hidden="true">
                    <i /><i /><i /><i /><i /><i />
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
function useAnimatedNumber(target: number, disabled: boolean) {
  const [display, setDisplay] = useState(target);
  const [pulsing, setPulsing] = useState(false);
  const prevRef = useRef(target);
  useEffect(() => {
    const start = prevRef.current;
    prevRef.current = target;
    if (disabled || target <= start) {
      setDisplay(target);
      return;
    }
    setPulsing(true);
    let raf = 0;
    const t0 = performance.now();
    const duration = 380;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const pulseTimer = window.setTimeout(() => setPulsing(false), 620);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(pulseTimer);
    };
  }, [target, disabled]);
  return { display, pulsing };
}
function Stat({
  icon,
  label,
  value,
  unit,
  hint,
  pulsing,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit: string;
  hint?: string;
  pulsing?: boolean;
  color: string;
}) {
  return (
    <div className={`stat-card${pulsing ? " metric-pulse" : ""}`}>
      <span className={`stat-icon ${color}`}>{icon}</span>
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <strong>
          {value} <small>{unit}</small>
        </strong>
        {hint && <span className="stat-hint">{hint}</span>}
      </div>
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
  const [subject, setSubject] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const subjects = Array.from(new Set(EXERCISES.map((ex) => ex.subject)));
  const visibleExercises = EXERCISES.map((ex, idx) => ({ ex, idx })).filter(
    ({ ex }) => subject === "all" || ex.subject === subject,
  );
  const completedCount = buddy.progress.completed_exercises.length;
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
      <div className="campaign-pair-grid">
        <CampaignFigureCard
          assetId="card-what-to-know"
          eyebrow="HIỂU VỀ NÃO BỎNG NGÔ"
          compact
        />
        <CampaignFigureCard
          assetId="card-reset-guide"
          eyebrow="CẨM NANG TẬP TRUNG"
          compact
        />
      </div>
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
        <span className="muted">
          {completedCount}/{EXERCISES.length} bài tập đã hoàn thành
        </span>
      </div>
      <div className="filter-tabs mission-filters" role="group" aria-label="Lọc bài tập theo môn">
        <button
          type="button"
          className={`filter-tab${subject === "all" ? " active" : ""}`}
          aria-pressed={subject === "all"}
          onClick={() => setSubject("all")}
        >
          Tất cả ({EXERCISES.length})
        </button>
        {subjects.map((sub) => (
          <button
            key={sub}
            type="button"
            className={`filter-tab${subject === sub ? " active" : ""}`}
            aria-pressed={subject === sub}
            onClick={() => setSubject(sub)}
          >
            {sub}
          </button>
        ))}
      </div>
      <div className="exercise-grid">
        {visibleExercises.map(({ ex, idx }) => (
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
              className={`exercise-art ${["mint", "peach", "lavender"][idx % 3]}`}
            >
              {idx % 3 === 0 ? (
                <Target size={40} strokeWidth={1.3} />
              ) : idx % 3 === 1 ? (
                <Sprout size={44} strokeWidth={1.3} />
              ) : (
                <BookOpen size={40} strokeWidth={1.3} />
              )}
              <span>{String(idx + 1).padStart(2, "0")}</span>
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
function ProgressPage({ buddy, now }: { buddy: Buddy; now: number }) {
  const [settings] = useFocusSettings();
  const sessions = buddy.progress.focus_sessions.filter(
    (s) => s.status === "completed",
  );
  const { days, total, previousTotal, delta, trend, streak } = studyWeek(
    sessions,
    now,
  );
  const weekday = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const dayLabel = (date: string) =>
    weekday.format(new Date(date + "T12:00:00Z"));
  const max = Math.max(20, settings.dayGoal, ...days.map((d) => d.minutes));
  const goalLineBottom = Math.min(96, Math.round((settings.dayGoal / max) * 100));
  const avgMinutes = Math.round(total / 7);
  const trendShort =
    trend === "up"
      ? `+${delta} ${inEnglish ? "min" : "phút"}`
      : trend === "down"
        ? `−${Math.abs(delta)} ${inEnglish ? "min" : "phút"}`
        : inEnglish
          ? "Steady"
          : "Ổn định";
  const trendNote =
    trend === "up"
      ? inEnglish
        ? `Up ${delta} min vs last week (${previousTotal} min)`
        : `Tăng ${delta} phút so với tuần trước (${previousTotal} phút)`
      : trend === "down"
        ? inEnglish
          ? `Down ${Math.abs(delta)} min vs last week (${previousTotal} min)`
          : `Giảm ${Math.abs(delta)} phút so với tuần trước (${previousTotal} phút)`
        : inEnglish
          ? `Same as last week (${previousTotal} min)`
          : `Bằng tuần trước (${previousTotal} phút)`;
  const recentMoods = buddy.progress.check_ins.slice(0, 7);
  const moodMap = {
    great: { emoji: "☺", label: "Rất vui" },
    okay: { emoji: "◡", label: "Bình thường" },
    tired: { emoji: "☾", label: "Hơi mệt" },
  } as const;
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
          <div className="chart-head-meta">
            <span className="muted">
              {total}{" "}
              {inEnglish
                ? `min · avg ${avgMinutes}/day · ${streak}d streak`
                : `phút · TB ${avgMinutes} phút/ngày · ${streak} ngày liên tiếp`}
            </span>
            <span
              className={`weekly-trend trend-${trend}`}
              data-trend={trend}
              title={trendNote}
              aria-label={trendNote}
            >
              {trend === "up" ? (
                <ArrowUpRight size={13} strokeWidth={2.5} aria-hidden="true" />
              ) : trend === "down" ? (
                <ArrowDownRight size={13} strokeWidth={2.5} aria-hidden="true" />
              ) : (
                <Minus size={13} strokeWidth={2.5} aria-hidden="true" />
              )}
              <span>{trendShort}</span>
            </span>
          </div>
        </div>
        <div className="bar-chart-wrap">
          <div
            className="bar-chart"
            role="img"
            aria-label={days
              .map(
                (d) =>
                  `${dayLabel(d.day)}: ${d.minutes} ${inEnglish ? "min" : "phút"}`,
              )
              .join(", ")}
          >
            {days.map((d) => {
              const metGoal = d.minutes >= settings.dayGoal;
              return (
                <div
                  className={`bar-column${metGoal ? " goal-met" : ""}`}
                  key={d.day}
                >
                  <strong>{d.minutes}</strong>
                  <div className="bar-track">
                    <span
                      className="bar-goal-mark"
                      style={{ bottom: `${goalLineBottom}%` }}
                      aria-hidden="true"
                    />
                    <span
                      className="bar-fill"
                      style={{ height: `${(d.minutes / max) * 100}%` }}
                    />
                  </div>
                  <span>{dayLabel(d.day)}</span>
                </div>
              );
            })}
          </div>
          <div className="chart-goal-caption">
            <span className="chart-goal-swatch" aria-hidden="true" />
            <span>
              {inEnglish
                ? `Daily goal: ${settings.dayGoal} min`
                : `Mục tiêu ngày: ${settings.dayGoal} phút`}
            </span>
          </div>
        </div>
        {!sessions.length && (
          <p className="chart-empty">
            Phiên tập trung đầu tiên sẽ gieo mầm cho biểu đồ này.
          </p>
        )}
      </section>
      {recentMoods.length > 0 && (
        <section className="card mood-history-card">
          <div className="section-heading">
            <div>
              <span className="section-kicker">NHỊP CẢM XÚC</span>
              <h2>Điểm danh gần đây</h2>
            </div>
            <span className="muted">{buddy.progress.check_ins.length} ngày</span>
          </div>
          <div className="mood-history-row">
            {recentMoods.map((entry) => (
              <div className="mood-history-chip" key={entry.day}>
                <span className={`mood-face ${entry.mood}`}>
                  {moodMap[entry.mood].emoji}
                </span>
                <div>
                  <strong>{moodMap[entry.mood].label}</strong>
                  <small>{entry.day.slice(5).replace("-", "/")}</small>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      <DigitalFootprintCheck />
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
const FOOTPRINT_KEY = "focus-buddy-footprint-v1";
const FOOTPRINT_PILLARS = [
  { id: "attention", label: "Duy trì chú ý", hint: "Giữ tập trung trọn vẹn một phiên 15–20 phút." },
  { id: "distraction", label: "Kiểm soát sao nhãng", hint: "Chủ động tắt thông báo, hạn chế chuyển tab liên tục." },
  { id: "reading", label: "Đọc sâu & ghi nhớ", hint: "Đọc hết đoạn văn hoặc trang sách trước khi lướt tiếp." },
  { id: "persistence", label: "Kiên trì hoàn thành", hint: "Làm trọn một nhiệm vụ nhỏ rồi mới nghỉ." },
  { id: "device", label: "Tự kiểm soát thiết bị", hint: "Đặt lịch nghỉ màn hình và cất điện thoại khi học." },
] as const;

function DigitalFootprintCheck() {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(FOOTPRINT_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });
  const setScore = (id: string, val: number) => {
    setScores((prev) => {
      const next = { ...prev, [id]: val };
      try {
        localStorage.setItem(FOOTPRINT_KEY, JSON.stringify(next));
      } catch {
        /* Device storage optional. */
      }
      return next;
    });
  };
  const total = FOOTPRINT_PILLARS.reduce((sum, p) => sum + (scores[p.id] || 0), 0);
  const rated = FOOTPRINT_PILLARS.filter((p) => (scores[p.id] || 0) > 0).length;

  return (
    <section
      className="card footprint-rubric-card"
      aria-label="Bộ chỉ số Popcorn Brain và Dấu chân số"
    >
      <div className="footprint-grid">
        <div className="footprint-poster-col">
          <CampaignFigureCard
            assetId="poster-digital-footprint"
            eyebrow="TRƯỜNG THCS ĐỒNG GIAO"
          />
        </div>
        <div className="footprint-rubric-col">
          <div className="section-heading">
            <div>
              <span className="section-kicker">TỰ ĐÁNH GIÁ 5 TIÊU CHÍ</span>
              <h2>Bộ chỉ số Dấu chân số</h2>
            </div>
            <span className="footprint-score-readout">
              <strong>{total}</strong>/25 sao
            </span>
          </div>
          <p className="muted">
            Chấm điểm trung thực cho bản thân mỗi tuần (1 đến 5 sao) để theo dõi
            sự tiến bộ theo mô hình Popcorn Brain Reset.
          </p>
          <div className="footprint-list">
            {FOOTPRINT_PILLARS.map((pillar) => {
              const current = scores[pillar.id] || 0;
              return (
                <div key={pillar.id} className="footprint-row">
                  <div>
                    <strong>{pillar.label}</strong>
                    <small>{pillar.hint}</small>
                  </div>
                  <div
                    className="footprint-stars"
                    role="group"
                    aria-label={`Đánh giá ${pillar.label}`}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`footprint-star${star <= current ? " active" : ""}`}
                        aria-label={`${star} sao cho ${pillar.label}`}
                        aria-pressed={current === star}
                        onClick={() => setScore(pillar.id, star)}
                      >
                        <Star size={15} fill={star <= current ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {rated === FOOTPRINT_PILLARS.length && (
            <p className="footprint-summary" role="status">
              {total >= 20
                ? "Tuyệt vời! Bạn đang làm chủ nhịp tập trung số rất vững vàng."
                : total >= 14
                  ? "Khá tốt! Hãy chọn 1 tiêu chí thấp nhất để cải thiện trong tuần tới."
                  : "Bắt đầu từ từng bước nhỏ: thử 1 phiên 15 phút không thông báo hôm nay nhé!"}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
function SettingsModal({ buddy, close }: { buddy: Buddy; close: () => void }) {
  const [name, setName] = useState(buddy.progress.profile.display_name);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [connection, setConnection] = useState<CloudCheck | null>(null);
  const [checkingCloud, setCheckingCloud] = useState(false);
  const connectionInProgress = useRef(false);
  const reconnectCloud = async () => {
    if (connectionInProgress.current) return;
    connectionInProgress.current = true;
    setCheckingCloud(true);
    try {
      const result = await checkSupabaseConnection();
      setConnection(result);
    } finally {
      connectionInProgress.current = false;
      setCheckingCloud(false);
    }
  };
  const run = async (fn: () => Promise<unknown>, text: string) => {
    setBusy(true);
    setMessage("");
    setFailed(false);
    try {
      await fn();
      setMessage(text);
    } catch (e) {
      setFailed(true);
      setMessage(e instanceof Error ? e.message : "Chưa hoàn tất. Bạn thử lại nhé.");
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
      <section className="settings-section cloud-connection">
        <div className="cloud-connection-heading">
          <Cloud size={22} />
          <div>
            <h3>{inEnglish ? "Supabase connection" : "Kết nối máy chủ Supabase"}</h3>
            <p className="muted">
              {inEnglish
                ? "Check the actual server, safely refresh an existing session, and find out whether you need to sign in again. Local game progress stays on this device."
                : "Kiểm tra máy chủ thật, khôi phục phiên đăng nhập nếu có thể và biết khi nào cần đăng nhập lại. Điểm trò chơi trên máy vẫn được giữ nguyên."}
            </p>
          </div>
        </div>
        <button type="button" className="button secondary" disabled={busy || checkingCloud}
          onClick={() => { void reconnectCloud(); }}>
          <RefreshCw size={16} className={checkingCloud ? "cloud-check-spinning" : undefined}/>
          {checkingCloud ? (inEnglish ? "Checking connection…" : "Đang kiểm tra…")
            : (inEnglish ? "Reconnect to Supabase" : "Kết nối lại Supabase")}
        </button>
        {connection && (
          <div className={"cloud-connection-result " +
            (connection.serverReachable ? "connected" : "disconnected")}
            role="status">
            <strong>{connection.serverReachable
              ? (inEnglish ? "Server reachable" : "Máy chủ đã kết nối")
              : (inEnglish ? "Connection needs attention" : "Cần kiểm tra kết nối")}</strong>
            <p>{cloudCheckText(connection, inEnglish)}</p>
          </div>
        )}
        {!buddy.cloudConfigured && (
          <p className="cloud-config-hint">
            {inEnglish
              ? "Repository Settings → Secrets and variables → Actions → Variables: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then redeploy GitHub Pages. Never put a service_role key in frontend variables."
              : "Trong GitHub: Settings → Secrets and variables → Actions → Variables, đặt VITE_SUPABASE_URL và VITE_SUPABASE_PUBLISHABLE_KEY rồi triển khai lại Pages. Không đưa khóa service_role vào mã giao diện."}
          </p>
        )}
      </section>
      {buddy.cloudConfigured && (
        <section className="settings-section room-account">
          <h3>Phòng thảo luận & điều hành</h3>
          <p className="muted">
            Khách có thể vào Phòng thảo luận trực tiếp mà không cần đăng nhập hay
            xác minh email. Email chỉ cần cho người điều hành (và Supabase gói miễn
            phí giới hạn 2 email/giờ nếu chưa cấu hình SMTP riêng).
          </p>
          {buddy.userEmail ? (
            <>
              <p>
                <strong>{buddy.userEmail}</strong>
              </p>
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={() =>
                  void run(buddy.signOut, "Đã đăng xuất trên thiết bị này.")
                }
              >
                Đăng xuất trên thiết bị này
              </button>
            </>
          ) : (
            <details className="room-mod-login">
              <summary>Đăng nhập bằng email (chỉ dành cho người điều hành)</summary>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!email.trim() || busy) return;
                  void run(
                    () => buddy.signIn(email),
                    "Kiểm tra hộp thư và mở liên kết trên trình duyệt này để xác minh.",
                  );
                }}
              >
                <label htmlFor="room-email">Email người điều hành</label>
                <p id="room-email-info" className="muted">
                  Học sinh và khách không cần điền mục này để vào trò chuyện.
                </p>
                <input
                  id="room-email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  aria-describedby="room-email-info"
                  placeholder="ban@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  type="submit"
                  className="button secondary"
                  disabled={busy || !email.trim()}
                >
                  Gửi liên kết đăng nhập
                </button>
              </form>
            </details>
          )}
        </section>
      )}
      <section className="settings-section">
        <h3>Phiên bản và cập nhật</h3>
        <p className="muted">
          Ứng dụng có thể dùng ngoại tuyến sau khi đã tải. Bạn có thể kiểm tra
          phiên bản mới mà không làm mất dữ liệu đã lưu.
        </p>
        <button type="button" className="button secondary" disabled={busy}
          onClick={() => {
            void run(async () => {
              if (!("serviceWorker" in navigator))
                throw new Error("Trình duyệt này chưa hỗ trợ cập nhật ngoại tuyến.");
              const registration = await navigator.serviceWorker.getRegistration();
              if (!registration)
                throw new Error("Chưa cài đặt bộ nhớ ngoại tuyến. Hãy tải lại khi có mạng.");
              await registration.update();
            }, "Đã kiểm tra cập nhật. Nếu có phiên bản mới, ứng dụng sẽ hiện lựa chọn tải lại.");
          }}>
          Kiểm tra cập nhật
        </button>
      </section>
      <LocalBackup/>
      <section className="settings-section shortcuts-section">
        <h3>
          <Keyboard size={16} /> Phím tắt hữu ích
        </h3>
        <ul className="shortcuts-list">
          <li>
            <kbd>Space</kbd> <span>Bắt đầu hoặc tạm dừng đồng hồ tập trung</span>
          </li>
          <li>
            <kbd>F</kbd> <span>Mở hoặc thoát chế độ toàn màn hình</span>
          </li>
          <li>
            <kbd>Esc</kbd> <span>Đóng hộp thoại hoặc trình đơn</span>
          </li>
        </ul>
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

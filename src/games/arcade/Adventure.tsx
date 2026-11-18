import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Circle,
  Diamond,
  Flag,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Wind,
} from "lucide-react";
import Companion from "../../components/Companion";
import { COMPANIONS } from "../../data";
import type { Profile } from "../../state";
import {
  adventures,
  courses,
  type AdventureMode,
  type Course,
} from "./courses";
import { displayFrame, sizeCanvas, type Particle } from "./paint";
import { advance, newRun, STEP, type GameEvent } from "./simulation";

type Phase = "ready" | "playing" | "paused" | "won";
type Command = "left" | "right" | "action";
type Score = { count: number; seconds: number };
function bestKey(c: Course) {
  return `focus-buddy-arcade-v1/${c.mode}/${c.biome}`;
}
function readScore(c: Course): Score | null {
  try {
    const s = JSON.parse(localStorage.getItem(bestKey(c)) || "null");
    return s &&
      Number.isInteger(s.count) &&
      s.count >= 0 &&
      s.count <= c.gems.length &&
      Number.isFinite(s.seconds) &&
      s.seconds > 0
      ? { count: s.count, seconds: s.seconds }
      : null;
  } catch {
    return null;
  }
}
function recordScore(c: Course, s: Score) {
  const best = readScore(c);
  if (
    best &&
    (best.count > s.count ||
      (best.count === s.count && best.seconds < s.seconds))
  )
    return best;
  try {
    localStorage.setItem(bestKey(c), JSON.stringify(s));
  } catch {
    /* Vẫn hiển thị kết quả của ván hiện tại. */
  }
  return s;
}
function chime(audio: AudioContext | null, event: GameEvent) {
  if (!audio || audio.state !== "running") return;
  const notes: Record<GameEvent, number[]> = {
    jump: [280],
    spring: [320, 510],
    pickup: [748, 998],
    fall: [245, 180],
    flag: [480, 720],
    win: [523, 659, 784, 1046],
  };
  for (const [i, hz] of notes[event].entries()) {
    const osc = audio.createOscillator(),
      gain = audio.createGain(),
      start = audio.currentTime + i * 0.085;
    osc.type = "sine";
    osc.frequency.setValueAtTime(hz, start);
    osc.frequency.exponentialRampToValueAtTime(
      hz * (event === "jump" ? 1.5 : 1.01),
      start + 0.085,
    );
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.055, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.15);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }
}
const keyControls: Record<string, Command> = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  Space: "action",
  ArrowUp: "action",
  KeyW: "action",
};
const timeText = (seconds: number) =>
  `${seconds.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} giây`;

function Stage({
  course,
  profile,
  next,
  onNext,
}: {
  course: Course;
  profile: Profile;
  next: boolean;
  onNext: () => void;
}) {
  const flight = course.mode === "glide";
  const name =
    profile.buddy_name ||
    COMPANIONS.find((s) => s.id === profile.companion)!.name;
  const game = useRef<ReturnType<typeof newRun> | null>(null);
  if (game.current === null) game.current = newRun(course);
  const shell = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    actor = useRef<HTMLDivElement>(null),
    meter = useRef<HTMLProgressElement>(null);
  const helpId = useId();
  const held = useRef({
    left: new Set<string>(),
    right: new Set<string>(),
    action: new Set<string>(),
  });
  const jump = useRef(false);
  const phaseRef = useRef<Phase>("ready");
  const [phase, setPhase] = useState<Phase>("ready");
  const [count, setCount] = useState(0);
  const [eventText, setEventText] = useState("");
  const [best, setBest] = useState(() => readScore(course));
  const [available, setAvailable] = useState(true);
  const [sound, setSound] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const audible = useRef(false);
  const wake = useRef<() => void>(() => {});
  const particles = useRef<Particle[]>([]);
  const clearKeys = useCallback(() => {
    for (const input of Object.values(held.current)) input.clear();
    jump.current = false;
  }, []);
  const changePhase = useCallback(
    (value: Phase) => {
      clearKeys();
      phaseRef.current = value;
      setPhase(value);
      wake.current();
    },
    [clearKeys],
  );
  const begin = () => {
    changePhase("playing");
    shell.current?.focus({ preventScroll: true });
  };
  const pause = useCallback(() => {
    if (phaseRef.current === "playing") changePhase("paused");
  }, [changePhase]);
  function replay() {
    game.current = newRun(course);
    particles.current = [];
    setCount(0);
    setEventText("");
    begin();
  }

  useEffect(() => {
    const surface = canvas.current,
      sprite = actor.current;
    if (
      !surface ||
      !sprite ||
      typeof CanvasRenderingContext2D === "undefined"
    ) {
      setAvailable(false);
      return;
    }
    const ctx = surface.getContext("2d");
    if (!ctx) {
      setAvailable(false);
      return;
    }
    const prefers = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = sizeCanvas(surface),
      frame = 0,
      last: number | null = null,
      accumulator = 0;
    const paint = () => {
      const r = game.current!;
      displayFrame(
        surface,
        ctx,
        sprite,
        width,
        course,
        r,
        prefers.matches ? 0 : r.time,
        particles.current,
        prefers.matches,
      );
      if (meter.current) meter.current.value = Math.min(1, r.x / course.goal);
    };
    const signal = (e: GameEvent) => {
      const r = game.current!;
      if (audible.current) chime(audio.current, e);
      if (e === "pickup") setCount(r.collected.size);
      if (e === "flag")
        setEventText("Đã cắm cờ. Bạn sẽ trở lại đây nếu trượt.");
      if (e === "fall")
        setEventText(
          r.flagged ? "Đã trở về cờ giữa chặng." : "Thử lại từ đầu chặng nhé.",
        );
      if (!prefers.matches) {
        const colors =
          e === "fall"
            ? ["#c3e6ef", "#ffffff"]
            : e === "jump" || e === "spring"
              ? ["#f7f2c8", "#d2eab3"]
              : ["#ffe292", "#fff5d2", "#a2f1cb"];
        for (let i = 0; i < (e === "jump" ? 4 : 9); i++) {
          const life = 0.21 + Math.random() * 0.25;
          particles.current.push({
            x: r.x,
            y: r.y - (e === "pickup" ? 17 : 4),
            vx: (Math.random() - 0.5) * 85,
            vy: -15 - Math.random() * 77,
            life,
            max: life,
            color: colors[i % colors.length],
          });
        }
        if (particles.current.length > 80)
          particles.current.splice(0, particles.current.length - 80);
      }
      if (e === "win") {
        setEventText("");
        setBest(
          recordScore(course, { count: r.collected.size, seconds: r.time }),
        );
        phaseRef.current = "won";
        setPhase("won");
        clearKeys();
      }
    };
    const tick = (now: number) => {
      frame = 0;
      if (phaseRef.current === "playing") {
        if (last !== null) accumulator += Math.min(0.066, (now - last) / 1000);
        last = now;
        while (accumulator >= STEP && phaseRef.current === "playing") {
          const keys = held.current;
          const events = advance(
            course,
            game.current!,
            {
              direction:
                Number(keys.right.size > 0) - Number(keys.left.size > 0),
              jump: jump.current,
              lift: keys.action.size > 0,
            },
            STEP,
          );
          jump.current = false;
          accumulator -= STEP;
          for (const p of particles.current) {
            p.x += p.vx * STEP;
            p.y += p.vy * STEP;
            p.vy += 110 * STEP;
            p.life -= STEP;
          }
          particles.current = particles.current.filter((p) => p.life > 0);
          for (const event of events) signal(event);
        }
      }
      paint();
      if (phaseRef.current === "playing") frame = requestAnimationFrame(tick);
    };
    const schedule = () => {
      last = null;
      accumulator = 0;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    wake.current = schedule;
    const resize = () => {
      width = sizeCanvas(surface);
      paint();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(surface);
    const visibility = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", visibility);
    paint();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      wake.current = () => {};
      clearKeys();
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", visibility);
      if (audio.current) {
        void audio.current.close().catch(() => {});
        audio.current = null;
      }
    };
  }, [course, pause, clearKeys]);

  function press(cmd: Command, token: string) {
    if (phaseRef.current !== "playing") return;
    const keys = held.current[cmd];
    if (cmd === "action" && keys.size === 0) jump.current = true;
    keys.add(token);
  }
  function keyEvent(e: KeyboardEvent<HTMLDivElement>, down: boolean) {
    if (!down) {
      for (const input of Object.values(held.current)) input.delete(e.code);
      return;
    }
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (
      (e.code === "Escape" || e.code === "KeyP") &&
      !e.repeat &&
      (phase === "playing" || phase === "paused")
    ) {
      e.preventDefault();
      if (phase === "playing") pause();
      else begin();
      return;
    }
    const button = (e.target as HTMLElement).closest("button");
    const command =
      button && ["Enter", "Space"].includes(e.code)
        ? (button.dataset.command as Command | undefined)
        : keyControls[e.code];
    if (!command || phaseRef.current !== "playing") return;
    e.preventDefault();
    if (!e.repeat) press(command, e.code);
  }
  function control(cmd: Command, label: string, content: React.ReactNode) {
    const release = (e: PointerEvent<HTMLButtonElement>) =>
      held.current[cmd].delete("p" + e.pointerId);
    return (
      <button
        type="button"
        className={`pad-key pad-${cmd}`}
        data-command={cmd}
        aria-label={label}
        disabled={phase !== "playing"}
        onPointerDown={(e) => {
          e.preventDefault();
          shell.current?.focus({ preventScroll: true });
          e.currentTarget.setPointerCapture(e.pointerId);
          press(cmd, "p" + e.pointerId);
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        onContextMenu={(e) => e.preventDefault()}
      >
        {content}
      </button>
    );
  }
  async function toggleSound() {
    if (audible.current) {
      audible.current = false;
      setSound(false);
      return;
    }
    try {
      audio.current ??= new AudioContext();
      await audio.current.resume();
      audible.current = true;
      setSound(true);
      chime(audio.current, "pickup");
    } catch {
      setEventText("Trình duyệt chưa bật được âm thanh.");
    }
  }

  return (
    <div
      className="arcade-console"
      ref={shell}
      role="region"
      aria-label={`Điều khiển ${name}`}
      aria-describedby={helpId}
      tabIndex={0}
      onKeyDown={(e) => keyEvent(e, true)}
      onKeyUp={(e) => keyEvent(e, false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) pause();
      }}
    >
      <div className="console-top">
        <strong>{course.title}</strong>
        <div className="console-tools">
          <span
            className="arcade-score"
            aria-label={`${flight ? "Vòng sáng" : "Tinh thể"}: ${count} trên ${course.gems.length}`}
          >
            {flight ? <Circle size={16} /> : <Diamond size={16} />}
            {count} / {course.gems.length}
          </span>
          <button
            onClick={() => void toggleSound()}
            aria-pressed={sound}
            aria-label={sound ? "Tắt âm thanh" : "Bật âm thanh"}
          >
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {phase === "playing" && (
            <button onClick={pause} aria-label="Tạm dừng trò chơi">
              <Pause size={18} />
            </button>
          )}
        </div>
      </div>
      <div className={`arcade-stage stage-${course.biome}`}>
        <canvas
          ref={canvas}
          role="img"
          aria-label={
            flight
              ? "Đường bay với vòng sáng, mây giông và vạch đích"
              : "Đảo nổi với tinh thể, nấm lò xo, cờ và cổng sao"
          }
        />
        <div ref={actor} className="arcade-actor" aria-hidden="true">
          <Companion
            sprite
            kind={profile.companion}
            color={profile.color}
            accessory={profile.accessory}
          />
        </div>
        {!available ? (
          <div className="stage-curtain">
            <p>Hãy mở trò chơi bằng trình duyệt hỗ trợ Canvas 2D.</p>
          </div>
        ) : phase === "ready" ? (
          <div className="stage-start">
            <button className="launch-game" onClick={begin}>
              <Play size={17} fill="currentColor" />
              {flight ? "Cất cánh" : "Bắt đầu chặng"}
            </button>
          </div>
        ) : phase === "paused" ? (
          <div className="stage-curtain">
            <div>
              <h2>Tạm dừng</h2>
              <div className="curtain-actions">
                <button className="launch-game" onClick={begin}>
                  <Play size={16} />
                  Tiếp tục chơi
                </button>
                <button className="arcade-ghost" onClick={replay}>
                  <RotateCcw size={15} />
                  Chơi lại
                </button>
              </div>
            </div>
          </div>
        ) : phase === "won" ? (
          <div className="stage-curtain">
            <div>
              <Flag size={23} />
              <h2 aria-live="polite">Về đích rồi!</h2>
              <p>
                {count}/{course.gems.length} {flight ? "vòng sáng" : "tinh thể"}{" "}
                · {timeText(game.current.time)}
              </p>
              <div className="curtain-actions">
                {next ? (
                  <button className="launch-game" onClick={onNext}>
                    Chặng tiếp theo <ArrowRight size={16} />
                  </button>
                ) : (
                  <Link to="/tro-choi" className="launch-game">
                    Chọn trò khác <ArrowRight size={16} />
                  </Link>
                )}
                <button className="arcade-ghost" onClick={replay}>
                  <RotateCcw size={15} />
                  Chơi lại
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <progress
        className="arcade-progress"
        ref={meter}
        max={1}
        defaultValue={0}
        aria-label="Quãng đường đến đích"
      />
      <div className="arcade-controls">
        {!flight && (
          <div className="direction-pad">
            {control("left", "Đi sang trái", <ArrowLeft size={20} />)}
            {control("right", "Đi sang phải", <ArrowRight size={20} />)}
          </div>
        )}
        {control(
          "action",
          flight ? "Giữ để bay lên" : "Nhảy",
          flight ? (
            <>
              <Wind size={19} />
              Giữ để bay lên
            </>
          ) : (
            <>
              <ArrowUp size={20} />
              Nhảy
            </>
          ),
        )}
      </div>
      <div className="arcade-readout">
        <p id={helpId}>
          {flight
            ? "Giữ phím Cách hoặc nút bay để lên cao, thả để hạ xuống. Lượn qua vòng và tránh mây giông."
            : "Dùng ← → hoặc A, D để chạy. Phím Cách hoặc ↑ để nhảy. Nhấn thêm lần nữa khi đang ở trên không."}
        </p>
        <p className="arcade-signal" role="status">
          {eventText}
        </p>
        {best && (
          <p className="arcade-best">
            <Check size={14} />
            Kỷ lục chặng này: {best.count}/{course.gems.length} ·{" "}
            {timeText(best.seconds)}
          </p>
        )}
      </div>
    </div>
  );
}
export default function Adventure({
  mode,
  profile,
}: {
  mode: AdventureMode;
  profile: Profile;
}) {
  const [index, setIndex] = useState(0);
  const course = courses[mode][index];
  const info = adventures.find((a) => a.mode === mode)!;
  return (
    <section className="adventure-page">
      <div className="adventure-title">
        <h1>{info.title}</h1>
        <p>{info.blurb}</p>
      </div>
      <div className="course-picker" aria-label="Chọn chặng">
        {courses[mode].map((c, i) => (
          <button
            key={c.title}
            aria-label={`Chặng ${i + 1}: ${c.title}`}
            aria-pressed={i === index}
            className={`course-${c.biome}`}
            onClick={() => setIndex(i)}
          >
            <span>{i + 1}</span>
            {c.title}
          </button>
        ))}
      </div>
      <Stage
        key={course.title}
        course={course}
        profile={profile}
        next={index < courses[mode].length - 1}
        onNext={() => setIndex((i) => i + 1)}
      />
    </section>
  );
}

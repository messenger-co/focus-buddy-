import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Diamond,
  Lamp,
  Pause,
  Play,
  RotateCcw,
  Undo2,
} from "lucide-react";
import type { Profile } from "../../state";
import { LevelPicker, levelKey, readScore, recordScore } from "../levels";
import {
  boards,
  expeditions,
  bitCount,
  moveBoard,
  startBoard,
  undoSlide,
  type Board,
  type BoardMode,
  type BoardRun,
  type Direction,
} from "./boards";
import BoardScene from "./BoardScene";

const keys: Record<string, Direction> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowDown: "down",
  KeyS: "down",
  ArrowRight: "right",
  KeyD: "right",
};
const pad = [
  ["up", "Đi lên", ArrowUp],
  ["left", "Đi sang trái", ArrowLeft],
  ["down", "Đi xuống", ArrowDown],
  ["right", "Đi sang phải", ArrowRight],
] as const;
const seconds = (v: number) =>
  v.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + " giây";

function BoardStage({
  b,
  profile,
  recordKey,
  onNext,
}: {
  b: Board;
  profile: Profile;
  recordKey: string;
  onNext?: () => void;
}) {
  const [run, setRun] = useState(() => startBoard(b)),
    [phase, setPhase] = useState<"ready" | "playing" | "paused" | "won">(
      "ready",
    );
  const [, refresh] = useState(0),
    [best, setBest] = useState(() => readScore(recordKey, b.gems.length));
  const shell = useRef<HTMLDivElement>(null),
    swipe = useRef<{ x: number; y: number; id: number } | null>(null);
  const river = b.mode === "river",
    item = river ? "đèn hoa" : "pha lê",
    Item = river ? Lamp : Diamond;
  const pause = useCallback(() => {
    run.queued = null;
    setPhase((p) => (p === "playing" ? "paused" : p));
  }, [run]);
  useEffect(() => {
    const hide = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [pause]);
  const changed = useCallback(
    (r: BoardRun) => {
      if (r.won) {
        setBest(
          recordScore(
            recordKey,
            {
              count: bitCount(r.mask),
              seconds: r.time,
              ...(!river && { moves: r.moves }),
            },
            b.gems.length,
          ),
        );
        setPhase("won");
      } else refresh((v) => v + 1);
    },
    [b, river, recordKey],
  );
  function begin() {
    setPhase("playing");
    shell.current?.focus({ preventScroll: true });
  }
  function replay() {
    setRun(startBoard(b));
    begin();
  }
  function step(d: Direction) {
    if (phase === "playing") moveBoard(b, run, d);
  }
  function undo() {
    if (!river && phase === "playing" && undoSlide(run)) refresh((v) => v + 1);
  }
  return (
    <div
      ref={shell}
      role="region"
      aria-label={`Điều khiển trong ${b.title}`}
      tabIndex={0}
      className="arcade-console expedition-console"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) pause();
      }}
      onKeyDown={(e) => {
        if (e.altKey || e.ctrlKey || e.metaKey) return;
        if (
          e.code === "Escape" &&
          (phase === "playing" || phase === "paused")
        ) {
          e.preventDefault();
          if (!e.repeat) {
            if (phase === "playing") pause();
            else begin();
          }
          return;
        }
        if (phase !== "playing") return;
        if (keys[e.code]) {
          e.preventDefault();
          if (!e.repeat) step(keys[e.code]);
        }
        if (!river && e.code === "KeyZ" && !e.repeat) {
          e.preventDefault();
          undo();
        }
      }}
    >
      <div className="console-top">
        <strong>{b.title}</strong>
        <div className="console-tools">
          <span
            className="arcade-score"
            aria-label={`${item}: ${bitCount(run.mask)} trên ${b.gems.length}`}
          >
            <Item size={16} />
            {bitCount(run.mask)} / {b.gems.length}
          </span>
          {phase === "playing" && (
            <button aria-label="Tạm dừng trò chơi" onClick={pause}>
              <Pause size={18} />
            </button>
          )}
        </div>
      </div>
      <div
        className={`arcade-stage board-stage board-${b.mode} ${phase === "playing" ? "board-active" : ""}`}
        onPointerDown={(e) => {
          if (phase !== "playing" || !e.isPrimary) return;
          shell.current?.focus({ preventScroll: true });
          swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerCancel={() => {
          swipe.current = null;
        }}
        onPointerUp={(e) => {
          const s = swipe.current;
          swipe.current = null;
          if (!s || s.id !== e.pointerId) return;
          const dx = e.clientX - s.x,
            dy = e.clientY - s.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 15) return;
          step(
            Math.abs(dx) > Math.abs(dy)
              ? dx > 0
                ? "right"
                : "left"
              : dy > 0
                ? "down"
                : "up",
          );
        }}
      >
        <BoardScene
          board={b}
          run={run}
          profile={profile}
          playing={phase === "playing"}
          onChange={changed}
        />
        {phase === "ready" && (
          <div className="stage-start">
            <button className="launch-game" onClick={begin}>
              <Play size={17} />
              {river ? "Xuống bến" : "Vào hang"}
            </button>
          </div>
        )}
        {(phase === "paused" || phase === "won") && (
          <div className="stage-curtain">
            <div>
              <h2>{phase === "won" ? "Về đích rồi!" : "Tạm dừng"}</h2>
              {phase === "won" && (
                <p>
                  {bitCount(run.mask)}/{b.gems.length} {item} ·{" "}
                  {river ? seconds(run.time) : `${run.moves} lượt trượt`}
                </p>
              )}
              <div className="curtain-actions">
                {phase === "paused" ? (
                  <button className="launch-game" onClick={begin}>
                    Tiếp tục chơi
                  </button>
                ) : onNext ? (
                  <button className="launch-game" onClick={onNext}>
                    Chặng tiếp theo <ArrowRight size={15} />
                  </button>
                ) : (
                  <Link className="launch-game" to="/tro-choi">
                    Chọn trò khác
                  </Link>
                )}
                <button className="arcade-ghost" onClick={replay}>
                  <RotateCcw size={15} />
                  Chơi lại
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="board-controls">
        <div className="board-pad">
          {pad.map(([d, label, Icon]) => (
            <button
              type="button"
              key={d}
              className={`pad-key dir-${d}`}
              aria-label={label}
              disabled={phase !== "playing"}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                shell.current?.focus({ preventScroll: true });
                step(d);
              }}
              onClick={(e) => {
                if (e.detail === 0) step(d);
              }}
            >
              <Icon size={19} />
            </button>
          ))}
        </div>
        {river ? (
          <span className="board-objective">
            Đích đến <strong>{b.target} đèn → bến vàng</strong>
          </span>
        ) : (
          <button
            className="pad-key undo-slide"
            disabled={phase !== "playing" || !run.undo.length}
            onClick={undo}
          >
            <Undo2 size={16} />
            Lùi một lượt
          </button>
        )}
      </div>
      <div className="arcade-readout">
        <p>
          {river
            ? "Dùng phím mũi tên, nút bên dưới hoặc vuốt để nhảy. Bè tre trôi theo dòng. Ghé bến giữa suối để lưu vị trí, rồi tìm cổng đèn vàng."
            : `Dùng phím mũi tên, nút bên dưới hoặc vuốt để trượt đến vách. Gom đủ pha lê rồi trượt qua cổng. Thử sức trong ${b.target} lượt. Nhấn Z để lùi một lượt.`}
        </p>
        <p className="arcade-signal" role="status">
          {phase === "won" ? "Đã hoàn thành chặng." : run.notice}
        </p>
        {best && (
          <p className="arcade-best">
            <Check size={14} />
            Kỷ lục chặng này:{" "}
            {river
              ? `${best.count}/${b.gems.length} đèn hoa`
              : `${best.moves} lượt trượt`}{" "}
            · {seconds(best.seconds)}
          </p>
        )}
      </div>
    </div>
  );
}
export default function Expedition({
  mode,
  profile,
}: {
  mode: BoardMode;
  profile: Profile;
}) {
  const [index, setIndex] = useState(0),
    info = expeditions.find((x) => x.mode === mode)!,
    routes = boards[mode];
  return (
    <section className="adventure-page">
      <div className="adventure-title">
        <h1>{info.title}</h1>
        <p>{info.blurb}</p>
      </div>
      <LevelPicker
        slug={info.slug}
        titles={routes.map((x) => x.title)}
        index={index}
        onSelect={setIndex}
      />
      <BoardStage
        key={index}
        b={routes[index]}
        profile={profile}
        recordKey={levelKey(info.slug, index)}
        onNext={
          index < routes.length - 1 ? () => setIndex(index + 1) : undefined
        }
      />
    </section>
  );
}

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { Flag, Lamp, Play, Undo2 } from "lucide-react";
import Companion from "../../components/Companion";
import { english } from "../../foundation/language";
import type { PlayProps } from "../club/props";
import {
  directions,
  followRails,
  makeBoard,
  neighbor,
  sockets,
  type Journey,
  type Tile,
} from "./railway";
import "./railway.css";

function Track({ tile, turn }: { tile: Tile; turn: number }) {
  if (tile === "trees" || tile === "pond")
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        {tile === "trees" ? (
          <>
            <ellipse
              cx="32"
              cy="48"
              rx="21"
              ry="5"
              fill="#658978"
              opacity=".4"
            />
            <path d="M20 48V30m19 18V25" stroke="#936c56" strokeWidth="4" />
            <path d="m20 15-12 22h24Z" fill="#598c78" />
            <path d="m39 10-16 26h32Z" fill="#3e786b" />
            <path d="m39 10 3 16 6-1Z" fill="#84aa84" />
          </>
        ) : (
          <>
            <path
              d="M7 40q-4-10 10-13 8-2 12-8 9-10 19-2 18 8 7 24-8 10-29 8-15 2-19-9Z"
              fill="#99c7bc"
            />
            <path
              d="M14 36q6-3 12-2m9 6q7 2 13-2"
              fill="none"
              stroke="#d6e9d2"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M14 45v-11m2 10 3-6"
              fill="none"
              stroke="#62866c"
              strokeWidth="2"
            />
          </>
        )}
      </svg>
    );
  const line = tile === "straight" ? "M32 -1V65" : "M32 -1V10Q32 32 54 32H65";
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <g transform={`rotate(${turn * 90} 32 32)`} fill="none">
        <path d={line} stroke="#a47d61" strokeWidth="20" />
        <path
          d={line}
          stroke="#d4aa79"
          strokeWidth="21"
          strokeDasharray="4 8"
        />
        <path d={line} stroke="#41575c" strokeWidth="11" />
        <path d={line} stroke="#dfdfbc" strokeWidth="8" />
        <path d={line} stroke="#876e58" strokeWidth="5" />
      </g>
    </svg>
  );
}

export function RailwayPostcard() {
  return (
    <svg className="rail-postcard" viewBox="0 0 360 105" aria-hidden="true">
      <rect width="360" height="105" rx="14" fill="#334f60" />
      <circle cx="288" cy="27" r="15" fill="#ffe5ac" />
      <path d="M0 64Q69 29 138 62T275 53q44-19 85-5v57H0Z" fill="#72968c" />
      <path d="M0 82q63-18 132-5t132-5q57-13 96 1v32H0Z" fill="#486e65" />
      <g fill="#345c56">
        <path d="m31 40-12 28h24Zm11 9L32 72h21Zm269-10-14 32h29Zm14 7-12 28h25Z" />
      </g>
      <g fill="#ffe398">
        {[
          [48, 37],
          [88, 49],
          [146, 27],
          [177, 58],
          [228, 49],
          [262, 35],
          [315, 19],
        ].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="2" />
        ))}
      </g>
      <path
        d="M0 94q102-19 182-8t178-8"
        fill="none"
        stroke="#dfc69d"
        strokeWidth="4"
      />
      <g fill="#e1a671" stroke="#405357" strokeWidth="2">
        <path d="M146 78V62h13v9h21l4 12h-38Z" />
        <path d="M168 72v-9h6v9" />
        <path d="M143 61h18v4h-18Z" />
        <circle cx="152" cy="83" r="4" />
        <circle cx="174" cy="83" r="4" />
      </g>
    </svg>
  );
}

type Result = { move: Journey; step: number; traveling: boolean };
export default function Railway({
  level,
  profile,
  active,
  finish,
  tone,
}: PlayProps) {
  const board = useMemo(() => makeBoard(level), [level]);
  const [turns, setTurns] = useState(() => [...board.initial]);
  const [history, setHistory] = useState<number[]>([]);
  const [cursor, setCursor] = useState(board.start);
  const [run, setRun] = useState<Result | null>(null);
  const pieces = useRef<(HTMLButtonElement | null)[]>([]);
  const traveling = run?.traveling ?? false;
  useEffect(() => {
    if (!active || !run?.traveling) return;
    const id = window.setTimeout(() => {
      if (run.step + 1 < run.move.path.length) {
        setRun({ ...run, step: run.step + 1 });
      } else if (run.move.stop === "arrived") {
        tone();
        finish(board.lanterns.length * 10);
      } else {
        tone(false);
        setRun({ ...run, traveling: false });
      }
    }, 230);
    return () => clearTimeout(id);
  }, [active, run, board.lanterns.length, finish, tone]);
  function rotate(cell: number, reverse = false) {
    if (!active || traveling) return;
    const period = board.tiles[cell] === "straight" ? 2 : 4;
    setTurns((old) =>
      old.map((value, i) =>
        i === cell ? (value + (reverse ? period - 1 : 1)) % period : value,
      ),
    );
    setHistory((old) =>
      reverse ? old.slice(0, -1) : [...old.slice(-199), cell],
    );
    setRun(null);
    tone();
  }
  function keyboard(e: KeyboardEvent, cell: number) {
    const d = ["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"].indexOf(
      e.key,
    );
    if (d < 0 || traveling || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    let next = neighbor(cell, d, board.width, board.height);
    while (next >= 0 && !pieces.current[next])
      next = neighbor(next, d, board.width, board.height);
    if (next >= 0) {
      setCursor(next);
      pieces.current[next]?.focus({ preventScroll: true });
    }
  }
  const current = run?.move.path[run.step] ?? board.start;
  const passed = run?.move.path.slice(0, run.step + 1) ?? [];
  const lit = board.lanterns.filter((id) => passed.includes(id)).length;
  const message = run?.traveling
    ? "Tàu đang chạy…"
    : run?.move.stop === "gap"
      ? "Đường ray bị ngắt ở ô có vạch chéo."
      : run?.move.stop === "missed"
        ? "Tàu đã về ga nhưng còn đèn chưa ghé."
        : run?.move.stop === "loop"
          ? "Đường ray đang khép thành vòng."
          : "Nối lối vào bên trái với lá cờ bên phải.";
  return (
    <div className="rail-game">
      <div className="rail-readout">
        <span>
          <Lamp size={16} /> {lit} / {board.lanterns.length}
        </span>
        <span>
          <Flag size={16} />
          {board.width} × {board.height}
        </span>
      </div>
      <div
        className="rail-board"
        role="group"
        aria-label="Bản đồ đường ray"
        style={
          { "--cols": board.width, "--rows": board.height } as CSSProperties
        }
      >
        {board.tiles.map((tile, cell) => {
          const ends = sockets(tile, turns[cell]),
            lamp = board.lanterns.includes(cell),
            fault = !!run && !traveling && run.move.fault === cell;
          const art = (
            <>
              <Track tile={tile} turn={turns[cell]} />
              {lamp && (
                <span
                  aria-hidden="true"
                  className={
                    passed.includes(cell) ? "rail-lamp lit" : "rail-lamp"
                  }
                >
                  ✧
                </span>
              )}
              {cell === board.start && (
                <i className="rail-in" aria-hidden="true">
                  ➜
                </i>
              )}
              {cell === board.exit && (
                <i className="rail-out" aria-hidden="true">
                  ⚑
                </i>
              )}
            </>
          );
          const className = `rail-tile ${!ends.length ? "rail-scenery" : ""} ${fault ? "rail-fault" : ""} ${passed.includes(cell) ? "rail-passed" : ""}`;
          const row = Math.floor(cell / board.width) + 1,
            col = (cell % board.width) + 1;
          const extra = [
            cell === board.start ? "Lối vào" : "",
            cell === board.exit ? "Ga đích" : "",
            lamp ? "Đèn lồng" : "",
          ].filter(Boolean);
          return ends.length ? (
            <button
              key={cell}
              className={className}
              type="button"
              tabIndex={cell === cursor ? 0 : -1}
              disabled={traveling || !active}
              ref={(el) => {
                pieces.current[cell] = el;
              }}
              onFocus={() => setCursor(cell)}
              onKeyDown={(e) => keyboard(e, cell)}
              onClick={() => {
                setCursor(cell);
                rotate(cell);
              }}
              aria-label={[
                (english ? "Tile" : "Ô") + " " + row + "-" + col,
                ends.map((d) => directions[d]).join(" / "),
                ...extra,
              ].join(", ")}
            >
              {art}
            </button>
          ) : (
            <div className={className} key={cell} aria-hidden="true">
              {art}
            </div>
          );
        })}
        <div
          aria-hidden="true"
          className="rail-train"
          style={{
            left: (((current % board.width) + 0.5) * 100) / board.width + "%",
            top:
              ((Math.floor(current / board.width) + 0.5) * 100) / board.height +
              "%",
          }}
        >
          <Companion
            kind={profile.companion}
            color={profile.color}
            accessory={profile.accessory}
            sprite
            paused
            size={42}
          />
          <svg viewBox="0 0 56 24">
            <path
              d="M4 6h29v6h10V5h5v8l4 6H6Z"
              fill="#d99269"
              stroke="#504e4b"
              strokeWidth="2"
            />
            <path d="M7 10h22" stroke="#f8d5a1" strokeWidth="2.5" />
            <g fill="#4e5358" stroke="#e2c29b" strokeWidth="2">
              <circle cx="13" cy="19" r="4" />
              <circle cx="38" cy="19" r="4" />
            </g>
          </svg>
        </div>
      </div>
      <div className="rail-actions">
        <button
          className="button primary"
          disabled={!active || traveling}
          onClick={() => {
            const move = followRails(board, turns);
            setRun({ move, step: 0, traveling: true });
          }}
        >
          <Play size={15} />
          Cho tàu chạy
        </button>
        <button
          className="button secondary"
          disabled={!history.length || traveling || !active}
          onClick={() => rotate(history[history.length - 1], true)}
        >
          <Undo2 size={15} />
          Lùi một lượt
        </button>
      </div>
      <p role="status" className="rail-status">
        {message}
      </p>
    </div>
  );
}

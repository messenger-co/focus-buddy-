import { useEffect, useRef } from "react";
import Companion from "../../components/Companion";
import type { Profile } from "../../state";
import { tickBoard, type Board, type BoardRun } from "./boards";
import { fitBoard, paintBoard } from "./boardArt";

// Lượt chơi và hình bìa cùng vẽ từ một bản đồ. Hình bìa chỉ vẽ khi đổi kích thước.
export default function BoardScene({
  board,
  run,
  profile,
  playing = false,
  poster = false,
  onChange,
}: {
  board: Board;
  run: BoardRun;
  profile: Profile;
  playing?: boolean;
  poster?: boolean;
  onChange?: (r: BoardRun) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    actor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const c = canvas.current,
      a = actor.current;
    if (!c || !a || typeof CanvasRenderingContext2D === "undefined") return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let view = fitBoard(c),
      frame = 0,
      previous: number | null = null;
    const draw = () =>
      paintBoard(c, ctx, a, view, board, run, motion.matches, poster);
    const resize = () => {
      view = fitBoard(c);
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(c);
    let mask = -1,
      moves = -1,
      falls = -1,
      flag = -1,
      notice = "";
    const tick = (now: number) => {
      let dt = previous === null ? 0 : Math.min(0.065, (now - previous) / 1000);
      previous = now;
      while (dt > 0) {
        const step = Math.min(1 / 90, dt);
        tickBoard(board, run, step);
        dt -= step;
      }
      if (
        mask !== run.mask ||
        moves !== run.moves ||
        falls !== run.falls ||
        flag !== run.flag.y ||
        notice !== run.notice ||
        run.won
      ) {
        mask = run.mask;
        moves = run.moves;
        falls = run.falls;
        flag = run.flag.y;
        notice = run.notice;
        onChange?.(run);
      }
      draw();
      if (!run.won) frame = requestAnimationFrame(tick);
    };
    draw();
    if (playing) frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [board, run, playing, onChange, poster]);
  return (
    <>
      <canvas
        ref={canvas}
        role="img"
        aria-label={
          board.mode === "river"
            ? "Bản đồ dòng suối, các bè tre trôi và bến đích"
            : "Hang băng với vách đá, pha lê và cổng ra"
        }
      />
      <div className="arcade-actor" ref={actor} aria-hidden="true">
        <Companion
          sprite
          kind={profile.companion}
          color={profile.color}
          accessory={profile.accessory}
        />
      </div>
    </>
  );
}

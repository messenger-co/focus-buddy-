import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Gamepad2, Snowflake, Waves, Wind } from "lucide-react";
import Companion from "../../components/Companion";
import type { Profile } from "../../state";
import {
  adventures,
  courses,
  type AdventureMode,
  type Course,
} from "./courses";
import { displayFrame, sizeCanvas } from "./paint";
import { newRun } from "./simulation";
import {
  boards,
  expeditions,
  raftX,
  startBoard,
  type BoardMode,
} from "./boards";
import { LevelCount } from "../levels";
import BoardScene from "./BoardScene";
import "./arcade.css";

function Poster({ mode, profile }: { mode: AdventureMode; profile: Profile }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const actor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const surface = canvas.current,
      sprite = actor.current;
    if (!surface || !sprite || typeof CanvasRenderingContext2D === "undefined")
      return;
    const ctx = surface.getContext("2d");
    if (!ctx) return;
    const base = courses[mode][0];
    const scene: Course =
      mode === "jump"
        ? {
            ...base,
            goal: 455,
            checkpoint: { x: 40, y: 207 },
            islands: [
              { x: -30, y: 208, width: 166 },
              { x: 183, y: 177, width: 88, spring: 61 },
              { x: 333, y: 154, width: 170 },
            ],
            gems: [
              { x: 140, y: 151 },
              { x: 167, y: 133 },
              { x: 200, y: 127 },
              { x: 279, y: 117 },
              { x: 310, y: 111 },
            ],
          }
        : {
            ...base,
            gems: [
              { x: 62, y: 153 },
              { x: 235, y: 106 },
              { x: 302, y: 94 },
              { x: 395, y: 110 },
            ],
            storms: [{ x: 320, y: 173 }],
          };
    const hero = newRun(scene);
    hero.time = 0.47;
    hero.ground = null;
    hero.y = mode === "jump" ? 148 : 151;
    const redraw = () => {
      const w = sizeCanvas(surface);
      hero.x = Math.max(94, w * (mode === "jump" ? 0.37 : 0.36));
      displayFrame(surface, ctx, sprite, w, scene, hero, 0.47, [], true, true);
    };
    redraw();
    const observer = new ResizeObserver(redraw);
    observer.observe(surface);
    return () => observer.disconnect();
  }, [mode]);
  return (
    <div className={`adventure-poster poster-${mode}`} aria-hidden="true">
      <canvas ref={canvas} />
      <div className="arcade-actor" ref={actor}>
        <Companion
          sprite
          kind={profile.companion}
          color={profile.color}
          accessory={profile.accessory}
        />
      </div>
    </div>
  );
}
function BoardPoster({ mode, profile }: { mode: BoardMode; profile: Profile }) {
  const board = boards[mode][mode === "river" ? 0 : 3];
  const run = useMemo(() => {
    const r = startBoard(board);
    if (mode === "river") {
      r.y = 2;
      r.time = 1.4;
      r.x = raftX(board, 3, r.y, r.time);
    } else {
      r.x = 2;
      r.y = 3;
    }
    return r;
  }, [board, mode]);
  return (
    <div
      aria-hidden="true"
      className={`adventure-poster board-poster poster-${mode}`}
    >
      <BoardScene poster board={board} run={run} profile={profile} />
    </div>
  );
}
const gameIcons = { river: Waves, ice: Snowflake, jump: Gamepad2, glide: Wind };
export function AdventureShelf({
  profile,
  visible,
}: {
  profile: Profile;
  visible: ReadonlySet<string>;
}) {
  return (
    <div className="adventure-shelf">
      {[...expeditions, ...adventures]
        .filter((game) => visible.has(game.slug))
        .map((game) => {
          const Icon = gameIcons[game.mode];
          return (
            <Link
              key={game.slug}
              to={`/tro-choi/${game.slug}`}
              className={`adventure-card card-${game.mode}`}
            >
              {game.mode === "river" || game.mode === "ice" ? (
                <BoardPoster mode={game.mode} profile={profile} />
              ) : (
                <Poster mode={game.mode} profile={profile} />
              )}
              <div className="adventure-card-copy">
                <div>
                  <span className="adventure-type">
                    <Icon size={15} />
                    {"genre" in game
                      ? game.genre
                      : game.mode === "jump"
                        ? "Đi cảnh"
                        : "Bay lượn"}{" "}
                    · <LevelCount slug={game.slug} />
                  </span>
                  <h2>{game.title}</h2>
                  <p>{game.blurb}</p>
                </div>
                <span className="adventure-card-arrow" aria-hidden="true">
                  <ArrowUpRight size={23} />
                </span>
              </div>
            </Link>
          );
        })}
    </div>
  );
}

import { RailwayPostcard } from "../railway/Railway";
import { routes as railwayRoutes } from "../railway/railway";
import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { LevelPicker, levelKey, readScore, recordScore } from "../levels";
import { creativeIds, difficulty, type ClubEntry } from "./catalog";
import type { Profile } from "../../state";
import MotionGame from "./MotionGame";
import type { MotionId } from "./motion";
import { challenges } from "./Challenges";
import Creative from "./Creative";
import "./club.css";
function Round({
  entry,
  level,
  profile,
  onNext,
}: {
  onNext?: () => void;
  entry: ClubEntry;
  level: number;
  profile: Profile;
}) {
  const [phase, setPhase] = useState<
      "ready" | "active" | "pause" | "won" | "lost"
    >("ready"),
    [round, restart] = useState(0),
    [points, P] = useState(0),
    [audio, A] = useState(false);
  const key = levelKey(entry.slug, level),
    [best, B] = useState(() => readScore(key));
  const elapsed = useRef(0),
    start = useRef(0),
    sound = useRef<AudioContext | null>(null),
    enabled = useRef(false);
  const pause = useCallback(
    () => setPhase((v) => (v === "active" ? "pause" : v)),
    [],
  );
  useEffect(() => {
    if (phase !== "active") return;
    start.current = performance.now();
    const visibility = () => {
      if (document.hidden) pause();
    };
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      elapsed.current += performance.now() - start.current;
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [phase, pause]);
  useEffect(
    () => () => {
      void sound.current?.close().catch(() => {});
    },
    [],
  );
  const tone = useCallback((good = true) => {
    const a = sound.current;
    if (!enabled.current || a?.state !== "running") return;
    const o = a.createOscillator(),
      g = a.createGain();
    o.frequency.value = good ? 660 : 240;
    o.connect(g);
    g.connect(a.destination);
    g.gain.setValueAtTime(0.03, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.12);
    o.start();
    o.stop(a.currentTime + 0.13);
  }, []);
  const finish = useCallback(
    (n: number, won = true) => {
      P(n);
      if (won)
        B(
          recordScore(
            key,
            {
              count: n,
              seconds: Math.max(
                0.001,
                (elapsed.current + performance.now() - start.current) / 1000,
              ),
            },
            Infinity,
          ),
        );
      setPhase(won ? "won" : "lost");
    },
    [key],
  );
  const props = { profile, level, active: phase === "active", tone, finish };
  const Game = challenges[entry.slug],
    creative = creativeIds.has(entry.slug);
  return (
    <>
      <div className="club-toolbar">
        {!creative && (
          <>
            <button
              className="button secondary"
              onClick={() => {
                enabled.current = !audio;
                A(!audio);
                if (!audio) {
                  try {
                    sound.current ??= new AudioContext();
                    void sound.current.resume().catch(() => {});
                  } catch {
                    enabled.current = false;
                    A(false);
                  }
                }
              }}
              aria-pressed={audio}
            >
              {audio ? "Tắt âm" : "Bật âm"}
            </button>
            {phase === "active" && (
              <button className="button secondary" onClick={pause}>
                Tạm dừng
              </button>
            )}
            {best && <span>Kỷ lục: {best.count} điểm</span>}
          </>
        )}
      </div>
      {creative ? (
        <Creative id={entry.slug} />
      ) : (
        <>
          {phase === "ready" ? (
            <div className="club-start">
              {entry.slug === "duong-ray" ? (
                <RailwayPostcard />
              ) : (
                <span aria-hidden="true">{entry.mark}</span>
              )}
              <button
                className="button primary"
                onClick={() => setPhase("active")}
              >
                Bắt đầu chơi
              </button>
            </div>
          ) : (
            <>
              {(phase === "active" || phase === "pause") && (
                <div hidden={phase === "pause"}>
                  {Game ? (
                    <Game key={round} {...props} />
                  ) : (
                    <MotionGame
                      key={round}
                      id={entry.slug as MotionId}
                      {...props}
                    />
                  )}
                </div>
              )}
              {phase === "pause" && (
                <button
                  className="button primary"
                  onClick={() => setPhase("active")}
                >
                  Tiếp tục chơi
                </button>
              )}
              {(phase==="won" || phase==="lost") && <div role="status"><h2>{phase==="won"?"Hoàn thành rồi!":"Hết lượt"} · {points} điểm</h2></div>}
              {phase==="won" && onNext && <button className="button primary" onClick={onNext}>Chặng tiếp theo</button>}
              <button
                className="button secondary"
                onClick={() => {
                  elapsed.current = 0;
                  start.current = performance.now();
                  restart((v) => v + 1);
                  setPhase("active");
                }}
              >
                Chơi lại
              </button>
            </>
          )}
        </>
      )}
    </>
  );
}
export default function Club({
  entry,
  profile,
}: {
  entry: ClubEntry;
  profile: Profile;
}) {
  const [level, L] = useState(0);
  return (
    <section className="play-table club-stage">
      <header>
        <h1>{entry.title}</h1>
        <p>{entry.help}</p>
      </header>
      {!creativeIds.has(entry.slug) && (
        <LevelPicker
          slug={entry.slug}
          titles={
            entry.slug === "duong-ray"
              ? railwayRoutes.map((r) => r.name)
              : difficulty
          }
          index={level}
          onSelect={L}
        />
      )}
      <Round
        key={level}
        entry={entry}
        profile={profile}
        level={level}
        onNext={level < difficulty.length - 1 ? () => L(level + 1) : undefined}
      />
      <Link className="back-to-shelf" to="/tro-choi">
        Về bàn trò chơi
      </Link>
    </section>
  );
}

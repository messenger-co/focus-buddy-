import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Clock3, Footprints, Gamepad2, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import Companion from "../components/Companion";
import type { Profile } from "../state";
import "./buddy-runner.css";

const BEST_KEY = "focus-buddy-runner-record-v1";
const HEIGHT = 270;
type Obstacle = { x: number; width: number; height: number };
type Physics = { y: number; vy: number; distance: number; spawn: number; obstacles: Obstacle[] };
function record() {
  try {
    const value = Number(localStorage.getItem(BEST_KEY) || "0");
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
  } catch { return 0; }
}
function draw(ctx: CanvasRenderingContext2D, width: number, game: Physics, time: number) {
  ctx.clearRect(0, 0, width, HEIGHT);
  const grd = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grd.addColorStop(0, "#eff4fe"); grd.addColorStop(1, "#f8faf0");
  ctx.fillStyle = grd; ctx.fillRect(0, 0, width, HEIGHT);
  for (let i = 0; i < 5; i++) {
    const x = ((i * 197 + 70 - game.distance * 0.16) % (width + 240) + width + 240) % (width + 240) - 50;
    const y = 28 + i % 3 * 33;
    ctx.fillStyle = "#ffffffdc";
    ctx.beginPath(); ctx.ellipse(x, y, 41, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x - 12, y - 8, 20, 14, 0, 0, Math.PI * 2); ctx.fill();
  }
  const ground = HEIGHT - 25;
  ctx.fillStyle = "#c7dfba";ctx.fillRect(0, ground, width, 25);
  ctx.fillStyle = "#76996a";ctx.fillRect(0, ground, width, 3);
  for (let i = 0; i < 38; i++) {
    const x = ((i * 59 - game.distance * 0.5) % (width + 65) + width + 65) % (width + 65);
    ctx.strokeStyle = i % 3 ? "#80a871" : "#e9d58e";
    ctx.beginPath(); ctx.moveTo(x, ground + 11); ctx.lineTo(x - 3, ground + 5); ctx.lineTo(x + 2, ground + 7); ctx.stroke();
  }
  game.obstacles.forEach((obstacle) => {
    const y = ground - obstacle.height;
    ctx.fillStyle = "#769d82";
    ctx.beginPath(); ctx.roundRect(obstacle.x, y, obstacle.width, obstacle.height, 7); ctx.fill();
    ctx.fillStyle = "#a4c9a1";
    ctx.beginPath(); ctx.roundRect(obstacle.x + 5, y + 5, Math.max(3, obstacle.width - 17), 5, 3); ctx.fill();
    ctx.fillStyle = "#d4ecce";
    ctx.beginPath();ctx.ellipse(obstacle.x + obstacle.width/2, y + 6, 6, 3, 0, 0, Math.PI*2);ctx.fill();
  });
  // A soft jumping shadow beneath Buddy.
  ctx.fillStyle = `rgba(76,91,65,${0.17 - Math.min(game.y / 700, 0.12)})`;
  ctx.beginPath();ctx.ellipse(95, ground - 4, 23, 6, 0, 0, Math.PI * 2);ctx.fill();
  const t = Math.sin(time / 550);
  ctx.fillStyle = "#f5cf76";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();ctx.arc(width - 95 + i*24, 55 + (i%2)*7 + t*4, 3.2, 0, Math.PI*2);ctx.fill();
  }
}
export default function BuddyRunner({ profile }: { profile: Profile }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Physics>({ y: 0, vy: 0, distance: 0, spawn: 420, obstacles: [] });
  const [phase, setPhase] = useState<"ready" | "playing" | "over">("ready");
  const [height, setHeight] = useState(0);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(record);
  const [level, setLevel] = useState(1);
  const jump = useCallback(() => {
    if (phase !== "playing") return;
    const game = gameRef.current;
    if (game.y <= 0.5) {game.y = 0.6;game.vy = 560;}
  }, [phase]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.code === "Space" || event.code === "ArrowUp") && phase === "playing") {
        event.preventDefault();jump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, jump]);
  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let previous = 0;
    let uiTime = 0;
    let width = 0;
    function resize() {
      if (!canvas || !ctx) return;
      width = Math.max(280, canvas.getBoundingClientRect().width);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(HEIGHT * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    function tick(now: number) {
      if (!ctx) return;
      const dt = previous === 0 ? 0 : Math.min((now - previous) / 1000, .04);
      previous = now;
      const game = gameRef.current;
      const difficulty = 1 + Math.floor(game.distance / 1500);
      const speed = 225 + Math.min(difficulty - 1, 10) * 26;
      game.distance += speed * dt;
      game.y = Math.max(0, game.y + game.vy * dt);
      game.vy -= 1500 * dt;
      if (game.y === 0) game.vy = 0;
      game.spawn -= speed * dt;
      if (game.spawn <= 0) {
        game.obstacles.push({x: width + 32, width: 25 + Math.random()*13, height: 31 + Math.random()*25});
        game.spawn = 300 + Math.random()*130 + Math.min(difficulty*3,45);
      }
      for (const obstacle of game.obstacles) obstacle.x -= speed * dt;
      game.obstacles = game.obstacles.filter((item) => item.x + item.width > -10);
      const points = Math.floor(game.distance / 10);
      if (game.obstacles.some((item) => item.x < 121 && item.x + item.width > 76 && game.y < item.height - 5)) {
        const bestScore = Math.max(record(), points);
        setBest(bestScore);
        try {localStorage.setItem(BEST_KEY, String(bestScore));} catch {/* Ignore disabled storage. */}
        setPhase("over");
        setScore(points);
        return;
      }
      draw(ctx, width, game, now);
      if (now - uiTime > 50) {
        uiTime = now;
        setHeight(game.y);
        setScore(points);
        setLevel(difficulty);
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [phase]);
  function start() {
    gameRef.current = { y: 0, vy: 0, distance: 0, spawn: 390, obstacles: [] };
    setHeight(0);setScore(0);setLevel(1);setPhase("playing");
  }
  return (
    <div className="runner-page">
      <header className="runner-header">
        <span><Footprints size={19}/> BUDDY RUN · TRÒ CHƠI NGOẠI TUYẾN</span>
        <h1>Buddy chạy vượt chướng ngại</h1>
        <p>Lấy cảm hứng từ trò khủng long ngoại tuyến: nhảy qua những gốc cây, đạt mốc điểm để lên cấp. Chơi không cần Internet.</p>
      </header>
      <section className="runner-panel">
        <div className="runner-score">
          <span><Sparkles size={16}/> Điểm: <b>{score}</b></span>
          <span><Gamepad2 size={16}/> Cấp <b>{level}</b></span>
          <span><Trophy size={16}/> Kỷ lục: <b>{best}</b></span>
        </div>
        <div className="runner-stage">
          <canvas ref={canvasRef} height={HEIGHT} aria-label="Sân chạy có gốc cây để nhảy qua"/>
          <div className="runner-buddy" style={{transform: `translateY(-${height}px)`}}>
            <Companion kind={profile.companion} color={profile.color} accessory={profile.accessory}
              paused sprite size={102}/>
          </div>
          {phase !== "playing" && (
            <div className="runner-overlay">
              <h2>{phase === "over" ? "Buddy chạy giỏi lắm!" : "Sẵn sàng xuất phát?"}</h2>
              <p>{phase === "over" ? `Bạn đã đạt ${score} điểm. Thử lại để đi xa hơn nhé!` : "Bấm phím cách, ↑ hoặc nút Nhảy để vượt qua chướng ngại."}</p>
              <button className="button primary" onClick={start} type="button">
                {phase === "over" ? <RotateCcw size={17}/> : <Footprints size={17}/>}
                {phase === "over" ? "Chơi lại" : "Bắt đầu chạy"}
              </button>
            </div>
          )}
        </div>
        <div className="runner-controls">
          <button className="button primary runner-jump" type="button" onClick={jump} disabled={phase !== "playing"}>↑ Nhảy</button>
          <p>Nhảy đúng lúc; trò chơi tăng tốc theo cấp. Kỷ lục được lưu trên thiết bị này.</p>
          <Link to="/tap-trung" className="runner-return">Quay lại tập trung <ArrowRight size={15}/></Link>
        </div>
      </section>
    </div>
  );
}

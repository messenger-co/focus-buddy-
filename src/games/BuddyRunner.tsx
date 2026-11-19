import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Footprints, Gamepad2, Pause, Play, RotateCcw, Sparkles, Trophy } from "lucide-react";
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
/** Layered 2.5D scenery: gradients, moving hills and shaded obstacles.
 * Everything is procedural Canvas 2D; no WebGL or downloaded assets. */
function draw(ctx: CanvasRenderingContext2D, width: number, game: Physics, time: number) {
  ctx.clearRect(0, 0, width, HEIGHT);
  const level = 1 + Math.floor(game.distance / 1500);
  const world = Math.floor((level - 1) / 3) % 4;
  const sky = [
    ["#82c9e2", "#e9eff4", "#fef4d5"],
    ["#ffb49b", "#edc4c1", "#ffead0"],
    ["#49588d", "#8890bc", "#d7bed5"],
    ["#26365e", "#4d5989", "#a4a9c9"],
  ][world];
  const skyGradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  skyGradient.addColorStop(0, sky[0]);
  skyGradient.addColorStop(.56, sky[1]);
  skyGradient.addColorStop(1, sky[2]);
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, HEIGHT);

  const sunX = width * .73 - (game.distance * .018 % (width * .18));
  const sunY = 52;
  const glow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 100);
  glow.addColorStop(0, world > 1 ? "#f2e8f655" : "#fff5ccbc");
  glow.addColorStop(1, "#ffffff00");
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 100, sunY - 100, 200, 200);
  ctx.fillStyle = world > 1 ? "#f2ebd9" : "#fff5d0";
  ctx.beginPath(); ctx.arc(sunX, sunY, world > 1 ? 17 : 23, 0, Math.PI * 2); ctx.fill();

  if (world > 1) {
    for (let i = 0; i < 28; i++) {
      const x = ((i * 97.47 - game.distance * .027) % (width + 90) + width + 90) % (width + 90);
      const y = 12 + (i * 53) % 106;
      ctx.globalAlpha = .35 + Math.sin(time / 570 + i) * .24;
      ctx.fillStyle = "#fff4df";
      ctx.beginPath(); ctx.arc(x, y, i % 5 === 0 ? 1.9 : 1.1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Clouds cast soft shadows and drift independently of the ground.
  for (let i = 0; i < 9; i++) {
    const span = width + 220;
    const x = ((i * 167 - game.distance * .045) % span + span) % span - 110;
    const y = 35 + (i * 29) % 62;
    const scale = .65 + i % 3 * .18;
    ctx.save();ctx.translate(x, y);ctx.scale(scale, scale);
    ctx.fillStyle = world === 3 ? "#dfe5f170" : "#ffffffad";
    ctx.beginPath();ctx.ellipse(0, 5, 48, 13, 0, 0, Math.PI * 2);ctx.fill();
    ctx.beginPath();ctx.ellipse(-17, -3, 25, 18, 0, 0, Math.PI * 2);ctx.fill();
    ctx.beginPath();ctx.ellipse(10, -9, 30, 23, 0, 0, Math.PI * 2);ctx.fill();
    ctx.restore();
  }

  function hills(y: number, color: string, rate: number, height: number, period: number) {
    ctx.fillStyle = color;
    ctx.beginPath();ctx.moveTo(0, HEIGHT);
    for (let x = -12; x <= width + 15; x += 8) {
      const worldX = x + game.distance * rate;
      ctx.lineTo(x, y + Math.sin(worldX / period) * height + Math.sin(worldX / (period * .47)) * height * .25);
    }
    ctx.lineTo(width, HEIGHT);ctx.closePath();ctx.fill();
  }
  hills(162, world > 1 ? "#8b8db2a0" : "#b3cad0", .09, 19, 105);
  hills(187, world > 1 ? "#646a97" : "#8eafb7", .18, 23, 81);
  hills(219, world > 1 ? "#4e6182" : "#6a9b91", .34, 12, 48);

  // Foreground low-poly bushes with cast shadows.
  for (let i = 0; i < 21; i++) {
    const span = width + 115;
    const x = ((i * 83 - game.distance * .52) % span + span) % span - 30;
    const y = HEIGHT - 22 - i % 3 * 6;
    ctx.fillStyle = "#234f4c36";
    ctx.beginPath();ctx.ellipse(x, y + 5, 20, 4, 0, 0, Math.PI * 2);ctx.fill();
    ctx.fillStyle = world > 1 ? "#587e79" : "#5c987b";
    ctx.beginPath();ctx.ellipse(x, y, 12 + i % 3 * 2, 12, 0, Math.PI, 0);ctx.fill();
    ctx.fillStyle = "#d1ecc53d";
    ctx.beginPath();ctx.ellipse(x - 4, y - 4, 5, 4, -.4, Math.PI, 0);ctx.fill();
  }

  const ground = HEIGHT - 25;
  ctx.fillStyle = world > 1 ? "#2f5473" : "#6da888";
  ctx.fillRect(0, ground, width, 25);
  ctx.fillStyle = world > 1 ? "#89b6bc" : "#d0e5ab";
  ctx.fillRect(0, ground, width, 4);
  ctx.fillStyle = "#1a4b443a";ctx.fillRect(0, ground + 5, width, 7);
  for (let i = 0; i < 42; i++) {
    const x = ((i * 53 - game.distance * .78) % (width + 70) + width + 70) % (width + 70);
    const y = ground + 10 + (i % 2) * 6;
    ctx.fillStyle = i % 3 ? "#e6edc667" : "#3c716954";
    ctx.fillRect(x, y, 7 + i % 4 * 4, 2);
  }

  // Obstacles have a brighter top, a shaded side and a ground shadow.
  game.obstacles.forEach((obstacle) => {
    const x = obstacle.x;
    const y = ground - obstacle.height;
    ctx.fillStyle = "#203d4a4a";
    ctx.beginPath();ctx.ellipse(x + obstacle.width * .65, ground + 2, obstacle.width * .8, 6, 0, 0, Math.PI * 2);ctx.fill();
    const trunk = ctx.createLinearGradient(x, y, x + obstacle.width, y);
    trunk.addColorStop(0, "#a6bf88");
    trunk.addColorStop(.46, "#608e77");
    trunk.addColorStop(1, "#355e63");
    ctx.fillStyle = trunk;
    ctx.beginPath();ctx.roundRect(x, y + 4, obstacle.width, obstacle.height - 4, 7);ctx.fill();
    ctx.fillStyle = "#224d5980";
    ctx.beginPath();ctx.moveTo(x + obstacle.width - 7, y + 9);ctx.lineTo(x + obstacle.width + 4, y + 2);ctx.lineTo(x + obstacle.width + 4, ground - 4);ctx.lineTo(x + obstacle.width - 7, ground);ctx.closePath();ctx.fill();
    const top = ctx.createLinearGradient(x, y, x, y + 12);
    top.addColorStop(0, "#e4f3bc");top.addColorStop(1, "#8db792");
    ctx.fillStyle = top;ctx.beginPath();ctx.ellipse(x + obstacle.width / 2, y + 5, obstacle.width / 2 + 2, 8, 0, 0, Math.PI * 2);ctx.fill();
    ctx.strokeStyle = "#fafff093";ctx.lineWidth = 2;ctx.beginPath();ctx.moveTo(x + 6, y + 19);ctx.lineTo(x + 6, ground - 11);ctx.stroke();
  });

  // Buddy's contact shadow grows and fades while jumping.
  const shadow = Math.max(.06, .22 - game.y / 650);
  ctx.fillStyle = `rgba(37,58,62,${shadow})`;
  ctx.beginPath();ctx.ellipse(95, ground - 1, 22 + game.y * .045, 5 + game.y * .012, 0, 0, Math.PI * 2);ctx.fill();
  // Dust motes on the near camera layer.
  for (let i = 0; i < 11; i++) {
    const x = ((i * 121 - game.distance * .72) % (width + 150) + width + 150) % (width + 150);
    const y = ground - 10 - (i % 4) * 6 + Math.sin(time / 500 + i) * 2;
    ctx.fillStyle = i % 2 ? "#e7f8d88a" : "#fff1b785";
    ctx.beginPath();ctx.arc(x, y, i % 3 === 0 ? 2 : 1.1, 0, Math.PI * 2);ctx.fill();
  }
}

export default function BuddyRunner({ profile }: { profile: Profile }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Physics>({ y: 0, vy: 0, distance: 0, spawn: 420, obstacles: [] });
  const [phase, setPhase] = useState<"ready" | "playing" | "paused" | "over">("ready");
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
      if (event.code === "KeyP" && (phase === "playing" || phase === "paused")) {
        event.preventDefault();setPhase((current) => current === "playing" ? "paused" : "playing");
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
          <span><Gamepad2 size={16}/> Cấp <b>{level}</b> · {["Rừng sớm", "Hoàng hôn", "Chiều tím", "Đêm sao"][Math.floor((level - 1) / 3) % 4]}</span>
          <span><Trophy size={16}/> Kỷ lục: <b>{best}</b></span>
        </div>
        <div className={`runner-stage runner-world-${Math.floor((level - 1) / 3) % 4}${phase === "over" ? " impact" : ""}`} onPointerDown={(event) => { if (event.target === event.currentTarget || event.target instanceof HTMLCanvasElement) jump(); }}>
          <canvas ref={canvasRef} height={HEIGHT} aria-label="Sân chạy có gốc cây để nhảy qua"/>
          <div className={`runner-buddy ${phase === "playing" && height < 1 ? "buddy-striding" : ""}`} style={{transform: `translate3d(0,-${height}px,0)`}}>
            <Companion kind={profile.companion} color={profile.color} accessory={profile.accessory}
              paused sprite size={102}/>
          </div>
          {phase !== "playing" && (
            <div className="runner-overlay">
              <h2>{phase === "over" ? "Buddy chạy giỏi lắm!" : phase === "paused" ? "Tạm dừng một chút" : "Sẵn sàng xuất phát?"}</h2>
              <p>{phase === "over" ? `Bạn đã đạt ${score} điểm. Thử lại để đi xa hơn nhé!` : phase === "paused" ? "Bạn có thể tiếp tục đúng vị trí cũ, không mất điểm." : "Bấm phím cách, ↑ hoặc nút Nhảy để vượt qua chướng ngại."}</p>
              <button className="button primary" onClick={phase === "paused" ? () => setPhase("playing") : start} type="button">
                {phase === "over" ? <RotateCcw size={17}/> : phase === "paused" ? <Play size={17}/> : <Footprints size={17}/>}
                {phase === "over" ? "Chơi lại" : phase === "paused" ? "Tiếp tục" : "Bắt đầu chạy"}
              </button>
            </div>
          )}
        </div>
        <div className="runner-controls">
          <div className="runner-action-buttons"><button className="button primary runner-jump" type="button" onClick={jump} disabled={phase !== "playing"}>↑ Nhảy</button><button className="button secondary" type="button" onClick={() => setPhase((current) => current === "playing" ? "paused" : "playing")} disabled={phase !== "playing" && phase !== "paused"}>{phase === "paused" ? <Play size={16}/> : <Pause size={16}/>} {phase === "paused" ? "Tiếp tục" : "Tạm dừng"}</button></div>
          <p>Nhảy đúng lúc, nhấn P để tạm dừng. Mỗi ba cấp, khung cảnh chuyển sang một thế giới mới. Kỷ lục chỉ lưu trên thiết bị.</p>
          <Link to="/tap-trung" className="runner-return">Quay lại tập trung <ArrowRight size={15}/></Link>
        </div>
      </section>
    </div>
  );
}

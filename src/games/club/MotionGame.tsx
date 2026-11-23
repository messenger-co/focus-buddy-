import { useEffect, useRef, useState } from "react";
import Companion from "../../components/Companion";
import { english } from "../../foundation/language";
import {
  advanceWorld,
  arrows,
  beatInput,
  cols,
  dropDuration,
  catchTimeLimit,
  starCatchProgress,
  maxDanceMisses,
  makeWorld,
  rows,
  type Arrow,
  type MotionId,
  type World,
} from "./motion";
import type { PlayProps } from "./props";

const glyph: Record<Arrow, string> = {
  up: "↑",
  right: "→",
  down: "↓",
  left: "←",
};
const names: Record<Arrow, string> = {
  up: "Lên",
  right: "Phải",
  down: "Xuống",
  left: "Trái",
};
const palette = ["#93cfbf", "#ffb782", "#c5aadc", "#9fbaed"];
function draw(ctx: CanvasRenderingContext2D, w: World) {
  const g = ctx;
  g.clearRect(0, 0, 400, 200);
  function oval(x: number, y: number, a: number, b: number, color: string) {
    g.fillStyle = color;
    g.beginPath();
    g.ellipse(x, y, a, b, 0, 0, Math.PI * 2);
    g.fill();
  }
  function rect(x: number, y: number, a: number, b: number, color: string) {
    g.fillStyle = color;
    g.fillRect(x, y, a, b);
  }
  function poly(points: number[][], color: string) {
    g.fillStyle = color;
    g.beginPath();
    points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.fill();
  }
  function label(s: string, x: number, y: number, size: number, color: string) {
    g.fillStyle = color;
    g.textAlign = "center";
    g.font = `bold ${size}px system-ui`;
    g.fillText(s, x, y);
  }
  function star(x: number, y: number, r: number, c: string) {
    poly(
      Array.from({ length: 10 }, (_, i) => [
        x + Math.cos((i * Math.PI) / 5 - Math.PI / 2) * r * (i % 2 ? 0.45 : 1),
        y + Math.sin((i * Math.PI) / 5 - Math.PI / 2) * r * (i % 2 ? 0.45 : 1),
      ]),
      c,
    );
  }
  const sky = g.createLinearGradient(0, 0, 0, 200);
  sky.addColorStop(
    0,
    w.id === "duong-chay"
      ? "#e6a185"
      : w.id === "hung-sao"
        ? "#343e71"
        : w.id === "vu-dieu"
          ? "#493663"
          : "#597b66",
  );
  sky.addColorStop(
    1,
    w.id === "duong-chay"
      ? "#fce7af"
      : w.id === "hung-sao"
        ? "#7997ac"
        : w.id === "vu-dieu"
          ? "#98728e"
          : "#9fb892",
  );
  g.fillStyle = sky;
  g.fillRect(0, 0, 400, 200);
  if (w.id === "duong-chay") {
    oval(312, 52, 30, 30, "#ffdfa2");
    oval(312, 52, 21, 21, "#fff2c3");
    for (let layer = 0; layer < 2; layer++) {
      const pts = [[0, 166]];
      for (let x = 0; x <= 410; x += 10)
        pts.push([
          x,
          101 +
            layer * 27 +
            Math.sin((x + w.distance * (0.08 + layer * 0.13)) / 49) * 14 +
            Math.cos(x / 40) * 4,
        ]);
      pts.push([410, 166]);
      poly(pts, layer ? "#809581" : "#bfafa0");
    }
    for (let i = -1; i < 8; i++) {
      const x = i * 72 - ((w.distance * 0.5) % 72);
      rect(x + 2, 122, 4, 36, "#796958");
      poly(
        [
          [x - 13, 140],
          [x + 4, 101],
          [x + 21, 140],
        ],
        "#618b75",
      );
      poly(
        [
          [x - 9, 128],
          [x + 4, 95],
          [x + 17, 128],
        ],
        "#6f9f84",
      );
    }
    rect(0, 160, 400, 40, "#956d56");
    rect(0, 160, 400, 7, "#bad295");
    rect(0, 167, 400, 4, "#769875");
    for (let i = -1; i < 15; i++) {
      const x = i * 35 - (w.distance % 35);
      oval(x, 183 + (i % 3), 5, 2, "#b78a64");
    }
    for (const obstacle of w.rocks) {
      const x = 74 + obstacle - w.distance;
      if (x < -22 || x > 430) continue;
      poly(
        [
          [x - 15, 160],
          [x - 11, 145],
          [x + 2, 136],
          [x + 12, 145],
          [x + 17, 160],
        ],
        "#715875",
      );
      poly(
        [
          [x - 11, 145],
          [x + 2, 136],
          [x + 5, 150],
          [x - 5, 154],
        ],
        "#b8a0a7",
      );
    }
    const end = 74 + w.rocks[w.rocks.length - 1] + 70 - w.distance;
    if (end < 435) {
      rect(end, 108, 3, 54, "#705543");
      poly(
        [
          [end, 109],
          [end + 21, 115],
          [end, 123],
        ],
        "#f9c166",
      );
    }
    oval(74, 161, 13 - w.y / 14, 2.7, "#5b624648");
    return {
      x: 74,
      y: 161 - w.y,
      size: 47,
      tilt: w.y ? Math.max(-12, Math.min(12, -w.vy * 0.04)) : 0,
    };
  }
  for (let i = 0; i < 30; i++) {
    const x = (i * 83 + 14) % 399,
      y = (i * 37 + 7) % 145;
    star(x, y, 1.3 + (i % 3) * 0.35, "#fff3c8af");
  }
  if (w.id === "hung-sao") {
    for (let i = 0; i < 4; i++) {
      const x = 35 + i * 83;
      rect(x, 20, 80, 149, i === w.lane ? "#c9effc23" : "#afc6e20a");
      rect(x, 169, 80, 4, i === w.lane ? "#ffe39c" : "#8fa6b9");
      label(String(i + 1), x + 40, 190, 13, i === w.lane ? "#fff3b9" : "#cad7e3");
    }
    poly(
      [
        [0, 192],
        [55, 175],
        [120, 190],
        [217, 179],
        [295, 183],
        [358, 174],
        [400, 182],
        [400, 200],
        [0, 200],
      ],
      "#41596c",
    );
    for (const item of w.items) {
      const x = 75 + item.lane * 83,
        y = 12 + 149 * Math.min(1, (w.t - item.born) / dropDuration(w.level));
      if (item.kind !== "storm" &&
          (w.t - item.born) / dropDuration(w.level) >= starCatchProgress - 0.14 &&
          item.lane === w.lane) {
        oval(x, 163, 22, 8, "#ffe7a45c");
      }
      if (item.kind === "star") {
        oval(x, y, 14, 14, "#ffdc872b");
        star(x, y, 10, "#ffd575");
        star(x - 2, y - 1, 5, "#fff2be");
      }
      if (item.kind === "moon") {
        oval(x, y, 9, 9, "#f4e8bc");
        oval(x + 4, y - 3, 7, 7, "#687da5");
      }
      if (item.kind === "storm") {
        oval(x, y, 13, 7, "#484c6d");
        oval(x - 3, y - 4, 7, 7, "#575877");
        poly(
          [
            [x, y],
            [x + 5, y],
            [x + 1, y + 6],
            [x + 5, y + 6],
            [x - 3, y + 13],
          ],
          "#ffe891",
        );
      }
    }
    return { x: 75 + w.lane * 83, y: 169, size: 45, tilt: 0 };
  }
  if (w.id === "vu-dieu") {
    for (let i = 0; i < 4; i++) {
      const x = 108 + i * 54;
      poly(
        [
          [x - 4, 0],
          [x + 4, 0],
          [x + 29, 165],
          [x - 29, 165],
        ],
        "#ead1e617",
      );
      rect(x - 23, 15, 47, 150, "#272e4b49");
      oval(x, 151, 15, 15, palette[i]);
      oval(x, 151, 12, 12, "#494660");
      label(glyph[arrows[i]], x, 157, 18, "#fff5dc");
    }
    for (let i = w.index; i < w.notes.length; i++) {
      const n = w.notes[i],
        dy = (n.at - w.t) * 91,
        y = 151 - dy;
      if (y < -20) break;
      const lane = arrows.indexOf(n.dir),
        x = 108 + lane * 54;
      oval(x, y + 2, 13, 13, "#34324c");
      oval(x, y, 12, 12, palette[lane]);
      label(glyph[n.dir], x, y + 5, 16, "#393a49");
    }
    rect(0, 171, 400, 29, "#55475e");
    rect(0, 171, 400, 4, "#b99691");
    return { x: 46, y: 171, size: 50, tilt: Math.sin(w.t * 7) * 8 };
  }
  const cell = 17,
    ox = (400 - cols * cell) / 2,
    oy = 14;
  rect(ox - 4, oy - 4, cols * cell + 8, rows * cell + 8, "#4b6559");
  for (let i = 0; i < cols * rows; i++) {
    const x = ox + (i % cols) * cell,
      y = oy + Math.floor(i / cols) * cell;
    rect(
      x,
      y,
      cell,
      cell,
      (i + Math.floor(i / cols)) % 3 ? "#c2d4a1" : "#b8cd9b",
    );
    if (w.stones.includes(i)) {
      poly(
        [
          [x + 1, y + 13],
          [x + 4, y + 4],
          [x + 11, y + 2],
          [x + 15, y + 8],
          [x + 14, y + 14],
        ],
        "#768986",
      );
    }
    if (i === w.apple) {
      oval(x + 8, y + 9, 6, 6, "#dd7764");
      oval(x + 11, y + 3, 4, 2, "#58794f");
    }
  }
  for (let k = w.body.length - 1; k >= 0; k--) {
    const i = w.body[k],
      x = ox + ((i % cols) + 0.5) * cell,
      y = oy + (Math.floor(i / cols) + 0.5) * cell;
    oval(
      x,
      y,
      k === 0 ? 8.4 : 7.9,
      k === 0 ? 8.4 : 7.9,
      k === 0 ? "#4a7961" : k % 2 ? "#72a882" : "#609674",
    );
    if (k === 0) {
      oval(x - 2, y - 3, 2, 2, "#fff2cf");
      oval(x + 4, y - 3, 2, 2, "#fff2cf");
      oval(x - 1.5, y - 3, 1, 1, "#263f38");
      oval(x + 4.5, y - 3, 1, 1, "#263f38");
    }
  }
  return { x: 42, y: 152, size: 48, tilt: 0 };
}
function translateMotionNotice(message: string): string {
  const points = message.match(/^\+\s*(\d+) điểm/);
  if (points) return "+" + points[1] + " points · Caught!";
  const dictionary: Record<string, string> = {
    "Mây giông! Chuyển làn để tránh nhé.": "Storm cloud! Switch lanes to dodge it.",
    "Vấp đá trên đường chạy.": "Oops! You hit a rock. Try another jump.",
    "Chờ nốt vào vòng sáng.": "Wait until the note reaches the glowing ring.",
    "Đúng nhịp!": "Perfect timing!",
    "Bắt được nốt!": "Nice catch!",
    "Lệch hướng rồi.": "Try the matching arrow next time.",
    "Lỡ một nốt.": "Missed a note. You can still recover.",
  };
  return dictionary[message] || message;
}

export default function MotionGame({
  id,
  level,
  active,
  profile,
  finish,
  tone,
}: PlayProps & { id: MotionId }) {
  const [world] = useState(() => makeWorld(id, level)),
    surface = useRef<HTMLCanvasElement>(null),
    actor = useRef<HTMLDivElement>(null);
  const [hud, setHud] = useState(""),
    [notice, setNotice] = useState("");
  const play = useRef(active);
  play.current = active;
  const input = (cmd: Arrow | "jump" | number) => {
    if (play.current) beatInput(world, cmd);
  };
  const pointer = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const canvas = surface.current,
      sprite = actor.current;
    if (!canvas || !sprite || typeof CanvasRenderingContext2D === "undefined")
      return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let request = 0,
      last: number | null = null,
      score = world.score,
      text = "",
      msg = "";
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2),
        bounds = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(bounds.width * ratio));
      canvas.height = Math.max(1, Math.round(bounds.height * ratio));
      render();
    };
    function render() {
      if (!canvas || !ctx || !sprite) return;
      ctx.setTransform(canvas.width / 400, 0, 0, canvas.height / 200, 0, 0);
      const p = draw(ctx, world);
      sprite.style.left = p.x / 4 + "%";
      sprite.style.top = p.y / 2 + "%";
      sprite.style.width = p.size / 4 + "%";
      sprite.style.height = p.size / 2 + "%";
      sprite.style.transform = `translate(-50%,-100%) rotate(${p.tilt}deg)`;
      const status =
        world.id === "hung-sao"
          ? english
            ? `${world.score}/${world.goal} points · ${world.hearts} hearts · ${Math.max(0, Math.ceil(catchTimeLimit(level) - world.t))} sec`
            : `${world.score}/${world.goal} điểm · ${world.hearts} tim · ${Math.max(0, Math.ceil(catchTimeLimit(level) - world.t))} giây`
          : world.id === "vu-dieu"
            ? english
              ? `${world.index}/${world.goal} notes · ${maxDanceMisses - world.misses} chances`
              : `${world.index}/${world.goal} nốt · ${maxDanceMisses - world.misses} lượt còn lại`
            : english
              ? `${world.score}/${world.goal} ${world.id === "ran-vuon" ? "apples" : "rocks"}`
              : `${world.score}/${world.goal} ${world.id === "ran-vuon" ? "táo" : "tảng đá"}`;
      if (status !== text) {
        text = status;
        setHud(status);
      }
      if (msg !== world.notice) {
        msg = world.notice;
        setNotice(english ? translateMotionNotice(msg) : msg);
      }
    }
    function tick(now: number) {
      if (!play.current) return;
      let dt = last === null ? 0 : Math.min(0.08, (now - last) / 1000);
      last = now;
      while (dt > 0) {
        const step = Math.min(dt, 1 / 90);
        advanceWorld(world, step);
        dt -= step;
      }
      if (score !== world.score) {
        score = world.score;
        tone();
      }
      render();
      if (world.end) {
        finish(world.score, world.end === "won");
        return;
      }
      request = requestAnimationFrame(tick);
    }
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    if (active) request = requestAnimationFrame(tick);
    function key(e: KeyboardEvent) {
      if (!play.current || e.altKey || e.ctrlKey || e.metaKey) return;
      const map: Record<string, Arrow | "jump"> = {
        ArrowUp: "up",
        ArrowRight: "right",
        ArrowDown: "down",
        ArrowLeft: "left",
        KeyW: "up",
        KeyD: "right",
        KeyS: "down",
        KeyA: "left",
        Space: "jump",
      };
      const cmd = map[e.code];
      if (
        !cmd ||
        (e.code === "Space" && (e.target as HTMLElement).closest("button"))
      )
        return;
      e.preventDefault();
      if (!e.repeat) beatInput(world, cmd);
    }
    window.addEventListener("keydown", key);
    return () => {
      cancelAnimationFrame(request);
      observer.disconnect();
      window.removeEventListener("keydown", key);
    };
  }, [active, world, finish, tone, level]);
  const controls =
    id === "duong-chay"
      ? (["jump"] as const)
      : id === "hung-sao"
        ? (["left", "right"] as const)
        : arrows;
  return (
    <>
      <div className="club-hud">{hud}</div>
      <div
        className="club-motion"
        onPointerDown={(e) => {
          if (!active) return;
          pointer.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
          const bounds = e.currentTarget.getBoundingClientRect();
          if (id === "hung-sao")
            input(
              Math.round(
                (((e.clientX - bounds.left) / bounds.width) * 400 - 75) / 83,
              ),
            );
          if (id === "duong-chay") input("jump");
        }}
        onPointerMove={(e) => {
          if (id !== "hung-sao" || !pointer.current || !active) return;
          const bounds = e.currentTarget.getBoundingClientRect();
          if (bounds.width <= 0) return;
          input(Math.round((((e.clientX - bounds.left) / bounds.width) * 400 - 75) / 83));
        }}
        onPointerCancel={() => { pointer.current = null; }}
        onPointerUp={(e) => {
          if (id === "hung-sao") {
            pointer.current = null;
            return;
          }
          if (!pointer.current || id !== "ran-vuon") return;
          const dx = e.clientX - pointer.current.x,
            dy = e.clientY - pointer.current.y;
          pointer.current = null;
          if (Math.max(Math.abs(dx), Math.abs(dy)) > 12)
            input(
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
        <canvas
          ref={surface}
          role="img"
          aria-label={
            id === "ran-vuon"
              ? "Khu vườn của rắn"
              : id === "hung-sao"
                ? "Bốn làn hứng sao"
                : id === "vu-dieu"
                  ? "Các nốt nhạc đang tiến về vòng sáng"
                  : "Đường chạy và các tảng đá"
          }
        />
        <div className="club-sprite" ref={actor}>
          <Companion
            sprite
            kind={profile.companion}
            color={profile.color}
            accessory={profile.accessory}
          />
        </div>
      </div>
      <div className="club-pad">
        {controls.map((c) => (
          <button
            key={c}
            type="button"
            disabled={!active}
            aria-label={c === "jump" ? "Nhảy" : names[c]}
            onPointerDown={(e) => {
              if (e.button === 0) {
                e.preventDefault();
                input(c);
              }
            }}
            onClick={(e) => {
              if (e.detail === 0) input(c);
            }}
          >
            {c === "jump" ? "↑ Nhảy" : glyph[c]}
          </button>
        ))}
      </div>
      <p role="status">
        {notice || (id === "ran-vuon"
          ? (english ? "Choose a direction to begin." : "Chọn hướng để bắt đầu bò.")
          : id === "hung-sao"
            ? (english ? "Tap or drag to a lane. Catch stars when they reach Buddy's basket!"
              : "Chạm hoặc kéo để đổi làn. Hứng sao khi chúng chạm giỏ của Buddy!")
            : "")}
      </p>
    </>
  );
}

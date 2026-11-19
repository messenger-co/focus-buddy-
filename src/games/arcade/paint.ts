import { HEIGHT, type Biome, type Course, type Island } from "./courses";
import { cameraX, islandX, stormY, type Run } from "./simulation";

type Brush = CanvasRenderingContext2D;
const palettes = {
  grove: {
    sky: "#4ca9c5",
    horizon: "#ffe4b1",
    far: "#8cbab5",
    near: "#538f8a",
    deep: "#315e65",
    moss: "#83c764",
    rim: "#c8e87e",
    soil: "#ae6d4e",
    rock: "#79505a",
    shade: "#583f54",
    leaf: "#217a5d",
    petal: "#ffa66c",
    sun: "#ffe396",
  },
  coral: {
    sky: "#da8a8e",
    horizon: "#ffe3aa",
    far: "#d1a7a3",
    near: "#ab778f",
    deep: "#795577",
    moss: "#f2a96c",
    rim: "#ffdf86",
    soil: "#ae655c",
    rock: "#885467",
    shade: "#674255",
    leaf: "#ac5658",
    petal: "#ffe580",
    sun: "#ffdc92",
  },
  night: {
    sky: "#28294f",
    horizon: "#8a76a6",
    far: "#685f90",
    near: "#514b79",
    deep: "#353857",
    moss: "#789cb1",
    rim: "#a7e8d7",
    soil: "#726486",
    rock: "#514c75",
    shade: "#3a385c",
    leaf: "#416b81",
    petal: "#f7c690",
    sun: "#fff1b6",
  },
};
type Palette = (typeof palettes)[Biome];
const tau = Math.PI * 2;
const frac = (x: number) => x - Math.floor(x);
const noise = (seed: number) => frac(Math.sin(seed * 81.73 + 15.21) * 25816.92);

function ellipse(
  ctx: Brush,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string,
) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, tau);
  ctx.fill();
}
function poly(ctx: Brush, color: string, points: number[]) {
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2)
    ctx.lineTo(points[i], points[i + 1]);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
function line(ctx: Brush, color: string, width: number, points: number[]) {
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2)
    ctx.lineTo(points[i], points[i + 1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
function spark(ctx: Brush, x: number, y: number, r: number, color: string) {
  poly(ctx, color, [
    x,
    y - r,
    x + r * 0.24,
    y - r * 0.22,
    x + r,
    y,
    x + r * 0.24,
    y + r * 0.22,
    x,
    y + r,
    x - r * 0.22,
    y + r * 0.22,
    x - r,
    y,
    x - r * 0.22,
    y - r * 0.22,
  ]);
}
function cloud(ctx: Brush, x: number, y: number, s: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-35, 5);
  ctx.bezierCurveTo(-45, -2, -34, -10, -25, -9);
  ctx.bezierCurveTo(-26, -22, -7, -25, -1, -13);
  ctx.bezierCurveTo(8, -20, 21, -15, 23, -7);
  ctx.bezierCurveTo(40, -10, 48, 4, 35, 6);
  ctx.bezierCurveTo(10, 10, -24, 9, -35, 5);
  ctx.fill();
  ctx.restore();
}
function mountains(
  ctx: Brush,
  width: number,
  camera: number,
  layer: number,
  p: Palette,
) {
  const span = layer === 0 ? 112 : 79,
    off = camera * (layer === 0 ? 0.14 : 0.27);
  const top = layer === 0 ? 147 : 182;
  ctx.fillStyle = layer === 0 ? p.far : p.near;
  ctx.beginPath();
  ctx.moveTo(-span, HEIGHT);
  const first = Math.floor(off / span) - 1,
    last = Math.ceil((off + width) / span) + 1;
  for (let i = first; i <= last; i++) {
    const x = i * span - off;
    const peak = top - 18 - noise(i + layer * 109) * 42;
    ctx.lineTo(x, top + 8);
    ctx.lineTo(x + span * 0.32, peak + 11);
    ctx.lineTo(x + span * 0.47, peak);
    ctx.lineTo(x + span * 0.58, peak + 13);
    ctx.lineTo(x + span * 0.7, peak + 10);
    ctx.lineTo(x + span, top + 10);
  }
  ctx.lineTo(width + span, HEIGHT);
  ctx.closePath();
  ctx.fill();
  if (layer === 0)
    for (let i = first; i <= last; i++) {
      const x = i * span - off,
        peak = top - 18 - noise(i) * 42;
      poly(ctx, "#fff7dd44", [
        x + span * 0.24,
        peak + 21,
        x + span * 0.47,
        peak,
        x + span * 0.6,
        peak + 12,
        x + span * 0.52,
        peak + 9,
        x + span * 0.46,
        peak + 12,
        x + span * 0.42,
        peak + 8,
      ]);
    }
}
function tree(ctx: Brush, x: number, y: number, s: number, p: Palette) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  line(ctx, p.deep, 2.9, [0, 0, 0, -18]);
  poly(ctx, p.leaf, [-10, -6, 0, -31, 10, -6]);
  poly(ctx, p.leaf, [-8, -15, 0, -37, 8, -15]);
  poly(ctx, "#ffffff30", [0, -37, 0, -14, -8, -15]);
  ctx.restore();
}
function background(
  ctx: Brush,
  width: number,
  camera: number,
  time: number,
  biome: Biome,
) {
  const p = palettes[biome],
    night = biome === "night";
  const g = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  g.addColorStop(0, p.sky);
  g.addColorStop(0.85, p.horizon);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, HEIGHT);
  if (night) {
    for (let i = 0; i < 52; i++) {
      const x = (((noise(i + 31) * 950 - camera * 0.045) % 950) + 950) % 950,
        y = 12 + noise(i + 267) * 121;
      if (i % 7 === 0)
        spark(ctx, x, y, 2.6 + Math.sin(time * 0.8 + i) * 0.6, "#fff4cf");
      else ellipse(ctx, x, y, 0.9, 0.9, "#fff3e7a6");
    }
    ctx.save();
    ctx.globalAlpha = 0.23;
    ctx.strokeStyle = "#92f1d8";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-35, 53);
    ctx.bezierCurveTo(width * 0.2, -13, width * 0.4, 98, width * 0.72, 21);
    ctx.bezierCurveTo(width * 0.9, -7, width * 1.02, 20, width + 15, 18);
    ctx.stroke();
    ctx.restore();
  }
  const sunX = width * 0.74 - camera * 0.025,
    sunY = night ? 55 : 64;
  ellipse(ctx, sunX, sunY, 34, 34, night ? "#fff0ce18" : "#fff3b82e");
  ellipse(ctx, sunX, sunY, 22, 22, p.sun);
  if (night) {
    ellipse(ctx, sunX - 5, sunY + 6, 4, 3, "#d9c8aa");
    ellipse(ctx, sunX + 7, sunY - 8, 3, 4, "#e7d5b3");
  }
  for (let i = -1; i < Math.ceil(width / 165) + 2; i++) {
    const x = i * 165 + 58 - ((camera * 0.09 + time * 1.1) % 165);
    cloud(
      ctx,
      x,
      70 + noise(i + 18) * 50,
      0.53 + noise(i + 12) * 0.48,
      night ? "#dbd0e044" : "#fff9e7ba",
    );
  }
  mountains(ctx, width, camera, 0, p);
  mountains(ctx, width, camera, 1, p);
  ctx.fillStyle = p.deep;
  ctx.beginPath();
  ctx.moveTo(-10, HEIGHT);
  for (let x = -10; x < width + 15; x += 9) {
    const u = x + camera * 0.38;
    ctx.lineTo(x, 210 + Math.sin(u * 0.013) * 6 + Math.sin(u * 0.038) * 4);
  }
  ctx.lineTo(width + 15, HEIGHT);
  ctx.closePath();
  ctx.fill();
  for (
    let i = Math.floor((camera * 0.38) / 24) - 1;
    i < (width + camera * 0.38) / 24 + 1;
    i++
  ) {
    const x = i * 24 - camera * 0.38,
      y = 213 + Math.sin(i * 0.312) * 6;
    poly(ctx, p.deep, [
      x - 7,
      y + 2,
      x,
      y - 8 - noise(i + 54) * 12,
      x + 8,
      y + 3,
    ]);
  }
  for (let i = -1; i < Math.ceil(width / 71) + 2; i++)
    cloud(
      ctx,
      i * 71 - ((camera * 0.44) % 71),
      259 + noise(i) * 7,
      1.26,
      night ? "#b5aad796" : "#cfe7dbb3",
    );
}
function mushroom(ctx: Brush, x: number, y: number, size: number, cap: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  poly(ctx, "#fff3d2", [-2, 0, -2, -9, 2, -10, 3, 0]);
  ellipse(ctx, 0, -9, 9, 2.5, "#a46971");
  ctx.fillStyle = cap;
  ctx.beginPath();
  ctx.moveTo(-10, -9);
  ctx.bezierCurveTo(-7, -22, 6, -23, 10, -9);
  ctx.quadraticCurveTo(0, -5, -10, -9);
  ctx.fill();
  ellipse(ctx, -3, -14, 2, 1.4, "#fff4d7");
  ellipse(ctx, 3, -12, 1.3, 1.2, "#fff4d7");
  ctx.restore();
}
function island(
  ctx: Brush,
  x: number,
  i: Island,
  index: number,
  p: Palette,
  biome: Biome,
) {
  const y = i.y,
    w = i.width,
    depth = 22 + Math.min(25, w * 0.1);
  const rock = [
    x,
    y + 2,
    x + w,
    y + 2,
    x + w - 6,
    y + 16,
    x + w * 0.86,
    y + depth * 0.64,
    x + w * 0.72,
    y + depth * 0.82,
    x + w * 0.61,
    y + depth * 1.07,
    x + w * 0.44,
    y + depth * 0.78,
    x + w * 0.34,
    y + depth * 1.14,
    x + w * 0.22,
    y + depth * 0.7,
    x + 8,
    y + 18,
  ];
  poly(ctx, p.rock, rock);
  poly(ctx, p.shade, [
    x + w * 0.35,
    y + 13,
    x + w * 0.63,
    y + 8,
    x + w * 0.55,
    y + depth * 0.65,
    x + w * 0.36,
    y + depth * 1.03,
  ]);
  poly(ctx, p.soil, [
    x + 1,
    y + 2,
    x + w,
    y + 2,
    x + w - 4,
    y + 12,
    x + w * 0.78,
    y + 16,
    x + w * 0.68,
    y + 12,
    x + w * 0.55,
    y + 22,
    x + w * 0.46,
    y + 17,
    x + w * 0.27,
    y + 21,
    x + w * 0.17,
    y + 14,
    x + 5,
    y + 15,
  ]);
  poly(ctx, "#ffffff20", [
    x + w * 0.68,
    y + 17,
    x + w * 0.77,
    y + 14,
    x + w * 0.72,
    y + depth * 0.78,
    x + w * 0.65,
    y + depth * 0.88,
  ]);
  for (let j = 12; j < w - 8; j += 21) {
    const h = 7 + noise(j + index * 9) * 9;
    poly(ctx, p.moss, [
      x + j - 9,
      y + 3,
      x + j + 9,
      y + 3,
      x + j + 5,
      y + h - 2,
      x + j,
      y + h,
      x + j - 4,
      y + 7,
    ]);
  }
  poly(ctx, p.moss, [
    x - 2,
    y,
    x + 3,
    y - 2,
    x + w - 4,
    y - 2,
    x + w + 2,
    y + 1,
    x + w - 1,
    y + 7,
    x + 3,
    y + 7,
  ]);
  line(ctx, p.rim, 2.6, [x + 2, y, x + w - 2, y]);
  for (let j = 13; j < w - 9; j += 28) {
    const k = noise(index * 27 + j);
    if (k < 0.5) {
      line(ctx, p.leaf, 1.5, [
        x + j - 3,
        y - 2,
        x + j - 4,
        y - 6,
        x + j,
        y - 3,
        x + j + 2,
        y - 8,
      ]);
      if (k < 0.22) ellipse(ctx, x + j + 2, y - 8, 2.5, 2.1, p.petal);
    } else ellipse(ctx, x + j, y + 9, 2, 1.2, "#fff4ca73");
  }
  if (w > 85 && index % 2 === 0) {
    if (biome === "coral") {
      mushroom(ctx, x + 22, y - 2, 0.85, "#d85c68");
      mushroom(ctx, x + 34, y - 2, 0.49, "#dd7768");
    } else tree(ctx, x + 19, y - 1, index % 3 === 0 ? 0.72 : 0.5, p);
  }
  if (i.drift) {
    ellipse(ctx, x + w * 0.32, y + depth * 0.95, 5, 3, p.petal);
    ellipse(ctx, x + w * 0.66, y + depth * 0.82, 4, 2.5, p.petal);
    line(ctx, p.rim, 1.8, [
      x + w * 0.32 - 3,
      y + depth + 3,
      x + w * 0.32 + 3,
      y + depth + 3,
    ]);
  }
  if (i.spring !== undefined) mushroom(ctx, x + i.spring, y, 1.15, "#e75a59");
  if (i.thorns !== undefined) {
    const cx = x + i.thorns;
    for (let j = -1; j <= 1; j++) {
      poly(ctx, "#683955", [
        cx + j * 8 - 6,
        y,
        cx + j * 8,
        y - 14 + Math.abs(j) * 4,
        cx + j * 8 + 6,
        y,
      ]);
      line(ctx, "#e6a0ae", 1, [cx + j * 8 - 1, y - 8, cx + j * 8 - 3, y - 2]);
    }
  }
}
function gem(ctx: Brush, x: number, y: number, t: number) {
  const w = 5.1 + Math.cos(t * 3.2) * 0.9;
  ellipse(ctx, x, y, 10, 10, "#ffdf6d32");
  poly(ctx, "#9d633e", [x, y - 8, x + w + 1, y, x, y + 8, x - w - 1, y]);
  poly(ctx, "#ffe28b", [x, y - 7, x + w, y, x, y + 6, x - w, y]);
  poly(ctx, "#fff8cf", [x, y - 7, x, y, x - w, y]);
  poly(ctx, "#e6a14b", [x, y, x + w, y, x, y + 6]);
  spark(ctx, x + w + 2, y - 6, 2, "#fff8d8");
}
function ring(ctx: Brush, x: number, y: number, t: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.ellipse(0, 0, 9.5, 19, 0, 0, tau);
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#564668";
  ctx.stroke();
  ctx.strokeStyle = "#ffd775";
  ctx.lineWidth = 3.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 19, 0, Math.PI, Math.PI * 1.63);
  ctx.strokeStyle = "#fff3ba";
  ctx.lineWidth = 2;
  ctx.stroke();
  spark(ctx, 8, -13, 2.4 + Math.sin(t * 3) * 0.6, "#fff5d1");
  ctx.restore();
}
function flag(ctx: Brush, x: number, y: number, lit: boolean, t: number) {
  line(ctx, "#58455a", 2.7, [x, y, x, y - 35]);
  ellipse(ctx, x, y - 36, 2.6, 2.6, "#ffe5a0");
  poly(ctx, lit ? "#65d5a4" : "#d78371", [
    x + 1,
    y - 34,
    x + 18,
    y - 34 + Math.sin(t * 3) * 2,
    x + 13,
    y - 29,
    x + 18,
    y - 23,
    x + 1,
    y - 24,
  ]);
  line(ctx, "#fff4ca", 1.6, [x + 4, y - 29, x + 6, y - 27, x + 10, y - 31]);
}
function gate(ctx: Brush, x: number, y: number, t: number) {
  const g = ctx.createLinearGradient(x - 15, y - 42, x + 16, y);
  g.addColorStop(0, "#fff2ab");
  g.addColorStop(1, "#81dac6");
  ctx.beginPath();
  ctx.moveTo(x - 16, y);
  ctx.lineTo(x - 16, y - 26);
  ctx.arc(x, y - 26, 16, Math.PI, 0);
  ctx.lineTo(x + 16, y);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "#765d65";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.strokeStyle = "#efc87a";
  ctx.lineWidth = 3;
  ctx.stroke();
  spark(ctx, x, y - 22, 7 + Math.sin(t * 3), "#fff9e0");
  ellipse(ctx, x, y + 1, 18, 3, "#c7cc96");
}
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
}
export function paintFrame(
  ctx: Brush,
  width: number,
  c: Course,
  r: Run,
  camera: number,
  decorTime: number,
  particles: Particle[],
) {
  const p = palettes[c.biome];
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  background(ctx, width, camera, decorTime, c.biome);
  ctx.save();
  ctx.translate(-camera, 0);
  if (c.mode === "jump") {
    c.islands.forEach((i, k) => {
      const x = islandX(i, r.time);
      if (x + i.width > camera - 20 && x < camera + width + 20)
        island(ctx, x, i, k, p, c.biome);
    });
    flag(ctx, c.checkpoint.x, c.checkpoint.y, r.flagged, decorTime);
    gate(ctx, c.goal, c.islands[c.islands.length - 1].y, decorTime);
    if (r.ground !== null) ellipse(ctx, r.x, r.y + 0.6, 11, 2, "#34405342");
  } else {
    for (const w of c.winds ?? []) {
      if (w.x + w.width < camera || w.x > camera + width) continue;
      const direction = Math.sign(w.force);
      ctx.fillStyle = "#9ef7d51e";
      ctx.fillRect(w.x, 0, w.width, HEIGHT);
      for (let x = w.x + 18; x < w.x + w.width; x += 37) {
        for (let row = -1; row < 5; row++) {
          const y = row * 64 + ((direction * decorTime * 24 + x) % 64);
          line(ctx, "#e0ffed95", 1.6, [
            x - 4,
            y - direction * 5,
            x,
            y,
            x + 4,
            y - direction * 5,
          ]);
          line(ctx, "#e0ffed63", 1.4, [x, y, x, y - direction * 13]);
        }
      }
    }
    for (const s of c.storms) {
      if (s.x < camera - 50 || s.x > camera + width + 50) continue;
      const y = stormY(s.y, s.x, r.time);
      cloud(ctx, s.x, y, 0.75, "#4b4c74");
      cloud(ctx, s.x - 1, y - 3, 0.62, "#747395");
      poly(ctx, "#ffe597", [
        s.x - 2,
        y + 1,
        s.x + 4,
        y + 1,
        s.x + 1,
        y + 8,
        s.x + 6,
        y + 8,
        s.x - 4,
        y + 19,
        s.x - 1,
        y + 10,
        s.x - 5,
        y + 10,
      ]);
    }
    if (c.checkpoint.x > camera - 20 && c.checkpoint.x < camera + width + 20)
      flag(ctx, c.checkpoint.x, HEIGHT - 8, r.flagged, decorTime);
    for (let y = 22; y < HEIGHT - 10; y += 20) {
      ctx.fillStyle = "#fff2b685";
      ctx.fillRect(c.goal, y, 3, 10);
      if (y % 40 === 22) spark(ctx, c.goal + 1, y, 3, "#ffe6a9");
    }
  }
  c.gems.forEach((g, i) => {
    if (r.collected.has(i) || g.x < camera - 22 || g.x > camera + width + 22)
      return;
    if (c.mode === "jump")
      gem(ctx, g.x, g.y + Math.sin(decorTime * 2 + i) * 1.7, decorTime + i);
    else ring(ctx, g.x, g.y, decorTime + i);
  });
  if (c.mode === "glide")
    wing(ctx, r.x, r.y - 31, Math.max(-0.13, Math.min(0.16, r.vy / 700)));
  for (const part of particles) {
    ctx.globalAlpha = Math.max(0, part.life / part.max);
    spark(ctx, part.x, part.y, 1.8 + (2 * part.life) / part.max, part.color);
  }
  ctx.restore();
}
function wing(ctx: Brush, x: number, y: number, tilt: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  line(ctx, "#51485a", 1.2, [-23, -9, -6, 12, 5, 12, 25, -12]);
  poly(ctx, "#fbc67b", [-34, -7, 0, -29, 35, -12, 17, -11, 6, -6, -7, -10]);
  poly(ctx, "#f2a28a", [0, -29, 6, -6, -7, -10]);
  poly(ctx, "#fff2bd", [0, -29, 35, -12, 17, -11]);
  line(ctx, "#866578", 1.3, [-34, -7, 0, -29, 35, -12]);
  line(ctx, "#a4726e", 1, [0, -29, 6, -6]);
  line(ctx, "#f4b2a2", 1.6, [-34, -7, -42, -4, -47, -5]);
  ctx.restore();
}
export function sizeCanvas(canvas: HTMLCanvasElement) {
  const { width, height } = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  return (HEIGHT * Math.max(1, width)) / Math.max(1, height);
}
export function displayFrame(
  canvas: HTMLCanvasElement,
  ctx: Brush,
  actor: HTMLElement,
  width: number,
  c: Course,
  r: Run,
  decorTime: number,
  particles: Particle[],
  still: boolean,
  poster = false,
) {
  const camera = cameraX(c, r, width);
  ctx.setTransform(canvas.width / width, 0, 0, canvas.height / HEIGHT, 0, 0);
  paintFrame(ctx, width, c, r, camera, decorTime, particles);
  const size = poster ? 57 : 44;
  const bob =
    still || r.ground === null
      ? 0
      : Math.abs(Math.sin(r.time * 17)) * Math.min(2, Math.abs(r.vx) / 80);
  const tilt = still
    ? 0
    : c.mode === "glide"
      ? r.vy * 0.045
      : r.ground === null
        ? Math.min(9, Math.max(-9, r.vy * 0.043)) * r.facing
        : 0;
  const airborne = r.ground === null;
  const stride =
    still || airborne
      ? 0
      : Math.sin(r.time * 19) * Math.min(13, Math.abs(r.vx) / 11);
  const tuck = still || !airborne ? 0 : 6;
  actor.style.setProperty("--left-foot", `${-tuck - Math.max(0, stride)}px`);
  actor.style.setProperty("--right-foot", `${-tuck - Math.max(0, -stride)}px`);
  const breeze = still
    ? 0
    : Math.min(1, Math.abs(r.vx) / 100) * (29 + Math.sin(r.time * 14) * 11);
  actor.style.setProperty("--scarf-angle", `${breeze}deg`);
  actor.style.width = `${((size * 236) / 270 / width) * 100}%`;
  actor.style.height = `${(size / HEIGHT) * 100}%`;
  actor.style.left = `${((r.x - camera) / width) * 100}%`;
  actor.style.top = `${((r.y - bob) / HEIGHT) * 100}%`;
  actor.style.transform = `translate(-50%,-100%) rotate(${tilt}deg) scaleX(${r.facing})`;
}

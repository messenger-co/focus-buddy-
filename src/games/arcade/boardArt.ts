import { boards, bitCount, raftX, type Board, type BoardRun } from "./boards";

type Brush = CanvasRenderingContext2D;
function shape(g: Brush, fill: string, points: number[]) {
  g.fillStyle = fill;
  g.beginPath();
  g.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) g.lineTo(points[i], points[i + 1]);
  g.closePath();
  g.fill();
}
function oval(
  g: Brush,
  x: number,
  y: number,
  a: number,
  b: number,
  fill: string,
) {
  g.fillStyle = fill;
  g.beginPath();
  g.ellipse(x, y, a, b, 0, 0, Math.PI * 2);
  g.fill();
}
function box(
  g: Brush,
  x: number,
  y: number,
  w: number,
  h: number,
  rad: number,
  fill: string,
) {
  g.fillStyle = fill;
  g.beginPath();
  g.roundRect(x, y, w, h, rad);
  g.fill();
}
function stroke(g: Brush, color: string, width: number, points: number[]) {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  g.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) g.lineTo(points[i], points[i + 1]);
  g.stroke();
}
function glitter(g: Brush, x: number, y: number, r: number, c: string) {
  shape(g, c, [
    x,
    y - r,
    x + r * 0.24,
    y - r * 0.24,
    x + r,
    y,
    x + r * 0.24,
    y + r * 0.24,
    x,
    y + r,
    x - r * 0.24,
    y + r * 0.24,
    x - r,
    y,
    x - r * 0.24,
    y - r * 0.24,
  ]);
}
function crystal(g: Brush, x: number, y: number, s: number) {
  oval(g, x, y + 3, s * 1.25, s * 0.55, "#83f5f452");
  shape(g, "#285089", [
    x - s,
    y,
    x - s * 0.55,
    y - s * 0.72,
    x + s * 0.45,
    y - s * 0.8,
    x + s,
    y,
    x,
    y + s,
  ]);
  shape(g, "#96ffed", [
    x - s * 0.83,
    y,
    x - s * 0.44,
    y - s * 0.63,
    x + s * 0.38,
    y - s * 0.67,
    x + s * 0.82,
    y,
    x,
    y + s * 0.81,
  ]);
  shape(g, "#32b7ce", [x, y + s * 0.81, x - s * 0.22, y, x + s * 0.82, y]);
  glitter(g, x - s * 0.52, y - s * 0.53, s * 0.36, "#ffffff");
}
function lantern(g: Brush, x: number, y: number, s: number) {
  oval(g, x, y, s * 1.65, s * 1.4, "#ffe68b2b");
  stroke(g, "#664a47", s * 0.17, [
    x - s * 0.42,
    y - s * 0.54,
    x - s * 0.24,
    y - s,
    x + s * 0.24,
    y - s,
    x + s * 0.42,
    y - s * 0.54,
  ]);
  oval(g, x, y, s * 0.81, s * 0.8, "#cc684e");
  oval(g, x, y, s * 0.54, s * 0.76, "#ffc571");
  oval(g, x, y, s * 0.22, s * 0.72, "#ffe7a0");
  box(g, x - s * 0.44, y - s * 0.76, s * 0.88, s * 0.2, 1, "#824d48");
  stroke(g, "#ffdb87", s * 0.18, [x, y + s * 0.74, x, y + s * 1.03]);
}
export function fitBoard(canvas: HTMLCanvasElement) {
  const { width, height } = canvas.getBoundingClientRect(),
    dpi = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(width * dpi));
  canvas.height = Math.max(1, Math.round(height * dpi));
  return { w: Math.max(1, width), h: Math.max(1, height) };
}
export function paintBoard(
  canvas: HTMLCanvasElement,
  g: Brush,
  sprite: HTMLElement,
  view: { w: number; h: number },
  b: Board,
  r: BoardRun,
  still: boolean,
  poster = false,
) {
  const { w, h } = view,
    river = b.mode === "river",
    level = boards[b.mode].indexOf(b),
    t = still ? 0 : r.time;
  const dusk = river && level >= 3,
    violet = !river && level >= 3;
  const cw = poster
      ? w / (river ? 5.6 : 6.3)
      : Math.min(
          (w - 12) / b.width,
          ((h - 12) / b.rows.length) * (river ? 2.05 : 1.46),
        ),
    ch = poster
      ? h / (river ? 3.35 : 3.95)
      : Math.min((h - 12) / b.rows.length, cw * (river ? 0.84 : 1.02));
  const left = (w - cw * b.width) / 2,
    top = poster ? -ch * (river ? 0.53 : 1.1) : (h - ch * b.rows.length) / 2;
  g.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
  g.lineCap = "round";
  g.lineJoin = "round";
  const bg = g.createLinearGradient(0, 0, w, h);
  bg.addColorStop(
    0,
    river ? (dusk ? "#314964" : "#174e57") : violet ? "#292d56" : "#174564",
  );
  bg.addColorStop(
    0.53,
    river ? (dusk ? "#4c667a" : "#43877e") : violet ? "#605783" : "#487b92",
  );
  bg.addColorStop(1, river ? "#265b62" : "#283c66");
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 34; i++) {
    const x = (((i * 71.7 + 17) % 379) / 379) * w,
      y = (((i * 43.2 + 5) % 203) / 203) * h;
    if (river) {
      stroke(g, "#98ddc33b", 1.3, [x - 6, y, x, y + 1, x + 7, y - 1]);
      if (i % 4 === 0) {
        oval(g, x, y, 7, 3, "#83b393");
        oval(g, x - 1, y - 1, 3, 1.4, "#bedaab");
      }
    } else {
      glitter(g, x, y, 1.4 + (i % 4) * 0.6, "#d4e9ff9e");
      if (i % 5 === 0)
        shape(g, "#9ec5e91e", [
          x - 14,
          y + 20,
          x - 3,
          y - 15,
          x + 4,
          y - 21,
          x + 11,
          y + 14,
        ]);
    }
  }
  box(
    g,
    left - 4,
    top - 3,
    cw * b.width + 8,
    ch * b.rows.length + 8,
    8,
    river ? "#294d4b" : "#273956",
  );
  g.save();
  g.translate(left, top);
  g.beginPath();
  g.rect(0, 0, b.width * cw, b.rows.length * ch);
  g.clip();
  b.rows.forEach((row, y) => {
    const water = river && b.speeds[y] !== 0,
      y0 = y * ch;
    if (water) {
      g.fillStyle = dusk
        ? y % 2
          ? "#436887"
          : "#3e607e"
        : y % 2
          ? "#3c9295"
          : "#33888e";
      g.fillRect(0, y0, b.width * cw, ch);
      g.fillStyle = "#13375927";
      g.fillRect(0, y0, b.width * cw, ch * 0.15);
      for (let k = -1; k < b.width * 2 + 1; k++) {
        const x = k * cw * 0.5 + ((b.speeds[y] * t * cw * 0.35) % (cw * 0.5)),
          yy = y0 + ch * (k % 2 ? 0.72 : 0.31);
        stroke(g, "#d1f6e25c", 1.2, [
          x,
          yy,
          x + cw * 0.1,
          yy + 1,
          x + cw * 0.19,
          yy - 1,
        ]);
      }
    }
    [...row].forEach((tile, x) => {
      const x0 = x * cw,
        cx = x0 + cw / 2,
        cy = y0 + ch / 2;
      if (water) {
        if (tile === "~") return;
        const offset = raftX(b, x, y, r.time);
        for (const pos of [offset, offset + b.width, offset - b.width]) {
          if (pos < -1 || pos > b.width) continue;
          const bx = (pos + 0.5) * cw,
            bw = cw * 0.97;
          oval(g, bx, cy + ch * 0.17, bw * 0.53, ch * 0.29, "#173f594f");
          for (let j = -1; j <= 1; j++) {
            const ry = cy + ch * j * 0.13;
            box(
              g,
              bx - bw / 2,
              ry - ch * 0.09,
              bw,
              ch * 0.18,
              ch * 0.08,
              j === -1 ? "#dbb565" : j === 0 ? "#c99c59" : "#b4864d",
            );
            stroke(g, "#f5d591", 1, [
              bx - bw * 0.4,
              ry - ch * 0.035,
              bx + bw * 0.39,
              ry - ch * 0.045,
            ]);
          }
          for (const end of [-1, 1])
            stroke(g, "#876f50", Math.max(1, cw * 0.036), [
              bx + end * bw * 0.33,
              cy - ch * 0.21,
              bx + end * bw * 0.31,
              cy + ch * 0.2,
            ]);
          const gem = b.gems.findIndex((p) => p.x === x && p.y === y);
          if (gem >= 0 && !(r.mask & (1 << gem)))
            lantern(g, bx, cy - ch * 0.15, Math.min(cw, ch) * 0.25);
        }
      } else if (river) {
        g.fillStyle = dusk ? "#9aa980" : "#b5c987";
        g.fillRect(x0, y0, cw + 0.5, ch + 0.5);
        g.fillStyle = "#76926c";
        g.fillRect(x0, y0 + ch * 0.82, cw + 0.5, ch * 0.18);
        stroke(g, "#819563", 1.5, [
          x0 + cw * 0.16,
          y0 + ch * 0.62,
          x0 + cw * 0.12,
          y0 + ch * 0.48,
          x0 + cw * 0.19,
          y0 + ch * 0.57,
        ]);
        if ((x + y) % 3 === 0) {
          oval(g, x0 + cw * 0.8, y0 + ch * 0.34, 3.5, 2.3, "#e4daa3");
        }
        if (tile === "." && (x + 2 * y) % 3 === 0) {
          const px = cx - cw * 0.12,
            py = y0 + ch * 0.77,
            sz = Math.min(cw, ch) * 0.19;
          for (const bend of [-1, 0.3, 1]) {
            shape(g, "#447b67", [
              px,
              py,
              px + sz * bend,
              py - sz * 1.6,
              px + sz * bend * 0.55,
              py - sz * 0.2,
            ]);
          }
          for (let petal = 0; petal < 5; petal++) {
            const angle = (petal * Math.PI * 2) / 5;
            oval(
              g,
              px + Math.cos(angle) * sz * 0.45,
              py - sz * 1.3 + Math.sin(angle) * sz * 0.32,
              sz * 0.44,
              sz * 0.29,
              "#f8c5bc",
            );
          }
          oval(g, px, py - sz * 1.3, sz * 0.26, sz * 0.24, "#f4d485");
        }
        if (tile === "F") {
          stroke(g, "#695943", 2, [cx - 4, cy + 6, cx - 4, cy - ch * 0.35]);
          shape(g, "#ffe39a", [
            cx - 3,
            cy - ch * 0.35,
            cx + 8,
            cy - ch * 0.25,
            cx - 3,
            cy - ch * 0.12,
          ]);
        }
      } else if (tile === "#") {
        g.fillStyle = violet ? "#52547f" : "#3b6881";
        g.fillRect(x0, y0, cw + 0.7, ch + 0.7);
        shape(g, violet ? "#9397c6" : "#8bb8c9", [
          x0 + 1,
          y0 + ch * 0.3,
          cx - cw * 0.12,
          y0 + 0.5,
          x0 + cw * 0.9,
          y0 + ch * 0.1,
          x0 + cw - 1,
          y0 + ch * 0.67,
          cx,
          y0 + ch * 0.9,
          x0 + 2,
          y0 + ch * 0.72,
        ]);
        shape(g, violet ? "#6f77a5" : "#5a91ab", [
          cx - cw * 0.12,
          y0 + 0.5,
          cx + cw * 0.09,
          y0 + ch * 0.5,
          x0 + 2,
          y0 + ch * 0.72,
          x0 + 1,
          y0 + ch * 0.3,
        ]);
        shape(g, "#edfaff68", [
          cx - cw * 0.12,
          y0 + 0.5,
          x0 + cw * 0.9,
          y0 + ch * 0.1,
          cx + cw * 0.09,
          y0 + ch * 0.5,
        ]);
      } else {
        g.fillStyle = violet
          ? (x + y) % 2
            ? "#b9c9e5"
            : "#b0c2df"
          : (x + y) % 2
            ? "#bce6e8"
            : "#b2dce4";
        g.fillRect(x0, y0, cw + 0.4, ch + 0.4);
        if ((x * 2 + y) % 3 === 0)
          stroke(g, "#f2ffff9c", 1.4, [
            x0 + cw * 0.13,
            y0 + ch * 0.72,
            cx,
            y0 + ch * 0.51,
            x0 + cw * 0.61,
            y0 + ch * 0.52,
          ]);
        if (
          tile === "*" &&
          !(r.mask & (1 << b.gems.findIndex((p) => p.x === x && p.y === y)))
        )
          crystal(
            g,
            cx,
            cy + Math.sin(t * 2 + x) * 1.1,
            Math.min(cw, ch) * 0.25,
          );
      }
      if (tile === "E") {
        const open = bitCount(r.mask) >= (river ? b.target : b.gems.length);
        const size = Math.min(cw, ch) * 0.45;
        oval(
          g,
          cx,
          cy + size * 0.26,
          size,
          size * 0.58,
          open ? "#ffde8d" : "#7778a7",
        );
        oval(
          g,
          cx,
          cy + size * 0.22,
          size * 0.74,
          size * 0.38,
          open ? "#bd8c5e" : "#515f8a",
        );
        stroke(g, open ? "#ffeda9" : "#8c8db1", Math.max(2, size * 0.17), [
          cx - size * 0.77,
          cy + size * 0.12,
          cx - size * 0.7,
          cy - size * 0.63,
          cx,
          cy - size * 0.95,
          cx + size * 0.7,
          cy - size * 0.63,
          cx + size * 0.77,
          cy + size * 0.12,
        ]);
        glitter(
          g,
          cx,
          cy - size * 0.52,
          size * 0.29,
          open ? "#fff2be" : "#d9d6ea",
        );
      }
    });
  });
  const x = (r.x + 0.5) * cw,
    y = (r.y + 0.5) * ch;
  const arc = r.motion
    ? Math.sin((Math.PI * r.motion.elapsed) / r.motion.duration)
    : 0;
  if (r.motion && !river && !still)
    stroke(g, "#ffffffb5", Math.max(2, ch * 0.12), [
      (r.motion.from.x + 0.5) * cw,
      (r.motion.from.y + 0.55) * ch,
      x,
      y + ch * 0.05,
    ]);
  oval(g, x, y + ch * 0.21, cw * 0.23, ch * 0.1, "#253e5742");
  if (r.flash > 0 && !still)
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      glitter(
        g,
        x + Math.cos(a) * cw * 0.38,
        y + Math.sin(a) * ch * 0.39,
        2 + r.flash * 4,
        "#fff4b4",
      );
    }
  g.restore();
  const size = Math.min(cw * 1.05, ch * (poster ? 1.67 : 1.42));
  sprite.style.width = `${size * 0.88}px`;
  sprite.style.height = `${size}px`;
  sprite.style.left = `${left + x}px`;
  sprite.style.top = `${top + y + ch * 0.25 - (river && !still ? arc * ch * 0.45 : 0)}px`;
  sprite.style.transform = `translate(-50%,-100%) rotate(${!still && r.motion ? (r.motion.to.x - r.motion.from.x) * arc * (river ? 7 : 1.4) : 0}deg)`;
}

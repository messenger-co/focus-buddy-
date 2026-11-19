import type { Action, Diorama, Piece, Pos } from "./scenery";
export interface Frame {
  scene: Diorama;
  markers: Piece[];
  buddy: Pos;
  yaw: number;
  zoom: number;
}
export interface Surface {
  draw: (f: Frame) => void;
  pick: (x: number, y: number) => Action | undefined;
  destroy: () => void;
}
export type Anchor = (x: number, y: number, size: number) => void;
export function scaleFor(f: Frame, w: number, h: number) {
  const { width, depth } = f.scene;
  return (
    Math.min(
      w / (Math.max(width, depth) * 1.37),
      h / (Math.max(width, depth) * (f.scene.room ? 0.76 : 0.93)),
    ) * f.zoom
  );
}
export function place(
  anchor: Anchor,
  x: number,
  y: number,
  scale: number,
  room: boolean,
) {
  anchor(x, y, Math.max(14, scale * (room ? 1.55 : 1.0)));
}
const paintShade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${Math.round((n >> 16) * k)},${Math.round(((n >> 8) & 255) * k)},${Math.round((n & 255) * k)})`;
};
export function flatSurface(
  canvas: HTMLCanvasElement,
  anchor: Anchor,
): Surface {
  const g = canvas.getContext("2d");
  if (!g) throw Error("canvas");
  let hits: { path: Path2D; action?: Action }[] = [];
  const draw = (f: Frame) => {
    const w = canvas.clientWidth,
      h = canvas.clientHeight,
      dpi = Math.min(window.devicePixelRatio || 1, 1.5),
      dw = Math.max(1, Math.round(w * dpi)),
      dh = Math.max(1, Math.round(h * dpi));
    if (canvas.width !== dw || canvas.height !== dh) {
      canvas.width = dw;
      canvas.height = dh;
    }
    g.setTransform(dpi, 0, 0, dpi, 0, 0);
    g.clearRect(0, 0, w, h);
    hits = [];
    const scale = scaleFor(f, w, h),
      sn = Math.sin(f.yaw),
      cs = Math.cos(f.yaw),
      cy = f.scene.center[1];
    const project = (x: number, y: number, z: number): [number, number] => [
      w / 2 + scale * (cs * x - sn * z),
      h * 0.5 + scale * (0.53 * (sn * x + cs * z) - 0.848 * (y - cy)),
    ];
    const polygon = (coords: number[][], color: string, action?: Action) => {
      const path = new Path2D();
      coords.forEach(([x, y], i) => {
        if (i) path.lineTo(x, y);
        else path.moveTo(x, y);
      });
      path.closePath();
      g.fillStyle = color;
      g.fill(path);
      hits.push({ path, action });
    };
    const sorted = [...f.scene.fixed, ...f.markers].sort(
      (a, b) => sn * (a.x - b.x) + cs * (a.z - b.z) + 0.625 * (a.y - b.y),
    );
    for (const o of sorted) {
      const x = o.x,
        y = o.y,
        z = o.z,
        a = o.w / 2,
        b = o.h / 2,
        c = o.d / 2;
      if (o.shape === "box") {
        const foot = [
            project(x - a, y - b, z - c),
            project(x + a, y - b, z - c),
            project(x + a, y - b, z + c),
            project(x - a, y - b, z + c),
          ],
          roof = [
            project(x - a, y + b, z - c),
            project(x + a, y + b, z - c),
            project(x + a, y + b, z + c),
            project(x - a, y + b, z + c),
          ];
        for (const i of [sn >= 0 ? 1 : 3, cs >= 0 ? 2 : 0]) {
          const j = (i + 1) % 4;
          polygon(
            [foot[i], foot[j], roof[j], roof[i]],
            paintShade(o.color, i % 2 ? 0.74 : 0.86),
            o.action,
          );
        }
        polygon(roof, o.color, o.action);
      } else {
        const [u, v] = project(x, y, z),
          rw = Math.max(1, scale * Math.max(a, c)),
          rh = Math.max(1, scale * (b * 0.85 + c * 0.24));
        if (o.shape === "gem" || o.shape === "cone") {
          polygon(
            [
              [u, v - rh],
              [u + rw, v + 0.13 * rh],
              [u, v + rh],
              [u - rw, v + 0.13 * rh],
            ],
            o.color,
            o.action,
          );
          polygon(
            [
              [u, v - rh],
              [u + rw, v + 0.13 * rh],
              [u, v + rh],
              [u + rw * 0.25, v],
            ],
            paintShade(o.color, 0.83),
            o.action,
          );
        } else {
          const path = new Path2D();
          path.ellipse(u, v, rw, rh, 0, 0, Math.PI * 2);
          g.fillStyle = o.color;
          g.fill(path);
          hits.push({ path, action: o.action });
        }
      }
    }
    const [ax, ay] = project(...f.buddy);
    place(anchor, ax, ay, scale, f.scene.room);
  };
  return {
    draw,
    pick(x, y) {
      g.save();
      g.resetTransform();
      let hit: (typeof hits)[number] | undefined;
      for (let i = hits.length - 1; i >= 0; i--) {
        if (g.isPointInPath(hits[i].path, x, y)) {
          hit = hits[i];
          break;
        }
      }
      g.restore();
      return hit?.action;
    },
    destroy() {
      hits = [];
    },
  };
}

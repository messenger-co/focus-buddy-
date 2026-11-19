import { useState, useRef } from "react";
import type { ClubId } from "./catalog";
type Mark = { x: number; y: number; ink: string };
const inks = ["#487b65", "#9b618c", "#ca7b45", "#365b94"];
export default function Creative({ id }: { id: ClubId }) {
  const draw = id === "xuong-ve",
    garden = id === "vuon-nho",
    key = "focus-buddy-creative/" + id;
  const options = garden
    ? ["🌱", "🌼", "🌷", "🌻", "💧", "✕"]
    : ["🪴", "🛋️", "📚", "🪔", "🪑", "✕"];
  const [tool, select] = useState(options[0]),
    [ink, setInk] = useState(inks[0]),
    [note, status] = useState("");
  const [cells, setCells] = useState<string[]>(() => {
    try {
      const a = JSON.parse(localStorage.getItem(key) || "null");
      if (
        Array.isArray(a) &&
        a.length === 24 &&
        a.every((x) => typeof x === "string")
      )
        return a;
    } catch {}
    return Array(24).fill("");
  });
  const [marks, setMarks] = useState<Mark[]>(() => {
    try {
      const a = JSON.parse(localStorage.getItem(key) || "[]");
      if (draw && Array.isArray(a))
        return a
          .filter(
            (i) =>
              i &&
              Number.isFinite(i.x) &&
              Number.isFinite(i.y) &&
              inks.includes(i.ink),
          )
          .slice(-3000);
    } catch {}
    return [];
  });
  const cursor = useRef({ x: 50, y: 50 }),
    [pos, setPos] = useState(cursor.current);
  function mark(x: number, y: number) {
    cursor.current = { x, y };
    setPos({ x, y });
    setMarks((v) => [...v.slice(-2999), { x, y, ink }]);
    status("Buddy đang ngắm bức tranh.");
  }
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(draw ? marks : cells));
      status("Đã lưu trên thiết bị.");
    } catch {
      status("Thiết bị chưa lưu được.");
    }
  }
  return (
    <section className="club-question">
      {draw ? (
        <>
          <div className="club-pad">
            {inks.map((v, i) => (
              <button
                key={v}
                aria-label={
                  ["Bút xanh lá", "Bút tím", "Bút cam", "Bút xanh dương"][i]
                }
                aria-pressed={ink === v}
                onClick={() => setInk(v)}
                style={{ background: v, width: 35 }}
              />
            ))}
          </div>
          <svg
            className="drawing-pad"
            viewBox="0 0 100 65"
            tabIndex={0}
            aria-label="Giấy vẽ"
            onKeyDown={(e) => {
              const keys: Record<string, [number, number]> = {
                ArrowUp: [0, -2],
                ArrowDown: [0, 2],
                ArrowLeft: [-2, 0],
                ArrowRight: [2, 0],
              };
              if (e.key === " ") {
                e.preventDefault();
                mark(pos.x, pos.y);
              } else if (keys[e.key]) {
                e.preventDefault();
                const [x, y] = keys[e.key];
                setPos({
                  x: Math.max(0, Math.min(100, pos.x + x)),
                  y: Math.max(0, Math.min(65, pos.y + y)),
                });
              }
            }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              const r = e.currentTarget.getBoundingClientRect();
              mark(
                ((e.clientX - r.left) * 100) / r.width,
                ((e.clientY - r.top) * 65) / r.height,
              );
            }}
            onPointerMove={(e) => {
              if (!e.currentTarget.hasPointerCapture(e.pointerId) || !e.buttons)
                return;
              const r = e.currentTarget.getBoundingClientRect();
              mark(
                ((e.clientX - r.left) * 100) / r.width,
                ((e.clientY - r.top) * 65) / r.height,
              );
            }}
            preserveAspectRatio="none"
          >
            {marks.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="1.4" fill={p.ink} />
            ))}
            <circle
              fill="none"
              stroke={ink}
              strokeWidth=".35"
              cx={pos.x}
              cy={pos.y}
              r="2"
            />
          </svg>
        </>
      ) : (
        <>
          <div className="club-pad">
            {options.map((v, i) => (
              <button
                key={v}
                aria-pressed={v === tool}
                aria-label={
                  (garden
                    ? [
                        "Mầm cây",
                        "Hoa cúc",
                        "Tulip",
                        "Hướng dương",
                        "Tưới nước",
                        "Dọn ô",
                      ]
                    : ["Cây", "Ghế dài", "Kệ sách", "Đèn", "Ghế", "Dọn ô"])[i]
                }
                onClick={() => select(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="creative-grid">
            {cells.map((v, i) => (
              <button
                key={i}
                aria-label={`Ô ${i + 1} ${v}`}
                onClick={() =>
                  setCells((a) =>
                    a.map((s, j) =>
                      j !== i
                        ? s
                        : tool === "✕"
                          ? ""
                          : tool === "💧"
                            ? s === "🌱"
                              ? "🌿"
                              : s === "🌿"
                                ? "🌸"
                                : s
                            : tool,
                    ),
                  )
                }
              >
                {v || "·"}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="button-row">
        <button className="button primary" onClick={save}>
          Lưu tác phẩm
        </button>
        <button
          className="button secondary"
          onClick={() => {
            setCells(Array(24).fill(""));
            setMarks([]);
            status("Đã mở trang mới.");
          }}
        >
          Làm lại
        </button>
      </div>
      <p role="status">{note}</p>
    </section>
  );
}

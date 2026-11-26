import { useState } from "react";
import { Check, RotateCcw, SlidersHorizontal } from "lucide-react";
import { paletteLibrary, palette, type ThemeId } from "./themes";
import {
  useAppearance,
  updateAppearance,
  resetAppearance,
  type Appearance,
  type FontScale,
} from "./appearance";
import { language, switchLanguage } from "./language";
const widgets = {
  habits: "Thói quen hằng ngày",
  missions: "Nhiệm vụ",
  friend: "Bạn đồng hành",
  mood: "Điểm danh cảm xúc",
  assistant: "Trợ lý học tập",
};
export default function ThemeStudio({
  theme,
  onTheme,
}: {
  theme: ThemeId;
  onTheme: (v: ThemeId) => Promise<void>;
}) {
  const a = useAppearance();
  const [filter, setFilter] = useState<"all" | "light" | "dark">("all");
  const visible = paletteLibrary.filter(([, , , dark]) =>
    filter === "all" ? true : filter === "dark" ? dark : !dark,
  );
  return (
    <section className="design-studio">
      <header className="page-heading">
        <div>
          <h1>Xưởng giao diện</h1>
          <p>Chọn ánh sáng, màu sắc, cỡ chữ và chuyển động cho góc học của bạn.</p>
        </div>
      </header>
      <div className="palette-bar">
        <h2>Bảng chủ đề</h2>
        <div className="filter-tabs" role="group" aria-label="Lọc chủ đề theo ánh sáng">
          {(
            [
              ["all", `Tất cả (${paletteLibrary.length})`],
              ["light", "Sáng"],
              ["dark", "Tối"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`filter-tab${filter === id ? " active" : ""}`}
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="palette-grid">
        {visible.map(([id, name, , dark]) => {
          const p = palette(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={id === theme}
              onClick={() => void onTheme(id)}
              className="palette-tile"
            >
              <span
                className="mini-scene"
                style={{
                  background: `linear-gradient(145deg,${p["--study-paper"]},${p["--study-mid"]})`,
                  color: p["--highlight"],
                }}
              >
                <i />
                <b />
                <em />
                {dark ? "☾" : "☀"}
              </span>
              <strong>
                {name}
                {theme === id && <Check size={15} />}
              </strong>
            </button>
          );
        })}
      </div>
      <div className="studio-settings-grid">
        <section className="card work-settings">
          <h2>
            <SlidersHorizontal size={18} /> Tùy chỉnh
          </h2>
          <label>
            Màu nhấn
            <select
              value={a.accent ?? "auto"}
              onChange={(e) =>
                updateAppearance({
                  accent:
                    e.target.value === "auto" ? null : Number(e.target.value),
                })
              }
            >
              {[
                ["auto", "Theo chủ đề"],
                ["146", "Lá trà"],
                ["196", "Xanh hồ"],
                ["265", "Hoa tím"],
                ["342", "Hồng đào"],
                ["28", "Hổ phách"],
              ].map(([v, n]) => (
                <option key={v} value={v}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            Họa tiết nền
            <select
              value={a.backdrop}
              onChange={(e) =>
                updateAppearance({
                  backdrop: e.target.value as Appearance["backdrop"],
                })
              }
            >
              {[
                ["plain", "Nền trơn"],
                ["grid", "Trang vở"],
                ["stars", "Trời sao"],
                ["leaves", "Hạt mầm"],
              ].map(([v, n]) => (
                <option key={v} value={v}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cỡ chữ hiển thị
            <select
              value={a.fontScale}
              onChange={(e) =>
                updateAppearance({
                  fontScale: e.target.value as FontScale,
                })
              }
            >
              <option value="compact">Gọn</option>
              <option value="normal">Tiêu chuẩn</option>
              <option value="large">Rộng rõ</option>
            </select>
          </label>
          <label>
            Mức chuyển động
            <select
              value={a.motion}
              onChange={(e) =>
                updateAppearance({
                  motion: e.target.value as Appearance["motion"],
                })
              }
            >
              {[
                ["off", "Tắt"],
                ["minimal", "Nhẹ"],
                ["normal", "Vừa"],
                ["enhanced", "Sinh động"],
              ].map(([v, n]) => (
                <option key={v} value={v}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ngôn ngữ giao diện
            <select
              value={language}
              onChange={(e) =>
                switchLanguage(e.target.value === "en" ? "en" : "vi")
              }
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </label>
          <div className="work-settings-footer">
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                resetAppearance();
                void onTheme("meadow");
              }}
            >
              <RotateCcw size={15} /> Khôi phục mặc định
            </button>
          </div>
        </section>
        <section className="card work-settings">
          <h2>Trang chính của bạn</h2>
          {Object.entries(widgets).map(([id, label]) => (
            <label key={id}>
              {label}
              <input
                type="checkbox"
                checked={a.widgets.includes(id)}
                onChange={(e) =>
                  updateAppearance({
                    widgets: e.target.checked
                      ? [...a.widgets, id]
                      : a.widgets.filter((x) => x !== id),
                  })
                }
              />
            </label>
          ))}
        </section>
      </div>
    </section>
  );
}

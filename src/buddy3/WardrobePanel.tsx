import { useState } from "react";
import {
  Bookmark,
  Check,
  Dices,
  LockKeyhole,
  Move,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  bags,
  bodies,
  clothes,
  dress,
  dyes,
  dyeNames,
  effects,
  eyes,
  eyewear,
  faces,
  hats,
  initialLook,
  motionStyles,
  presets,
  randomOutfit,
  removeOutfit,
  saveOutfit,
  textures,
  useWardrobe,
  type BaseLook,
  type Wardrobe,
} from "./wardrobe";

type PanelProps = {
  base: BaseLook;
  xp: number;
  busy: boolean;
  positioning: boolean;
  togglePosition: () => void;
  restoreBase: (base: BaseLook) => Promise<boolean>;
};
export default function WardrobePanel({
  base,
  xp,
  busy,
  positioning,
  togglePosition,
  restoreBase,
}: PanelProps) {
  const { look, outfits } = useWardrobe();
  const [name, setName] = useState(""),
    [status, setStatus] = useState("");
  function choose(patch: Partial<Wardrobe>) {
    if (!dress(patch))
      setStatus(
        "Đang thử đồ trong phiên này. Trình duyệt chưa lưu được lựa chọn.",
      );
    else setStatus("");
  }
  function field<K extends keyof Wardrobe>(
    key: K,
    label: string,
    choices: Record<string, string>,
  ) {
    return (
      <label className="wardrobe-field">
        {label}
        <select
          value={String(look[key])}
          onChange={(e) => choose({ [key]: e.target.value })}
        >
          {Object.entries(choices).map(([v, n]) => (
            <option
              key={v}
              value={v}
              disabled={key === "hat" && v === "laurels" && xp < 100}
            >
              {n}
              {key === "hat" && v === "laurels" && xp < 100 ? " · 100 XP" : ""}
            </option>
          ))}
        </select>
      </label>
    );
  }
  return (
    <div className="wardrobe-panel">
      <div className="studio-panel-title">
        <h2>Xưởng trang phục</h2>
        <p>Chọn một bộ rồi chỉnh từng lớp ngay trên bạn nhỏ.</p>
      </div>
      <div className="wardrobe-presets">
        {Object.entries(presets).map(([label, p]) => (
          <button key={label} onClick={() => choose({ ...initialLook, ...p })}>
            <i style={{ background: dyes[p.dye!][0] }} />
            {label}
          </button>
        ))}
      </div>
      <div className="wardrobe-palette">
        <h3>Màu cơ thể</h3>
        <div>
          {Object.entries(bodies).map(([id, c]) => (
            <button
              key={id}
              aria-label={c.label}
              title={c.label}
              aria-pressed={look.body === id}
              onClick={() => choose({ body: id as Wardrobe["body"] })}
              style={{
                background:
                  c.shades?.[0] ??
                  "linear-gradient(110deg,#e9cfa5 0 34%,#d0dfc5 34% 66%,#dacbe4 66%)",
              }}
            >
              {look.body === id && <Check size={15} />}
            </button>
          ))}
        </div>
      </div>
      <div className="wardrobe-fields">
        {field("garment", "Kiểu trang phục", clothes)}
        {field("hat", "Mũ và đồ cài tóc", hats)}
        {field("bag", "Túi và ba lô", bags)}
        {field("glasses", "Kính đeo thêm", eyewear)}
        {field("eyes", "Dáng mắt", eyes)}
        {field("texture", "Bề mặt", textures)}
        {field("face", "Nét mặt khi rảnh", faces)}
        {field("effect", "Hiệu ứng", effects)}
        {field("motion", "Chuyển động của bạn nhỏ", motionStyles)}
      </div>
      <div className="wardrobe-palette">
        <h3>Màu trang phục</h3>
        <div>
          {Object.entries(dyes).map(([key, palette]) => (
            <button
              key={key}
              aria-label={dyeNames[key as Wardrobe["dye"]]}
              title={dyeNames[key as Wardrobe["dye"]]}
              aria-pressed={look.dye === key}
              style={{ background: palette[0] }}
              onClick={() => choose({ dye: key as Wardrobe["dye"] })}
            >
              {look.dye === key && <Check size={15} />}
            </button>
          ))}
        </div>
      </div>
      <div className="wardrobe-actions">
        <button aria-pressed={positioning} onClick={togglePosition}>
          <Move size={15} />
          Chỉnh vị trí phụ kiện
        </button>
        <button onClick={() => choose(randomOutfit(xp))}>
          <Dices size={16} />
          Phối ngẫu nhiên
        </button>
      </div>
      {positioning && (
        <div className="wardrobe-position">
          <p>Kéo trên hình bạn nhỏ hoặc dùng thanh trượt để dịch mũ và kính.</p>
          {(["x", "y"] as const).map((axis) => (
            <label key={axis}>
              {axis === "x" ? "Ngang" : "Dọc"}
              <input
                type="range"
                min="-22"
                max="22"
                value={look[axis]}
                onChange={(e) => choose({ [axis]: Number(e.target.value) })}
              />
            </label>
          ))}
        </div>
      )}
      <p className="wardrobe-earned">
        {xp < 100 ? <LockKeyhole size={14} /> : <Check size={14} />}{" "}
        {xp < 100
          ? "Vòng nguyệt quế mở khi đạt thành tựu Ngôi sao đang lớn (100 XP)."
          : "Bạn đã mở vòng nguyệt quế nhờ thành tựu Ngôi sao đang lớn."}
      </p>
      <details className="wardrobe-saves" open>
        <summary>Bộ đồ của tôi ({outfits.length})</summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || outfits.some((o) => o.name === name.trim()))
              return;
            const stored = saveOutfit(name, base);
            setName("");
            setStatus(
              stored
                ? "Đã cất bộ đồ vào tủ."
                : "Bộ đồ chỉ được giữ trong phiên này.",
            );
          }}
        >
          <label htmlFor="wardrobe-name">Tên bộ đồ</label>
          <div>
            <input
              id="wardrobe-name"
              maxLength={32}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Chiều ở thư viện"
            />
            <button
              type="submit"
              disabled={
                !name.trim() || outfits.some((o) => o.name === name.trim())
              }
            >
              <Bookmark size={15} />
              Cất bộ đồ
            </button>
          </div>
        </form>
        {name.trim() && outfits.some((o) => o.name === name.trim()) && (
          <small>Tên này đã có trong tủ.</small>
        )}
        {outfits.map((outfit) => (
          <div className="saved-look" key={outfit.name}>
            <button
              disabled={busy}
              aria-label={`Mặc bộ ${outfit.name}`}
              onClick={async () => {
                if (await restoreBase(outfit.base)) {
                  choose({
                    ...outfit.look,
                    hat:
                      outfit.look.hat === "laurels" && xp < 100
                        ? "none"
                        : outfit.look.hat,
                  });
                  setStatus("Đã mặc bộ đồ đã lưu.");
                }
              }}
            >
              <i style={{ background: dyes[outfit.look.dye][0] }} />
              {outfit.name}
            </button>
            <button
              aria-label={`Bỏ bộ ${outfit.name} khỏi tủ`}
              onClick={() => {
                if (removeOutfit(outfit.name))
                  setStatus("Đã bỏ bộ đồ khỏi tủ.");
                else setStatus("Thay đổi chỉ được giữ trong phiên này.");
              }}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </details>
      <button className="wardrobe-reset" onClick={() => choose(initialLook)}>
        <RotateCcw size={14} />
        Khôi phục lớp trang phục mặc định
      </button>
      <p role="status" className="wardrobe-status">
        {status}
      </p>
    </div>
  );
}

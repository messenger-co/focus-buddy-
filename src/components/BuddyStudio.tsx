import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Check,
  Cookie,
  Heart,
  Hand,
  Gamepad2,
  Moon,
  Palette,
  Sparkles,
  Sun,
  WandSparkles,
} from "lucide-react";
import Companion from "./Companion";
import {
  ACCESSORIES,
  COLORS,
  COMPANIONS,
  SCENES,
  THEMES,
  type BuddyAccessory,
  type BuddyScene,
  type CompanionColor,
  type CompanionKind,
} from "../data";
import "../buddy-studio.css";

export interface BuddyStudioProps {
  profile: {
    companion: CompanionKind;
    color: CompanionColor;
    buddy_name?: string;
    accessory?: string;
    scene?: string;
    theme?: string;
  };
  paused: boolean;
  onSave: (changes: Record<string, string>) => Promise<unknown>;
}
type Reaction = "idle" | "happy" | "love" | "snack" | "play" | "wave";
export default function BuddyStudio({
  profile,
  paused,
  onSave,
}: BuddyStudioProps) {
  const reduced = useReducedMotion();
  const [reaction, setReaction] = useState<Reaction>("idle");
  const [sleepy, setSleepy] = useState(false);
  const [name, setName] = useState(profile.buddy_name || "");
  const [tab, setTab] = useState<"friends" | "style" | "world">("friends");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const selected =
    COMPANIONS.find((friend) => friend.id === profile.companion) ||
    COMPANIONS[0];
  const displayName = profile.buddy_name || selected.name;
  const scene = (
    SCENES.some((s) => s.id === profile.scene) ? profile.scene : "garden"
  ) as BuddyScene;
  const accessory = (
    ACCESSORIES.some((a) => a.id === profile.accessory)
      ? profile.accessory
      : "none"
  ) as BuddyAccessory;
  const still = paused || !!reduced;
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => setName(profile.buddy_name || ""), [profile.buddy_name]);
  useEffect(() => {
    if (paused) {
      clearTimeout(timer.current);
      setReaction("idle");
    }
  }, [paused]);
  const save = async (changes: Record<string, string>) => {
    setSaving(true);
    setNotice("");
    try {
      await onSave(changes);
      setNotice("Đã lưu vào góc nhỏ của bạn.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Chưa lưu được. Bạn thử lại nhé.",
      );
    } finally {
      setSaving(false);
    }
  };
  const interact = (next: Reaction) => {
    if (paused) return;
    clearTimeout(timer.current);
    setSleepy(false);
    setReaction(next);
    timer.current = setTimeout(() => setReaction("idle"), 4200);
  };
  const bubble = paused
    ? "Mình sẽ ngồi yên ở đây cùng bạn tập trung."
    : sleepy
      ? "Ngủ một chút, mơ thật nhiều…"
      : reaction === "wave"
        ? "Chào bạn! Mình sẵn sàng học cùng bạn rồi."
        : reaction === "love"
          ? "Một cái ôm cho bạn, một cái ôm cho mình!"
          : reaction === "snack"
            ? "Ngon quá! Mình nạp đầy năng lượng rồi."
            : reaction === "play"
              ? "Bắt được rồi! Đến lượt bạn nè."
              : reaction === "happy"
                ? "Hôm nay được ở bên bạn, vui thật đấy!"
                : "Chạm vào mình nhé, mình đang đợi bạn đó!";
  return (
    <div className={`buddy-studio ${still ? "studio-still" : ""}`}>
      <header className="studio-heading">
        <div>
          <h1>Gặp bạn đồng hành của bạn</h1>
          <p>
            Chọn một người bạn, thêm chút sắc màu và tạo nên góc nhỏ của riêng
            mình.
          </p>
        </div>
        <Link className="studio-games-link" to="/tro-choi">
          <Gamepad2 size={18} />
          Mở bàn trò chơi
        </Link>
      </header>
      <div className="studio-layout">
        <section
          className={`buddy-room room-${scene}`}
          aria-label={`Không gian ${SCENES.find((s) => s.id === scene)?.name}`}
        >
          <div className="room-top">
            <span>
              <span className="room-status-dot" />
              {paused
                ? "Đang cùng bạn tập trung"
                : sleepy
                  ? "Một giấc mơ nhỏ"
                  : "Một ngày thật dễ thương"}
            </span>
            <button
              className="room-sleep"
              aria-label={sleepy ? "Đánh thức nhẹ nhàng" : "Nghỉ ngơi một chút"}
              onClick={() => {
                setSleepy((v) => !v);
                setReaction("idle");
              }}
              disabled={paused}
            >
              {sleepy ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          <div className="room-landscape" aria-hidden="true">
            <span className="room-sun" />
            <div className="room-canopy canopy-left">
              <i />
              <i />
              <i />
            </div>
            <div className="room-canopy canopy-right">
              <i />
              <i />
              <i />
            </div>
            <div className="room-grass">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <span className="room-cloud cloud-one" />
            <span className="room-cloud cloud-two" />
            <span className="room-hill hill-one" />
            <span className="room-hill hill-two" />
            <span className="room-spark spark-one">✦</span>
            <span className="room-spark spark-two">✧</span>
            <span className="room-spark spark-three">✦</span>
            <span className="room-flower flower-one">✿</span>
            <span className="room-flower flower-two">✿</span>
          </div>
          <div className="buddy-bubble" role="status">
            <AnimatePresence mode="wait">
              <motion.span
                key={bubble}
                initial={still ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={still ? undefined : { opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {bubble}
              </motion.span>
            </AnimatePresence>
          </div>
          <button
            className="studio-character"
            aria-label={`Vuốt ve ${displayName}`}
            onClick={() => interact("happy")}
            disabled={paused}
          >
            <Companion
              kind={profile.companion}
              color={profile.color}
              accessory={accessory}
              reaction={reaction}
              paused={paused}
              sleepy={sleepy}
              size={340}
            />
          </button>
          <div className="room-name">
            <h2>{displayName}</h2>
            <p>{selected.description}</p>
          </div>
          <div className="buddy-interactions">
            <button disabled={paused} onClick={() => interact("wave")}>
              <Hand size={18} />
              <span>Vẫy tay</span>
            </button>
            <button disabled={paused} onClick={() => interact("love")}>
              <Heart size={18} />
              <span>Ôm một cái</span>
            </button>
            <button disabled={paused} onClick={() => interact("snack")}>
              <Cookie size={18} />
              <span>Mời bánh</span>
            </button>
            <button disabled={paused} onClick={() => interact("play")}>
              <Sparkles size={18} />
              <span>Chơi cùng</span>
            </button>
          </div>
          {paused && (
            <p className="studio-pause-note">
              Bạn nhỏ đang ngồi yên trong phiên tập trung.
            </p>
          )}
        </section>
        <section
          className="studio-customize"
          aria-label="Tùy chỉnh bạn đồng hành"
        >
          <div
            className="studio-tabs"
            role="tablist"
            aria-label="Các kiểu tùy chỉnh"
          >
            {(
              [
                { id: "friends", name: "Bạn nhỏ", icon: Heart },
                { id: "style", name: "Phong cách", icon: Palette },
                { id: "world", name: "Không gian", icon: WandSparkles },
              ] as const
            ).map(({ id, name, icon: Icon }) => (
              <button
                type="button"
                key={id}
                id={`studio-tab-${id}`}
                role="tab"
                tabIndex={tab === id ? 0 : -1}
                onKeyDown={(event) => {
                  const ids = ["friends", "style", "world"] as const;
                  const index = ids.indexOf(id);
                  let next: number | undefined;
                  if (event.key === "ArrowRight")
                    next = (index + 1) % ids.length;
                  else if (event.key === "ArrowLeft")
                    next = (index + ids.length - 1) % ids.length;
                  else if (event.key === "Home") next = 0;
                  else if (event.key === "End") next = ids.length - 1;
                  if (next !== undefined) {
                    event.preventDefault();
                    setTab(ids[next]);
                    document.getElementById(`studio-tab-${ids[next]}`)?.focus();
                  }
                }}
                aria-selected={tab === id}
                aria-controls={`studio-panel-${id}`}
                onClick={() => setTab(id)}
                className={tab === id ? "active" : ""}
              >
                <Icon size={16} />
                {name}
              </button>
            ))}
          </div>
          <div
            className="studio-panel"
            role="tabpanel"
            id={`studio-panel-${tab}`}
            aria-labelledby={`studio-tab-${tab}`}
          >
            {tab === "friends" && (
              <>
                <div className="studio-panel-title">
                  <h2>Bạn muốn đồng hành cùng ai?</h2>
                  <p>Mỗi bạn nhỏ có một nét đáng yêu riêng.</p>
                </div>
                <div className="studio-friends">
                  {COMPANIONS.map((friend) => (
                    <button
                      key={friend.id}
                      disabled={saving}
                      aria-pressed={profile.companion === friend.id}
                      onClick={() => void save({ companion: friend.id })}
                      className={`studio-friend ${profile.companion === friend.id ? "chosen" : ""}`}
                    >
                      <Companion
                        kind={friend.id}
                        color={profile.color}
                        paused
                        size={90}
                      />
                      <strong>{friend.name}</strong>
                      {profile.companion === friend.id && (
                        <span className="studio-check">
                          <Check size={12} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <form
                  className="buddy-name-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void save({ buddy_name: name.trim() });
                  }}
                >
                  <label htmlFor="buddy-name">Đặt một cái tên thật riêng</label>
                  <div>
                    <input
                      id="buddy-name"
                      maxLength={24}
                      placeholder={selected.name}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <button disabled={saving} type="submit">
                      Lưu tên
                    </button>
                  </div>
                  <small>Để trống để dùng tên mặc định của bạn nhỏ.</small>
                </form>
              </>
            )}
            {tab === "style" && (
              <>
                <div className="studio-panel-title">
                  <h2>Một chút màu, một chút cá tính</h2>
                  <p>Thử chiếc khăn mới và một món phụ kiện nhé.</p>
                </div>
                <h3 className="studio-label">MÀU CHIẾC KHĂN</h3>
                <div className="studio-swatches">
                  {COLORS.map((color) => (
                    <button
                      key={color.id}
                      disabled={saving}
                      aria-pressed={profile.color === color.id}
                      onClick={() => void save({ color: color.id })}
                    >
                      <span style={{ background: color.hex }}>
                        {profile.color === color.id && <Check size={20} />}
                      </span>
                      <strong>{color.name}</strong>
                    </button>
                  ))}
                </div>
                <h3 className="studio-label">PHỤ KIỆN XINH XẮN</h3>
                <div className="studio-accessories">
                  {ACCESSORIES.map((item) => (
                    <button
                      key={item.id}
                      disabled={saving}
                      aria-pressed={accessory === item.id}
                      className={accessory === item.id ? "chosen" : ""}
                      onClick={() => void save({ accessory: item.id })}
                    >
                      <span aria-hidden="true">{item.symbol}</span>
                      <strong>{item.name}</strong>
                      {accessory === item.id && <Check size={13} />}
                    </button>
                  ))}
                </div>
              </>
            )}
            {tab === "world" && (
              <>
                <div className="studio-panel-title">
                  <h2>Hôm nay mình đi đâu?</h2>
                  <p>Một khung cảnh mới cho những ý tưởng mới.</p>
                </div>
                <h3 className="studio-label">Chủ đề ứng dụng</h3>
                <div className="theme-choices">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      disabled={saving}
                      aria-pressed={profile.theme === theme.id}
                      onClick={() => void save({ theme: theme.id })}
                    >
                      <span className="theme-strip" aria-hidden="true">
                        {theme.tones.map((color) => (
                          <i key={color} style={{ backgroundColor: color }} />
                        ))}
                      </span>
                      {theme.name}
                    </button>
                  ))}
                </div>
                <h3 className="studio-label">Phông nền của bạn nhỏ</h3>
                <div className="studio-scenes">
                  {SCENES.map((item) => (
                    <button
                      key={item.id}
                      disabled={saving}
                      aria-pressed={scene === item.id}
                      className={`scene-choice scene-${item.id} ${scene === item.id ? "chosen" : ""}`}
                      onClick={() => void save({ scene: item.id })}
                    >
                      <span className="scene-mini" aria-hidden="true">
                        <i />
                        <b />
                        {item.id === "space"
                          ? "✦"
                          : item.id === "garden"
                            ? "✿"
                            : "☀"}
                      </span>
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.description}</small>
                      </span>
                      {scene === item.id && <Check size={18} />}
                    </button>
                  ))}
                </div>
                <div className="studio-gentle-note">
                  <Moon size={21} />
                  <p>
                    Muốn yên tĩnh một chút? Chạm vào mặt trăng trong khung cảnh
                    để cho bạn nhỏ nghỉ ngơi.
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="studio-save-note" role="status">
            {saving
              ? "Đang lưu lựa chọn…"
              : notice || "Lựa chọn được lưu trên thiết bị này."}
          </div>
        </section>
      </div>
      <div className="studio-bottom-note">
        <Heart size={15} />
        <p>
          Không cần mở khóa hay đổi điểm. Tất cả bạn nhỏ đều sẵn sàng ở bên bạn.
        </p>
      </div>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Headphones,
  Link2,
  ListMusic,
  Music2,
  ShieldCheck,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { soundscapes, type Soundscape } from "../focus3/settings";
import { useAmbience } from "../focus3/useAmbience";
import { campaignUrl } from "../foundation/campaignMedia";
import "./music.css";

const MUSIC_PRESETS: ReadonlyArray<{
  id: string;
  label: string;
  note: string;
  sound: Exclude<Soundscape, "off">;
  volume: number;
}> = [
  { id: "deep-read", label: "Đọc sách thư viện", note: "Thư viện · 45%", sound: "library", volume: 45 },
  { id: "homework", label: "Giải bài tập sâu", note: "Tiếng ồn nâu · 50%", sound: "brown", volume: 50 },
  { id: "calm-night", label: "Ôn bài buổi tối", note: "Mưa nhẹ · 40%", sound: "rain", volume: 40 },
];

/** YouTube Music uses YouTube's officially supported embed player for public videos / playlists. */
const STORAGE_KEY = "focus-buddy-youtube-music-v1";
type MusicLink = { kind: "video" | "playlist"; id: string; label: string };
const videoId = /^[a-zA-Z0-9_-]{11}$/;
const playlistId = /^[a-zA-Z0-9_-]{10,150}$/;
export function parseMusicLink(input: string): MusicLink | null {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (!["music.youtube.com", "youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(host)) return null;
    const segments = url.pathname.split("/").filter(Boolean);
    if (host === "youtu.be" && segments.length === 1 && videoId.test(segments[0])) {
      return { kind: "video", id: segments[0], label: "Bài hát YouTube" };
    }
    if (segments.length === 1 && segments[0] === "playlist") {
      const id = url.searchParams.get("list") || "";
      return playlistId.test(id) ? { kind: "playlist", id, label: "Playlist YouTube Music" } : null;
    }
    if (segments.length === 1 && segments[0] === "watch") {
      const id = url.searchParams.get("v") || "";
      if (videoId.test(id)) return { kind: "video", id, label: "Bài hát YouTube" };
      const list = url.searchParams.get("list") || "";
      if (playlistId.test(list)) return { kind: "playlist", id: list, label: "Playlist YouTube Music" };
    }
    return null;
  } catch { return null; }
}
function load(): MusicLink[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(data)) return [];
    const results: MusicLink[] = [];
    for (const entry of data.slice(0, 12)) {
      if (!entry || typeof entry !== "object") continue;
      const item = entry as Partial<MusicLink>;
      const parsed = parseMusicLink(item.kind === "playlist" ? `https://music.youtube.com/playlist?list=${item.id || ""}` : `https://music.youtube.com/watch?v=${item.id || ""}`);
      if (parsed) results.push({ ...parsed, label: typeof item.label === "string" ? item.label.slice(0, 48) : parsed.label });
    }
    return results;
  } catch { return []; }
}
export default function Music() {
  const [saved, setSaved] = useState<MusicLink[]>(load);
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "video" | "playlist">("all");
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<MusicLink | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [ambient, setAmbient] = useState<Soundscape>("off");
  const [ambientVol, setAmbientVol] = useState(55);
  const audio = useAmbience(ambientVol);

  function persist(items: MusicLink[]) {
    setSaved(items);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* Browsers can disable storage. */ }
  }
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseMusicLink(input);
    if (!parsed) {
      setError("Dán liên kết HTTPS hợp lệ của video hoặc playlist từ YouTube Music / YouTube.");
      return;
    }
    const item: MusicLink = { ...parsed, label: name.trim().slice(0, 48) || parsed.label };
    persist([item, ...saved.filter((entry) => !(entry.kind === item.kind && entry.id === item.id))].slice(0, 12));
    setSelected(item);
    setPlayerOpen(false);
    setInput(""); setName(""); setError("");
  }
  const embed = selected ? selected.kind === "playlist"
    ? `https://www.youtube-nocookie.com/embed/videoseries?list=${selected.id}`
    : `https://www.youtube-nocookie.com/embed/${selected.id}`
    : "";
  const link = selected ? selected.kind === "playlist"
    ? `https://music.youtube.com/playlist?list=${selected.id}`
    : `https://music.youtube.com/watch?v=${selected.id}`
    : "";
  const visible = saved.filter((item) => filter === "all" || item.kind === filter);
  const ambientChoices = Object.entries(soundscapes).filter(([id]) => id !== "off") as [Exclude<Soundscape, "off">, string][];

  return (
    <main className="music-page">
      <header className="music-hero music-hero-photo">
        <img
          src={campaignUrl("students-library-reading.jpg")}
          alt="Học sinh Trường THCS Đồng Giao đọc sách tập trung trong thư viện"
          className="music-hero-bg"
          referrerPolicy="no-referrer"
        />
        <div className="music-hero-scrim" aria-hidden="true" />
        <div className="music-hero-content">
          <span className="music-kicker"><Headphones size={16}/> GÓC ÂM NHẠC · KHÔNG GIAN TẬP TRUNG</span>
          <h1>Nhạc nhẹ cho góc học tập</h1>
          <p>Nghe âm thanh nền có sẵn ngay cả khi ngoại tuyến, hoặc lưu playlist công khai từ YouTube Music cho giờ học tập trung.</p>
          <div className="music-quick-presets" role="group" aria-label="Gợi ý chế độ âm thanh học tập">
            {MUSIC_PRESETS.map((preset) => {
              const active = audio.playing && ambient === preset.sound && ambientVol === preset.volume;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`music-preset-btn${active ? " active" : ""}`}
                  onClick={() => {
                    setAmbient(preset.sound);
                    setAmbientVol(preset.volume);
                    void audio.play(preset.sound);
                  }}
                >
                  <strong>{preset.label}</strong>
                  <small>{preset.note}</small>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <section className="music-ambient card" aria-label="Âm thanh nền có sẵn">
        <div className="music-ambient-head">
          <div>
            <h2><Volume2 size={20}/> Âm thanh nền phát ngay trên máy</h2>
            <p>Tổng hợp trực tiếp bằng trình duyệt — không quảng cáo, hoạt động cả khi ngoại tuyến.</p>
          </div>
          {audio.playing && (
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                audio.stop();
                setAmbient("off");
              }}
            >
              <VolumeX size={16}/> Tắt âm nền
            </button>
          )}
        </div>
        <div className="music-ambient-grid">
          {ambientChoices.map(([id, label]) => {
            const active = audio.playing && ambient === id;
            return (
              <button
                key={id}
                type="button"
                className={`music-ambient-btn${active ? " active" : ""}`}
                aria-pressed={active}
                onClick={() => {
                  if (active) {
                    audio.stop();
                    setAmbient("off");
                  } else {
                    setAmbient(id);
                    void audio.play(id);
                  }
                }}
              >
                {active && (
                  <span className="music-eq" aria-hidden="true">
                    <i /><i /><i />
                  </span>
                )}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        {audio.playing && (
          <label className="music-ambient-vol">
            <span>Âm lượng nền</span>
            <input
              type="range"
              min={0}
              max={100}
              value={ambientVol}
              aria-label="Âm lượng âm thanh nền"
              onChange={(e) => setAmbientVol(Number(e.target.value))}
            />
            <strong>{ambientVol}%</strong>
          </label>
        )}
        {audio.error && <p className="music-error" role="status">{audio.error}</p>}
      </section>

      <div className="music-layout">
        <section className="music-library">
          <div className="music-section-head">
            <h2><ListMusic size={21}/> Playlist của bạn</h2><small>{saved.length}/12 mục · chỉ lưu trên thiết bị</small>
          </div>
          <form className="music-add-form" onSubmit={add}>
            <label htmlFor="ytmusic-link">Dán liên kết YouTube Music / YouTube</label>
            <div className="music-link-row">
              <Link2 size={19}/>
              <input id="ytmusic-link" required value={input} onChange={(event) => setInput(event.target.value)}
                placeholder="https://music.youtube.com/playlist?list=..." />
            </div>
            <label htmlFor="ytmusic-label">Tên gợi nhớ (không bắt buộc)</label>
            <input id="ytmusic-label" maxLength={48} value={name} onChange={(event) => setName(event.target.value)}
              placeholder="Ví dụ: Playlist tập trung" />
            <button className="button primary" type="submit"><Music2 size={17}/> Lưu giai điệu</button>
            {error && <p className="music-error" role="alert">{error}</p>}
          </form>
          {saved.length > 1 && (
            <div className="filter-tabs" role="group" aria-label="Lọc danh sách nhạc">
              {(
                [
                  ["all", "Tất cả"],
                  ["video", "Video"],
                  ["playlist", "Playlist"],
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
          )}
          <div className="music-favorites">
            {visible.length ? visible.map((item) => (
              <div className="music-item" key={item.kind + ":" + item.id}>
                <span className="music-item-icon"><Music2 size={18}/></span>
                <button className="music-item-select" type="button"
                  aria-pressed={selected?.id === item.id && selected?.kind === item.kind}
                  onClick={() => {setSelected(item);setPlayerOpen(false);}}>
                  <strong>{item.label}</strong><small>{item.kind === "playlist" ? "Playlist" : "Video"} · YouTube Music</small>
                </button>
                <button className="music-remove" type="button" aria-label={`Xóa ${item.label}`}
                  onClick={() => {
                    persist(saved.filter((savedItem) => savedItem !== item));
                    if (selected?.id === item.id && selected?.kind === item.kind) {setSelected(null);setPlayerOpen(false);}
                  }}><Trash2 size={16}/></button>
              </div>
            )) : <p className="music-empty">Chưa có bài nào. Mở YouTube Music, chọn Chia sẻ → Sao chép liên kết rồi dán vào đây.</p>}
          </div>
        </section>
        <section className="music-player-panel">
          <span className="music-player-symbol"><Headphones size={29}/></span>
          <h2>{selected?.label || "Chọn một giai điệu"}</h2>
          {selected ? (
            <>
              {!playerOpen ? (
                <div className="music-consent">
                  <ShieldCheck size={24}/>
                  <p>Chỉ tải trình phát YouTube khi bạn bấm mở. YouTube có thể sử dụng cookie và xử lý dữ liệu theo chính sách riêng.</p>
                  <button className="button primary" type="button" onClick={() => setPlayerOpen(true)}>Mở trình phát YouTube</button>
                </div>
              ) : (
                <iframe key={embed} className="music-spotify-frame" width="100%" height="315"
                  src={embed} title={`YouTube Music: ${selected.label}`}
                  loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen />
              )}
              <div className="music-player-links">
                <a className="music-external" href={link} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> Mở bằng YouTube Music</a>
                <button
                  type="button"
                  className="music-copy"
                  onClick={() => {
                    void navigator.clipboard?.writeText(link).then(() => {
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1800);
                    }).catch(() => {});
                  }}
                >
                  {copied ? <Check size={15}/> : <Copy size={15}/>}
                  {copied ? "Đã sao chép" : "Sao chép liên kết"}
                </button>
              </div>
            </>
          ) : <p>Thêm một bài hát hoặc playlist để bắt đầu. Nhạc và dữ liệu trò chơi được quản lý riêng.</p>}
          <div className="music-tip">
            <Headphones size={17}/>
            Chỉ những video / playlist công khai cho phép nhúng mới có thể phát. Một số nội dung cần đăng nhập hoặc không hỗ trợ trình phát nhúng; khi đó hãy mở trực tiếp trên YouTube Music.
          </div>
        </section>
      </div>
    </main>
  );
}

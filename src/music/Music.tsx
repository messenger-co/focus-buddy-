import { useState } from "react";
import { ExternalLink, Headphones, Link2, ListMusic, Music2, RotateCcw, ShieldCheck } from "lucide-react";
import "./music.css";

const STORAGE_KEY = "focus-buddy-spotify-playlists-v1";
type SavedMusic = { id: string; kind: "playlist" | "album" | "track" | "artist" | "show" | "episode"; label: string };
type SpotifyKind = SavedMusic["kind"];
const TYPES: SpotifyKind[] = ["playlist", "album", "track", "artist", "show", "episode"];
const validate = (input: string): SavedMusic | null => {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== "https:" || url.hostname !== "open.spotify.com" || url.username || url.password) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    // Spotify sometimes prefixes regional links with /intl-xx/.
    if (/^intl-[a-z]{2}(?:-[a-z]{2})?$/i.test(parts[0] || "")) parts.shift();
    if (parts[0] === "embed") parts.shift();
    if (parts.length !== 2 || !TYPES.includes(parts[0] as SpotifyKind) || !/^[a-zA-Z0-9]{22}$/.test(parts[1])) return null;
    return { kind: parts[0] as SpotifyKind, id: parts[1], label: `Spotify ${parts[0] === "playlist" ? "Playlist" : parts[0] === "album" ? "Album" : parts[0] === "track" ? "Bài hát" : "Nội dung"}` };
  } catch {
    return null;
  }
};
function load(): SavedMusic[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(data)) return [];
    return data.slice(0, 12).flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const value = item as Partial<SavedMusic>;
      const parsed = validate(`https://open.spotify.com/${value.kind}/${value.id}`);
      if (!parsed) return [];
      return [{ ...parsed, label: typeof value.label === "string" ? value.label.slice(0, 48) : parsed.label }];
    });
  } catch { return []; }
}
export default function Music() {
  const [saved, setSaved] = useState<SavedMusic[]>(load);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<SavedMusic | null>(null);
  const [play, setPlay] = useState(false);
  const [name, setName] = useState("");
  function persist(items: SavedMusic[]) {
    setSaved(items);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* local storage can be disabled */ }
  }
  function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = validate(input);
    if (!parsed) { setError("Hãy dán liên kết Spotify hợp lệ tới playlist, album, bài hát hoặc podcast."); return; }
    const entry = { ...parsed, label: name.trim().slice(0, 48) || parsed.label };
    const items = [entry, ...saved.filter((value) => !(value.kind === entry.kind && value.id === entry.id))].slice(0, 12);
    persist(items);
    setInput(""); setName(""); setError(""); setSelected(entry); setPlay(false);
  }
  const source = selected ? `https://open.spotify.com/embed/${selected.kind}/${selected.id}` : "";
  return (
    <main className="music-page">
      <header className="music-hero">
        <span className="music-kicker"><Headphones size={16}/> KHÔNG GIAN ÂM NHẠC</span>
        <h1>Giai điệu cho góc học tập</h1>
        <p>Chọn playlist Spotify yêu thích cho giờ học hoặc giờ nghỉ. Bạn quyết định lúc nào nghe nhạc.</p>
        <div className="music-blobs" aria-hidden="true"><i/><i/><i/></div>
      </header>
      <div className="music-layout">
        <section className="music-library">
          <div className="music-section-head"><h2><ListMusic size={21}/> Góc nhạc của bạn</h2><small>Lưu tối đa 12 liên kết trên thiết bị</small></div>
          <form className="music-add-form" onSubmit={add}>
            <label htmlFor="spotify-link">Dán liên kết chia sẻ từ Spotify</label>
            <div className="music-link-row"><Link2 size={19}/><input id="spotify-link" value={input} onChange={(event) => setInput(event.target.value)} placeholder="https://open.spotify.com/playlist/..." required /></div>
            <label htmlFor="spotify-name">Tên gợi nhớ (không bắt buộc)</label>
            <input id="spotify-name" value={name} maxLength={48} onChange={(event) => setName(event.target.value)} placeholder="Ví dụ: Nhạc nhẹ khi làm bài" />
            <button className="button primary" type="submit"><Music2 size={17}/> Thêm vào góc nhạc</button>
            {error && <p role="alert" className="music-error">{error}</p>}
          </form>
          <div className="music-favorites">
            {saved.length ? saved.map((item) => (
              <div className="music-item" key={item.kind + ":" + item.id}>
                <span className="music-item-icon"><Music2 size={18}/></span>
                <button className="music-item-select" onClick={() => {setSelected(item);setPlay(false);}} type="button" aria-pressed={selected?.id === item.id && selected?.kind === item.kind}>
                  <strong>{item.label}</strong><small>{item.kind} · Spotify</small>
                </button>
                <button className="music-remove" aria-label={`Xóa ${item.label}`} onClick={() => {
                  const next = saved.filter((value) => value !== item);
                  persist(next);
                  if (selected?.id === item.id && selected?.kind === item.kind) {setSelected(null);setPlay(false);}
                }} type="button"><RotateCcw size={16}/></button>
              </div>
            )) : <p className="music-empty">Chưa có playlist nào. Hãy mở Spotify, chọn Share → Copy link, rồi dán vào đây.</p>}
          </div>
        </section>
        <section className="music-player-panel">
          <span className="music-player-symbol"><Headphones size={29}/></span>
          <h2>{selected?.label || "Chọn một giai điệu"}</h2>
          {selected ? (
            <>
              {!play ? (
                <div className="music-consent">
                  <ShieldCheck size={25}/>
                  <p>Spotify sẽ chỉ tải khi bạn chọn mở trình phát. Nội dung và dữ liệu phát lại do Spotify xử lý theo chính sách của họ.</p>
                  <button className="button primary" onClick={() => setPlay(true)} type="button">Mở trình phát Spotify</button>
                </div>
              ) : (
                <iframe
                  key={source}
                  title={`Spotify: ${selected.label}`}
                  src={source}
                  width="100%"
                  height={selected.kind === "track" || selected.kind === "episode" ? 160 : 380}
                  loading="lazy"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="music-spotify-frame"
                />
              )}
              <a className="music-external" href={`https://open.spotify.com/${selected.kind}/${selected.id}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> Mở trên Spotify</a>
            </>
          ) : <p>Thêm bài hát, playlist hoặc album Spotify bằng liên kết chia sẻ để phát ngay trong tab Nhạc.</p>}
          <div className="music-tip"><Headphones size={17}/> Bạn có thể điều khiển nhạc bằng trình phát Spotify. Chế độ tập trung và trò chơi hoạt động độc lập.</div>
        </section>
      </div>
    </main>
  );
}

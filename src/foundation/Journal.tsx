import { useState } from "react";
import { BookOpen, Check, Download, Search, Trash2 } from "lucide-react";
import { vietnamDay } from "../state";
import { language } from "./language";
const key = "focus-buddy-journal-v3";
function read(): Record<string, string> {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "{}");
    return Object.fromEntries(
      Object.entries(v ?? {}).filter(
        ([d, s]) => /^\d{4}-\d{2}-\d{2}$/.test(d) && typeof s === "string",
      ),
    ) as Record<string, string>;
  } catch {
    return {};
  }
}
export default function Journal() {
  const [entries, setEntries] = useState(read),
    [date, setDate] = useState(() => vietnamDay()),
    [note, setNote] = useState(() => read()[vietnamDay()] || ""),
    [query, setQuery] = useState(""),
    [message, status] = useState("");
  const change = (d: string) => {
    setDate(d);
    setNote(entries[d] || "");
    status("");
  };
  const save = (remove = false) => {
    const next = read();
    if (remove) delete next[date];
    else next[date] = note.trim();
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setEntries(next);
      setNote(next[date] || "");
      status(remove ? "Đã xóa ghi chép." : "Đã lưu ghi chép.");
    } catch {
      status("Trình duyệt chưa lưu được ghi chép.");
    }
  };
  const exportTxt = () => {
    const dates = Object.keys(entries).sort().reverse();
    if (!dates.length) return;
    const text = dates
      .map((d) => `=== ${d} ===\n${entries[d]}\n`)
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `nhat-ky-hoc-tap-${vietnamDay()}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status("Đã tải xuống nhật ký học tập.");
  };
  const words = note.trim() ? note.trim().split(/\s+/).length : 0;
  const savedDates = Object.keys(entries)
    .sort()
    .reverse()
    .filter((d) => {
      const q = query.trim().toLowerCase();
      return !q || d.includes(q) || entries[d].toLowerCase().includes(q);
    });
  return (
    <section className="card journal-card">
      <div className="journal-head">
        <h2>
          <BookOpen size={21} /> Nhật ký học tập
        </h2>
        {Object.keys(entries).length > 0 && (
          <button type="button" className="button secondary" onClick={exportTxt}>
            <Download size={15} /> Tải nhật ký (.txt)
          </button>
        )}
      </div>
      <label>
        Ngày ghi chép
        <input
          type="date"
          value={date}
          onChange={(e) => {
            if (e.target.value) change(e.target.value);
          }}
        />
      </label>
      <label>
        <span className="journal-label-row">
          <span>Điều bạn muốn ghi nhớ</span>
          <small className="journal-count">
            {words} từ · {note.length}/2000
          </small>
        </span>
        <textarea
          maxLength={2000}
          placeholder="Hôm nay bạn đã hiểu thêm điều gì? Hoặc ghi lại một ý tưởng cần nhớ cho ngày mai…"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            status("");
          }}
        />
      </label>
      <div className="button-row">
        <button
          type="button"
          className="button primary"
          disabled={!note.trim() || note.trim() === entries[date]}
          onClick={() => save()}
        >
          <Check size={16} /> Lưu ghi chép
        </button>
        {entries[date] && (
          <button
            type="button"
            className="button secondary"
            onClick={() => save(true)}
          >
            <Trash2 size={15} /> Xóa ghi chép
          </button>
        )}
      </div>
      <p role="status">{message}</p>
      {Object.keys(entries).length > 0 && (
        <div className="journal-saved">
          {Object.keys(entries).length > 2 && (
            <label className="journal-search">
              <Search size={15} aria-hidden="true" />
              <input
                type="search"
                aria-label="Tìm trong nhật ký"
                placeholder="Tìm nhanh trong ghi chép…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          )}
          <select
            aria-label="Mở ghi chép đã lưu"
            value={entries[date] && savedDates.includes(date) ? date : ""}
            onChange={(e) => change(e.target.value)}
          >
            <option value="" disabled>
              Mở ghi chép đã lưu ({savedDates.length})
            </option>
            {savedDates.map((d) => (
              <option key={d} value={d}>
                {new Intl.DateTimeFormat(language, {
                  dateStyle: "long",
                }).format(new Date(d + "T12:00:00"))}
              </option>
            ))}
          </select>
        </div>
      )}
    </section>
  );
}

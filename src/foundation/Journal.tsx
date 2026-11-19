import { useState } from "react";
import { BookOpen, Check, Trash2 } from "lucide-react";
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
  return (
    <section className="card journal-card">
      <h2>
        <BookOpen size={21} /> Nhật ký học tập
      </h2>
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
        Điều bạn muốn ghi nhớ
        <textarea
          maxLength={2000}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            status("");
          }}
        />
      </label>
      <div className="button-row">
        <button
          className="button primary"
          disabled={!note.trim() || note.trim() === entries[date]}
          onClick={() => save()}
        >
          <Check size={16} /> Lưu ghi chép
        </button>
        {entries[date] && (
          <button className="button secondary" onClick={() => save(true)}>
            <Trash2 size={15} /> Xóa ghi chép
          </button>
        )}
      </div>
      <p role="status">{message}</p>
      {Object.keys(entries).length > 0 && (
        <select
          aria-label="Mở ghi chép đã lưu"
          value={entries[date] ? date : ""}
          onChange={(e) => change(e.target.value)}
        >
          <option value="" disabled>
            Mở ghi chép đã lưu
          </option>
          {Object.keys(entries)
            .sort()
            .reverse()
            .map((d) => (
              <option key={d} value={d}>
                {new Intl.DateTimeFormat(language, {
                  dateStyle: "long",
                }).format(new Date(d + "T12:00:00"))}
              </option>
            ))}
        </select>
      )}
    </section>
  );
}

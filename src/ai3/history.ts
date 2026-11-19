import type { ChatMessage } from "../chat";

export interface Turn extends ChatMessage {
  source: "live" | "sample";
  incomplete?: boolean;
}
const optKey = "focus-buddy-assistant-history-enabled-v1";
const dataKey = "focus-buddy-assistant-history-v1";
export function keepsHistory() {
  try {
    return localStorage.getItem(optKey) === "1";
  } catch {
    return false;
  }
}
export function readHistory(): Turn[] {
  try {
    if (!keepsHistory()) return [];
    const raw = localStorage.getItem(dataKey);
    if (!raw || raw.length > 160000) return [];
    const rows: unknown = JSON.parse(raw);
    if (!Array.isArray(rows)) return [];
    return rows
      .slice(-40)
      .flatMap((row): Turn[] =>
        row &&
        (row.role === "assistant" || row.role === "user") &&
        (row.source === "sample" || row.source === "live") &&
        typeof row.content === "string" &&
        row.content.trim()
          ? [
              {
                role: row.role,
                source: row.source,
                content: row.content.slice(0, 16000),
                incomplete: row.incomplete === true,
              },
            ]
          : [],
      );
  } catch {
    return [];
  }
}
export function saveHistory(turns: Turn[]) {
  try {
    if (!keepsHistory()) return;
    const kept = turns
      .filter((t) => t.content.trim())
      .slice(-40)
      .map((t) => ({ ...t, content: t.content.slice(0, 16000) }));
    let serialized = JSON.stringify(kept);
    while (serialized.length > 160000) {
      kept.shift();
      serialized = JSON.stringify(kept);
    }
    localStorage.setItem(dataKey, serialized);
  } catch {
    /* Hội thoại hiện tại vẫn nằm trong bộ nhớ. */
  }
}
export function setHistoryPreference(keep: boolean): boolean {
  try {
    if (keep) localStorage.setItem(optKey, "1");
    else {
      localStorage.removeItem(optKey);
      localStorage.removeItem(dataKey);
    }
    return true;
  } catch {
    return false;
  }
}
export function clearHistory() {
  try {
    localStorage.removeItem(dataKey);
  } catch {
    /* Trình duyệt có thể tắt lưu trữ. */
  }
}

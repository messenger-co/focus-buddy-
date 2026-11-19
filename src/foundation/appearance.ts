import { useSyncExternalStore } from "react";
export type MotionChoice = "off" | "minimal" | "normal" | "enhanced";
export interface Appearance {
  motion: MotionChoice;
  backdrop: "plain" | "grid" | "stars" | "leaves";
  accent: number | null;
  widgets: string[];
}
const key = "focus-buddy-appearance-v3",
  event = "focus-buddy-appearance";
const defaults: Appearance = {
  motion: "normal",
  backdrop: "plain",
  accent: null,
  widgets: ["missions", "friend", "mood", "assistant"],
};
export function parseAppearance(raw: string | null): Appearance {
  try {
    const a = JSON.parse(raw ?? "null");
    if (!a) return defaults;
    return {
      motion: ["off", "minimal", "normal", "enhanced"].includes(a.motion)
        ? a.motion
        : "normal",
      backdrop: ["plain", "grid", "stars", "leaves"].includes(a.backdrop)
        ? a.backdrop
        : "plain",
      accent:
        Number.isInteger(a.accent) && a.accent >= 0 && a.accent < 360
          ? a.accent
          : null,
      widgets: Array.isArray(a.widgets)
        ? [
            ...new Set<string>(
              a.widgets.filter((w: string) => defaults.widgets.includes(w)),
            ),
          ]
        : defaults.widgets,
    };
  } catch {
    return defaults;
  }
}
let fallback: string | null = null;
function snapshot() {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function subscribe(f: () => void) {
  window.addEventListener(event, f);
  window.addEventListener("storage", f);
  return () => {
    window.removeEventListener(event, f);
    window.removeEventListener("storage", f);
  };
}
export function useAppearance() {
  return parseAppearance(useSyncExternalStore(subscribe, snapshot, () => null));
}
export function updateAppearance(change: Partial<Appearance>) {
  const next = { ...parseAppearance(snapshot()), ...change };
  const raw = JSON.stringify(next);
  try {
    localStorage.setItem(key, raw);
  } catch {
    /* Bộ nhớ tạm dùng được trong phiên. */
  }
  fallback = raw;
  document.documentElement.dataset.motion = next.motion;
  window.dispatchEvent(new Event(event));
}

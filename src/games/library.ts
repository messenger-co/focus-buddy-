import { useSyncExternalStore } from "react";
import { gameShelf } from "./puzzles";
import { adventures } from "./arcade/courses";
import { expeditions } from "./arcade/boards";
import { clubGames } from "./club/catalog";

export const sections = {
  all: "Mọi nhóm",
  adventure: "Phiêu lưu",
  club: "Câu lạc bộ Buddy",
  quick: "Thử thách nhanh",
} as const;
export type Section = keyof typeof sections;
function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replaceAll("đ", "d")
    .trim();
}
const titles = [
  { slug: "vuon-buddy", title: "Vườn hoa lấp lánh", group: "adventure" },
  { slug: "buddy-run", title: "Buddy Runner", group: "adventure" },
  ...[...adventures, ...expeditions].map((g) => ({
    slug: g.slug,
    title: g.title,
    group: "adventure",
  })),
  ...clubGames.map((g) => ({ slug: g.slug, title: g.title, group: "club" })),
  ...gameShelf.map((g) => ({ slug: g.id, title: g.name, group: "quick" })),
].map((game) => ({
  ...game,
  index: normalize(game.title + " " + game.slug.replaceAll("-", " ")),
}));
export function findGames(
  query: string,
  section: Section,
  pins: readonly string[] | null,
) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return new Set(
    titles
      .filter(
        (g) =>
          (section === "all" || section === g.group) &&
          (!pins || pins.includes(g.slug)) &&
          words.every((word) => g.index.includes(word)),
      )
      .map((g) => g.slug),
  );
}
const key = "focus-buddy-pinned-games-v1";
const eventName = "focus-buddy-pins-changed";
let inMemory: string | null = null;
function snapshot() {
  try {
    return inMemory ?? localStorage.getItem(key) ?? "[]";
  } catch {
    return inMemory ?? "[]";
  }
}
function parsePins(raw: string): string[] {
  try {
    const saved: unknown = JSON.parse(raw);
    return Array.isArray(saved)
      ? titles
          .filter((game) => saved.includes(game.slug))
          .map((game) => game.slug)
      : [];
  } catch {
    return [];
  }
}
function subscribe(onChange: () => void) {
  const storage = (e: StorageEvent) => {
    if (e.key === key || e.key === null) {
      inMemory = null;
      onChange();
    }
  };
  window.addEventListener("storage", storage);
  window.addEventListener(eventName, onChange);
  return () => {
    window.removeEventListener("storage", storage);
    window.removeEventListener(eventName, onChange);
  };
}
export function usePinnedGames() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  function togglePin(slug: string) {
    if (!titles.some((g) => g.slug === slug)) return;
    const current = parsePins(snapshot());
    const next = JSON.stringify(
      current.includes(slug)
        ? current.filter((id) => id !== slug)
        : [...current, slug],
    );
    try {
      localStorage.setItem(key, next);
      inMemory = null;
    } catch {
      inMemory = next;
    }
    window.dispatchEvent(new Event(eventName));
  }
  return { pins: parsePins(raw), togglePin };
}

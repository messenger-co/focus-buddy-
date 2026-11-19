import { useSyncExternalStore } from "react";
import { Check } from "lucide-react";

export const LEVELS = 6;
const previous = {
  "dao-may": ["jump/grove", "jump/coral", "jump/night"],
  "canh-luon": ["glide/night", "glide/grove", "glide/coral"],
};
export function levelKey(slug: string, index: number) {
  const legacy = previous[slug as keyof typeof previous]?.[index];
  return legacy
    ? `focus-buddy-arcade-v1/${legacy}`
    : `focus-buddy-level-v1/${slug}/${index + 1}`;
}
export interface Score {
  count: number;
  seconds: number;
  moves?: number;
}
export function readScore(key: string, max = Infinity): Score | null {
  try {
    const s = JSON.parse(localStorage.getItem(key) || "null");
    return s &&
      Number.isInteger(s.count) &&
      s.count >= 0 &&
      s.count <= max &&
      Number.isFinite(s.seconds) &&
      s.seconds > 0 &&
      (s.moves === undefined || (Number.isInteger(s.moves) && s.moves >= 0))
      ? s
      : null;
  } catch {
    return null;
  }
}
export function recordScore(key: string, score: Score, max: number) {
  const best = readScore(key, max);
  if (best) {
    const difference =
      score.count - best.count ||
      (best.moves ?? 0) - (score.moves ?? 0) ||
      best.seconds - score.seconds;
    if (difference <= 0) return best;
  }
  try {
    localStorage.setItem(key, JSON.stringify(score));
    window.dispatchEvent(new Event("focus-buddy-level-won"));
  } catch {
    /* Vẫn chơi được khi trình duyệt tắt lưu trữ. */
  }
  return score;
}
function subscribe(notify: () => void) {
  window.addEventListener("focus-buddy-level-won", notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener("focus-buddy-level-won", notify);
    window.removeEventListener("storage", notify);
  };
}
function useCompleted(slug: string) {
  return useSyncExternalStore(
    subscribe,
    () => {
      let mask = 0;
      for (let i = 0; i < LEVELS; i++)
        if (readScore(levelKey(slug, i))) mask |= 1 << i;
      return mask;
    },
    () => 0,
  );
}
export function LevelCount({ slug }: { slug: string }) {
  const mask = useCompleted(slug);
  const done = mask.toString(2).replace(/0/g, "").length;
  return <>{done ? `Đã vượt ${done}/${LEVELS} chặng` : `${LEVELS} chặng`}</>;
}
export function LevelPicker({
  slug,
  titles,
  index,
  onSelect,
}: {
  slug: string;
  titles: readonly string[];
  index: number;
  onSelect: (i: number) => void;
}) {
  const mask = useCompleted(slug);
  return (
    <div role="group" className="course-picker" aria-label="Chọn chặng">
      {titles.map((title, i) => {
        const done = Boolean(mask & (1 << i));
        return (
          <button
            key={title}
            type="button"
            className={`course-${["grove", "coral", "night"][i % 3]}`}
            aria-pressed={i === index}
            aria-label={`Chặng ${i + 1}: ${title}${done ? ", đã vượt" : ""}`}
            onClick={() => onSelect(i)}
          >
            <span>{done ? <Check size={13} /> : i + 1}</span>
            {title}
          </button>
        );
      })}
    </div>
  );
}

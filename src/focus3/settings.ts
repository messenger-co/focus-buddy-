import { useEffect, useState } from "react";
import { planFor, type FocusMode } from "./model";
export const soundscapes = {
  off: "Yên lặng",
  rain: "Mưa hiên nhà",
  brook: "Suối trong rừng",
  waves: "Sóng biển",
  fire: "Lửa tí tách",
  chimes: "Chuông gió tre",
  fan: "Quạt bàn",
  brown: "Nhiễu nâu êm dịu",
  night: "Đêm dế kêu",
  library: "Thư viện yên tĩnh",
} as const;
export type Soundscape = keyof typeof soundscapes;
export type ClockLook = "leaf" | "ocean" | "dusk" | "sunlit" | "lavender";
export interface FocusSettings {
  mode: FocusMode;
  custom: number;
  breakMinutes: number;
  goal: string;
  task: string;
  tasks: { id: string; title: string; done: boolean }[];
  dayGoal: number;
  weekGoal: number;
  look: ClockLook;
  sound: Soundscape;
  volume: number;
  chime: boolean;
}
const key = "focus-buddy-focus-studio-v1";
const defaults: FocusSettings = {
  mode: "classic",
  custom: 20,
  breakMinutes: 5,
  goal: "",
  task: "",
  tasks: [],
  dayGoal: 40,
  weekGoal: 200,
  look: "leaf",
  sound: "off",
  volume: 50,
  chime: true,
};
function read(): FocusSettings {
  try {
    const d = JSON.parse(localStorage.getItem(key) ?? "null");
    if (!d) return defaults;
    const n = (x: unknown, min: number, max: number, f: number) =>
      typeof x === "number" && Number.isFinite(x)
        ? Math.min(max, Math.max(min, Math.round(x)))
        : f;
    const plan = planFor(
      d.mode,
      n(d.custom, 1, 180, 20),
      n(d.breakMinutes, 0, 60, 5),
      typeof d.goal === "string" ? d.goal : "",
      typeof d.task === "string" ? d.task : "",
    );
    return {
      mode: plan.mode,
      custom: n(d.custom, 1, 180, 20),
      breakMinutes: plan.breakMinutes,
      goal: plan.goal,
      task: plan.taskId,
      tasks: Array.isArray(d.tasks)
        ? d.tasks
            .filter(
              (t: { id: string; title: string; done: boolean }) =>
                t &&
                typeof t.id === "string" &&
                typeof t.title === "string" &&
                typeof t.done === "boolean",
            )
            .slice(0, 80)
        : [],
      dayGoal: n(d.dayGoal, 1, 480, 40),
      weekGoal: n(d.weekGoal, 1, 3360, 200),
      look: ["leaf", "ocean", "dusk", "sunlit", "lavender"].includes(d.look)
        ? d.look
        : "leaf",
      sound:
        typeof d.sound === "string" && Object.hasOwn(soundscapes, d.sound)
          ? d.sound
          : "off",
      volume: n(d.volume, 0, 100, defaults.volume),
      chime: typeof d.chime === "boolean" ? d.chime : true,
    };
  } catch {
    return defaults;
  }
}
export function selectedPlan(settings: FocusSettings) {
  const task = settings.tasks.find(
    (item) => item.id === settings.task && !item.done,
  );
  return planFor(
    settings.mode,
    settings.custom,
    settings.breakMinutes,
    settings.goal || task?.title || "",
    task?.id ?? "",
  );
}
export function useFocusSettings() {
  const [s, set] = useState(read);
  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if (e.key === key || e.key === null) set(read());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const write = (patch: Partial<FocusSettings>) => {
    set((old) => {
      const next = { ...old, ...patch };
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* Giữ tùy chọn trong lần mở này. */
      }
      return next;
    });
  };
  return [s, write] as const;
}

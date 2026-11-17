import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { EXERCISES, COMPANIONS, COLORS } from "./data";
import type { CompanionKind, CompanionColor, Mood } from "./data";
import {
  apiConfigured,
  authRedirectUrl,
  cloudConfigured,
  friendlyError,
  supabase,
} from "./cloud";

export const DEMO_STORAGE_KEY = "focus-buddy-demo-v2";
export const FOCUS_DURATION_MS = 20 * 60 * 1000;
export type BuddyAccessory = "none" | "bow" | "glasses" | "crown";
export type BuddyScene = "garden" | "space" | "sunset";
export type Profile = {
  display_name: string;
  companion: CompanionKind;
  color: CompanionColor;
  buddy_name: string;
  accessory: BuddyAccessory;
  scene: BuddyScene;
  total_xp: number;
  level: number;
};
export type Preferences = Pick<
  Profile,
  "display_name" | "companion" | "color" | "buddy_name" | "accessory" | "scene"
>;
export type FocusSession = {
  id: string;
  started_at: string;
  ends_at: string;
  status: "active" | "completed" | "cancelled";
  completed_at?: string | null;
  cancelled_at?: string | null;
};
export type Achievement = {
  id: string;
  title: string;
  description: string;
  earned: boolean;
};
export type Mission = {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  reward_xp: number;
  completed: boolean;
};
export type Progress = {
  profile: Profile;
  focus_sessions: FocusSession[];
  completed_exercises: string[];
  check_ins: { day: string; mood: Mood; created_at: string }[];
  achievements: Achievement[];
  missions: Mission[];
  counts?: { focus: number; exercise: number; checkin: number };
};
export type RewardResult = {
  awarded_xp: number;
  total_xp: number;
  level: number;
};
export type AssessmentResult = {
  correct: boolean;
  awarded_xp: number;
  explanation: string;
};
export type DemoAction =
  | { type: "checkin"; mood: Mood }
  | { type: "start"; id: string }
  | { type: "complete"; id: string }
  | { type: "cancel"; id: string }
  | { type: "exercise"; id: string; answer: number }
  | { type: "preferences"; preferences: Preferences };

function derived(progress: Progress): Progress {
  const focuses = progress.focus_sessions.filter(
    (item) => item.status === "completed",
  ).length;
  const exercises = progress.completed_exercises.length;
  const checkIns = progress.check_ins.length;
  const missionData = [
    {
      id: "focus-first",
      title: "Một khoảng trời tập trung",
      description: "Hoàn thành một phiên tập trung 20 phút.",
      target: 1,
      progress: Math.min(focuses, 1),
      reward_xp: 50,
    },
    {
      id: "exercise-first",
      title: "Khám phá một điều mới",
      description: "Trả lời đúng một bài luyện tập.",
      target: 1,
      progress: Math.min(exercises, 1),
      reward_xp: 30,
    },
    {
      id: "checkin-first",
      title: "Lắng nghe chính mình",
      description: "Chia sẻ cảm xúc của bạn hôm nay.",
      target: 1,
      progress: Math.min(checkIns, 1),
      reward_xp: 10,
    },
  ];
  return {
    ...progress,
    profile: {
      ...progress.profile,
      level: Math.floor(progress.profile.total_xp / 100) + 1,
    },
    missions: missionData.map((mission) => ({
      ...mission,
      completed: mission.progress >= mission.target,
    })),
    achievements: [
      {
        id: "first-step",
        title: "Bước đầu tiên",
        description: "Hoàn thành lần điểm danh đầu tiên.",
        earned: checkIns >= 1,
      },
      {
        id: "deep-focus",
        title: "Tập trung hết mình",
        description: "Hoàn thành một phiên tập trung 20 phút.",
        earned: focuses >= 1,
      },
      {
        id: "curious-mind",
        title: "Nhà khám phá",
        description: "Giải đúng cả ba bài luyện tập.",
        earned: exercises >= 3,
      },
      {
        id: "growing-star",
        title: "Ngôi sao đang lớn",
        description: "Tích lũy 100 điểm kinh nghiệm.",
        earned: progress.profile.total_xp >= 100,
      },
    ],
    counts: { focus: focuses, exercise: exercises, checkin: checkIns },
  };
}

export function createDemoProgress(): Progress {
  return derived({
    profile: {
      display_name: "Mầm Nhỏ",
      companion: "fox",
      color: "mint",
      buddy_name: "",
      accessory: "none",
      scene: "garden",
      total_xp: 0,
      level: 1,
    },
    focus_sessions: [],
    completed_exercises: [],
    check_ins: [],
    achievements: [],
    missions: [],
  });
}

export function readDemoProgress(storage?: Pick<Storage, "getItem">): Progress {
  try {
    const stored = (storage || localStorage).getItem(DEMO_STORAGE_KEY);
    if (!stored) return createDemoProgress();
    const data = JSON.parse(stored) as Progress;
    if (
      !data ||
      !data.profile ||
      !Array.isArray(data.focus_sessions) ||
      !Array.isArray(data.completed_exercises) ||
      !Array.isArray(data.check_ins)
    )
      return createDemoProgress();
    const profile = data.profile;
    if (
      !COMPANIONS.some((c) => c.id === profile.companion) ||
      !COLORS.some((c) => c.id === profile.color) ||
      typeof profile.display_name !== "string" ||
      !Number.isFinite(profile.total_xp) ||
      profile.total_xp < 0
    )
      return createDemoProgress();
    // Nâng cấp dữ liệu cũ tại chỗ; không mang theo tùy chọn bảng xếp hạng đã bỏ.
    data.profile = {
      display_name: profile.display_name,
      companion: profile.companion,
      color: profile.color,
      total_xp: Math.floor(profile.total_xp),
      level: Math.floor(profile.total_xp / 100) + 1,
      buddy_name:
        typeof profile.buddy_name === "string"
          ? profile.buddy_name
              .replace(/[\u0000-\u001f\u007f]/gu, "")
              .trim()
              .slice(0, 24)
          : "",
      accessory: ["none", "bow", "glasses", "crown"].includes(profile.accessory)
        ? profile.accessory
        : "none",
      scene: ["garden", "space", "sunset"].includes(profile.scene)
        ? profile.scene
        : "garden",
    };
    data.focus_sessions = data.focus_sessions.filter(
      (s) =>
        s &&
        typeof s.id === "string" &&
        ["active", "completed", "cancelled"].includes(s.status) &&
        Number.isFinite(Date.parse(s.started_at)) &&
        Number.isFinite(Date.parse(s.ends_at)),
    );
    data.completed_exercises = [
      ...new Set(
        data.completed_exercises.filter((id) =>
          EXERCISES.some((exercise) => exercise.id === id),
        ),
      ),
    ];
    data.check_ins = data.check_ins.filter(
      (c) =>
        c &&
        /^\d{4}-\d{2}-\d{2}$/.test(c.day) &&
        ["great", "okay", "tired"].includes(c.mood),
    );
    return derived(data);
  } catch {
    return createDemoProgress();
  }
}

export function demoReducer(
  previous: Progress,
  action: DemoAction,
  now = Date.now(),
): {
  progress: Progress;
  result:
    | RewardResult
    | AssessmentResult
    | FocusSession
    | { cancelled: boolean }
    | Profile;
} {
  const progress = structuredClone(previous);
  let xp = 0;
  let result:
    | RewardResult
    | AssessmentResult
    | FocusSession
    | { cancelled: boolean }
    | Profile
    | undefined;
  const nowISO = new Date(now).toISOString();
  if (action.type === "checkin") {
    const day = vietnamDay(now);
    if (!progress.check_ins.some((c) => c.day === day)) {
      progress.check_ins.unshift({
        day,
        mood: action.mood,
        created_at: nowISO,
      });
      xp = 10;
    }
  } else if (action.type === "start") {
    const active = progress.focus_sessions.find((s) => s.status === "active");
    if (active) result = active;
    else {
      const session: FocusSession = {
        id: action.id,
        started_at: nowISO,
        ends_at: new Date(now + FOCUS_DURATION_MS).toISOString(),
        status: "active",
      };
      progress.focus_sessions.unshift(session);
      result = session;
    }
  } else if (action.type === "complete") {
    const session = progress.focus_sessions.find((s) => s.id === action.id);
    if (!session) throw new Error("Không tìm thấy phiên tập trung này.");
    if (session.status === "cancelled")
      throw new Error("Phiên tập trung này đã kết thúc sớm.");
    if (session.status === "active") {
      if (now < Date.parse(session.ends_at))
        throw new Error(
          "Phiên tập trung chưa đủ 20 phút. Bạn cố gắng thêm một chút nhé.",
        );
      session.status = "completed";
      session.completed_at = nowISO;
      xp = 50;
    }
  } else if (action.type === "cancel") {
    const session = progress.focus_sessions.find((s) => s.id === action.id);
    if (session?.status === "active") {
      session.status = "cancelled";
      session.cancelled_at = nowISO;
    }
    result = { cancelled: true };
  } else if (action.type === "exercise") {
    const exercise = EXERCISES.find((e) => e.id === action.id);
    if (
      !exercise ||
      !Number.isInteger(action.answer) ||
      action.answer < 0 ||
      action.answer >= exercise.options.length
    )
      throw new Error("Bài luyện tập hoặc câu trả lời chưa hợp lệ.");
    const correct = exercise.answer === action.answer;
    if (correct && !progress.completed_exercises.includes(action.id)) {
      progress.completed_exercises.push(action.id);
      xp = exercise.reward;
    }
    result = { correct, awarded_xp: xp, explanation: exercise.explanation };
  } else if (action.type === "preferences") {
    const name = action.preferences.display_name.trim();
    if (
      name.length < 3 ||
      name.length > 24 ||
      /[\u0000-\u001f\u007f]/u.test(name)
    )
      throw new Error(
        "Biệt danh cần có từ 3 đến 24 ký tự và không chứa ký tự điều khiển.",
      );
    const preferences = action.preferences;
    const buddyName = preferences.buddy_name.trim();
    if (buddyName.length > 24 || /[\u0000-\u001f\u007f]/u.test(buddyName))
      throw new Error(
        "Tên bạn nhỏ cần tối đa 24 ký tự và không chứa ký tự điều khiển.",
      );
    if (
      !COMPANIONS.some((c) => c.id === preferences.companion) ||
      !COLORS.some((c) => c.id === preferences.color) ||
      !["none", "bow", "glasses", "crown"].includes(preferences.accessory) ||
      !["garden", "space", "sunset"].includes(preferences.scene)
    )
      throw new Error(
        "Bạn chọn nhân vật, màu sắc và phụ kiện trong danh sách nhé.",
      );
    progress.profile = {
      ...progress.profile,
      display_name: name,
      companion: preferences.companion,
      color: preferences.color,
      buddy_name: buddyName,
      accessory: preferences.accessory,
      scene: preferences.scene,
    };
    result = progress.profile;
  }
  progress.profile.total_xp += xp;
  const updated = derived(progress);
  return {
    progress: updated,
    result: result || {
      awarded_xp: xp,
      total_xp: updated.profile.total_xp,
      level: updated.profile.level,
    },
  };
}

/** Ngày theo giờ Việt Nam, không phụ thuộc múi giờ của thiết bị. */
export function vietnamDay(now: number | Date = Date.now()): string {
  return new Date(Number(now) + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Mọi tiến trình học tập ở thiết bị; tài khoản chỉ dùng xác thực cuộc gọi AI. */
export function useBuddy() {
  const [progress, setProgress] = useState<Progress>(() => readDemoProgress());
  const progressRef = useRef(progress);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const mode = session ? ("online" as const) : ("demo" as const);

  const update = useCallback((next: Progress) => {
    progressRef.current = next;
    if (mounted.current) setProgress(next);
  }, []);
  const refresh = useCallback(async () => {
    update(readDemoProgress());
  }, [update]);

  useEffect(() => {
    mounted.current = true;
    if (!supabase)
      return () => {
        mounted.current = false;
      };
    let cancelled = false;
    let receivedAuthEvent = false;
    void supabase.auth
      .getSession()
      .then(({ data, error: authError }) => {
        if (cancelled) return;
        if (authError)
          setError(
            "Chưa khôi phục được tài khoản AI. Tiến trình trên thiết bị vẫn được giữ nguyên.",
          );
        if (!receivedAuthEvent) setSession(data.session);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setError(
            "Chưa kết nối được tài khoản AI. Bạn vẫn có thể học và chơi cùng bạn nhỏ.",
          );
        }
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      if (cancelled) return;
      receivedAuthEvent = true;
      setSession(next);
      setLoading(false);
    });
    return () => {
      cancelled = true;
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === DEMO_STORAGE_KEY || event.key === null)
        update(readDemoProgress());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [update]);

  const mutate = useCallback(
    async (action: DemoAction) => {
      setError(null);
      try {
        const { progress: next, result } = demoReducer(
          progressRef.current,
          action,
        );
        try {
          localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
        } catch {
          setError(
            "Trình duyệt không cho lưu dữ liệu. Tiến trình chỉ được giữ trong lần mở này.",
          );
        }
        update(next);
        return result;
      } catch (reason) {
        const failure = friendlyError(
          reason,
          "Chưa lưu được thay đổi. Bạn thử lại nhé.",
        );
        if (mounted.current) setError(failure.message);
        throw failure;
      }
    },
    [update],
  );

  const checkIn = useCallback(
    (mood: Mood) => mutate({ type: "checkin", mood }) as Promise<RewardResult>,
    [mutate],
  );
  const startFocus = useCallback(
    () =>
      mutate({
        type: "start",
        id: crypto.randomUUID(),
      }) as Promise<FocusSession>,
    [mutate],
  );
  const completeFocus = useCallback(() => {
    const active = progressRef.current.focus_sessions.find(
      (s) => s.status === "active",
    );
    if (!active)
      return Promise.resolve({
        awarded_xp: 0,
        total_xp: progressRef.current.profile.total_xp,
        level: progressRef.current.profile.level,
      });
    return mutate({ type: "complete", id: active.id }) as Promise<RewardResult>;
  }, [mutate]);
  const cancelFocus = useCallback(() => {
    const active = progressRef.current.focus_sessions.find(
      (s) => s.status === "active",
    );
    if (!active) return Promise.resolve({ cancelled: true });
    return mutate({ type: "cancel", id: active.id }) as Promise<{
      cancelled: boolean;
    }>;
  }, [mutate]);
  const submitExercise = useCallback(
    (id: string, answer: number) =>
      mutate({ type: "exercise", id, answer }) as Promise<AssessmentResult>,
    [mutate],
  );
  const savePreferences = useCallback(
    (preferences: Preferences) =>
      mutate({ type: "preferences", preferences }) as Promise<Profile>,
    [mutate],
  );
  const signIn = useCallback(async (email: string) => {
    if (!supabase)
      throw new Error(
        "Đăng nhập AI chưa được cấu hình. Các hoạt động học tập vẫn dùng được trên thiết bị.",
      );
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      throw new Error("Bạn nhập một địa chỉ thư điện tử hợp lệ nhé.");
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: authRedirectUrl() },
    });
    if (authError)
      throw friendlyError(
        authError,
        "Chưa gửi được liên kết đăng nhập. Bạn kiểm tra địa chỉ hoặc thử lại sau nhé.",
      );
  }, []);
  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error: authError } = await supabase.auth.signOut();
    if (authError)
      throw friendlyError(authError, "Chưa đăng xuất được. Bạn thử lại nhé.");
    setSession(null);
  }, []);

  return {
    progress,
    mode,
    cloudConfigured,
    apiConfigured,
    loading,
    error,
    userEmail: session?.user.email || null,
    refresh,
    checkIn,
    startFocus,
    completeFocus,
    cancelFocus,
    submitExercise,
    savePreferences,
    signIn,
    signOut,
  };
}

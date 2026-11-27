export type RecommendationCategory = "focus" | "practice" | "balance";

export type RecommendationAction =
  | { type: "focus"; minutes: number; goal: string }
  | { type: "route"; to: string }
  | { type: "chat" };

export interface StudyRecommendation {
  id: string;
  category: RecommendationCategory;
  priority: number;
  kicker: string;
  title: string;
  reason: string;
  duration: string;
  actionLabel: string;
  action: RecommendationAction;
}

export interface RecommendationContext {
  todayMinutes: number;
  dayGoal: number;
  weekMinutes: number;
  weekGoal: number;
  weekTrend: "up" | "down" | "flat";
  completedExercises: number;
  totalExercises: number;
  habitsDone: number;
  totalHabits: number;
  mood?: "great" | "okay" | "tired";
  hasActiveSession: boolean;
  hour: number;
  english?: boolean;
}

export function buildStudyRecommendations(
  ctx: RecommendationContext,
): StudyRecommendation[] {
  const en = Boolean(ctx.english);
  const remainingToday = Math.max(0, ctx.dayGoal - ctx.todayMinutes);
  const items: StudyRecommendation[] = [];

  if (ctx.hasActiveSession) {
    items.push({
      id: "resume-focus",
      category: "focus",
      priority: 100,
      kicker: en ? "ACTIVE SESSION" : "PHIÊN ĐANG DIỄN RA",
      title: en
        ? "Return to your active focus timer"
        : "Quay lại phiên tập trung đang chạy",
      reason: en
        ? "Minimizing tab switches preserves working memory and keeps your study block intact."
        : "Hạn chế chuyển tab giúp giữ mạch tư duy liền mạch và hoàn tất trọn vẹn phiên học.",
      duration: en ? "In progress" : "Đang chạy",
      actionLabel: en ? "Open timer" : "Về đồng hồ",
      action: { type: "route", to: "/tap-trung" },
    });
  } else if (ctx.todayMinutes === 0) {
    const startMins = ctx.mood === "tired" ? 15 : 20;
    items.push({
      id: "first-focus-block",
      category: "focus",
      priority: ctx.mood === "tired" ? 86 : 98,
      kicker: en ? "DEEP FOCUS" : "KHỞI ĐỘNG NHỊP HỌC",
      title: en
        ? `Start a ${startMins}-minute distraction-free block`
        : `Mở phiên tập trung ${startMins} phút không xao nhãng`,
      reason:
        ctx.mood === "tired"
          ? en
            ? "A shorter 15-minute block lowers friction when energy is low."
            : "Khung 15 phút vừa đủ nhẹ để bắt đầu mà không tạo áp lực khi bạn đang hơi mệt."
          : en
            ? "One uninterrupted 20-minute session resets attention away from short-form scrolling."
            : "Một khung 20 phút trọn vẹn giúp não thoát khỏi nhịp lướt ngắn và vào trạng thái đọc sâu.",
      duration: en ? `${startMins} min` : `${startMins} phút`,
      actionLabel: en ? `Start ${startMins}m session` : `Mở phiên ${startMins} phút`,
      action: {
        type: "focus",
        minutes: startMins,
        goal: en ? "Deep study block" : "Tập trung học sâu",
      },
    });
  } else if (remainingToday > 0) {
    const sprint = remainingToday <= 15 ? 15 : remainingToday <= 25 ? 20 : 25;
    items.push({
      id: "finish-daily-goal",
      category: "focus",
      priority: 95,
      kicker: en ? "DAILY TARGET" : "HOÀN TẤT MỤC TIÊU NGÀY",
      title: en
        ? `${remainingToday} min left to reach your daily goal`
        : `Còn ${remainingToday} phút để chạm mốc hôm nay`,
      reason: en
        ? `You have logged ${ctx.todayMinutes}/${ctx.dayGoal} min today. One structured block closes the gap cleanly.`
        : `Bạn đã hoàn thành ${ctx.todayMinutes}/${ctx.dayGoal} phút hôm nay. Thêm một phiên gọn gàng là đạt chỉ tiêu.`,
      duration: en ? `${sprint} min` : `${sprint} phút`,
      actionLabel: en ? `Run ${sprint}m sprint` : `Học tiếp ${sprint} phút`,
      action: {
        type: "focus",
        minutes: sprint,
        goal: en ? "Complete daily target" : "Hoàn tất mục tiêu hôm nay",
      },
    });
  } else {
    items.push({
      id: "goal-met-reset",
      category: "balance",
      priority: 82,
      kicker: en ? "COGNITIVE RESET" : "NGHỈ NGƠI CÓ CHỦ ĐÍCH",
      title: en
        ? "Daily focus goal reached — take a 5-min reset"
        : "Đã đạt mục tiêu ngày — giải lao ngắn 5 phút",
      reason: en
        ? "Short reflex puzzles let your eyes and memory consolidate what you studied without passive scrolling."
        : "Một ván rèn phản xạ ngắn giúp mắt và trí nhớ thư giãn mà không bị cuốn vào mạng xã hội.",
      duration: en ? "5 min" : "5 phút",
      actionLabel: en ? "Open Game Hub" : "Vào góc trò chơi",
      action: { type: "route", to: "/tro-choi" },
    });
  }

  items.push({
    id: "ambient-audio",
    category: "balance",
    priority: ctx.mood === "tired" ? 96 : ctx.hour >= 20 ? 84 : 74,
    kicker: en ? "QUIET ENVIRONMENT" : "KHÔNG GIAN ÂM THANH",
    title: en
      ? "Turn on Library ambience to block background noise"
      : "Bật âm thanh thư viện để giảm tiếng ồn xung quanh",
    reason:
      ctx.mood === "tired"
        ? en
          ? "Gentle brown noise and rain help calm mental fatigue before reading."
          : "Tiếng mưa dịu hoặc không gian thư viện giúp làm dịu đầu óc trước khi mở sách."
        : en
          ? "Consistent ambient sound masks sudden notifications and stabilizes reading tempo."
          : "Âm nền ổn định giúp che tiếng ồn đột ngột và giữ nhịp đọc bài đều đặn hơn.",
    duration: en ? "Continuous" : "Phát nền",
    actionLabel: en ? "Open Music Studio" : "Mở góc âm nhạc",
    action: { type: "route", to: "/am-nhac" },
  });

  if (ctx.completedExercises < ctx.totalExercises) {
    const remainingEx = ctx.totalExercises - ctx.completedExercises;
    items.push({
      id: "active-recall-mission",
      category: "practice",
      priority: ctx.todayMinutes >= 15 ? 92 : 85,
      kicker: en ? "ACTIVE RECALL" : "ÔN LUYỆN CHỦ ĐỘNG",
      title: en
        ? `Complete 1 study exercise (${remainingEx} remaining)`
        : `Giải 1 bài luyện tập (${remainingEx} bài chưa làm)`,
      reason: en
        ? "Testing yourself right after reading improves retention far better than passive re-reading."
        : "Tự kiểm tra bằng câu hỏi ngắn giúp nhớ kiến thức sâu hơn nhiều so với chỉ đọc lướt lại vở.",
      duration: en ? "5–8 min" : "5–8 phút",
      actionLabel: en ? "Go to Exercises" : "Mở bài luyện tập",
      action: { type: "route", to: "/nhiem-vu" },
    });
  }

  items.push({
    id: "golden-20min-challenge",
    category: "focus",
    priority: ctx.weekTrend === "down" ? 94 : 79,
    kicker: en ? "WEEKLY MOMENTUM" : "THỬ THÁCH TẬP TRUNG",
    title:
      ctx.weekTrend === "down"
        ? en
          ? "Rebuild weekly pace with the 20-Min Golden Challenge"
          : "Lấy lại nhịp tuần với Thử thách 20 phút vàng"
        : en
          ? "Try a structured 20-Minute Golden Focus challenge"
          : "Tham gia bài tập 20 phút tập trung vàng",
    reason:
      ctx.weekTrend === "down"
        ? en
          ? `Weekly time (${ctx.weekMinutes}/${ctx.weekGoal} min) is trailing last week. One guided challenge restores momentum.`
          : `Thời gian tuần này (${ctx.weekMinutes}/${ctx.weekGoal} phút) đang chậm hơn tuần trước. Một phiên thử thách giúp kéo lại nhịp học.`
        : en
          ? "Combines deep reading, observation, and structured reflection without phone interruptions."
          : "Kết hợp đọc hiểu, quan sát và phản hồi có hệ thống trong đúng 20 phút không thông báo.",
    duration: en ? "20 min" : "20 phút",
    actionLabel: en ? "Open Challenge" : "Vào thử thách 20p",
    action: { type: "route", to: "/thu-thach" },
  });

  items.push({
    id: "ai-study-outline",
    category: "practice",
    priority: 81,
    kicker: en ? "GUIDED REASONING" : "HỖ TRỢ TƯ DUY",
    title: en
      ? "Ask AI Tutor to outline a difficult chapter"
      : "Nhờ Trợ lý AI tóm tắt dàn ý hoặc gợi ý bài khó",
    reason: en
      ? "Get step-by-step hints and structured summaries instead of searching across distracting feeds."
      : "Nhận gợi ý từng bước và dàn ý mạch lạc thay vì tìm kiếm lan man dễ bị phân tâm.",
    duration: en ? "3–5 min" : "3–5 phút",
    actionLabel: en ? "Open AI Tutor" : "Mở Trợ lý AI",
    action: { type: "chat" },
  });

  items.push({
    id: "digital-footprint-audit",
    category: "balance",
    priority: ctx.habitsDone < 2 ? 83 : 72,
    kicker: en ? "DIGITAL SELF-CHECK" : "CHỈ SỐ DẤU CHÂN SỐ",
    title: en
      ? "Review your 5-pillar Popcorn Brain Digital Footprint"
      : "Tự đánh giá 5 tiêu chí Dấu chân số tuần này",
    reason: en
      ? "Track attention span, distraction control, deep reading, persistence, and device autonomy."
      : "Theo dõi khả năng duy trì chú ý, kiểm soát xao nhãng, đọc sâu và mức độ tự chủ thiết bị.",
    duration: en ? "2 min" : "2 phút",
    actionLabel: en ? "View Progress" : "Mở bộ chỉ số",
    action: { type: "route", to: "/hanh-trinh" },
  });

  return items.sort((a, b) => b.priority - a.priority);
}

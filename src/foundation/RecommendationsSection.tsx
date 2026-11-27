import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Compass,
  Headphones,
  Sparkles,
} from "lucide-react";
import {
  buildStudyRecommendations,
  type RecommendationCategory,
  type RecommendationContext,
  type StudyRecommendation,
} from "./recommendations";
import { english as inEnglish } from "./language";

function categoryIcon(category: RecommendationCategory, id: string) {
  if (id === "ai-study-outline") return <Sparkles size={15} aria-hidden="true" />;
  if (id === "ambient-audio") return <Headphones size={15} aria-hidden="true" />;
  if (category === "focus") return <Clock3 size={15} aria-hidden="true" />;
  if (category === "practice") return <BookOpen size={15} aria-hidden="true" />;
  return <Compass size={15} aria-hidden="true" />;
}

export default function RecommendationsSection({
  context,
  onSelect,
}: {
  context: RecommendationContext;
  onSelect: (item: StudyRecommendation) => void;
}) {
  const [filter, setFilter] = useState<"all" | RecommendationCategory>("all");

  const allItems = useMemo(
    () => buildStudyRecommendations({ ...context, english: inEnglish }),
    [
      context.todayMinutes,
      context.dayGoal,
      context.weekMinutes,
      context.weekGoal,
      context.weekTrend,
      context.completedExercises,
      context.totalExercises,
      context.habitsDone,
      context.totalHabits,
      context.mood,
      context.hasActiveSession,
      context.hour,
    ],
  );

  const visibleItems = useMemo(() => {
    const filtered =
      filter === "all"
        ? allItems
        : allItems.filter((item) => item.category === filter);
    return filtered.slice(0, 3);
  }, [allItems, filter]);

  return (
    <section
      className="rec-section"
      aria-label={inEnglish ? "Study recommendations" : "Đề xuất học tập hôm nay"}
    >
      <div className="rec-header">
        <div>
          <span className="section-kicker">
            {inEnglish ? "TAILORED TO YOUR PACE" : "ĐỀ XUẤT THEO TIẾN ĐỘ CỦA BẠN"}
          </span>
          <h2>{inEnglish ? "Recommended next steps" : "Gợi ý trọng tâm hôm nay"}</h2>
        </div>
        <div
          className="rec-filters"
          role="group"
          aria-label={inEnglish ? "Filter recommendations" : "Lọc gợi ý học tập"}
        >
          {(
            [
              ["all", inEnglish ? "All" : "Tất cả"],
              ["focus", inEnglish ? "Focus" : "Tập trung"],
              ["practice", inEnglish ? "Practice" : "Ôn luyện"],
              ["balance", inEnglish ? "Balance" : "Cân bằng"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`rec-filter-btn${filter === id ? " active" : ""}`}
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rec-grid">
        {visibleItems.map((item, idx) => (
          <article
            key={item.id}
            className={`rec-card${idx === 0 && filter === "all" ? " rec-card-lead" : ""}`}
          >
            <div className="rec-card-meta">
              <span className="rec-card-kicker">
                {categoryIcon(item.category, item.id)}
                <span>{item.kicker}</span>
              </span>
              <span className="rec-card-duration">{item.duration}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.reason}</p>
            <div className="rec-card-foot">
              <button
                type="button"
                className="rec-action-btn"
                onClick={() => onSelect(item)}
              >
                <span>{item.actionLabel}</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

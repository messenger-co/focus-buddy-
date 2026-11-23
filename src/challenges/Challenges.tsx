import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { CHALLENGES, type FocusChallenge } from "./challenges";
import "./challenges.css";

const STORAGE_KEY = "focus-buddy-golden-challenge-v1";
const SCORES_KEY = "focus-buddy-golden-scores-v1";
const DURATION_MS = 20 * 60 * 1000;
type ChallengeRun = {
  id: string;
  startedAt: number;
  pausedAt?: number | null;
  pausedMs?: number;
  phase: "writing" | "review";
  answers: string[];
  marks: number[];
  focusRating: number;
};
type ScoreMap = Record<string, { best: number; attempts: number }>;

function loadScores(): ScoreMap {
  try {
    const raw = JSON.parse(localStorage.getItem(SCORES_KEY) || "{}");
    if (!raw || typeof raw !== "object") return {};
    const out: ScoreMap = {};
    for (const [k, v] of Object.entries(raw)) {
      if (
        CHALLENGES.some((c) => c.id === k) &&
        v &&
        typeof v === "object" &&
        typeof (v as { best?: unknown }).best === "number"
      ) {
        const entry = v as { best: number; attempts?: number };
        out[k] = {
          best: Math.max(0, Math.min(10, Math.round(entry.best))),
          attempts: Math.max(1, Math.round(entry.attempts ?? 1)),
        };
      }
    }
    return out;
  } catch {
    return {};
  }
}

function saveScore(id: string, score: number): ScoreMap {
  const scores = loadScores();
  const prev = scores[id];
  scores[id] = {
    best: prev ? Math.max(prev.best, score) : score,
    attempts: (prev?.attempts ?? 0) + 1,
  };
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
  } catch {
    /* Lưu cục bộ có thể bị tắt. */
  }
  return scores;
}

function loadRun(): ChallengeRun | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored: unknown = JSON.parse(raw);
    if (!stored || typeof stored !== "object") return null;
    const data = stored as Partial<ChallengeRun>;
    if (
      !CHALLENGES.some((challenge) => challenge.id === data.id) ||
      typeof data.startedAt !== "number" ||
      !Number.isFinite(data.startedAt) ||
      !Array.isArray(data.answers) ||
      !Array.isArray(data.marks) ||
      !["writing", "review"].includes(data.phase || "")
    )
      return null;
    return {
      id: data.id!,
      startedAt: data.startedAt!,
      pausedAt:
        typeof data.pausedAt === "number" && Number.isFinite(data.pausedAt)
          ? data.pausedAt
          : null,
      pausedMs:
        typeof data.pausedMs === "number" && data.pausedMs >= 0
          ? data.pausedMs
          : 0,
      phase: data.phase!,
      answers: data.answers
        .slice(0, 5)
        .map((answer) => (typeof answer === "string" ? answer.slice(0, 1800) : "")),
      marks: data.marks
        .slice(0, 5)
        .map((mark) => (mark === 1 || mark === 2 ? mark : 0)),
      focusRating:
        typeof data.focusRating === "number" &&
        data.focusRating >= 1 &&
        data.focusRating <= 5
          ? data.focusRating
          : 0,
    };
  } catch {
    return null;
  }
}

const timerText = (ms: number) => {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};

const wordCount = (text: string) =>
  text.trim() ? text.trim().split(/\s+/).length : 0;

function ChallengeForm({
  challenge,
  run,
  now,
  update,
  togglePause,
  finish,
  leave,
}: {
  challenge: FocusChallenge;
  run: ChallengeRun;
  now: number;
  update: (patch: Partial<ChallengeRun>) => void;
  togglePause: () => void;
  finish: () => void;
  leave: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const paused = Boolean(run.pausedAt);
  const effectiveNow = run.pausedAt ?? now;
  const elapsed = Math.max(0, effectiveNow - run.startedAt - (run.pausedMs ?? 0));
  const left = Math.max(0, DURATION_MS - elapsed);
  const reviewing = run.phase === "review";
  const total = run.marks.reduce((sum, value) => sum + value, 0);
  const answeredCount = run.answers.filter((a) => a.trim().length > 0).length;

  const copySummary = () => {
    const lines = [
      `20 PHÚT TẬP TRUNG VÀNG: ${challenge.title}`,
      `Chủ đề: ${challenge.topic}`,
      `Tự đánh giá: ${total}/10 điểm`,
      "",
      ...challenge.questions.map(
        (q, i) =>
          `Câu ${i + 1}: ${q.prompt}\nTrả lời: ${run.answers[i]?.trim() || "(chưa viết)"}\nĐiểm tự chấm: ${run.marks[i] || 0}/2`,
      ),
    ].join("\n\n");
    void navigator.clipboard
      ?.writeText(lines)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => {});
  };

  return (
    <div className="golden-challenge">
      <button className="golden-back" type="button" onClick={leave}>
        <ArrowLeft size={17} /> Chọn thử thách khác
      </button>
      <header className="golden-header">
        <span className="golden-kicker">20 PHÚT TẬP TRUNG VÀNG</span>
        <h1>{challenge.title}</h1>
        <p>{challenge.topic}</p>
        <div className="golden-clock-bar">
          <div
            className="golden-clock"
            role="timer"
            aria-label={`Thời gian còn lại ${timerText(left)}`}
          >
            <Clock3 size={20} />{" "}
            {reviewing
              ? "Đã hoàn thành"
              : paused
                ? `${timerText(left)} · Tạm dừng`
                : timerText(left)}
          </div>
          {!reviewing && left > 0 && (
            <button
              type="button"
              className="button secondary"
              onClick={togglePause}
            >
              {paused ? <Play size={15} /> : <Pause size={15} />}
              {paused ? "Tiếp tục" : "Tạm dừng"}
            </button>
          )}
          <span className="golden-progress-meta">
            Đã viết {answeredCount}/5 câu
          </span>
        </div>
      </header>
      <section className="golden-scenario">
        <h2>
          <BookOpen size={20} /> Tình huống
        </h2>
        <p>{challenge.scenario}</p>
      </section>
      {reviewing && (
        <section className="golden-result" aria-live="polite">
          <Sparkles size={25} />
          <div>
            <h2>Tự đánh giá theo tiêu chí: {total}/10 điểm</h2>
            <p>
              Đọc từng tiêu chí bên dưới rồi tự chọn 0, 1 hoặc 2 điểm. Đây là điểm
              tự đánh giá, không phải điểm do AI chấm.
            </p>
          </div>
        </section>
      )}
      <div className="golden-question-list">
        {challenge.questions.map((question, index) => {
          const text = run.answers[index] || "";
          return (
            <section className="golden-question" key={index}>
              <div className="golden-question-heading">
                <span>Câu {index + 1}</span>
                <small>
                  {wordCount(text)} từ · Tối đa 2 điểm
                </small>
              </div>
              <h3>{question.prompt}</h3>
              <label
                className="golden-answer-label"
                htmlFor={`golden-answer-${index}`}
              >
                Câu trả lời của em
              </label>
              <textarea
                id={`golden-answer-${index}`}
                rows={3}
                maxLength={1800}
                value={text}
                readOnly={reviewing}
                onChange={(event) => {
                  const answers = [...run.answers];
                  answers[index] = event.target.value;
                  update({ answers });
                }}
                placeholder="Viết câu trả lời bằng lời của em..."
              />
              {reviewing && (
                <div className="golden-rubric">
                  <p>
                    <CheckCircle2 size={17} />{" "}
                    <strong>Tiêu chí tham khảo:</strong> {question.rubric}
                  </p>
                  <div
                    className="golden-marks"
                    role="group"
                    aria-label={`Tự chấm câu ${index + 1}`}
                  >
                    {[0, 1, 2].map((mark) => (
                      <button
                        type="button"
                        aria-pressed={(run.marks[index] || 0) === mark}
                        key={mark}
                        onClick={() => {
                          const marks = [...run.marks];
                          marks[index] = mark;
                          update({ marks });
                        }}
                      >
                        {mark} điểm
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
      {!reviewing ? (
        <div className="golden-actions">
          <p>
            {left === 0
              ? "Đã hết 20 phút. Em có thể xem tiêu chí đánh giá."
              : "Hãy làm độc lập. Tiến độ và đồng hồ vẫn được lưu nếu tải lại trang."}
          </p>
          <button className="button primary" type="button" onClick={finish}>
            <CheckCircle2 size={17} />{" "}
            {left === 0
              ? "Xem tiêu chí và tự đánh giá"
              : "Nộp bài sớm và tự đánh giá"}
          </button>
        </div>
      ) : (
        <div className="golden-reflection">
          <h2>Nhìn lại cách em tập trung</h2>
          <p>Em tự đánh giá mức độ tập trung của mình trong thử thách này:</p>
          <div
            className="golden-marks"
            role="group"
            aria-label="Tự đánh giá mức tập trung"
          >
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                aria-pressed={run.focusRating === rating}
                onClick={() => update({ focusRating: rating })}
              >
                {rating}/5
              </button>
            ))}
          </div>
          <p className="golden-small">
            Không cần trả lời giống hệt mẫu. Điều quan trọng là hiểu vấn đề và
            biết ứng dụng vào thực tế.
          </p>
          <div className="golden-reflection-actions">
            <button
              className="button secondary"
              type="button"
              onClick={copySummary}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Đã sao chép bài làm" : "Sao chép bài làm"}
            </button>
            <button className="button primary" type="button" onClick={leave}>
              <RotateCcw size={16} /> Chọn thử thách mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Challenges() {
  const [run, setRun] = useState<ChallengeRun | null>(loadRun);
  const [scores, setScores] = useState<ScoreMap>(loadScores);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    try {
      if (run) localStorage.setItem(STORAGE_KEY, JSON.stringify(run));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Lưu cục bộ có thể bị tắt. */
    }
  }, [run]);
  useEffect(() => {
    if (!run || run.phase !== "writing" || run.pausedAt) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [run?.id, run?.phase, run?.pausedAt]);
  const challenge = useMemo(
    () => CHALLENGES.find((item) => item.id === run?.id),
    [run?.id],
  );
  const leaveRun = () => {
    if (run && run.phase === "review") {
      const total = run.marks.reduce((sum, v) => sum + v, 0);
      setScores(saveScore(run.id, total));
    }
    setRun(null);
  };
  if (run && challenge) {
    return (
      <ChallengeForm
        challenge={challenge}
        run={run}
        now={now}
        update={(patch) =>
          setRun((current) => (current ? { ...current, ...patch } : current))
        }
        togglePause={() => {
          const ts = Date.now();
          setNow(ts);
          setRun((current) => {
            if (!current || current.phase !== "writing") return current;
            if (current.pausedAt) {
              return {
                ...current,
                pausedMs:
                  (current.pausedMs ?? 0) + Math.max(0, ts - current.pausedAt),
                pausedAt: null,
              };
            }
            return { ...current, pausedAt: ts };
          });
        }}
        finish={() =>
          setRun((current) =>
            current ? { ...current, phase: "review", pausedAt: null } : current,
          )
        }
        leave={leaveRun}
      />
    );
  }
  const completedCount = Object.keys(scores).length;
  return (
    <div className="golden-challenge">
      <header className="golden-header">
        <span className="golden-kicker">CHINH PHỤC TỪNG BƯỚC</span>
        <h1>20 phút tập trung vàng</h1>
        <p>
          Năm thử thách liên môn cho học sinh lớp 6–9, dựa trên bộ câu hỏi của
          dự án.
        </p>
      </header>
      <div className="golden-intro">
        <Clock3 size={22} />
        <span>
          Chọn một tình huống, trả lời 5 câu trong 20 phút và tự đánh giá theo
          thang 10 điểm. Không cần AI hoặc tài khoản.
          {completedCount > 0 && ` · Đã hoàn thành ${completedCount}/${CHALLENGES.length} thử thách.`}
        </span>
      </div>
      <div className="golden-cards">
        {CHALLENGES.map((item, index) => {
          const record = scores[item.id];
          return (
            <article className="golden-card" key={item.id}>
              <div className="golden-card-top">
                <span className="golden-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {record && (
                  <span className="golden-best-badge">
                    <Award size={14} /> {record.best}/10 điểm
                  </span>
                )}
              </div>
              <small>{item.topic}</small>
              <h2>{item.title}</h2>
              <p>{item.scenario}</p>
              <button
                className="button primary"
                onClick={() => {
                  const ts = Date.now();
                  setNow(ts);
                  setRun({
                    id: item.id,
                    startedAt: ts,
                    pausedAt: null,
                    pausedMs: 0,
                    phase: "writing",
                    answers: ["", "", "", "", ""],
                    marks: [0, 0, 0, 0, 0],
                    focusRating: 0,
                  });
                }}
                type="button"
              >
                {record ? "Luyện lại thử thách" : "Bắt đầu thử thách"}
              </button>
            </article>
          );
        })}
      </div>
      <p className="golden-small">
        Các câu trả lời lưu trong trình duyệt đang sử dụng; không đồng bộ lên
        máy chủ. Hãy lưu ý khi dùng thiết bị chung.
      </p>
    </div>
  );
}

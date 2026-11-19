import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle2, Clock3, RotateCcw, Sparkles } from "lucide-react";
import { CHALLENGES, type FocusChallenge } from "./challenges";
import "./challenges.css";

const STORAGE_KEY = "focus-buddy-golden-challenge-v1";
const DURATION_MS = 20 * 60 * 1000;
type ChallengeRun = {
  id: string;
  startedAt: number;
  phase: "writing" | "review";
  answers: string[];
  marks: number[];
  focusRating: number;
};
function loadRun(): ChallengeRun | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored: unknown = JSON.parse(raw);
    if (!stored || typeof stored !== "object") return null;
    const data = stored as Partial<ChallengeRun>;
    if (!CHALLENGES.some((challenge) => challenge.id === data.id) ||
        (typeof data.startedAt !== "number" || !Number.isFinite(data.startedAt)) || !Array.isArray(data.answers) ||
        !Array.isArray(data.marks) || !["writing", "review"].includes(data.phase || "")) return null;
    return {
      id: data.id!,
      startedAt: data.startedAt!,
      phase: data.phase!,
      answers: data.answers.slice(0, 5).map((answer) => typeof answer === "string" ? answer.slice(0, 1800) : ""),
      marks: data.marks.slice(0, 5).map((mark) => mark === 1 || mark === 2 ? mark : 0),
      focusRating: typeof data.focusRating === "number" && data.focusRating >= 1 && data.focusRating <= 5 ? data.focusRating : 0
    };
  } catch {
    return null;
  }
}
const timerText = (ms: number) => {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};
function ChallengeForm({
  challenge, run, now, update, finish, leave
}: {
  challenge: FocusChallenge;
  run: ChallengeRun;
  now: number;
  update: (patch: Partial<ChallengeRun>) => void;
  finish: () => void;
  leave: () => void;
}) {
  const left = Math.max(0, run.startedAt + DURATION_MS - now);
  const reviewing = run.phase === "review";
  const total = run.marks.reduce((sum, value) => sum + value, 0);
  return (
    <div className="golden-challenge">
      <button className="golden-back" type="button" onClick={leave}>
        <ArrowLeft size={17}/> Chọn thử thách khác
      </button>
      <header className="golden-header">
        <span className="golden-kicker">20 PHÚT TẬP TRUNG VÀNG</span>
        <h1>{challenge.title}</h1>
        <p>{challenge.topic}</p>
        <div className="golden-clock" role="timer" aria-label={`Thời gian còn lại ${timerText(left)}`}>
          <Clock3 size={20}/> {reviewing ? "Đã hoàn thành" : timerText(left)}
        </div>
      </header>
      <section className="golden-scenario">
        <h2><BookOpen size={20}/> Tình huống</h2>
        <p>{challenge.scenario}</p>
      </section>
      {reviewing && (
        <section className="golden-result" aria-live="polite">
          <Sparkles size={25}/>
          <div>
            <h2>Tự đánh giá theo tiêu chí: {total}/10 điểm</h2>
            <p>Đọc từng tiêu chí bên dưới rồi tự chọn 0, 1 hoặc 2 điểm. Đây là điểm tự đánh giá, không phải điểm do AI chấm.</p>
          </div>
        </section>
      )}
      <div className="golden-question-list">
        {challenge.questions.map((question, index) => (
          <section className="golden-question" key={index}>
            <div className="golden-question-heading"><span>Câu {index + 1}</span><small>Tối đa 2 điểm</small></div>
            <h3>{question.prompt}</h3>
            <label className="golden-answer-label" htmlFor={`golden-answer-${index}`}>Câu trả lời của em</label>
            <textarea
              id={`golden-answer-${index}`}
              rows={3}
              maxLength={1800}
              value={run.answers[index] || ""}
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
                <p><CheckCircle2 size={17}/> <strong>Tiêu chí tham khảo:</strong> {question.rubric}</p>
                <div className="golden-marks" role="group" aria-label={`Tự chấm câu ${index + 1}`}>
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
                    >{mark} điểm</button>
                  ))}
                </div>
              </div>
            )}
          </section>
        ))}
      </div>
      {!reviewing ? (
        <div className="golden-actions">
          <p>{left === 0 ? "Đã hết 20 phút. Em có thể xem tiêu chí đánh giá." : "Hãy làm độc lập. Tiến độ và đồng hồ vẫn được lưu nếu tải lại trang."}</p>
          <button className="button primary" type="button" onClick={finish}>
            <CheckCircle2 size={17}/> {left === 0 ? "Xem tiêu chí và tự đánh giá" : "Nộp bài sớm và tự đánh giá"}
          </button>
        </div>
      ) : (
        <div className="golden-reflection">
          <h2>Nhìn lại cách em tập trung</h2>
          <p>Em tự đánh giá mức độ tập trung của mình trong thử thách này:</p>
          <div className="golden-marks" role="group" aria-label="Tự đánh giá mức tập trung">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button key={rating} type="button" aria-pressed={run.focusRating === rating}
                onClick={() => update({ focusRating: rating })}>{rating}/5</button>
            ))}
          </div>
          <p className="golden-small">Không cần trả lời giống hệt mẫu. Điều quan trọng là hiểu vấn đề và biết ứng dụng vào thực tế.</p>
          <button className="button secondary" type="button" onClick={leave}><RotateCcw size={16}/> Chọn thử thách mới</button>
        </div>
      )}
    </div>
  );
}
export default function Challenges() {
  const [run, setRun] = useState<ChallengeRun | null>(loadRun);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    try {
      if (run) localStorage.setItem(STORAGE_KEY, JSON.stringify(run));
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* Lưu cục bộ có thể bị tắt. */ }
  }, [run]);
  useEffect(() => {
    if (!run || run.phase !== "writing") return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [run?.id, run?.phase]);
  const challenge = useMemo(() => CHALLENGES.find((item) => item.id === run?.id), [run?.id]);
  if (run && challenge) {
    return <ChallengeForm
      challenge={challenge} run={run} now={now}
      update={(patch) => setRun((current) => current ? { ...current, ...patch } : current)}
      finish={() => setRun((current) => current ? { ...current, phase: "review" } : current)}
      leave={() => setRun(null)}
    />;
  }
  return (
    <div className="golden-challenge">
      <header className="golden-header">
        <span className="golden-kicker">CHINH PHỤC TỪNG BƯỚC</span>
        <h1>20 phút tập trung vàng</h1>
        <p>Năm thử thách liên môn cho học sinh lớp 6–9, dựa trên bộ câu hỏi của dự án.</p>
      </header>
      <div className="golden-intro">
        <Clock3 size={22}/>
        <span>Chọn một tình huống, trả lời 5 câu trong 20 phút và tự đánh giá theo thang 10 điểm. Không cần AI hoặc tài khoản.</span>
      </div>
      <div className="golden-cards">
        {CHALLENGES.map((item, index) => (
          <article className="golden-card" key={item.id}>
            <span className="golden-index">{String(index + 1).padStart(2, "0")}</span>
            <small>{item.topic}</small>
            <h2>{item.title}</h2>
            <p>{item.scenario}</p>
            <button className="button primary" onClick={() => {
              setNow(Date.now());
              setRun({
                id: item.id, startedAt: Date.now(), phase: "writing",
                answers: ["", "", "", "", ""], marks: [0, 0, 0, 0, 0], focusRating: 0
              });
            }} type="button">Bắt đầu thử thách</button>
          </article>
        ))}
      </div>
      <p className="golden-small">Các câu trả lời lưu trong trình duyệt đang sử dụng; không đồng bộ lên máy chủ. Hãy lưu ý khi dùng thiết bị chung.</p>
    </div>
  );
}

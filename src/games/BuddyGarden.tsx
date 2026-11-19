import { useEffect, useState } from "react";
import { ArrowRight, Clock3, Flower2, Leaf, RotateCcw, Sparkles, Star } from "lucide-react";
import { Link } from "react-router-dom";
import Companion from "../components/Companion";
import type { Profile } from "../state";
import "./buddy-garden.css";

const TOTAL = 10;
const DURATION = 60_000;
type Phase = "ready" | "playing" | "won" | "finished";
const choose = (previous: number) => {
  const next = Math.floor(Math.random() * 8);
  return next >= previous ? next + 1 : next;
};
export default function BuddyGarden({ profile }: { profile: Profile }) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [target, setTarget] = useState(() => Math.floor(Math.random() * 9));
  const [score, setScore] = useState(0);
  const [endsAt, setEndsAt] = useState(0);
  const [remaining, setRemaining] = useState(DURATION);
  const [feedback, setFeedback] = useState("Buddy đã chuẩn bị một vườn hoa thật xinh.");
  useEffect(() => {
    if (phase !== "playing") return;
    const tick = () => {
      const next = Math.max(0, endsAt - Date.now());
      setRemaining(next);
      if (next === 0) setPhase("finished");
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [phase, endsAt]);
  function start() {
    setTarget(Math.floor(Math.random() * 9));
    setScore(0);
    setRemaining(DURATION);
    setEndsAt(Date.now() + DURATION);
    setFeedback("Nhìn xem bông hoa phát sáng đang ở ô nào nhé!");
    setPhase("playing");
  }
  function collect(index: number) {
    if (phase !== "playing" || index !== target) return;
    const updated = score + 1;
    setScore(updated);
    if (updated >= TOTAL) {
      setPhase("won");
      setFeedback("Bạn và Buddy đã làm khu vườn nở hoa!");
    } else {
      setTarget(choose(target));
      setFeedback(updated % 3 === 0 ? "Tuyệt lắm! Buddy đang cổ vũ bạn." : "Đúng rồi! Tìm bông hoa tiếp theo nhé.");
    }
  }
  const seconds = Math.ceil(remaining / 1000);
  return (
    <div className="garden-play">
      <header className="garden-heading">
        <span><Flower2 size={18}/> TRÒ CHƠI CÙNG BUDDY</span>
        <h1>Vườn hoa lấp lánh</h1>
        <p>Một trò chơi quan sát ngắn trong giờ nghỉ. Tìm 10 bông hoa phát sáng trước khi hết một phút.</p>
      </header>
      <section className="garden-panel">
        <div className="garden-status">
          <span><Star size={17}/> {score}/{TOTAL} bông hoa</span>
          <span><Clock3 size={17}/> {seconds} giây</span>
        </div>
        <div className="garden-buddy">
          <Companion kind={profile.companion} color={profile.color} accessory={profile.accessory}
            paused={phase !== "won"} reaction={phase === "won" ? "happy" : "wave"} size={145}/>
          <div className="garden-buddy-bubble" role="status">{feedback}</div>
        </div>
        {phase === "ready" ? (
          <div className="garden-overlay">
            <Flower2 size={48}/>
            <h2>Sẵn sàng chăm vườn?</h2>
            <p>Chỉ cần chạm vào ô có bông hoa vàng. Không có điểm phạt khi chọn nhầm.</p>
            <button className="button primary" onClick={start}>Bắt đầu chơi</button>
          </div>
        ) : phase === "won" || phase === "finished" ? (
          <div className="garden-overlay" role="status">
            {phase === "won" ? <Sparkles size={49}/> : <Leaf size={49}/>}
            <h2>{phase === "won" ? "Khu vườn rực rỡ!" : "Đã hết một phút"}</h2>
            <p>{phase === "won" ? "Buddy rất vui vì hai bạn cùng hoàn thành thử thách." : `Bạn đã tìm được ${score} bông hoa. Cảm ơn bạn đã chăm vườn cùng Buddy!`}</p>
            <div className="garden-actions">
              <button className="button primary" onClick={start}><RotateCcw size={16}/> Chơi lại</button>
              <Link className="button secondary" to="/tap-trung">Quay lại tập trung <ArrowRight size={15}/></Link>
            </div>
          </div>
        ) : (
          <div className="garden-plots" role="group" aria-label="Chọn bông hoa phát sáng">
            {Array.from({ length: 9 }, (_, index) => (
              <button className={index === target ? "garden-plot golden" : "garden-plot"}
                key={index} aria-label={index === target ? `Ô ${index + 1}, bông hoa phát sáng` : `Ô ${index + 1}, lá xanh`}
                onClick={() => collect(index)}>
                {index === target ? <Flower2 size={37}/> : <Leaf size={31}/>}
              </button>
            ))}
          </div>
        )}
        <div className="garden-footer"><span>Chơi vui trong giờ nghỉ, rồi trở lại nhiệm vụ học tập nhé.</span><Link to="/tro-choi">Các trò chơi khác <ArrowRight size={15}/></Link></div>
      </section>
    </div>
  );
}

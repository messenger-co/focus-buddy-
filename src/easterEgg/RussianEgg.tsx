import { useEffect, useRef, useState } from "react";
import { Phone, PhoneIncoming, RefreshCw, Volume2, VolumeX, X } from "lucide-react";
import Companion from "../components/Companion";
import type { Profile } from "../state";
import { callerImageUrl, trackUrl } from "./russianShortcut";
import "./russianEgg.css";

type Stage = "party" | "incoming" | "answered" | "glitch" | "crashed";
type SoundState = "loading" | "playing" | "manual" | "missing";

export default function RussianEgg({ profile, close }: { profile: Profile; close: () => void }) {
  const [stage, setStage] = useState<Stage>("party");
  const [sips, setSips] = useState(0);
  const [sipping, setSipping] = useState(false);
  const [sound, setSound] = useState<SoundState>("loading");
  const [pictureFailed, setPictureFailed] = useState(false);
  const [seconds, setSeconds] = useState(6);
  const soundRef = useRef<HTMLAudioElement>(null);
  const sipLock = useRef(false);
  const voiceOnce = useRef(false);
  const sipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answered = useRef(false);
  const sleeping = sips >= 10;

  const playMusic = () => {
    const audio = soundRef.current;
    if (!audio || sound === "missing") return;
    void audio.play().then(() => setSound("playing")).catch(() => setSound("manual"));
  };

  useEffect(() => {
    const audio = soundRef.current;
    if (!audio) return;
    const ready = () => playMusic();
    const broken = () => setSound("missing");
    audio.addEventListener("canplay", ready);
    audio.addEventListener("error", broken);
    audio.load();
    return () => {
      audio.pause();
      audio.removeEventListener("canplay", ready);
      audio.removeEventListener("error", broken);
    };
    // Only run on initial mount, user must click play if autoplay is blocked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    if (sipTimer.current) clearTimeout(sipTimer.current);
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    if (stage !== "incoming") return;
    answered.current = false;
    const due = Date.now() + 6000;
    const timer = window.setInterval(() => {
      if (answered.current) return;
      const remaining = Math.max(0, due - Date.now());
      setSeconds(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        window.clearInterval(timer);
        setStage("glitch");
        soundRef.current?.pause();
      }
    }, 80);
    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "glitch") return;
    const timer = window.setTimeout(() => setStage("crashed"), 1200);
    return () => window.clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "answered") return;
    const timer = window.setTimeout(() => setStage("party"), 2400);
    return () => window.clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "incoming") return;
    function onAnswer(event: KeyboardEvent) {
      if (event.code !== "KeyC" || event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();
      answered.current = true;
      setStage("answered");
    }
    window.addEventListener("keydown", onAnswer, true);
    return () => window.removeEventListener("keydown", onAnswer, true);
  }, [stage]);

  function shoutRussian() {
    if (voiceOnce.current) return;
    voiceOnce.current = true;
    try {
      if (typeof SpeechSynthesisUtterance !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance("Эй, друг! Три полоски!");
        utterance.lang = "ru-RU";
        utterance.rate = 1.12;
        utterance.volume = 0.65;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // Animated Russian text remains available when speech is unsupported.
    }
  }

  function sip() {
    if (sleeping || sipLock.current || stage !== "party") return;
    sipLock.current = true;
    shoutRussian();
    setSipping(true);
    setSips((count) => count + 1);
    sipTimer.current = setTimeout(() => {
      sipLock.current = false;
      setSipping(false);
    }, 580);
  }

  function takeCall() {
    if (stage !== "incoming" || answered.current) return;
    answered.current = true;
    setStage("answered");
  }

  if (stage === "crashed") return (
    <div className="russian-fake-crash" role="alertdialog" aria-modal="true"
      aria-label="Màn hình lỗi giả lập trong Easter egg">
      <div className="crash-face" aria-hidden="true">:(</div>
      <h1>Aw, Snap!</h1>
      <p>Something went wrong while displaying this page.</p>
      <p className="crash-code">ERR_EASTER_EGG_OVERLOAD</p>
      <p className="crash-disclaimer">Đây là màn hình lỗi giả lập của trò chơi. Trang web và trình duyệt không bị hỏng.</p>
      <div className="crash-refresh"><RefreshCw size={18}/> Refresh the page to exit the Easter egg.</div>
    </div>
  );

  return (
    <section className={"russian-egg-overlay egg-stage-" + stage}
      role="dialog" aria-modal="true" aria-label="Easter egg: Три полоски">
      <audio ref={soundRef} src={trackUrl} preload="none" loop aria-label="Bản nhạc Easter egg trong GitHub" />
      <div className="russian-snow" aria-hidden="true">
        {Array.from({ length: 26 }, (_, i) => (
          <span key={i} style={{
            left: ((i * 43) % 100) + "%",
            animationDelay: (-i * .46) + "s",
            animationDuration: (6 + (i % 7)) + "s",
          }}>✻</span>
        ))}
      </div>
      {stage === "glitch" ? (
        <div className="russian-glitch" role="status">
          <strong>⚡ СБОЙ! ⚡</strong>
          <p>Warning: cartoon screen overload</p>
          <span>▓▒░ SYSTEM GLITCH ░▒▓</span>
        </div>
      ) : (
        <>
          <header className="russian-egg-header">
            <div className="russian-egg-label"><span className="russian-flag" aria-hidden="true"/> СЕКРЕТНЫЙ РЕЖИМ</div>
            <div className="russian-egg-top-actions">
              {sound === "manual" && (
                <button type="button" onClick={playMusic} className="russian-music-button">
                  <Volume2 size={16}/> Bật nhạc
                </button>
              )}
              {sound === "missing" && (
                <span className="russian-audio-warning"><VolumeX size={16}/> Không phát được tệp nhạc trong repo</span>
              )}
              {sound === "playing" && (
                <button type="button" className="russian-music-button" onClick={() => {
                  const audio = soundRef.current;
                  if (audio) { audio.pause(); setSound("manual"); }
                }}><VolumeX size={16}/> Tắt nhạc</button>
              )}
              <button className="russian-egg-close" type="button" onClick={close}
                title="Tắt Easter egg" aria-label="Tắt Easter egg"><X size={20}/></button>
            </div>
          </header>
          <div className="russian-egg-stage">
            <div className="russian-egg-story">
              <div className="russian-egg-stars">★ ★ ★</div>
              <h1 className="russian-wavy-title" aria-label="ТРИ ПОЛОСКИ!">
                {"ТРИ ПОЛОСКИ!".split("").map((char, i) => (
                  <span key={i} style={{ animationDelay: (i * .12) + "s" }} aria-hidden="true">
                    {char === " " ? "\u00a0" : char}
                  </span>
                ))}
              </h1>
              <p className="russian-egg-subtitle">CHẾ ĐỘ BA SỌC · BÍ MẬT ĐƯỢC MỞ</p>
              <div className="russian-shout-bubble" lang="ru">ЭЙ, ДРУГ! ТРИ ПОЛОСКИ!</div>
              <p className="russian-egg-desc">
                Buddy mặc áo thể thao ba sọc, mũ lưỡi trai và kính râm.
                Nhấn Buddy để nhấp một ngụm <strong>nước chanh không cồn</strong>.
                Sau 10 ngụm, Buddy ngủ một giấc thật vui.
              </p>
              <div className="russian-drink-tracker" aria-label={"Số ngụm: " + sips + " trên 10"}>
                {Array.from({ length: 10 }, (_, i) => (
                  <span key={i} className={i < sips ? "done" : ""} aria-hidden="true">★</span>
                ))}
              </div>
              <p className="russian-sip-counter" role="status">
                {sleeping ? "💤 СПОКОЙНОЙ НОЧИ! Buddy ngủ ngon!" :
                  sipping ? "🥤 ГЛОТОК! Một ngụm nước chanh!" :
                    "Nhấn Buddy để nhấp nước chanh · " + sips + "/10"}
              </p>
            </div>
            <div className="russian-character-stand">
              <div className="russian-spotlight" aria-hidden="true"/>
              <button type="button" onClick={sip} disabled={sleeping || sipping}
                aria-label={sleeping ? "Buddy đang ngủ" : "Chạm Buddy để nhấp một ngụm nước chanh"}
                className={"russian-buddy-button" + (sipping ? " sipping" : "") + (sleeping ? " sleeping" : "")}>
                <div className="russian-character">
                  <Companion kind={profile.companion} color={profile.color}
                    accessory="none" size={310} sleepy={sleeping}
                    activity={sleeping ? "sleeping" : "dancing"} reaction={sipping ? "snack" : "happy"}/>
                  <svg className="russian-outfit" viewBox="0 0 320 300" focusable="false" aria-hidden="true">
                    <defs>
                      <linearGradient id="rus-shirt" x1="0" x2="1" y1="0" y2="1">
                        <stop stopColor="#323c40"/><stop offset="1" stopColor="#161d21"/>
                      </linearGradient>
                      <linearGradient id="rus-bottle" x1="0" x2="0" y1="0" y2="1">
                        <stop stopColor="#e6f7eb" stopOpacity=".9"/>
                        <stop offset="1" stopColor="#72c3a7" stopOpacity=".8"/>
                      </linearGradient>
                    </defs>
                    <path d="M129 186Q160 199 190 186L211 205L199 221L197 245
                      Q160 261 121 245L119 221L108 207Q111 197 129 186Z"
                      fill="url(#rus-shirt)" stroke="#f0f1eb" strokeWidth="2.5"/>
                    {[0,1,2].map((i) => <path key={i}
                      d={"M" + (122+i*8) + " 198 l-10 20 M" + (190-i*8) + " 198 l10 20"}
                      fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round"/>)}
                    <text x="160" y="235" textAnchor="middle" fontSize="15" fontFamily="Arial,sans-serif"
                      fontWeight="900" fill="#ffffff">adidas</text>
                    <path d="M109 92Q114 44 165 51Q205 50 213 92Z" fill="#1b2327"
                      stroke="#f1f4f0" strokeWidth="2.5"/>
                    <path d="M110 91Q166 77 211 91Q232 93 233 103Q188 102 155 110Z"
                      fill="#171d21" stroke="#e7eeea" strokeWidth="2"/>
                    {[0,1,2].map((i) => <path key={i}
                      d={"M" + (145+i*11) + " 61 l-6 19"}
                      stroke="#fff" strokeWidth="4.5" strokeLinecap="round"/>)}
                    <path d="M104 132Q127 128 154 132L155 148Q135 161 111 148Z
                      M165 132Q189 128 215 132L209 148Q186 159 165 148Z"
                      fill="#1e3441dd" stroke="#101c23" strokeWidth="3"/>
                    <path d="M153 138Q160 133 165 138M104 137L95 134M215 137L226 134"
                      fill="none" stroke="#202b30" strokeWidth="3.5"/>
                    <path d="M211 191L232 186L236 220L218 221Z" fill="#e0b4a2"
                      stroke="#9c8274" strokeWidth="2"/>
                    <g className="russian-bottle">
                      <rect x="226" y="157" width="14" height="17" rx="2" fill="#a9d3c0"/>
                      <rect x="227" y="151" width="12" height="8" rx="2" fill="#c6bd8c"/>
                      <rect x="217" y="170" width="31" height="60" rx="8"
                        fill="url(#rus-bottle)" stroke="#b9e3d6" strokeWidth="3"/>
                      <path d="M221 202Q234 207 244 201V225Q235 231 221 224Z" fill="#ffe3a2c6"/>
                      <rect x="223" y="184" width="20" height="17" rx="3" fill="#f2f9f0"/>
                      <text x="233" y="194" textAnchor="middle" fontSize="6" fontWeight="900"
                        fill="#386552">SODA</text>
                      <path d="M221 178L222 215" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
                    </g>
                  </svg>
                </div>
              </button>
              <div className="russian-floor-shadow" aria-hidden="true"/>
            </div>
          </div>
          <footer className="russian-egg-bottom">
            <span>🇷🇺 CTRL + SHIFT + 5 · Easter egg · Refresh để tắt mọi hiệu ứng</span>
            <button className="russian-hidden-call" type="button"
              onClick={() => { setSeconds(6); setStage("incoming"); }}
              aria-label="CALL" title="CALL"><Phone size={12}/> CALL</button>
          </footer>
          {(stage === "incoming" || stage === "answered") && (
            <div className="russian-phone-backdrop" role="dialog" aria-modal="true"
              aria-label="Cuộc gọi bí mật">
              <div className="russian-phone">
                <div className="russian-phone-notch" aria-hidden="true"/>
                <div className="russian-call-status">
                  <PhoneIncoming size={16}/>
                  {stage === "answered" ? "ЗВОНОК ПРИНЯТ" : "ВХОДЯЩИЙ ЗВОНОК"}
                </div>
                <div className="russian-caller-photo">
                  {pictureFailed ? <span aria-hidden="true">☎</span> :
                    <img src={callerImageUrl} alt="Ảnh người gọi từ image.png trong GitHub"
                      onError={() => setPictureFailed(true)}/>}
                </div>
                <h2>Putin</h2>
                <p>{stage === "answered" ? "Алло! Хорошего дня!" : "Cuộc gọi bí mật đang đến…"}</p>
                {stage === "incoming" ? (
                  <>
                    <div className="russian-phone-timer" role="timer"
                      aria-label={"Còn " + seconds + " giây để trả lời"}>
                      {seconds}s
                    </div>
                    <p className="russian-call-hint">Nhấn nhanh phím <kbd>C</kbd> hoặc một trong hai nút nhận cuộc gọi!</p>
                    <div className="russian-call-actions">
                      <button type="button" onClick={takeCall} aria-label="Nhận cuộc gọi">
                        <Phone size={20}/> ОТВЕТИТЬ
                      </button>
                      <button type="button" onClick={takeCall} aria-label="Nhận cuộc gọi bằng nút C">
                        <Phone size={20}/> NHẬN (C)
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="russian-phone-answered" role="status">
                    ✓ Đã nghe máy! Tuyệt vời, bạn đã cứu trang web.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

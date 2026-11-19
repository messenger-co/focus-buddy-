import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Gamepad2, Phone, PhoneIncoming, RefreshCw, Volume2, VolumeX, X } from "lucide-react";
import { callerImageUrl, danceGifUrl, meowImageUrl, swowImageUrl, trackUrl } from "./russianShortcut";
const TankDefense = lazy(() => import("./TankDefense"));
import "./russianEgg.css";

type Stage = "party" | "incoming" | "answered" | "tank" | "crashed";
type Sound = "loading" | "playing" | "manual" | "missing";
const CORNERS = ["top-right", "bottom-right", "bottom-left", "top-left"] as const;

export default function RussianEgg({ close }: { close: () => void }) {
  const [stage, setStage] = useState<Stage>("party");
  const [seconds, setSeconds] = useState(4);
  const [sound, setSound] = useState<Sound>("loading");
  const [pictureFailed, setPictureFailed] = useState(false);
  const [gifFailed, setGifFailed] = useState(false);
  const [meowFailed, setMeowFailed] = useState(false);
  const [swowFailed, setSwowFailed] = useState(false);
  const [corner, setCorner] = useState(0);
  const [shout, setShout] = useState(0);
  const [prankCount, setPrankCount] = useState(0);
  const audio = useRef<HTMLAudioElement>(null);
  const callAnswered = useRef(false);

  function playMusic() {
    const element = audio.current;
    if (!element) return;
    void element.play().then(() => setSound("playing"))
      .catch(() => setSound("manual"));
  }
  function shoutInRussian() {
    setShout((value) => value + 1);
    try {
      if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") return;
      window.speechSynthesis.cancel();
      const phrase = new SpeechSynthesisUtterance("Эй! Три полоски! Танцуем!");
      phrase.lang = "ru-RU";
      phrase.rate = 1.15;
      phrase.volume = .65;
      window.speechSynthesis.speak(phrase);
    } catch { /* Animated text remains available. */ }
  }
  useEffect(() => {
    const element = audio.current;
    if (!element) return;
    const ready = () => {
      void element.play().then(() => setSound("playing"))
        .catch(() => setSound("manual"));
    };
    const broken = () => setSound("missing");
    element.addEventListener("canplay", ready);
    element.addEventListener("error", broken);
    element.load();
    return () => {
      element.pause();
      element.removeEventListener("canplay", ready);
      element.removeEventListener("error", broken);
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setCorner((value) => (value + 1) % CORNERS.length), 3900);
    return () => window.clearInterval(timer);
  }, []);

  // Random calls occur only while the secret mode is open, never outside it.
  useEffect(() => {
    if (stage !== "party") return;
    const timeout = window.setTimeout(() => {
      callAnswered.current = false;
      setSeconds(4);
      setStage("incoming");
    }, 4000 + Math.floor(Math.random() * 6500));
    return () => window.clearTimeout(timeout);
  }, [stage, prankCount]);

  useEffect(() => {
    if (stage !== "incoming") return;
    const deadline = Date.now() + 3200;
    const timer = window.setInterval(() => {
      if (callAnswered.current) return;
      const left = deadline - Date.now();
      setSeconds(Math.ceil(Math.max(0, left) / 1000));
      if (left <= 0) {
        window.clearInterval(timer);
        audio.current?.pause();
        window.speechSynthesis?.cancel();
        setStage("crashed"); // Fake crash is immediate: no shaking or delay.
      }
    }, 40);
    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "incoming") return;
    function onAnswer(event: KeyboardEvent) {
      if (event.code !== "KeyC" || event.ctrlKey || event.altKey || event.metaKey) return;
      event.preventDefault();
      event.stopPropagation();
      callAnswered.current = true;
      setStage("answered");
    }
    window.addEventListener("keydown", onAnswer, true);
    return () => window.removeEventListener("keydown", onAnswer, true);
  }, [stage]);

  useEffect(() => {
    if (stage !== "answered") return;
    const timer = window.setTimeout(() => {
      setStage("party");
      setPrankCount((count) => count + 1);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [stage]);

  function answer() {
    if (stage !== "incoming" || callAnswered.current) return;
    callAnswered.current = true;
    setStage("answered");
    shoutInRussian();
  }

  if (stage === "crashed") return (
    <div className="russian-fake-crash russian-nuked" role="alertdialog"
      aria-modal="true" aria-label="Fake Easter egg browser crash">
      <span className="nuke-burst" aria-hidden="true">💥</span>
      <div className="crash-face" aria-hidden="true">:(</div>
      <h1>Aw, Snap! ☢</h1>
      <p>BOOM. The Easter egg nuked this tab.</p>
      <p className="crash-code">ERR_SECRET_RUSSIAN_NUKE</p>
      <p className="crash-disclaimer">
        This is only a pretend browser crash. Your browser and saved data are safe.
        Refresh the page to return to Focus Buddy.
      </p>
      <div className="crash-refresh"><RefreshCw size={18}/> Press Ctrl + R to reload the website.</div>
    </div>
  );

  return (
    <section className="russian-egg-overlay egg-stage-party" role="dialog"
      aria-modal="true" aria-label="Russian secret Easter egg">
      <audio ref={audio} src={trackUrl} loop preload="none"
        aria-label="Easter egg music from GitHub"/>
      <div className="russian-snow" aria-hidden="true">
        {Array.from({ length: 27 }, (_, i) =>
          <span key={i} style={{ left: String((i * 43) % 100) + "%",
            animationDelay: String(-i * .46) + "s",
            animationDuration: String(6 + i % 7) + "s" }}>✻</span>)}
      </div>
      <div className={"russian-meow-corner corner-" + CORNERS[corner]} aria-hidden="true">
        {meowFailed ? <span>🐈</span> :
          <img src={meowImageUrl} alt="" onError={() => setMeowFailed(true)}/>}
      </div>
      <div className={"russian-swow-corner corner-" + CORNERS[(corner + 2) % CORNERS.length]} aria-hidden="true">
        {swowFailed ? <span>⭐</span> :
          <img src={swowImageUrl} alt="" onError={() => setSwowFailed(true)}/>}
      </div>
      {stage === "tank" ? (
        <Suspense fallback={<p className="russian-tank-loading">ЗАГРУЗКА · Loading winter tank defense…</p>}>
          <TankDefense onExit={() => setStage("party")}/>
        </Suspense>
      ) : (
        <>
      <header className="russian-egg-header">
        <div className="russian-egg-label"><span className="russian-flag" aria-hidden="true"/>
          ★ СОВЕТСКАЯ ЗИМА · СЕКРЕТНЫЙ РЕЖИМ ★
        </div>
        <div className="russian-egg-top-actions">
          {sound === "manual" && <button className="russian-music-button"
            type="button" onClick={playMusic}><Volume2 size={16}/> PLAY MUSIC</button>}
          {sound === "missing" && <span className="russian-audio-warning">
            <VolumeX size={16}/> Missing audio
          </span>}
          {sound === "playing" && <button className="russian-music-button"
            type="button" onClick={() => { audio.current?.pause(); setSound("manual"); }}>
            <VolumeX size={16}/> MUTE
          </button>}
          <button type="button" className="russian-egg-close"
            onClick={close} aria-label="Close Russian Easter egg"><X size={20}/></button>
        </div>
      </header>
      <div className="russian-egg-stage russian-chaos-stage">
        <div className="russian-egg-story">
          <div className="russian-egg-stars">★ ★ ★ ★ ★</div>
          <h1 className="russian-wavy-title" aria-label="ТРИ ПОЛОСКИ!">
            {"ТРИ ПОЛОСКИ!".split("").map((char, i) =>
              <span key={i} style={{ animationDelay: String(i * .12) + "s" }}
                aria-hidden="true">{char === " " ? "\u00a0" : char}</span>)}
          </h1>
          <p className="russian-egg-subtitle">🔥 CHAOTIC SECRET MODE UNLOCKED 🔥</p>
          <div key={shout} className="russian-shout-bubble" lang="ru">
            ЭЙ! ТАНЦУЕМ! ТРИ ПОЛОСКИ!
          </div>
          <p className="russian-egg-desc">
            Суровая зима! Two spinning images, Russian music and a secret winter battlefield.
            Random calls may interrupt this screen. Press <strong>C</strong> quickly, or enter the game.
          </p>
          <div className="russian-chaos-tags" aria-hidden="true">
            <span>ЗИМА!</span><span>ВПЕРЁД!</span><span>МЯУ!</span>
          </div>
          <div className="russian-tank-invite">
            <span className="russian-tank-invite-kicker">★ СЕКРЕТНАЯ МИССИЯ ★</span>
            <strong>WINTER FRONT: TANK DEFENSE</strong>
            <p>Defend the Soviet winter outpost against five hard waves of enemy tanks flying USA flags. Fictional alternate history, no gore.</p>
            <button type="button" className="russian-tank-launch" onClick={() => {
              audio.current?.pause();
              setSound("manual");
              setStage("tank");
            }}>
              <Gamepad2 size={21}/> ИГРАТЬ · PLAY TANK GAME
            </button>
          </div>
          <p className="russian-sip-counter" role="status">
            Calls answered: {prankCount}. Do not miss the next call.
          </p>
        </div>
        <div className="russian-character-stand">
          <div className="russian-spotlight" aria-hidden="true"/>
          <button type="button" className="russian-gif-button"
            onClick={shoutInRussian} aria-label="Make the dancer shout in Russian">
            {gifFailed ? <span className="russian-dance-fallback">💃🕺</span> :
              <img src={danceGifUrl} alt="Dancing GIF Easter egg"
                onError={() => setGifFailed(true)}/>}
          </button>
          <span className="russian-gif-hint">CLICK THE DANCER FOR A RUSSIAN SHOUT!</span>
        </div>
      </div>
      <footer className="russian-egg-bottom">
        <span>CTRL + SHIFT + 5 · REFRESH TO RESET · NO CLOUD SAVES</span>
        <button className="russian-hidden-call" type="button"
          onClick={() => { callAnswered.current = false; setSeconds(4); setStage("incoming"); }}
          title="CALL" aria-label="CALL"><Phone size={12}/> CALL</button>
      </footer>
      {(stage === "incoming" || stage === "answered") && (
        <div className="russian-phone-backdrop" role="dialog"
          aria-modal="true" aria-label="Secret incoming call">
          <div className="russian-phone">
            <div className="russian-phone-notch" aria-hidden="true"/>
            <div className="russian-call-status">
              <PhoneIncoming size={16}/>
              {stage === "incoming" ? "ВХОДЯЩИЙ ЗВОНОК" : "ЗВОНОК ПРИНЯТ"}
            </div>
            <div className="russian-caller-photo">
              {pictureFailed ? <span aria-hidden="true">☎</span> :
                <img src={callerImageUrl} alt="Caller image from repository"
                  onError={() => setPictureFailed(true)}/>}
            </div>
            <h2>Putin</h2>
            <p>{stage === "incoming" ? "INCOMING CALL — HURRY!" : "Алло! Хорошего дня!"}</p>
            {stage === "incoming" ? (
              <>
                <div className="russian-phone-timer" role="timer"
                  aria-label={String(seconds) + " seconds to answer"}>{seconds}s</div>
                <p className="russian-call-hint">Press <kbd>C</kbd> or either green answer button.</p>
                <div className="russian-call-actions">
                  <button type="button" onClick={answer}>
                    <Phone size={20}/> ОТВЕТИТЬ
                  </button>
                  <button type="button" onClick={answer}>
                    <Phone size={20}/> ANSWER (C)
                  </button>
                </div>
              </>
            ) : (
              <div className="russian-phone-answered" role="status">
                ✓ Saved! Another random call is coming…
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

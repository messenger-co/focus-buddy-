import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Sparkles,
  Feather,
  Flower2,
  Footprints,
  Grid2X2,
  Leaf,
  Moon,
  RotateCcw,
  ScanEye,
  Sprout,
  Star,
  Sun,
  TrainFront,
  Type,
} from "lucide-react";
import type { Profile } from "../state";
import Companion from "../components/Companion";
import {
  gameShelf,
  numberPuzzle,
  phrases,
  shuffle,
  type GameId,
} from "./puzzles";
import "./games.css";
import "./game-depth.css";
import { adventures } from "./arcade/courses";
import { AdventureShelf } from "./arcade/Gallery";
const Adventure = lazy(() => import("./arcade/Adventure"));
const BuddyGarden = lazy(() => import("./BuddyGarden"));
const BuddyRunner = lazy(() => import("./BuddyRunner"));
const BuddySurvival = lazy(() => import("./BuddySurvival"));

const symbols = [
  { icon: Leaf, name: "Lá" },
  { icon: Moon, name: "Trăng" },
  { icon: Sun, name: "Nắng" },
  { icon: Flower2, name: "Hoa" },
];
const icons = {
  "lat-the": Grid2X2,
  "tinh-mat": ScanEye,
  "noi-so": Footprints,
  "quy-luat": TrainFront,
  "xep-chu": Type,
};
function Cover({ id }: { id: GameId }) {
  const faces = {
    "lat-the": [<Leaf />, <Leaf />],
    "tinh-mat": [<Star />, <Sparkles />, <Star />],
    "noi-so": ["1", "2", "3"],
    "quy-luat": ["2", "4", "?"],
    "xep-chu": ["M", "Â", "Y"],
  }[id];
  return (
    <div className={`game-cover cover-${id}`} aria-hidden="true">
      <div className="cover-trail" />
      <div className="cover-pieces">
        {faces.map((face, i) => (
          <span key={i}>{face}</span>
        ))}
      </div>
    </div>
  );
}
type PlayProps = { finish: () => void };

function MemoryGame({ finish }: PlayProps) {
  const [deck] = useState(() => shuffle([0, 1, 2, 3, 0, 1, 2, 3]));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [pairs, setPairs] = useState<number[]>([]);
  const [feedback, setFeedback] = useState("Lật một thẻ để bắt đầu.");
  const mismatch = flipped.length === 2;
  useEffect(() => {
    if (!mismatch) return;
    const id = setTimeout(() => setFlipped([]), 1050);
    return () => clearTimeout(id);
  }, [mismatch]);
  function pick(index: number) {
    const value = deck[index];
    if (mismatch || flipped.includes(index) || pairs.includes(value)) return;
    if (!flipped.length) {
      setFlipped([index]);
      setFeedback("Chọn thẻ thứ hai.");
      return;
    }
    if (deck[flipped[0]] !== value) {
      setFlipped([...flipped, index]);
      setFeedback("Hai hình khác nhau. Hãy nhớ vị trí của chúng nhé.");
      return;
    }
    setPairs([...pairs, value]);
    setFlipped([]);
    setFeedback("Bạn vừa tìm được một đôi!");
    if (pairs.length === 3) finish();
  }
  return (
    <>
      <RoundCaption label="Số cặp đã ghép" value={pairs.length} total={4} />
      <div className="play-grid memory-grid">
        {deck.map((value, index) => {
          const open = flipped.includes(index) || pairs.includes(value);
          const { icon: Icon, name } = symbols[value];
          return (
            <button
              key={index}
              type="button"
              className={open ? "tile revealed" : "tile tile-back"}
              disabled={pairs.includes(value)}
              aria-label={`Thẻ ${index + 1}${open ? " · " + name : " úp"}`}
              onClick={() => pick(index)}
            >
              {open ? <Icon /> : <Feather />}
              {pairs.includes(value) && <Check className="paired-check" />}
            </button>
          );
        })}
      </div>
      <p className="game-feedback" role="status">
        {feedback}
      </p>
    </>
  );
}

const lookalikes = [
  [
    { icon: Star, name: "ngôi sao" },
    { icon: Sparkles, name: "chùm sao" },
  ],
  [
    { icon: Leaf, name: "chiếc lá" },
    { icon: Sprout, name: "mầm cây" },
  ],
  [
    { icon: Sun, name: "mặt trời" },
    { icon: Moon, name: "mặt trăng" },
  ],
];
function SearchGame({ finish }: PlayProps) {
  const [boards] = useState(() =>
    shuffle(lookalikes).map(([same, odd]) => ({
      same,
      odd,
      target: Math.floor(Math.random() * 12),
    })),
  );
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState("");
  const { same, odd, target } = boards[round];
  function pick(index: number) {
    if (index !== target) {
      setFeedback("Ô này giống đa số. Hãy nhìn đường nét một lần nữa.");
      return;
    }
    if (round === 2) finish();
    else {
      setRound(round + 1);
      setFeedback("Đúng rồi! Bảng tiếp theo đã sẵn sàng.");
    }
  }
  return (
    <>
      <RoundCaption label="Lượt quan sát" value={round + 1} total={3} />
      <div className="play-grid eye-grid">
        {Array.from({ length: 12 }, (_, i) => {
          const { icon: Icon, name } = i === target ? odd : same;
          return (
            <button
              className="tile"
              key={i}
              onClick={() => pick(i)}
              aria-label={`Ô ${i + 1}, ${name}`}
            >
              <Icon />
            </button>
          );
        })}
      </div>
      <p className="game-feedback" role="status">
        {feedback || "Hình nào chỉ xuất hiện một lần?"}
      </p>
    </>
  );
}

function OrderGame({ finish }: PlayProps) {
  const [tiles] = useState(() => shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  const [next, setNext] = useState(1);
  const [hint, setHint] = useState("");
  function pick(n: number) {
    if (n !== next) {
      setHint(`Hãy tìm số ${next} trước nhé.`);
      return;
    }
    if (n === 9) finish();
    else {
      setNext(n + 1);
      setHint("");
    }
  }
  return (
    <>
      <RoundCaption label="Số cần tìm" value={next} total={9} />
      <div className="play-grid number-grid">
        {tiles.map((n) => (
          <button
            className="tile"
            key={n}
            disabled={n < next}
            aria-label={`Số ${n}`}
            onClick={() => pick(n)}
          >
            {n < next ? <Check /> : n}
          </button>
        ))}
      </div>
      <p className="game-feedback" role="status">
        {hint || `Chạm vào số ${next}.`}
      </p>
    </>
  );
}

function PatternGame({ finish }: PlayProps) {
  const [puzzles] = useState(() => [0, 1, 2].map(numberPuzzle));
  const [round, setRound] = useState(0);
  const [hint, setHint] = useState("");
  const current = puzzles[round];
  function pick(n: number) {
    if (n !== current.answer) {
      setHint("Thử so sánh hai số đứng cạnh nhau nhé.");
      return;
    }
    if (round === 2) finish();
    else {
      setRound(round + 1);
      setHint("Chính xác! Bạn đã tới trạm kế tiếp.");
    }
  }
  return (
    <>
      <RoundCaption label="Trạm" value={round + 1} total={3} />
      <div className="rail-sequence" aria-label="Dãy số">
        {current.shown.map((n) => (
          <b key={n}>{n}</b>
        ))}
        <b>?</b>
      </div>
      <div className="pattern-options">
        {current.options.map((n) => (
          <button className="tile" key={n} onClick={() => pick(n)}>
            {n}
          </button>
        ))}
      </div>
      <p className="game-feedback" role="status">
        {hint || "Số nào sẽ đứng sau cùng?"}
      </p>
    </>
  );
}

function WordGame({ finish }: PlayProps) {
  const [puzzles] = useState(() =>
    shuffle(phrases)
      .slice(0, 3)
      .map((phrase) => ({ ...phrase, bank: shuffle(phrase.words) })),
  );
  const [round, setRound] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const [hint, setHint] = useState("");
  const current = puzzles[round];
  function check() {
    if (words.join(" ") !== current.words.join(" ")) {
      setHint("Chưa đúng thứ tự. Chạm vào một mảnh đã ghép để gỡ ra.");
      return;
    }
    if (round === 2) finish();
    else {
      setRound(round + 1);
      setWords([]);
      setHint("Đúng rồi! Hãy thử cụm tiếp theo.");
    }
  }
  return (
    <>
      <RoundCaption label="Cụm từ" value={round + 1} total={3} />
      <p className="word-clue">{current.clue}</p>
      <div className="sentence" aria-label="Cụm từ đang ghép">
        {words.length ? (
          words.map((w) => (
            <button
              key={w}
              aria-label={`Gỡ ${w}`}
              onClick={() => {
                setWords(words.filter((x) => x !== w));
                setHint("");
              }}
            >
              {w}
            </button>
          ))
        ) : (
          <span>Chọn các mảnh từ bên dưới theo thứ tự.</span>
        )}
      </div>
      <div className="word-bank">
        {current.bank.map((w) => (
          <button
            key={w}
            disabled={words.includes(w)}
            onClick={() => {
              setWords([...words, w]);
              setHint("");
            }}
          >
            {w}
          </button>
        ))}
      </div>
      <button
        className="button primary"
        disabled={words.length !== current.words.length}
        onClick={check}
      >
        <Check size={16} />
        Kiểm tra cụm từ
      </button>
      <p className="game-feedback" role="status">
        {hint}
      </p>
    </>
  );
}

function RoundCaption({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  return (
    <div className="round-caption">
      <strong>{label}</strong>
      <span>
        {value} / {total}
      </span>
    </div>
  );
}
const games = {
  "lat-the": MemoryGame,
  "tinh-mat": SearchGame,
  "noi-so": OrderGame,
  "quy-luat": PatternGame,
  "xep-chu": WordGame,
};

function PlayTable({ id, profile }: { id: GameId; profile: Profile }) {
  const [done, setDone] = useState(false);
  const [version, setVersion] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (done) heading.current?.focus();
  }, [done]);
  const game = gameShelf.find((g) => g.id === id)!;
  const Game = games[id];
  const Icon = icons[id];
  return (
    <section className={`play-table activity-${id}`}>
      <div className="play-header">
        <span className="game-symbol">
          <Icon size={24} />
        </span>
        <div>
          <p>{game.skill}</p>
          <h1>{game.name}</h1>
        </div>
      </div>
      {done ? (
        <div className="game-result">
          <Companion
            kind={profile.companion}
            color={profile.color}
            accessory={profile.accessory}
            paused
            reaction="happy"
            size={125}
          />
          <h2 ref={heading} tabIndex={-1}>
            Hoàn thành rồi!
          </h2>
          <p>Bạn đã vượt qua {game.goal.toLowerCase()}.</p>
          <div className="button-row">
            <Link className="button primary" to="/tap-trung">
              Về đồng hồ <ArrowRight size={16} />
            </Link>
            <button
              className="button secondary"
              onClick={() => {
                setVersion(version + 1);
                setDone(false);
              }}
            >
              <RotateCcw size={15} />
              Chơi lại
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="game-instructions">{game.detail}</p>
          <Game key={version} finish={() => setDone(true)} />
        </>
      )}
    </section>
  );
}

export default function Games({
  profile,
  countdown,
}: {
  profile: Profile;
  countdown: string | null;
}) {
  const { slug } = useParams();
  const [richEffects, setRichEffects] = useState(() => {
    try { return localStorage.getItem("focus-buddy-rich-effects-v1") !== "off"; }
    catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem("focus-buddy-rich-effects-v1", richEffects ? "on" : "off"); }
    catch { /* Device storage is optional. */ }
  }, [richEffects]);
  const selected = gameShelf.find((g) => g.id === slug);
  const adventure = adventures.find((g) => g.slug === slug);
  const buddyGarden = slug === "vuon-buddy";
  const buddyRunner = slug === "buddy-run";
  const buddySurvival = slug === "dao-xanh";
  return (
    <div className={`games-page ${richEffects ? "fx-rich" : "fx-lite"}`}>
      <div className="game-graphics-bar">
        <span><Sparkles size={17}/> Hình ảnh 2.5D · Chiều sâu, ánh sáng và chuyển động</span>
        <button type="button" aria-pressed={richEffects}
          onClick={() => setRichEffects((current) => !current)}>
          {richEffects ? "Hiệu ứng: Bật" : "Hiệu ứng: Tối giản"}
        </button>
      </div>
      {countdown && (
        <Link to="/tap-trung" className="game-timer">
          <Clock3 size={17} />
          Phiên tập trung <strong>{countdown}</strong>
          <ArrowRight size={16} />
        </Link>
      )}
      {selected || adventure || buddyGarden || buddyRunner || buddySurvival ? (
        <>
          <Link className="back-to-shelf" to="/tro-choi">
            <ArrowLeft size={16} />
            Tất cả trò chơi
          </Link>
          {buddyRunner ? (
            <Suspense fallback={<p>Đang mở đường chạy Buddy…</p>}>
              <BuddyRunner profile={profile}/>
            </Suspense>
          ) : buddySurvival ? (
            <Suspense fallback={<p>Đang mở Đảo Xanh…</p>}>
              <BuddySurvival profile={profile}/>
            </Suspense>
          ) : buddyGarden ? (
            <Suspense fallback={<p>Đang mở vườn hoa…</p>}>
              <BuddyGarden profile={profile}/>
            </Suspense>
          ) : adventure ? (
            <Suspense fallback={<p>Đang mở đường chơi…</p>}>
              <Adventure
                key={adventure.mode}
                mode={adventure.mode}
                profile={profile}
              />
            </Suspense>
          ) : (
            selected && (
              <PlayTable key={selected.id} id={selected.id} profile={profile} />
            )
          )}
        </>
      ) : (
        <>
          <header className="arcade-lobby-heading">
            <h1>Trò chơi tập trung</h1>
            <p>
              Chọn một chuyến phiêu lưu cùng{" "}
              {profile.buddy_name || "bạn nhỏ của bạn"}.
            </p>
          </header>
          <Link className="garden-promo" to="/tro-choi/vuon-buddy">
            <span className="garden-promo-icon"><Flower2 size={31}/></span>
            <span><small>TRÒ CHƠI CÙNG BUDDY · 1 PHÚT</small><strong>Vườn hoa lấp lánh</strong><em>Tìm 10 bông hoa phát sáng. Một cuộc phiêu lưu nhỏ trong giờ nghỉ!</em></span>
            <ArrowRight size={21}/>
          </Link>
          <div className="buddy-big-games">
            <Link to="/tro-choi/buddy-run" className="buddy-feature-game runner-feature">
              <span className="buddy-feature-emoji" aria-hidden="true">🏃</span>
              <div><small>NHẢY · THỬ PHẢN XẠ · CẤP ĐỘ TĂNG DẦN</small><h2>Buddy Runner</h2><p>Trò chơi giống khủng long offline, nhưng chính Buddy của bạn chạy và nhảy. Có kỷ lục lưu cục bộ.</p><span>Chơi ngay <ArrowRight size={15}/></span></div>
            </Link>
            <Link to="/tro-choi/dao-xanh" className="buddy-feature-game survival-feature">
              <span className="buddy-feature-emoji" aria-hidden="true">🏝️</span>
              <div><small>PHIÊU LƯU · BỐN CHƯƠNG · TỰ LƯU</small><h2>Buddy Survival: Đảo Xanh</h2><p>Đi khám phá, nhặt vật liệu, xây nơi ở và mở khóa công trình mới. Tiến độ chỉ lưu trên thiết bị.</p><span>Khám phá đảo <ArrowRight size={15}/></span></div>
            </Link>
          </div>
          <AdventureShelf profile={profile} />
          <h2 className="shelf-caption">Thử thách nhanh</h2>
          <div className="game-shelf">
            {gameShelf.map((game) => (
              <Link
                to={`/tro-choi/${game.id}`}
                className={`game-card activity-${game.id}`}
                key={game.id}
              >
                <Cover id={game.id} />
                <div className="game-card-copy">
                  <small>
                    {game.skill} · {game.goal}
                  </small>
                  <h2>{game.name}</h2>
                  <p>{game.detail}</p>
                  <span className="game-play">
                    Vào chơi <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

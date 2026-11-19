import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Feather,
  Flower2,
  Footprints,
  Grid2X2,
  Leaf,
  Moon,
  RotateCcw,
  ScanEye,
  Sparkles,
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
  quickTitles,
  pairsAt,
  searchSize,
  searchRounds,
  numberTrail,
  trailHints,
  wordSets,
  shuffle,
  type GameId,
} from "./puzzles";
import "./games.css";
import { expeditions } from "./arcade/boards";
import { LevelPicker, LevelCount, levelKey, recordScore } from "./levels";
import { adventures } from "./arcade/courses";
import { AdventureShelf } from "./arcade/Gallery";
const Expedition = lazy(() => import("./arcade/Expedition"));
const Adventure = lazy(() => import("./arcade/Adventure"));

const symbols = [
  { icon: Leaf, name: "Lá" },
  { icon: Moon, name: "Trăng" },
  { icon: Sun, name: "Nắng" },
  { icon: Flower2, name: "Hoa" },
  { icon: Feather, name: "Lông vũ" },
  { icon: Star, name: "Sao" },
  { icon: Sprout, name: "Mầm cây" },
  { icon: Footprints, name: "Dấu chân" },
  { icon: TrainFront, name: "Đầu tàu" },
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
type PlayProps = { finish: () => void; level: number };

function MemoryGame({ finish, level }: PlayProps) {
  const target = pairsAt(level);
  const [deck] = useState(() => {
    const faces = Array.from({ length: target }, (_, i) => i);
    return shuffle([...faces, ...faces]);
  });
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
    if (pairs.length + 1 === target) finish();
  }
  return (
    <>
      <RoundCaption
        label="Số cặp đã ghép"
        value={pairs.length}
        total={target}
      />
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
function SearchGame({ finish, level }: PlayProps) {
  const size = searchSize(level);
  const [boards] = useState(() => {
    const deck = shuffle(lookalikes);
    return Array.from({ length: searchRounds(level) }, (_, i) => {
      const [same, other] = deck[i % deck.length];
      const rotated = level >= 3 && i % 2 === 1;
      const base = rotated ? { icon: Feather, name: "lông vũ" } : same;
      return {
        same: base,
        odd: rotated ? { ...base, name: "lông vũ đổi hướng" } : other,
        rotated,
        target: Math.floor(Math.random() * size),
      };
    });
  });
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState("");
  const { same, odd, target, rotated } = boards[round];
  function pick(index: number) {
    if (index !== target) {
      setFeedback("Ô này giống đa số. Hãy nhìn đường nét một lần nữa.");
      return;
    }
    if (round + 1 === boards.length) finish();
    else {
      setRound(round + 1);
      setFeedback("Đúng rồi! Bảng tiếp theo đã sẵn sàng.");
    }
  }
  return (
    <>
      <RoundCaption
        label="Lượt quan sát"
        value={round + 1}
        total={boards.length}
      />
      <div className="play-grid eye-grid">
        {Array.from({ length: size }, (_, i) => {
          const { icon: Icon, name } = i === target ? odd : same;
          return (
            <button
              className="tile"
              key={i}
              onClick={() => pick(i)}
              aria-label={`Ô ${i + 1}, ${name}`}
            >
              <Icon
                style={
                  rotated && i === target
                    ? { transform: "rotate(65deg)" }
                    : undefined
                }
              />
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

function OrderGame({ finish, level }: PlayProps) {
  const [trail] = useState(() => numberTrail(level)),
    [tiles] = useState(() => shuffle(trail));
  const [index, setIndex] = useState(0),
    [hint, setHint] = useState("");
  const next = trail[index];
  function pick(n: number) {
    if (n !== next) {
      setHint(`Hãy tìm số ${next} trước nhé.`);
      return;
    }
    if (index + 1 === trail.length) finish();
    else {
      setIndex(index + 1);
      setHint("");
    }
  }
  return (
    <>
      <RoundCaption label="Bước chân" value={index + 1} total={trail.length} />
      <p className="trail-rule">
        {trailHints[level]} <b>Số cần tìm: {next}</b>
      </p>
      <div className="play-grid number-grid">
        {tiles.map((n) => (
          <button
            className="tile"
            key={n}
            disabled={trail.indexOf(n) < index}
            aria-label={`Số ${n}`}
            onClick={() => pick(n)}
          >
            {trail.indexOf(n) < index ? <Check /> : n}
          </button>
        ))}
      </div>
      <p className="game-feedback" role="status">
        {hint || `Chạm vào số ${next}.`}
      </p>
    </>
  );
}

function PatternGame({ finish, level }: PlayProps) {
  const [puzzles] = useState(() =>
    Array.from({ length: [3, 4, 4, 4, 4, 5][level] }, (_, i) =>
      numberPuzzle(i, level),
    ),
  );
  const [round, setRound] = useState(0);
  const [hint, setHint] = useState("");
  const current = puzzles[round];
  function pick(n: number) {
    if (n !== current.answer) {
      setHint(current.hint);
      return;
    }
    if (round + 1 === puzzles.length) finish();
    else {
      setRound(round + 1);
      setHint("Chính xác! Bạn đã tới trạm kế tiếp.");
    }
  }
  return (
    <>
      <RoundCaption label="Trạm" value={round + 1} total={puzzles.length} />
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

function WordGame({ finish, level }: PlayProps) {
  const [puzzles] = useState(() =>
    shuffle(wordSets[level])
      .slice(0, level === 5 ? 4 : 3)
      .map((phrase) => ({
        ...phrase,
        bank: shuffle(phrase.words.map((_, i) => i)),
      })),
  );
  const [round, setRound] = useState(0);
  const [words, setWords] = useState<number[]>([]);
  const [hint, setHint] = useState("");
  const current = puzzles[round];
  function check() {
    if (
      words.map((i) => current.words[i]).join(" ") !== current.words.join(" ")
    ) {
      setHint("Chưa đúng thứ tự. Chạm vào một mảnh đã ghép để gỡ ra.");
      return;
    }
    if (round + 1 === puzzles.length) finish();
    else {
      setRound(round + 1);
      setWords([]);
      setHint("Đúng rồi! Hãy thử cụm tiếp theo.");
    }
  }
  return (
    <>
      <RoundCaption label="Cụm từ" value={round + 1} total={puzzles.length} />
      <p className="word-clue">{current.clue}</p>
      <div className="sentence" aria-label="Cụm từ đang ghép">
        {words.length ? (
          words.map((w) => (
            <button
              key={w}
              aria-label={`Gỡ ${current.words[w]}`}
              onClick={() => {
                setWords(words.filter((x) => x !== w));
                setHint("");
              }}
            >
              {current.words[w]}
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
            {current.words[w]}
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
  const [level, setLevel] = useState(0);
  const started = useRef(performance.now());
  function restart(next: number) {
    started.current = performance.now();
    setLevel(next);
    setVersion((v) => v + 1);
    setDone(false);
  }
  function finish() {
    recordScore(
      levelKey(id, level),
      {
        count: 1,
        seconds: Math.max(0.001, (performance.now() - started.current) / 1000),
      },
      1,
    );
    setDone(true);
  }
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
      <LevelPicker
        slug={id}
        titles={quickTitles[id]}
        index={level}
        onSelect={(i) => {
          if (i !== level) restart(i);
        }}
      />
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
          <p>
            Bạn đã vượt chặng {level + 1} · {quickTitles[id][level]}.
          </p>
          <div className="button-row">
            {level < quickTitles[id].length - 1 && (
              <button
                className="button primary"
                onClick={() => restart(level + 1)}
              >
                Chặng tiếp theo <ArrowRight size={16} />
              </button>
            )}
            <Link className="button secondary" to="/tap-trung">
              Về đồng hồ <ArrowRight size={16} />
            </Link>
            <button className="button secondary" onClick={() => restart(level)}>
              <RotateCcw size={15} />
              Chơi lại
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="game-instructions">{game.detail}</p>
          <Game key={version} level={level} finish={finish} />
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
  const selected = gameShelf.find((g) => g.id === slug);
  const expedition = expeditions.find((g) => g.slug === slug);
  const adventure = adventures.find((g) => g.slug === slug);
  return (
    <div className="games-page">
      {countdown && (
        <Link to="/tap-trung" className="game-timer">
          <Clock3 size={17} />
          Phiên tập trung <strong>{countdown}</strong>
          <ArrowRight size={16} />
        </Link>
      )}
      {selected || adventure || expedition ? (
        <>
          <Link className="back-to-shelf" to="/tro-choi">
            <ArrowLeft size={16} />
            Tất cả trò chơi
          </Link>
          {expedition || adventure ? (
            <Suspense fallback={<p>Đang mở đường chơi…</p>}>
              {expedition ? (
                <Expedition
                  key={expedition.mode}
                  mode={expedition.mode}
                  profile={profile}
                />
              ) : (
                adventure && (
                  <Adventure
                    key={adventure.mode}
                    mode={adventure.mode}
                    profile={profile}
                  />
                )
              )}
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
                    {game.skill} · <LevelCount slug={game.id} />
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

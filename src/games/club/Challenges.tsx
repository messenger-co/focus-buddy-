import Railway from "../railway/Railway";
import { useEffect, useRef, useState } from "react";
import type { ClubId } from "./catalog";
import type { PlayProps } from "./props";
import {
  editDistance,
  ink,
  place,
  quizzes,
  rotate,
  shapes,
  typingLines,
  type Offset,
} from "./lessons";
import { shuffle } from "../puzzles";
import Companion from "../../components/Companion";
import { ACCESSORIES, COLORS } from "../../data";

export function useElapsed(active: boolean) {
  const elapsed = useRef(0);
  useEffect(() => {
    if (!active) return;
    let frame = 0,
      last: number | null = null;
    const tick = (t: number) => {
      if (last !== null) elapsed.current += Math.min(0.12, (t - last) / 1000);
      last = t;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);
  return elapsed;
}
export function Typing({ level, active, finish, tone }: PlayProps) {
  const [round, R] = useState(0),
    [text, T] = useState(""),
    [miss, M] = useState(0),
    [tip, H] = useState(""),
    [errors, E] = useState(0);
  const total = level < 2 ? 2 : 3,
    line = typingLines[level][round],
    time = useElapsed(active),
    field = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (active) field.current?.focus({ preventScroll: true });
  }, [active]);
  const submit = () => {
    if (!active || !text.trim()) return;
    const a = text.normalize("NFC").trim().replace(/\s+/g, " "),
      b = line.normalize("NFC"),
      diff = editDistance(a, b);
    if (diff) {
      tone(false);
      E(errors + diff);
      M(miss + 1);
      H(`Còn ${diff} ký tự cần sửa. Bạn có thể chỉnh ngay trong ô gõ.`);
      if (miss + 1 >= 3) finish(round, false);
      return;
    }
    tone();
    const typed = typingLines[level].slice(0, round + 1).join(" ").length;
    const wpm = Math.round(((typed / 5) * 60) / Math.max(1, time.current));
    const accuracy = Math.round((typed / (typed + errors)) * 100);
    if (round + 1 === total) {
      finish(wpm * accuracy);
      return;
    }
    H(`${wpm} từ/phút · ${accuracy}% chính xác`);
    T("");
    R(round + 1);
    field.current?.focus();
  };
  return (
    <form
      className="club-question"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <strong>
        Cụm từ {round + 1}/{total} · {3 - miss} lượt
      </strong>
      <blockquote>{line}</blockquote>
      <label>
        Nội dung bạn gõ
        <input
          ref={field}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={text}
          onChange={(e) => T(e.target.value)}
          disabled={!active}
        />
      </label>
      <button className="button primary" disabled={!active || !text.trim()}>
        Kiểm tra
      </button>
      <p role="status">{tip}</p>
    </form>
  );
}
export function Reaction({ active, finish, level, tone }: PlayProps) {
  const time = useElapsed(active),
    [round, R] = useState(0),
    [life, L] = useState(3),
    [lit, S] = useState(false),
    [info, I] = useState(""),
    [points, P] = useState(0);
  const signal = useRef(1.2 + Math.random()),
    goal = 3 + Math.floor(level / 2),
    limit = 1.18 - level * 0.11;
  const after = () => {
    S(false);
    signal.current = time.current + 1 + Math.random() * (1.6 + level * 0.12);
  };
  const miss = (message: string) => {
    tone(false);
    L(life - 1);
    I(message);
    after();
    if (life <= 1) finish(points, false);
  };
  const hit = () => {
    if (!active) return;
    const delay = time.current - signal.current;
    if (delay < 0) {
      miss("Bạn chạm trước khi đèn sáng.");
      return;
    }
    if (delay > limit) {
      miss("Đom đóm đã bay đi.");
      return;
    }
    const ms = Math.round(1000 * delay),
      score = points + Math.max(1, Math.round((limit - delay) * 100));
    tone();
    P(score);
    I(`Bắt trúng sau ${ms} mili giây!`);
    if (round + 1 >= goal) {
      finish(score);
      return;
    }
    R(round + 1);
    after();
  };
  const latest = useRef({ hit, miss });
  latest.current = { hit, miss };
  useEffect(() => {
    if (!active) return;
    const clock = setInterval(() => {
      const delta = time.current - signal.current;
      if (delta > limit) latest.current.miss("Đom đóm đã bay đi.");
      else if (delta >= 0) S(true);
    }, 35);
    const key = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target as HTMLElement).closest("button")) {
        e.preventDefault();
        if (!e.repeat) latest.current.hit();
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      clearInterval(clock);
      window.removeEventListener("keydown", key);
    };
  }, [active, time, limit]);
  return (
    <div className="club-question">
      <strong>
        {round}/{goal} đom đóm · {life} lượt
      </strong>
      <button
        className={`club-lantern ${lit ? "lit" : ""}`}
        disabled={!active}
        onClick={hit}
        aria-label={lit ? "Bắt đom đóm" : "Đợi đom đóm"}
      >
        <span aria-hidden="true">✦</span>
        {lit ? "Bắt ngay!" : "Chờ ánh sáng…"}
      </button>
      <p role="status">{info}</p>
    </div>
  );
}
function useNumberKeys(active: boolean, choose: (i: number) => void) {
  const latest = useRef(choose);
  latest.current = choose;
  useEffect(() => {
    if (!active) return;
    const key = (e: KeyboardEvent) => {
      if (!e.repeat && !e.ctrlKey && !e.altKey && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        latest.current(Number(e.key) - 1);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [active]);
}
export function Quiz({ level, active, finish, tone }: PlayProps) {
  const [qs] = useState(() =>
      shuffle(quizzes[level]).map((q) => ({
        ...q,
        options: shuffle(q.choices),
      })),
    ),
    [round, R] = useState(0),
    [choice, C] = useState<string | null>(null),
    [count, N] = useState(0);
  const q = qs[round];
  const choose = (i: number) => {
    if (!active || choice || !q.options[i]) return;
    const a = q.options[i];
    C(a);
    tone(a === q.choices[0]);
    if (a === q.choices[0]) N(count + 1);
  };
  useNumberKeys(active, choose);
  return (
    <div className="club-question">
      <strong>
        Câu {round + 1}/{qs.length} · Cần đúng ít nhất 2 câu
      </strong>
      <h2>{q.q}</h2>
      <div className="club-choices">
        {q.options.map((a, i) => (
          <button
            key={a}
            className={choice && a === q.choices[0] ? "correct" : ""}
            disabled={!active || !!choice}
            onClick={() => choose(i)}
          >
            <small>{i + 1}</small> {a}
          </button>
        ))}
      </div>
      {choice && (
        <>
          <p role="status">{q.why}</p>
          <button
            className="button primary"
            disabled={!active}
            onClick={() => {
              if (round === qs.length - 1) finish(count, count >= 2);
              else {
                R(round + 1);
                C(null);
              }
            }}
          >
            {round === qs.length - 1 ? "Xem kết quả" : "Câu tiếp theo"}
          </button>
        </>
      )}
    </div>
  );
}
export function ColorMatch({ level, active, finish, tone }: PlayProps) {
  const [samples] = useState(() =>
    Array.from({ length: 4 + level }, (_, round) => {
      const options = shuffle(ink).slice(
        0,
        Math.min(4 + Math.floor(level / 2), 6),
      );
      return { options, want: options[(round + level) % options.length] };
    }),
  );
  const [round, R] = useState(0),
    [lives, L] = useState(3),
    [hint, H] = useState("");
  const { want, options } = samples[round];
  function choose(i: number) {
    if (!active || !options[i]) return;
    if (options[i] !== want) {
      tone(false);
      H("Chưa trùng mẫu. Hãy nhìn cả họa tiết nhé.");
      L(lives - 1);
      if (lives === 1) finish(round, false);
      return;
    }
    tone();
    if (round === samples.length - 1) finish((round + 1) * 10 + lives);
    else {
      R(round + 1);
      H("");
    }
  }
  useNumberKeys(active, choose);
  return (
    <div className="club-question">
      <strong>
        Mẫu {round + 1}/{samples.length} · {lives} lượt
      </strong>
      <div
        className={`paint-chip ${want[2]}`}
        style={{ backgroundColor: want[1] }}
        aria-label={`Mẫu cần tìm: ${want[0]}`}
      />
      <div className="club-swatches">
        {options.map(([name, hex, pat], i) => (
          <button
            aria-label={`Lọ ${i + 1}: ${name}`}
            disabled={!active}
            key={name}
            onClick={() => choose(i)}
          >
            <i className={pat} style={{ backgroundColor: hex }} />
            {i + 1}
          </button>
        ))}
      </div>
      <p role="status">{hint}</p>
    </div>
  );
}
export function BlockPuzzle({ level, active, finish, tone }: PlayProps) {
  const side = 6,
    target = 2 + level;
  const [cells, B] = useState<number[]>(() =>
    Array.from({ length: 36 }, (_, i) => (i >= 30 && i < 34 ? 1 : 0)),
  );
  const [tray, G] = useState([0, 1, 2]),
    [selected, S] = useState(0),
    [turn, T] = useState(0),
    [score, Q] = useState(0),
    [hint, H] = useState("");
  const [rot, Z] = useState(0);
  let piece: readonly Offset[] = shapes[tray[selected]];
  for (let j = 0; j < rot; j++) piece = rotate(piece);
  const fits = (board: number[], ids: number[]) =>
    ids.some((id) => {
      let shape: readonly Offset[] = shapes[id];
      for (let r = 0; r < 4; r++) {
        if (board.some((_, i) => place(board, side, shape, i, 1))) return true;
        shape = rotate(shape);
      }
      return false;
    });
  function put(i: number) {
    if (!active) return;
    const result = place(cells, side, piece, i, selected + 1);
    if (!result) {
      H("Mảnh chưa vừa. Hãy xoay hoặc chọn một ô trống khác.");
      return;
    }
    const earned = score + result.lines;
    Q(earned);
    B(result.next);
    tone();
    if (earned >= target) {
      finish(earned * 100 + Math.max(0, 100 - turn));
      return;
    }
    const newTray = [...tray];
    newTray[selected] = (turn + level + selected) % Math.min(6, 3 + level);
    G(newTray);
    T(turn + 1);
    Z(0);
    H(result.lines ? `Đã thu ${result.lines} hàng!` : "Đã đặt mảnh.");
    if (!fits(result.next, newTray)) finish(earned, false);
  }
  return (
    <div className="club-question">
      <strong>
        {score}/{target} hàng đã thu
      </strong>
      <div className="mosaic">
        <div className="mosaic-board">
          {cells.map((v, i) => (
            <button
              key={i}
              data-color={v}
              tabIndex={0}
              aria-label={`Hàng ${Math.floor(i / side) + 1}, cột ${(i % side) + 1}${v ? ", đã phủ" : ""}`}
              disabled={!active}
              onClick={() => put(i)}
            />
          ))}
        </div>
        <div className="mosaic-tray">
          {tray.map((v, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Mảnh ${i + 1}`}
              aria-pressed={i === selected}
              disabled={!active}
              onClick={() => {
                S(i);
                Z(0);
              }}
            >
              <span className="piece-preview">
                {(i === selected ? piece : shapes[v]).map(([x, y]) => (
                  <i
                    key={x + "," + y}
                    style={{ gridColumn: x + 1, gridRow: y + 1 }}
                  />
                ))}
              </span>
            </button>
          ))}
          <button disabled={!active} onClick={() => Z((rot + 1) % 4)}>
            ↻ Xoay
          </button>
        </div>
      </div>
      <p role="status">{hint}</p>
    </div>
  );
}
const requests = [
  ["beret", "peach", "Đi vẽ ngoài trời"],
  ["glasses", "mint", "Đến thư viện"],
  ["headphones", "lavender", "Dự lễ hội âm nhạc"],
  ["sprout", "sky", "Thăm vườn xuân"],
  ["crown", "sunshine", "Đóng vai hoàng gia"],
  ["satchel", "rose", "Khám phá rừng"],
] as const;
export function Dress({ level, profile, finish, active, tone }: PlayProps) {
  const [a, A] = useState(profile.accessory),
    [c, C] = useState(profile.color),
    [attempt, N] = useState(0),
    [hint, H] = useState("");
  const [hat, color, theme] = requests[level];
  const check = () => {
    const ok = a === hat && c === color;
    tone(ok);
    if (ok) finish(30 - attempt * 5);
    else if (attempt === 2) finish(0, false);
    else {
      N(attempt + 1);
      H(
        a !== hat
          ? "Xem lại phụ kiện trong lời nhắn."
          : "Thử màu khăn trong lời nhắn.",
      );
    }
  };
  return (
    <div className="club-question">
      <strong>{theme}</strong>
      <p>
        “Mình muốn đeo{" "}
        {ACCESSORIES.find((v) => v.id === hat)?.name.toLowerCase()} cùng khăn{" "}
        {COLORS.find((v) => v.id === color)?.name.toLowerCase()}.”
      </p>
      <div className="dress-model">
        <Companion
          kind={profile.companion}
          accessory={a}
          color={c}
          size={140}
        />
      </div>
      <div className="dress-controls">
        <label>
          Phụ kiện
          <select
            disabled={!active}
            value={a}
            onChange={(e) => A(e.target.value as typeof a)}
          >
            {ACCESSORIES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Màu khăn
          <select
            disabled={!active}
            value={c}
            onChange={(e) => C(e.target.value as typeof c)}
          >
            {COLORS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button disabled={!active} className="button primary" onClick={check}>
        Trình diễn
      </button>
      <p role="status">{hint}</p>
    </div>
  );
}
const treasures = [
    "🪶",
    "🗝️",
    "🍄",
    "🪷",
    "🐚",
    "🍃",
    "🍓",
    "🪁",
    "🐞",
    "🍋",
    "🎐",
    "🌻",
    "🪺",
    "🪵",
    "🧶",
    "🧩",
    "🪙",
    "🍁",
  ],
  treasureNames = [
    "Lông vũ",
    "Chìa khóa",
    "Nấm đỏ",
    "Hoa sen",
    "Vỏ sò",
    "Chiếc lá",
    "Dâu tây",
    "Cánh diều",
    "Bọ rùa",
    "Quả chanh",
    "Chuông gió",
    "Hoa hướng dương",
    "Tổ chim",
    "Khúc gỗ",
    "Cuộn len",
    "Mảnh ghép",
    "Đồng xu",
    "Lá phong",
  ];
export function Treasure({ level, active, finish, tone }: PlayProps) {
  const [map] = useState(() =>
      shuffle(treasures.map((_, i) => i)).slice(0, 9 + level),
    ),
    [sequence] = useState(() => shuffle(map).slice(0, 3 + level)),
    [round, R] = useState(0),
    [life, L] = useState(3),
    [hint, H] = useState("");
  function find(id: number) {
    if (!active) return;
    if (id !== sequence[round]) {
      tone(false);
      H("Thử quan sát góc khác trong vườn.");
      L(life - 1);
      if (life === 1) finish(round, false);
      return;
    }
    tone();
    if (round + 1 === sequence.length) finish(sequence.length * 10 + life);
    else {
      R(round + 1);
      H("");
    }
  }
  return (
    <div className="club-question">
      <strong>
        Tìm {treasureNames[sequence[round]].toLowerCase()} · {round + 1}/
        {sequence.length} · {life} lượt
      </strong>
      <div className="treasure-map">
        {map.map((id, i) => (
          <button
            key={id}
            onClick={() => find(id)}
            disabled={!active || sequence.slice(0, round).includes(id)}
            aria-label={treasureNames[id]}
            style={{
              left: 8 + (i % 5) * 20 + (i % 2 ? 3 : 0) + "%",
              top: 14 + Math.floor(i / 5) * 32 + (id % 3) * 4 + "%",
            }}
          >
            {treasures[id]}
          </button>
        ))}
      </div>
      <p role="status">{hint}</p>
    </div>
  );
}
export const challenges: Partial<
  Record<ClubId, React.ComponentType<PlayProps>>
> = {
  "duong-ray": Railway,
  "go-phim": Typing,
  "chop-sang": Reaction,
  "thu-vien-do": Quiz,
  "pha-mau": ColorMatch,
  "xep-khoi": BlockPuzzle,
  "thoi-trang": Dress,
  "san-kho-bau": Treasure,
};

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const gameShelf = [
  {
    id: "lat-the",
    name: "Lật lá tìm đôi",
    skill: "Trí nhớ",
    detail: "Lật hai thẻ mỗi lượt để tìm bốn cặp hình giống nhau.",
    goal: "4 cặp thẻ",
  },
  {
    id: "tinh-mat",
    name: "Mắt cú tinh anh",
    skill: "Quan sát",
    detail: "Tìm hình khác biệt giữa những ô trông gần giống nhau.",
    goal: "3 lượt tìm",
  },
  {
    id: "noi-so",
    name: "Bước chân con số",
    skill: "Chú ý",
    detail: "Theo dấu bạn nhỏ bằng cách chạm các số từ 1 đến 9.",
    goal: "9 bước",
  },
  {
    id: "quy-luat",
    name: "Ga quy luật",
    skill: "Suy luận",
    detail: "Quan sát dãy số và chọn số còn thiếu cho trạm kế tiếp.",
    goal: "3 dãy số",
  },
  {
    id: "xep-chu",
    name: "Xưởng ghép chữ",
    skill: "Ngôn ngữ",
    detail: "Đọc gợi ý rồi xếp các mảnh từ thành một thành ngữ hoặc cụm từ.",
    goal: "3 cụm từ",
  },
] as const;
export type GameId = (typeof gameShelf)[number]["id"];

export function numberPuzzle(round: number) {
  const start = 2 + Math.floor(Math.random() * 7);
  const step = 2 + Math.floor(Math.random() * 4);
  const seq = Array.from({ length: 5 }, (_, i) => {
    if (round === 1) return start * 2 ** i;
    if (round === 2) return start + (4 - i) * step;
    return start + i * step;
  });
  const answer = seq[4];
  return {
    shown: seq.slice(0, 4),
    answer,
    options: shuffle([answer, answer + 1, answer - 1, answer + step]),
  };
}

export const phrases = [
  {
    clue: "Kiên trì mài sắt sẽ làm được điều gì?",
    words: ["Có công", "mài sắt,", "có ngày", "nên kim"],
  },
  {
    clue: "Bốn chữ nhắc ta nhớ ơn người đi trước.",
    words: ["Uống", "nước", "nhớ", "nguồn"],
  },
  {
    clue: "Càng đi nhiều, ta càng học được nhiều điều.",
    words: ["Đi", "một ngày đàng,", "học", "một sàng khôn"],
  },
  {
    clue: "Khi hưởng thành quả, hãy nhớ đến người tạo nên nó.",
    words: ["Ăn quả", "nhớ", "kẻ", "trồng cây"],
  },
  {
    clue: "Việc hôm nay có thể làm nên việc lớn ngày mai.",
    words: ["Tích", "tiểu", "thành", "đại"],
  },
];

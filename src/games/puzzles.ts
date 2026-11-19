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
    detail: "Lật hai thẻ mỗi lượt để tìm các cặp hình giống nhau.",
  },
  {
    id: "tinh-mat",
    name: "Mắt cú tinh anh",
    skill: "Quan sát",
    detail: "Tìm hình khác biệt giữa những ô trông gần giống nhau.",
  },
  {
    id: "noi-so",
    name: "Bước chân con số",
    skill: "Chú ý",
    detail: "Theo dấu bạn nhỏ bằng cách chạm các số theo thứ tự của chặng.",
  },
  {
    id: "quy-luat",
    name: "Ga quy luật",
    skill: "Suy luận",
    detail: "Quan sát dãy số và chọn số còn thiếu cho trạm kế tiếp.",
  },
  {
    id: "xep-chu",
    name: "Xưởng ghép chữ",
    skill: "Ngôn ngữ",
    detail: "Đọc gợi ý rồi xếp các mảnh từ thành một thành ngữ hoặc cụm từ.",
  },
] as const;
export type GameId = (typeof gameShelf)[number]["id"];

export const quickTitles: Record<GameId, string[]> = {
  "lat-the": [
    "Bốn cặp lá",
    "Thêm một nhành",
    "Vườn sáu sắc",
    "Tán cây rộng",
    "Khu vườn đêm",
    "Bộ sưu tập lớn",
  ],
  "tinh-mat": [
    "Dấu hiệu đầu",
    "Một rừng hình",
    "Tìm trong tán lá",
    "Đổi hướng nhìn",
    "Mắt cú đêm",
    "Thợ săn chi tiết",
  ],
  "noi-so": [
    "Đếm tới chín",
    "Đi lùi",
    "Nhịp số chẵn",
    "Số lẻ đi lùi",
    "Bước nhảy ba",
    "Hai đầu gặp nhau",
  ],
  "quy-luat": [
    "Trạm khởi hành",
    "Nhịp tăng dần",
    "Đổi bước",
    "Bình phương",
    "Hai số liền trước",
    "Ga giao nhau",
  ],
  "xep-chu": [
    "Lời quen thuộc",
    "Cùng học",
    "Tình bạn",
    "Nhìn ra thế giới",
    "Góp sức",
    "Kho tàng tục ngữ",
  ],
};
export const pairsAt = (level: number) => 4 + level;
export const searchSize = (level: number) => [12, 16, 16, 20, 20, 24][level];
export const searchRounds = (level: number) => [3, 3, 4, 4, 5, 5][level];
export function numberTrail(level: number) {
  const size = [9, 10, 12, 12, 15, 16][level];
  return Array.from({ length: size }, (_, i) => {
    switch (level) {
      case 1:
        return size - i;
      case 2:
        return (i + 1) * 2;
      case 3:
        return (size - i) * 2 - 1;
      case 4:
        return (i + 1) * 3;
      case 5:
        return i % 2 ? size - (i - 1) / 2 : 1 + i / 2;
      default:
        return i + 1;
    }
  });
}
export const trailHints = [
  "Đếm từ 1 đến 9.",
  "Đếm ngược từ 10 về 1.",
  "Đếm thêm 2, bắt đầu từ số 2.",
  "Đi ngược qua các số lẻ, bắt đầu từ 23.",
  "Mỗi bước tăng thêm 3.",
  "Luân phiên hai đầu: 1, 16, 2, 15…",
];
export function numberPuzzle(round: number, level = 0) {
  const start = 2 + Math.floor(Math.random() * 6),
    step = 2 + Math.floor(Math.random() * 4);
  const types = [
    [0, 1, 2],
    [0, 3, 2, 3],
    [4, 2, 3, 4],
    [5, 3, 1, 5],
    [6, 4, 5, 6],
    [3, 4, 5, 6, 1],
  ];
  const type = types[level][round % types[level].length],
    length = level > 1 || type === 3 ? 6 : 5;
  const seq: number[] = [];
  for (let i = 0; i < length; i++) {
    let n = start + i * step;
    if (type === 1) n = start * 2 ** i;
    if (type === 2) n = start + (length - 1 - i) * step;
    if (type === 3) n = start + (i * (i + 1)) / 2;
    if (type === 4)
      n = start + Math.floor(i / 2) * (step + 1) + (i % 2 === 1 ? step : 0);
    if (type === 5) n = (start + i) ** 2;
    if (type === 6) n = i < 2 ? start + i : seq[i - 2] + seq[i - 1];
    seq.push(n);
  }
  const answer = seq.pop()!;
  return {
    hint: [
      "Thử tìm khoảng cách giữa hai số liền nhau.",
      "Thử nhân đôi số đứng trước.",
      "Thử xem mỗi bước đã bớt đi bao nhiêu.",
      "Hãy viết các khoảng cách ra. Mỗi khoảng tăng thêm một đơn vị.",
      "Hai bước nhảy khác nhau đang luân phiên.",
      "Hãy thử các số chính phương liên tiếp.",
      "Thử cộng hai số liền trước.",
    ][type],
    shown: seq,
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

type Phrase = (typeof phrases)[number];
function saying(clue: string, parts: string): Phrase {
  return { clue, words: parts.split("|") };
}
export const wordSets: Phrase[][] = [
  phrases,
  [
    saying(
      "Học từ điều giản dị nhất trước khi làm việc lớn.",
      "Học|ăn,|học|nói,|học|gói,|học|mở",
    ),
    saying("Việc học gắn liền với thực hành.", "Học|đi|đôi|với|hành"),
    saying(
      "Ai cũng có thể dạy ta một điều hay, kể cả bạn cùng lớp.",
      "Học thầy|không tày|học|bạn",
    ),
  ],
  [
    saying("Một người giúp đỡ một người lúc khó khăn.", "Lá|lành|đùm|lá|rách"),
    saying("Tập thể cùng giúp nhau vượt qua một việc.", "Chung|lưng|đấu|cật"),
    saying(
      "Dù khác nhau, hãy biết yêu thương nhau.",
      "Bầu ơi|thương lấy|bí cùng,|tuy rằng|khác giống|nhưng chung|một giàn",
    ),
  ],
  [
    saying(
      "Ông bà nhắc mình quý thời gian như kim loại quý.",
      "Thời|gian|là|vàng|bạc",
    ),
    saying(
      "Trước khi nói, hãy cẩn thận như khi lựa lời.",
      "Lời nói|chẳng mất|tiền mua,|lựa lời|mà nói|cho vừa|lòng nhau",
    ),
    saying(
      "Nhiều trải nghiệm mở rộng hiểu biết của mình.",
      "Đi|một|ngày|đàng,|học|một|sàng|khôn",
    ),
  ],
  [
    saying(
      "Nhiều cây hợp lại có thể làm nên việc lớn.",
      "Một cây|làm chẳng|nên non,|ba cây|chụm lại|nên hòn|núi cao",
    ),
    saying("Ghé vai nhau để cùng làm việc khó.", "Đồng|tâm|hiệp|lực"),
    saying(
      "Món quà đúng lúc khó khăn là quý nhất.",
      "Một miếng|khi đói|bằng|một gói|khi no",
    ),
  ],
  [
    saying("Dòng nước bền bỉ cũng làm thay đổi đá.", "Nước|chảy|đá|mòn"),
    saying(
      "Điều ta tự mình trải nghiệm sẽ rất dễ nhớ.",
      "Trăm|hay|không|bằng|tay|quen",
    ),
    saying(
      "Không có con đường ngắn đến thành thạo.",
      "Có công|mài|sắt,|có|ngày|nên|kim",
    ),
    saying(
      "Hãy cẩn thận trước khi đưa ra quyết định.",
      "Uốn|lưỡi|bảy|lần|trước|khi|nói",
    ),
  ],
];

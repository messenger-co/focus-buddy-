export type CompanionKind = "fox" | "owl" | "cat";
export type CompanionColor = "mint" | "lavender" | "peach";
export type Mood = "great" | "okay" | "tired";

export const COMPANIONS: {
  id: CompanionKind;
  name: string;
  description: string;
}[] = [
  {
    id: "fox",
    name: "Cáo Mây",
    description: "Tò mò, ấm áp và luôn tin vào bạn.",
  },
  {
    id: "owl",
    name: "Cú Mơ",
    description: "Điềm tĩnh, thông thái và thích những câu hỏi hay.",
  },
  {
    id: "cat",
    name: "Mèo Mít",
    description: "Dịu dàng, vui tính và rất giỏi cổ vũ.",
  },
];

export const COLORS: { id: CompanionColor; name: string; hex: string }[] = [
  { id: "mint", name: "Xanh bạc hà", hex: "#9AC6AC" },
  { id: "lavender", name: "Tím hoa cà", hex: "#B5A4D1" },
  { id: "peach", name: "Hồng đào", hex: "#EAA690" },
];

export interface Exercise {
  id: string;
  title: string;
  subject: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  reward: number;
}

export const EXERCISES: Exercise[] = [
  {
    id: "logic-1",
    title: "Khám phá quy luật",
    subject: "Tư duy",
    question: "Số tiếp theo trong dãy 2, 4, 8, … là bao nhiêu?",
    options: ["10", "12", "16", "18"],
    answer: 2,
    reward: 30,
    explanation:
      "Mỗi số gấp đôi số đứng trước: 2 × 2 = 4, 4 × 2 = 8, nên 8 × 2 = 16. Bạn đã tìm ra quy luật rồi!",
  },
  {
    id: "science-1",
    title: "Bí mật của chiếc lá",
    subject: "Khoa học",
    question: "Cây xanh sử dụng nguồn năng lượng nào để quang hợp?",
    options: ["Khí ôxy", "Ánh sáng mặt trời", "Cát", "Âm thanh"],
    answer: 1,
    reward: 30,
    explanation:
      "Lá cây hấp thụ ánh sáng mặt trời để tạo chất dinh dưỡng từ nước và khí cacbonic. Quá trình này gọi là quang hợp và còn giải phóng khí ôxy.",
  },
  {
    id: "language-1",
    title: "Khu vườn ngôn từ",
    subject: "Tiếng Việt",
    question: "Từ nào dưới đây gần nghĩa nhất với “chăm chỉ”?",
    options: ["Siêng năng", "Vội vàng", "Lười biếng", "Chậm chạp"],
    answer: 0,
    reward: 30,
    explanation:
      "“Siêng năng” và “chăm chỉ” đều chỉ sự cố gắng, chịu khó làm việc hoặc học tập. Mỗi bước nhỏ bạn hoàn thành hôm nay cũng là một biểu hiện của sự chăm chỉ.",
  },
];

// Đây là các nhân vật hư cấu dành riêng cho chế độ dùng thử.
export const FICTIONAL_LEADERBOARD: { name: string; xp: number }[] = [
  { name: "Mầm Xanh", xp: 840 },
  { name: "Mây Nhỏ", xp: 720 },
  { name: "Nắng Mai", xp: 610 },
  { name: "Sao Biển", xp: 490 },
  { name: "Lá Non", xp: 360 },
];

export const ACHIEVEMENTS = [
  {
    id: "first-step",
    title: "Bước đầu tiên",
    description: "Chia sẻ cảm xúc trong ngày đầu tiên.",
    icon: "🌱",
    requirement: 1,
  },
  {
    id: "deep-focus",
    title: "Tập trung hết mình",
    description: "Hoàn thành phiên tập trung đầu tiên.",
    icon: "🍃",
    requirement: 1,
  },
  {
    id: "curious-mind",
    title: "Nhà thám hiểm nhỏ",
    description: "Hoàn thành cả ba bài tập khám phá.",
    icon: "🔎",
    requirement: 3,
  },
  {
    id: "growing-star",
    title: "Ngôi sao đang lớn",
    description: "Tích lũy 100 điểm kinh nghiệm.",
    icon: "⭐",
    requirement: 100,
  },
] as const;

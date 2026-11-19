import {paletteLibrary,palette,type ThemeId} from "./foundation/themes";
export type CompanionKind =
  | "fox"
  | "owl"
  | "cat"
  | "rabbit"
  | "panda"
  | "dragon"
  | "axolotl"
  | "penguin";
export type CompanionColor =
  | "mint"
  | "lavender"
  | "peach"
  | "sky"
  | "sunshine"
  | "rose";
export type BuddyAccessory =
  | "none"
  | "bow"
  | "glasses"
  | "crown"
  | "beret"
  | "headphones"
  | "satchel"
  | "sprout";
export type BuddyScene = "garden" | "space" | "sunset";
export const THEMES = paletteLibrary.map(([id,name])=>{
  const p=palette(id);return {id,name,tones:[p["--study-ink"],p["--study-mid"],p["--study-pale"]]};
});
export type StudyTheme=ThemeId;
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
  {
    id: "rabbit",
    name: "Thỏ Bông",
    description: "Nhẹ nhàng, thích hoa và những ý tưởng mới.",
  },
  {
    id: "panda",
    name: "Gấu Trúc",
    description: "Một cái ôm mềm mại sau mỗi giờ học.",
  },
  {
    id: "dragon",
    name: "Rồng Đậu",
    description: "Nhỏ xíu nhưng mang trong mình ước mơ thật lớn.",
  },
  {
    id: "axolotl",
    name: "Kỳ giông Đào",
    description: "Mang theo màu san hô và cả một túi câu hỏi tò mò.",
  },
  {
    id: "penguin",
    name: "Cánh Cụt Băng",
    description: "Bước từng bước nhỏ và luôn nhớ đường về cùng bạn.",
  },
];

export const COLORS: { id: CompanionColor; name: string; hex: string }[] = [
  { id: "mint", name: "Xanh bạc hà", hex: "#9AC6AC" },
  { id: "lavender", name: "Tím hoa cà", hex: "#B5A4D1" },
  { id: "peach", name: "Hồng đào", hex: "#EAA690" },
  { id: "sky", name: "Xanh trời", hex: "#87B8DE" },
  { id: "sunshine", name: "Vàng nắng", hex: "#DBB968" },
  { id: "rose", name: "Hồng phấn", hex: "#D895B2" },
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

export const ACCESSORIES: {
  id: BuddyAccessory;
  name: string;
  symbol: string;
}[] = [
  { id: "none", name: "Tự nhiên", symbol: "✧" },
  { id: "bow", name: "Nơ xinh", symbol: "🎀" },
  { id: "glasses", name: "Kính tròn", symbol: "👓" },
  { id: "crown", name: "Vương miện", symbol: "👑" },
  { id: "beret", name: "Mũ họa sĩ", symbol: "🎨" },
  { id: "headphones", name: "Tai nghe", symbol: "🎧" },
  { id: "satchel", name: "Túi thám hiểm", symbol: "🎒" },
  { id: "sprout", name: "Kẹp mầm non", symbol: "🌱" },
];
export const SCENES: { id: BuddyScene; name: string; description: string }[] = [
  { id: "garden", name: "Vườn nhỏ", description: "Lá xanh và chút bình yên" },
  { id: "space", name: "Ngân hà", description: "Đi tìm những vì sao" },
  { id: "sunset", name: "Hoàng hôn", description: "Nắng ấm cuối ngày" },
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

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
  | "sprout"
  | "flower"
  | "beanie"
  | "star"
  | "wizard";
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
  {
    id: "math-1",
    title: "Góc bí ẩn của tam giác",
    subject: "Toán học",
    question: "Một tam giác có hai góc bằng 50° và 60°. Góc còn lại bằng bao nhiêu độ?",
    options: ["60°", "70°", "80°", "90°"],
    answer: 1,
    reward: 30,
    explanation:
      "Tổng ba góc trong một tam giác luôn bằng 180°. Vậy góc còn lại là 180° − (50° + 60°) = 70°.",
  },
  {
    id: "informatics-1",
    title: "Ngôn ngữ nhị phân",
    subject: "Tin học",
    question: "Số nhị phân 1010 biểu diễn số nào trong hệ thập phân?",
    options: ["8", "10", "12", "14"],
    answer: 1,
    reward: 30,
    explanation:
      "1010₂ = 1×8 + 0×4 + 1×2 + 0×1 = 10. Mỗi vị trí trong hệ nhị phân là một lũy thừa của 2.",
  },
  {
    id: "english-1",
    title: "Chọn từ nối tinh tế",
    subject: "Tiếng Anh",
    question: "Điền từ phù hợp: “She studied very hard, ___ she passed the exam easily.”",
    options: ["but", "so", "although", "or"],
    answer: 1,
    reward: 30,
    explanation:
      "“so” dùng để chỉ kết quả (vì vậy / cho nên). Học chăm chỉ là nguyên nhân dẫn tới kết quả vượt qua kỳ thi dễ dàng.",
  },
  {
    id: "geography-1",
    title: "Vòng tuần hoàn của nước",
    subject: "Khoa học",
    question: "Quá trình hơi nước bay lên cao, gặp lạnh tạo thành mây được gọi là gì?",
    options: ["Bay hơi", "Ngưng tụ", "Đông đặc", "Nóng chảy"],
    answer: 1,
    reward: 30,
    explanation:
      "Khi hơi nước lên cao gặp không khí lạnh, chúng chuyển thành các hạt nước li ti tạo nên mây — đó là sự ngưng tụ.",
  },
  {
    id: "logic-2",
    title: "Chiếc đồng hồ thông minh",
    subject: "Tư duy",
    question: "Nếu 3 máy in cùng in 3 trang trong 3 phút, thì 6 máy in cùng in 6 trang mất mấy phút?",
    options: ["1 phút", "3 phút", "6 phút", "9 phút"],
    answer: 1,
    reward: 30,
    explanation:
      "Mỗi máy in mất đúng 3 phút để in 1 trang. Khi 6 máy chạy song song, mỗi máy vẫn chỉ in 1 trang nên tổng thời gian vẫn là 3 phút!",
  },
  {
    id: "skills-1",
    title: "Bí quyết ghi nhớ bền lâu",
    subject: "Kỹ năng học",
    question: "Cách nào sau đây giúp não bộ ghi nhớ kiến thức sâu và lâu nhất?",
    options: [
      "Đọc lướt thật nhanh một lần trước giờ kiểm tra",
      "Tự gấp sách lại và diễn đạt lại ý chính bằng lời của mình",
      "Chép nguyên văn cả trang sách mà không suy nghĩ",
      "Học liền 4 tiếng không nghỉ",
    ],
    answer: 1,
    reward: 30,
    explanation:
      "Chủ động gợi nhớ (Active Recall) bằng cách tự diễn đạt lại giúp củng cố đường dẫn thần kinh hiệu quả hơn nhiều so với chỉ đọc lại thụ động.",
  },
];

export const DAILY_QUOTES: string[] = [
  "Chậm cũng được, miễn là bạn vẫn bước tiếp.",
  "Một phiên tập trung 20 phút trọn vẹn hơn cả giờ ngồi lơ đãng.",
  "Mỗi câu hỏi khó đều là một cơ hội để bộ não mạnh mẽ hơn.",
  "Đừng chờ cảm hứng đến — hãy bắt đầu 5 phút, cảm hứng sẽ theo sau.",
  "Nghỉ ngơi đúng lúc cũng là một phần quan trọng của việc học giỏi.",
  "Hôm nay bạn chỉ cần tiến bộ hơn chính mình hôm qua một chút thôi.",
  "Chia việc lớn thành những bước nhỏ, bạn sẽ thấy mọi thứ nhẹ nhàng hơn.",
  "Ghi lại điều vừa hiểu giúp kiến thức ở lại lâu gấp nhiều lần.",
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
  { id: "flower", name: "Vòng hoa", symbol: "🌸" },
  { id: "beanie", name: "Mũ len", symbol: "🧢" },
  { id: "star", name: "Ngôi sao", symbol: "⭐" },
  { id: "wizard", name: "Mũ phép thuật", symbol: "🪄" },
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
  {
    id: "steady-habit",
    title: "Thói quen vững vàng",
    description: "Hoàn thành ít nhất 3 phiên tập trung.",
    icon: "🔥",
    requirement: 3,
  },
  {
    id: "curious-scholar",
    title: "Học giả chăm chỉ",
    description: "Giải đúng ít nhất 6 bài luyện tập.",
    icon: "📚",
    requirement: 6,
  },
] as const;

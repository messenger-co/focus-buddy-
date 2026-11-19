export const rooms = [
  [
    "tu-hoc",
    "Bàn tự học",
    "Cùng đặt mục tiêu học hôm nay.",
    "Viết một mục tiêu có thể hoàn thành trong 20 phút, rồi chia thành hai bước.",
  ],
  [
    "toan",
    "Toán học",
    "Chia sẻ cách giải và kiểm tra kết quả.",
    "Vẽ ba hình chữ nhật cùng chu vi. Diện tích của chúng thay đổi ra sao?",
  ],
  [
    "khoa-hoc",
    "Khoa học",
    "Cùng đặt giả thuyết và giải thích hiện tượng.",
    "Hai chậu cây giống nhau nhận lượng ánh sáng khác nhau. Bạn sẽ giữ những yếu tố nào như nhau?",
  ],
  [
    "tieng-anh",
    "Tiếng Anh",
    "Luyện từ và cách diễn đạt.",
    "Viết ba câu tiếng Anh mô tả một thói quen học tập, rồi kiểm tra các động từ.",
  ],
  [
    "doc-sach",
    "Góc văn học",
    "Đọc, cảm nhận và phân tích tác phẩm.",
    "Chọn một chi tiết làm bạn nhớ nhất trong câu chuyện và giải thích vì sao.",
  ],
  [
    "go-bai",
    "Cùng gỡ bài",
    "Nói rõ bước mà bạn đang gặp khó.",
    "Tách bài tập thành ba phần: điều đã biết, điều cần tìm và bước đầu tiên.",
  ],
  [
    "meo-hoc",
    "Mẹo học",
    "Chia sẻ cách học đã thử.",
    "Gấp sách lại và ghi ba ý vừa học. Mở sách để đối chiếu.",
  ],
  [
    "on-thi",
    "Ôn thi",
    "Lập kế hoạch ôn tập vừa sức.",
    "Chọn hai chủ đề cần ôn và đặt lịch nghỉ giữa hai lượt học.",
  ],
  [
    "so-thich",
    "Trò chơi và sở thích",
    "Trao đổi sở thích trong giờ nghỉ.",
    "Thiết kế trên giấy một thử thách ngắn rồi viết luật sao cho bạn khác chơi được.",
  ],
] as const;
export const aliases = ["Mây", "Trúc", "Lá", "Sao", "Mầm", "Nắng"].flatMap(
  (noun) =>
    ["Nhỏ", "Xanh", "Vui", "Hiền", "Sáng", "Ấm"].map((adj) => noun + " " + adj),
);
export const buddies: Record<string, string> = {
  fox: "🦊",
  owl: "🦉",
  cat: "🐱",
  rabbit: "🐰",
  panda: "🐼",
  dragon: "🐉",
  axolotl: "🦎",
  penguin: "🐧",
};
export const themes: Record<string, string> = {
  forest: "Đồng cỏ",
  ocean: "Đại dương",
  sunset: "Hoàng hôn",
};
export const interests = [
  "",
  "Toán",
  "Văn học",
  "Ngoại ngữ",
  "Khoa học",
  "Nghệ thuật",
];
export const reportReasons: Record<string, string> = {
  spam: "Lặp tin hoặc quảng cáo",
  contact: "Thông tin liên hệ",
  hurtful: "Nội dung gây tổn thương",
  other: "Cần người điều hành xem lại",
};

/** Tình huống và tiêu chí từ bộ tài liệu “CÂU HỎI CHAT BOT (2)” của dự án.
 * Bản thử nghiệm lưu câu trả lời trên thiết bị; KHÔNG gọi AI để chấm tự động. */
export type ChallengeQuestion = { prompt: string; rubric: string };
export type FocusChallenge = {
  id: string;
  title: string;
  topic: string;
  scenario: string;
  questions: readonly ChallengeQuestion[];
};
export const CHALLENGES: readonly FocusChallenge[] = [
  {
    id: "hanh-tinh-xanh",
    title: "Giải cứu hành tinh xanh",
    topic: "Khoa học · Trách nhiệm cộng đồng",
    scenario: "Sau giờ ra chơi, sân trường có chai nhựa, túi nilon và vỏ bánh. Một số vòi nước vẫn chảy và thùng rác chưa được phân loại. Em hãy đề xuất kế hoạch giúp trường xanh, sạch và tiết kiệm tài nguyên.",
    questions: [
      { prompt: "Vì sao rác thải nhựa ảnh hưởng lâu dài tới môi trường? Nêu hai việc giảm rác nhựa tại trường.", rubric: "Nêu tác hại của nhựa và hai giải pháp thực tế, phù hợp." },
      { prompt: "Ai có trách nhiệm giữ gìn vệ sinh trường học? Vì sao?", rubric: "Thấy được trách nhiệm chung của học sinh, nhà trường và cộng đồng." },
      { prompt: "30 học sinh dùng một chai nhựa mỗi ngày. Giảm một nửa trong 5 ngày thì bớt được bao nhiêu chai?", rubric: "30 × 5 × 50% = 75 chai nhựa." },
      { prompt: "Em sẽ nhắc một người bạn vứt vỏ bánh xuống sân như thế nào để vẫn thân thiện?", rubric: "Nhắc lịch sự, tôn trọng, không chế giễu hoặc gây mâu thuẫn." },
      { prompt: "Viết khẩu hiệu tối đa 12 từ kêu gọi bảo vệ môi trường học đường.", rubric: "Ngắn gọn, sáng tạo, tích cực và phù hợp chủ đề." }
    ]
  },
  {
    id: "bi-mat-suc-khoe",
    title: "Giải mã bí mật sức khỏe",
    topic: "Sức khỏe · Thói quen học tập",
    scenario: "Một số học sinh thức khuya, bỏ bữa sáng, dùng điện thoại nhiều giờ và ít vận động nên thường mệt và khó tập trung. Em trở thành Đại sứ sức khỏe học đường.",
    questions: [
      { prompt: "Vì sao cơ thể cần đủ nước mỗi ngày? Nêu hai dấu hiệu thường gặp khi thiếu nước.", rubric: "Nêu vai trò của nước và hai dấu hiệu thiếu nước phù hợp." },
      { prompt: "Thức khuya, bỏ bữa sáng và ít vận động ảnh hưởng thế nào tới học tập, sinh hoạt?", rubric: "Nêu ảnh hưởng tới sức khỏe, tinh thần và khả năng học tập." },
      { prompt: "Giảm xem video giải trí từ 3 giờ xuống 1 giờ mỗi ngày thì 7 ngày tiết kiệm bao nhiêu giờ?", rubric: "(3 − 1) × 7 = 14 giờ." },
      { prompt: "Bạn em hay buồn, ít giao tiếp và thức khuya xem điện thoại. Em làm gì để giúp bạn?", rubric: "Lắng nghe, động viên và gợi ý tìm sự hỗ trợ từ người lớn đáng tin cậy khi cần." },
      { prompt: "Viết thời gian biểu ngắn gồm 4 việc giúp khỏe mạnh và tập trung hơn.", rubric: "Bốn việc làm thiết thực, hợp lý và phù hợp lịch sinh hoạt." }
    ]
  },
  {
    id: "hanh-trinh-an-toan",
    title: "Giải mã hành trình an toàn",
    topic: "An toàn giao thông · Kỹ năng sống",
    scenario: "Trên đường đến trường, có học sinh đi xe đạp dàn hàng, một bạn vừa dùng điện thoại vừa điều khiển xe đạp điện; người đi bộ qua đường khi đèn chưa cho phép. Em là tuyên truyền viên an toàn giao thông.",
    questions: [
      { prompt: "Vì sao phương tiện đang chạy không thể dừng ngay khi phát hiện chướng ngại? Nêu yếu tố tăng nguy cơ va chạm.", rubric: "Giải thích quán tính hoặc thời gian phản ứng; nêu ví dụ như tốc độ cao, mất tập trung, đường trơn." },
      { prompt: "Vì sao phải tuân thủ đèn tín hiệu, biển báo và luật giao thông?", rubric: "Hiểu tác dụng bảo đảm an toàn và hậu quả của việc đi tùy tiện." },
      { prompt: "Đi 2 km với tốc độ trung bình 10 km/giờ cần bao nhiêu phút?", rubric: "2 ÷ 10 × 60 = 12 phút." },
      { prompt: "Em khuyên bạn vừa dùng điện thoại vừa đi xe đạp điện thế nào để không làm bạn ngại?", rubric: "Khuyên chân thành, lịch sự và đề nghị không dùng điện thoại khi đang điều khiển xe." },
      { prompt: "Đề xuất ba việc để học sinh đi lại văn minh, an toàn.", rubric: "Ba hành động cụ thể, phù hợp lứa tuổi và quy định." }
    ]
  },
  {
    id: "an-toan-mang",
    title: "Giải mã cạm bẫy không gian mạng",
    topic: "An toàn số · Quyền riêng tư",
    scenario: "Một tài khoản lạ báo trúng thưởng và yêu cầu nhập mật khẩu; người mới quen trên mạng hỏi địa chỉ, rủ gặp riêng. Một số bạn chia sẻ hình ảnh người khác khi chưa được đồng ý.",
    questions: [
      { prompt: "Vì sao không nhấn liên kết lạ hoặc tiết lộ mật khẩu, OTP? Nêu hai nguy cơ.", rubric: "Nhận diện nguy cơ bị lừa đảo, lộ thông tin, mất tài khoản hoặc tài sản." },
      { prompt: "Vì sao cần tôn trọng riêng tư của người khác khi đăng ảnh và thông tin?", rubric: "Giải thích được quyền riêng tư và sự tôn trọng người khác." },
      { prompt: "Mỗi ngày dùng Internet 2 giờ, trong đó học 45 phút. Sau 7 ngày, thời gian giải trí là bao lâu?", rubric: "Mỗi ngày 75 phút; cả tuần 525 phút = 8 giờ 45 phút." },
      { prompt: "Người quen qua mạng yêu cầu gửi ảnh riêng tư và giữ bí mật. Em xử lý thế nào?", rubric: "Không gửi, dừng trao đổi và tìm hỗ trợ từ cha mẹ, thầy cô hoặc người lớn đáng tin cậy." },
      { prompt: "Đề xuất năm nguyên tắc sử dụng Internet an toàn, văn minh.", rubric: "Năm nguyên tắc cụ thể, khả thi và có trách nhiệm." }
    ]
  },
  {
    id: "khong-bat-nat",
    title: "Nói không với bạo lực học đường",
    topic: "Tình bạn · Ứng xử văn minh",
    scenario: "Một bạn bị đặt biệt danh chế giễu và cô lập; có người ghi hình xô xát rồi đăng mạng. Nhiều người thấy nhưng ngại lên tiếng. Em tham gia nhóm Trường học thân thiện.",
    questions: [
      { prompt: "Bạo lực học đường là gì? Nêu ba biểu hiện.", rubric: "Nhận diện bạo lực thể chất, lời nói, tinh thần hoặc trên mạng." },
      { prompt: "Bạo lực học đường ảnh hưởng ra sao tới người bị hại, người gây ra và cả lớp?", rubric: "Nêu hậu quả đối với sức khỏe, cảm xúc, học tập và môi trường học." },
      { prompt: "Một bạn bị năm người chế giễu, cô lập trên mạng. Đây có thể là bạo lực học đường không? Vì sao?", rubric: "Trả lời có; giải thích hành vi bắt nạt, cô lập trên mạng." },
      { prompt: "Nếu chứng kiến bạn bị bắt nạt, em có thể làm ít nhất bốn việc gì để hỗ trợ an toàn?", rubric: "Không cổ vũ; báo người lớn; hỗ trợ an toàn; không chia sẻ video; động viên bạn." },
      { prompt: "Đề xuất năm việc xây dựng lớp đoàn kết, không có bạo lực.", rubric: "Năm hành động tích cực, cụ thể và thiết thực." }
    ]
  }
];

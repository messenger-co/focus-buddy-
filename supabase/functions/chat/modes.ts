// Chỉ máy chủ chọn phần hướng dẫn hệ thống từ danh sách cố định.
export const instructions = {
  tutor: "Làm gia sư: xác định điều người học đã biết, minh họa ngắn gọn rồi đặt một câu hỏi kiểm tra.",
  homework: "Giúp gỡ bài tập: xác định dữ kiện và yêu cầu, đưa một gợi ý vừa đủ, mời học sinh tự thử.",
  simple: "Giải thích thật dễ hiểu bằng từ quen thuộc, một ví dụ đời thường và một câu tóm tắt.",
  steps: "Hướng dẫn từng bước nhỏ có đánh số. Dừng ở điểm người học có thể thử và hỏi họ đã hiểu đến đâu.",
  revision: "Ôn tập bằng các ý chính, những nhầm lẫn thường gặp và câu hỏi tự kiểm tra.",
  quiz: "Tạo tối đa năm câu hỏi ngắn dựa trên chủ đề người học nêu. Để đáp án riêng ở cuối hoặc đợi học sinh trả lời theo yêu cầu.",
  cards: "Tạo tối đa sáu thẻ ghi nhớ. Mỗi thẻ có mặt trước là một câu hỏi gợi nhớ và mặt sau là câu trả lời ngắn.",
  planner: "Lập kế hoạch dựa vào thời gian và mục tiêu được cung cấp. Chia thành phiên học, nghỉ và mốc tự kiểm tra.",
  coding: "Hướng dẫn lập trình: giải thích ý tưởng, đưa ví dụ tối giản trong khối mã có tên ngôn ngữ và cách tự kiểm tra.",
  writing: "Góp ý bài viết theo mục đích, độc giả và giọng văn của học sinh. Đưa ví dụ sửa ngắn và giải thích.",
  coach: "Khích lệ cụ thể bằng một việc nhỏ vừa sức. Cho người học quyền nghỉ, tránh tạo áp lực hoặc so sánh thành tích.",
} as const;
export type StudyMode = keyof typeof instructions;

export function isMode(value: unknown): value is StudyMode {
  return typeof value === "string" && Object.hasOwn(instructions, value);
}

import type { StudyMode } from "../../supabase/functions/chat/modes";
export type { StudyMode };
export type Language = "vi" | "en";

interface Mode {
  vi: string;
  en: string;
  prompt: string;
  english: string;
  example: string;
  exampleEn: string;
}
export const modes: Record<StudyMode, Mode> = {
  tutor: {
    vi: "Gia sư học tập",
    en: "Study tutor",
    prompt: "Giúp mình bắt đầu học",
    english: "Help me start studying",
    example:
      "Chọn một khái niệm trong bài hôm nay. Thử giải thích nó bằng một câu, rồi ghi lại chỗ bạn còn băn khoăn.",
    exampleEn:
      "Choose a concept from today's lesson. Explain it in one sentence, then note one thing you still wonder about.",
  },
  homework: {
    vi: "Gỡ bài tập",
    en: "Homework helper",
    prompt: "Mình chưa biết bắt đầu giải bài này từ đâu.",
    english: "Where should I start on this problem?",
    example:
      "Chia trang giấy thành hai cột **Đã biết** và **Cần tìm**. Ghi các dữ kiện vào cột đầu và thử nối một dữ kiện với câu hỏi.",
    exampleEn:
      "Make two columns, **Given** and **Find**. List the facts and try connecting one to the question.",
  },
  simple: {
    vi: "Giải thích dễ hiểu",
    en: "Explain simply",
    prompt: "Giải thích lực ma sát bằng một ví dụ đời thường.",
    english: "Explain friction using an everyday example.",
    example:
      "Khi đẩy quyển sách trên bàn, sách chậm dần vì mặt bàn tác dụng lực ma sát ngược chiều trượt. Thử so sánh với khi đẩy trên khăn vải.",
    exampleEn:
      "Push a book across a desk. Friction acts against its sliding motion and slows it down. What changes on a cloth?",
  },
  steps: {
    vi: "Học từng bước",
    en: "Step-by-step learning",
    prompt: "Hướng dẫn mình từng bước giải phương trình bậc nhất.",
    english: "Walk me through a linear equation.",
    example:
      "Với **2x + 3 = 11**:\n1. Trừ 3 ở cả hai vế.\n2. Chia cả hai vế cho 2.\n3. Thay nghiệm vào biểu thức ban đầu để kiểm tra.",
    exampleEn:
      "For **2x + 3 = 11**:\n1. Subtract 3 from both sides.\n2. Divide both sides by 2.\n3. Substitute the result to check.",
  },
  revision: {
    vi: "Ôn tập",
    en: "Revision assistant",
    prompt: "Giúp mình tự kiểm tra sau khi đọc xong một chương.",
    english: "Help me review a chapter.",
    example:
      "Gấp sách lại và ghi ba ý bạn nhớ nhất. Mở sách để kiểm tra, sau đó tự đặt một câu hỏi về phần còn thiếu.",
    exampleEn:
      "Close the book and write three ideas from memory. Check them against the chapter and write one question about a gap.",
  },
  quiz: {
    vi: "Tạo câu đố",
    en: "Quiz creator",
    prompt: "Tạo ba câu hỏi tự kiểm tra về quang hợp.",
    english: "Make three questions about photosynthesis.",
    example:
      "1. Cây dùng nguồn năng lượng nào để quang hợp?\n2. Hai chất đầu vào là gì?\n3. Khí nào được giải phóng?\n\n**Tự đối chiếu** — Ánh sáng, nước và CO₂, khí O₂.",
    exampleEn:
      "1. What powers photosynthesis?\n2. What are two inputs?\n3. Which gas is released?\n\n**Check** — Light, water and carbon dioxide, oxygen.",
  },
  cards: {
    vi: "Tạo thẻ ghi nhớ",
    en: "Flashcard generator",
    prompt: "Tạo thẻ ghi nhớ cho vòng tuần hoàn nước.",
    english: "Make flashcards for the water cycle.",
    example:
      "**Mặt trước** — Khi nào gọi là bay hơi?\n**Mặt sau** — Khi nước lỏng chuyển thành hơi nước.\n\n**Mặt trước** — Khi nào có ngưng tụ?\n**Mặt sau** — Khi hơi nước chuyển thành giọt nước.",
    exampleEn:
      "**Front** — What is evaporation?\n**Back** — Liquid water becoming water vapor.\n\n**Front** — What is condensation?\n**Back** — Water vapor becoming liquid droplets.",
  },
  planner: {
    vi: "Lập kế hoạch học",
    en: "Study planner",
    prompt: "Mình có 30 phút để ôn bài. Hãy giúp mình chia thời gian.",
    english: "Help me plan a 30-minute review.",
    example:
      "- 5 phút chọn chủ đề và ghi mục tiêu.\n- 15 phút làm bài hoặc đọc có ghi chú.\n- 5 phút nghỉ.\n- 5 phút tự kiểm tra.",
    exampleEn:
      "- 5 minutes to choose a goal.\n- 15 minutes to practise.\n- 5 minutes to rest.\n- 5 minutes to check what you learned.",
  },
  coding: {
    vi: "Bạn học lập trình",
    en: "Coding helper",
    prompt: "Giải thích vòng lặp Python bằng ví dụ ngắn.",
    english: "Show me a short Python loop.",
    example:
      "Vòng lặp lặp lại một nhóm lệnh. Thử dự đoán kết quả trước khi chạy.\n\n```python\nfor n in range(1, 4):\n    print(n * n)\n```",
    exampleEn:
      "A loop repeats instructions. Predict the output before running this.\n\n```python\nfor n in range(1, 4):\n    print(n * n)\n```",
  },
  writing: {
    vi: "Bạn học viết",
    en: "Writing assistant",
    prompt: "Giúp mình viết một đoạn văn có luận điểm rõ ràng.",
    english: "Help me build a paragraph with a clear argument.",
    example:
      "Viết một câu nêu ý chính. Chọn một ví dụ cụ thể. Kết lại bằng câu giải thích vì sao ví dụ đó chứng minh ý của bạn.",
    exampleEn:
      "Write a topic sentence. Pick a concrete example and finish by explaining how it supports your point.",
  },
  coach: {
    vi: "Động lực học tập",
    en: "Motivational study coach",
    prompt: "Hôm nay mình hơi mệt",
    english: "I feel tired today",
    example:
      "Mệt một chút cũng không sao. Bạn thử thả lỏng vai, uống nước và hít thở chậm vài nhịp nhé. Khi sẵn sàng, chọn một việc thật nhỏ để bắt đầu.",
    exampleEn:
      "It is okay to feel tired. Relax your shoulders, take a drink, and pause. When you're ready, choose one small step.",
  },
};

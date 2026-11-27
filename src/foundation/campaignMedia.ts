export type CampaignCategory = "poster" | "guide" | "students";

export interface CampaignAsset {
  id: string;
  file: string;
  category: CampaignCategory;
  titleVi: string;
  titleEn: string;
  captionVi: string;
  captionEn: string;
  aspect: "wide" | "landscape" | "portrait" | "square";
  href?: string;
}

export const SURVEY_URL = "https://forms.gle/S7DkTXp4hMgwZwic8";

export const CAMPAIGN_MEDIA: readonly CampaignAsset[] = [
  {
    id: "banner-yard",
    file: "campaign-banner-yard.jpg",
    category: "poster",
    titleVi: "THCS Đồng Giao · Popcorn Brain Reset",
    titleEn: "Dong Giao Secondary · Popcorn Brain Reset",
    captionVi:
      "Lễ phát động toàn trường: Giảm sao nhãng — Tăng tập trung — Làm chủ công nghệ.",
    captionEn:
      "School-wide launch assembly: Reduce distraction, deepen focus, master technology.",
    aspect: "wide",
  },
  {
    id: "survey-popcorn",
    file: "card-survey-popcorn.jpg",
    category: "guide",
    titleVi: "Khảo sát tìm hiểu về Não bỏng ngô",
    titleEn: "Popcorn Brain Awareness Survey",
    captionVi:
      "Cùng tìm hiểu nhận thức, thói quen dùng thiết bị số và mức độ tập trung của học sinh.",
    captionEn:
      "Join the student survey on digital habits and everyday focus.",
    aspect: "landscape",
    href: SURVEY_URL,
  },
  {
    id: "poster-detox",
    file: "poster-popcorn-detox.jpg",
    category: "poster",
    titleVi: "Chiến dịch Popcorn Brain Detox",
    titleEn: "Popcorn Brain Detox Campaign",
    captionVi:
      "24h Không Bỏng Ngô, nhật ký đọc sâu và bài tập tương tác giúp rèn luyện sự tập trung.",
    captionEn:
      "24h screen detox, deep reading journal, and focus quizzes for students.",
    aspect: "portrait",
  },
  {
    id: "poster-three-pillars",
    file: "poster-three-pillars.jpg",
    category: "poster",
    titleVi: "Mô hình Ba nhà đồng hành",
    titleEn: "Three-Pillar Partnership Model",
    captionVi:
      "Nhà trường — Gia đình — Học sinh cùng xây dựng hành trình tập trung số 5 bước.",
    captionEn:
      "School, family, and students working together across five structured steps.",
    aspect: "portrait",
  },
  {
    id: "poster-20min-golden",
    file: "poster-20min-golden.jpg",
    category: "poster",
    titleVi: "20 phút tập trung vàng · Focus Buddy Bot",
    titleEn: "20 Golden Focus Minutes · Focus Buddy Bot",
    captionVi:
      "Thử thách 20 phút tập trung trọn vẹn kết hợp công cụ hẹn giờ và trợ lý AI học tập.",
    captionEn:
      "A 20-minute deep-focus challenge powered by the study timer and AI tutor.",
    aspect: "portrait",
  },
  {
    id: "poster-digital-footprint",
    file: "poster-digital-footprint.jpg",
    category: "poster",
    titleVi: "Bộ chỉ số Popcorn Brain & Dấu chân số",
    titleEn: "Popcorn Brain & Digital Footprint Index",
    captionVi:
      "5 tiêu chí tự đánh giá: Duy trì chú ý, Kiểm soát sao nhãng, Đọc sâu, Kiên trì và Tự chủ thiết bị.",
    captionEn:
      "Five self-check pillars covering sustained attention, deep reading, and device control.",
    aspect: "portrait",
  },
  {
    id: "card-what-to-know",
    file: "card-what-to-know.jpg",
    category: "guide",
    titleVi: "Não bỏng ngô — Điều các bạn cần biết",
    titleEn: "Popcorn Brain — What Students Should Know",
    captionVi:
      "Nhận diện tình trạng não quen với video ngắn, thông báo liên tục và mất kiên nhẫn khi đọc.",
    captionEn:
      "Understand how rapid short-form feeds fragment attention during study.",
    aspect: "landscape",
  },
  {
    id: "card-reset-guide",
    file: "card-reset-guide.jpg",
    category: "guide",
    titleVi: "Tắt nhịp xao nhãng, bật chế độ tập trung",
    titleEn: "Switch Off Distraction, Turn On Focus",
    captionVi:
      "So sánh trực quan tác hại của video ngắn và 3 thói quen vàng để lấy lại nhịp học sâu.",
    captionEn:
      "Visual guide comparing distraction symptoms with three practical focus habits.",
    aspect: "landscape",
  },
  {
    id: "poster-fanpage-launch",
    file: "poster-fanpage-launch.jpg",
    category: "poster",
    titleVi: "Ra mắt không gian Popcorn Brain Reset",
    titleEn: "Popcorn Brain Reset Community Launch",
    captionVi:
      "Cùng nhận diện Não bỏng ngô, rèn đọc sâu và chia sẻ bí quyết dùng công nghệ lành mạnh.",
    captionEn:
      "Spot Popcorn Brain, practice deep reading, and share healthy digital habits.",
    aspect: "square",
  },
  {
    id: "students-library-reading",
    file: "students-library-reading.jpg",
    category: "students",
    titleVi: "Giờ đọc sách sâu tại thư viện THCS Đồng Giao",
    titleEn: "Deep Reading Hour at Dong Giao Library",
    captionVi:
      "Học sinh hưởng ứng Ngày Sách và Văn hóa đọc Việt Nam — rèn luyện sự bền bỉ của tư duy.",
    captionEn:
      "Students practicing distraction-free reading together in the school library.",
    aspect: "landscape",
  },
  {
    id: "students-library-wisdom",
    file: "students-library-wisdom.jpg",
    category: "students",
    titleVi: "Đọc sách là nuôi dưỡng trí tuệ",
    titleEn: "Reading Nourishes the Mind",
    captionVi:
      "Không gian tự đọc yên tĩnh, không điện thoại — nơi các bạn cùng nhau tạo thói quen đọc sâu.",
    captionEn:
      "A calm phone-free reading room where students build daily study endurance.",
    aspect: "landscape",
  },
  {
    id: "students-standee-2",
    file: "students-standee-2.jpg",
    category: "students",
    titleVi: "Học sinh tìm hiểu về Não quá tải vì màn hình",
    titleEn: "Students Exploring Screen Overload Poster",
    captionVi:
      "Các bạn học sinh thảo luận trực tiếp tại sân trường về thông điệp Giảm lướt — Tăng tập trung.",
    captionEn:
      "Students discussing screen-overload cues together in the school courtyard.",
    aspect: "portrait",
  },
  {
    id: "students-standee-3",
    file: "students-standee-3.jpg",
    category: "students",
    titleVi: "Nhận diện Não bỏng ngô tại sân trường",
    titleEn: "Spotting Popcorn Brain on Campus",
    captionVi:
      "Thông điệp Nghỉ màn hình — Tập trung hơn — Sử dụng công nghệ thông minh lan tỏa giờ ra chơi.",
    captionEn:
      "Campus display encouraging screen breaks and mindful study technology.",
    aspect: "portrait",
  },
  {
    id: "students-standee-1",
    file: "students-standee-1.jpg",
    category: "students",
    titleVi: "Tìm hiểu biểu hiện và tác hại của Bỏng ngô",
    titleEn: "Learning the Signs of Popcorn Brain",
    captionVi:
      "Nhóm học sinh cùng đọc bảng thông tin về biểu hiện dễ phân tán và cách điều chỉnh thói quen.",
    captionEn:
      "Students reviewing signs of attention fatigue between classes.",
    aspect: "portrait",
  },
  {
    id: "students-standee-4",
    file: "students-standee-4.jpg",
    category: "students",
    titleVi: "Góc tuyên truyền trực quan giờ ra chơi",
    titleEn: "Visual Campaign Corner During Recess",
    captionVi:
      "Hoạt động tuyên truyền sinh động giúp học sinh tự nhận biết thói quen dùng thiết bị của bản thân.",
    captionEn:
      "Peer-led recess discussions around the school campaign posters.",
    aspect: "portrait",
  },
] as const;

export function campaignUrl(file: string, base: string = import.meta.env.BASE_URL || "/"): string {
  const cleanBase = base.endsWith("/") ? base : `${base}/`;
  return `${cleanBase}assets/campaign/${file}`;
}

export function getCampaignAsset(id: string): CampaignAsset {
  return CAMPAIGN_MEDIA.find((item) => item.id === id) ?? CAMPAIGN_MEDIA[0];
}

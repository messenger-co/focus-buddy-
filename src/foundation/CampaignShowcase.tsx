import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  Images,
  Sparkles,
  X,
} from "lucide-react";
import {
  CAMPAIGN_MEDIA,
  SURVEY_URL,
  campaignUrl,
  getCampaignAsset,
  type CampaignAsset,
  type CampaignCategory,
} from "./campaignMedia";
import { english as inEnglish } from "./language";

export function CampaignImage({
  asset,
  className = "",
  eager = false,
}: {
  asset: CampaignAsset;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const title = inEnglish ? asset.titleEn : asset.titleVi;
  if (failed) {
    return (
      <div className={`campaign-img-fallback ${className}`} role="img" aria-label={title}>
        <ImageIcon size={24} aria-hidden="true" />
        <span>{title}</span>
      </div>
    );
  }
  return (
    <img
      src={campaignUrl(asset.file)}
      alt={title}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

export function CampaignLightbox({
  items,
  index,
  onClose,
  onIndex,
}: {
  items: readonly CampaignAsset[];
  index: number;
  onClose: () => void;
  onIndex: (next: number) => void;
}) {
  const current = items[index] ?? items[0];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onIndex((index + 1) % items.length);
      else if (e.key === "ArrowLeft")
        onIndex((index - 1 + items.length) % items.length);
    };
    document.addEventListener("keydown", onKey);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = old;
    };
  }, [index, items.length, onClose, onIndex]);

  const title = inEnglish ? current.titleEn : current.titleVi;
  const caption = inEnglish ? current.captionEn : current.captionVi;

  return (
    <div
      className="campaign-lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="campaign-lightbox">
        <header className="campaign-lightbox-head">
          <div>
            <strong>{title}</strong>
            <span>
              {index + 1} / {items.length}
            </span>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label={inEnglish ? "Close preview" : "Đóng xem ảnh"}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className="campaign-lightbox-stage">
          {items.length > 1 && (
            <button
              type="button"
              className="campaign-lightbox-nav prev"
              aria-label={inEnglish ? "Previous photo" : "Ảnh trước"}
              onClick={() => onIndex((index - 1 + items.length) % items.length)}
            >
              <ChevronLeft size={22} />
            </button>
          )}
          <CampaignImage asset={current} className="campaign-lightbox-img" eager />
          {items.length > 1 && (
            <button
              type="button"
              className="campaign-lightbox-nav next"
              aria-label={inEnglish ? "Next photo" : "Ảnh tiếp theo"}
              onClick={() => onIndex((index + 1) % items.length)}
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>
        <footer className="campaign-lightbox-foot">
          <p>{caption}</p>
          {current.href && (
            <a
              href={current.href}
              target="_blank"
              rel="noopener noreferrer"
              className="button primary"
            >
              <ExternalLink size={15} />
              {inEnglish ? "Open survey" : "Mở phiếu khảo sát"}
            </a>
          )}
        </footer>
      </div>
    </div>
  );
}

/** Single editorial poster/photo spotlight reusable on subpages (Challenges, Progress, Missions, Discussion). */
export function CampaignFigureCard({
  assetId,
  eyebrow,
  compact = false,
}: {
  assetId: string;
  eyebrow?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const asset = getCampaignAsset(assetId);
  const title = inEnglish ? asset.titleEn : asset.titleVi;
  const caption = inEnglish ? asset.captionEn : asset.captionVi;

  return (
    <>
      <figure className={`campaign-figure-card${compact ? " compact" : ""}`}>
        <button
          type="button"
          className="campaign-figure-trigger"
          onClick={() => setOpen(true)}
          aria-label={inEnglish ? `Inspect ${title}` : `Xem lớn ${title}`}
        >
          <CampaignImage asset={asset} className="campaign-figure-img" />
        </button>
        <figcaption>
          {eyebrow && <span className="section-kicker">{eyebrow}</span>}
          <h3>{title}</h3>
          <p>{caption}</p>
          <div className="campaign-figure-actions">
            <button
              type="button"
              className="text-link"
              onClick={() => setOpen(true)}
            >
              {inEnglish ? "View full poster" : "Xem ảnh rõ nét"}
            </button>
            {asset.href && (
              <a
                href={asset.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link"
              >
                {inEnglish ? "Take survey" : "Tham gia khảo sát"}{" "}
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </figcaption>
      </figure>
      {open && (
        <CampaignLightbox
          items={[asset]}
          index={0}
          onClose={() => setOpen(false)}
          onIndex={() => {}}
        />
      )}
    </>
  );
}

/** Dan Tri inspired editorial gallery strip on Dashboard featuring THCS Dong Giao campaign & student photos. */
export default function CampaignShowcase() {
  const [filter, setFilter] = useState<"all" | CampaignCategory>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const banner = getCampaignAsset("banner-yard");
  const survey = getCampaignAsset("survey-popcorn");
  const featuredPosters = [
    getCampaignAsset("poster-detox"),
    getCampaignAsset("poster-three-pillars"),
  ];
  const studentStories = [
    getCampaignAsset("students-library-reading"),
    getCampaignAsset("students-standee-2"),
    getCampaignAsset("students-standee-3"),
    getCampaignAsset("students-library-wisdom"),
  ];

  const galleryItems =
    filter === "all"
      ? CAMPAIGN_MEDIA
      : CAMPAIGN_MEDIA.filter((item) => item.category === filter);

  const openAsset = (asset: CampaignAsset) => {
    const idx = CAMPAIGN_MEDIA.findIndex((item) => item.id === asset.id);
    setLightboxIndex(idx >= 0 ? idx : 0);
  };

  return (
    <section
      className="campaign-editorial"
      aria-label={
        inEnglish
          ? "Dong Giao Secondary School Popcorn Brain Reset Campaign"
          : "Chiến dịch Popcorn Brain Reset · Trường THCS Đồng Giao"
      }
    >
      <div className="campaign-editorial-head">
        <div>
          <span className="section-kicker">
            <Sparkles size={13} aria-hidden="true" />
            {inEnglish
              ? "DONG GIAO SECONDARY SCHOOL · CAMPAIGN"
              : "TRƯỜNG THCS ĐỒNG GIAO · CHIẾN DỊCH TẬP TRUNG SỐ"}
          </span>
          <h2>
            {inEnglish
              ? "Popcorn Brain Reset in Action"
              : "Chiến dịch Popcorn Brain Reset cùng học sinh Đồng Giao"}
          </h2>
        </div>
        <button
          type="button"
          className="button secondary campaign-gallery-btn"
          onClick={() => setLightboxIndex(0)}
        >
          <Images size={15} />
          {inEnglish
            ? `Browse all ${CAMPAIGN_MEDIA.length} photos`
            : `Xem trọn bộ ${CAMPAIGN_MEDIA.length} ảnh & áp phích`}
        </button>
      </div>

      <article className="campaign-banner-hero">
        <button
          type="button"
          className="campaign-banner-media"
          onClick={() => openAsset(banner)}
          aria-label={inEnglish ? banner.titleEn : banner.titleVi}
        >
          <CampaignImage asset={banner} className="campaign-banner-img" />
          <div className="campaign-banner-scrim">
            <span>
              {inEnglish
                ? "Reduce distraction · Deepen focus · Master technology"
                : "Giảm sao nhãng · Tăng tập trung · Làm chủ công nghệ"}
            </span>
            <strong>
              {inEnglish
                ? "Whole-school launch at Dong Giao Secondary School"
                : "Lễ phát động chiến dịch Popcorn Brain Reset tại Trường THCS Đồng Giao"}
            </strong>
          </div>
        </button>
      </article>

      <div className="campaign-editorial-grid">
        <div className="campaign-lead-col">
          <article className="campaign-story-card campaign-survey-card">
            <button
              type="button"
              className="campaign-thumb-btn"
              onClick={() => openAsset(survey)}
            >
              <CampaignImage asset={survey} className="campaign-thumb-img" />
            </button>
            <div className="campaign-story-body">
              <span className="campaign-meta-line">
                {inEnglish ? "Student Survey · 3 min" : "Khảo sát học sinh · 3 phút"}
              </span>
              <h3>{inEnglish ? survey.titleEn : survey.titleVi}</h3>
              <p>{inEnglish ? survey.captionEn : survey.captionVi}</p>
              <a
                href={SURVEY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="button primary campaign-survey-cta"
              >
                {inEnglish ? "Join the survey" : "Tham gia khảo sát ngay"}
                <ExternalLink size={14} />
              </a>
            </div>
          </article>
        </div>

        <div className="campaign-poster-col">
          {featuredPosters.map((poster) => (
            <article key={poster.id} className="campaign-poster-row">
              <button
                type="button"
                className="campaign-poster-thumb"
                onClick={() => openAsset(poster)}
                aria-label={inEnglish ? poster.titleEn : poster.titleVi}
              >
                <CampaignImage asset={poster} className="campaign-thumb-img" />
              </button>
              <div className="campaign-poster-copy">
                <span className="campaign-meta-line">
                  {inEnglish ? "Infographic Poster" : "Áp phích tuyên truyền"}
                </span>
                <h3>{inEnglish ? poster.titleEn : poster.titleVi}</h3>
                <p>{inEnglish ? poster.captionEn : poster.captionVi}</p>
              </div>
            </article>
          ))}
        </div>

        <aside className="campaign-feed-col" aria-label={inEnglish ? "Student activities" : "Hoạt động học sinh"}>
          <div className="campaign-feed-title">
            <h3>{inEnglish ? "Moments on Campus" : "Khoảnh khắc tại trường"}</h3>
            <span>{studentStories.length} ảnh nổi bật</span>
          </div>
          <div className="campaign-feed-list">
            {studentStories.map((story) => (
              <button
                key={story.id}
                type="button"
                className="campaign-feed-item"
                onClick={() => openAsset(story)}
              >
                <CampaignImage asset={story} className="campaign-feed-img" />
                <div>
                  <strong>{inEnglish ? story.titleEn : story.titleVi}</strong>
                  <span>{inEnglish ? story.captionEn : story.captionVi}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>

      <div className="campaign-strip-bar">
        <div
          className="filter-tabs"
          role="group"
          aria-label={inEnglish ? "Filter campaign gallery" : "Lọc bộ sưu tập ảnh chiến dịch"}
        >
          {(
            [
              ["all", inEnglish ? `All (${CAMPAIGN_MEDIA.length})` : `Tất cả (${CAMPAIGN_MEDIA.length})`],
              ["students", inEnglish ? "Students (6)" : "Học sinh Đồng Giao (6)"],
              ["poster", inEnglish ? "Posters (6)" : "Áp phích chiến dịch (6)"],
              ["guide", inEnglish ? "Guides & Survey (3)" : "Cẩm nang & Khảo sát (3)"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`filter-tab${filter === id ? " active" : ""}`}
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="campaign-thumb-strip">
          {galleryItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="campaign-strip-tile"
              onClick={() => openAsset(item)}
              title={inEnglish ? item.titleEn : item.titleVi}
            >
              <CampaignImage asset={item} className="campaign-strip-img" />
              <span>{inEnglish ? item.titleEn : item.titleVi}</span>
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <CampaignLightbox
          items={CAMPAIGN_MEDIA}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndex={setLightboxIndex}
        />
      )}
    </section>
  );
}

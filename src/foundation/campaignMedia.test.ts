import { describe, expect, it } from "vitest";
import { CAMPAIGN_MEDIA, campaignUrl, getCampaignAsset } from "./campaignMedia";

describe("campaignMedia catalog", () => {
  it("registers all 15 unique student and Popcorn Brain campaign assets", () => {
    expect(CAMPAIGN_MEDIA).toHaveLength(15);
    const ids = new Set(CAMPAIGN_MEDIA.map((item) => item.id));
    const files = new Set(CAMPAIGN_MEDIA.map((item) => item.file));
    expect(ids.size).toBe(15);
    expect(files.size).toBe(15);
  });

  it("builds base-path-safe asset URLs for localhost and GitHub Pages", () => {
    expect(campaignUrl("campaign-banner-yard.jpg", "/")).toBe(
      "/assets/campaign/campaign-banner-yard.jpg",
    );
    expect(campaignUrl("campaign-banner-yard.jpg", "/focus-buddy-/")).toBe(
      "/focus-buddy-/assets/campaign/campaign-banner-yard.jpg",
    );
    expect(campaignUrl("poster-20min-golden.jpg", "/focus-buddy-")).toBe(
      "/focus-buddy-/assets/campaign/poster-20min-golden.jpg",
    );
  });

  it("looks up known assets and falls back cleanly for unknown ids", () => {
    expect(getCampaignAsset("poster-20min-golden").file).toBe(
      "poster-20min-golden.jpg",
    );
    expect(getCampaignAsset("missing-id").id).toBe("banner-yard");
  });
});

import { describe, expect, it } from "vitest";
import { parseMusicLink } from "./Music";

describe("YouTube Music links", () => {
  it("accepts guest-shareable video links", () => {
    expect(parseMusicLink("https://music.youtube.com/watch?v=dQw4w9WgXcQ")?.id).toBe("dQw4w9WgXcQ");
    expect(parseMusicLink("https://youtu.be/dQw4w9WgXcQ")?.kind).toBe("video");
    expect(parseMusicLink("https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=abc")?.kind).toBe("video");
  });
  it("accepts public playlist links", () => {
    expect(parseMusicLink("https://music.youtube.com/playlist?list=PL1234567890AB")).toEqual({
      kind: "playlist", id: "PL1234567890AB", label: "Playlist YouTube Music",
    });
  });
  it("rejects non-YouTube domains, credentials, HTTP and invalid ids", () => {
    for (const bad of [
      "https://music.youtube.com.attacker.example/watch?v=dQw4w9WgXcQ",
      "https://open.spotify.com/playlist/1234567890123456789012",
      "http://music.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://person:secret@music.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://music.youtube.com/watch?v=../../etc",
      "https://music.youtube.com/channel/UCabc1234567890",
      "not-a-url",
    ]) expect(parseMusicLink(bad)).toBeNull();
  });
});

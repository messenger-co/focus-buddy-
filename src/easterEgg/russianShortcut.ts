/** Hidden keyboard-only novelty. No saved settings: refresh restores the original site. */
export function russianShortcut(event: Pick<KeyboardEvent, "ctrlKey" | "shiftKey" | "altKey" | "metaKey" | "code" | "repeat">): boolean {
  return event.ctrlKey && event.shiftKey && !event.altKey && !event.metaKey &&
    !event.repeat && (event.code === "Digit5" || event.code === "Numpad5");
}
export const SPECIAL_TRACK = "YTSave.to_YouTube_Media_QiFBgtgUtfw_ТРИ-ПОЛОСКИ-KOLM-TRIIPU-THREE-STRIPES_007_128k";
/** Original assets already present at the GitHub repository root.
 * Link to them rather than copying the music into another file. */
const ROOT = "https://raw.githubusercontent.com/messenger-co/focus-buddy-/main/";
export const trackUrl = ROOT + encodeURIComponent(SPECIAL_TRACK + ".m4a");
export const callerImageUrl = ROOT + "image.png";
export const meowImageUrl = ROOT + "meowpng.webp";

export const danceGifUrl = ROOT + "lets-dance-dancing.gif";

export const swowImageUrl = ROOT + "swow.webp";

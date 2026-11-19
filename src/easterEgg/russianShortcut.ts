/** Keyboard-only novelty toggle. The state is intentionally never persisted. */
export function russianShortcut(event: Pick<KeyboardEvent,"ctrlKey"|"shiftKey"|"altKey"|"metaKey"|"code"|"repeat">):boolean {
  return event.ctrlKey && event.shiftKey && !event.altKey && !event.metaKey &&
    !event.repeat && (event.code === "Digit5" || event.code === "Numpad5");
}
export const SPECIAL_TRACK = "YTSave.to_YouTube_Media_QiFBgtgUtfw_ТРИ-ПОЛОСКИ-KOLM-TRIIPU-THREE-STRIPES_007_128k";
/** Browser playback requires a permitted audio asset in public/. Never embed third-party ripped audio. */
export const trackCandidates = ["music/","audio/","assets/",""].flatMap((folder) =>
  [".mp3",".m4a",".ogg",".wav"].map((extension) =>
    import.meta.env.BASE_URL + folder + encodeURIComponent(SPECIAL_TRACK) + extension,
  ),
);

import { useState, useEffect, useRef } from "react";
export function useGameSound() {
  const [audio, setAudio] = useState(false);
  const speaker = useRef<AudioContext | null>(null);
  useEffect(
    () => () => {
      void speaker.current?.close().catch(() => {});
    },
    [],
  );
  function sound(hz = 540) {
    const ctx = speaker.current;
    if (!audio || !ctx || ctx.state !== "running") return;
    const note = ctx.createOscillator(),
      gain = ctx.createGain();
    note.connect(gain);
    gain.connect(ctx.destination);
    note.frequency.value = hz;
    gain.gain.setValueAtTime(0.025, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
    note.start();
    note.stop(ctx.currentTime + 0.11);
  }
  function toggleSound() {
    if (audio) {
      setAudio(false);
      return;
    }
    try {
      speaker.current ??= new AudioContext();
      void speaker.current
        .resume()
        .then(() => setAudio(true))
        .catch(() => {});
    } catch {
      /* Thiết bị không hỗ trợ âm thanh. */
    }
  }
  return { audio, sound, toggleSound };
}

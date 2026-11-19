import { useCallback, useEffect, useRef, useState } from "react";
import type { Soundscape } from "./settings";
export function useAmbience() {
  const context = useRef<AudioContext | null>(null);
  const [playing, setPlaying] = useState(false),
    [error, setError] = useState("");
  const stop = useCallback(() => {
    const a = context.current;
    context.current = null;
    if (a && a.state !== "closed") void a.close().catch(() => {});
    setPlaying(false);
  }, []);
  useEffect(() => stop, [stop]);
  async function play(scene: Soundscape) {
    stop();
    setError("");
    if (scene === "off") return;
    try {
      const a = new AudioContext();
      context.current = a;
      await a.resume();
      if (context.current !== a) return;
      const buffer = a.createBuffer(1, a.sampleRate * 3, a.sampleRate),
        samples = buffer.getChannelData(0);
      let previous = 0;
      for (let i = 0; i < samples.length; i++) {
        previous = (previous + 0.07 * (Math.random() * 2 - 1)) / 1.07;
        samples[i] =
          scene === "rain"
            ? (Math.random() * 2 - 1) * 0.33 + previous
            : previous * 2.8;
      }
      const noise = a.createBufferSource(),
        filter = a.createBiquadFilter(),
        gain = a.createGain(),
        lfo = a.createOscillator(),
        depth = a.createGain();
      noise.buffer = buffer;
      noise.loop = true;
      filter.type = scene === "brook" ? "bandpass" : "lowpass";
      filter.frequency.value =
        scene === "rain" ? 3200 : scene === "waves" ? 750 : 1200;
      gain.gain.value = 0.14;
      lfo.frequency.value =
        scene === "waves" ? 0.105 : scene === "brook" ? 0.52 : 0.17;
      depth.gain.value = scene === "waves" ? 0.085 : 0.025;
      lfo.connect(depth).connect(gain.gain);
      noise.connect(filter).connect(gain).connect(a.destination);
      lfo.start();
      noise.start();
      setPlaying(true);
    } catch {
      stop();
      setError("Trình duyệt chưa mở được âm thanh. Bạn có thể thử lại.");
    }
  }
  return { play, stop, playing, error };
}

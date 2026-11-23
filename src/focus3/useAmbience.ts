import { useCallback, useEffect, useRef, useState } from "react";
import type { Soundscape } from "./settings";

// Tạo một vòng âm thanh ngắn trên thiết bị. Chuông dùng các nốt ngũ cung
// với đường suy giảm riêng, tiếng lửa dùng các xung ngẫu nhiên rất nhỏ.
function makeLoop(audio: AudioContext, scene: Exclude<Soundscape, "off">) {
  const rate = audio.sampleRate;
  const duration = scene === "chimes" || scene === "night" ? 10 : 4;
  const buffer = audio.createBuffer(1, rate * duration, rate);
  const samples = buffer.getChannelData(0);
  let previous = 0;
  let deep = 0;
  let ember = 0;
  for (let i = 0; i < samples.length; i++) {
    const white = Math.random() * 2 - 1;
    previous = (previous + 0.07 * white) / 1.07;
    deep = (deep + 0.02 * white) / 1.02;
    switch (scene) {
      case "rain":
        samples[i] = white * 0.33 + previous;
        break;
      case "fan":
        samples[i] =
          0.13 * white + 0.09 * Math.sin((2 * Math.PI * 84 * i) / rate);
        break;
      case "fire":
        if (Math.random() < 5 / rate) ember = 0.45 + Math.random() * 0.35;
        samples[i] = previous * 1.6 + white * ember;
        ember *= 0.994;
        break;
      case "chimes":
        samples[i] = previous * 0.4;
        break;
      case "brown":
        samples[i] = deep * 3.4;
        break;
      case "library":
        if (Math.random() < 1.2 / rate) ember = 0.16 + Math.random() * 0.12;
        samples[i] = deep * 1.3 + previous * 0.35 + white * ember * 0.5;
        ember *= 0.992;
        break;
      case "night": {
        const t = i / rate;
        const chirpEnv = Math.pow(Math.max(0, Math.sin(Math.PI * 1.8 * t)), 8);
        const pulse = Math.sin(2 * Math.PI * 4180 * t) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 26 * t));
        samples[i] = deep * 1.1 + 0.055 * chirpEnv * pulse;
        break;
      }
      default:
        samples[i] = previous * 2.8;
    }
  }
  if (scene === "chimes") {
    for (const [onset, hz] of [
      [0.6, 523.25],
      [2.15, 659.25],
      [2.8, 783.99],
      [5.8, 587.33],
      [7.5, 880],
    ]) {
      const start = Math.round(onset * rate);
      for (let n = 0; n < rate * 1.7; n++) {
        const t = n / rate,
          phase = 2 * Math.PI * hz * t;
        const envelope = Math.min(1, t / 0.018) * Math.exp(-3.6 * t);
        samples[start + n] +=
          0.33 * envelope * (Math.sin(phase) + 0.21 * Math.sin(phase * 2.74));
      }
    }
  }
  // Làm mềm hai đầu để tránh tiếng bật khi lặp.
  const edge = Math.round(rate * 0.012);
  for (let i = 0; i < edge; i++) {
    samples[i] *= i / edge;
    samples[samples.length - i - 1] *= i / edge;
  }
  return buffer;
}

export function playChime(volume = 50) {
  try {
    const audio = new AudioContext();
    const now = audio.currentTime;
    const master = audio.createGain();
    master.gain.setValueAtTime(Math.max(0.05, Math.min(0.45, volume / 180)), now);
    master.connect(audio.destination);
    for (const [offset, hz] of [
      [0, 523.25],
      [0.18, 659.25],
      [0.36, 783.99],
    ]) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(hz, now + offset);
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.6, now + offset + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 1.1);
      osc.connect(gain).connect(master);
      osc.start(now + offset);
      osc.stop(now + offset + 1.15);
    }
    window.setTimeout(() => void audio.close().catch(() => {}), 1800);
  } catch {
    /* Trình duyệt có thể tắt âm thanh tự động. */
  }
}

export function useAmbience(volume: number) {
  const context = useRef<AudioContext | null>(null);
  const master = useRef<GainNode | null>(null);
  const [playing, setPlaying] = useState(false),
    [error, setError] = useState("");
  const latestVolume = useRef(volume);
  useEffect(() => {
    latestVolume.current = volume;
    if (master.current && context.current) {
      master.current.gain.setTargetAtTime(
        volume / 50,
        context.current.currentTime,
        0.03,
      );
    }
  }, [volume]);
  const stop = useCallback(() => {
    const audio = context.current;
    context.current = null;
    master.current = null;
    if (audio && audio.state !== "closed") void audio.close().catch(() => {});
    setPlaying(false);
  }, []);
  useEffect(() => stop, [stop]);
  async function play(scene: Soundscape) {
    stop();
    setError("");
    if (scene === "off") return;
    let audio: AudioContext | null = null;
    try {
      audio = new AudioContext();
      context.current = audio;
      await audio.resume();
      if (context.current !== audio) return;
      const noise = audio.createBufferSource(),
        filter = audio.createBiquadFilter();
      const gain = audio.createGain(),
        lfo = audio.createOscillator(),
        depth = audio.createGain();
      master.current = audio.createGain();
      master.current.gain.value = latestVolume.current / 50;
      noise.buffer = makeLoop(audio, scene);
      noise.loop = true;
      filter.type = scene === "brook" ? "bandpass" : "lowpass";
      filter.frequency.value = {
        rain: 3200,
        brook: 1200,
        waves: 750,
        fire: 3500,
        chimes: 3200,
        fan: 570,
        brown: 420,
        night: 5200,
        library: 1400,
      }[scene];
      gain.gain.value = 0.14;
      lfo.frequency.value = {
        rain: 0.17,
        brook: 0.52,
        waves: 0.105,
        fire: 0.26,
        chimes: 0.12,
        fan: 0.08,
        brown: 0.06,
        night: 0.14,
        library: 0.09,
      }[scene];
      depth.gain.value =
        scene === "waves"
          ? 0.085
          : scene === "fan" || scene === "brown"
            ? 0.007
            : 0.025;
      lfo.connect(depth).connect(gain.gain);
      noise
        .connect(filter)
        .connect(gain)
        .connect(master.current)
        .connect(audio.destination);
      lfo.start();
      noise.start();
      setPlaying(true);
    } catch {
      if (context.current !== audio) return;
      stop();
      setError("Trình duyệt chưa mở được âm thanh. Bạn có thể thử lại.");
    }
  }
  return { play, stop, playing, error };
}

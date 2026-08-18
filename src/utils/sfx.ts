// Minimal placeholder SFX using WebAudio oscillators — no external audio
// files required. Keeps volume low; respects the mute toggle.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  return ctx;
}

function beep(freq: number, durationMs: number, type: OscillatorType = 'sine', gain = 0.06) {
  const audioCtx = getCtx();
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gainNode.gain.value = gain;
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  const now = audioCtx.currentTime;
  gainNode.gain.setValueAtTime(gain, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);

  osc.start(now);
  osc.stop(now + durationMs / 1000);
}

export const sfx = {
  move: (muted: boolean) => {
    if (muted) return;
    beep(320, 90, 'sine', 0.05);
  },
  levelComplete: (muted: boolean) => {
    if (muted) return;
    beep(523, 120, 'triangle', 0.06);
    setTimeout(() => beep(659, 120, 'triangle', 0.06), 100);
    setTimeout(() => beep(784, 180, 'triangle', 0.06), 200);
  },
  click: (muted: boolean) => {
    if (muted) return;
    beep(440, 50, 'square', 0.03);
  },
};

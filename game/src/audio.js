// audio.js — tiny WebAudio blips, no audio files.
// Everything is an oscillator through a gain envelope, created on first user
// gesture (browsers block audio before one). M toggles mute.

export function createAudio() {
  const audio = {
    ctx: null,
    muted: false,
  };

  audio.ensure = function ensure() {
    if (!audio.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        audio.ctx = new AC();
      } catch {
        audio.ctx = null;
      }
    }
    if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
    return audio.ctx;
  };

  function blip(freq, dur, type, vol, when = 0) {
    if (audio.muted) return;
    const ctx = audio.ensure();
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch {
      // Sound is garnish; a failed blip never breaks the game.
    }
  }

  audio.pickup = () => {
    blip(660, 0.12, 'sine', 0.12);
    blip(990, 0.18, 'sine', 0.1, 0.09);
  };
  audio.coin = () => blip(1320, 0.09, 'triangle', 0.08);
  audio.alarmTick = () => blip(220, 0.1, 'square', 0.05);
  audio.caught = () => {
    blip(180, 0.35, 'sawtooth', 0.12);
    blip(120, 0.5, 'sawtooth', 0.12, 0.18);
  };
  audio.win = () => {
    blip(523, 0.16, 'sine', 0.12);
    blip(659, 0.16, 'sine', 0.12, 0.13);
    blip(784, 0.3, 'sine', 0.12, 0.26);
  };
  return audio;
}

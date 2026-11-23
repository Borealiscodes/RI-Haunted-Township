import { Q16_ONE, q16Clamp, GaloisLFSR16 } from '../core/q16.js';

// 4-phrase (32-bar) harmonic progressions per track so music evolves continuously
const TRACKS = {
  HARBOR: {
    name: 'I. Blackwater Tide (Generative)',
    beatMs: 390,
    phrases: [
      [73.42, 58.27, 49.00, 55.00], // A: D minor coastal swell
      [73.42, 65.41, 58.27, 55.00], // B: Descending Dorian tide
      [49.00, 58.27, 65.41, 55.00], // C: Subdominant fog lift
      [73.42, 51.91, 49.00, 55.00]  // D: Phrygian cadence
    ],
    scale: [293.66, 329.63, 349.23, 392.00, 440.00, 466.16, 523.25, 587.33],
    metallic: false,
    pulse: false
  },
  CANOPY: {
    name: 'II. Wind-Chime Belfry',
    beatMs: 340,
    phrases: [
      [73.42, 73.42, 58.27, 55.00],
      [65.41, 58.27, 51.91, 55.00],
      [73.42, 87.31, 65.41, 55.00],
      [58.27, 51.91, 49.00, 55.00]
    ],
    scale: [293.66, 311.13, 392.00, 440.00, 466.16, 554.37, 587.33, 622.25],
    metallic: true,
    pulse: false
  },
  DANMAKU: {
    name: 'III. Walpurgis Reckoning',
    beatMs: 195,
    phrases: [
      [73.42, 77.78, 82.41, 87.31],
      [87.31, 82.41, 77.78, 55.00],
      [73.42, 98.00, 87.31, 82.41],
      [77.78, 73.42, 65.41, 55.00]
    ],
    scale: [349.23, 392.00, 440.00, 466.16, 554.37, 587.33, 659.25, 698.46],
    metallic: false,
    pulse: true
  }
};

export class TownshipSoundscape {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.filter = null;
    this.cello1 = null;
    this.cello2 = null;
    this.celloGain = null;
    this.timer = null;
    this.step = 0;
    this.currentTrackKey = 'HARBOR';
    this.lfsr = new GaloisLFSR16(0x9b4d);
  }

  start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctor();

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.32;

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 720;
    this.filter.Q.value = 1.6;

    const delay = this.ctx.createDelay(1.2);
    delay.delayTime.value = 0.44;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.48;
    delay.connect(fb);
    fb.connect(delay);

    this.filter.connect(this.master);
    this.filter.connect(delay);
    delay.connect(this.master);
    this.master.connect(this.ctx.destination);

    this.cello1 = this.ctx.createOscillator();
    this.cello1.type = 'sawtooth';
    this.cello1.frequency.value = 73.42;

    this.cello2 = this.ctx.createOscillator();
    this.cello2.type = 'triangle';
    this.cello2.frequency.value = 146.83;

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 4.6;
    lfoGain.gain.value = 1.7;
    lfo.connect(lfoGain);
    lfoGain.connect(this.cello1.frequency);
    lfoGain.connect(this.cello2.frequency);
    lfo.start();

    this.celloGain = this.ctx.createGain();
    this.celloGain.gain.value = 0.16;
    this.cello1.connect(this.celloGain);
    this.cello2.connect(this.celloGain);
    this.celloGain.connect(this.filter);
    this.cello1.start();
    this.cello2.start();

    this._scheduleTimer();
  }

  _scheduleTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this._tick(), TRACKS[this.currentTrackKey].beatMs);
  }

  setTrack(trackKey) {
    if (TRACKS[trackKey] && this.currentTrackKey !== trackKey) {
      this.currentTrackKey = trackKey;
      this.step = 0;
      if (this.ctx) this._scheduleTimer();
    }
    return TRACKS[this.currentTrackKey].name;
  }

  playChime(hz, metallic = true, dur = 1.65) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const over = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    over.type = 'triangle';
    osc.frequency.setValueAtTime(hz, now);
    over.frequency.setValueAtTime(hz * (metallic ? 2.756 : 1.5), now);
    const ovG = this.ctx.createGain();
    ovG.gain.value = 0.028;

    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.09, now + 0.07);
    env.gain.exponentialRampToValueAtTime(0.0005, now + dur);

    osc.connect(env);
    over.connect(ovG);
    ovG.connect(env);
    env.connect(this.filter);
    osc.start(now);
    over.start(now);
    osc.stop(now + dur + 0.05);
    over.stop(now + dur + 0.05);
  }

  _playHeartbeat(now) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(92, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.18);
    env.gain.setValueAtTime(0.24, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(env);
    env.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  _tick() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const trk = TRACKS[this.currentTrackKey];
    const s = this.step++;
    const now = this.ctx.currentTime;

    const phraseIdx = (s >> 4) % trk.phrases.length;
    const barIdx = (s >> 2) & 3;
    const bassHz = trk.phrases[phraseIdx][barIdx];

    // Smooth portamento cello swell every 4 beats
    if ((s & 3) === 0) {
      this.cello1.frequency.setTargetAtTime(bassHz, now, 0.30);
      this.cello2.frequency.setTargetAtTime(bassHz * (phraseIdx === 2 ? 1.189 : 1.498), now, 0.30);
      this.celloGain.gain.setTargetAtTime(0.21, now, 0.20);
      this.celloGain.gain.setTargetAtTime(0.13, now + 0.50, 0.32);
    }

    // Expressive tenor counter-melody on Phrase B & D
    if ((phraseIdx === 1 || phraseIdx === 3) && (s & 3) === 2) {
      this.playChime(bassHz * 3.0, false, 2.1);
    }

    if (trk.pulse && (s & 1) === 0) this._playHeartbeat(now);

    // Generative non-repeating melodic phrasing driven by LFSR + phrase contour
    const rBit = this.lfsr.nextBit();
    if ((s & 7) === 7 && rBit === 0) return; // Organic breathing rest
    const scaleIdx = ((s * 3) + phraseIdx * 2 + (rBit ? 1 : 0)) % trk.scale.length;
    this.playChime(trk.scale[scaleIdx], trk.metallic, 1.55);
  }

  updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
    if (!this.ctx || !this.filter) return;
    const cutoff = slowMo ? 360 : (inBulletHell ? 1300 : 720);
    this.filter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.16);
  }
}

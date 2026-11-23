import { Q16_ONE, q16Clamp } from '../core/q16.js';

// Pure consonant D Natural Minor & D Pentatonic progressions (zero clashing dissonances)
const TRACKS = {
  HARBOR: {
    name: 'I. Blackwater Tide',
    beatMs: 420,
    phrases: [
      [73.42, 58.27, 65.41, 73.42], // Dm -> Bb -> C -> Dm
      [73.42, 49.00, 58.27, 55.00], // Dm -> Gm -> Bb -> A
      [58.27, 65.41, 73.42, 73.42], // Bb -> C -> Dm -> Dm
      [49.00, 58.27, 55.00, 73.42]  // Gm -> Bb -> A -> Dm
    ],
    // Consonant D-minor pentatonic scale (D4, F4, G4, A4, C5, D5)
    melody: [
      293.66, 349.23, 440.00, 392.00, 349.23, 293.66, 261.63, 293.66,
      349.23, 440.00, 523.25, 440.00, 392.00, 349.23, 329.63, 293.66,
      261.63, 293.66, 349.23, 392.00, 440.00, 392.00, 349.23, 293.66,
      329.63, 349.23, 392.00, 440.00, 349.23, 329.63, 293.66, 0
    ],
    pulse: false
  },
  CANOPY: {
    name: 'II. Wind-Chime Belfry',
    beatMs: 360,
    phrases: [
      [73.42, 73.42, 58.27, 73.42],
      [65.41, 58.27, 55.00, 73.42],
      [73.42, 65.41, 58.27, 73.42],
      [58.27, 55.00, 73.42, 73.42]
    ],
    // Consonant D Hirajoshi (D4, Eb4, G4, A4, Bb4, D5)
    melody: [
      293.66, 311.13, 392.00, 440.00, 466.16, 440.00, 392.00, 311.13,
      293.66, 392.00, 440.00, 587.33, 466.16, 440.00, 392.00, 293.66,
      311.13, 392.00, 466.16, 440.00, 392.00, 311.13, 293.66, 0,
      392.00, 440.00, 466.16, 587.33, 440.00, 392.00, 293.66, 0
    ],
    pulse: false
  },
  DANMAKU: {
    name: 'III. Walpurgis Reckoning',
    beatMs: 210,
    phrases: [
      [73.42, 73.42, 58.27, 55.00],
      [73.42, 65.41, 58.27, 55.00],
      [49.00, 58.27, 65.41, 55.00],
      [73.42, 58.27, 55.00, 73.42]
    ],
    melody: [
      587.33, 440.00, 349.23, 440.00, 523.25, 440.00, 392.00, 349.23,
      329.63, 392.00, 440.00, 523.25, 587.33, 523.25, 440.00, 392.00,
      349.23, 440.00, 523.25, 587.33, 659.25, 587.33, 523.25, 440.00,
      392.00, 349.23, 329.63, 440.00, 349.23, 329.63, 293.66, 0
    ],
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
  }

  start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctor();

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.28;

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 620;
    this.filter.Q.value = 1.2;

    const delay = this.ctx.createDelay(1.2);
    delay.delayTime.value = 0.42;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.42;
    delay.connect(fb);
    fb.connect(delay);

    this.filter.connect(this.master);
    this.filter.connect(delay);
    delay.connect(this.master);
    this.master.connect(this.ctx.destination);

    // Warm consonant bowed cello (root + pure octave/fifth)
    this.cello1 = this.ctx.createOscillator();
    this.cello1.type = 'sawtooth';
    this.cello1.frequency.value = 73.42;

    this.cello2 = this.ctx.createOscillator();
    this.cello2.type = 'triangle';
    this.cello2.frequency.value = 146.83;

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 4.2;
    lfoGain.gain.value = 1.1;
    lfo.connect(lfoGain);
    lfoGain.connect(this.cello1.frequency);
    lfoGain.connect(this.cello2.frequency);
    lfo.start();

    this.celloGain = this.ctx.createGain();
    this.celloGain.gain.value = 0.14;
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

  playChime(hz, bellOvertone = false, dur = 1.45) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, now);

    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.085, now + 0.05);
    env.gain.exponentialRampToValueAtTime(0.0005, now + dur);

    osc.connect(env);
    env.connect(this.filter);
    osc.start(now);
    osc.stop(now + dur + 0.04);

    if (bellOvertone) {
      const ov = this.ctx.createOscillator();
      const ovEnv = this.ctx.createGain();
      ov.type = 'sine';
      ov.frequency.setValueAtTime(hz * 2.0, now); // Clean octave shimmer
      ovEnv.gain.setValueAtTime(0.001, now);
      ovEnv.gain.exponentialRampToValueAtTime(0.035, now + 0.02);
      ovEnv.gain.exponentialRampToValueAtTime(0.0004, now + 0.9);
      ov.connect(ovEnv);
      ovEnv.connect(this.filter);
      ov.start(now);
      ov.stop(now + 0.95);
    }
  }

  _playHeartbeat(now) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(88, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.16);
    env.gain.setValueAtTime(0.22, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
    osc.connect(env);
    env.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  _tick() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const trk = TRACKS[this.currentTrackKey];
    const s = this.step++;
    const now = this.ctx.currentTime;

    const phraseIdx = (s >> 4) % trk.phrases.length;
    const barIdx = (s >> 2) & 3;
    const bassHz = trk.phrases[phraseIdx][barIdx];

    if ((s & 3) === 0) {
      this.cello1.frequency.setTargetAtTime(bassHz, now, 0.28);
      this.cello2.frequency.setTargetAtTime(bassHz * 2.0, now, 0.28); // Pure octave harmony
      this.celloGain.gain.setTargetAtTime(0.18, now, 0.18);
      this.celloGain.gain.setTargetAtTime(0.12, now + 0.45, 0.30);
    }

    if (trk.pulse && (s & 1) === 0) this._playHeartbeat(now);

    const note = trk.melody[s % trk.melody.length];
    if (note > 0) this.playChime(note, false, 1.4);
  }

  updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
    if (!this.ctx || !this.filter) return;
    const cutoff = slowMo ? 340 : (inBulletHell ? 1100 : 620);
    this.filter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.16);
  }
}

import { Q16_ONE } from '../core/q16.js';

// Strictly consonant D Natural Minor (D, E, F, G, A, Bb, C) — zero C# clashes or triangle-wave Casio buzz!
// Uses pure sine cathedral pipe ranks (16' Bourdon + 8' Diapason + 4' Flute) + real ConvolverNode sanctuary reverb.
const SUITE = {
  name: 'Symphony of Blackwater Cove (Cathedral Organ)',
  stepMs: 210,
  roots: [
    // I. Chapel Intro (0..7)
    73.42, 65.41, 58.27, 55.00, 49.00, 58.27, 65.41, 73.42,
    // II. Blackwater Nocturne Verse (8..15)
    73.42, 73.42, 58.27, 58.27, 49.00, 49.00, 55.00, 55.00,
    // III. Bell-Tower Requiem Bridge (16..23)
    58.27, 65.41, 73.42, 73.42, 49.00, 58.27, 65.41, 55.00,
    // IV. Midnight Reckoning Finale (24..31)
    73.42, 58.27, 49.00, 55.00, 73.42, 65.41, 58.27, 73.42
  ],
  // 256-step (32-bar) pure D Natural Minor cathedral pipe organ score
  organLead: [
    // --- Movement I: Chapel Intro (Steps 0..63) ---
    440.00, 0, 392.00, 0, 349.23, 0, 0, 0,  392.00, 0, 349.23, 0, 329.63, 0, 0, 0,
    349.23, 0, 329.63, 0, 293.66, 0, 0, 0,  329.63, 0, 349.23, 0, 440.00, 0, 0, 0,
    587.33, 0, 523.25, 0, 440.00, 0, 0, 0,  523.25, 0, 466.16, 0, 440.00, 0, 0, 0,
    392.00, 0, 349.23, 0, 329.63, 0, 0, 0,  293.66, 0, 0, 0, 0, 0, 0, 0,

    // --- Movement II: Blackwater Nocturne Verse (Steps 64..127) ---
    440.00, 0, 349.23, 392.00, 440.00, 0, 523.25, 0,  440.00, 0, 392.00, 349.23, 329.63, 0, 293.66, 0,
    349.23, 0, 440.00, 466.16, 523.25, 0, 466.16, 0,  440.00, 0, 392.00, 349.23, 392.00, 0, 0, 0,
    392.00, 0, 466.16, 440.00, 392.00, 0, 349.23, 0,  329.63, 0, 349.23, 392.00, 440.00, 0, 0, 0,
    466.16, 0, 440.00, 392.00, 349.23, 0, 329.63, 0,  329.63, 0, 349.23, 0, 293.66, 0, 0, 0,

    // --- Movement III: Bell-Tower Requiem Bridge (Steps 128..191) ---
    466.16, 0, 0, 440.00, 466.16, 0, 587.33, 0,  523.25, 0, 0, 466.16, 523.25, 0, 659.25, 0,
    587.33, 0, 523.25, 0, 587.33, 0, 698.46, 0,  659.25, 0, 587.33, 0, 440.00, 0, 0, 0,
    392.00, 0, 466.16, 0, 440.00, 0, 392.00, 0,  349.23, 0, 440.00, 0, 392.00, 0, 349.23, 0,
    329.63, 0, 392.00, 0, 349.23, 0, 329.63, 0,  329.63, 0, 349.23, 0, 440.00, 0, 0, 0,

    // --- Movement IV: Midnight Reckoning Finale (Steps 192..255) ---
    587.33, 0, 523.25, 440.00, 587.33, 0, 698.46, 0,  659.25, 0, 587.33, 523.25, 440.00, 0, 587.33, 0,
    466.16, 0, 440.00, 392.00, 440.00, 0, 349.23, 0,  392.00, 0, 349.23, 329.63, 293.66, 0, 0, 0,
    587.33, 0, 523.25, 587.33, 659.25, 0, 698.46, 0,  659.25, 0, 587.33, 523.25, 440.00, 0, 392.00, 0,
    466.16, 0, 440.00, 392.00, 349.23, 0, 329.63, 0,  293.66, 0, 0, 0, 0, 0, 0, 0
  ]
};

export class TownshipSoundscape {
  constructor() {
    this.ctx = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.organFilter = null;
    this.cathedralVerb = null;
    this.timer = null;
    this.step = 0;
  }

  /** Build a true algorithmic stone-cathedral impulse response (2.4s smooth exponential decay) */
  _createCathedralImpulse(seconds = 2.4, decay = 2.8) {
    const rate = this.ctx.sampleRate;
    const len = (rate * seconds) | 0;
    const ir = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const env = Math.pow(1 - i / len, decay);
        data[i] = (Math.random() * 2 - 1) * env * 0.45;
      }
    }
    const conv = this.ctx.createConvolver();
    conv.buffer = ir;
    return conv;
  }

  start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctor();

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.16;

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.25;

    // Warm sanctuary lowpass (460 Hz) eliminates all electronic edge
    this.organFilter = this.ctx.createBiquadFilter();
    this.organFilter.type = 'lowpass';
    this.organFilter.frequency.value = 460;
    this.organFilter.Q.value = 0.5;

    this.cathedralVerb = this._createCathedralImpulse(2.4, 2.8);
    const wetGain = this.ctx.createGain();
    wetGain.gain.value = 0.48;

    this.organFilter.connect(this.bgmGain);
    this.organFilter.connect(this.cathedralVerb);
    this.cathedralVerb.connect(wetGain);
    wetGain.connect(this.bgmGain);
    this.bgmGain.connect(this.ctx.destination);

    this.sfxGain.connect(this.ctx.destination);
    this.sfxGain.connect(this.cathedralVerb);

    this.timer = setInterval(() => this._tick(), SUITE.stepMs);
  }

  setAutoTrack() {
    return SUITE.name;
  }

  setChimeZone(inCanopy) {
    if (!this.ctx || !this.bgmGain) return;
    this.bgmGain.gain.setTargetAtTime(inCanopy ? 0.015 : 0.16, this.ctx.currentTime, 0.25);
  }

  playChime(hz) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const p of [{ mult: 1.0, amp: 0.16, dur: 1.8 }, { mult: 2.0, amp: 0.06, dur: 1.2 }]) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz * p.mult, now);
      env.gain.setValueAtTime(0.0008, now);
      env.gain.exponentialRampToValueAtTime(p.amp, now + 0.014);
      env.gain.exponentialRampToValueAtTime(0.0005, now + p.dur);
      osc.connect(env);
      env.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + p.dur + 0.04);
    }
  }

  /** Authentic Wind-Driven Pipe Organ: 100% pure sine flute/diapason ranks with slow 140ms wind-chest bloom */
  _playPipeOrgan(hz, now, peak = 0.095, dur = 1.45, isPedal = false) {
    const stops = isPedal
      ? [{ mult: 0.5, amp: peak * 0.9 }, { mult: 1.0, amp: peak }, { mult: 2.0, amp: peak * 0.35 }]
      : [{ mult: 1.0, amp: peak }, { mult: 2.0, amp: peak * 0.42 }];

    const attack = isPedal ? 0.18 : 0.12;
    for (const st of stops) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine'; // Pure sine flute pipe — zero triangle/sawtooth Casio buzz!
      osc.frequency.setValueAtTime(hz * st.mult, now);

      env.gain.setValueAtTime(0.0008, now);
      env.gain.exponentialRampToValueAtTime(st.amp, now + attack);
      env.gain.exponentialRampToValueAtTime(st.amp * 0.85, now + dur * 0.65);
      env.gain.exponentialRampToValueAtTime(0.0006, now + dur);

      osc.connect(env);
      env.connect(this.organFilter);
      osc.start(now);
      osc.stop(now + dur + 0.04);
    }
  }

  _tick() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const s = this.step++;
    const i256 = s & 255;
    const bar = (i256 >> 3) & 31;
    const now = this.ctx.currentTime;

    // 1. Deep 32' + 16' + 8' Cathedral Pedal Drone on bar start
    if ((s & 7) === 0) {
      this._playPipeOrgan(SUITE.roots[bar], now, 0.11, 1.85, true);
    }

    // 2. Consonant D Natural Minor Pipe Organ Chorale Melody
    const oHz = SUITE.organLead[i256];
    if (oHz > 0) {
      this._playPipeOrgan(oHz, now, 0.095, 1.05, false);
    }
  }

  updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
    if (!this.ctx || !this.organFilter) return;
    const cutoff = slowMo ? 340 : (inBulletHell ? 680 : 460);
    this.organFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.25);
  }
}

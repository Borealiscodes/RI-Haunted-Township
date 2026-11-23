import { Q16_ONE } from '../core/q16.js';

// 256-Step (32-Bar) Resonant Cathedral Pipe Organ Suite in D Natural Minor
// Features intricate Baroque turns, rising minor-sixth leaps, crystalline 8'+4'+2' stops, and velvet-brush percussion
const SUITE = {
  name: 'Cathedral of Blackwater Cove (32-Bar Organ Suite)',
  stepMs: 185,
  roots: [
    73.42, 65.41, 58.27, 55.00, 49.00, 58.27, 65.41, 73.42,
    73.42, 73.42, 58.27, 58.27, 49.00, 49.00, 55.00, 55.00,
    58.27, 65.41, 73.42, 73.42, 49.00, 58.27, 65.41, 55.00,
    73.42, 58.27, 49.00, 55.00, 73.42, 65.41, 58.27, 73.42
  ],
  // Subtle orchestral pulse (1 = soft felt timpani heartbeat, 2 = delicate wire-brush whisper)
  drums: [
    Array.of(1,0,0,0, 2,0,0,0, 1,0,0,0, 2,0,0,0),
    Array.of(1,0,0,0, 2,0,0,0, 1,0,0,0, 2,0,1,0),
    Array.of(1,0,0,0, 0,0,2,0, 1,0,0,0, 2,0,0,0),
    Array.of(1,0,0,0, 2,0,0,0, 1,0,1,0, 2,0,2,0)
  ],
  // Intricate 256-step haunting D Natural Minor organ melody with Baroque turns & minor-sixth leaps
  organLead: [
    // --- Movement I: Cathedral Toccata & Rising Sixth (Steps 0..63) ---
    440.00, 0, 587.33, 523.25, 466.16, 440.00, 392.00, 440.00,
    466.16, 0, 698.46, 659.25, 587.33, 523.25, 466.16, 440.00,
    392.00, 0, 523.25, 466.16, 440.00, 392.00, 349.23, 329.63,
    349.23, 392.00, 440.00, 523.25, 587.33, 0, 0, 0,
    698.46, 0, 659.25, 587.33, 523.25, 587.33, 659.25, 523.25,
    587.33, 0, 466.16, 440.00, 392.00, 440.00, 466.16, 392.00,
    440.00, 392.00, 349.23, 329.63, 293.66, 329.63, 349.23, 392.00,
    440.00, 0, 293.66, 0, 0, 0, 0, 0,

    // --- Movement II: Blackwater Nocturne Counterpoint (Steps 64..127) ---
    293.66, 349.23, 440.00, 523.25, 587.33, 523.25, 466.16, 440.00,
    392.00, 440.00, 466.16, 523.25, 440.00, 0, 349.23, 0,
    466.16, 523.25, 587.33, 698.46, 659.25, 587.33, 523.25, 466.16,
    440.00, 466.16, 440.00, 392.00, 440.00, 0, 0, 0,
    392.00, 466.16, 587.33, 523.25, 466.16, 440.00, 392.00, 349.23,
    329.63, 392.00, 466.16, 440.00, 392.00, 349.23, 329.63, 293.66,
    349.23, 440.00, 523.25, 466.16, 440.00, 392.00, 349.23, 329.63,
    293.66, 0, 440.00, 0, 293.66, 0, 0, 0,

    // --- Movement III: Belfry Lament & Suspension (Steps 128..191) ---
    587.33, 0, 0, 523.25, 466.16, 523.25, 587.33, 698.46,
    659.25, 0, 0, 587.33, 523.25, 587.33, 659.25, 783.99,
    698.46, 659.25, 587.33, 523.25, 466.16, 440.00, 392.00, 349.23,
    392.00, 440.00, 466.16, 523.25, 440.00, 0, 0, 0,
    466.16, 440.00, 392.00, 349.23, 392.00, 440.00, 466.16, 587.33,
    523.25, 466.16, 440.00, 392.00, 440.00, 523.25, 587.33, 659.25,
    587.33, 523.25, 466.16, 440.00, 392.00, 349.23, 329.63, 293.66,
    329.63, 0, 392.00, 0, 440.00, 0, 0, 0,

    // --- Movement IV: Midnight Fugue & Finale (Steps 192..255) ---
    587.33, 440.00, 523.25, 440.00, 587.33, 659.25, 698.46, 587.33,
    659.25, 523.25, 587.33, 466.16, 523.25, 440.00, 466.16, 392.00,
    440.00, 349.23, 392.00, 329.63, 349.23, 293.66, 329.63, 392.00,
    440.00, 523.25, 587.33, 659.25, 698.46, 0, 0, 0,
    783.99, 698.46, 659.25, 587.33, 698.46, 659.25, 587.33, 523.25,
    659.25, 587.33, 523.25, 466.16, 587.33, 523.25, 466.16, 440.00,
    523.25, 466.16, 440.00, 392.00, 466.16, 440.00, 392.00, 349.23,
    440.00, 0, 587.33, 0, 293.66, 0, 0, 0
  ]
};

export class TownshipSoundscape {
  constructor() {
    this.ctx = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.organFilter = null;
    this.cathedralVerb = null;
    this.noiseBuf = null;
    this.timer = null;
    this.step = 0;
  }

  _createCathedralImpulse(seconds = 2.8, decay = 2.5) {
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

    // Crisp 1350 Hz cathedral presence filter (lets 4' and 2' organ stops shimmer clearly)
    this.organFilter = this.ctx.createBiquadFilter();
    this.organFilter.type = 'lowpass';
    this.organFilter.frequency.value = 1350;
    this.organFilter.Q.value = 0.6;

    this.cathedralVerb = this._createCathedralImpulse(2.8, 2.5);
    const wetGain = this.ctx.createGain();
    wetGain.gain.value = 0.56;

    this.organFilter.connect(this.bgmGain);
    this.organFilter.connect(this.cathedralVerb);
    this.cathedralVerb.connect(wetGain);
    wetGain.connect(this.bgmGain);
    this.bgmGain.connect(this.ctx.destination);

    this.sfxGain.connect(this.ctx.destination);
    this.sfxGain.connect(this.cathedralVerb);

    const len = this.ctx.sampleRate * 0.08;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

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

  /** Crisp, Resonant Cathedral Pipe Organ: 8' Diapason (1x) + 4' Principal (2x) + 2' Fifteenth (4x) */
  _playResonantOrgan(hz, now, peak = 0.085, dur = 0.95, isPedal = false) {
    const stops = isPedal
      ? [{ mult: 0.5, amp: peak * 0.9 }, { mult: 1.0, amp: peak }, { mult: 2.0, amp: peak * 0.45 }]
      : [{ mult: 1.0, amp: peak }, { mult: 2.0, amp: peak * 0.52 }, { mult: 4.0, amp: peak * 0.18 }];

    const attack = isPedal ? 0.11 : 0.032; // Crisp 32ms wind-pipe speech on melody notes
    for (const st of stops) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz * st.mult, now);

      env.gain.setValueAtTime(0.0008, now);
      env.gain.exponentialRampToValueAtTime(st.amp, now + attack);
      env.gain.exponentialRampToValueAtTime(st.amp * 0.82, now + dur * 0.65);
      env.gain.exponentialRampToValueAtTime(0.0006, now + dur);

      osc.connect(env);
      env.connect(this.organFilter);
      osc.start(now);
      osc.stop(now + dur + 0.04);
    }
  }

  /** Soft Velvet-Mallet Timpani Heartbeat (sub-bass thud, zero metallic clang) */
  _playVelvetTimpani(now) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(64, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.18);

    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0008, now + 0.28);

    osc.connect(env);
    env.connect(this.bgmGain);
    osc.start(now);
    osc.stop(now + 0.30);
  }

  /** Delicate Wire-Brush Whisper (subtle 2600 Hz brush swish, zero trash-can shell thump) */
  _playWireBrush(now) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2600;
    bp.Q.value = 1.4;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0008, now);
    env.gain.exponentialRampToValueAtTime(0.042, now + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0005, now + 0.065);

    src.connect(bp);
    bp.connect(env);
    env.connect(this.bgmGain);
    env.connect(this.cathedralVerb);
    src.start(now);
  }

  _tick() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const s = this.step++;
    const i256 = s & 255;
    const i16 = s & 15;
    const bar = (i256 >> 3) & 31;
    const movement = (i256 >> 6) & 3;
    const now = this.ctx.currentTime;

    // 1. Deep 32'+16'+8' Cathedral Pedal Organ on bar downbeat
    if ((s & 7) === 0) {
      const r = SUITE.roots[bar];
      this._playResonantOrgan(r, now, 0.09, 1.65, true);
      this._playResonantOrgan(r * 2.0, now, 0.045, 1.65, false);
    }

    // 2. Whisper-Subtle Velvet Timpani & Wire-Brush Pulse
    const dType = SUITE.drums[movement][i16];
    if (dType === 1) this._playVelvetTimpani(now);
    if (dType === 2) this._playWireBrush(now);

    // 3. Crisp, Resonant 32-Bar Baroque Organ Counterpoint Melody
    const oHz = SUITE.organLead[i256];
    if (oHz > 0) {
      const isEighthRun = (i256 & 1) === 1 || (SUITE.organLead[(i256 + 1) & 255] > 0);
      this._playResonantOrgan(oHz, now, 0.088, isEighthRun ? 0.32 : 0.85, false);
    }
  }

  updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
    if (!this.ctx || !this.organFilter) return;
    const cutoff = slowMo ? 750 : (inBulletHell ? 1750 : 1350);
    this.organFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.25);
  }
}

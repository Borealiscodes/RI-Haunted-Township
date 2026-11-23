import { Q16_ONE } from '../core/q16.js';

// 256-Step (32-Bar) Phantom-of-the-Opera-Style Gothic Pipe Organ & Cathedral Percussion Suite
// Pure D Natural Minor (D, E, F, G, A, Bb, C) with 32'+16'+8' Reed/Flute Organ & Reverberated Snare/Timpani
const SUITE = {
  name: 'Phantom of Blackwater Cove (Organ & Cathedral Drums)',
  stepMs: 195,
  // 32 bar roots (D2=73.42, C2=65.41, Bb1=58.27, A1=55.00, G1=49.00)
  roots: [
    73.42, 65.41, 58.27, 55.00, 49.00, 58.27, 65.41, 73.42,
    73.42, 73.42, 58.27, 58.27, 49.00, 49.00, 55.00, 55.00,
    58.27, 65.41, 73.42, 73.42, 49.00, 58.27, 65.41, 55.00,
    73.42, 58.27, 49.00, 55.00, 73.42, 65.41, 58.27, 73.42
  ],
  // Dramatic Phantom-style orchestral percussion per movement (1 = Timpani Kick, 2 = Cathedral Snare Crack)
  drums: [
    Array.of(1,0,0,0, 2,0,0,0, 1,0,1,0, 2,0,0,0), // Movement I: Stately Gothic March
    Array.of(1,0,0,0, 2,0,0,1, 1,0,0,0, 2,0,1,0), // Movement II: Phantom Rock-Organ Pulse
    Array.of(1,0,0,0, 2,0,0,0, 1,0,0,0, 2,0,2,0), // Movement III: Requiem Build
    Array.of(1,0,1,0, 2,0,1,0, 1,0,1,0, 2,0,2,2)  // Movement IV: Full Toccata Finale
  ],
  // 256-step (32-bar) dramatic D Natural Minor organ melody
  organLead: [
    // --- Movement I: Phantom Overture (Steps 0..63) ---
    587.33, 0, 523.25, 0, 440.00, 0, 0, 0,  466.16, 0, 440.00, 0, 392.00, 0, 0, 0,
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
    this.noiseBuf = null;
    this.timer = null;
    this.step = 0;
  }

  _createCathedralImpulse(seconds = 2.4, decay = 2.7) {
    const rate = this.ctx.sampleRate;
    const len = (rate * seconds) | 0;
    const ir = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const env = Math.pow(1 - i / len, decay);
        data[i] = (Math.random() * 2 - 1) * env * 0.48;
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
    this.bgmGain.gain.value = 0.17;

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.25;

    // Warm cathedral reed+flute lowpass (520 Hz) — rich Phantom warmth with zero buzz
    this.organFilter = this.ctx.createBiquadFilter();
    this.organFilter.type = 'lowpass';
    this.organFilter.frequency.value = 520;
    this.organFilter.Q.value = 0.8;

    this.cathedralVerb = this._createCathedralImpulse(2.4, 2.7);
    const wetGain = this.ctx.createGain();
    wetGain.gain.value = 0.52;

    this.organFilter.connect(this.bgmGain);
    this.organFilter.connect(this.cathedralVerb);
    this.cathedralVerb.connect(wetGain);
    wetGain.connect(this.bgmGain);
    this.bgmGain.connect(this.ctx.destination);

    this.sfxGain.connect(this.ctx.destination);
    this.sfxGain.connect(this.cathedralVerb);

    const len = this.ctx.sampleRate * 0.18;
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
    this.bgmGain.gain.setTargetAtTime(inCanopy ? 0.015 : 0.17, this.ctx.currentTime, 0.25);
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

  /** Phantom-style Cathedral Pipe Organ: 32' Sub-Bourdon + 16' Principal Reed + 8' Diapason + 4' Flute */
  _playPhantomOrgan(hz, now, peak = 0.095, dur = 1.45, isPedal = false) {
    const stops = isPedal
      ? [
          { mult: 0.5, amp: peak * 0.95, type: 'sine' },
          { mult: 1.0, amp: peak * 0.85, type: 'sawtooth' }, // Warm reed body filtered at 520 Hz
          { mult: 2.0, amp: peak * 0.40, type: 'sine' }
        ]
      : [
          { mult: 1.0, amp: peak, type: 'sine' },
          { mult: 1.0, amp: peak * 0.35, type: 'sawtooth' }, // Subtle reed presence
          { mult: 2.0, amp: peak * 0.45, type: 'sine' }
        ];

    const attack = isPedal ? 0.12 : 0.085;
    for (const st of stops) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = st.type;
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

  /** Booming Orchestral Timpani Kick inside the Cathedral Reverb */
  _playTimpaniKick(now) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(98, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.22);

    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.24, now + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0008, now + 0.34);

    osc.connect(env);
    env.connect(this.bgmGain);
    osc.connect(this.cathedralVerb);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  /** Dramatic Cathedral Snare Crack (shell body thump + snare wire burst routed into ConvolverNode hall) */
  _playCathedralSnare(now) {
    // 1. Snare wire burst
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1400;
    bp.Q.value = 0.9;

    const nEnv = this.ctx.createGain();
    nEnv.gain.setValueAtTime(0.001, now);
    nEnv.gain.exponentialRampToValueAtTime(0.14, now + 0.01);
    nEnv.gain.exponentialRampToValueAtTime(0.0008, now + 0.16);

    src.connect(bp);
    bp.connect(nEnv);
    nEnv.connect(this.bgmGain);
    nEnv.connect(this.cathedralVerb);
    src.start(now);

    // 2. Drum shell resonance (185 Hz -> 115 Hz)
    const body = this.ctx.createOscillator();
    const bEnv = this.ctx.createGain();
    body.type = 'sine';
    body.frequency.setValueAtTime(185, now);
    body.frequency.exponentialRampToValueAtTime(115, now + 0.09);
    bEnv.gain.setValueAtTime(0.12, now);
    bEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    body.connect(bEnv);
    bEnv.connect(this.bgmGain);
    body.start(now);
    body.stop(now + 0.12);
  }

  _tick() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const s = this.step++;
    const i256 = s & 255;
    const i16 = s & 15;
    const bar = (i256 >> 3) & 31;
    const movement = (i256 >> 6) & 3;
    const now = this.ctx.currentTime;

    // 1. Full Phantom Organ Power-Chord Pedal (32' + 16' + 8' root + fifth) on bar downbeat
    if ((s & 7) === 0) {
      const r = SUITE.roots[bar];
      this._playPhantomOrgan(r, now, 0.10, 1.75, true);
      this._playPhantomOrgan(r * 1.498, now, 0.055, 1.75, false);
    }

    // 2. Dramatic Cathedral Timpani & Reverberated Snare Drum
    const dType = SUITE.drums[movement][i16];
    if (dType === 1) this._playTimpaniKick(now);
    if (dType === 2) this._playCathedralSnare(now);

    // 3. Soaring D Natural Minor Pipe Organ Melody
    const oHz = SUITE.organLead[i256];
    if (oHz > 0) {

this._playPhantomOrgan(oHz, now, 0.095, 1.05, false);
}
}
updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
if (!this.ctx || !this.organFilter) return;
const cutoff = slowMo ? 380 : (inBulletHell ? 760 : 520);
this.organFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.25);
}
}

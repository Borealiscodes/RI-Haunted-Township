import { Q16_ONE } from '../core/q16.js';

// 256-Step (32-Bar) Haunted New England Church Pipe Organ Suite
// Features: 4.6s pre-delayed stone-nave ConvolverNode, Voix Celeste (+-3.5 cent) shimmer, & distant church bell tolls
const SUITE = {
  name: 'Haunted Nave of Blackwater Cove (32-Bar Organ)',
  stepMs: 195,
  roots: [
    73.42, 65.41, 58.27, 55.00, 49.00, 58.27, 65.41, 73.42,
    73.42, 73.42, 58.27, 58.27, 49.00, 49.00, 55.00, 55.00,
    58.27, 65.41, 73.42, 73.42, 49.00, 58.27, 65.41, 55.00,
    73.42, 58.27, 49.00, 55.00, 73.42, 65.41, 58.27, 73.42
  ],
  drums: [
    Array.of(1,0,0,0, 2,0,0,0, 1,0,0,0, 2,0,0,0),
    Array.of(1,0,0,0, 2,0,0,0, 1,0,0,0, 2,0,1,0),
    Array.of(1,0,0,0, 0,0,2,0, 1,0,0,0, 2,0,0,0),
    Array.of(1,0,0,0, 2,0,0,0, 1,0,1,0, 2,0,2,0)
  ],
  // Intricate 256-step D-minor melody with eerie Baroque turns & clean C#->D haunted cadences
  organLead: [
    // --- Movement I: Haunted Nave Overture (Steps 0..63) ---
    440.00, 0, 587.33, 523.25, 466.16, 440.00, 392.00, 440.00,
    466.16, 0, 698.46, 659.25, 587.33, 523.25, 466.16, 440.00,
    392.00, 0, 523.25, 466.16, 440.00, 392.00, 349.23, 329.63,
    349.23, 392.00, 440.00, 523.25, 587.33, 0, 0, 0,
    698.46, 0, 659.25, 587.33, 523.25, 587.33, 659.25, 523.25,
    587.33, 0, 466.16, 440.00, 392.00, 440.00, 466.16, 392.00,
    440.00, 392.00, 349.23, 329.63, 277.18, 0, 293.66, 0, // Eerie C#4 -> D4 church cadence!
    0, 0, 0, 0, 0, 0, 0, 0,

    // --- Movement II: Whispering Pews Counterpoint (Steps 64..127) ---
    293.66, 349.23, 440.00, 523.25, 587.33, 523.25, 466.16, 440.00,
    392.00, 440.00, 466.16, 523.25, 440.00, 0, 349.23, 0,
    466.16, 523.25, 587.33, 698.46, 659.25, 587.33, 523.25, 466.16,
    440.00, 466.16, 440.00, 392.00, 440.00, 0, 0, 0,
    392.00, 466.16, 587.33, 523.25, 466.16, 440.00, 392.00, 349.23,
    329.63, 392.00, 466.16, 440.00, 392.00, 349.23, 329.63, 293.66,
    349.23, 440.00, 523.25, 466.16, 440.00, 392.00, 277.18, 0,
    293.66, 0, 0, 0, 0, 0, 0, 0,

    // --- Movement III: Belfry Lament & Diminished Shadow (Steps 128..191) ---
    587.33, 0, 0, 523.25, 466.16, 523.25, 587.33, 698.46,
    659.25, 0, 0, 587.33, 523.25, 587.33, 659.25, 783.99,
    698.46, 659.25, 587.33, 523.25, 466.16, 440.00, 392.00, 349.23,
    392.00, 440.00, 466.16, 523.25, 440.00, 0, 0, 0,
    466.16, 440.00, 392.00, 349.23, 392.00, 440.00, 466.16, 587.33,
    523.25, 466.16, 440.00, 392.00, 440.00, 523.25, 587.33, 659.25,
    587.33, 523.25, 466.16, 440.00, 392.00, 349.23, 329.63, 277.18,
    293.66, 0, 0, 0, 0, 0, 0, 0,

    // --- Movement IV: Midnight Fugue & Finale (Steps 192..255) ---
    587.33, 440.00, 523.25, 440.00, 587.33, 659.25, 698.46, 587.33,
    659.25, 523.25, 587.33, 466.16, 523.25, 440.00, 466.16, 392.00,
    440.00, 349.23, 392.00, 329.63, 349.23, 293.66, 329.63, 392.00,
    440.00, 523.25, 587.33, 659.25, 698.46, 0, 0, 0,
    783.99, 698.46, 659.25, 587.33, 698.46, 659.25, 587.33, 523.25,
    659.25, 587.33, 523.25, 466.16, 587.33, 523.25, 466.16, 440.00,
    523.25, 466.16, 440.00, 392.00, 466.16, 440.00, 392.00, 349.23,
    554.37, 0, 587.33, 0, 293.66, 0, 0, 0 // Dramatic C#5 -> D5 -> D4 octave close!
  ]
};

export class TownshipSoundscape {
  constructor() {
    this.ctx = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.organFilter = null;
    this.hauntedNaveVerb = null;
    this.noiseBuf = null;
    this.timer = null;
    this.step = 0;
  }

  /** Cavernous 4.6-second Haunted Stone Nave impulse with 65ms pre-delay & early stone-pillar reflections */
  _createHauntedNaveImpulse(seconds = 4.6, decay = 2.1) {
    const rate = this.ctx.sampleRate;
    const len = (rate * seconds) | 0;
    const preDelay = (rate * 0.065) | 0; // 65ms acoustic gap before stone nave blooms
    const ir = this.ctx.createBuffer(2, len, rate);

    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      // Distinct early stone-arch echoes (38ms, 74ms, 118ms, 175ms)
      for (const tapMs of Array.of(38, 74, 118, 175)) {
        const idx = (((tapMs + ch * 11) / 1000) * rate) | 0;
        if (idx < len) data[idx] = (ch === 0 ? 0.55 : -0.55);
      }
      // Long 4.6s ghostly stone-cathedral tail
      for (let i = preDelay; i < len; i++) {
        const t = (i - preDelay) / (len - preDelay);
        const env = Math.pow(1 - t, decay);
        data[i] += (Math.random() * 2 - 1) * env * 0.52;
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

    this.organFilter = this.ctx.createBiquadFilter();
    this.organFilter.type = 'lowpass';
    this.organFilter.frequency.value = 1400;
    this.organFilter.Q.value = 0.65;

    // Lush 4.6s Haunted Church Nave ConvolverNode (88% wet stone-vault echo!)
    this.hauntedNaveVerb = this._createHauntedNaveImpulse(4.6, 2.1);
    const wetGain = this.ctx.createGain();
    wetGain.gain.value = 0.88;

    const dryGain = this.ctx.createGain();
    dryGain.gain.value = 0.72;

    this.organFilter.connect(dryGain);
    dryGain.connect(this.bgmGain);

    this.organFilter.connect(this.hauntedNaveVerb);
    this.hauntedNaveVerb.connect(wetGain);
    wetGain.connect(this.bgmGain);

    this.bgmGain.connect(this.ctx.destination);

    this.sfxGain.connect(this.ctx.destination);
    this.sfxGain.connect(this.hauntedNaveVerb);

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

  /** Haunted Church Pipe Organ: 8' Diapason + Eerie Voix Celeste (+-3.5 cent draft shimmer) + 4' & 2' Pipes */
  _playHauntedOrgan(hz, now, peak = 0.082, dur = 1.0, isPedal = false) {
    const stops = isPedal
      ? [
          { mult: 0.5, cents: 0, amp: peak * 0.9 },
          { mult: 1.0, cents: 0, amp: peak },
          { mult: 2.0, cents: 0, amp: peak * 0.42 }
        ]
      : [
          { mult: 1.0, cents: -3.5, amp: peak * 0.72 }, // Ghostly Voix Celeste left pipe
          { mult: 1.0, cents:  3.5, amp: peak * 0.72 }, // Ghostly Voix Celeste right pipe
          { mult: 2.0, cents:  0.0, amp: peak * 0.48 }, // 4' Principal
          { mult: 4.0, cents:  0.0, amp: peak * 0.16 }  // 2' Fifteenth shimmer
        ];

    const attack = isPedal ? 0.12 : 0.036;
    for (const st of stops) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz * st.mult, now);
      if (st.cents !== 0) osc.detune.setValueAtTime(st.cents, now);

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

  /** Distant Haunted Church Bell Toll on Movement Transitions */
  _playDistantChurchBell(hz, now) {
    for (const p of [{ mult: 1.0, amp: 0.065, dur: 3.4 }, { mult: 2.0, amp: 0.03, dur: 2.2 }, { mult: 2.4, amp: 0.018, dur: 1.4 }]) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz * p.mult, now);
      env.gain.setValueAtTime(0.0008, now);
      env.gain.exponentialRampToValueAtTime(p.amp, now + 0.025);
      env.gain.exponentialRampToValueAtTime(0.0004, now + p.dur);
      osc.connect(env);
      env.connect(this.hauntedNaveVerb);
      osc.start(now);
      osc.stop(now + p.dur + 0.05);
    }
  }

  _playVelvetTimpani(now) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(64, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.18);
    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.13, now + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0008, now + 0.28);
    osc.connect(env);
    env.connect(this.bgmGain);
    osc.start(now);
    osc.stop(now + 0.30);
  }

  _playWireBrush(now) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2600;
    bp.Q.value = 1.4;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0008, now);
    env.gain.exponentialRampToValueAtTime(0.038, now + 0.012);
env.gain.exponentialRampToValueAtTime(0.0005, now + 0.065);
src.connect(bp);
bp.connect(env);
env.connect(this.bgmGain);
env.connect(this.hauntedNaveVerb);
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
// Distant haunted church bell toll at the start of every 8-bar movement
if ((i256 & 63) === 0) {
this._playDistantChurchBell(146.83, now);
}
if ((s & 7) === 0) {
const r = SUITE.roots[bar];
this._playHauntedOrgan(r, now, 0.088, 1.75, true);
this._playHauntedOrgan(r * 2.0, now, 0.042, 1.75, false);
}
const dType = SUITE.drums[movement][i16];
if (dType === 1) this._playVelvetTimpani(now);
if (dType === 2) this._playWireBrush(now);
const oHz = SUITE.organLead[i256];
if (oHz > 0) {
const isEighthRun = (i256 & 1) === 1 || (SUITE.organLead[(i256 + 1) & 255] > 0);
this._playHauntedOrgan(oHz, now, 0.084, isEighthRun ? 0.34 : 0.90, false);
}
}
updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
if (!this.ctx || !this.organFilter) return;
const cutoff = slowMo ? 750 : (inBulletHell ? 1750 : 1400);
this.organFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.25);
}
}

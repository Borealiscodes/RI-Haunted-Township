import { Q16_ONE } from '../core/q16.js';

// One cohesive 256-step (32-bar, ~48-second) Castlevania-inspired D-Harmonic Minor Suite:
// Bars 0..7:   Movement I   — Chapel Toccata Intro (Pedal D2 + Descending Organ Chorale)
// Bars 8..15:  Movement II  — Blackwater Nocturne Verse (Walking Bass + Harpsichord Counterpoint)
// Bars 16..23: Movement III — Bell-Tower Requiem Bridge (Minor-Sixth Rising Ostinato)
// Bars 24..31: Movement IV  — Midnight Reckoning Finale (Full Organ + Driving Toccata Run)
const SUITE = {
  name: 'Symphony of Blackwater Cove (32-Bar Suite)',
  stepMs: 185,
  // 32 bar roots (D2=73.42, C2=65.41, Bb1=58.27, A1=55.00, G1=49.00, F1=43.65, E1=41.20)
  roots: [
    // I. Chapel Toccata Intro (0..7)
    73.42, 65.41, 58.27, 55.00, 49.00, 58.27, 55.00, 73.42,
    // II. Blackwater Nocturne Verse (8..15)
    73.42, 73.42, 58.27, 58.27, 49.00, 49.00, 55.00, 55.00,
    // III. Bell-Tower Requiem Bridge (16..23)
    58.27, 65.41, 73.42, 73.42, 49.00, 43.65, 41.20, 55.00,
    // IV. Midnight Reckoning Finale (24..31)
    73.42, 58.27, 49.00, 55.00, 73.42, 65.41, 58.27, 55.00
  ],
  // 16-step bar motifs per movement (1 = pedal bass, 2 = brushed snare/timpani, 0 = rest)
  rhythm: [
    Array.of(1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0), // I. Solemn Intro
    Array.of(1,0,0,0, 2,0,0,0, 1,0,0,0, 2,0,1,0), // II. Nocturne Pulse
    Array.of(1,0,0,0, 0,0,2,0, 1,0,0,0, 2,0,0,0), // III. Requiem Bridge
    Array.of(1,0,2,0, 1,0,2,0, 1,0,2,0, 2,0,1,2)  // IV. Toccata Finale
  ],
  // 4 distinct 64-step movements (4 x 64 = 256 steps) in D Harmonic Minor (D, E, F, G, A, Bb, C#)
  organLead: [
    // --- Movement I: Chapel Toccata Intro (Steps 0..63) ---
    587.33, 0, 554.37, 587.33, 440.00, 0, 0, 0,  466.16, 0, 440.00, 392.00, 349.23, 0, 0, 0,
    392.00, 0, 349.23, 329.63, 293.66, 0, 0, 0,  277.18, 0, 329.63, 0, 440.00, 0, 0, 0,
    587.33, 0, 554.37, 587.33, 698.46, 0, 0, 0,  659.25, 0, 587.33, 554.37, 587.33, 0, 0, 0,
    466.16, 0, 440.00, 392.00, 349.23, 0, 329.63, 0,  293.66, 0, 0, 0, 0, 0, 0, 0,

    // --- Movement II: Blackwater Nocturne Verse (Steps 64..127) ---
    440.00, 0, 349.23, 392.00, 440.00, 0, 523.25, 0,  440.00, 0, 392.00, 349.23, 329.63, 0, 293.66, 0,
    349.23, 0, 440.00, 466.16, 523.25, 0, 466.16, 0,  440.00, 0, 392.00, 349.23, 392.00, 0, 0, 0,
    392.00, 0, 466.16, 440.00, 392.00, 0, 349.23, 0,  329.63, 0, 349.23, 392.00, 440.00, 0, 0, 0,
    466.16, 0, 440.00, 392.00, 349.23, 0, 329.63, 0,  277.18, 0, 329.63, 0, 293.66, 0, 0, 0,

    // --- Movement III: Bell-Tower Requiem Bridge (Steps 128..191) ---
    466.16, 0, 0, 440.00, 466.16, 0, 587.33, 0,  523.25, 0, 0, 466.16, 523.25, 0, 659.25, 0,
    587.33, 0, 554.37, 0, 587.33, 0, 698.46, 0,  659.25, 0, 587.33, 0, 440.00, 0, 0, 0,
    392.00, 0, 466.16, 0, 440.00, 0, 392.00, 0,  349.23, 0, 440.00, 0, 392.00, 0, 349.23, 0,
    329.63, 0, 392.00, 0, 349.23, 0, 329.63, 0,  277.18, 0, 329.63, 0, 440.00, 0, 0, 0,

    // --- Movement IV: Midnight Reckoning Toccata Finale (Steps 192..255) ---
    587.33, 440.00, 554.37, 440.00, 587.33, 440.00, 698.46, 440.00,
    659.25, 440.00, 587.33, 440.00, 554.37, 440.00, 587.33, 0,
    466.16, 349.23, 440.00, 349.23, 392.00, 349.23, 329.63, 293.66,
    277.18, 293.66, 329.63, 349.23, 440.00, 0, 0, 0,
    587.33, 554.37, 587.33, 659.25, 698.46, 659.25, 587.33, 554.37,
    587.33, 440.00, 466.16, 440.00, 392.00, 349.23, 329.63, 293.66,
    349.23, 329.63, 293.66, 277.18, 293.66, 329.63, 349.23, 440.00,
    587.33, 0, 440.00, 0, 293.66, 0, 0, 0
  ],
  // Harpsichord baroque arpeggio counterpoint (active on off-beats & bridges)
  harpsichord: [
    0, 0, 440.00, 0, 0, 0, 349.23, 0,  0, 0, 392.00, 0, 0, 0, 293.66, 0,
    0, 0, 349.23, 0, 0, 0, 293.66, 0,  0, 0, 329.63, 0, 0, 0, 277.18, 0,
    0, 0, 440.00, 0, 0, 0, 523.25, 0,  0, 0, 466.16, 0, 0, 0, 440.00, 0,
    0, 0, 392.00, 0, 0, 0, 349.23, 0,  0, 0, 293.66, 0, 0, 0, 0, 0,

    0, 293.66, 0, 349.23, 0, 440.00, 0, 349.23,  0, 293.66, 0, 349.23, 0, 440.00, 0, 349.23,
    0, 233.08, 0, 293.66, 0, 349.23, 0, 293.66,  0, 233.08, 0, 293.66, 0, 349.23, 0, 293.66,
    0, 196.00, 0, 293.66, 0, 392.00, 0, 293.66,  0, 196.00, 0, 293.66, 0, 392.00, 0, 293.66,
    0, 220.00, 0, 277.18, 0, 329.63, 0, 440.00,  0, 329.63, 0, 277.18, 0, 220.00, 0, 0,

    0, 0, 349.23, 0, 0, 0, 466.16, 0,  0, 0, 392.00, 0, 0, 0, 523.25, 0,
    0, 0, 440.00, 0, 0, 0, 587.33, 0,  0, 0, 440.00, 0, 0, 0, 349.23, 0,
    0, 0, 293.66, 0, 0, 0, 392.00, 0,  0, 0, 261.63, 0, 0, 0, 349.23, 0,
    0, 0, 246.94, 0, 0, 0, 329.63, 0,  0, 0, 277.18, 0, 0, 0, 440.00, 0,

    0, 293.66, 0, 440.00, 0, 587.33, 0, 440.00,  0, 233.08, 0, 349.23, 0, 466.16, 0, 349.23,
    0, 196.00, 0, 293.66, 0, 392.00, 0, 293.66,  0, 220.00, 0, 277.18, 0, 329.63, 0, 440.00,
    0, 293.66, 0, 440.00, 0, 587.33, 0, 440.00,  0, 261.63, 0, 392.00, 0, 523.25, 0, 392.00,
    0, 233.08, 0, 349.23, 0, 466.16, 0, 349.23,  0, 220.00, 0, 277.18, 0, 329.63, 0, 0
  ]
};

export class TownshipSoundscape {
  constructor() {
    this.ctx = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.organFilter = null;
    this.noiseBuf = null;
    this.timer = null;
    this.step = 0;
  }

  start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctor();

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.14;

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.25;

    // Warm cathedral organ lowpass (680 Hz -> 1150 Hz during Danmaku finale)
    this.organFilter = this.ctx.createBiquadFilter();
    this.organFilter.type = 'lowpass';
    this.organFilter.frequency.value = 680;
    this.organFilter.Q.value = 0.7;

    const reverb = this.ctx.createDelay(1.2);
    reverb.delayTime.value = 0.36;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.24;
    reverb.connect(fb);
    fb.connect(reverb);

    this.organFilter.connect(this.bgmGain);
    reverb.connect(this.bgmGain);
    this.bgmGain.connect(this.ctx.destination);
    this.hallBus = reverb;

    const chimeDelay = this.ctx.createDelay(1.2);
    chimeDelay.delayTime.value = 0.34;
    const cFb = this.ctx.createGain();
    cFb.gain.value = 0.22;
    chimeDelay.connect(cFb);
    cFb.connect(chimeDelay);
    chimeDelay.connect(this.sfxGain);
    this.sfxGain.connect(this.ctx.destination);
    this.chimeEcho = chimeDelay;

    const len = this.ctx.sampleRate * 0.12;
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
    this.bgmGain.gain.setTargetAtTime(inCanopy ? 0.015 : 0.14, this.ctx.currentTime, 0.25);
  }

  playChime(hz) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const p of [{ mult: 1.0, amp: 0.16, dur: 1.8 }, { mult: 2.0, amp: 0.07, dur: 1.2 }]) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz * p.mult, now);
      env.gain.setValueAtTime(0.0008, now);
      env.gain.exponentialRampToValueAtTime(p.amp, now + 0.014);
      env.gain.exponentialRampToValueAtTime(0.0005, now + p.dur);
      osc.connect(env);
      env.connect(this.sfxGain);
      env.connect(this.chimeEcho);
      osc.start(now);
      osc.stop(now + p.dur + 0.04);
    }
  }

  /** Dramatic Castlevania Pipe Organ: 16' Sub-Bass + 8' Principal + 4' Octave + 2' Superoctave */
  _playCastlevaniaOrgan(hz, now, peak = 0.085, dur = 1.25, isPedal = false) {
    const stops = isPedal
      ? [{ mult: 1.0, amp: peak, type: 'triangle' }, { mult: 2.0, amp: peak * 0.5, type: 'sine' }]
      : [{ mult: 1.0, amp: peak, type: 'triangle' }, { mult: 2.0, amp: peak * 0.45, type: 'sine' }, { mult: 4.0, amp: peak * 0.16, type: 'sine' }];

    for (const st of stops) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = st.type;
      osc.frequency.setValueAtTime(hz * st.mult, now);

      env.gain.setValueAtTime(0.0008, now);
      env.gain.exponentialRampToValueAtTime(st.amp, now + (isPedal ? 0.08 : 0.045));
      env.gain.exponentialRampToValueAtTime(st.amp * 0.8, now + dur * 0.65);
      env.gain.exponentialRampToValueAtTime(0.0006, now + dur);

      osc.connect(env);
      env.connect(this.organFilter);
      if (!isPedal) env.connect(this.hallBus);
      osc.start(now);
      osc.stop(now + dur + 0.04);
    }
  }

  /** Baroque Harpsichord Pluck (crisp 1x + 2x string snap) */
  _playHarpsichord(hz, now) {
    for (const st of [{ mult: 1.0, amp: 0.055 }, { mult: 2.0, amp: 0.03 }]) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(hz * st.mult, now);
      env.gain.setValueAtTime(0.0008, now);
      env.gain.exponentialRampToValueAtTime(st.amp, now + 0.008);
      env.gain.exponentialRampToValueAtTime(0.0005, now + 0.38);
      osc.connect(env);
      env.connect(this.organFilter);
      env.connect(this.hallBus);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  }

  _playTimpaniSnare(now) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1350;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.095, now + 0.014);
    env.gain.exponentialRampToValueAtTime(0.0008, now + 0.13);
    src.connect(bp);
    bp.connect(env);
    env.connect(this.bgmGain);
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
// 1. Deep 16' Cathedral Pedal Bass on bar start
if ((s & 7) === 0) {
this._playCastlevaniaOrgan(SUITE.roots[bar], now, 0.11, 1.55, true);
}
// 2. Movement-specific percussion pulse
const rType = SUITE.rhythm[movement][i16];
if (rType === 2) this._playTimpaniSnare(now);
// 3. Dramatic Castlevania Pipe Organ Lead
const oHz = SUITE.organLead[i256];
if (oHz > 0) {
const isFastRun = movement === 3 && (i256 & 15) < 8;
this._playCastlevaniaOrgan(oHz, now, 0.085, isFastRun ? 0.34 : 0.92, false);
}
// 4. Baroque Harpsichord Counterpoint
const hHz = SUITE.harpsichord[i256];
if (hHz > 0) this._playHarpsichord(hHz, now);
}
updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
if (!this.ctx || !this.organFilter) return;
const cutoff = slowMo ? 420 : (inBulletHell ? 1150 : 680);
this.organFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.2);
}
}

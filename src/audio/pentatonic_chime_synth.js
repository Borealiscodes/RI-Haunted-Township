import { Q16_ONE, q16Clamp } from '../core/q16.js';

const TRACKS = {
  HARBOR: {
    name: 'I. Blackwater Tide',
    stepMs: 220,
    bass:   [73.42, 0, 110.00, 73.42, 58.27, 0, 87.31, 58.27, 49.00, 0, 73.42, 49.00, 55.00, 0, 82.41, 55.00],
    chords: [[146.83, 174.61, 220.00], null, null, null, [116.54, 174.61, 220.00], null, null, null, [98.00, 146.83, 174.61], null, null, null, [110.00, 138.59, 164.81], null, null, null],
    lead:   [293.66, 0, 349.23, 0, 440.00, 415.30, 349.23, 329.63, 293.66, 0, 261.63, 0, 277.18, 329.63, 293.66, 0],
    kick: [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,0],
    hat:  [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,1,1,0],
    metallic: false
  },
  CANOPY: {
    name: 'II. Wind-Chime Belfry',
    stepMs: 195,
    bass:   [73.42, 73.42, 0, 110.00, 65.41, 65.41, 0, 98.00, 58.27, 58.27, 0, 87.31, 55.00, 0, 82.41, 55.00],
    chords: [[146.83, 174.61, 220.00], null, null, null, [130.81, 155.56, 196.00], null, null, null, [116.54, 146.83, 174.61], null, null, null, [110.00, 138.59, 164.81], null, null, null],
    lead:   [293.66, 311.13, 392.00, 440.00, 466.16, 0, 440.00, 392.00, 311.13, 293.66, 0, 392.00, 440.00, 466.16, 587.33, 0],
    kick: [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],
    hat:  [1,0,1,1, 1,0,1,1, 1,0,1,1, 1,1,1,0],
    metallic: true
  },
  DANMAKU: {
    name: 'III. Walpurgis Reckoning',
    stepMs: 125,
    bass:   [73.42, 146.83, 73.42, 146.83, 77.78, 155.56, 77.78, 155.56, 82.41, 164.81, 82.41, 164.81, 87.31, 174.61, 110.00, 220.00],
    chords: [[146.83, 174.61, 220.00], null, [146.83, 174.61, 220.00], null, [155.56, 196.00, 233.08], null, [155.56, 196.00, 233.08], null, [164.81, 196.00, 246.94], null, null, null, [110.00, 138.59, 164.81], null, [110.00, 138.59, 164.81], null],
    lead:   [587.33, 440.00, 466.16, 440.00, 554.37, 440.00, 392.00, 349.23, 329.63, 349.23, 392.00, 440.00, 466.16, 554.37, 587.33, 659.25],
    kick: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,1,1,1],
    hat:  [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    metallic: false
  }
};

export class TownshipSoundscape {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.filter = null;
    this.noiseBuf = null;
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
    this.master.gain.value = 0.34;

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 1400;

    const delay = this.ctx.createDelay(1.0);
    delay.delayTime.value = 0.33;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.36;
    delay.connect(fb);
    fb.connect(delay);

    this.filter.connect(this.master);
    this.filter.connect(delay);
    delay.connect(this.master);
    this.master.connect(this.ctx.destination);

    // Pre-build short noise buffer for crisp hi-hat / snare brush percussion
    const len = this.ctx.sampleRate * 0.12;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    this._scheduleTimer();
  }

  _scheduleTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this._tick(), TRACKS[this.currentTrackKey].stepMs);
  }

  setTrack(trackKey) {
    if (TRACKS[trackKey] && this.currentTrackKey !== trackKey) {
      this.currentTrackKey = trackKey;
      this.step = 0;
      if (this.ctx) this._scheduleTimer();
    }
    return TRACKS[this.currentTrackKey].name;
  }

  _playKick(now) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(118, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.14);
    env.gain.setValueAtTime(0.35, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(env);
    env.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  _playHat(now, accent = false) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = accent ? 4200 : 6800;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(accent ? 0.08 : 0.035, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + (accent ? 0.09 : 0.045));
    src.connect(hp);
    hp.connect(env);
    env.connect(this.master);
    src.start(now);
  }

  _playBass(hz, now) {
    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sawtooth';
    sub.type = 'triangle';
    osc.frequency.setValueAtTime(hz, now);
    sub.frequency.setValueAtTime(hz * 0.5, now);
    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
    osc.connect(env);
    sub.connect(env);
    env.connect(this.filter);
    osc.start(now);
    sub.start(now);
    osc.stop(now + 0.36);
    sub.stop(now + 0.36);
  }

  _playChord(notes, now) {
    for (const hz of notes) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(hz, now);
      env.gain.setValueAtTime(0.001, now);
      env.gain.exponentialRampToValueAtTime(0.045, now + 0.08);
      env.gain.exponentialRampToValueAtTime(0.0008, now + 0.85);
      osc.connect(env);
      env.connect(this.filter);
      osc.start(now);
      osc.stop(now + 0.88);
    }
  }

  playChime(hz, metallic = true) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const over = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    over.type = 'triangle';
    osc.frequency.setValueAtTime(hz, now);
    over.frequency.setValueAtTime(hz * (metallic ? 2.756 : 2.0), now);
    const ovG = this.ctx.createGain();
    ovG.gain.value = 0.035;
    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.11, now + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0008, now + (metallic ? 1.1 : 0.32));
    osc.connect(env);
    over.connect(ovG);
    ovG.connect(env);
    env.connect(this.filter);
    osc.start(now);
    over.start(now);
    osc.stop(now + 1.15);
    over.stop(now + 1.15);
  }

  _tick() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const trk = TRACKS[this.currentTrackKey];
    const i = this.step++ & 15;
    const now = this.ctx.currentTime;

    if (trk.kick[i]) this._playKick(now);
    if (trk.hat[i]) this._playHat(now, (i & 3) === 2);
    if (trk.bass[i] > 0) this._playBass(trk.bass[i], now);
    if (trk.chords[i]) this._playChord(trk.chords[i], now);
    if (trk.lead[i] > 0) this.playChime(trk.lead[i], trk.metallic);
  }

  updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
    if (!this.ctx || !this.filter) return;
    const cutoff = slowMo ? 480 : (inBulletHell ? 2400 : 1350);
    this.filter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.12);
  }
}

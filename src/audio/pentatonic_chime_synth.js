import { Q16_ONE, q16Clamp } from '../core/q16.js';

const TRACKS = {
  HARBOR: {
    name: 'I. Blackwater Tide',
    tempoMs: 340,
    bass: [73.42, 58.27, 49.00, 55.00, 73.42, 65.41, 51.91, 55.00],
    lead: [293.66, 0, 349.23, 329.63, 293.66, 0, 261.63, 220.00],
    metallic: false
  },
  CANOPY: {
    name: 'II. Wind-Chime Belfry',
    tempoMs: 280,
    bass: [73.42, 73.42, 65.41, 65.41, 58.27, 58.27, 55.00, 55.00],
    lead: [293.66, 311.13, 392.00, 440.00, 466.16, 440.00, 392.00, 311.13],
    metallic: true
  },
  DANMAKU: {
    name: 'III. Walpurgis Reckoning',
    tempoMs: 165,
    bass: [73.42, 146.83, 77.78, 155.56, 82.41, 164.81, 87.31, 174.61],
    lead: [587.33, 440.00, 466.16, 440.00, 554.37, 440.00, 392.00, 349.23],
    metallic: false
  }
};

export class TownshipSoundscape {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.cello1 = null;
    this.cello2 = null;
    this.filter = null;
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
    this.filter.frequency.value = 420;

    const delay = this.ctx.createDelay(1.2);
    delay.delayTime.value = 0.38;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.42;
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
    this.cello2.frequency.value = 110.0;

    const cGain = this.ctx.createGain();
    cGain.gain.value = 0.16;
    this.cello1.connect(cGain);
    this.cello2.connect(cGain);
    cGain.connect(this.filter);
    this.cello1.start();
    this.cello2.start();

    this._scheduleTimer();
  }

  _scheduleTimer() {
    if (this.timer) clearInterval(this.timer);
    const trk = TRACKS[this.currentTrackKey];
    this.timer = setInterval(() => this._tick(), trk.tempoMs);
  }

  setTrack(trackKey) {
    if (TRACKS[trackKey] && this.currentTrackKey !== trackKey) {
      this.currentTrackKey = trackKey;
      this.step = 0;
      if (this.ctx) this._scheduleTimer();
    }
    return TRACKS[this.currentTrackKey].name;
  }

  playChime(hz, metallic = true) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, now);
    overtone.type = 'triangle';
    overtone.frequency.setValueAtTime(hz * (metallic ? 2.756 : 3.98), now);

    const ovGain = this.ctx.createGain();
    ovGain.gain.value = 0.04;

    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.12, now + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0006, now + (metallic ? 1.25 : 0.24));

    osc.connect(env);
    overtone.connect(ovGain);
    ovGain.connect(env);
    env.connect(this.master);

    osc.start(now);
    overtone.start(now);
    osc.stop(now + 1.3);
    overtone.stop(now + 1.3);
  }

  _tick() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const trk = TRACKS[this.currentTrackKey];
    const s = this.step++;
    const bassHz = trk.bass[s % trk.bass.length];
    this.cello1.frequency.setTargetAtTime(bassHz, this.ctx.currentTime, 0.12);
    this.cello2.frequency.setTargetAtTime(bassHz * 1.498, this.ctx.currentTime, 0.12);

    const note = trk.lead[s % trk.lead.length];
    if (note > 0) this.playChime(note, trk.metallic);
  }

  updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
    if (!this.ctx || !this.filter) return;
    const loss = (Q16_ONE - q16Clamp(sanityQ16, 0, Q16_ONE)) / Q16_ONE;
    const cutoff = slowMo ? 240 : (inBulletHell ? 760 : 390 + loss * 320);
    this.filter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.12);
    this.cello2.detune.setTargetAtTime(loss * 50 + (inBulletHell ? 25 : 0), this.ctx.currentTime, 0.12);
  }
}

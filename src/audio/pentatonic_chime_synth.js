import { Q16_ONE, q16Clamp } from '../core/q16.js';

const BASS_NOTES = [73.42, 58.27, 49.00, 55.00, 73.42, 65.41, 51.91, 55.00];
const MARIMBA_SCALE = [293.66, 311.13, 392.00, 440.00, 466.16, 587.33];

export class TownshipSoundscape {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.cello1 = null;
    this.cello2 = null;
    this.filter = null;
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

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.28;

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 390;

    const delay = this.ctx.createDelay(1.2);
    delay.delayTime.value = 0.42;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.45;
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

    this.timer = setInterval(() => this._tick(), 300);
  }

  playChime(hz, metallic = true) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, now);
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(hz * (metallic ? 2.756 : 3.98), now);

    const ovGain = this.ctx.createGain();
    ovGain.gain.value = 0.045;

    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.13, now + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0006, now + (metallic ? 1.4 : 0.25));

    osc.connect(env);
    overtone.connect(ovGain);
    ovGain.connect(env);
    env.connect(this.master);

    osc.start(now);
    overtone.start(now);
    osc.stop(now + 1.45);
    overtone.stop(now + 1.45);
  }

  _tick() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const s = this.step++;
    if ((s & 3) === 0) {
      const hz = BASS_NOTES[(s >> 2) % BASS_NOTES.length];
      this.cello1.frequency.setTargetAtTime(hz, this.ctx.currentTime, 0.2);
      this.cello2.frequency.setTargetAtTime(hz * 1.498, this.ctx.currentTime, 0.2);
    }
    if ((s & 7) === 2 || (s & 7) === 5 || (s & 7) === 7) {
      const note = MARIMBA_SCALE[(s * 3) % MARIMBA_SCALE.length];
      this.playChime(note, false);
    }
  }

  updateTension(sanityQ16 = Q16_ONE, inBulletHell = false) {
    if (!this.ctx || !this.filter) return;
    const loss = (Q16_ONE - q16Clamp(sanityQ16, 0, Q16_ONE)) / Q16_ONE;
    this.filter.frequency.setTargetAtTime(inBulletHell ? 680 : 380 + loss * 320, this.ctx.currentTime, 0.15);
    this.cello2.detune.setTargetAtTime(loss * 55 + (inBulletHell ? 32 : 0), this.ctx.currentTime, 0.15);
  }
}

import { Q16_ONE, q16Clamp } from '../core/q16.js';

const TRACKS = {
  HARBOR: {
    name: 'I. Blackwater Tide (Legato)',
    beatMs: 420,
    bass: [73.42, 58.27, 49.00, 55.00],
    arp:  [293.66, 349.23, 440.00, 523.25, 440.00, 349.23, 329.63, 293.66,
           233.08, 293.66, 349.23, 440.00, 392.00, 349.23, 329.63, 277.18],
    pulse: false
  },
  CANOPY: {
    name: 'II. Wind-Chime Belfry',
    beatMs: 360,
    bass: [73.42, 65.41, 58.27, 55.00],
    arp:  [293.66, 311.13, 392.00, 440.00, 466.16, 587.33, 466.16, 440.00,
           392.00, 311.13, 293.66, 392.00, 440.00, 466.16, 554.37, 587.33],
    pulse: false
  },
  DANMAKU: {
    name: 'III. Walpurgis Reckoning',
    beatMs: 210,
    bass: [73.42, 77.78, 82.41, 87.31],
    arp:  [587.33, 440.00, 466.16, 440.00, 554.37, 440.00, 392.00, 349.23,
           329.63, 392.00, 440.00, 466.16, 554.37, 587.33, 659.25, 587.33],
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
    this.master.gain.value = 0.32;

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 680;
    this.filter.Q.value = 1.6;

    // Lush stereo cathedral reverb tail
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

    // Continuous Legato Bowed Cello with Expressive 4.8 Hz Vibrato LFO
    this.cello1 = this.ctx.createOscillator();
    this.cello1.type = 'sawtooth';
    this.cello1.frequency.value = 73.42;

    this.cello2 = this.ctx.createOscillator();
    this.cello2.type = 'triangle';
    this.cello2.frequency.value = 146.83;

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 4.8;
    lfoGain.gain.value = 1.6;
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

  playChime(hz, metallic = true) {
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
    ovG.gain.value = 0.03;

    // Smooth legato swell & long shimmering decay
    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.095, now + 0.06);
    env.gain.exponentialRampToValueAtTime(0.0006, now + 1.55);

    osc.connect(env);
    over.connect(ovG);
    ovG.connect(env);
    env.connect(this.filter);
    osc.start(now);
    over.start(now);
    osc.stop(now + 1.6);
    over.stop(now + 1.6);
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

    // Smooth portamento cello glide every 4 beats
    if ((s & 3) === 0) {
      const bassHz = trk.bass[(s >> 2) % trk.bass.length];
      this.cello1.frequency.setTargetAtTime(bassHz, now, 0.28);
      this.cello2.frequency.setTargetAtTime(bassHz * 1.498, now, 0.28);
      this.celloGain.gain.setTargetAtTime(0.20, now, 0.18);
      this.celloGain.gain.setTargetAtTime(0.13, now + 0.45, 0.30);
    }

    if (trk.pulse && (s & 1) === 0) this._playHeartbeat(now);

    const note = trk.arp[s % trk.arp.length];
    if (note > 0) this.playChime(note, trk.name.includes('Belfry'));
  }

  updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
    if (!this.ctx || !this.filter) return;
    const cutoff = slowMo ? 340 : (inBulletHell ? 1250 : 680);
    this.filter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.16);
  }
}

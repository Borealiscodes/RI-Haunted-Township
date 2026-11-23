import { Q16_ONE, q16Clamp } from '../core/q16.js';

// Doctor Who-inspired 12-step triplet gallop (dum-da-dum) + gliding Theremin + crisp bone-marimba
const TRACKS = {
  HARBOR: {
    name: 'I. Blackwater Radiophonic (Gallop)',
    stepMs: 175,
    // 12-step triplet gallop pattern (1 = long root, 2 = short triplet pickup, 0 = rest)
    gallop: [1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2],
    roots:  [73.42, 73.42, 73.42, 87.31, 87.31, 87.31, 82.41, 82.41, 82.41, 73.42, 73.42, 65.41],
    theremin: [440.00, 0, 0, 587.33, 0, 0, 523.25, 0, 493.88, 440.00, 0, 0,
               349.23, 0, 0, 329.63, 0, 0, 293.66, 0, 0, 293.66, 0, 0],
    marimba:  [0, 587.33, 0, 0, 440.00, 0, 0, 523.25, 0, 0, 392.00, 0]
  },
  CANOPY: {
    name: 'II. Belfry Theremin & Bone-Marimba',
    stepMs: 175,
    gallop: [1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2],
    roots:  [73.42, 73.42, 73.42, 77.78, 77.78, 77.78, 73.42, 73.42, 73.42, 65.41, 65.41, 65.41],
    theremin: [440.00, 0, 0, 466.16, 0, 0, 587.33, 0, 0, 554.37, 0, 0,
               440.00, 0, 0, 392.00, 0, 0, 311.13, 0, 0, 293.66, 0, 0],
    marimba:  [0, 587.33, 466.16, 0, 440.00, 0, 0, 392.00, 311.13, 0, 293.66, 0]
  },
  DANMAKU: {
    name: 'III. Time-Vortex Reckoning',
    stepMs: 145,
    gallop: [1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2],
    roots:  [73.42, 73.42, 73.42, 87.31, 87.31, 87.31, 98.00, 98.00, 98.00, 82.41, 82.41, 82.41],
    theremin: [587.33, 0, 0, 659.25, 0, 0, 698.46, 0, 659.25, 587.33, 0, 0,
               523.25, 0, 0, 493.88, 0, 0, 440.00, 0, 0, 587.33, 0, 0],
    marimba:  [0, 587.33, 0, 698.46, 0, 587.33, 0, 523.25, 0, 440.00, 0, 587.33]
  }
};

export class TownshipSoundscape {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.bassFilter = null;
    this.thereminOsc = null;
    this.thereminGain = null;
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
    this.master.gain.value = 0.26;

    // Warm Radiophonic tape-echo delay
    const delay = this.ctx.createDelay(1.2);
    delay.delayTime.value = 0.35;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.38;
    delay.connect(fb);
    fb.connect(delay);

    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'lowpass';
    this.bassFilter.frequency.value = 480;
    this.bassFilter.Q.value = 1.4;

    this.bassFilter.connect(this.master);
    delay.connect(this.master);
    this.master.connect(this.ctx.destination);

    // Smooth Portamento Theremin / Ondes Martenot Lead (continuous gliding sine + vibrato)
    this.thereminOsc = this.ctx.createOscillator();
    this.thereminOsc.type = 'sine';
    this.thereminOsc.frequency.value = 440.0;

    const vib = this.ctx.createOscillator();
    const vibGain = this.ctx.createGain();
    vib.frequency.value = 5.2;
    vibGain.gain.value = 3.8;
    vib.connect(vibGain);
    vibGain.connect(this.thereminOsc.frequency);
    vib.start();

    this.thereminGain = this.ctx.createGain();
    this.thereminGain.gain.value = 0.085;
    this.thereminOsc.connect(this.thereminGain);
    this.thereminGain.connect(this.master);
    this.thereminGain.connect(delay);
    this.thereminOsc.start();

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

  _playGallopBass(hz, isLong, now) {
    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'triangle';
    sub.type = 'sine';
    osc.frequency.setValueAtTime(hz, now);
    sub.frequency.setValueAtTime(hz * 0.5, now);

    const dur = isLong ? 0.28 : 0.13;
    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.24, now + 0.025);
    env.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(env);
    sub.connect(env);
    env.connect(this.bassFilter);
    osc.start(now);
    sub.start(now);
    osc.stop(now + dur + 0.02);
    sub.stop(now + dur + 0.02);
  }

  /** Crisp, undiluted hollow wooden bone-marimba strike (bypasses dark bass filter) */
  _playBoneMarimba(hz, now) {
    const carrier = this.ctx.createOscillator();
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const env = this.ctx.createGain();

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(hz, now);

    mod.type = 'sine';
    mod.frequency.setValueAtTime(hz * 3.98, now);
    modGain.gain.setValueAtTime(hz * 2.2, now);
    modGain.gain.exponentialRampToValueAtTime(1.0, now + 0.035);

    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.11, now + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0008, now + 0.21);

    mod.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(env);
    env.connect(this.master);

    carrier.start(now);
    mod.start(now);
    carrier.stop(now + 0.23);
    mod.stop(now + 0.23);
  }

  playChime(hz, bellOvertone = false, dur = 1.2) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (bellOvertone) {
      this._playBoneMarimba(hz, now);
      return;
    }
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, now);
    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
    env.gain.exponentialRampToValueAtTime(0.0006, now + dur);
    osc.connect(env);
    env.connect(this.master);
    osc.start(now);
    osc.stop(now + dur + 0.04);
  }

  _tick() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const trk = TRACKS[this.currentTrackKey];
    const s = this.step++;
    const i12 = s % 12;
    const i24 = s % 24;
    const now = this.ctx.currentTime;

    // 1. Doctor Who Triplet Gallop Bass
    const gType = trk.gallop[i12];
    if (gType > 0) this._playGallopBass(trk.roots[i12], gType === 1, now);

    // 2. Smooth Portamento Theremin Glide
    const tHz = trk.theremin[i24];
    if (tHz > 0) {
      this.thereminOsc.frequency.cancelScheduledValues(now);
      this.thereminOsc.frequency.exponentialRampToValueAtTime(tHz, now + 0.16);
      this.thereminGain.gain.setTargetAtTime(0.095, now, 0.08);
    } else if ((i24 % 6) === 5) {
      this.thereminGain.gain.setTargetAtTime(0.045, now, 0.14);
    }

    // 3. Crisp Hollow Bone-Marimba Counter-Rhythm
    const mHz = trk.marimba[i12];
    if (mHz > 0) this._playBoneMarimba(mHz, now);
  }

  updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
    if (!this.ctx || !this.bassFilter) return;
    const cutoff = slowMo ? 320 : (inBulletHell ? 720 : 480);
    this.bassFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.15);
  }
}

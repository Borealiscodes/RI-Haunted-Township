import { Q16_ONE, q16Clamp } from '../core/q16.js';

// 4 Full 8-Bar (64-step) Coherent Tracks: gentle, atmospheric, and non-aggressive
const TRACKS = {
  HARBOR: {
    name: 'I. Blackwater Tide (90 BPM)',
    stepMs: 166,
    kick:  Array.of(1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0), // Gentle 2-beat coastal pulse
    snare: Array.of(0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0), // Soft rim-brush on beat 4
    hat:   Array.of(0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0),
    // 8-bar chord root progression (Dm -> Bb -> Gm -> A -> Dm -> C -> Bb -> A)
    roots: [73.42, 58.27, 49.00, 55.00, 73.42, 65.41, 58.27, 55.00],
    // 64-step (8-bar) breathing bone-marimba melody with generous rests
    marimba: [
      440.00, 0, 0, 349.23, 392.00, 0, 0, 0,  293.66, 0, 0, 0, 0, 0, 0, 0,
      349.23, 0, 0, 440.00, 466.16, 0, 440.00, 0,  392.00, 0, 0, 0, 0, 0, 0, 0,
      440.00, 0, 523.25, 0, 440.00, 0, 392.00, 0,  349.23, 0, 329.63, 0, 293.66, 0, 0, 0,
      392.00, 0, 0, 349.23, 329.63, 0, 293.66, 0,  329.63, 0, 0, 0, 293.66, 0, 0, 0
    ]
  },
  CANOPY: {
    name: 'II. Belfry Nocturne (Ambient)',
    stepMs: 185,
    kick:  Array.of(0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0), // Weightless nocturnal ambience (no drums)
    snare: Array.of(0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0),
    hat:   Array.of(0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0),
    roots: [73.42, 65.41, 58.27, 55.00, 49.00, 58.27, 65.41, 73.42],
    marimba: [
      293.66, 0, 311.13, 0, 392.00, 0, 440.00, 0,  466.16, 0, 0, 0, 440.00, 0, 0, 0,
      392.00, 0, 311.13, 0, 293.66, 0, 0, 0,  392.00, 0, 440.00, 0, 587.33, 0, 0, 0,
      466.16, 0, 440.00, 0, 392.00, 0, 311.13, 0,  293.66, 0, 0, 0, 0, 0, 0, 0,
      440.00, 0, 392.00, 0, 311.13, 0, 293.66, 0,  392.00, 0, 0, 0, 293.66, 0, 0, 0
    ]
  },
  GUILD: {
    name: 'III. Lantern Groove (96 BPM)',
    stepMs: 156,
    kick:  Array.of(1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0), // Subtle, soft indie pulse
    snare: Array.of(0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0),
    hat:   Array.of(0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0),
    roots: [73.42, 73.42, 58.27, 65.41, 73.42, 49.00, 58.27, 55.00],
    marimba: [
      587.33, 0, 523.25, 440.00, 0, 349.23, 392.00, 0,  440.00, 0, 0, 0, 392.00, 0, 349.23, 0,
      466.16, 0, 440.00, 392.00, 0, 349.23, 329.63, 0,  293.66, 0, 0, 0, 0, 0, 0, 0,
      587.33, 0, 523.25, 440.00, 0, 392.00, 440.00, 0,  523.25, 0, 440.00, 0, 392.00, 0, 349.23, 0,
      329.63, 0, 349.23, 0, 392.00, 0, 329.63, 0,  293.66, 0, 0, 0, 0, 0, 0, 0
    ]
  },
  DANMAKU: {
    name: 'IV. Astral Seal (116 BPM)',
    stepMs: 129,
    kick:  Array.of(1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0),
    snare: Array.of(0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0),
    hat:   Array.of(0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0),
    roots: [73.42, 58.27, 49.00, 55.00, 73.42, 65.41, 58.27, 55.00],
    marimba: [
      587.33, 0, 440.00, 0, 523.25, 0, 440.00, 0,  587.33, 0, 659.25, 0, 587.33, 0, 440.00, 0,
      466.16, 0, 440.00, 0, 392.00, 0, 349.23, 0,  329.63, 0, 392.00, 0, 440.00, 0, 0, 0,
      587.33, 0, 523.25, 0, 440.00, 0, 392.00, 0,  349.23, 0, 392.00, 0, 440.00, 0, 523.25, 0,
      440.00, 0, 392.00, 0, 349.23, 0, 329.63, 0,  293.66, 0, 0, 0, 0, 0, 0, 0
    ]
  }
};

const TRACK_ORDER = Array.of('HARBOR', 'CANOPY', 'GUILD', 'DANMAKU');

export class TownshipSoundscape {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.bassFilter = null;
    this.padFilter = null;
    this.pad1 = null;
    this.pad2 = null;
    this.noiseBuf = null;
    this.timer = null;
    this.step = 0;
    this.currentTrackKey = 'HARBOR';
    this.manualLock = false;
  }

  start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctor();

    // Gentle, balanced master volume so soundtrack supports rather than overwhelms
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.20;

    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'lowpass';
    this.bassFilter.frequency.value = 340;

    this.padFilter = this.ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.value = 380;

    const delay = this.ctx.createDelay(1.0);
    delay.delayTime.value = 0.33;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.30;
    delay.connect(fb);
    fb.connect(delay);

    this.bassFilter.connect(this.master);
    this.padFilter.connect(this.master);
    delay.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.echoBus = delay;

    const len = this.ctx.sampleRate * 0.12;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    // Warm, soft D-minor string pad bed
    this.pad1 = this.ctx.createOscillator();
    this.pad1.type = 'sine';
    this.pad1.frequency.value = 146.83;

    this.pad2 = this.ctx.createOscillator();
    this.pad2.type = 'triangle';
    this.pad2.frequency.value = 220.00;

    const padGain = this.ctx.createGain();
    padGain.gain.value = 0.055;
    this.pad1.connect(padGain);
    this.pad2.connect(padGain);
    padGain.connect(this.padFilter);
    this.pad1.start();
    this.pad2.start();

    this._scheduleTimer();
  }

  _scheduleTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this._tick(), TRACKS[this.currentTrackKey].stepMs);
  }

  cycleTrack() {
    this.manualLock = true;
    const idx = (TRACK_ORDER.indexOf(this.currentTrackKey) + 1) % TRACK_ORDER.length;
    this.currentTrackKey = TRACK_ORDER.at(idx);
    this.step = 0;
    if (this.ctx) this._scheduleTimer();
    return TRACKS[this.currentTrackKey].name;
  }

  setTrack(trackKey) {
    if (this.manualLock && trackKey !== 'DANMAKU') return TRACKS[this.currentTrackKey].name;
    if (TRACKS[trackKey] && this.currentTrackKey !== trackKey) {
      this.currentTrackKey = trackKey;
      this.step = 0;
      if (this.ctx) this._scheduleTimer();
    }
    return TRACKS[this.currentTrackKey].name;
  }

  _playSoftKick(now) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(84, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.14);
    env.gain.setValueAtTime(0.22, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(env);
    env.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  _playSoftRim(now) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1450;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.065, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    src.connect(bp);
    bp.connect(env);
    env.connect(this.master);
    src.start(now);
  }

  _playSoftHat(now) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6200;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.025, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    src.connect(hp);
    hp.connect(env);
    env.connect(this.master);
    src.start(now);
  }

  _playWarmBass(hz, now) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, now);
    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.22, now + 0.03);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc.connect(env);
    env.connect(this.bassFilter);
    osc.start(now);
    osc.stop(now + 0.58);
  }

  _playBoneMarimba(hz, now) {
    const carrier = this.ctx.createOscillator();
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const env = this.ctx.createGain();

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(hz, now);

    mod.type = 'sine';
    mod.frequency.setValueAtTime(hz * 3.98, now);
    modGain.gain.setValueAtTime(hz * 1.9, now);
    modGain.gain.exponentialRampToValueAtTime(1.0, now + 0.035);

    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.11, now + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0008, now + 0.28);

    mod.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(env);
    env.connect(this.master);
    env.connect(this.echoBus);

    carrier.start(now);
    mod.start(now);
    carrier.stop(now + 0.30);
    mod.stop(now + 0.30);
  }

  playChime(hz) {
    if (!this.ctx) return;
    this._playBoneMarimba(hz, this.ctx.currentTime);
  }

  _tick() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const trk = TRACKS[this.currentTrackKey];
    const s = this.step++;
    const i16 = s & 15;
    const i64 = s & 63;
    const bar = (i64 >> 3) & 7;
    const now = this.ctx.currentTime;

    // 8-bar chord root progression
    if ((s & 7) === 0) {
      const root = trk.roots[bar];
      this._playWarmBass(root, now);
      this.pad1.frequency.setTargetAtTime(root * 2.0, now, 0.35);
      this.pad2.frequency.setTargetAtTime(root * 2.996, now, 0.35);
    }

    if (trk.kick[i16]) this._playSoftKick(now);
    if (trk.snare[i16]) this._playSoftRim(now);
    if (trk.hat[i16]) this._playSoftHat(now);

    const mHz = trk.marimba[i64];
    if (mHz > 0) this._playBoneMarimba(mHz, now);
  }

  updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
    if (!this.ctx || !this.padFilter) return;
    const cutoff = slowMo ? 260 : (inBulletHell ? 580 : 380);

this.padFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.15);
}
}

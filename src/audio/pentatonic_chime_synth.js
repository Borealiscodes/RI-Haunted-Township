import { Q16_ONE } from '../core/q16.js';

// 16-Bar (128-step) Multi-Section Songs: Verse A (0..31) -> Verse B (32..63) -> Chorus C (64..95) -> Bridge D (96..127)
const TRACKS = {
  HARBOR: {
    name: 'I. Blackwater Harbor (16-Bar Song)',
    stepMs: 170,
    kick:  Array.of(1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0),
    rim:   Array.of(0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0),
    // 16 chords (1 per bar across Verse A, Verse B, Chorus C, Bridge D)
    chords: [
      // Verse A: Dm -> Bb -> Gm -> Asus4
      [146.83, 174.61, 220.00], [116.54, 174.61, 233.08], [98.00, 146.83, 196.00], [110.00, 164.81, 220.00],
      // Verse B: Dm -> F -> C -> Gm
      [146.83, 174.61, 220.00], [174.61, 220.00, 261.63], [130.81, 164.81, 196.00], [98.00, 146.83, 196.00],
      // Chorus C: Bb -> C -> Dm -> A7
      [116.54, 174.61, 233.08], [130.81, 164.81, 196.00], [146.83, 174.61, 220.00], [110.00, 138.59, 164.81],
      // Bridge D: Gm -> Dm -> EbMaj7 -> A7
      [98.00, 146.83, 196.00], [146.83, 174.61, 220.00], [155.56, 196.00, 233.08], [110.00, 138.59, 164.81]
    ],
    marimba: [
      // Verse A (Steps 0..31)
      293.66, 0, 349.23, 0, 440.00, 0, 392.00, 0,  349.23, 0, 329.63, 0, 293.66, 0, 0, 0,
      349.23, 0, 392.00, 0, 440.00, 0, 392.00, 0,  329.63, 0, 0, 0, 293.66, 0, 0, 0,
      // Verse B (Steps 32..63)
      440.00, 0, 523.25, 0, 587.33, 0, 523.25, 0,  440.00, 0, 392.00, 0, 349.23, 0, 0, 0,
      392.00, 0, 440.00, 0, 523.25, 0, 440.00, 0,  392.00, 0, 349.23, 0, 329.63, 0, 0, 0,
      // Chorus C (Steps 64..95 — soaring hook)
      587.33, 0, 523.25, 440.00, 523.25, 0, 587.33, 0,  659.25, 0, 587.33, 523.25, 440.00, 0, 392.00, 0,
      466.16, 0, 440.00, 392.00, 440.00, 0, 523.25, 0,  587.33, 0, 440.00, 0, 349.23, 0, 329.63, 0,
      // Bridge D (Steps 96..127 — reflective coastal descent)
      392.00, 0, 349.23, 0, 329.63, 0, 293.66, 0,  349.23, 0, 440.00, 0, 392.00, 0, 0, 0,
      311.13, 0, 392.00, 0, 466.16, 0, 440.00, 0,  329.63, 0, 277.18, 0, 293.66, 0, 0, 0
    ]
  },
  CANOPY: {
    name: 'II. Belfry Nocturne (16-Bar Suite)',
    stepMs: 185,
    kick:  Array.of(0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0),
    rim:   Array.of(0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0),
    chords: [
      [146.83, 220.00, 293.66], [130.81, 196.00, 261.63], [116.54, 174.61, 233.08], [146.83, 220.00, 293.66],
      [98.00,  146.83, 196.00], [116.54, 174.61, 233.08], [130.81, 196.00, 261.63], [110.00, 164.81, 220.00],
      [146.83, 174.61, 220.00], [174.61, 220.00, 261.63], [130.81, 196.00, 261.63], [146.83, 220.00, 293.66],
      [116.54, 174.61, 233.08], [98.00,  146.83, 196.00], [110.00, 164.81, 220.00], [146.83, 220.00, 293.66]
    ],
    marimba: [
      440.00, 0, 0, 392.00, 349.23, 0, 293.66, 0,  349.23, 0, 392.00, 0, 440.00, 0, 0, 0,
      523.25, 0, 0, 440.00, 392.00, 0, 349.23, 0,  392.00, 0, 349.23, 0, 293.66, 0, 0, 0,
      293.66, 0, 392.00, 0, 440.00, 0, 523.25, 0,  587.33, 0, 523.25, 0, 440.00, 0, 0, 0,
      466.16, 0, 440.00, 0, 392.00, 0, 349.23, 0,  392.00, 0, 329.63, 0, 293.66, 0, 0, 0,
      587.33, 0, 440.00, 0, 523.25, 0, 392.00, 0,  440.00, 0, 349.23, 0, 392.00, 0, 440.00, 0,
      523.25, 0, 587.33, 0, 659.25, 0, 587.33, 0,  523.25, 0, 440.00, 0, 392.00, 0, 0, 0,
      349.23, 0, 293.66, 0, 392.00, 0, 349.23, 0,  329.63, 0, 293.66, 0, 261.63, 0, 0, 0,
      329.63, 0, 349.23, 0, 392.00, 0, 440.00, 0,  392.00, 0, 329.63, 0, 293.66, 0, 0, 0
    ]
  },
  GUILD: {
    name: 'III. Town Square Groove (16-Bar)',
    stepMs: 148,
    kick:  Array.of(1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0),
    rim:   Array.of(0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0),
    chords: [
      [146.83, 174.61, 220.00], [174.61, 220.00, 261.63], [130.81, 164.81, 196.00], [98.00, 146.83, 196.00],
      [146.83, 174.61, 220.00], [174.61, 220.00, 261.63], [116.54, 174.61, 233.08], [110.00, 164.81, 220.00],
      [116.54, 174.61, 233.08], [130.81, 164.81, 196.00], [174.61, 220.00, 261.63], [146.83, 174.61, 220.00],
      [98.00,  146.83, 196.00], [116.54, 174.61, 233.08], [110.00, 138.59, 164.81], [146.83, 174.61, 220.00]
    ],
    marimba: [
      587.33, 0, 523.25, 440.00, 0, 349.23, 392.00, 440.00,  523.25, 0, 440.00, 392.00, 0, 349.23, 293.66, 0,
      587.33, 0, 523.25, 440.00, 0, 392.00, 440.00, 523.25,  440.00, 0, 392.00, 349.23, 0, 329.63, 293.66, 0,
      440.00, 0, 440.00, 523.25, 0, 587.33, 523.25, 440.00,  392.00, 0, 392.00, 440.00, 0, 523.25, 440.00, 0,
      466.16, 0, 440.00, 392.00, 0, 349.23, 392.00, 440.00,  329.63, 0, 349.23, 329.63, 0, 293.66, 0, 0,
      587.33, 523.25, 440.00, 523.25, 587.33, 0, 659.25, 0,  587.33, 523.25, 440.00, 392.00, 440.00, 0, 523.25, 0,
      466.16, 440.00, 392.00, 440.00, 466.16, 0, 523.25, 0,  440.00, 0, 392.00, 349.23, 329.63, 0, 293.66, 0,
      392.00, 0, 349.23, 0, 329.63, 0, 293.66, 0,  349.23, 0, 392.00, 0, 440.00, 0, 392.00, 0,
      329.63, 0, 277.18, 0, 329.63, 0, 440.00, 0,  349.23, 0, 329.63, 0, 293.66, 0, 0, 0
    ]
  },
  DANMAKU: {
    name: 'IV. Astral Seal (Boss Overture)',
    stepMs: 124,
    kick:  Array.of(1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0),
    rim:   Array.of(0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0),
    chords: [
      [146.83, 174.61, 220.00], [116.54, 174.61, 233.08], [98.00, 146.83, 196.00], [110.00, 138.59, 164.81],
      [146.83, 174.61, 220.00], [130.81, 164.81, 196.00], [116.54, 174.61, 233.08], [110.00, 138.59, 164.81],
      [98.00,  146.83, 196.00], [116.54, 174.61, 233.08], [130.81, 164.81, 196.00], [146.83, 174.61, 220.00],
      [155.56, 196.00, 233.08], [116.54, 174.61, 233.08], [110.00, 138.59, 164.81], [146.83, 174.61, 220.00]
    ],
    marimba: [
      587.33, 440.00, 349.23, 440.00, 587.33, 440.00, 392.00, 440.00,  466.16, 349.23, 293.66, 349.23, 466.16, 392.00, 349.23, 293.66,
      392.00, 293.66, 233.08, 293.66, 392.00, 349.23, 329.63, 293.66,  440.00, 329.63, 277.18, 329.63, 440.00, 523.25, 587.33, 0,
      659.25, 523.25, 440.00, 523.25, 659.25, 587.33, 523.25, 440.00,  587.33, 466.16, 392.00, 466.16, 587.33, 523.25, 466.16, 440.00,
      523.25, 392.00, 329.63, 392.00, 523.25, 440.00, 392.00, 349.23,  440.00, 349.23, 329.63, 277.18, 293.66, 0, 0, 0,
      587.33, 0, 523.25, 440.00, 587.33, 0, 659.25, 698.46,  659.25, 587.33, 523.25, 440.00, 523.25, 0, 587.33, 0,
      466.16, 0, 440.00, 392.00, 466.16, 0, 523.25, 587.33,  523.25, 466.16, 440.00, 392.00, 440.00, 0, 329.63, 0,
      392.00, 349.23, 329.63, 293.66, 311.13, 349.23, 392.00, 466.16,  440.00, 392.00, 349.23, 329.63, 277.18, 329.63, 440.00, 523.25,
      587.33, 440.00, 349.23, 293.66, 329.63, 277.18, 220.00, 277.18,  293.66, 0, 0, 0, 0, 0, 0, 0
    ]
  }
};

export class TownshipSoundscape {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.warmFilter = null;
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

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.24;

    this.warmFilter = this.ctx.createBiquadFilter();
    this.warmFilter.type = 'lowpass';
    this.warmFilter.frequency.value = 950;
    this.warmFilter.Q.value = 0.7;

    const delay = this.ctx.createDelay(1.0);
    delay.delayTime.value = 0.28;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.24;
    delay.connect(fb);
    fb.connect(delay);

    this.warmFilter.connect(this.master);
    delay.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.echoBus = delay;

    const len = this.ctx.sampleRate * 0.1;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    this._scheduleTimer();
  }

  _scheduleTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this._tick(), TRACKS[this.currentTrackKey].stepMs);
  }

  selectTrack(trackKey, lock = true) {
    if (TRACKS[trackKey]) {
      this.manualLock = lock;
      if (this.currentTrackKey !== trackKey) {
        this.currentTrackKey = trackKey;
        this.step = 0;
        if (this.ctx) this._scheduleTimer();
      }
    }
    return TRACKS[this.currentTrackKey].name;
  }

  setAutoTrack(trackKey) {
    if (this.manualLock && trackKey !== 'DANMAKU') return TRACKS[this.currentTrackKey].name;
    return this.selectTrack(trackKey, false);
  }

  _playFeltChord(notes, now) {
    for (const hz of notes) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz, now);

      env.gain.setValueAtTime(0.001, now);
      env.gain.exponentialRampToValueAtTime(0.055, now + 0.08);
      env.gain.exponentialRampToValueAtTime(0.0008, now + 1.25);

      osc.connect(env);
      env.connect(this.warmFilter);
      osc.start(now);
      osc.stop(now + 1.3);
    }
  }

  _playWoodMarimba(hz, now) {
    const fund = this.ctx.createOscillator();
    const harm = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    const harmGain = this.ctx.createGain();

    fund.type = 'sine';
    fund.frequency.setValueAtTime(hz, now);

    harm.type = 'sine';
    harm.frequency.setValueAtTime(hz * 4.0, now);
    harmGain.gain.setValueAtTime(0.18, now);
    harmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.14, now + 0.014);
    env.gain.exponentialRampToValueAtTime(0.0008, now + 0.34);

    fund.connect(env);
    harm.connect(harmGain);
    harmGain.connect(env);
    env.connect(this.warmFilter);
    env.connect(this.echoBus);

    fund.start(now);
    harm.start(now);
    fund.stop(now + 0.36);
    harm.stop(now + 0.36);
  }

_playSoftKick(now) {
const osc = this.ctx.createOscillator();
const env = this.ctx.createGain();
osc.type = 'sine';
osc.frequency.setValueAtTime(88, now);
osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
env.gain.setValueAtTime(0.22, now);
env.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
osc.connect(env);
env.connect(this.master);
osc.start(now);
osc.stop(now + 0.15);
}
_playSoftRim(now) {
const src = this.ctx.createBufferSource();
src.buffer = this.noiseBuf;
const bp = this.ctx.createBiquadFilter();
bp.type = 'bandpass';
bp.frequency.value = 1350;
const env = this.ctx.createGain();
env.gain.setValueAtTime(0.06, now);
env.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
src.connect(bp);
bp.connect(env);
env.connect(this.master);
src.start(now);
}
playChime(hz) {
if (!this.ctx) return;
this._playWoodMarimba(hz, this.ctx.currentTime);
}
_tick() {
if (!this.ctx || this.ctx.state !== 'running') return;
const trk = TRACKS[this.currentTrackKey];
const s = this.step++;
const i16 = s & 15;
const i128 = s & 127;
const bar = (i128 >> 3) & 15;
const now = this.ctx.currentTime;
if ((s & 7) === 0) {
this._playFeltChord(trk.chords[bar], now);
}
if (trk.kick[i16]) this._playSoftKick(now);
if (trk.rim[i16]) this._playSoftRim(now);
const mHz = trk.marimba[i128];
if (mHz > 0) this._playWoodMarimba(mHz, now);
}
updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
if (!this.ctx || !this.warmFilter) return;
const cutoff = slowMo ? 520 : (inBulletHell ? 1350 : 950);
this.warmFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.15);
}
}

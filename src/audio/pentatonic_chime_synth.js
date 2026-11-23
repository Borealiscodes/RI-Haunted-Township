import { Q16_ONE } from '../core/q16.js';

// 4 Distinct 8-Bar (64-step) Compositions: Chamber Strings, Gothic Pipe Organ, Pier Calliope Waltz & Boss Toccata
const TRACKS = {
  HARBOR: {
    name: 'I. Blackwater Mist (Strings & Snare)',
    stepMs: 240,
    instrument: 'STRINGS',
    pulse: Array.of(1,0,0,0, 2,0,0,0, 1,0,0,0, 2,0,0,0),
    roots: [146.83, 116.54, 98.00, 110.00, 146.83, 174.61, 130.81, 110.00],
    lead: [
      440.00, 0, 0, 0, 349.23, 0, 0, 0,  392.00, 0, 0, 0, 329.63, 0, 0, 0,
      349.23, 0, 0, 0, 440.00, 0, 0, 0,  392.00, 0, 0, 0, 293.66, 0, 0, 0,
      523.25, 0, 0, 0, 440.00, 0, 0, 0,  392.00, 0, 0, 0, 349.23, 0, 0, 0,
      392.00, 0, 0, 0, 349.23, 0, 0, 0,  329.63, 0, 0, 0, 293.66, 0, 0, 0
    ],
    marimba: [
      0, 0, 293.66, 0, 0, 0, 0, 0,  0, 0, 349.23, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 392.00, 0,  0, 0, 0, 0, 0, 0, 293.66, 0,
      0, 0, 440.00, 0, 0, 0, 0, 0,  0, 0, 392.00, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 349.23, 0,  0, 0, 0, 0, 0, 0, 293.66, 0
    ]
  },
  ORGAN: {
    name: 'II. Chapel Pipe Organ (8\' + 4\' + Nazard)',
    stepMs: 260,
    instrument: 'ORGAN',
    pulse: Array.of(0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0),
    roots: [73.42, 58.27, 49.00, 55.00, 73.42, 65.41, 58.27, 55.00], // Deep 16' Pedal D2..A1
    lead: [
      293.66, 0, 0, 0, 349.23, 0, 0, 0,  440.00, 0, 0, 0, 392.00, 0, 0, 0,
      349.23, 0, 0, 0, 329.63, 0, 0, 0,  293.66, 0, 0, 0, 277.18, 0, 0, 0,
      293.66, 0, 0, 0, 440.00, 0, 0, 0,  523.25, 0, 0, 0, 466.16, 0, 0, 0,
      440.00, 0, 0, 0, 392.00, 0, 0, 0,  329.63, 0, 0, 0, 293.66, 0, 0, 0
    ],
    marimba: [
      0, 0, 0, 0, 0, 0, 440.00, 0,  0, 0, 0, 0, 0, 0, 392.00, 0,
      0, 0, 0, 0, 0, 0, 349.23, 0,  0, 0, 0, 0, 0, 0, 293.66, 0,
      0, 0, 0, 0, 0, 0, 523.25, 0,  0, 0, 0, 0, 0, 0, 440.00, 0,
      0, 0, 0, 0, 0, 0, 392.00, 0,  0, 0, 0, 0, 0, 0, 293.66, 0
    ]
  },
  CALLIOPE: {
    name: 'III. Haunted Pier Calliope (3/4 Waltz)',
    stepMs: 220,
    instrument: 'CALLIOPE',
    waltz: true,
    roots: [146.83, 98.00, 116.54, 110.00, 146.83, 130.81, 116.54, 110.00],
    // 48-step (8-bar 3/4 waltz) eerie steam-carousel melody
    lead: [
      440.00, 0, 392.00, 349.23, 0, 0,  392.00, 0, 349.23, 329.63, 0, 0,
      349.23, 0, 329.63, 293.66, 0, 0,  329.63, 0, 277.18, 293.66, 0, 0,
      523.25, 0, 466.16, 440.00, 0, 0,  466.16, 0, 440.00, 392.00, 0, 0,
      440.00, 0, 392.00, 349.23, 0, 0,  329.63, 0, 277.18, 293.66, 0, 0
    ],
    marimba: [
      0, 0, 0, 0, 293.66, 0,  0, 0, 0, 0, 349.23, 0,
      0, 0, 0, 0, 392.00, 0,  0, 0, 0, 0, 293.66, 0,
      0, 0, 0, 0, 440.00, 0,  0, 0, 0, 0, 392.00, 0,
      0, 0, 0, 0, 349.23, 0,  0, 0, 0, 0, 293.66, 0
    ]
  },
  DANMAKU: {
    name: 'IV. Midnight Toccata (Organ & Snare)',
    stepMs: 165,
    instrument: 'ORGAN',
    pulse: Array.of(1,0,2,0, 2,0,1,0, 1,0,2,0, 2,0,1,0),
    roots: [73.42, 58.27, 49.00, 55.00, 73.42, 65.41, 58.27, 55.00],
    lead: [
      587.33, 0, 523.25, 0, 440.00, 0, 392.00, 0,  466.16, 0, 440.00, 0, 392.00, 0, 349.23, 0,
      392.00, 0, 349.23, 0, 329.63, 0, 293.66, 0,  329.63, 0, 277.18, 0, 293.66, 0, 0, 0,
      587.33, 0, 659.25, 0, 587.33, 0, 523.25, 0,  466.16, 0, 523.25, 0, 440.00, 0, 392.00, 0,
      349.23, 0, 392.00, 0, 329.63, 0, 277.18, 0,  293.66, 0, 0, 0, 0, 0, 0, 0
    ],
    marimba: [
      0, 440.00, 0, 0, 0, 440.00, 0, 0,  0, 349.23, 0, 0, 0, 440.00, 0, 0,
      0, 392.00, 0, 0, 0, 329.63, 0, 0,  0, 329.63, 0, 0, 0, 293.66, 0, 0,
      0, 523.25, 0, 0, 0, 440.00, 0, 0,  0, 392.00, 0, 0, 0, 349.23, 0, 0,
      0, 329.63, 0, 0, 0, 277.18, 0, 0,  0, 293.66, 0, 0, 0, 0, 0, 0
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

    // Gentle, balanced master volume (0.12)
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.12;

    this.warmFilter = this.ctx.createBiquadFilter();
    this.warmFilter.type = 'lowpass';
    this.warmFilter.frequency.value = 540;
    this.warmFilter.Q.value = 0.6;

    const delay = this.ctx.createDelay(1.0);
    delay.delayTime.value = 0.34;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.18;
    delay.connect(fb);
    fb.connect(delay);

    this.warmFilter.connect(this.master);
    delay.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.roomBus = delay;

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

  /** Gothic Cathedral Pipe Organ: Pure 8' Principal (1x) + 4' Octave (2x) + 2-2/3' Nazard (3x) flute stops */
  _playPipeOrgan(hz, now, peak = 0.085, dur = 1.45) {
    const stops = [
      { mult: 1.0, amp: peak },
      { mult: 2.0, amp: peak * 0.45 },
      { mult: 3.0, amp: peak * 0.16 }
    ];
    for (const st of stops) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz * st.mult, now);

      env.gain.setValueAtTime(0.0008, now);
      env.gain.exponentialRampToValueAtTime(st.amp, now + 0.07);
      env.gain.exponentialRampToValueAtTime(st.amp * 0.85, now + dur * 0.7);
      env.gain.exponentialRampToValueAtTime(0.0006, now + dur);

      osc.connect(env);
      env.connect(this.warmFilter);
      env.connect(this.roomBus);
      osc.start(now);
      osc.stop(now + dur + 0.04);
    }
  }

  /** Haunted Pier Calliope: Twin slightly detuned steam-whistle flutes (-5/+5 cents) with gentle pressure flutter */
  _playPierCalliope(hz, now, peak = 0.065, dur = 0.65) {
    for (const cents of [-5, 5]) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz, now);
      osc.detune.setValueAtTime(cents, now);

      env.gain.setValueAtTime(0.0008, now);
      env.gain.exponentialRampToValueAtTime(peak, now + 0.05);
      env.gain.exponentialRampToValueAtTime(0.0006, now + dur);

      osc.connect(env);
      env.connect(this.warmFilter);
      env.connect(this.roomBus);
      osc.start(now);
      osc.stop(now + dur + 0.04);
    }
  }

  _playSoftChamberNote(hz, now, peak = 0.11, dur = 1.4, attack = 0.18) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(hz, now);

    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(peak, now + attack);
    env.gain.exponentialRampToValueAtTime(0.0006, now + dur);

    osc.connect(env);
    env.connect(this.warmFilter);
    osc.start(now);
    osc.stop(now + dur + 0.04);
  }

  _playBrushedSnare(now) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1450;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.11, now + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0008, now + 0.11);
    src.connect(bp);
    bp.connect(env);
    env.connect(this.master);
    src.start(now);
  }

  _playSubPulse(now) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(76, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.14);
    env.gain.setValueAtTime(0.22, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(env);
    env.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  _playMarimbaDrop(hz, now) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, now);

    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.13, now + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0006, now + 0.36);

    osc.connect(env);
    env.connect(this.warmFilter);
    env.connect(this.roomBus);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  playChime(hz) {
    if (!this.ctx) return;
    this._playMarimbaDrop(hz, this.ctx.currentTime);
  }

  _tick() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const trk = TRACKS[this.currentTrackKey];
    const s = this.step++;
    const now = this.ctx.currentTime;

    // 3/4 Waltz timing for Haunted Pier Calliope
    if (trk.waltz) {
      const i48 = s % 48;
      const bar = (i48 / 6) | 0;
      const beat = i48 % 6;
      const root = trk.roots[bar];
      if (beat === 0) this._playPierCalliope(root, now, 0.075, 0.55);
      if (beat === 2 || beat === 4) this._playPierCalliope(root * 1.498, now, 0.045, 0.35);
if (trk.lead[i48] > 0) this._playPierCalliope(trk.lead[i48], now, 0.068, 0.65);
if (trk.marimba[i48] > 0) this._playMarimbaDrop(trk.marimba[i48], now);
return;
}
const i16 = s & 15;
const i64 = s & 63;
const bar = (i64 >> 3) & 7;
const root = trk.roots[bar];
if ((s & 7) === 0) {
if (trk.instrument === 'ORGAN') {
this._playPipeOrgan(root, now, 0.095, 1.9);
this._playPipeOrgan(root * 1.498, now, 0.055, 1.9);
} else {
this._playSoftChamberNote(root, now, 0.13, 1.75, 0.22);
this._playSoftChamberNote(root * 1.498, now, 0.075, 1.75, 0.26);
}
}
const lHz = trk.lead[i64];
if (lHz > 0) {
if (trk.instrument === 'ORGAN') this._playPipeOrgan(lHz, now, 0.075, 1.0);
else this._playSoftChamberNote(lHz, now, 0.085, 1.1, 0.14);
}
const pType = trk.pulse[i16];
if (pType === 1) this._playSubPulse(now);
if (pType === 2) this._playBrushedSnare(now);
const mHz = trk.marimba[i64];
if (mHz > 0) this._playMarimbaDrop(mHz, now);
}
updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
if (!this.ctx || !this.warmFilter) return;
const cutoff = slowMo ? 340 : (inBulletHell ? 720 : 540);
this.warmFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.2);
}
}

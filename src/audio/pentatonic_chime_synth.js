import { Q16_ONE } from '../core/q16.js';

const TRACKS = {
  HARBOR: {
    name: 'I. Blackwater Mist (86 BPM Strings)',
    stepMs: 260,
    instrument: 'STRINGS',
    pulse: Array.of(1,0,0,0, 2,0,0,0, 1,0,0,0, 2,0,0,0),
    roots: [146.83, 116.54, 98.00, 110.00],
    lead: [
      440.00, 0, 0, 0, 349.23, 0, 0, 0,  392.00, 0, 0, 0, 329.63, 0, 0, 0,
      349.23, 0, 0, 0, 440.00, 0, 0, 0,  392.00, 0, 0, 0, 293.66, 0, 0, 0
    ]
  },
  ORGAN: {
    name: 'II. Chapel Pipe Organ (Deep Chorale)',
    stepMs: 340,
    instrument: 'ORGAN',
    pulse: Array.of(0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0),
    roots: [73.42, 58.27, 49.00, 55.00],
    lead: [
      220.00, 0, 0, 0, 174.61, 0, 0, 0,  196.00, 0, 0, 0, 164.81, 0, 0, 0,
      174.61, 0, 0, 0, 146.83, 0, 0, 0,  138.59, 0, 0, 0, 146.83, 0, 0, 0
    ]
  },
  CALLIOPE: {
    name: 'III. Pier Calliope (3/4 Carousel Waltz)',
    stepMs: 175,
    instrument: 'CALLIOPE',
    waltz: true,
    roots: [146.83, 98.00, 116.54, 110.00],
    lead: [
      587.33, 0, 523.25, 440.00, 0, 0,  523.25, 0, 440.00, 392.00, 0, 0,
      466.16, 0, 440.00, 392.00, 0, 0,  440.00, 0, 329.63, 293.66, 0, 0
    ]
  },
  DANMAKU: {
    name: 'IV. Midnight Toccata (138 BPM Boss)',
    stepMs: 145,
    instrument: 'ORGAN',
    pulse: Array.of(1,0,2,0, 2,0,1,0, 1,0,2,0, 2,0,1,0),
    roots: [73.42, 58.27, 49.00, 55.00],
    lead: [
      587.33, 440.00, 523.25, 440.00, 466.16, 392.00, 440.00, 349.23,
      392.00, 349.23, 329.63, 293.66, 329.63, 277.18, 293.66, 0,
      587.33, 659.25, 587.33, 523.25, 466.16, 523.25, 440.00, 392.00,
      349.23, 392.00, 329.63, 277.18, 293.66, 0, 0, 0
    ]
  }
};

const TRACK_KEYS = Array.of('HARBOR', 'ORGAN', 'CALLIOPE', 'DANMAKU');

export class TownshipSoundscape {
  constructor() {
    this.ctx = null;
    this.bgmGain = null;
    this.sfxGain = null;
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

    // Separate BGM bus (auto-ducks near Bell-Tower chimes!) and crystal-clear SFX/Chime bus
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.13;

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.24;

    this.warmFilter = this.ctx.createBiquadFilter();
    this.warmFilter.type = 'lowpass';
    this.warmFilter.frequency.value = 620;
    this.warmFilter.Q.value = 0.6;

    const delay = this.ctx.createDelay(1.2);
    delay.delayTime.value = 0.34;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.22;
    delay.connect(fb);
    fb.connect(delay);

    this.warmFilter.connect(this.bgmGain);
    this.bgmGain.connect(this.ctx.destination);

    delay.connect(this.sfxGain);
    this.sfxGain.connect(this.ctx.destination);
    this.chimeEcho = delay;

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

  cycleTrack() {
    const nextIdx = (TRACK_KEYS.indexOf(this.currentTrackKey) + 1) % TRACK_KEYS.length;
    return this.selectTrack(TRACK_KEYS.at(nextIdx), true);
  }

  setAutoTrack(trackKey) {
    if (this.manualLock && trackKey !== 'DANMAKU') return TRACKS[this.currentTrackKey].name;
    return this.selectTrack(trackKey, false);
  }

  /** Smoothly hush background soundtrack while standing beneath the Bell-Tower chimes */
  setChimeZone(inCanopy) {
    if (!this.ctx || !this.bgmGain) return;
    this.bgmGain.gain.setTargetAtTime(inCanopy ? 0.015 : 0.13, this.ctx.currentTime, 0.25);
  }

  /** Crystalline Journey-style Harmonic Chime (1x fundamental + 2x octave + 3x fifth shimmer) */
  playChime(hz) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const partials = [
      { mult: 1.0, amp: 0.16, dur: 1.9 },
      { mult: 2.0, amp: 0.07, dur: 1.3 },
      { mult: 3.0, amp: 0.03, dur: 0.8 }
    ];
    for (const p of partials) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz * p.mult, now);

      env.gain.setValueAtTime(0.0008, now);
      env.gain.exponentialRampToValueAtTime(p.amp, now + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0005, now + p.dur);

      osc.connect(env);
      env.connect(this.sfxGain);
      env.connect(this.chimeEcho);
      osc.start(now);
      osc.stop(now + p.dur + 0.05);
    }
  }

  _playPipeOrgan(hz, now, peak = 0.095, dur = 1.6) {
    for (const st of [{ mult: 1.0, amp: peak }, { mult: 2.0, amp: peak * 0.45 }, { mult: 3.0, amp: peak * 0.18 }]) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz * st.mult, now);
      env.gain.setValueAtTime(0.0008, now);
      env.gain.exponentialRampToValueAtTime(st.amp, now + 0.08);
      env.gain.exponentialRampToValueAtTime(0.0006, now + dur);
      osc.connect(env);
      env.connect(this.warmFilter);
      osc.start(now);
      osc.stop(now + dur + 0.04);
    }
  }

  _playPierCalliope(hz, now, peak = 0.075, dur = 0.55) {
    for (const cents of [-6, 6]) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz, now);
      osc.detune.setValueAtTime(cents, now);
      env.gain.setValueAtTime(0.0008, now);
      env.gain.exponentialRampToValueAtTime(peak, now + 0.035);
      env.gain.exponentialRampToValueAtTime(0.0006, now + dur);
      osc.connect(env);
      env.connect(this.warmFilter);
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
    env.connect(this.bgmGain);
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
    env.connect(this.bgmGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  _tick() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const trk = TRACKS[this.currentTrackKey];
    const s = this.step++;
    const now = this.ctx.currentTime;

    if (trk.waltz) {
      const i24 = s % 24;
      const bar = (i24 / 6) | 0;
      const beat = i24 % 6;
      const root = trk.roots[bar];
      if (beat === 0) this._playPierCalliope(root, now, 0.08, 0.45);
      if (beat === 2 || beat === 4) this._playPierCalliope(root * 1.498, now, 0.05, 0.28);
      if (trk.lead[i24] > 0) this._playPierCalliope(trk.lead[i24], now, 0.075, 0.55);
      return;
    }

    const i16 = s & 15;
    const i32 = s & 31;
    const bar = (i32 >> 3) & 3;
    const root = trk.roots[bar];

    if ((s & 7) === 0) {
      if (trk.instrument === 'ORGAN') {
        this._playPipeOrgan(root, now, 0.10, 1.9);
        this._playPipeOrgan(root * 1.498, now, 0.06, 1.9);
      } else {
        this._playSoftChamberNote(root, now, 0.13, 1.75, 0.22);
        this._playSoftChamberNote(root * 1.498, now, 0.075, 1.75, 0.26);
      }
    }

    const lHz = trk.lead[i32];
    if (lHz > 0) {
      if (trk.instrument === 'ORGAN') this._playPipeOrgan(lHz, now, 0.085, 1.0);
      else this._playSoftChamberNote(lHz, now, 0.09, 1.1, 0.14);
    }

    const pType = trk.pulse[i16];
    if (pType === 1) this._playSubPulse(now);
    if (pType === 2) this._playBrushedSnare(now);
  }

  updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
    if (!this.ctx || !this.warmFilter) return;
    const cutoff = slowMo ? 380 : (inBulletHell ? 860 : 620);
    this.warmFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.2);
  }
}

import { Q16_ONE } from '../core/q16.js';

// Symphonic Chamber Strings (3-voice chorus swell) + Subtle Brushed Snare Pulse + Sparse Rosewood Marimba
const TRACKS = {
  HARBOR: {
    name: 'I. Blackwater Strings & Tide',
    stepMs: 220, // ~68 BPM 16th-note / 8th-note chamber pulse
    pulse: Array.of(1,0,0,0, 2,0,0,0, 1,0,0,0, 2,0,1,0), // 1 = soft sub-pulse, 2 = brushed snare
    chords: [
      [146.83, 174.61, 220.00], // Dm
      [116.54, 174.61, 233.08], // BbMaj7
      [98.00,  146.83, 196.00], // Gm
      [110.00, 164.81, 220.00]  // Asus4
    ],
    // Lyrical chamber melody (played with slow 140ms bowed string envelope + sparse marimba drops)
    stringsLead: [
      440.00, 0, 0, 0, 349.23, 0, 0, 0,  392.00, 0, 0, 0, 329.63, 0, 0, 0,
      349.23, 0, 0, 0, 440.00, 0, 0, 0,  466.16, 0, 0, 0, 440.00, 0, 392.00, 0
    ],
    marimba: [
      0, 0, 293.66, 0, 0, 0, 0, 0,  0, 0, 349.23, 0, 0, 0, 293.66, 0,
      0, 0, 0, 0, 0, 0, 392.00, 0,  0, 0, 0, 0, 349.23, 0, 293.66, 0
    ]
  },
  CANOPY: {
    name: 'II. Belfry Nocturne (Strings & Chimes)',
    stepMs: 240,
    pulse: Array.of(1,0,0,0, 0,0,0,0, 2,0,0,0, 0,0,0,0), // Minimal nocturnal breath
    chords: [
      [146.83, 220.00, 261.63],
      [130.81, 196.00, 246.94],
      [116.54, 174.61, 220.00],
      [146.83, 220.00, 261.63]
    ],
    stringsLead: [
      523.25, 0, 0, 0, 440.00, 0, 0, 0,  392.00, 0, 0, 0, 349.23, 0, 0, 0,
      392.00, 0, 0, 0, 440.00, 0, 0, 0,  329.63, 0, 0, 0, 293.66, 0, 0, 0
    ],
    marimba: [
      0, 0, 440.00, 0, 0, 0, 392.00, 0,  0, 0, 0, 0, 0, 0, 293.66, 0,
      0, 0, 0, 0, 0, 0, 440.00, 0,  0, 0, 392.00, 0, 0, 0, 293.66, 0
    ]
  },
  GUILD: {
    name: 'III. Guild Intrigue (Pulsing Snare & Strings)',
    stepMs: 185,
    pulse: Array.of(1,0,0,0, 2,0,0,2, 1,0,0,0, 2,0,1,0), // Subtle syncopated brushed snare pulse
    chords: [
      [146.83, 174.61, 220.00],
      [174.61, 220.00, 261.63],
      [130.81, 164.81, 196.00],
      [98.00,  146.83, 196.00]
    ],
    stringsLead: [
      440.00, 0, 0, 0, 523.25, 0, 0, 0,  440.00, 0, 0, 0, 392.00, 0, 0, 0,
      466.16, 0, 0, 0, 440.00, 0, 0, 0,  392.00, 0, 0, 0, 349.23, 0, 0, 0
    ],
    marimba: [
      0, 0, 587.33, 0, 0, 0, 440.00, 0,  0, 0, 392.00, 0, 0, 0, 349.23, 0,
      0, 0, 466.16, 0, 0, 0, 392.00, 0,  0, 0, 349.23, 0, 293.66, 0, 0, 0
    ]
  },
  DANMAKU: {
    name: 'IV. Midnight Reckoning (Symphonic Tension)',
    stepMs: 150,
    pulse: Array.of(1,0,2,0, 2,0,1,0, 1,0,2,0, 2,0,1,2),
    chords: [
      [146.83, 174.61, 220.00],
      [116.54, 174.61, 233.08],
      [98.00,  146.83, 196.00],
      [110.00, 138.59, 164.81]
    ],
    stringsLead: [
      587.33, 0, 0, 0, 523.25, 0, 0, 0,  466.16, 0, 0, 0, 440.00, 0, 0, 0,
      392.00, 0, 0, 0, 440.00, 0, 0, 0,  349.23, 0, 0, 0, 293.66, 0, 0, 0
    ],
    marimba: [
      0, 440.00, 0, 523.25, 0, 440.00, 0, 392.00,  0, 349.23, 0, 392.00, 0, 440.00, 0, 0,
      0, 392.00, 0, 349.23, 0, 329.63, 0, 293.66,  0, 329.63, 0, 349.23, 0, 293.66, 0, 0
    ]
  }
};

export class TownshipSoundscape {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.stringFilter = null;
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

    // Warm symphonic hall lowpass filter (520 Hz) — zero Casio buzz
    this.stringFilter = this.ctx.createBiquadFilter();
    this.stringFilter.type = 'lowpass';
    this.stringFilter.frequency.value = 520;
    this.stringFilter.Q.value = 0.8;

    const delay = this.ctx.createDelay(1.2);
    delay.delayTime.value = 0.38;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.32;
    delay.connect(fb);
    fb.connect(delay);

    this.stringFilter.connect(this.master);
    delay.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.hallBus = delay;

    const len = this.ctx.sampleRate * 0.14;
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

  /** Lush 3-Voice Chorus Symphonic String Swell (eliminates toy-keyboard attack) */
  _playSymphonicString(hz, now, peak = 0.042, dur = 2.1, attack = 0.24) {
    for (const detuneCents of [-7, 0, 7]) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = detuneCents === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(hz, now);
      osc.detune.setValueAtTime(detuneCents, now);

      env.gain.setValueAtTime(0.0008, now);
      env.gain.exponentialRampToValueAtTime(peak, now + attack);
      env.gain.exponentialRampToValueAtTime(0.0006, now + dur);

      osc.connect(env);
      env.connect(this.stringFilter);
      env.connect(this.hallBus);
      osc.start(now);
      osc.stop(now + dur + 0.05);
    }
  }

  /** Subtle Brushed Snare Pulse */
  _playBrushedSnare(now) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1550;
    bp.Q.value = 1.1;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.075, now + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0008, now + 0.12);

    src.connect(bp);
    bp.connect(env);
    env.connect(this.master);
    src.start(now);
  }

  /** Deep Muted Sub-Pulse */
  _playSubPulse(now) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(78, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.15);
    env.gain.setValueAtTime(0.18, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    osc.connect(env);
    env.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  /** Sparse Rosewood Marimba Drop (pure 1x + 4x harmonic) */
  _playMarimbaDrop(hz, now) {
    const fund = this.ctx.createOscillator();
    const harm = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    const harmGain = this.ctx.createGain();

    fund.type = 'sine';
    fund.frequency.setValueAtTime(hz, now);
    harm.type = 'sine';
    harm.frequency.setValueAtTime(hz * 4.0, now);

    harmGain.gain.setValueAtTime(0.08, now);
    harmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.075, now + 0.018);
    env.gain.exponentialRampToValueAtTime(0.0006, now + 0.42);

    fund.connect(env);
    harm.connect(harmGain);
    harmGain.connect(env);
    env.connect(this.stringFilter);
    env.connect(this.hallBus);

    fund.start(now);
    harm.start(now);
    fund.stop(now + 0.45);
    harm.stop(now + 0.45);
  }

  playChime(hz) {
    if (!this.ctx) return;
    this._playMarimbaDrop(hz, this.ctx.currentTime);
  }

  _tick() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const trk = TRACKS[this.currentTrackKey];
    const s = this.step++;
    const i16 = s & 15;
    const i32 = s & 31;
    const bar = (i32 >> 3) & 3;
    const chord = trk.chords[bar];
    const now = this.ctx.currentTime;

    // 1. Lush Symphonic String Chord Swell every bar
    if ((s & 7) === 0) {
      this._playSymphonicString(chord[0] * 0.5, now, 0.048, 2.4, 0.28);
      this._playSymphonicString(chord[1], now, 0.026, 2.2, 0.30);
      this._playSymphonicString(chord[2], now, 0.026, 2.2, 0.30);
    }

    // 2. Bowed String Melody Swell
    const sHz = trk.stringsLead[i32];
    if (sHz > 0) this._playSymphonicString(sHz, now, 0.036, 1.35, 0.16);

    // 3. Subtle Brushed Snare & Sub-Bass Pulse
    const pType = trk.pulse[i16];
    if (pType === 1) this._playSubPulse(now);
    if (pType === 2) this._playBrushedSnare(now);

    // 4. Sparse Rosewood Marimba Drops
    const mHz = trk.marimba[i32];
    if (mHz > 0) this._playMarimbaDrop(mHz, now);
  }

  updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
    if (!this.ctx || !this.stringFilter) return;
    const cutoff = slowMo ? 360 : (inBulletHell ? 740 : 520);
    this.stringFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.2);
  }
}

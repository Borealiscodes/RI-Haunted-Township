import { Q16_ONE, q16Clamp } from '../core/q16.js';

// Pure D Natural Minor (D4=293.66, E4=329.63, F4=349.23, G4=392.00, A4=440.00, Bb4=466.16, C5=523.25, D5=587.33)
// Zero FM ring-modulation — authentic concert marimba uses pure 1x fundamental + 4x (2-octave) overtone!
const TRACKS = {
  HARBOR: {
    name: 'I. Blackwater Harbor (Felt & Tide)',
    stepMs: 170,
    kick:  Array.of(1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0),
    rim:   Array.of(0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0),
    chords: [
      [146.83, 174.61, 220.00], // Dm
      [116.54, 174.61, 233.08], // Bb
      [98.00,  146.83, 196.00], // Gm
      [110.00, 164.81, 220.00]  // Asus4
    ],
    // Cohesive 32-step (2-bar) call-and-response wooden marimba theme
    marimba: [
      293.66, 0, 349.23, 0, 440.00, 0, 392.00, 0,
      349.23, 0, 329.63, 0, 293.66, 0, 0,      0,
      349.23, 0, 440.00, 0, 523.25, 0, 440.00, 0,
      392.00, 0, 349.23, 0, 329.63, 0, 293.66, 0
    ]
  },
  CANOPY: {
    name: 'II. Belfry Nocturne (Pure Pentatonic)',
    stepMs: 195,
    kick:  Array.of(0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0),
    rim:   Array.of(0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0),
    chords: [
      [146.83, 220.00, 293.66], // D5 open fifth
      [130.81, 196.00, 261.63], // C5 open fifth
      [116.54, 174.61, 233.08], // Bb5 open fifth
      [146.83, 220.00, 293.66]  // D5 open fifth
    ],
    // Pure D-minor pentatonic (D, F, G, A, C, D) — impossible to clash!
    marimba: [
      440.00, 0, 0, 392.00, 349.23, 0, 293.66, 0,
      349.23, 0, 392.00, 0, 440.00, 0, 0,      0,
      523.25, 0, 0, 440.00, 392.00, 0, 349.23, 0,
      392.00, 0, 349.23, 0, 293.66, 0, 0,      0
    ]
  },
  GUILD: {
    name: 'III. Town Square Groove (Indie Pulse)',
    stepMs: 148,
    kick:  Array.of(1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0),
    rim:   Array.of(0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0),
    chords: [
      [146.83, 174.61, 220.00], // Dm
      [174.61, 220.00, 261.63], // F
      [130.81, 164.81, 196.00], // C
      [98.00,  146.83, 196.00]  // Gm
    ],
    // Catchy, cohesive Helena-Beat-inspired wooden marimba hook
    marimba: [
      587.33, 0, 523.25, 440.00, 0, 349.23, 392.00, 440.00,
      523.25, 0, 440.00, 392.00, 0, 349.23, 293.66, 0,
      587.33, 0, 523.25, 440.00, 0, 392.00, 440.00, 523.25,
      440.00, 0, 392.00, 349.23, 0, 329.63, 293.66, 0
    ]
  },
  DANMAKU: {
    name: 'IV. Astral Seal (Boss Theme)',
    stepMs: 122,
    kick:  Array.of(1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0),
    rim:   Array.of(0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0),
    chords: [
      [146.83, 174.61, 220.00], // Dm
      [116.54, 174.61, 233.08], // Bb
      [98.00,  146.83, 196.00], // Gm
      [110.00, 138.59, 164.81]  // A7
    ],
    marimba: [
      587.33, 440.00, 349.23, 440.00, 587.33, 440.00, 392.00, 440.00,
      466.16, 349.23, 293.66, 349.23, 466.16, 392.00, 349.23, 293.66,
      392.00, 293.66, 233.08, 293.66, 392.00, 349.23, 329.63, 293.66,
      440.00, 329.63, 277.18, 329.63, 440.00, 523.25, 587.33, 0
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

    // Warm, rounded lowpass filter (removes all digital harshness)
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

  /** Warm Felt-Piano / Rhodes Chord Swell */
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

  /** Authentic Concert Wooden Marimba: Pure 1x fundamental + 4x (2-octave) overtone, soft felt attack */
  _playWoodMarimba(hz, now) {
    const fund = this.ctx.createOscillator();
    const harm = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    const harmGain = this.ctx.createGain();

    fund.type = 'sine';
    fund.frequency.setValueAtTime(hz, now);

    // Real rosewood marimba bars resonate at exact 4x (two octaves above fundamental)
    harm.type = 'sine';
    harm.frequency.setValueAtTime(hz * 4.0, now);
    harmGain.gain.setValueAtTime(0.18, now);
    harmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    // Soft felt-mallet attack (14ms) prevents sharp digital clicks
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
    const i32 = s & 31;
    const bar = (i32 >> 3) & 3;
    const now = this.ctx.currentTime;

    if ((s & 7) === 0) {
      this._playFeltChord(trk.chords[bar], now);
    }

    if (trk.kick[i16]) this._playSoftKick(now);
    if (trk.rim[i16]) this._playSoftRim(now);

    const mHz = trk.marimba[i32];
    if (mHz > 0) this._playWoodMarimba(mHz, now);
  }

  updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
    if (!this.ctx || !this.warmFilter) return;
    const cutoff = slowMo ? 520 : (inBulletHell ? 1350 : 950);
    this.warmFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.15);
  }
}

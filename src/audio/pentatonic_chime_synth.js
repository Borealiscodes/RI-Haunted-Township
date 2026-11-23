import { Q16_ONE } from '../core/q16.js';

// Subtle, unhurried New England horror-mystery compositions (quarter-note / eighth-note lyrical phrasing)
// Felt upright piano leads the melody; bone-marimba enters sparingly (only a few soft drops per phrase).
const TRACKS = {
  HARBOR: {
    name: 'I. Blackwater Parlor (Felt Piano)',
    beatMs: 440, // ~68 BPM lyrical eighth-note pulse
    waltz: false,
    chords: [
      [146.83, 174.61, 220.00], // Dm
      [116.54, 174.61, 233.08], // BbMaj7
      [98.00,  146.83, 196.00], // Gm
      [110.00, 164.81, 220.00]  // Asus4
    ],
    // Lyrical felt-piano melody (32 steps = 4 slow bars, lots of breathing space)
    piano: [
      440.00, 0, 349.23, 0, 392.00, 0, 0, 0,
      349.23, 0, 329.63, 0, 293.66, 0, 0, 0,
      392.00, 0, 440.00, 0, 466.16, 0, 440.00, 0,
      392.00, 0, 349.23, 0, 329.63, 0, 0, 0
    ],
    // Sparse hollow marimba drops (only 4 soft notes in the entire 4-bar phrase!)
    marimba: [
      0, 0, 0, 0, 0, 0, 293.66, 0,
      0, 0, 0, 0, 0, 0, 220.00, 0,
      0, 0, 0, 0, 0, 0, 349.23, 0,
      0, 0, 0, 0, 0, 0, 293.66, 0
    ]
  },
  CANOPY: {
    name: 'II. Fog Over Narragansett (Nocturne)',
    beatMs: 480, // ~62 BPM nocturne
    waltz: false,
    chords: [
      [146.83, 220.00, 261.63], // Dm7
      [130.81, 196.00, 246.94], // Cmaj7
      [116.54, 174.61, 220.00], // BbMaj7
      [146.83, 220.00, 261.63]  // Dm7
    ],
    piano: [
      523.25, 0, 440.00, 0, 392.00, 0, 0, 0,
      440.00, 0, 392.00, 0, 349.23, 0, 0, 0,
      392.00, 0, 349.23, 0, 329.63, 0, 293.66, 0,
      329.63, 0, 0, 0, 293.66, 0, 0, 0
    ],
    marimba: [
      0, 0, 0, 0, 0, 440.00, 0, 0,
      0, 0, 0, 0, 0, 392.00, 0, 0,
      0, 0, 0, 0, 0, 349.23, 0, 0,
      0, 0, 0, 0, 0, 293.66, 0, 0
    ]
  },
  GUILD: {
    name: 'III. Parlor Mystery Waltz (3/4)',
    beatMs: 390,
    waltz: true,
    chords: [
      [146.83, 174.61, 220.00],
      [98.00,  146.83, 196.00],
      [116.54, 174.61, 233.08],
      [110.00, 138.59, 164.81]
    ],
    piano: [
      440.00, 392.00, 349.23, 392.00, 0, 0,
      466.16, 440.00, 392.00, 440.00, 0, 0,
      523.25, 466.16, 440.00, 392.00, 349.23, 0,
      329.63, 349.23, 329.63, 293.66, 0, 0
    ],
    marimba: [
      0, 0, 0, 0, 293.66, 0,
      0, 0, 0, 0, 349.23, 0,
      0, 0, 0, 0, 392.00, 0,
      0, 0, 0, 0, 293.66, 0
    ]
  },
  DANMAKU: {
    name: 'IV. Midnight Reckoning (Tension)',
    beatMs: 280,
    waltz: false,
    chords: [
      [146.83, 174.61, 220.00],
      [116.54, 174.61, 233.08],
      [98.00,  146.83, 196.00],
      [110.00, 138.59, 164.81]
    ],
    piano: [
      440.00, 349.23, 440.00, 523.25, 440.00, 392.00, 349.23, 329.63,
      349.23, 293.66, 349.23, 440.00, 392.00, 349.23, 329.63, 293.66,
      466.16, 392.00, 466.16, 587.33, 523.25, 466.16, 440.00, 392.00,
      440.00, 329.63, 277.18, 329.63, 293.66, 0, 0, 0
    ],
    marimba: [
      0, 0, 0, 0, 293.66, 0, 0, 0,
      0, 0, 0, 0, 261.63, 0, 0, 0,
      0, 0, 0, 0, 349.23, 0, 0, 0,
      0, 0, 0, 0, 293.66, 0, 0, 0
    ]
  }
};

export class TownshipSoundscape {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.woolFilter = null;
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

    // Gentle, intimate parlor volume
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.22;

    // Wool-felt lowpass filter (560 Hz) gives upright piano a warm, muffled vintage tone
    this.woolFilter = this.ctx.createBiquadFilter();
    this.woolFilter.type = 'lowpass';
    this.woolFilter.frequency.value = 560;
    this.woolFilter.Q.value = 0.6;

    // Soft wooden room reverb tail
    const delay = this.ctx.createDelay(1.2);
    delay.delayTime.value = 0.42;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.28;
    delay.connect(fb);
    fb.connect(delay);

    this.woolFilter.connect(this.master);
    delay.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.roomBus = delay;

    this._scheduleTimer();
  }

  _scheduleTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this._tick(), TRACKS[this.currentTrackKey].beatMs);
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

  /** Warm Felt-Dampened Upright Piano Note (soft hammer attack, long singing decay) */
  _playFeltPiano(hz, now, gainPeak = 0.11, dur = 1.6) {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(hz, now);
    osc2.frequency.setValueAtTime(hz * 2.0, now); // Subtle octave string warmth

    const ovGain = this.ctx.createGain();
    ovGain.gain.value = 0.15;

    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(gainPeak, now + 0.045); // Soft felt hammer
    env.gain.exponentialRampToValueAtTime(0.0006, now + dur);

    osc1.connect(env);
    osc2.connect(ovGain);
    ovGain.connect(env);
    env.connect(this.woolFilter);
    env.connect(this.roomBus);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + dur + 0.05);
    osc2.stop(now + dur + 0.05);
  }

  /** Sparse, delicate wooden marimba drop (1x + 4x soft rosewood resonance, low gain) */
  _playSoftMarimbaDrop(hz, now) {
    const fund = this.ctx.createOscillator();
    const harm = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    const harmGain = this.ctx.createGain();

    fund.type = 'sine';
    fund.frequency.setValueAtTime(hz, now);
    harm.type = 'sine';
    harm.frequency.setValueAtTime(hz * 4.0, now);

    harmGain.gain.setValueAtTime(0.09, now);
    harmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.065, now + 0.022); // Gentle mallet touch
    env.gain.exponentialRampToValueAtTime(0.0006, now + 0.45);

    fund.connect(env);
    harm.connect(harmGain);
    harmGain.connect(env);
    env.connect(this.woolFilter);
    env.connect(this.roomBus);

    fund.start(now);
    harm.start(now);
    fund.stop(now + 0.48);
    harm.stop(now + 0.48);
  }

  playChime(hz) {
    if (!this.ctx) return;
    this._playSoftMarimbaDrop(hz, this.ctx.currentTime);
  }

  _tick() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const trk = TRACKS[this.currentTrackKey];
    const s = this.step++;
    const now = this.ctx.currentTime;

    if (trk.waltz) {
      const i24 = s % 24;
      const bar = (i24 / 6) | 0;
      const beatInBar = i24 % 6;
      const chord = trk.chords[bar];
      if (beatInBar === 0) this._playFeltPiano(chord[0] * 0.5, now, 0.12, 1.5);
      if (beatInBar === 2 || beatInBar === 4) {
        this._playFeltPiano(chord[1], now, 0.045, 0.8);
        this._playFeltPiano(chord[2], now, 0.045, 0.8);
      }
      if (trk.piano[i24] > 0) this._playFeltPiano(trk.piano[i24], now, 0.10, 1.3);
      if (trk.marimba[i24] > 0) this._playSoftMarimbaDrop(trk.marimba[i24], now);
      return;
    }

    const i32 = s & 31;
    const bar = (i32 >> 3) & 3;
    const chord = trk.chords[bar];

    // Gentle sustained felt-piano chord swell at the start of each bar
    if ((s & 7) === 0) {
      this._playFeltPiano(chord[0] * 0.5, now, 0.12, 2.6);
      this._playFeltPiano(chord[1], now, 0.045, 2.4);
      this._playFeltPiano(chord[2], now, 0.045, 2.4);
    }

    // Lyrical felt-piano melody
    const pHz = trk.piano[i32];
    if (pHz > 0) this._playFeltPiano(pHz, now, 0.105, 1.5);

    // Sparse, ghostly marimba drop (only 4 soft notes per 4 bars)
    const mHz = trk.marimba[i32];
    if (mHz > 0) this._playSoftMarimbaDrop(mHz, now);
  }

  updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
    if (!this.ctx || !this.woolFilter) return;
    const cutoff = slowMo ? 380 : (inBulletHell ? 760 : 560);
    this.woolFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.2);
  }
}

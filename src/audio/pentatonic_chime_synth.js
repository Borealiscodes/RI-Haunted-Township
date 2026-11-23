import { Q16_ONE } from '../core/q16.js';

// Whisper-quiet, non-stacking chamber ambience + subtle brushed snare pulse + sparse marimba drops
const TRACKS = {
  HARBOR: {
    name: 'I. Blackwater Mist (Quiet Strings & Snare)',
    stepMs: 240,
    pulse: Array.of(1,0,0,0, 2,0,0,0, 1,0,0,0, 2,0,0,0), // 1 = soft sub-pulse, 2 = soft brushed snare
    roots: [146.83, 116.54, 98.00, 110.00], // D3 -> Bb2 -> G2 -> A2
    lead: [
      440.00, 0, 0, 0, 349.23, 0, 0, 0,  392.00, 0, 0, 0, 329.63, 0, 0, 0,
      349.23, 0, 0, 0, 440.00, 0, 0, 0,  392.00, 0, 0, 0, 293.66, 0, 0, 0
    ],
    marimba: [
      0, 0, 293.66, 0, 0, 0, 0, 0,  0, 0, 349.23, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 392.00, 0,  0, 0, 0, 0, 0, 0, 293.66, 0
    ]
  },
  CANOPY: {
    name: 'II. Belfry Nocturne (Minimal)',
    stepMs: 260,
    pulse: Array.of(1,0,0,0, 0,0,0,0, 2,0,0,0, 0,0,0,0),
    roots: [146.83, 130.81, 116.54, 146.83],
    lead: [
      523.25, 0, 0, 0, 440.00, 0, 0, 0,  392.00, 0, 0, 0, 349.23, 0, 0, 0,
      392.00, 0, 0, 0, 440.00, 0, 0, 0,  329.63, 0, 0, 0, 293.66, 0, 0, 0
    ],
    marimba: [
      0, 0, 440.00, 0, 0, 0, 0, 0,  0, 0, 392.00, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 440.00, 0,  0, 0, 0, 0, 0, 0, 293.66, 0
    ]
  },
  GUILD: {
    name: 'III. Parlor Pulse (Brushed Snare)',
    stepMs: 200,
    pulse: Array.of(1,0,0,0, 2,0,0,2, 1,0,0,0, 2,0,0,0),
    roots: [146.83, 174.61, 130.81, 98.00],
    lead: [
      440.00, 0, 0, 0, 523.25, 0, 0, 0,  440.00, 0, 0, 0, 392.00, 0, 0, 0,
      466.16, 0, 0, 0, 440.00, 0, 0, 0,  392.00, 0, 0, 0, 349.23, 0, 0, 0
    ],
    marimba: [
      0, 0, 587.33, 0, 0, 0, 0, 0,  0, 0, 392.00, 0, 0, 0, 0, 0,
      0, 0, 466.16, 0, 0, 0, 0, 0,  0, 0, 349.23, 0, 293.66, 0, 0, 0
    ]
  },
  DANMAKU: {
    name: 'IV. Midnight Reckoning (Focused)',
    stepMs: 165,
    pulse: Array.of(1,0,2,0, 2,0,1,0, 1,0,2,0, 2,0,1,0),
    roots: [146.83, 116.54, 98.00, 110.00],
    lead: [
      587.33, 0, 0, 0, 523.25, 0, 0, 0,  466.16, 0, 0, 0, 440.00, 0, 0, 0,
      392.00, 0, 0, 0, 440.00, 0, 0, 0,  349.23, 0, 0, 0, 293.66, 0, 0, 0
    ],
    marimba: [
      0, 440.00, 0, 0, 0, 440.00, 0, 0,  0, 349.23, 0, 0, 0, 440.00, 0, 0,
      0, 392.00, 0, 0, 0, 329.63, 0, 0,  0, 329.63, 0, 0, 0, 293.66, 0, 0
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

    // Gentle, non-overpowering master ceiling (0.10) — zero wall-of-sound stacking
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.10;

    this.warmFilter = this.ctx.createBiquadFilter();
    this.warmFilter.type = 'lowpass';
    this.warmFilter.frequency.value = 440;
    this.warmFilter.Q.value = 0.5;

    const delay = this.ctx.createDelay(1.0);
    delay.delayTime.value = 0.32;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.16; // Minimal feedback so notes never pile up
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

  /** Single-voice warm sine/triangle chamber pad note (zero multi-oscillator clipping) */
  _playSoftChamberNote(hz, now, peak = 0.12, dur = 1.4, attack = 0.18) {
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
    env.gain.setValueAtTime(0.24, now);
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
    env.gain.exponentialRampToValueAtTime(0.14, now + 0.015);
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
    const i16 = s & 15;
    const i32 = s & 31;
    const bar = (i32 >> 3) & 3;
    const root = trk.roots[bar];
    const now = this.ctx.currentTime;

    // 1. Clean 2-note root + fifth chamber bed (never stacks > 2 voices!)
    if ((s & 7) === 0) {
      this._playSoftChamberNote(root, now, 0.14, 1.75, 0.22);
      this._playSoftChamberNote(root * 1.498, now, 0.08, 1.75, 0.26);
    }

    // 2. Gentle chamber melody note
    const lHz = trk.lead[i32];
    if (lHz > 0) this._playSoftChamberNote(lHz, now, 0.09, 1.1, 0.14);

    // 3. Subtle brushed snare & sub-bass pulse
    const pType = trk.pulse[i16];
    if (pType === 1) this._playSubPulse(now);
    if (pType === 2) this._playBrushedSnare(now);

    // 4. Sparse wooden marimba drops
    const mHz = trk.marimba[i32];
    if (mHz > 0) this._playMarimbaDrop(mHz, now);
  }

  updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
    if (!this.ctx || !this.warmFilter) return;
    const cutoff = slowMo ? 320 : (inBulletHell ? 620 : 440);
    this.warmFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.2);
  }
}

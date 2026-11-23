import { Q16_ONE } from '../core/q16.js';

const TRACKS = {
  HARBOR: {
    name: 'I. Blackwater Mist (Harp & Choir)',
    stepMs: 250,
    style: 'HARP',
    roots: [73.42, 58.27, 49.00, 55.00], // D2 -> Bb1 -> G1 -> A1
    // Expressive broken-chord harp arpeggios across 4 bars (32 steps)
    arp: [
      293.66, 349.23, 440.00, 523.25, 440.00, 349.23, 329.63, 293.66,
      233.08, 293.66, 349.23, 466.16, 440.00, 349.23, 293.66, 233.08,
      196.00, 293.66, 349.23, 392.00, 440.00, 392.00, 349.23, 293.66,
      220.00, 277.18, 329.63, 440.00, 392.00, 329.63, 277.18, 220.00
    ]
  },
  ORGAN: {
    name: 'II. Chapel Pipe Organ (Deep Chorale)',
    stepMs: 320,
    style: 'ORGAN',
    roots: [73.42, 58.27, 49.00, 55.00],
    arp: [
      293.66, 0, 349.23, 0, 440.00, 0, 392.00, 0,
      349.23, 0, 329.63, 0, 293.66, 0, 277.18, 0,
      293.66, 0, 440.00, 0, 523.25, 0, 466.16, 0,
      440.00, 0, 392.00, 0, 329.63, 0, 293.66, 0
    ]
  },
  CALLIOPE: {
    name: 'III. Pier Calliope (3/4 Carousel Waltz)',
    stepMs: 185,
    style: 'CALLIOPE',
    waltz: true,
    roots: [146.83, 98.00, 116.54, 110.00],
    arp: [
      587.33, 0, 523.25, 440.00, 0, 0,  523.25, 0, 440.00, 392.00, 0, 0,
      466.16, 0, 440.00, 392.00, 0, 0,  440.00, 0, 329.63, 293.66, 0, 0
    ]
  },
  DANMAKU: {
    name: 'IV. Midnight Toccata (Boss Tension)',
    stepMs: 145,
    style: 'ORGAN',
    roots: [73.42, 58.27, 49.00, 55.00],
    arp: [
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

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.14;

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.25;

    this.warmFilter = this.ctx.createBiquadFilter();
    this.warmFilter.type = 'lowpass';
    this.warmFilter.frequency.value = 780;
    this.warmFilter.Q.value = 0.6;

    const delay = this.ctx.createDelay(1.2);
    delay.delayTime.value = 0.36;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.24;
    delay.connect(fb);
    fb.connect(delay);

    this.warmFilter.connect(this.bgmGain);
    delay.connect(this.bgmGain);
    this.bgmGain.connect(this.ctx.destination);
    this.hallBus = delay;

    const chimeDelay = this.ctx.createDelay(1.2);
    chimeDelay.delayTime.value = 0.34;
    const cFb = this.ctx.createGain();
    cFb.gain.value = 0.22;
    chimeDelay.connect(cFb);
    cFb.connect(chimeDelay);
    chimeDelay.connect(this.sfxGain);
    this.sfxGain.connect(this.ctx.destination);
    this.chimeEcho = chimeDelay;

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

  setChimeZone(inCanopy) {
    if (!this.ctx || !this.bgmGain) return;
    this.bgmGain.gain.setTargetAtTime(inCanopy ? 0.015 : 0.14, this.ctx.currentTime, 0.25);
  }

  playChime(hz) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const p of [{ mult: 1.0, amp: 0.16, dur: 1.9 }, { mult: 2.0, amp: 0.07, dur: 1.3 }, { mult: 3.0, amp: 0.03, dur: 0.8 }]) {
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

  /** Plucked Acoustic Harp Note (warm 1x + 2x string bloom) */
  _playHarpPluck(hz, now, peak = 0.09, dur = 1.1) {
    for (const st of [{ mult: 1.0, amp: peak }, { mult: 2.0, amp: peak * 0.35 }]) {
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(hz * st.mult, now);
      env.gain.setValueAtTime(0.0008, now);
      env.gain.exponentialRampToValueAtTime(st.amp, now + 0.018);
      env.gain.exponentialRampToValueAtTime(0.0005, now + dur);
      osc.connect(env);
      env.connect(this.warmFilter);
      env.connect(this.hallBus);
      osc.start(now);
      osc.stop(now + dur + 0.04);
    }
  }

  _playPipeOrgan(hz, now, peak = 0.09, dur = 1.6) {
    for (const st of [{ mult: 1.0, amp: peak }, { mult: 2.0, amp: peak * 0.45 }, { mult: 3.0, amp: peak * 0.16 }]) {
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
      if (trk.arp[i24] > 0) this._playPierCalliope(trk.arp[i24], now, 0.075, 0.55);
      return;
    }

    const i32 = s & 31;
    const bar = (i32 >> 3) & 3;
    const root = trk.roots[bar];

    if ((s & 7) === 0) {
      if (trk.style === 'ORGAN') {
        this._playPipeOrgan(root, now, 0.10, 1.9);
        this._playPipeOrgan(root * 1.498, now, 0.055, 1.9);
      } else {
        this._playHarpPluck(root * 2.0, now, 0.11, 2.0);
        this._playHarpPluck(root * 2.996, now, 0.06, 2.0);
      }
    }

    const nHz = trk.arp[i32];
    if (nHz > 0) {
      if (trk.style === 'ORGAN') this._playPipeOrgan(nHz, now, 0.085, 1.0);
      else this._playHarpPluck(nHz, now, 0.085, 1.15);
    }
  }

  updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
    if (!this.ctx || !this.warmFilter) return;
    const cutoff = slowMo ? 420 : (inBulletHell ? 920 : 780);
    this.warmFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.2);
  }
}

import { Q16_ONE, q16Clamp } from '../core/q16.js';

// Spooky minor-key "Helena Beat" indie-synth groove (118 BPM) + crisp FM bone-marimba hook
const TRACKS = {
  HARBOR: {
    name: 'I. Blackwater Beat (Spooky Synth-Groove)',
    stepMs: 132,
    // Four-on-the-floor kick + syncopated clap/snare on 4 & 12 + crisp off-beat hats
    kick:  Array.of(1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0),
    snare: Array.of(0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1),
    hat:   Array.of(0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0),
    // Bouncy staccato D-minor synth bassline
    bass: [
      73.42, 0, 73.42, 146.83, 87.31, 0, 98.00, 0,
      116.54, 0, 110.00, 0, 98.00, 0, 87.31, 65.41
    ],
    // Catchy syncopated spooky bone-marimba hook (discrete crisp notes, zero pitch glide)
    marimba: [
      587.33, 0, 523.25, 440.00, 0, 349.23, 392.00, 440.00,
      466.16, 0, 440.00, 392.00, 0, 349.23, 329.63, 293.66
    ],
    padRoot: 146.83
  },
  CANOPY: {
    name: 'II. Belfry Beat (Hirajoshi Marimba)',
    stepMs: 132,
    kick:  Array.of(1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0),
    snare: Array.of(0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1),
    hat:   Array.of(0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0),
    bass: [
      73.42, 0, 73.42, 146.83, 77.78, 0, 98.00, 0,
      110.00, 0, 116.54, 0, 98.00, 0, 77.78, 65.41
    ],
    marimba: [
      587.33, 0, 466.16, 440.00, 0, 392.00, 311.13, 392.00,
      440.00, 0, 466.16, 587.33, 0, 466.16, 440.00, 392.00
    ],
    padRoot: 146.83
  },
  DANMAKU: {
    name: 'III. Midnight Reckoning Beat',
    stepMs: 112,
    kick:  Array.of(1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0),
    snare: Array.of(0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1),
    hat:   Array.of(0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0),
    bass: [
      73.42, 146.83, 73.42, 146.83, 87.31, 174.61, 98.00, 196.00,
      116.54, 233.08, 110.00, 220.00, 98.00, 196.00, 82.41, 164.81
    ],
    marimba: [
      587.33, 440.00, 523.25, 440.00, 587.33, 659.25, 698.46, 587.33,
      523.25, 440.00, 466.16, 440.00, 392.00, 349.23, 329.63, 293.66
    ],
    padRoot: 146.83
  }
};

export class TownshipSoundscape {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.bassFilter = null;
    this.padFilter = null;
    this.noiseBuf = null;
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

    // Balanced master level so groove sits cleanly under narration
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.24;

    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'lowpass';
    this.bassFilter.frequency.value = 520;
    this.bassFilter.Q.value = 2.0;

    this.padFilter = this.ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.value = 420;

    // Subtle stereo slapback echo for the bone-marimba hook
    const delay = this.ctx.createDelay(1.0);
    delay.delayTime.value = 0.264; // Dotted-eighth slapback!
    const fb = this.ctx.createGain();
    fb.gain.value = 0.28;
    delay.connect(fb);
    fb.connect(delay);

    this.bassFilter.connect(this.master);
    this.padFilter.connect(this.master);
    delay.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.echoBus = delay;

    // Noise buffer for crisp indie-pop snare clap & hi-hats
    const len = this.ctx.sampleRate * 0.14;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    // Soft, ghostly D-minor pad bed (no pitch-gliding whale!)
    for (const ratio of [1.0, 1.498]) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 146.83 * ratio;
      g.gain.value = 0.045;
      osc.connect(g);
      g.connect(this.padFilter);
      osc.start();
    }

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

  _playKick(now) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(112, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.11);
    env.gain.setValueAtTime(0.32, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(env);
    env.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  _playSnareClap(now) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1850;
    bp.Q.value = 1.2;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.14, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    src.connect(bp);
    bp.connect(env);
    env.connect(this.master);
    src.start(now);
  }

  _playHat(now) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6500;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.045, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    src.connect(hp);
    hp.connect(env);
    env.connect(this.master);
    src.start(now);
  }

  _playSynthBass(hz, now) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(hz, now);
    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.20, now + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(env);
    env.connect(this.bassFilter);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /** Crisp hollow FM bone-marimba with dotted-eighth indie-synth slapback */
  _playBoneMarimba(hz, now) {
    const carrier = this.ctx.createOscillator();
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const env = this.ctx.createGain();

    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(hz, now);

    mod.type = 'sine';
    mod.frequency.setValueAtTime(hz * 3.98, now);
    modGain.gain.setValueAtTime(hz * 2.1, now);
    modGain.gain.exponentialRampToValueAtTime(1.0, now + 0.032);

    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.14, now + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0008, now + 0.19);

    mod.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(env);
    env.connect(this.master);
    env.connect(this.echoBus);

    carrier.start(now);
    mod.start(now);
    carrier.stop(now + 0.21);
    mod.stop(now + 0.21);
  }

  playChime(hz, bellOvertone = false) {
    if (!this.ctx) return;
    this._playBoneMarimba(hz, this.ctx.currentTime);
  }

  _tick() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const trk = TRACKS[this.currentTrackKey];
    const i = this.step++ & 15;
    const now = this.ctx.currentTime;

    if (trk.kick[i]) this._playKick(now);
    if (trk.snare[i]) this._playSnareClap(now);
    if (trk.hat[i]) this._playHat(now);
    if (trk.bass[i] > 0) this._playSynthBass(trk.bass[i], now);
    if (trk.marimba[i] > 0) this._playBoneMarimba(trk.marimba[i], now);
  }

  updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
    if (!this.ctx || !this.bassFilter) return;
    const cutoff = slowMo ? 280 : (inBulletHell ? 820 : 520);
    this.bassFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.12);
  }
}

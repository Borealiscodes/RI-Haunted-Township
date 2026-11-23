import { Q16_ONE, q16Clamp } from '../core/q16.js';

// Subtle Ender's Game-inspired minimal ambient-techno D-minor patterns
const TRACKS = {
  HARBOR: {
    name: 'I. Blackwater Pulse (Ambient)',
    stepMs: 210,
    roots: [36.71, 36.71, 29.14, 32.70], // Deep D1 -> Bb0 -> C1 sub-bass
    arp:   [146.83, 220.00, 174.61, 220.00, 146.83, 220.00, 196.00, 220.00,
            116.54, 174.61, 146.83, 174.61, 130.81, 196.00, 174.61, 196.00],
    kick:  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0]
  },
  CANOPY: {
    name: 'II. Belfry Telemetry',
    stepMs: 195,
    roots: [36.71, 32.70, 29.14, 36.71],
    arp:   [146.83, 155.56, 196.00, 220.00, 233.08, 220.00, 196.00, 155.56,
            146.83, 196.00, 220.00, 293.66, 233.08, 220.00, 196.00, 146.83],
    kick:  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
  },
  DANMAKU: {
    name: 'III. Battle Room Protocol',
    stepMs: 145,
    roots: [36.71, 36.71, 29.14, 27.50],
    arp:   [146.83, 220.00, 261.63, 220.00, 293.66, 220.00, 261.63, 174.61,
            116.54, 174.61, 220.00, 174.61, 110.00, 164.81, 220.00, 164.81],
    kick:  [1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0]
  }
};

export class TownshipSoundscape {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.arpFilter = null;
    this.subOsc = null;
    this.padOsc = null;
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

    // Subtle, non-overbearing master bed so narration stays crystal clear
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.16;

    // Warm dark lowpass filter for muted analog synth plucks
    this.arpFilter = this.ctx.createBiquadFilter();
    this.arpFilter.type = 'lowpass';
    this.arpFilter.frequency.value = 340;
    this.arpFilter.Q.value = 1.8;

    const delay = this.ctx.createDelay(1.0);
    delay.delayTime.value = 0.315;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.34;
    delay.connect(fb);
    fb.connect(delay);

    this.arpFilter.connect(this.master);
    this.arpFilter.connect(delay);
    delay.connect(this.master);
    this.master.connect(this.ctx.destination);

    // Pure sine sub-bass bed + soft low-passed atmospheric pad
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = 'sine';
    this.subOsc.frequency.value = 36.71;
    const subGain = this.ctx.createGain();
    subGain.gain.value = 0.32;
    this.subOsc.connect(subGain);
    subGain.connect(this.master);
    this.subOsc.start();

    this.padOsc = this.ctx.createOscillator();
    this.padOsc.type = 'triangle';
    this.padOsc.frequency.value = 146.83;
    const padGain = this.ctx.createGain();
    padGain.gain.value = 0.08;
    this.padOsc.connect(padGain);
    padGain.connect(this.arpFilter);
    this.padOsc.start();

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

  _playSoftPulseKick(now) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(76, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.14);
    env.gain.setValueAtTime(0.26, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(env);
    env.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  _playMutedPluck(hz, now) {
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(hz, now);
    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(0.09, now + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0008, now + 0.22);
    osc.connect(env);
    env.connect(this.arpFilter);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  playChime(hz, bellOvertone = false, dur = 1.1) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, now);
    env.gain.setValueAtTime(0.001, now);
    env.gain.exponentialRampToValueAtTime(bellOvertone ? 0.11 : 0.06, now + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0006, now + dur);
    osc.connect(env);
    env.connect(this.master);
    osc.start(now);
    osc.stop(now + dur + 0.04);
  }

  _tick() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const trk = TRACKS[this.currentTrackKey];
    const s = this.step++;
    const i = s & 15;
    const now = this.ctx.currentTime;

    if ((s & 7) === 0) {
      const root = trk.roots[(s >> 3) % trk.roots.length];
      this.subOsc.frequency.setTargetAtTime(root, now, 0.25);
      this.padOsc.frequency.setTargetAtTime(root * 4.0, now, 0.35);
    }

    if (trk.kick[i]) this._playSoftPulseKick(now);
    this._playMutedPluck(trk.arp[i], now);
  }

  updateTension(sanityQ16 = Q16_ONE, inBulletHell = false, slowMo = false) {
    if (!this.ctx || !this.arpFilter) return;
    const cutoff = slowMo ? 220 : (inBulletHell ? 620 : 340);
    this.arpFilter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.15);
  }
}

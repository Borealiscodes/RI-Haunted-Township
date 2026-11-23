import { Q16_ONE, Q16_TAU, q16Sin, q16Cos, q16Clamp } from '../core/q16.js';

const SPELL_CARDS = Array.of(
  'Spell V: Walpurgis Eclipse Overload',
  'Spell IV: Contracting Astral Cage',
  'Spell III: Curved Sine-Wave Curtains',
  'Spell II: Gatekeeper Aimed Needle Fan',
  'Spell I: Crimson Rose Helix'
);

export class BulletHellArena {
  constructor() {
    this.active = false;
    this.bossName = '';
    this.align = 0;
    this.bossHp = 0;
    this.maxHp = 5;
    this.bossX = 240;
    this.bossY = 88;
    this.soulX = 240;
    this.soulY = 196;
    this.targetX = 240;
    this.targetY = 196;
    this.bullets = [];
    this.grazeCount = 0;
    this.focusEnergy = 100;
    this.slowMo = false;
    this.angleQ16 = 0;
    this.rewardFactionId = null;
  }

  startEncounter(bossName, align, hp = 5) {
    this.active = true;
    this.bossName = bossName;
    this.align = align;
    this.bossHp = hp;
    this.maxHp = hp;
    this.bossX = 240;
    this.bossY = 88;
    this.soulX = 240;
    this.soulY = 202;
    this.targetX = 240;
    this.targetY = 202;
    this.bullets = [];
    this.grazeCount = 0;
    this.focusEnergy = 100;
    this.slowMo = false;
    this.angleQ16 = 0;
  }

  getSpellName() {
    const idx = q16Clamp(this.bossHp - 1, 0, SPELL_CARDS.length - 1);
    return SPELL_CARDS.at(idx);
  }

  toggleBulletTime() {
    if (this.focusEnergy > 15) this.slowMo = !this.slowMo;
    else this.slowMo = false;
    return this.slowMo;
  }

  setSoulTarget(fbX, fbY) {
    this.targetX = q16Clamp(fbX, 114, 366);
    this.targetY = q16Clamp(fbY, 68, 226);
  }

  moveSoul(dx, dy) {
    const speed = this.slowMo ? 2.1 : 3.8;
    this.targetX = q16Clamp(this.targetX + dx * speed, 114, 366);
    this.targetY = q16Clamp(this.targetY + dy * speed, 68, 226);
  }

  step(tick) {
    if (!this.active) return { hit: false, cleared: false };

    if (this.slowMo) {
      this.focusEnergy = Math.max(0, this.focusEnergy - 0.55);
      if (this.focusEnergy <= 0) this.slowMo = false;
    } else {
      this.focusEnergy = Math.min(100, this.focusEnergy + 0.28);
    }

    const timeScale = this.slowMo ? 0.42 : 1.0;
    this.soulX += (this.targetX - this.soulX) * 0.45;
    this.soulY += (this.targetY - this.soulY) * 0.45;

    // Boss glides in a figure-eight Lissajous path across the upper arena
    const lx = (tick * 1300) % Q16_TAU;
    const ly = (tick * 2600) % Q16_TAU;
    this.bossX = 240 + ((72 * q16Cos(lx)) >> 16);
    this.bossY = 86 + ((10 * q16Sin(ly)) >> 16);

    // Phase escalation: higher difficulty as bossHp drops from 5 -> 1
    const phase = Math.max(1, 6 - this.bossHp); // 1, 2, 3, 4, 5
    const emitPeriod = phase >= 5 ? 7 : (phase >= 3 ? 9 : 11);

    if (tick % emitPeriod === 0) {
      this.angleQ16 = (this.angleQ16 + 19500 + phase * 3200) % Q16_TAU;

      if (phase === 1) {
        // Spell I: Dual Counter-Rotating 7-Petal Rose Helix
        const petals = 7;
        const stepA = (Q16_TAU / petals) | 0;
        for (let i = 0; i < petals; i++) {
          const a1 = (this.angleQ16 + i * stepA) % Q16_TAU;
          const a2 = (Q16_TAU - this.angleQ16 + i * stepA) % Q16_TAU;
          this.bullets.push({
            x: this.bossX, y: this.bossY,
            vx: (q16Cos(a1) * 2.25) / Q16_ONE, vy: (q16Sin(a1) * 2.25) / Q16_ONE,
            curve: 0, grazed: false
          });
          this.bullets.push({
            x: this.bossX, y: this.bossY,
            vx: (q16Cos(a2) * 1.75) / Q16_ONE, vy: (q16Sin(a2) * 1.75) / Q16_ONE,
            curve: 0, grazed: false
          });
        }
      } else if (phase === 2) {
        // Spell II: 9-Way Aimed Needle Fan + Flanking Ring
        const aimAngle = Math.atan2(this.soulY - this.bossY, this.soulX - this.bossX);
        for (let f = -4; f <= 4; f++) {
          const a = aimAngle + f * 0.14;
          const spd = 2.65 - Math.abs(f) * 0.12;
          this.bullets.push({
            x: this.bossX, y: this.bossY,
            vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
            curve: 0, grazed: false
          });
        }
      } else if (phase === 3) {
        // Spell III: Curved Sine-Wave Ribbon Curtains (projectiles bend mid-flight!)
        const count = 10;
        const stepA = (Q16_TAU / count) | 0;
        for (let i = 0; i < count; i++) {
          const a = (this.angleQ16 + i * stepA) % Q16_TAU;
          this.bullets.push({
            x: this.bossX, y: this.bossY,
            vx: (q16Cos(a) * 2.15) / Q16_ONE, vy: (q16Sin(a) * 2.15) / Q16_ONE,
            curve: (i & 1) === 0 ? 0.024 : -0.024, grazed: false
          });
        }
      } else if (phase === 4) {
        // Spell IV: Contracting Astral Cage around Evelyn with a rotating safe corridor
        if (tick % (emitPeriod * 2) === 0) {
          const ringN = 16;
          const safeSlot = ((tick / emitPeriod) | 0) % ringN;
          for (let i = 0; i < ringN; i++) {
            if (i === safeSlot || i === ((safeSlot + 1) % ringN)) continue;
            const theta = (i * Math.PI * 2) / ringN;
            const sx = this.soulX + Math.cos(theta) * 98;
            const sy = this.soulY + Math.sin(theta) * 74;
            this.bullets.push({
              x: q16Clamp(sx, 110, 370), y: q16Clamp(sy, 60, 232),
              vx: -Math.cos(theta) * 1.45, vy: -Math.sin(theta) * 1.45,
              curve: 0, grazed: false
            });
          }
        }
      } else {
        // Spell V: Walpurgis Eclipse Overload (Twin Vortices + Aimed Sniper Bolts)
        const count = 10;
        const stepA = (Q16_TAU / count) | 0;
        for (let i = 0; i < count; i++) {
          const a = (this.angleQ16 + i * stepA) % Q16_TAU;
          this.bullets.push({
            x: this.bossX, y: this.bossY,
            vx: (q16Cos(a) * 2.45) / Q16_ONE, vy: (q16Sin(a) * 2.45) / Q16_ONE,
            curve: 0.014, grazed: false
          });
        }
        const aim = Math.atan2(this.soulY - this.bossY, this.soulX - this.bossX);
        for (const off of [-0.12, 0, 0.12]) {
          this.bullets.push({
            x: this.bossX, y: this.bossY,
            vx: Math.cos(aim + off) * 3.1, vy: Math.sin(aim + off) * 3.1,
            curve: 0, grazed: false
          });
        }
      }
    }

    let hit = false;
    for (const b of this.bullets) {
      if (b.curve !== 0) {
        const c = Math.cos(b.curve * timeScale);
        const s = Math.sin(b.curve * timeScale);
        const nvx = b.vx * c - b.vy * s;
        const nvy = b.vx * s + b.vy * c;
        b.vx = nvx;
        b.vy = nvy;
      }
      b.x += b.vx * timeScale;
      b.y += b.vy * timeScale;
      const d = Math.hypot(b.x - this.soulX, b.y - this.soulY);
      if (d < 4.5) {
        hit = true;
        b.y = 999;
      } else if (!b.grazed && d < 20) {
        b.grazed = true;
        this.grazeCount++;
        this.focusEnergy = Math.min(100, this.focusEnergy + 3.5);
      }
    }

    this.bullets = this.bullets.filter((b) => b.x > 102 && b.x < 378 && b.y > 54 && b.y < 238);
    return { hit, cleared: false };
  }

  parryBurst() {
    if (!this.active) return { event: 'NONE' };
    let clearedCount = 0;
    for (const b of this.bullets) {
      if (Math.hypot(b.x - this.soulX, b.y - this.soulY) < 48) {
        b.y = 999;
        clearedCount++;
      }
    }
    this.bullets = this.bullets.filter((b) => b.y < 240);

    // Requires 10 Grazes (or 5 in Bullet-Time) or clearing 4+ close-range bolts to break a Spell Card
    const grazeReq = this.slowMo ? 5 : 10;
    if (this.grazeCount >= grazeReq || clearedCount >= 4) {
      this.grazeCount = 0;
      this.bossHp--;
      this.bullets = []; // Clear screen on Spell Card break!
      if (this.bossHp <= 0) {
        this.active = false;
        return { event: 'BANISHED' };
      }
      return { event: 'HIT', hp: this.bossHp, spell: this.getSpellName() };
    }
    return { event: 'WHIFF' };
  }
}

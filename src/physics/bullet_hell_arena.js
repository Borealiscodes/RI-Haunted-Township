import { Q16_TAU, q16Cos, q16Sin, q16Clamp } from '../core/q16.js';

export class BulletHellArena {
  constructor() {
    this.active = false;
    this.bossName = '';
    this.bossHp = 3;
    this.maxHp = 3;
    this.bossAlign = 0;
    this.bullets = [];
    this.soulX = 240;
    this.soulY = 196;
    this.vx = 0;
    this.vy = 0;
    this.grazeCount = 0;
    this.focusEnergy = 100;
    this.slowMo = false;
    this.phaseAngle = 0;
  }

  startEncounter(bossName, bossAlign, hp = 3) {
    this.active = true;
    this.bossName = bossName;
    this.bossAlign = bossAlign;
    this.bossHp = hp;
    this.maxHp = hp;
    this.bullets = [];
    this.soulX = 240;
    this.soulY = 196;
    this.vx = 0;
    this.vy = 0;
    this.grazeCount = 0;
    this.focusEnergy = 100;
    this.slowMo = false;
    this.phaseAngle = 0;
  }

  setSoulTarget(tx, ty) {
    this.soulX = q16Clamp(tx, 116, 364);
    this.soulY = q16Clamp(ty, 96, 226);
  }

  moveSoul(dx, dy) {
    const speed = this.slowMo ? 2.1 : 3.4;
    this.vx += (dx * speed - this.vx) * 0.35;
    this.vy += (dy * speed - this.vy) * 0.35;
    this.soulX = q16Clamp(this.soulX + this.vx, 116, 364);
    this.soulY = q16Clamp(this.soulY + this.vy, 96, 226);
  }

  toggleBulletTime() {
    if (this.focusEnergy > 15) this.slowMo = !this.slowMo;
    else this.slowMo = false;
    return this.slowMo;
  }

  parryBurst() {
    let deflected = 0;
    this.bullets = this.bullets.filter((b) => {
      if (Math.hypot(b.x - this.soulX, b.y - this.soulY) < 38) {
        deflected++;
        return false;
      }
      return true;
    });
    if (deflected > 0 || this.grazeCount >= 6) {
      this.grazeCount = Math.max(0, this.grazeCount - 6);
      this.bossHp--;
      if (this.bossHp <= 0) {
        this.active = false;
        this.slowMo = false;
        return { event: 'BANISHED' };
      }
      return { event: 'HIT', hp: this.bossHp };
    }
    return { event: 'WHIFF' };
  }

  step(tick) {
    if (!this.active) return { hit: false };

    if (this.slowMo) {
      this.focusEnergy = Math.max(0, this.focusEnergy - 0.6);
      if (this.focusEnergy <= 0) this.slowMo = false;
    } else {
      this.focusEnergy = Math.min(100, this.focusEnergy + 0.25);
    }

    const timeScale = this.slowMo ? 0.42 : 1.0;
    const phase = this.maxHp - this.bossHp; // 0 = Rose Spiral, 1 = Aimed Fan, 2 = Twin Vortex
    this.phaseAngle = (this.phaseAngle + ((6200 * timeScale) | 0)) % Q16_TAU;

    const emitPeriod = this.slowMo ? 24 : 12;
    if (tick % emitPeriod === 0) {
      if (phase === 0) {
        // Spell Card I: 5-Petal Rose Counter-Spiral
        for (let arm = 0; arm < 5; arm++) {
          const a = (this.phaseAngle + arm * 82355) % Q16_TAU;
          this.bullets.push({
            x: 240, y: 88,
            vx: (q16Cos(a) * 1.9) / 65536,
            vy: (q16Sin(a) * 1.9) / 65536,
            grazed: false
          });
        }
      } else if (phase === 1) {
        // Spell Card II: Aimed 5-Way Fan Barrage toward Soul
        const baseAng = Math.atan2(this.soulY - 88, this.soulX - 240);
        for (let f = -2; f <= 2; f++) {
          const ang = baseAng + f * 0.22;
          this.bullets.push({
            x: 240, y: 88,
            vx: Math.cos(ang) * 2.3,
            vy: Math.sin(ang) * 2.3,
            grazed: false
          });
        }
      } else {
        // Spell Card III: Twin Counter-Rotating Vortex
        for (let arm = 0; arm < 6; arm++) {
          const dir = (arm & 1) ? 1 : -1;
          const a = (((this.phaseAngle * dir) + arm * 68629) % Q16_TAU + Q16_TAU) % Q16_TAU;
          this.bullets.push({
            x: 240, y: 88,
            vx: (q16Cos(a) * 2.15) / 65536,
            vy: (q16Sin(a) * 2.15) / 65536,
            grazed: false
          });
        }
      }
    }

    let hit = false;
    const nextBullets = [];
    for (const b of this.bullets) {
      b.x += b.vx * timeScale;
      b.y += b.vy * timeScale;
      if (b.x < 108 || b.x > 372 || b.y < 58 || b.y > 234) continue;

      const dist = Math.hypot(b.x - this.soulX, b.y - this.soulY);
      if (dist < 5.5) {
        hit = true;
        continue;
      }
      if (!b.grazed && dist < 20) {
        b.grazed = true;
        this.grazeCount++;
        this.focusEnergy = Math.min(100, this.focusEnergy + 3);
      }
      nextBullets.push(b);
    }
    this.bullets = nextBullets;
    return { hit, graze: this.grazeCount };
  }
}

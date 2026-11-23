import { Q16_TAU, q16Cos, q16Sin } from '../core/q16.js';

/** Deterministic Danmaku / Bullet-Hell Encounter Arena (Mitakihara-Labyrinth-Arcade) */
export class BulletHellArena {
  constructor() {
    this.active = false;
    this.bossName = '';
    this.bossHp = 3;
    this.bossAlign = 0;
    this.bullets = [];
    this.soulX = 240;
    this.soulY = 190;
    this.grazeCount = 0;
    this.phaseAngle = 0;
  }

  startEncounter(bossName, bossAlign, hp = 3) {
    this.active = true;
    this.bossName = bossName;
    this.bossAlign = bossAlign;
    this.bossHp = hp;
    this.bullets = [];
    this.soulX = 240;
    this.soulY = 196;
    this.grazeCount = 0;
    this.phaseAngle = 0;
  }

  moveSoul(dx, dy) {
    this.soulX = Math.max(120, Math.min(360, this.soulX + dx * 3));
    this.soulY = Math.max(96, Math.min(226, this.soulY + dy * 3));
  }

  /** Parry nearby projectiles with Bronze Gladius / Ward to damage boss */
  parryBurst() {
    let deflected = 0;
    this.bullets = this.bullets.filter((b) => {
      if (Math.hypot(b.x - this.soulX, b.y - this.soulY) < 34) {
        deflected++;
        return false;
      }
      return true;
    });
    if (deflected > 0 || this.grazeCount >= 8) {
      this.grazeCount = Math.max(0, this.grazeCount - 8);
      this.bossHp--;
      if (this.bossHp <= 0) {
        this.active = false;
        return { event: 'BANISHED' };
      }
      return { event: 'HIT', hp: this.bossHp };
    }
    return { event: 'WHIFF' };
  }

  step(tick) {
    if (!this.active) return { hit: false };
    this.phaseAngle = (this.phaseAngle + 7400) % Q16_TAU;

    // Emit 4-arm rotating Bhaskara spiral every 14 frames
    if (tick % 14 === 0) {
      for (let arm = 0; arm < 4; arm++) {
        const a = (this.phaseAngle + arm * 102944) % Q16_TAU;
        this.bullets.push({
          x: 240,
          y: 92,
          vx: (q16Cos(a) * 2.1) / 65536,
          vy: (q16Sin(a) * 2.1) / 65536,
          grazed: false
        });
      }
    }

    let hit = false;
    const nextBullets = [];
    for (const b of this.bullets) {
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < 105 || b.x > 375 || b.y < 55 || b.y > 235) continue;

      const dist = Math.hypot(b.x - this.soulX, b.y - this.soulY);
      if (dist < 6) {
        hit = true;
        continue;
      }
      if (!b.grazed && dist < 18) {
        b.grazed = true;
        this.grazeCount++;
      }
      nextBullets.push(b);
    }
    this.bullets = nextBullets;
    return { hit, graze: this.grazeCount };
  }
}

import { Q16_ONE, q16Clamp } from '../core/q16.js';
import { ALIGN } from '../core/spatial_sheaf.js';

export class TownshipWorld {
  constructor() {
    this.player = {
      x: 110, y: 186,
      xQ16: 110 << 16, yQ16: 186 << 16,
      vxQ16: 0, vyQ16: 0,
      grounded: true, coyoteFrames: 0, facing: 1, moving: false,
      hidden: false, slashTimer: 0, invulnTimer: 0
    };
    this.cameraX = 0;
    this.sanityQ16 = Q16_ONE;
    this.activeAlign = ALIGN.ULYAOTH;

    // Elevated platforms (harbor piers, colonial porch roofs, bell-tower catwalks)
    this.platforms = Array.of(
      { x: 180, y: 176, w: 84, h: 9 },
      { x: 290, y: 146, w: 90, h: 9 },
      { x: 560, y: 174, w: 96, h: 9 },
      { x: 700, y: 144, w: 96, h: 9 },
      { x: 1010, y: 172, w: 195, h: 9 }, // Bell-Tower Chime Catwalk
      { x: 1350, y: 174, w: 92, h: 9 },
      { x: 1500, y: 146, w: 96, h: 9 }
    );

    // Pushable cedar cargo crates
    this.crates = Array.of(
      { x: 148, y: 194, w: 24, h: 24 },
      { x: 1315, y: 194, w: 24, h: 24 }
    );

    // Dark recessed doorway stealth alcoves
    this.alcoves = Array.of(
      { x: 470, w: 42 },
      { x: 880, w: 42 },
      { x: 1360, w: 42 },
      { x: 1640, w: 42 }
    );

    // Elevated & ground Amber Resin Shards (rewarding vertical platforming)
    this.nodes = Array.of(
      { x: 332, y: 132, collected: false }, // High harbor platform
      { x: 745, y: 130, collected: false }, // Town square roof ledge
      { x: 920, y: 204, collected: false },
      { x: 1545, y: 132, collected: false }, // Old Mill upper catwalk
      { x: 1680, y: 204, collected: false }
    );

    // Patrolling Watchers & Multi-Stage Alternating Melee/Bullet-Hell Bosses
    this.foes = Array.of(
      {
        id: 'ZEALOT_1', x: 640, y: 186, dir: -1, minX: 520, maxX: 740,
        align: ALIGN.CHATTURGHA, name: 'Harbor Zealot',
        hp: 2, isBoss: false, alive: true, hurtTimer: 0
      },
      {
        id: 'STALKER_2', x: 1120, y: 140, dir: -1, minX: 1020, maxX: 1190,
        align: ALIGN.XELLOTATH, name: 'Belfry Watcher',
        hp: 2, isBoss: false, alive: true, hurtTimer: 0
      },
      {
        id: 'GATEKEEPER_BOSS', x: 1730, y: 186, dir: -1, minX: 1620, maxX: 1790,
        align: ALIGN.MANTOROK, name: 'Manor Gatekeeper',
        hp: 2, isBoss: true, danmakuTriggered: false, alive: true, hurtTimer: 0
      }
    );
  }

  jump() {
    if (this.player.grounded || this.player.coyoteFrames > 0) {
      this.player.vyQ16 = -276000;
      this.player.grounded = false;
      this.player.coyoteFrames = 0;
    }
  }

  /** Real-time Melee Gladius Slash against patrolling Watchers & Bosses */
  meleeSlash(hasGladius, combatEnabled) {
    const p = this.player;
    p.slashTimer = 10;
    if (!combatEnabled) return { event: 'NONE' };

    const reach = hasGladius ? 54 : 38;
    const dmg = hasGladius ? 2 : 1;

    for (const f of this.foes) {
      if (!f.alive) continue;
      const dx = f.x - p.x;
      const inFront = (p.facing > 0 && dx >= -10 && dx <= reach) || (p.facing < 0 && dx <= 10 && dx >= -reach);
      if (inFront && Math.abs(f.y - p.y) < 34) {
        f.hp -= dmg;
        f.hurtTimer = 12;
        f.x = q16Clamp(f.x + p.facing * 24, f.minX, f.maxX);
        this.activeAlign = f.align;

        // Multi-stage boss transitions coherently from Melee Phase -> Bullet-Hell Danmaku Phase!
        if (f.isBoss && f.hp <= 0 && !f.danmakuTriggered) {
          f.danmakuTriggered = true;
          f.hp = 1;
          return { event: 'TRIGGER_DANMAKU', foe: f };
        }
        if (f.hp <= 0) {
          f.alive = false;
          return { event: 'SLAIN', foe: f };
        }
        return { event: 'HIT', foe: f };
      }
    }
    return { event: 'SWING' };
  }

  step(moveX, tick, combatEnabled, arenaActive) {
    const p = this.player;
    if (p.slashTimer > 0) p.slashTimer--;
    if (p.invulnTimer > 0) p.invulnTimer--;

    const floorYQ16 = (218 - 32) << 16;
    const targetVxQ16 = moveX * 185000;
    p.vxQ16 += ((targetVxQ16 - p.vxQ16) >> 2);
    p.moving = Math.abs(moveX) > 0 || Math.abs(p.vxQ16) > 22000;
    if (moveX !== 0) p.facing = moveX > 0 ? 1 : -1;

    p.xQ16 = q16Clamp(p.xQ16 + p.vxQ16, 28 << 16, 1890 << 16);
    p.x = p.xQ16 >> 16;

    // Pushable cedar crates
    for (const c of this.crates) {
      if (Math.abs(p.y + 32 - (c.y + c.h)) < 12 && Math.abs(p.x - (c.x + (c.w >> 1))) < 22 && moveX !== 0) {
        c.x = q16Clamp(c.x + moveX * 2, 60, 1840);
      }
    }

    const prevBottom = p.y + 32;
    p.vyQ16 = Math.min(480000, p.vyQ16 + 13400);
    p.yQ16 += p.vyQ16;
    p.y = p.yQ16 >> 16;

    if (p.grounded) p.coyoteFrames = 6;
    else if (p.coyoteFrames > 0) p.coyoteFrames--;
    p.grounded = false;

    if (p.yQ16 >= floorYQ16) {
      p.yQ16 = floorYQ16;
      p.y = 186;
      p.vyQ16 = 0;
      p.grounded = true;
    }

    if (p.vyQ16 >= 0) {
      for (const c of this.crates) {
        if (p.x >= c.x - 6 && p.x <= c.x + c.w + 6 && prevBottom <= c.y + 5 && p.y + 32 >= c.y) {
          p.y = c.y - 32; p.yQ16 = p.y << 16; p.vyQ16 = 0; p.grounded = true;
        }
      }
      for (const plat of this.platforms) {
        if (p.x >= plat.x - 5 && p.x <= plat.x + plat.w + 5 && prevBottom <= plat.y + 5 && p.y + 32 >= plat.y) {
          p.y = plat.y - 32; p.yQ16 = p.y << 16; p.vyQ16 = 0; p.grounded = true;
        }
      }
    }

    // Stealth doorway alcoves
    p.hidden = false;
    for (const a of this.alcoves) {
      if (p.x >= a.x && p.x <= a.x + a.w && p.grounded) p.hidden = true;
    }

    this.cameraX = q16Clamp(p.x - 180, 0, 1920 - 480);

    // Patrolling Watchers with sweeping searchlight gaze cones
    let spotted = false;
    if (combatEnabled && !arenaActive) {
      for (const f of this.foes) {
        if (!f.alive) continue;
        if (f.hurtTimer > 0) f.hurtTimer--;
        if (tick % 2 === 0) {
          f.x += f.dir;
          if (f.x <= f.minX || f.x >= f.maxX) f.dir *= -1;
        }
        const inGaze = (f.dir > 0 && p.x > f.x && p.x - f.x < 105) || (f.dir < 0 && p.x < f.x && f.x - p.x < 105);
        if (inGaze && !p.hidden && Math.abs(f.y - p.y) < 36) {
          spotted = true;
          this.sanityQ16 = q16Clamp(this.sanityQ16 - 95, 0, Q16_ONE);
        }
        // Melee contact damage if Watcher lunges into player
        if (Math.abs(f.x - p.x) < 16 && Math.abs(f.y - p.y) < 24 && p.invulnTimer === 0) {
          p.invulnTimer = 45;
          this.sanityQ16 = q16Clamp(this.sanityQ16 - 6554, 0, Q16_ONE);
          p.vxQ16 = -f.dir * 260000;
        }
      }
    }

    return { spotted };
  }
}

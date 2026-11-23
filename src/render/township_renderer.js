import { Q16_ONE, Q16_TAU, q16Clamp, q16Sin, q16Cos } from '../core/q16.js';
import { PENTATONIC_CHIMES } from '../physics/verlet_canopy.js';
import { FACTIONS } from '../economy/faction_attache.js';

export const FB_WIDTH = 480;
export const FB_HEIGHT = 272;

const BAYER_4X4 = Uint8Array.of(0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5);

const B_SKY = 0;
const B_SEA = 32;
const B_WOOD = 64;
const B_IVORY = 96;
const B_PINE = 128;
const B_AMBER = 160;
const B_CRIMSON = 192;
const B_ASTRAL = 224;

export function buildTownshipCLUT8() {
  const lut = new Uint32Array(256);
  const banks = Array.of(
    Array.of(26, 38, 92),
    Array.of(24, 96, 118),
    Array.of(138, 92, 54),
    Array.of(214, 208, 192),
    Array.of(28, 78, 56),
    Array.of(255, 196, 58),
    Array.of(212, 42, 62),
    Array.of(178, 86, 245)
  );
  for (let b = 0; b < 8; b++) {
    const r0 = banks.at(b).at(0), g0 = banks.at(b).at(1), b0 = banks.at(b).at(2);
    for (let i = 0; i < 32; i++) {
      const t = i / 31;
      const r = Math.min(255, (r0 * t + (i > 26 ? (i - 26) * 14 : 0)) | 0);
      const g = Math.min(255, (g0 * t + (i > 26 ? (i - 26) * 14 : 0)) | 0);
      const bCol = Math.min(255, (b0 * t + (i > 26 ? (i - 26) * 14 : 0)) | 0);
      lut[(b << 5) + i] = (255 << 24) | (bCol << 16) | (g << 8) | r;
    }
  }
  return lut;
}

export class TownshipFramebuffer {
  constructor() {
    this.indices = new Uint8Array(FB_WIDTH * FB_HEIGHT);
    this.clut = buildTownshipCLUT8();
    this.rgba32 = new Uint32Array(FB_WIDTH * FB_HEIGHT);
  }

  fillShadedRect(x0, y0, x1, y1, bank, shadeLeft, shadeRight) {
    const w = Math.max(1, x1 - x0);
    for (let y = Math.max(0, y0); y <= Math.min(FB_HEIGHT - 1, y1); y++) {
      const row = y * FB_WIDTH;
      const bRow = (y & 3) << 2;
      for (let x = Math.max(0, x0); x <= Math.min(FB_WIDTH - 1, x1); x++) {
        const s = shadeLeft + (((shadeRight - shadeLeft) * (x - x0)) / w | 0);
        const dither = BAYER_4X4[bRow + (x & 3)] >> 3;
        this.indices[row + x] = bank + q16Clamp(s + dither, 1, 31);
      }
    }
  }

  /** Additive volumetric light cone with Bayer-dithered radial falloff */
  fillLightCone(apexX, apexY, endX, endYTop, endYBot, bank, intensity = 16) {
    const minX = q16Clamp(Math.min(apexX, endX), 0, FB_WIDTH - 1);
    const maxX = q16Clamp(Math.max(apexX, endX), 0, FB_WIDTH - 1);
    const minY = q16Clamp(Math.min(apexY, endYTop, endYBot), 0, FB_HEIGHT - 1);
    const maxY = q16Clamp(Math.max(apexY, endYTop, endYBot), 0, FB_HEIGHT - 1);
    const spanX = Math.max(1, Math.abs(endX - apexX));
    const a = { x: apexX, y: apexY }, b = { x: endX, y: endYTop }, c = { x: endX, y: endYBot };
    const area = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    if (area === 0) return;

    for (let y = minY; y <= maxY; y++) {
      const row = y * FB_WIDTH;
      const bRow = (y & 3) << 2;
      for (let x = minX; x <= maxX; x++) {
        const w0 = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
        const w1 = (c.x - b.x) * (y - b.y) - (c.y - b.y) * (x - b.x);
        const w2 = (a.x - c.x) * (y - c.y) - (a.y - c.y) * (x - c.x);
        if ((area > 0 && w0 >= 0 && w1 >= 0 && w2 >= 0) || (area < 0 && w0 <= 0 && w1 <= 0 && w2 <= 0)) {
          const distRatio = Math.min(1, Math.abs(x - apexX) / spanX);
          const dither = BAYER_4X4[bRow + (x & 3)] >> 2;
          const glow = q16Clamp(((intensity * (1 - distRatio * 0.72)) | 0) + dither, 4, 29);
          this.indices[row + x] = bank + glow;
        }
      }
    }
  }

  renderWorld(world, extra, tick) {
    const p = world.player;
    const camX = world.cameraX | 0;
    const pxScreen = (p.x - camX) | 0;
    const pyScreen = p.y | 0;
    const lanternR = (p.hidden ? 45 : (extra.hasTuningFork ? 140 : 100));
    const lanternRSq = lanternR * lanternR;

    // 1. Starry Indigo Sky + Cobblestone Street + Stormy Atlantic Surf
    for (let y = 0; y < FB_HEIGHT; y++) {
      const row = y * FB_WIDTH;
      const bRow = (y & 3) << 2;
      const dy = y - (pyScreen + 12);
      const dy2 = dy * dy;

      for (let x = 0; x < FB_WIDTH; x++) {
        const wx = x + camX;
        const dx = x - pxScreen;
        const d2 = dx * dx + dy2;
        const dither = BAYER_4X4[bRow + (x & 3)] >> 2;

        if (y < 218) {
          const swirl = ((q16Sin(((wx * 700) + (y * 1200) + (tick * 800)) % Q16_TAU) * 4) >> 16);
          const weave = ((wx & 3) === 0 || (y & 3) === 0) ? 2 : 0;
          const shade = q16Clamp(8 + (y >> 4) + swirl + weave + dither, 3, 24);
          if (d2 < lanternRSq) {
            const boost = 14 - (((d2 * 14) / lanternRSq) | 0);
            this.indices[row + x] = B_AMBER + q16Clamp(6 + boost + dither, 4, 24);
          } else {
            this.indices[row + x] = B_SKY + shade;
          }
        } else if (y < 236) {
          const mortar = (((y & 5) === 0) || (((wx + ((y >> 2) * 7)) & 15) === 0)) ? -4 : 0;
          const lit = d2 < lanternRSq ? 8 : 0;
          this.indices[row + x] = B_WOOD + q16Clamp(12 + mortar + lit + dither, 3, 26);
        } else {
          const wave = ((q16Sin(((wx * 1800) + (y * 2400) + (tick * 2400)) % Q16_TAU) * 5) >> 16);
          this.indices[row + x] = B_SEA + q16Clamp(14 + wave + dither, 4, 28);
        }
      }
    }

    // 2. Swirling Crescent Moon & Coastal Hills + Evergreen Pines
    const moonX = 385 - ((camX >> 3) % 90);
    const moonY = 42;
    this.fillCircle(moonX, moonY, 12, B_AMBER + 28);
    this.fillCircle(moonX + 5, moonY - 3, 10, B_SKY + 9);

    for (let sx = 0; sx < FB_WIDTH; sx += 4) {
      const wx = sx + (camX >> 1);
      const hy = 158 + ((q16Sin((wx * 850) % Q16_TAU) * 16) >> 16);
      this.fillRect(sx, hy, sx + 3, 217, B_PINE + 7);
    }

    for (let tx = 65; tx < 1890; tx += 135) {
      const sx = tx - camX;
      if (sx < -35 || sx > FB_WIDTH + 35) continue;
      this.fillRect(sx - 20, 217, sx + 22, 220, B_WOOD + 3);
      this.fillShadedRect(sx - 3, 198, sx + 3, 217, B_WOOD, 14, 6);
      for (let tier = 0; tier < 3; tier++) {
        const ty = 146 + tier * 16;
        const w = 16 + tier * 4;
        this.fillTri({ x: sx, y: ty }, { x: sx - w, y: ty + 28 }, { x: sx, y: ty + 28 }, B_PINE + 20);
        this.fillTri({ x: sx, y: ty }, { x: sx, y: ty + 28 }, { x: sx + w, y: ty + 28 }, B_PINE + 10);
      }
    }
    // 3. Blackwater Lighthouse + Sweeping Volumetric Beacon Frustum (x = 95)
    const lhSx = 95 - camX;
    if (lhSx > -220 && lhSx < FB_WIDTH + 220) {
      // Smooth 3D harmonic rotation: beam width & reach foreshorten dynamically as lamp turns!
      const rotAngle = (tick * 1350) % Q16_TAU;
      const beamReach = ((q16Sin(rotAngle) * 185) >> 16);
      const beamPitch = ((q16Cos(rotAngle) * 26) >> 16);
      const spread = 14 + (Math.abs(beamReach) >> 3);
      this.fillLightCone(lhSx, 87, lhSx + beamReach, 64 + beamPitch - spread, 64 + beamPitch + spread, B_AMBER, 22);

      this.fillTri({ x: lhSx - 8, y: 94 }, { x: lhSx - 16, y: 217 }, { x: lhSx, y: 217 }, B_IVORY + 27);
      this.fillTri({ x: lhSx - 8, y: 94 }, { x: lhSx + 8, y: 94 }, { x: lhSx, y: 217 }, B_IVORY + 24);
      this.fillTri({ x: lhSx + 8, y: 94 }, { x: lhSx, y: 217 }, { x: lhSx + 16, y: 217 }, B_IVORY + 14);
      this.fillShadedRect(lhSx - 12, 134, lhSx + 12, 152, B_CRIMSON, 25, 11);
      this.fillShadedRect(lhSx - 14, 178, lhSx + 14, 196, B_CRIMSON, 25, 11);
      this.fillShadedRect(lhSx - 9, 80, lhSx + 9, 94, B_AMBER, 31, 20);
      this.fillTri({ x: lhSx, y: 66 }, { x: lhSx - 11, y: 80 }, { x: lhSx, y: 80 }, B_CRIMSON + 26);
      this.fillTri({ x: lhSx, y: 66 }, { x: lhSx, y: 80 }, { x: lhSx + 11, y: 80 }, B_CRIMSON + 12);
    }

    // 4. Shaded Colonial Gambrel Houses + Recessed Stealth Doorways
    for (const hx of Array.of(480, 660, 890, 1370, 1650)) {
      const sx = hx - camX;
      if (sx < -65 || sx > FB_WIDTH + 65) continue;
      this.fillRect(sx - 34, 217, sx + 38, 221, B_WOOD + 2);
      this.fillShadedRect(sx + 14, 102, sx + 22, 124, B_CRIMSON, 22, 10);
      this.fillShadedRect(sx - 32, 144, sx + 32, 217, B_IVORY, 25, 13);
      for (let py = 152; py < 217; py += 8) this.drawLine(sx - 32, py, sx + 32, py, B_IVORY + 10);
      this.fillTri({ x: sx - 20, y: 118 }, { x: sx - 36, y: 144 }, { x: sx, y: 144 }, B_WOOD + 20);
      this.fillTri({ x: sx - 20, y: 118 }, { x: sx + 20, y: 118 }, { x: sx, y: 144 }, B_WOOD + 17);
      this.fillTri({ x: sx + 20, y: 118 }, { x: sx, y: 144 }, { x: sx + 36, y: 144 }, B_WOOD + 9);
      this.fillRect(sx - 32, 144, sx + 32, 147, B_WOOD + 4);
      this.fillRect(sx - 10, 180, sx + 10, 217, B_SKY + 1);
      this.drawRectOutline(sx - 10, 180, sx + 10, 217, B_WOOD + 16);
      for (const wx of Array.of(sx - 20, sx + 20)) {
        this.fillRect(wx - 6, 158, wx + 6, 174, B_AMBER + 28);
        this.drawLine(wx, 158, wx, 174, B_WOOD + 8);
        this.drawLine(wx - 6, 166, wx + 6, 166, B_WOOD + 8);
      }
    }

    // 5. Elevated Platform Ledges & Pushable Cedar Crates
    for (const plat of world.platforms) {
      const sx = plat.x - camX;
      if (sx + plat.w < -10 || sx > FB_WIDTH + 10) continue;
      this.fillShadedRect(sx, plat.y, sx + plat.w, plat.y + plat.h, B_WOOD, 22, 12);
      this.fillRect(sx, plat.y + plat.h, sx + plat.w, plat.y + plat.h + 3, B_SKY + 2);
    }

    for (const c of world.crates) {
      const sx = c.x - camX;
      if (sx + c.w < -10 || sx > FB_WIDTH + 10) continue;
      this.fillShadedRect(sx, c.y, sx + c.w, c.y + c.h, B_WOOD, 24, 11);
      this.drawRectOutline(sx, c.y, sx + c.w, c.y + c.h, B_WOOD + 28);
      this.drawLine(sx, c.y, sx + c.w, c.y + c.h, B_WOOD + 16);
    }

    // 6. Verlet Ribbons, Pentatonic Chimes, Faction Stalls & Amber Shards
    for (const rib of extra.canopy.ribbons) {
      for (let i = 1; i < rib.pts.length; i++) {
        const a = rib.pts.at(i - 1), b = rib.pts.at(i);
        const ax = (a.x - camX) | 0, bx = (b.x - camX) | 0;
        if (ax >= -20 && ax <= FB_WIDTH + 20) {
          this.drawLine(ax, a.y | 0, bx, b.y | 0, B_ASTRAL + 24);
          this.drawLine(ax + 1, a.y | 0, bx + 1, b.y | 0, B_CRIMSON + 22);
        }
      }
    }

    for (const ch of PENTATONIC_CHIMES) {
      const sx = ch.x - camX;
      if (sx < -24 || sx > FB_WIDTH + 24) continue;
      const sway = ((q16Sin(((tick + ch.id * 11) * 2600) % Q16_TAU) * 3) >> 16);
      const matched = extra.canopy.solved || extra.canopy.entered.includes(ch.id);
      this.drawLine(sx, 86, sx + sway, 134, B_IVORY + 24);
      this.fillRect(sx + sway - 4, 134, sx + sway + 4, 148, ch.bank + (matched ? 30 : 22));
      this.drawRectOutline(sx + sway - 4, 134, sx + sway + 4, 148, B_IVORY + 30);
      if (matched) this.fillCircle(sx + sway, 126, 3, B_AMBER + 31);
    }
    for (const rip of extra.canopy.ripples) {
      const rx = (rip.x - camX) | 0;
      if (rx >= -40 && rx <= FB_WIDTH + 40) {
        this.drawCircleOutline(rx, rip.y, rip.r | 0, rip.bank + 28, 18);
      }
    }

    for (const fac of Object.values(FACTIONS)) {
      const sx = fac.x - camX;
      if (sx < -40 || sx > FB_WIDTH + 40) continue;
      // Shaded Guild Outpost Canopy
      this.fillShadedRect(sx - 22, 182, sx + 2, 217, B_WOOD, 22, 10);
      this.fillTri({ x: sx - 10, y: 164 }, { x: sx - 26, y: 182 }, { x: sx + 6, y: 182 }, fac.bank + 22);

      // Distinct Visible Faction Envoy NPC standing at sx + 12
      const nx = sx + 12;
      const status = extra.npcStatus ? extra.npcStatus[fac.id] : "PEACEFUL";
      if (status !== "DEFEATED") {
        // Robed silhouette + head + guild staff/relic
        this.fillTri({ x: nx, y: 192 }, { x: nx - 8, y: 217 }, { x: nx + 8, y: 217 }, fac.bank + 24);
        this.fillCircle(nx, 187, 4, B_IVORY + 26);
        this.drawLine(nx - 6, 182, nx - 6, 217, B_AMBER + 28);
        this.fillCircle(nx - 6, 180, 2, fac.bank + 30);
        // Floating [!] interaction diamond when Evelyn approaches within 58m
        if (Math.abs(p.x - fac.x) <= 58) {
          const bob = ((q16Sin((tick * 4200) % Q16_TAU) * 2) >> 16);
          this.drawCircleOutline(nx, 170 + bob, 5, B_AMBER + 31, 8);
          this.drawLine(nx, 167 + bob, nx, 171 + bob, B_AMBER + 31);
        }
      } else {
        // Fallen cloak marker if bypassed by combat
        this.fillRect(nx - 9, 212, nx + 9, 217, fac.bank + 12);
      }
    }

    // Ethereal Swirling Soul Wisps (replaces generic amber)
    for (const node of world.nodes) {
      if (node.collected) continue;
      const sx = node.x - camX;
      if (sx < -20 || sx > FB_WIDTH + 20) continue;
      const bob = ((q16Sin((tick * 3400) % Q16_TAU) * 3) >> 16);
      this.fillCircle(sx, node.y + bob, 3, B_ASTRAL + 31);
      this.drawCircleOutline(sx, node.y + bob, 6, B_SEA + 26, 10);
      this.drawLine(sx, node.y + bob + 3, sx - 2, node.y + bob + 9, B_ASTRAL + 22);
    }

    // 7. Patrolling Watchers with Volumetric Searchlight Frustum Cone
    for (const f of world.foes) {
      if (!f.alive) continue;
      const sx = (f.x - camX) | 0;
      const sy = f.y | 0;
      if (sx < -40 || sx > FB_WIDTH + 40) continue;

      const reach = sx + f.dir * 108;
      const aimY = sy + 14 + (f.gazeSweepY | 0);
      const coneBank = f.alert ? B_CRIMSON : B_AMBER;
      this.fillLightCone(sx + f.dir * 6, sy + 6, reach, aimY - 18, aimY + 20, coneBank, f.alert ? 22 : 15);

      const cloak = f.hurtTimer > 0 ? (B_IVORY + 30) : (B_ASTRAL + 18);
      this.fillTri({ x: sx, y: sy - 18 }, { x: sx - 14, y: sy + 32 }, { x: sx, y: sy + 32 }, cloak);
      this.fillTri({ x: sx, y: sy - 18 }, { x: sx, y: sy + 32 }, { x: sx + 14, y: sy + 32 }, B_ASTRAL + 9);
      this.fillCircle(sx + f.dir * 4, sy - 10, 2, B_CRIMSON + 30);
      for (let h = 0; h < f.hp; h++) {
        this.fillRect(sx - 6 + h * 7, sy - 26, sx - 2 + h * 7, sy - 23, B_CRIMSON + 28);
      }
    }

    // 8. Manor Gate Threshold (x = 1820)
    const gateSx = 1820 - camX;
    if (gateSx >= -40 && gateSx <= FB_WIDTH + 40) {
      const col = extra.canopy.solved ? (B_PINE + 26) : (B_CRIMSON + 24);
      this.fillShadedRect(gateSx - 20, 126, gateSx - 14, 217, B_IVORY, 24, 12);
      this.fillShadedRect(gateSx + 14, 126, gateSx + 20, 217, B_IVORY, 24, 12);
      this.drawRectOutline(gateSx - 14, 134, gateSx + 14, 217, col);
    }

    // 9. Evelyn Roivas + Fluid Multi-Frame Crescent Gladius Slash
    if (extra.arena.active) {
      this.renderBulletHellOverlay(extra.arena, tick);
    } else {
      this.drawInvestigator(pxScreen, pyScreen, p, tick);
    }
  }

  renderBulletHellOverlay(arena, tick) {
    for (let y = 56; y < 236; y++) {
      const row = y * FB_WIDTH;
      for (let x = 106; x < 374; x++) this.indices[row + x] = B_SKY + 3;
    }
    this.drawRectOutline(106, 56, 374, 236, B_ASTRAL + 26);

    const hpW = ((240 * arena.bossHp) / arena.maxHp) | 0;
    this.fillRect(120, 60, 120 + hpW, 64, B_CRIMSON + 26);
    const focW = ((240 * arena.focusEnergy) / 100) | 0;
    this.fillRect(120, 228, 120 + focW, 232, arena.slowMo ? (B_AMBER + 30) : (B_SEA + 24));

    const bx = arena.bossX | 0, by = arena.bossY | 0;
    const r = 20;
    const rot = (tick * 2400) % Q16_TAU;
    for (let i = 0; i < 4; i++) {
      const a = rot + i * 102944;
      const rx = bx + ((r * q16Cos(a)) >> 16);
      const ry = by + ((8 * q16Sin(a)) >> 16);
      this.drawLine(bx, by - 20, rx, ry, B_ASTRAL + 30);
      this.drawLine(bx, by + 20, rx, ry, B_ASTRAL + 24);
    }

    for (const b of arena.bullets) {
      this.fillCircle(b.x | 0, b.y | 0, 3, B_CRIMSON + 28);
    }

    this.fillCircle(arena.soulX | 0, arena.soulY | 0, 4, B_AMBER + 31);
    this.drawCircleOutline(arena.soulX | 0, arena.soulY | 0, 20, arena.slowMo ? (B_AMBER + 28) : (B_SEA + 24), 16);
  }

  drawInvestigator(cx, topY, p, tick) {
    const stride = !p.grounded ? 3 : p.moving ? (((q16Sin((tick * 11000) % Q16_TAU) * 4) >> 16) * p.facing) : 0;
    const coatHi = p.hidden ? (B_SKY + 8) : (B_CRIMSON + 26);
    const coatLo = p.hidden ? (B_SKY + 5) : (B_CRIMSON + 15);
    this.fillTri({ x: cx, y: topY }, { x: cx - 8, y: topY + 12 }, { x: cx, y: topY + 12 }, coatHi);
    this.fillTri({ x: cx, y: topY }, { x: cx, y: topY + 12 }, { x: cx + 8, y: topY + 12 }, coatLo);
    this.fillTri({ x: cx, y: topY + 8 }, { x: cx - 10, y: topY + 25 }, { x: cx, y: topY + 25 }, coatHi);
    this.fillTri({ x: cx, y: topY + 8 }, { x: cx, y: topY + 25 }, { x: cx + 10, y: topY + 25 }, coatLo);

    this.drawLine(cx - 3, topY + 25, cx - 3 - stride, topY + 32, B_IVORY + 26);
    this.drawLine(cx + 3, topY + 25, cx + 3 + stride, topY + 32, B_IVORY + 26);

    const handX = cx + p.facing * 11;
    const handY = topY + 16;
    this.drawLine(cx + p.facing * 4, topY + 14, handX, handY, B_IVORY + 24);
    if (!p.hidden) this.fillCircle(handX, handY + 2, 3, B_AMBER + 31);

    // Fluid 14-Frame Damped Angular Gladius Slash + Crescent Ribbon Trail!
    if (p.slashTimer > 0) {
      const progress = 1 - (p.slashTimer / p.slashMax); // 0 -> 1
      const swingA = -1.25 + progress * 2.55;
      const trailA = Math.max(-1.25, swingA - 0.65);
      const bladeLen = 36;
      const tipX = (handX + p.facing * Math.cos(swingA) * bladeLen) | 0;
      const tipY = (handY + Math.sin(swingA) * bladeLen) | 0;
      const trlX = (handX + p.facing * Math.cos(trailA) * (bladeLen - 4)) | 0;
      const trlY = (handY + Math.sin(trailA) * (bladeLen - 4)) | 0;

      this.fillTri({ x: handX, y: handY }, { x: trlX, y: trlY }, { x: tipX, y: tipY }, B_ASTRAL + 24);
      this.drawLine(handX, handY, tipX, tipY, B_IVORY + 31);
      this.fillCircle(tipX, tipY, 2, B_AMBER + 31);
    }
  }

  fillRect(x0, y0, x1, y1, c) {
    for (let y = Math.max(0, y0); y <= Math.min(FB_HEIGHT - 1, y1); y++) {
      const row = y * FB_WIDTH;
      for (let x = Math.max(0, x0); x <= Math.min(FB_WIDTH - 1, x1); x++) this.indices[row + x] = c;
    }
  }

  fillCircle(cx, cy, r, c) {
    const r2 = r * r;
    for (let dy = -r; dy <= r; dy++) {
      const py = cy + dy;
if (py < 0 || py >= FB_HEIGHT) continue;
const row = py * FB_WIDTH;
for (let dx = -r; dx <= r; dx++) {
const px = cx + dx;
if (px >= 0 && px < FB_WIDTH && dx * dx + dy * dy <= r2) this.indices[row + px] = c;
}
}
}
fillTri(a, b, c, col) {
const minX = q16Clamp(Math.min(a.x, b.x, c.x), 0, FB_WIDTH - 1);
const maxX = q16Clamp(Math.max(a.x, b.x, c.x), 0, FB_WIDTH - 1);
const minY = q16Clamp(Math.min(a.y, b.y, c.y), 0, FB_HEIGHT - 1);
const maxY = q16Clamp(Math.max(a.y, b.y, c.y), 0, FB_HEIGHT - 1);
const area = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
if (area === 0) return;
for (let y = minY; y <= maxY; y++) {
const row = y * FB_WIDTH;
for (let x = minX; x <= maxX; x++) {
const w0 = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
const w1 = (c.x - b.x) * (y - b.y) - (c.y - b.y) * (x - b.x);
const w2 = (a.x - c.x) * (y - c.y) - (a.y - c.y) * (x - c.x);
if ((area > 0 && w0 >= 0 && w1 >= 0 && w2 >= 0) || (area < 0 && w0 <= 0 && w1 <= 0 && w2 <= 0)) {
this.indices[row + x] = col;
}
}
}
}
drawRectOutline(x0, y0, x1, y1, c) {
this.drawLine(x0, y0, x1, y0, c);
this.drawLine(x1, y0, x1, y1, c);
this.drawLine(x1, y1, x0, y1, c);
this.drawLine(x0, y1, x0, y0, c);
}
drawCircleOutline(cx, cy, r, c, segs = 12) {
let px = cx + r, py = cy;
for (let i = 1; i <= segs; i++) {
const a = ((i * Q16_TAU) / segs) | 0;
const nx = cx + ((r * q16Cos(a)) >> 16), ny = cy + ((r * q16Sin(a)) >> 16);
this.drawLine(px, py, nx, ny, c);
px = nx; py = ny;
}
}
drawLine(x0, y0, x1, y1, c) {
x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
let err = dx - dy;
while (true) {
if (x0 >= 0 && x0 < FB_WIDTH && y0 >= 0 && y0 < FB_HEIGHT) this.indices[y0 * FB_WIDTH + x0] = c;
if (x0 === x1 && y0 === y1) break;
const e2 = err << 1;
if (e2 > -dy) { err -= dy; x0 += sx; }
if (e2 < dx) { err += dx; y0 += sy; }
}
}
resolveRGBA32() {
for (let i = 0; i < this.indices.length; i++) this.rgba32[i] = this.clut[this.indices[i]];
return this.rgba32;
}
}

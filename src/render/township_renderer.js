import { Q16_ONE, Q16_TAU, q16Clamp, q16Sin, q16Cos } from '../core/q16.js';
import { PENTATONIC_CHIMES } from '../physics/verlet_canopy.js';
import { FACTIONS } from '../economy/faction_attache.js';

export const FB_WIDTH = 480;
export const FB_HEIGHT = 272;

const BAYER_4X4 = Uint8Array.of(0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5);

export function buildTownshipCLUT8() {
  const lut = new Uint32Array(256);
  const ramps = Array.of(
    Array.of(235, 34, 54),   // 0: Chattur'gha (Crimson)
    Array.of(44, 154, 248),  // 1: Ulyaoth (Cobalt)
    Array.of(40, 226, 126),  // 2: Xel'lotath (Emerald)
    Array.of(184, 78, 244)   // 3: Mantorok (Amethyst)
  );
  for (let bank = 0; bank < 4; bank++) {
    const r0 = ramps.at(bank).at(0), g0 = ramps.at(bank).at(1), b0 = ramps.at(bank).at(2);
    for (let i = 0; i < 64; i++) {
      const c = i < 4 ? i : ((i * i) >> 6);
      const r = Math.min(255, ((r0 * c) >> 6) + (i > 52 ? (i - 52) * 16 : 0));
      const g = Math.min(255, ((g0 * c) >> 6) + (i > 52 ? (i - 52) * 16 : 0));
      const b = Math.min(255, ((b0 * c) >> 6) + (i > 52 ? (i - 52) * 16 : 0));
      lut[(bank << 6) + i] = (255 << 24) | (b << 16) | (g << 8) | r;
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

  renderWorld(state, tick) {
    const camX = state.cameraX | 0;
    const bank = (state.activeAlign & 3) << 6;
    const pxScreen = (state.playerX - camX) | 0;
    const pyScreen = state.playerY | 0;
    const lanternR = state.hasTuningFork ? 145 : 105;
    const lanternRSq = lanternR * lanternR;

    // 1. Radial Fluid Fog + Lantern Beam + Bayer Dithering
    for (let y = 0; y < FB_HEIGHT; y++) {
      const row = y * FB_WIDTH;
      const bRow = (y & 3) << 2;
      const dy = y - (pyScreen + 12);
      const dy2 = dy * dy;
      const isGround = y >= 218;

      for (let x = 0; x < FB_WIDTH; x++) {
        const dx = x - pxScreen;
        const d2 = dx * dx + dy2;
        const fog = state.fluidFog.sampleFog(x, y);
        let light = isGround ? 8 : (3 + fog);
        if (d2 < lanternRSq) {
          const beam = 26 - (((d2 * 22) / lanternRSq) | 0);
          light = q16Clamp(beam + (isGround ? 6 : 0), 3, 35);
        }
        const dither = BAYER_4X4[bRow + (x & 3)] >> 2;
        this.indices[row + x] = bank + q16Clamp(light + dither, 1, 38);
      }
    }

    // 2. Township Ground, Dock Pilings & District Silhouettes
    this.drawLine(0, 218, FB_WIDTH - 1, 218, bank + 34);
    for (let wx = 120; wx < 1860; wx += 180) {
      const sx = wx - camX;
      if (sx < -60 || sx > FB_WIDTH + 60) continue;
      // Gothic gable house / harbor post silhouette
      this.drawRectOutline(sx - 28, 128, sx + 28, 218, bank + 22);
      this.drawLine(sx - 32, 128, sx, 94, bank + 28);
      this.drawLine(sx + 32, 128, sx, 94, bank + 28);
    }

    // 3. Verlet Cloth Canopy Ribbons
    for (const rib of state.canopy.ribbons) {
      for (let i = 1; i < rib.pts.length; i++) {
        const a = rib.pts.at(i - 1), b = rib.pts.at(i);
        const ax = (a.x - camX) | 0, bx = (b.x - camX) | 0;
        if (ax >= -20 && ax <= FB_WIDTH + 20) {
          this.drawLine(ax, a.y | 0, bx, b.y | 0, bank + 48);
          this.drawLine(ax + 1, a.y | 0, bx + 1, b.y | 0, bank + 36);
        }
      }
    }

    // 4. Pentatonic Wind Chimes (Bell-Tower Canopy x = 1020..1200)
    for (const ch of PENTATONIC_CHIMES) {
      const sx = ch.x - camX;
      if (sx < -20 || sx > FB_WIDTH + 20) continue;
      const sway = ((q16Sin(((tick + ch.id * 11) * 2600) % Q16_TAU) * 3) >> 16);
      const col = state.canopy.solved ? 190 : (bank + 60);
      this.drawLine(sx, 86, sx + sway, 134, col);
      this.drawRectOutline(sx + sway - 3, 134, sx + sway + 3, 148, col);
    }

    // 5. Three Township Faction Merchants
    for (const fac of Object.values(FACTIONS)) {
      const sx = fac.x - camX;
      if (sx < -30 || sx > FB_WIDTH + 30) continue;
      this.drawRectOutline(sx - 10, 178, sx + 10, 218, bank + 54);
      this.drawCircleOutline(sx, 170, 6, bank + 62, 12);
    }

    // 6. Gatherable Amber Resin Shards & Enemy Patrols
    for (const node of state.nodes) {
      if (node.collected) continue;
      const sx = node.x - camX;
      if (sx < -20 || sx > FB_WIDTH + 20) continue;
      const bob = ((q16Sin((tick * 3400) % Q16_TAU) * 2) >> 16);
      this.drawCircleOutline(sx, 204 + bob, 5, bank + 63, 10);
    }

    for (const foe of state.foes) {
      if (!foe.alive) continue;
      const sx = (foe.x - camX) | 0;
      if (sx < -30 || sx > FB_WIDTH + 30) continue;
      const fBank = (foe.align & 3) << 6;
      this.drawLine(sx, 164, sx - 14, 218, fBank + 46);
      this.drawLine(sx, 164, sx + 14, 218, fBank + 46);
      this.drawCircleOutline(sx, 158, 6, fBank + 62, 12);
    }

    // 7. Manor Gate Threshold (x = 1820)
    const gateSx = 1820 - camX;
    if (gateSx >= -40 && gateSx <= FB_WIDTH + 40) {
      const col = state.canopy.solved ? 190 : 58;
      this.drawRectOutline(gateSx - 18, 124, gateSx + 18, 218, col);
    }

    // 8. Investigator Silhouette (or Bullet-Hell Danmaku Arena Overlay!)
    if (state.arena.active) {
      this.renderBulletHellOverlay(state.arena, tick);
    } else {
      this.drawInvestigator(pxScreen, pyScreen, state.facing, state.moving, bank, tick);
    }
  }

  renderBulletHellOverlay(arena, tick) {
    const bBank = (arena.bossAlign & 3) << 6;
    // Dark ritual bounding box
    for (let y = 56; y < 236; y++) {
      const row = y * FB_WIDTH;
      for (let x = 106; x < 374; x++) this.indices[row + x] = bBank + 3;
    }
    this.drawRectOutline(106, 56, 374, 236, bBank + 60);

    // Rotating 3D Boss Octahedron at top of Danmaku box
    const r = 20;
    const rot = (tick * 2200) % Q16_TAU;
    for (let i = 0; i < 4; i++) {
      const a = rot + i * 102944;
      const rx = 240 + ((r * q16Cos(a)) >> 16);
      const ry = 88 + ((8 * q16Sin(a)) >> 16);
      this.drawLine(240, 64, rx, ry, bBank + 63);
      this.drawLine(240, 112, rx, ry, bBank + 54);
    }

    // Projectiles
    for (const b of arena.bullets) {
      this.drawCircleOutline(b.x | 0, b.y | 0, 3, bBank + 63, 8);
    }

    // Player Soul Heart & Parry Ring
    this.drawCircleOutline(arena.soulX | 0, arena.soulY | 0, 5, 126, 12);
    this.drawCircleOutline(arena.soulX | 0, arena.soulY | 0, 18, 92, 16);
  }

  drawInvestigator(cx, topY, facing, moving, bank, tick) {
    const stride = moving ? (((q16Sin((tick * 11000) % Q16_TAU) * 4) >> 16) * facing) : 0;
    this.drawLine(cx, topY, cx - 8, topY + 12, bank + 56);
    this.drawLine(cx, topY, cx + 8, topY + 12, bank + 56);
    this.drawLine(cx - 8, topY + 12, cx + 8, topY + 12, bank + 56);
    this.drawLine(cx - 9, topY + 25, cx + 9, topY + 25, bank + 63);
    this.drawLine(cx - 6, topY + 12, cx - 9, topY + 25, bank + 54);
    this.drawLine(cx + 6, topY + 12, cx + 9, topY + 25, bank + 54);
    this.drawLine(cx - 3, topY + 25, cx - 3 - stride, topY + 32, bank + 63);
    this.drawLine(cx + 3, topY + 25, cx + 3 + stride, topY + 32, bank + 63);
    this.drawCircleOutline(cx + facing * 11, topY + 17, 4, bank + 63, 10);
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

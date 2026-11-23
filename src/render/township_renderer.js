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

  drawImpastoStroke(x0, y0, x1, y1, baseCol) {
    this.drawLine(x0, y0 - 1, x1, y1 - 1, Math.min(255, baseCol + 8));
    this.drawLine(x0, y0, x1, y1, baseCol);
    this.drawLine(x0, y0 + 1, x1, y1 + 1, Math.max(1, baseCol - 6));
  }

  renderWorld(state, tick) {
    const camX = state.cameraX | 0;
    const bank = (state.activeAlign & 3) << 6;
    const pxScreen = (state.playerX - camX) | 0;
    const pyScreen = state.playerY | 0;
    const lanternR = state.hasTuningFork ? 155 : 112;
    const lanternRSq = lanternR * lanternR;

    // 1. Base Sky + Radial Fluid Fog + Lantern Beam
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
        let light = isGround ? 9 : (3 + (fog >> 1));
        if (d2 < lanternRSq) {
          const beam = 26 - (((d2 * 21) / lanternRSq) | 0);
          light = q16Clamp(beam + (isGround ? 6 : 0), 4, 36);
        }
        const dither = BAYER_4X4[bRow + (x & 3)] >> 2;
        this.indices[row + x] = bank + q16Clamp(light + dither, 2, 40);
      }
    }

    // 2. Eldritch Warped Van Gogh Impasto Flow Field (Non-Euclidean hyperbolic curl)
    for (let sy = 14; sy < 134; sy += 14) {
      for (let sx = -16; sx < FB_WIDTH + 16; sx += 24) {
        const wx = sx + (camX >> 1);
        const warp = q16Sin(((wx * 1100) - (sy * 1700) + (tick * 1300)) % Q16_TAU);
        const angle = ((warp * 48000) >> 16) + ((sy * 900) & 65535);
        const dx = (12 * q16Cos(angle)) >> 16;
        const dy = (12 * q16Sin(angle)) >> 16;
        const tone = bank + 18 + (((wx >> 4) ^ (sy >> 3)) & 15);
        this.drawImpastoStroke(sx - dx, sy - dy, sx + dx, sy + dy, tone);
      }
    }

    // 3. Eldritch Eclipse Vortex & Watching Eye-Halos in the Sky
    const moonX = 365 - ((camX >> 3) % 110);
    const moonY = 44;
    this.drawCircleOutline(moonX, moonY, 14, bank + 63, 18);
    this.drawLine(moonX, moonY - 11, moonX, moonY + 11, bank + 63); // Vertical slit pupil
    for (let ring = 1; ring <= 3; ring++) {
      const rad = 19 + ring * 11;
      for (let s = 0; s < 8; s++) {
        const dir = (ring & 1) ? 1 : -1; // Counter-rotating eldritch vortex rings
        const a0 = (((tick * 1300 * dir) + s * 51472 + ring * 14000) % Q16_TAU + Q16_TAU) % Q16_TAU;
        const a1 = (a0 + 26000) % Q16_TAU;
        this.drawImpastoStroke(
          moonX + ((rad * q16Cos(a0)) >> 16), moonY + (((rad >> 1) * q16Sin(a0)) >> 16),
          moonX + ((rad * q16Cos(a1)) >> 16), moonY + (((rad >> 1) * q16Sin(a1)) >> 16),
          bank + 34 + ring * 6
        );
      }
    }

    for (const st of Array.of({ x: 75, y: 34 }, { x: 195, y: 58 }, { x: 280, y: 28 }, { x: 435, y: 66 })) {
      const sx = ((st.x - (camX >> 2)) + 480) % 480;
      const pulse = (tick >> 3) & 3;
      this.drawLine(sx - 5, st.y, sx, st.y - 3, bank + 63);
      this.drawLine(sx, st.y - 3, sx + 5, st.y, bank + 63);
      this.drawLine(sx - 5, st.y, sx, st.y + 3, bank + 63);
      this.drawLine(sx, st.y + 3, sx + 5, st.y, bank + 63);
      this.drawLine(sx, st.y - 2, sx, st.y + 2, bank + 63);
      this.drawCircleOutline(sx, st.y, 8 + pulse, bank + 40, 14);
    }
    // 4. Warped Coastal Hills & Tentacle-Cypress Silhouettes
    let prevHillY = 148;
    for (let sx = 0; sx <= FB_WIDTH; sx += 16) {
      const wx = sx + (camX >> 1);
      const hy = 148 + ((q16Sin((wx * 900) % Q16_TAU) * 18) >> 16) + ((q16Cos((wx * 2100) % Q16_TAU) * 9) >> 16);
      if (sx > 0) this.drawImpastoStroke(sx - 16, prevHillY, sx, hy, bank + 26);
      prevHillY = hy;
    }

    for (let tx = 80; tx < 1880; tx += 150) {
      const sx = tx - camX;
      if (sx < -40 || sx > FB_WIDTH + 40) continue;
      for (let h = 0; h < 68; h += 6) {
        const whip = ((q16Sin(((tick * 2 + h * 7) * 2200) % Q16_TAU) * (2 + (h >> 4))) >> 16);
        const w = Math.max(1, ((68 - h) * h) >> 8);
        this.drawImpastoStroke(sx - w + whip, 218 - h, sx + w + whip, 213 - h, bank + 22);
      }
    }

    // 5. Cobblestone Road, Surf Waves, Streetlamps, Bell-Tower & Old Mill Wheel
    this.drawImpastoStroke(0, 218, FB_WIDTH - 1, 218, bank + 38);
    for (let wx = 0; wx < FB_WIDTH; wx += 14) {
      const waveY = 236 + ((q16Sin(((wx + camX + tick * 2) * 2400) % Q16_TAU) * 3) >> 16);
      this.drawImpastoStroke(wx, waveY, wx + 9, waveY, bank + 32);
    }

    for (let lx = 140; lx < 1800; lx += 220) {
      const sx = lx - camX;
      if (sx < -25 || sx > FB_WIDTH + 25) continue;
      this.drawLine(sx, 146, sx, 218, bank + 32);
      this.drawRectOutline(sx - 4, 136, sx + 4, 146, bank + 60);
      this.drawCircleOutline(sx, 141, 8 + ((tick >> 3) & 1), bank + 46, 10);
    }

    const towerSx = 1110 - camX;
    if (towerSx > -140 && towerSx < FB_WIDTH + 140) {
      this.drawRectOutline(towerSx - 105, 76, towerSx + 105, 86, bank + 40);
      this.drawImpastoStroke(towerSx - 105, 76, towerSx, 34, bank + 46);
      this.drawImpastoStroke(towerSx + 105, 76, towerSx, 34, bank + 46);
    }

    const wheelSx = 1540 - camX;
    if (wheelSx > -60 && wheelSx < FB_WIDTH + 60) {
      this.drawCircleOutline(wheelSx, 184, 28, bank + 42, 16);
      for (let sp = 0; sp < 4; sp++) {
        const a = (((tick * 1200) + sp * 102944) % Q16_TAU);
        const dx = (28 * q16Cos(a)) >> 16, dy = (28 * q16Sin(a)) >> 16;
        this.drawLine(wheelSx - dx, 184 - dy, wheelSx + dx, 184 + dy, bank + 38);
      }
    }

    // 6. Verlet Cloth Canopy Ribbons & Pentatonic Wind Chimes
    for (const rib of state.canopy.ribbons) {
      for (let i = 1; i < rib.pts.length; i++) {
        const a = rib.pts.at(i - 1), b = rib.pts.at(i);
        const ax = (a.x - camX) | 0, bx = (b.x - camX) | 0;
        if (ax >= -20 && ax <= FB_WIDTH + 20) {
          this.drawImpastoStroke(ax, a.y | 0, bx, b.y | 0, bank + 50);
        }
      }
    }

    for (const ch of PENTATONIC_CHIMES) {
      const sx = ch.x - camX;
      if (sx < -20 || sx > FB_WIDTH + 20) continue;
      const sway = ((q16Sin(((tick + ch.id * 11) * 2600) % Q16_TAU) * 3) >> 16);
      const col = state.canopy.solved ? 190 : (bank + 62);
      this.drawLine(sx, 86, sx + sway, 134, col);
      this.drawRectOutline(sx + sway - 3, 134, sx + sway + 3, 148, col);
    }

    // 7. Faction Guild Outposts, Amber Nodes, Foes & Manor Gate
    for (const fac of Object.values(FACTIONS)) {
      const sx = fac.x - camX;
      if (sx < -30 || sx > FB_WIDTH + 30) continue;
      this.drawRectOutline(sx - 12, 174, sx + 12, 218, bank + 54);
      this.drawImpastoStroke(sx - 15, 174, sx, 160, bank + 60);
      this.drawImpastoStroke(sx + 15, 174, sx, 160, bank + 60);
      this.drawCircleOutline(sx, 186, 4, bank + 62, 10);
    }

    for (const node of state.nodes) {
      if (node.collected) continue;
      const sx = node.x - camX;
      if (sx < -20 || sx > FB_WIDTH + 20) continue;
      const bob = ((q16Sin((tick * 3400) % Q16_TAU) * 2) >> 16);
      this.drawCircleOutline(sx, 204 + bob, 5, bank + 63, 10);
      this.drawLine(sx, 198 + bob, sx, 210 + bob, bank + 63);
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

    const gateSx = 1820 - camX;
    if (gateSx >= -40 && gateSx <= FB_WIDTH + 40) {
      const col = state.canopy.solved ? 190 : 58;
      this.drawRectOutline(gateSx - 18, 124, gateSx + 18, 218, col);
      this.drawImpastoStroke(gateSx - 22, 124, gateSx, 102, col);
      this.drawImpastoStroke(gateSx + 22, 124, gateSx, 102, col);
    }

    if (state.arena.active) {
      this.renderBulletHellOverlay(state.arena, tick);
    } else {
      this.drawInvestigator(pxScreen, pyScreen, state.facing, state.moving, bank, tick);
    }
  }

  renderBulletHellOverlay(arena, tick) {
    const bBank = (arena.bossAlign & 3) << 6;
    for (let y = 56; y < 236; y++) {
      const row = y * FB_WIDTH;
      for (let x = 106; x < 374; x++) this.indices[row + x] = bBank + 3;
    }
    this.drawRectOutline(106, 56, 374, 236, bBank + 60);

    const r = 20;
    const rot = (tick * 2200) % Q16_TAU;
    for (let i = 0; i < 4; i++) {
      const a = rot + i * 102944;
      const rx = 240 + ((r * q16Cos(a)) >> 16);
      const ry = 88 + ((8 * q16Sin(a)) >> 16);
      this.drawLine(240, 64, rx, ry, bBank + 63);
      this.drawLine(240, 112, rx, ry, bBank + 54);
    }

    for (const b of arena.bullets) {
      this.drawCircleOutline(b.x | 0, b.y | 0, 3, bBank + 63, 8);
    }

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

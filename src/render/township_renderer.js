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

  /** Draw a LittleBigPlanet-style dashed thread seam line */
  drawStitchedLine(x0, y0, x1, y1, c) {
    const steps = Math.max(1, (Math.hypot(x1 - x0, y1 - y0) / 6) | 0);
    for (let i = 0; i < steps; i += 2) {
      const ax = (x0 + ((x1 - x0) * i) / steps) | 0;
      const ay = (y0 + ((y1 - y0) * i) / steps) | 0;
      const bx = (x0 + ((x1 - x0) * (i + 1)) / steps) | 0;
      const by = (y0 + ((y1 - y0) * (i + 1)) / steps) | 0;
      this.drawLine(ax, ay, bx, by, c);
    }
  }

  renderWorld(state, tick) {
    const camX = state.cameraX | 0;
    const bank = (state.activeAlign & 3) << 6;
    const pxScreen = (state.playerX - camX) | 0;
    const pyScreen = state.playerY | 0;
    const lanternR = state.hasTuningFork ? 155 : 112;
    const lanternRSq = lanternR * lanternR;

    // 1. LittleBigPlanet Cross-Stitched Burlap Sky + Cobblestone Ground + Lantern Cone
    for (let y = 0; y < FB_HEIGHT; y++) {
      const row = y * FB_WIDTH;
      const bRow = (y & 3) << 2;
      const dy = y - (pyScreen + 12);
      const dy2 = dy * dy;
      const isGround = y >= 218;

      for (let x = 0; x < FB_WIDTH; x++) {
        const wx = x + camX;
        const dx = x - pxScreen;
        const d2 = dx * dx + dy2;
        const fog = state.fluidFog.sampleFog(x, y);
        // Tactile burlap cross-weave in sky, cobblestone brick mortar on ground
        const burlapWeave = (((wx & 3) === 0 || (y & 3) === 0) ? 2 : 0);
        const cobble = isGround && (((y & 7) === 0) || (((wx + ((y >> 3) * 6)) & 15) === 0)) ? -3 : 0;
        let light = isGround ? (11 + cobble) : (4 + burlapWeave + (fog >> 1));

        if (d2 < lanternRSq) {
          const beam = 26 - (((d2 * 21) / lanternRSq) | 0);
          light = q16Clamp(beam + (isGround ? 6 + cobble : 0), 4, 36);
        }
        const dither = BAYER_4X4[bRow + (x & 3)] >> 2;
        this.indices[row + x] = bank + q16Clamp(light + dither, 2, 42);
      }
    }

    // 2. Eldritch Warped Van Gogh Impasto Swirls + Cardboard Cutout Clouds with Stitching
    for (let sy = 16; sy < 118; sy += 18) {
      for (let sx = -16; sx < FB_WIDTH + 16; sx += 30) {
        const wx = sx + (camX >> 1);
        const warp = q16Sin(((wx * 1100) - (sy * 1700) + (tick * 1100)) % Q16_TAU);
        const angle = ((warp * 42000) >> 16);
        const dx = (11 * q16Cos(angle)) >> 16;
        const dy = (11 * q16Sin(angle)) >> 16;
        this.drawImpastoStroke(sx - dx, sy - dy, sx + dx, sy + dy, bank + 20);
      }
    }

    // LBP Cardboard Cutout Clouds with Stitched Borders
    for (const cl of Array.of({ x: 110, y: 42 }, { x: 290, y: 34 }, { x: 450, y: 52 })) {
      const cx = ((cl.x - (camX >> 2)) + 520) % 520 - 20;
      this.fillRect(cx - 24, cl.y - 7, cx + 24, cl.y + 7, bank + 16);
      this.fillRect(cx - 14, cl.y - 13, cx + 14, cl.y + 7, bank + 20);
      this.drawStitchedLine(cx - 24, cl.y + 7, cx + 24, cl.y + 7, bank + 44);
      this.drawStitchedLine(cx - 24, cl.y - 7, cx + 24, cl.y - 7, bank + 44);
    }

    // 3. Eldritch Slit-Pupil Eclipse Moon
    const moonX = 390 - ((camX >> 3) % 90);
    const moonY = 44;
    this.drawCircleOutline(moonX, moonY, 13, bank + 63, 18);
    this.drawLine(moonX, moonY - 10, moonX, moonY + 10, bank + 63);
    // 4. Blackwater Lighthouse with Sweeping Volumetric Beam (x = 90)
    const lhSx = 90 - camX;
    if (lhSx > -160 && lhSx < FB_WIDTH + 160) {
      // Tapered stone lighthouse tower + lantern room
      this.drawLine(lhSx - 14, 218, lhSx - 8, 96, bank + 46);
      this.drawLine(lhSx + 14, 218, lhSx + 8, 96, bank + 46);
      this.drawStitchedLine(lhSx - 11, 156, lhSx + 11, 156, bank + 54);
      this.drawRectOutline(lhSx - 9, 82, lhSx + 9, 96, bank + 62);
      this.drawLine(lhSx - 11, 82, lhSx, 68, bank + 60);
      this.drawLine(lhSx + 11, 82, lhSx, 68, bank + 60);
      // Sweeping searchlight beam
      const sweep = ((q16Sin((tick * 1600) % Q16_TAU) * 140) >> 16);
      this.drawLine(lhSx, 89, lhSx + sweep, 46, bank + 42);
      this.drawLine(lhSx, 89, lhSx + sweep, 78, bank + 42);
    }

    // 5. Harbor Schooner Mast & Rigging (x = 260)
    const shipSx = 260 - camX;
    if (shipSx > -80 && shipSx < FB_WIDTH + 80) {
      this.drawLine(shipSx, 218, shipSx, 92, bank + 38);
      this.drawLine(shipSx - 26, 126, shipSx + 26, 126, bank + 38);
      this.drawStitchedLine(shipSx, 92, shipSx - 34, 204, bank + 32);
      this.drawStitchedLine(shipSx, 92, shipSx + 34, 204, bank + 32);
    }

    // 6. Rhode Island Clapboard Gambrel Houses (Paned Windows & Brick Chimneys)
    for (const hx of Array.of(480, 660, 880, 1360, 1640)) {
      const sx = hx - camX;
      if (sx < -60 || sx > FB_WIDTH + 60) continue;
      // Clapboard siding planks
      this.fillRect(sx - 32, 144, sx + 32, 218, bank + 14);
      for (let py = 152; py < 218; py += 8) this.drawLine(sx - 32, py, sx + 32, py, bank + 22);
      this.drawRectOutline(sx - 32, 144, sx + 32, 218, bank + 42);
      // Gambrel New England roof + brick chimney
      this.drawLine(sx - 36, 144, sx - 20, 118, bank + 48);
      this.drawLine(sx - 20, 118, sx + 20, 118, bank + 48);
      this.drawLine(sx + 20, 118, sx + 36, 144, bank + 48);
      this.drawRectOutline(sx + 14, 102, sx + 22, 118, bank + 44);
      // Lit 4-pane colonial windows
      for (const wx of Array.of(sx - 16, sx + 16)) {
        this.drawRectOutline(wx - 6, 160, wx + 6, 176, bank + 60);
        this.drawLine(wx, 160, wx, 176, bank + 46);
        this.drawLine(wx - 6, 168, wx + 6, 168, bank + 46);
      }
    }

    // 7. Bell-Tower Spire (1110m) & Turning Old Mill Waterwheel (1540m)
    const towerSx = 1110 - camX;
    if (towerSx > -140 && towerSx < FB_WIDTH + 140) {
      this.drawRectOutline(towerSx - 105, 76, towerSx + 105, 86, bank + 44);
      this.drawImpastoStroke(towerSx - 105, 76, towerSx, 24, bank + 52);
      this.drawImpastoStroke(towerSx + 105, 76, towerSx, 24, bank + 52);
    }

    const wheelSx = 1540 - camX;
    if (wheelSx > -60 && wheelSx < FB_WIDTH + 60) {
      this.drawCircleOutline(wheelSx, 184, 28, bank + 46, 16);
      for (let sp = 0; sp < 4; sp++) {
        const a = (((tick * 1200) + sp * 102944) % Q16_TAU);
        const dx = (28 * q16Cos(a)) >> 16, dy = (28 * q16Sin(a)) >> 16;
        this.drawLine(wheelSx - dx, 184 - dy, wheelSx + dx, 184 + dy, bank + 40);
      }
    }

    // 8. Stitched Verlet Cloth Ribbons & Pentatonic Chimes
    for (const rib of state.canopy.ribbons) {
      for (let i = 1; i < rib.pts.length; i++) {
        const a = rib.pts.at(i - 1), b = rib.pts.at(i);
        const ax = (a.x - camX) | 0, bx = (b.x - camX) | 0;
        if (ax >= -20 && ax <= FB_WIDTH + 20) {
          this.drawImpastoStroke(ax, a.y | 0, bx, b.y | 0, bank + 52);
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

    // 9. Faction Guild Outposts, Amber Nodes, Foes & Manor Gate
    for (const fac of Object.values(FACTIONS)) {
      const sx = fac.x - camX;
      if (sx < -30 || sx > FB_WIDTH + 30) continue;
      this.drawRectOutline(sx - 12, 174, sx + 12, 218, bank + 56);
      this.drawStitchedLine(sx - 12, 178, sx + 12, 178, bank + 62);
      this.drawCircleOutline(sx, 188, 4, bank + 62, 10);
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

    // Boss HP & Focus Energy bars inside Danmaku frame
    const hpW = ((240 * arena.bossHp) / arena.maxHp) | 0;
    this.fillRect(120, 60, 120 + hpW, 64, bBank + 62);
    const focW = ((240 * arena.focusEnergy) / 100) | 0;
    this.fillRect(120, 228, 120 + focW, 232, arena.slowMo ? 126 : 96);

    const r = 20;
    const rot = (tick * 2200) % Q16_TAU;
    for (let i = 0; i < 4; i++) {
      const a = rot + i * 102944;
      const rx = 240 + ((r * q16Cos(a)) >> 16);
      const ry = 88 + ((8 * q16Sin(a)) >> 16);
      this.drawLine(240, 68, rx, ry, bBank + 63);
      this.drawLine(240, 108, rx, ry, bBank + 54);
    }

    for (const b of arena.bullets) {
      this.drawCircleOutline(b.x | 0, b.y | 0, 3, bBank + 63, 8);
    }

    this.drawCircleOutline(arena.soulX | 0, arena.soulY | 0, 5, 126, 12);
    this.drawCircleOutline(arena.soulX | 0, arena.soulY | 0, 20, arena.slowMo ? 126 : 92, 16);
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

  fillRect(x0, y0, x1, y1, c) {
    for (let y = Math.max(0, y0); y <= Math.min(FB_HEIGHT - 1, y1); y++) {
      const row = y * FB_WIDTH;
      for (let x = Math.max(0, x0); x <= Math.min(FB_WIDTH - 1, x1); x++) this.indices[row + x] = c;
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

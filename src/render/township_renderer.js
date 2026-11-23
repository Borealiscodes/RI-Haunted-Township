import { Q16_ONE, Q16_TAU, q16Clamp, q16Sin, q16Cos } from '../core/q16.js';
import { PENTATONIC_CHIMES } from '../physics/verlet_canopy.js';
import { FACTIONS } from '../economy/faction_attache.js';

export const FB_WIDTH = 480;
export const FB_HEIGHT = 272;

const BAYER_4X4 = Uint8Array.of(0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5);

// 8 Scenic Material Banks (32 shades each = 256 CLUT8 colors!)
const B_SKY = 0;        // Midnight Starry Indigo
const B_SEA = 32;       // Stormy Atlantic Teal
const B_WOOD = 64;      // Weathered Cedar & Burlap Ochre
const B_IVORY = 96;     // Colonial Clapboard Ivory & Stone
const B_PINE = 128;     // Haunted Evergreen & Coastal Moss
const B_AMBER = 160;    // Lantern Gold & Glowing Windows
const B_CRIMSON = 192;  // Crimson Raincoat & Brick Chimneys
const B_ASTRAL = 224;   // Amethyst Chimes & Eldritch Glow

export function buildTownshipCLUT8() {
  const lut = new Uint32Array(256);
  const banks = Array.of(
    Array.of(26, 38, 92),    // 0: Sky Indigo
    Array.of(24, 96, 118),   // 1: Atlantic Teal
    Array.of(138, 92, 54),   // 2: Cedar Wood / Burlap
    Array.of(214, 208, 192), // 3: Clapboard Ivory / Stone
    Array.of(28, 78, 56),    // 4: Coastal Evergreen
    Array.of(255, 196, 58),  // 5: Lantern Amber
    Array.of(212, 42, 62),   // 6: Crimson Coat / Brick
    Array.of(178, 86, 245)   // 7: Astral Amethyst
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

  drawStitchedLine(x0, y0, x1, y1, c) {
    const steps = Math.max(1, (Math.hypot(x1 - x0, y1 - y0) / 5) | 0);
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
    const pxScreen = (state.playerX - camX) | 0;
    const pyScreen = state.playerY | 0;
    const lanternR = state.hasTuningFork ? 140 : 100;
    const lanternRSq = lanternR * lanternR;

    // 1. Multi-Material Background: Starry Indigo Sky + Cobblestone Street + Atlantic Sea
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
          // Starry Indigo Sky with burlap weave & swirling Van Gogh gradient
          const swirl = ((q16Sin(((wx * 700) + (y * 1200) + (tick * 800)) % Q16_TAU) * 4) >> 16);
          const weave = ((wx & 3) === 0 || (y & 3) === 0) ? 2 : 0;
          let shade = q16Clamp(8 + ((y >> 4)) + swirl + weave + dither, 3, 24);
          if (d2 < lanternRSq) {
            // Warm Amber Lantern Halo illuminating the night air
            const boost = 14 - (((d2 * 14) / lanternRSq) | 0);
            this.indices[row + x] = B_AMBER + q16Clamp(6 + boost + dither, 4, 24);
          } else {
            this.indices[row + x] = B_SKY + shade;
          }
        } else if (y < 236) {
          // Cobblestone & Cedar Boardwalk
          const mortar = (((y & 5) === 0) || (((wx + ((y >> 2) * 7)) & 15) === 0)) ? -4 : 0;
          const lit = d2 < lanternRSq ? 8 : 0;
          this.indices[row + x] = B_WOOD + q16Clamp(12 + mortar + lit + dither, 3, 26);
        } else {
          // Stormy Atlantic Teal Ocean with animated wave crests
          const wave = ((q16Sin(((wx * 1800) + (y * 2400) + (tick * 2400)) % Q16_TAU) * 5) >> 16);
          this.indices[row + x] = B_SEA + q16Clamp(14 + wave + dither, 4, 28);
        }
      }
    }

    // 2. Swirling Starry Moon & Golden Star Halos
    const moonX = 385 - ((camX >> 3) % 90);
    const moonY = 42;
    this.fillCircle(moonX, moonY, 12, B_AMBER + 28);
    this.fillCircle(moonX + 5, moonY - 3, 10, B_SKY + 9);
    for (let s = 0; s < 8; s++) {
      const a0 = (((tick * 1100) + s * 51472) % Q16_TAU);
      const a1 = (a0 + 26000) % Q16_TAU;
      this.drawLine(
        moonX + ((21 * q16Cos(a0)) >> 16), moonY + ((11 * q16Sin(a0)) >> 16),
        moonX + ((21 * q16Cos(a1)) >> 16), moonY + ((11 * q16Sin(a1)) >> 16),
        B_AMBER + 22
      );
    }

    for (const st of Array.of({ x: 70, y: 30 }, { x: 185, y: 52 }, { x: 275, y: 26 }, { x: 445, y: 58 })) {
      const sx = ((st.x - (camX >> 2)) + 480) % 480;
      const pulse = (tick >> 3) & 3;
      this.fillRect(sx - 1, st.y - 1, sx + 1, st.y + 1, B_AMBER + 31);
      this.drawCircleOutline(sx, st.y, 6 + pulse, B_AMBER + 18, 12);
    }

    // 3. Solid Filled Coastal Hills & Layered Evergreen Pine Forest
    for (let sx = 0; sx < FB_WIDTH; sx += 4) {
      const wx = sx + (camX >> 1);
      const hy = 158 + ((q16Sin((wx * 850) % Q16_TAU) * 16) >> 16);
      this.fillRect(sx, hy, sx + 3, 217, B_PINE + 7);
    }

    for (let tx = 65; tx < 1890; tx += 135) {
      const sx = tx - camX;
      if (sx < -35 || sx > FB_WIDTH + 35) continue;
      // Cedar trunk + 3 stacked evergreen bough triangles
      this.fillRect(sx - 3, 198, sx + 3, 217, B_WOOD + 9);
      this.fillTri({ x: sx, y: 146 }, { x: sx - 16, y: 174 }, { x: sx + 16, y: 174 }, B_PINE + 16);
      this.fillTri({ x: sx, y: 162 }, { x: sx - 20, y: 190 }, { x: sx + 20, y: 190 }, B_PINE + 14);
      this.fillTri({ x: sx, y: 178 }, { x: sx - 24, y: 204 }, { x: sx + 24, y: 204 }, B_PINE + 12);
    }
    // 4. Blackwater Lighthouse (White & Crimson Striped Tower + Sweeping Golden Beacon)
    const lhSx = 95 - camX;
    if (lhSx > -180 && lhSx < FB_WIDTH + 180) {
      this.fillTri({ x: lhSx - 8, y: 94 }, { x: lhSx - 16, y: 217 }, { x: lhSx + 16, y: 217 }, B_IVORY + 24);
      this.fillTri({ x: lhSx - 8, y: 94 }, { x: lhSx + 8, y: 94 }, { x: lhSx + 16, y: 217 }, B_IVORY + 22);
      // Crimson lighthouse bands
      this.fillRect(lhSx - 12, 134, lhSx + 12, 152, B_CRIMSON + 20);
      this.fillRect(lhSx - 14, 178, lhSx + 14, 196, B_CRIMSON + 20);
      // Lantern gallery & crimson dome
      this.fillRect(lhSx - 9, 80, lhSx + 9, 94, B_AMBER + 29);
      this.fillTri({ x: lhSx, y: 66 }, { x: lhSx - 11, y: 80 }, { x: lhSx + 11, y: 80 }, B_CRIMSON + 22);
      // Sweeping golden light beam
      const sweep = ((q16Sin((tick * 1500) % Q16_TAU) * 155) >> 16);
      this.drawLine(lhSx, 87, lhSx + sweep, 44, B_AMBER + 26);
      this.drawLine(lhSx, 87, lhSx + sweep, 62, B_AMBER + 22);
      this.drawLine(lhSx, 87, lhSx + sweep, 80, B_AMBER + 26);
    }

    // 5. Harbor Schooner Hull, Mast & Stitched Sail (x = 250)
    const shipSx = 250 - camX;
    if (shipSx > -80 && shipSx < FB_WIDTH + 80) {
      this.fillTri({ x: shipSx - 34, y: 212 }, { x: shipSx + 34, y: 212 }, { x: shipSx + 22, y: 232 }, B_WOOD + 14);
      this.fillTri({ x: shipSx - 34, y: 212 }, { x: shipSx - 22, y: 232 }, { x: shipSx + 22, y: 232 }, B_WOOD + 12);
      this.fillRect(shipSx - 2, 114, shipSx + 2, 212, B_WOOD + 18);
      this.fillTri({ x: shipSx + 2, y: 120 }, { x: shipSx + 2, y: 196 }, { x: shipSx + 32, y: 196 }, B_IVORY + 20);
      this.drawStitchedLine(shipSx + 2, 120, shipSx + 32, 196, B_CRIMSON + 22);
    }

    // 6. Solid Colonial Clapboard Houses (Gambrel Cedar Roofs, Brick Chimneys & Glowing Amber Windows)
    for (const hx of Array.of(480, 660, 890, 1370, 1650)) {
      const sx = hx - camX;
      if (sx < -65 || sx > FB_WIDTH + 65) continue;
      // Brick chimney
      this.fillRect(sx + 14, 102, sx + 22, 124, B_CRIMSON + 16);
      // Clapboard Ivory body
      this.fillRect(sx - 32, 144, sx + 32, 217, B_IVORY + 21);
      for (let py = 152; py < 217; py += 8) this.drawLine(sx - 32, py, sx + 32, py, B_IVORY + 15);
      // Cedar Gambrel Roof
      this.fillTri({ x: sx - 20, y: 118 }, { x: sx - 36, y: 144 }, { x: sx + 36, y: 144 }, B_WOOD + 13);
      this.fillTri({ x: sx - 20, y: 118 }, { x: sx + 20, y: 118 }, { x: sx + 36, y: 144 }, B_WOOD + 15);
      this.drawStitchedLine(sx - 36, 144, sx + 36, 144, B_AMBER + 24);
      // Cedar front door + glowing warm amber windows
      this.fillRect(sx - 5, 188, sx + 5, 217, B_WOOD + 10);
      for (const wx of Array.of(sx - 18, sx + 18)) {
        this.fillRect(wx - 6, 158, wx + 6, 174, B_AMBER + 28);
        this.drawLine(wx, 158, wx, 174, B_WOOD + 8);
        this.drawLine(wx - 6, 166, wx + 6, 166, B_WOOD + 8);
      }
    }

    // 7. Bell-Tower Belfry (1110m) & Turning Old Mill Waterwheel (1540m)
    const towerSx = 1110 - camX;
    if (towerSx > -140 && towerSx < FB_WIDTH + 140) {
      this.fillRect(towerSx - 108, 76, towerSx + 108, 86, B_WOOD + 14);
      this.fillTri({ x: towerSx, y: 26 }, { x: towerSx - 108, y: 76 }, { x: towerSx + 108, y: 76 }, B_IVORY + 18);
      this.drawStitchedLine(towerSx - 108, 76, towerSx + 108, 76, B_AMBER + 26);
    }

    const wheelSx = 1540 - camX;
    if (wheelSx > -60 && wheelSx < FB_WIDTH + 60) {
      this.drawCircleOutline(wheelSx, 184, 28, B_WOOD + 20, 16);
      this.drawCircleOutline(wheelSx, 184, 20, B_WOOD + 16, 16);
      for (let sp = 0; sp < 4; sp++) {
        const a = (((tick * 1200) + sp * 102944) % Q16_TAU);
        const dx = (28 * q16Cos(a)) >> 16, dy = (28 * q16Sin(a)) >> 16;
        this.drawLine(wheelSx - dx, 184 - dy, wheelSx + dx, 184 + dy, B_WOOD + 22);
      }
    }

    // 8. Verlet Cloth Ribbons & Pentatonic Bronze Chimes
    for (const rib of state.canopy.ribbons) {
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
      if (sx < -20 || sx > FB_WIDTH + 20) continue;
      const sway = ((q16Sin(((tick + ch.id * 11) * 2600) % Q16_TAU) * 3) >> 16);
      const col = state.canopy.solved ? (B_PINE + 28) : (B_AMBER + 28);
      this.drawLine(sx, 86, sx + sway, 134, B_IVORY + 24);
      this.fillRect(sx + sway - 3, 134, sx + sway + 3, 148, col);
    }

    // 9. Faction Guild Stalls, Amber Shards, Foes & Manor Gate
    for (const fac of Object.values(FACTIONS)) {
      const sx = fac.x - camX;
      if (sx < -30 || sx > FB_WIDTH + 30) continue;
      this.fillRect(sx - 14, 182, sx + 14, 217, B_WOOD + 15);
      this.fillTri({ x: sx, y: 164 }, { x: sx - 18, y: 182 }, { x: sx + 18, y: 182 }, B_CRIMSON + 22);
      this.fillRect(sx - 4, 174, sx + 4, 180, B_AMBER + 30);
    }

    for (const node of state.nodes) {
      if (node.collected) continue;
      const sx = node.x - camX;
      if (sx < -20 || sx > FB_WIDTH + 20) continue;
      const bob = ((q16Sin((tick * 3400) % Q16_TAU) * 2) >> 16);
      this.fillCircle(sx, 205 + bob, 4, B_AMBER + 30);
      this.drawCircleOutline(sx, 205 + bob, 6, B_AMBER + 20, 10);
    }

    for (const foe of state.foes) {
      if (!foe.alive) continue;
      const sx = (foe.x - camX) | 0;
      if (sx < -30 || sx > FB_WIDTH + 30) continue;
      this.fillTri({ x: sx, y: 164 }, { x: sx - 14, y: 217 }, { x: sx + 14, y: 217 }, B_ASTRAL + 16);
      this.fillCircle(sx, 158, 6, B_CRIMSON + 26);
    }

    const gateSx = 1820 - camX;
    if (gateSx >= -40 && gateSx <= FB_WIDTH + 40) {
      const col = state.canopy.solved ? (B_PINE + 26) : (B_CRIMSON + 24);
      this.fillRect(gateSx - 20, 126, gateSx - 14, 217, B_IVORY + 18);
      this.fillRect(gateSx + 14, 126, gateSx + 20, 217, B_IVORY + 18);
      this.drawRectOutline(gateSx - 14, 134, gateSx + 14, 217, col);
    }

    // 10. Evelyn Roivas in Crimson Raincoat & Golden Oil Lantern (or Danmaku Overlay)
    if (state.arena.active) {
      this.renderBulletHellOverlay(state.arena, tick);
    } else {
      this.drawInvestigator(pxScreen, pyScreen, state.facing, state.moving, tick);
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

    const r = 20;
    const rot = (tick * 2200) % Q16_TAU;
    for (let i = 0; i < 4; i++) {
      const a = rot + i * 102944;
      const rx = 240 + ((r * q16Cos(a)) >> 16);
      const ry = 88 + ((8 * q16Sin(a)) >> 16);
      this.drawLine(240, 68, rx, ry, B_ASTRAL + 30);
      this.drawLine(240, 108, rx, ry, B_ASTRAL + 24);
    }

    for (const b of arena.bullets) {
      this.fillCircle(b.x | 0, b.y | 0, 3, B_CRIMSON + 28);
    }

    this.fillCircle(arena.soulX | 0, arena.soulY | 0, 4, B_AMBER + 31);
    this.drawCircleOutline(arena.soulX | 0, arena.soulY | 0, 20, arena.slowMo ? (B_AMBER + 28) : (B_SEA + 24), 16);
  }

  drawInvestigator(cx, topY, facing, moving, tick) {
    const stride = moving ? (((q16Sin((tick * 11000) % Q16_TAU) * 4) >> 16) * facing) : 0;
    // Crimson pointed hood & raincoat
    this.fillTri({ x: cx, y: topY }, { x: cx - 8, y: topY + 12 }, { x: cx + 8, y: topY + 12 }, B_CRIMSON + 24);
    this.fillTri({ x: cx, y: topY + 8 }, { x: cx - 10, y: topY + 25 }, { x: cx + 10, y: topY + 25 }, B_CRIMSON + 22);
    this.drawLine(cx - 3, topY + 25, cx - 3 - stride, topY + 32, B_IVORY + 26);
    this.drawLine(cx + 3, topY + 25, cx + 3 + stride, topY + 32, B_IVORY + 26);
    // Glowing golden oil lantern
    const handX = cx + facing * 11;
    const handY = topY + 16;
    this.drawLine(cx + facing * 4, topY + 14, handX, handY, B_IVORY + 24);
    this.fillCircle(handX, handY + 2, 3, B_AMBER + 31);
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

import { Q16_ONE, Q16_TAU, q16Sin, q16Cos, q16Clamp } from '../core/q16.js';

/** Q16.16 Radial Fluid Fog & Ley-Line Constellation Particles */
export class RadialFluidFog {
  constructor() {
    this.cols = 32;
    this.rows = 12;
    this.density = new Int32Array(this.cols * this.rows);
    for (let i = 0; i < this.density.length; i++) this.density[i] = 28000 + ((i * 3917) & 16383);
  }

  step(lanternX, lanternY, cameraX, tick) {
    const localLanternX = lanternX - cameraX;
    for (let r = 0; r < this.rows; r++) {
      const py = 50 + r * 16;
      for (let c = 0; c < this.cols; c++) {
        const px = c * 16;
        const idx = r * this.cols + c;
        const dist = Math.hypot(px - localLanternX, py - lanternY);
        // Radial repulsion: lantern heat parts the coastal fog
        const target = dist < 85 ? 4000 : 34000 + ((q16Sin(((tick + c * 9) * 2400) % Q16_TAU) * 10000) >> 16);
        this.density[idx] += (target - this.density[idx]) >> 3;
      }
    }
  }

  sampleFog(screenX, screenY) {
    const c = q16Clamp(screenX >> 4, 0, this.cols - 1);
    const r = q16Clamp((screenY - 40) >> 4, 0, this.rows - 1);
    return this.density[r * this.cols + c] >> 13; // 0..6 shade boost
  }
}

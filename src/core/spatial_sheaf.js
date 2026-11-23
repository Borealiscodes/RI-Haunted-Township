import { Q16_ONE, q16Clamp } from './q16.js';

export const ALIGN = { CHATTURGHA: 0, ULYAOTH: 1, XELLOTATH: 2, MANTOROK: 3 };

/**
 * O(1) Q16.16 Spatial Hash & Compactly Supported k-Hop Local Cellular Sheaf
 * Divides the 1920px open-world coastal township into 120px spatial cells.
 */
export class TownshipSpatialSheaf {
  constructor(worldWidth = 1920, cellSize = 120) {
    this.worldWidth = worldWidth;
    this.cellSize = cellSize;
    this.cellCount = Math.ceil(worldWidth / cellSize);
    this.buckets = Array.from({ length: this.cellCount }, () => []);
    // Each cell holds a 4-channel alignment stalk [Chattur'gha, Ulyaoth, Xel'lotath, Mantorok]
    this.stalks = Array.from({ length: this.cellCount }, () => new Int32Array(4));
    this.localTensionQ16 = 0;
  }

  cellIndex(worldX) {
    return q16Clamp((worldX / this.cellSize) | 0, 0, this.cellCount - 1);
  }

  insertEntity(entity) {
    const idx = this.cellIndex(entity.x);
    this.buckets.at(idx).push(entity);
  }

  queryRange(centerX, radius = 260) {
    const minC = this.cellIndex(centerX - radius);
    const maxC = this.cellIndex(centerX + radius);
    const results = [];
    for (let c = minC; c <= maxC; c++) {
      for (const item of this.buckets.at(c)) {
        if (Math.abs(item.x - centerX) <= radius) results.push(item);
      }
    }
    return results;
  }

  injectAlignment(worldX, align, amountQ16) {
    const idx = this.cellIndex(worldX);
    const s = this.stalks.at(idx);
    s[align] = q16Clamp(s[align] + amountQ16, 0, Q16_ONE * 2);
  }

  /** Compute compactly supported k-hop (k=2) coboundary frustration around player */
  stepLocalNeighborhood(playerX) {
    const center = this.cellIndex(playerX);
    const lo = Math.max(0, center - 2);
    const hi = Math.min(this.cellCount - 2, center + 1);
    let tension = 0;

    for (let c = lo; c <= hi; c++) {
      const a = this.stalks.at(c);
      const b = this.stalks.at(c + 1);
      // Cross-alignment conflict damped by Mantorok [3]
      const conflict = Math.abs(a.at(0) - b.at(2)) + Math.abs(a.at(2) - b.at(1)) + Math.abs(a.at(1) - b.at(0));
      const damping = q16Clamp(Q16_ONE - ((a.at(3) + b.at(3)) >> 2), 16384, Q16_ONE);
      tension += ((conflict >> 16) * damping) >> 2;
    }

    this.localTensionQ16 = q16Clamp(tension, 0, Q16_ONE);
    return this.localTensionQ16;
  }
}

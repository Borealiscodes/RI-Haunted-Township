import { Q16_ONE, q16Sin, Q16_TAU } from '../core/q16.js';

// 5 Color-Coded Journey-style Harmonic Chimes (D Hirajoshi pentatonic)
export const PENTATONIC_CHIMES = Array.of(
  { id: 0, num: 1, name: 'Azure',    note: 'D4',  hz: 293.66, x: 1020, bank: 32 }, // Atlantic Teal/Azure
  { id: 1, num: 2, name: 'Crimson',  note: 'Eb4', hz: 311.13, x: 1065, bank: 192 }, // Crimson
  { id: 2, num: 3, name: 'Emerald',  note: 'G4',  hz: 392.00, x: 1110, bank: 128 }, // Evergreen/Emerald
  { id: 3, num: 4, name: 'Gold',     note: 'A4',  hz: 440.00, x: 1155, bank: 160 }, // Lantern Gold
  { id: 4, num: 5, name: 'Amethyst', note: 'Bb4', hz: 466.16, x: 1200, bank: 224 }  // Astral Amethyst
);

export class VerletRibbon {
  constructor(anchorX, anchorY, segments = 6, segLen = 9) {
    this.anchorX = anchorX;
    this.anchorY = anchorY;
    this.segLen = segLen;
    this.pts = Array.from({ length: segments }, (_, i) => ({
      x: anchorX, y: anchorY + i * segLen,
      ox: anchorX, oy: anchorY + i * segLen
    }));
  }

  step(windForce, playerX, playerY) {
    this.pts.at(0).x = this.anchorX;
    this.pts.at(0).y = this.anchorY;

    for (let i = 1; i < this.pts.length; i++) {
      const p = this.pts.at(i);
      const vx = ((p.x - p.ox) * 0.92) + windForce;
      const vy = ((p.y - p.oy) * 0.92) + 0.35;
      p.ox = p.x;
      p.oy = p.y;
      p.x += vx;
      p.y += vy;

      if (Math.hypot(p.x - playerX, p.y - playerY) < 22) {
        p.x += (p.x >= playerX ? 2.2 : -2.2);
      }
    }

    for (let iter = 0; iter < 2; iter++) {
      for (let i = 1; i < this.pts.length; i++) {
        const a = this.pts.at(i - 1);
        const b = this.pts.at(i);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.max(0.01, Math.hypot(dx, dy));
        const diff = (this.segLen - d) / d;
        if (i > 1) {
          a.x -= dx * diff * 0.5;
          a.y -= dy * diff * 0.5;
        }
        b.x += dx * diff * 0.5;
        b.y += dy * diff * 0.5;
      }
    }
  }
}

export class CanopyChimePuzzle {
  constructor() {
    // Sequence: #2 Crimson (Eb4) -> #4 Gold (A4) -> #1 Azure (D4)
    this.targetCode = Array.of(1, 3, 0);
    this.entered = [];
    this.solved = false;
    this.ripples = []; // Expanding Journey-style visual halo rings
    this.ribbons = Array.of(
      new VerletRibbon(220, 42, 6, 8),
      new VerletRibbon(640, 38, 7, 9),
      new VerletRibbon(1040, 34, 7, 9),
      new VerletRibbon(1180, 34, 7, 9),
      new VerletRibbon(1560, 40, 6, 8)
    );
  }

  step(tick, playerX, playerY) {
    const wind = ((q16Sin((tick * 1900) % Q16_TAU) * 1.1) / Q16_ONE) + 0.35;
    for (const r of this.ribbons) r.step(wind, playerX, playerY);

    for (const rip of this.ripples) {
      rip.r += 1.6;
      rip.life--;
    }
    this.ripples = this.ripples.filter((rip) => rip.life > 0);
  }

  ringNearestChime(playerX) {
    let best = null;
    let bestDist = 36;
    for (const ch of PENTATONIC_CHIMES) {
      const d = Math.abs(playerX - ch.x);
      if (d < bestDist) { bestDist = d; best = ch; }
    }
    if (!best) return null;

    // Emit expanding colored halo ripple
    this.ripples.push({ x: best.x, y: 140, r: 6, bank: best.bank, life: 28 });

    if (!this.solved) {
      // Track sequential progress cleanly: reset if wrong note pressed
      const expected = this.targetCode.at(this.entered.length);
      if (best.id === expected) {
        this.entered.push(best.id);
        if (this.entered.length === this.targetCode.length) this.solved = true;
      } else {
        this.entered = best.id === this.targetCode.at(0) ? Array.of(best.id) : [];
      }
    }
    return { chime: best, solved: this.solved, step: this.entered.length };
  }
}

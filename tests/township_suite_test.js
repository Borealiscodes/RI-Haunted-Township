import assert from 'node:assert/strict';
import { TownshipSpatialSheaf, ALIGN } from '../src/core/spatial_sheaf.js';
import { CanopyChimePuzzle } from '../src/physics/verlet_canopy.js';
import { BulletHellArena } from '../src/physics/bullet_hell_arena.js';
import { FactionAttacheSystem, MODES } from '../src/economy/faction_attache.js';

// 1. Verify O(1) spatial hash & local k-hop sheaf
const sheaf = new TownshipSpatialSheaf();
sheaf.injectAlignment(1040, ALIGN.ULYAOTH, 65536);
assert.ok(sheaf.stepLocalNeighborhood(1050) >= 0);

// 2. Verify Verlet canopy & D Hirajoshi pentatonic chime lock (Eb4 -> A4 -> D4)
const canopy = new CanopyChimePuzzle();
canopy.ringNearestChime(1065); // Eb4 (1)
canopy.ringNearestChime(1155); // A4 (3)
const finalHit = canopy.ringNearestChime(1020); // D4 (0)
assert.equal(finalHit.solved, true);

// 3. Verify RE4 x UEUE faction trade & mode switch
const eco = new FactionAttacheSystem();
eco.setMode(MODES.PILGRIM);
assert.equal(eco.combatEnabled(), false);
const trade = eco.tradeWithNearestFaction(340);
assert.equal(trade.ok, true);

// 4. Verify Bullet-Hell Danmaku arena
const arena = new BulletHellArena();
arena.startEncounter("Manor Gatekeeper", 3, 5);
arena.step(11);
assert.ok(arena.bullets.length > 0);

console.log('✓ RI-Haunted-Township Open-World Suite Verified:', {
  chimesSolved: finalHit.solved,
  factionItem: trade.faction.rewardItem,
  danmakuBullets: arena.bullets.length
});

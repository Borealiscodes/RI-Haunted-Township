export const MODES = {
  PILGRIM: 'PILGRIM',     // Non-lethal exploration, chime puzzles & faction gathering
  PURGER: 'PURGER',       // High-intensity combat & Danmaku encounters
  RECKONING: 'RECKONING'  // Full RE4 hybrid (gathering + economy + bullet-hell)
};

export const FACTIONS = {
  BELL_KEEPERS: {
    id: 'BELL_KEEPERS',
    name: 'The Bell-Keepers (Harbor)',
    x: 340,
    offerName: 'Tuning Fork (+Lantern Radius)',
    costShards: 1,
    rewardItem: 'TUNING_FORK',
    lore: 'Bell-Keeper Elder: "The wind over the canopy whispers Eb4 — A4 — D4. Ring the tower chimes in that order to unseal the Manor Gate."'
  },
  FLESH_HARVESTERS: {
    id: 'FLESH_HARVESTERS',
    name: 'Flesh-Harvesters (Town Square)',
    x: 760,
    offerName: 'Crimson Vitality Tincture (+Sanity)',
    costShards: 1,
    rewardItem: 'VITALITY_TINCTURE',
    lore: 'Harvester Broker: "Bring us Amber Resin from the coast, and we will distill a tincture to keep the fog from rotting your mind."'
  },
  ARCHIVE_REMNANT: {
    id: 'ARCHIVE_REMNANT',
    name: 'Archive Remnant (Old Mill)',
    x: 1460,
    offerName: 'Bronze Gladius (Danmaku Parry Blade)',
    costShards: 2,
    rewardItem: 'BRONZE_GLADIUS',
    lore: 'Archivist: "With the Bronze Gladius, you can parry eldritch projectiles inside the Manor Gate sanctuary."'
  }
};

export class FactionAttacheSystem {
  constructor() {
    this.mode = MODES.RECKONING;
    this.amberShards = 1;
    this.sovereigns = 150;
    this.items = new Set();
    this.reputation = { BELL_KEEPERS: 0, FLESH_HARVESTERS: 0, ARCHIVE_REMNANT: 0 };
  }

  setMode(newMode) {
    if (MODES[newMode]) this.mode = newMode;
  }

  combatEnabled() {
    return this.mode === MODES.PURGER || this.mode === MODES.RECKONING;
  }

  tradeWithNearestFaction(playerX) {
    for (const fac of Object.values(FACTIONS)) {
      if (Math.abs(playerX - fac.x) < 48) {
        if (this.items.has(fac.rewardItem)) {
          return { ok: true, faction: fac, msg: fac.lore + ' (Already acquired ' + fac.offerName + ')' };
        }
        if (this.amberShards >= fac.costShards) {
          this.amberShards -= fac.costShards;
          this.items.add(fac.rewardItem);
          this.reputation[fac.id] += 10;
          return {
            ok: true,
            faction: fac,
            msg: 'TRADED with ' + fac.name + ': Acquired ' + fac.offerName + '! ' + fac.lore
          };
        }
        return {
          ok: false,
          faction: fac,
          msg: fac.name + ' demands ' + fac.costShards + ' Amber Shard(s) for ' + fac.offerName + '. ' + fac.lore
        };
      }
    }
    return null;
  }
}

export const PLAY_MODES = {
  RECKONING: 'RECKONING', // Hybrid exploration + combat + dialogue
  PILGRIM:   'PILGRIM',   // Non-lethal peaceful pilgrimage
  PURGER:    'PURGER'     // Combat-focused reckoning
};

export const FACTIONS = {
  BELL_KEEPERS: {
    id: 'BELL_KEEPERS',
    npcName: 'Brother Caleb',
    title: 'Bell-Keepers Envoy',
    x: 340,
    y: 186,
    cost: 1,
    item: 'TUNING_FORK',
    label: 'Brass Tuning Fork',
    bank: 32, // Atlantic Azure robe
    dialogue: 'Brother Caleb: "Blackwater fog blinds the faithless. Offer 1 Soul Wisp for my Brass Tuning Fork—or draw steel to take it."',
    tradeMsg: 'Brother Caleb bows: "May its resonance guide you through the belfry mist." (+Brass Tuning Fork)',
    seizeMsg: 'You struck down Brother Caleb and seized the Brass Tuning Fork from his robes! (-15% Sanity)'
  },
  FLESH_HARVESTERS: {
    id: 'FLESH_HARVESTERS',
    npcName: 'Sister Mara',
    title: 'Flesh-Harvester Apothecary',
    x: 760,
    y: 186,
    cost: 1,
    item: 'VITALITY_TINCTURE',
    label: 'Vitality Tincture',
    bank: 192, // Crimson apothecary cloak
    dialogue: 'Sister Mara: "Your sanity thins in this harbor. Trade 1 Soul Wisp for Crimson Tincture, or test your blade against mine."',
    tradeMsg: 'Sister Mara hands over a corked vial: "Drink deep before the belfry tolls." (+Vitality Tincture, Sanity Restored)',
    seizeMsg: 'You defeated Sister Mara and claimed the Vitality Tincture from her satchel! (-15% Sanity)'
  },
  ARCHIVE_REMNANT: {
    id: 'ARCHIVE_REMNANT',
    npcName: 'Archivist Vane',
    title: 'Archive Remnant Scholar',
    x: 1460,
    y: 186,
    cost: 2,
    item: 'BRONZE_GLADIUS',
    label: 'Bronze Gladius',
    bank: 224, // Amethyst scholar vestment
    dialogue: 'Archivist Vane: "Steel shatters against the Manor Gatekeeper. Pay 2 Soul Wisps for the Bronze Gladius—or duel me in Danmaku!"',
    tradeMsg: 'Archivist Vane unrolls a oiled cloth: "Wield this ancient bronze with precision." (+Bronze Gladius)',
    seizeMsg: 'Archivist Vane yields after the astral duel: "Take the Bronze Gladius—you have earned it."'
  }
};

export class FactionAttacheSystem {
  constructor() {
    this.mode = PLAY_MODES.RECKONING;
    this.souls = 1; // Start with 1 Soul Wisp from the harbor crossing
    this.gridCols = 6;
    this.gridRows = 4;
    this.items = new Set();
    this.reputation = { BELL_KEEPERS: 0, FLESH_HARVESTERS: 0, ARCHIVE_REMNANT: 0 };
    this.npcStatus = {
      BELL_KEEPERS: 'PEACEFUL',     // PEACEFUL | TRADED | DEFEATED
      FLESH_HARVESTERS: 'PEACEFUL',
      ARCHIVE_REMNANT: 'PEACEFUL'
    };
  }

  setMode(mode) {
    if (PLAY_MODES[mode]) this.mode = mode;
  }

  combatEnabled() {
    return this.mode !== PLAY_MODES.PILGRIM;
  }

  getNearestNPC(playerX, maxDist = 58) {
    for (const fac of Object.values(FACTIONS)) {
      if (Math.abs(playerX - fac.x) <= maxDist) return fac;
    }
    return null;
  }

  tradeWithNearestFaction(playerX) {
    const fac = this.getNearestNPC(playerX, 58);
    if (!fac) return null;
    if (this.npcStatus[fac.id] === 'DEFEATED') {
      return { ok: false, msg: fac.npcName + ' lies defeated—you already took the ' + fac.label + '.' };
    }
    if (this.items.has(fac.item)) {
      return { ok: false, msg: fac.npcName + ': "You already carry the ' + fac.label + ', traveler."' };
    }
    if (this.souls < fac.cost) {
      return { ok: false, msg: fac.npcName + ' requires ' + fac.cost + ' Soul Wisp(s) (you hold ' + this.souls + '). Gather wisps or banish Watchers!' };
    }
    this.souls -= fac.cost;
    this.items.add(fac.item);
    this.reputation[fac.id] += 2;
    this.npcStatus[fac.id] = 'TRADED';
    return { ok: true, faction: fac, item: fac.item, msg: fac.tradeMsg };
  }

  /** Combat bypass: seize a trader's relic by force or duel */
  bypassTraderByCombat(facId) {
    const fac = FACTIONS[facId];
    if (!fac || this.items.has(fac.item)) return null;
    this.items.add(fac.item);
    this.reputation[fac.id] -= 3;
    this.npcStatus[fac.id] = 'DEFEATED';
    return { faction: fac, item: fac.item, msg: fac.seizeMsg };
  }
}

export const MODES = PLAY_MODES;

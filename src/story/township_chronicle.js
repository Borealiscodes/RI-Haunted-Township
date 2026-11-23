export const OPENING_PROLOGUE =
  'PROLOGUE — BLACKWATER COVE, RHODE ISLAND (OCT 15, 2026): Three weeks ago, the harbor ferry ceased docking after the Bell-Tower began tolling at irregular hours. Stepping onto the salt-rotted pier, Evelyn Roivas carries her great-aunt\'s sealed key-box—and one warning: appease the three coastal guilds and unseal the Bell-Tower chime lock before midnight.';

export const DISTRICT_LORE = {
  HARBOR: 'DISTRICT I — FOGGY HARBOR: Barnacle-crusted pilings groan beneath swirling impasto clouds. The Bell-Keepers watch the tide from the customs shack.',
  SQUARE: 'DISTRICT II — COBBLED TOWN SQUARE: Wrought-iron gaslamps flicker through amber sea-mist. Flesh-Harvester smugglers trade vitality tinctures beside the dry fountain.',
  CANOPY: 'DISTRICT III — BELL-TOWER CANOPY: Tattered violet banners whip in the gale above five suspended bronze chimes. The wind repeats three notes: Eb4, A4, D4.',
  MILL:   'DISTRICT IV — OLD MILL & MANOR GATES: A creaking timber waterwheel churns black river water beside the Archive Remnant\'s outpost and the sealed iron gates of Roivas Manor.'
};

export class TownshipChronicle {
  constructor() {
    this.entries = Array.of(OPENING_PROLOGUE);
    this.visitedDistricts = new Set(Array.of('HARBOR'));
  }

  recordDistrict(zoneKey) {
    if (!this.visitedDistricts.has(zoneKey) && DISTRICT_LORE[zoneKey]) {
      this.visitedDistricts.add(zoneKey);
      this.entries.push(DISTRICT_LORE[zoneKey]);
      return DISTRICT_LORE[zoneKey];
    }
    return null;
  }

  addEvent(text) {
    if (text && this.entries.at(-1) !== text) {
      this.entries.push(text);
    }
  }
}

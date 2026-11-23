# `RI-Haunted-Township` `v2.0` Architectural Roadmap

**Target Milestone:** `v2.0.0` (*Living Township & Unified Stage Combat*)  
**Baseline:** `v1.7.0` (`7a00c5d`)

---

## Pillar 1: Living NPCs & Faction Memory (`src/economy/` & `src/core/spatial_sheaf.js`)
1. **Utility-AI Daily Schedules (`Q16.16` World Clock):**
   - Advance a deterministic `Dusk → Fog-Rise → Midnight` cycle where **Brother Caleb** patrols harbor lanterns, **Sister Mara** gathers coastal herbs near the Old Mill, and **Archivist Vane** shelters inside the belfry when Watchers sweep nearby.
2. **Cellular Sheaf Reputation Propagation:**
   - Propagate player actions (trading vs. attacking an envoy) across `TownshipSpatialSheaf` $k$-hop neighborhoods so allied stalls raise prices or summon armored wardens while rival guilds offer black-market discounts.
3. **Clue-Bitmask Branching Dialogue:**
   - Track discovered world clues (`CLUE_LIGHTHOUSE_LOG`, `CLUE_BELFRY_CHIME`, `CLUE_MANOR_DEED`) in a compact 16-bit bitmask so NPC conversations evolve dynamically based on Evelyn's investigation.

## Pillar 2: Articulated 2.5D Visuals & Dynamic Lighting (`src/render/township_renderer.js`)
1. **2-Bone `Q16.16` Articulated Limbs & Verlet Scarves:**
   - Upgrade Evelyn, Watchers, and Faction Envoys from single-segment primitives to 2-bone hierarchical limbs (thigh/shin, upper-arm/forearm) with wind-driven Verlet scarves for expressive walk cycles, jumps, and Gladius lunges.
2. **`CLUT8` Height-Map Normal Perturbation:**
   - Add a lightweight surface relief pass for brick chimneys, clapboard walls, and cobblestones ($\nabla H \cdot \vec{L}_{\text{lantern}}$) so Evelyn's swinging oil lantern casts real-time warm highlights across building facades.
3. **Foreground Parallax Silhouette Plane (`1.35×` Scroll):**
   - Layer iron cemetery gates, harbor pilings, and drifting mist wisps in front of the player plane to deepen the 2.5D diorama perspective.

## Pillar 3: Unified Full-Stage Boss Choreography (`src/physics/bullet_hell_arena.js` & `src/world/township_world.js`)
1. **Eliminate the Boxed Overlay:**
   - Keep the **Manor Gatekeeper** directly inside the `480×272` architectural stage so platforming across belfry ledges, telegraphed `24`-frame crimson melee wind-ups, `4`-frame hit-stop parries, and stage-wide Danmaku bullet curtains share one continuous coordinate space.
2. **Procedural Foley Library (`src/audio/foley_sfx.js`):**
   - Isolate our empirical `v1.4` continuous-glide oscillator discovery (`sine` + `5.2 Hz` LFO + `180 ms` exponential pitch ramp) into a dedicated deep-sea Leviathan / harbor foghorn SFX bus alongside footsteps, blade clashes, and chime resonance.

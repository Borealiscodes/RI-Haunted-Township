# Zero-Asset Software Rendering, Cellular Sheaf Spatial Partitioning, and Multi-Modal Procedural Mechanics in a `480×272` Open-World Test Bed (`RI-Haunted-Township`)

**Author:** Borealiscodes  
**Date:** November 23, 2026  
**Repository:** `https://github.com/Borealiscodes/RI-Haunted-Township`  
**Build Target:** `v1.7.0` (`f973586`) — Mobile-First Termux / Browser ES2023 Test Bed  

## Abstract
We present **`RI-Haunted-Township`**, a zero-dependency, zero-asset `480×272` software-rendered open-world horror-mystery test bed built and verified entirely on mobile hardware (Termux + Node.js v24 + HTML5 Canvas + WebAudio API). The engine synthesizes a 1,920-meter coastal Rhode Island township from deterministic `Q16.16` fixed-point kinematics, an 8-bank `256`-color `CLUT8` palette with `4×4` Bayer ordered dithering, a `120 px` spatial-hash cellular sheaf (`TownshipSpatialSheaf`), Verlet cloth-and-chime physics, hybrid melee-to-Danmaku combat transitions, and a `ConvolverNode`-reverberated pipe-organ synthesizer. We evaluate both the test bed's breakthroughs and its candid limitations—including the boxed final boss encounter and WebAudio synthesis pitfalls—and detail concrete upgrades for NPC depth, 2.5D articulated visuals, and unified boss combat.

## 1. Test Bed Accomplishments (`v1.0`–`v1.7`)
- **8-Bank Multi-Material `CLUT8` Rasterizer:** Partitioned 256 palette entries into 8 material banks (*Sky Indigo*, *Atlantic Teal*, *Cedar Burlap*, *Colonial Ivory*, *Evergreen*, *Lantern Amber*, *Crimson*, *Astral Amethyst*) with horizontal Gouraud-like span shading (`fillShadedRect`) and barycentric volumetric light cones (`fillLightCone`).
- **Spatial-Hash Cellular Sheaf & `Q16.16` Kinematics:** `120 px` spatial buckets (`16` cells) bound entity queries and $k$-hop ($k=2$) alignment tension to $O(1)$ per frame, paired with `6`-frame coyote-time platforming, pushable crates, doorway stealth alcoves, and `14`-frame crescent Gladius slashes.
- **Verlet Canopy & *Journey*-Style Color-Coded Chimes:** Five color-coded bells (`#1 Azure [D4]`, `#2 Crimson [Eb4]`, `#3 Emerald [G4]`, `#4 Gold [A4]`, `#5 Amethyst [Bb4]`) with expanding halo ripples and automatic background-music ducking (`bgmGain: 0.16 → 0.015`).
- **Soul-Wisp Economy & Multi-Path Envoys:** Named NPCs (**Brother Caleb** at `340m`, **Sister Mara** at `760m`, **Archivist Vane** at `1460m`) supporting both Soul-Wisp relic trades and violent combat bypasses (melee seizure or Danmaku spell-card duel).

## 2. Candid Limitations & Empirical Audio/Visual Lessons
- **Boss Fight Isolation:** Rendering the 5-Spell-Card Danmaku arena inside a `268×180 px` modal overlay disconnects bullet dodging from the platforming architecture; unifying boss movement, telegraphed wind-ups, and hit-stop directly inside the `480×272` stage will make encounters far more kinetic.
- **Acoustic Synthesis Lessons:** Unfiltered triangle waves and `3.98:1` FM ratios created Casio-like sidebands, while slow continuous pitch glides (`160–240 ms`) accidentally produced an expressive **humpback whale / leviathan SFX**. Switching to `65 ms` pre-delayed `4.6 s` `ConvolverNode` stone-nave impulse reverb with `±3.5¢` *Voix Céleste* pure sine organ pipes resolved harshness while preserving haunted church acoustics.

## 3. Roadmap for `v2.0` Upgrades
1. **NPC Depth:** Time-of-day utility schedules (`Dusk → Fog-Rise → Midnight`), cellular sheaf reputation propagation (hostility/discounts across guild territories), and clue-bitmask branching dialogue.
2. **Visual Articulation & 2.5D Relief:** 2-bone `Q16.16` articulated limbs with Verlet scarves, height-map normal perturbation ($\nabla H \cdot \vec{L}_{\text{lantern}}$) for dynamic lantern shadows on clapboard walls, and a `1.35×` foreground parallax silhouette layer.
3. **Unified Stage Boss Combat:** Full-screen stage boss choreography with telegraphed melee wind-ups, `4`-frame hit-stop parries, and stage-wide Danmaku curtains.

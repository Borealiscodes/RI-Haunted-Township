# 🌊 RI-Haunted-Township (`Q16.16` Open-World Horror-Mystery Test Bed)

[![License: MIT](https://shields.io)](LICENSE)
[![Zero Dependencies](https://shields.io)]()
[![Framebuffer](https://shields.io)]()

A **zero-dependency, zero-asset `480×272` software-rendered open-world horror-mystery test bed** built and verified entirely in mobile Termux + Node.js + HTML5 Canvas + WebAudio. Set along a `1,920 m` haunted Rhode Island coastline (*Foggy Harbor → Town Square → Bell-Tower Canopy → Old Mill & Roivas Manor Gate*), the engine synthesizes 2.5D shaded architecture, `Q16.16` platforming, Verlet cloth & *Journey*-style harmonic chimes, Soul-Wisp faction diplomacy/combat bypasses, alternating Melee-to-Danmaku boss stages, and a `4.6 s` `ConvolverNode` cathedral pipe-organ score from pure math.

---

## ✨ Core Systems & Features (`v1.7.0`)

- **8-Bank Multi-Material `CLUT8` Software Rasterizer (`src/render/township_renderer.js`):**
  - 256-color indexed framebuffer partitioned into 8 material banks (*Starry Indigo Sky*, *Stormy Atlantic Teal*, *Cedar Burlap*, *Colonial Clapboard Ivory*, *Coastal Evergreen*, *Lantern Amber*, *Crimson Raincoat*, and *Astral Amethyst*) with `4×4` Bayer ordered dithering.
  - Horizontal directional shading (`fillShadedRect`), roof-eave drop shadows, and barycentric volumetric light cones (`fillLightCone`) for the rotating **Blackwater Lighthouse** beacon and patrolling Watcher searchlights.
- **Spatial-Hash Cellular Sheaf & Sub-Pixel `Q16.16` Platforming (`src/core/spatial_sheaf.js`, `src/world/township_world.js`):**
  - `120 px` spatial hash buckets (`16` cells) for $O(1)$ entity queries and $k$-hop ($k=2$) alignment tension propagation.
  - Damped `Q16.16` jump physics (`6`-frame coyote time), pushable cedar crates, recessed doorway stealth alcoves (`[HIDDEN IN DOORWAY]`), and `14`-frame angular crescent Gladius slashes.
- **Verlet Canopy & *Journey*-Style Color-Coded Chimes (`src/physics/verlet_canopy.js`):**
  - Wind-driven Verlet cloth ribbons coupled with five color-coded harmonic bells (`#1 Azure [D4]`, `#2 Crimson [Eb4]`, `#3 Emerald [G4]`, `#4 Gold [A4]`, `#5 Amethyst [Bb4]`), expanding halo ripples, and automatic background-music ducking (`990m–1230m`).
- **Soul-Wisp Economy & Dual-Path Faction Envoys (`src/economy/faction_attache.js`):**
  - Named envoys (**Brother Caleb** at `340m`, **Sister Mara** at `760m`, and **Archivist Vane** at `1460m`) with proximity dialogue, Soul-Wisp relic trades, and violent combat bypass options (melee seizure or Danmaku spell-card duel).
- **Alternating Melee + 5-Spell-Card Danmaku Finale (`src/physics/bullet_hell_arena.js`):**
  - Shattering the **Manor Gatekeeper's** armor (`1730m`) in melee transitions into a 5-Spell-Card *Walpurgisnacht* Danmaku arena with Lissajous boss motion, curving sine-wave curtains, collapsing astral rings, `⏳ Bullet-Time` (`0.42×`), direct touch-drag soul steering, and `⚔️ Gladius Parry`.
- **Haunted Stone-Nave WebAudio Synthesizer & `en-GB` Narration (`src/audio/pentatonic_chime_synth.js`):**
  - 256-step (32-bar) D Natural Minor cathedral pipe-organ suite featuring `±3.5¢` *Voix Céleste* wind-pipe shimmer, distant church bell tolls, whisper-subtle wire-brush percussion, a `65 ms` pre-delayed `4.6 s` `ConvolverNode` stone-nave reverb, and `speechSynthesis` (`en-GB`) chronicle narration.

---

## 🚀 Quick Start (Zero Build Step)

```bash
git clone https://github.com
cd RI-Haunted-Township
npm test
python3 -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0` in any desktop or mobile browser.

---

## 📚 Research Preprints & Dev Notes

- [`docs/PREPRINT_RI_HAUNTED_TOWNSHIP.md`](docs/PREPRINT_RI_HAUNTED_TOWNSHIP.md) — Self-aware architectural preprint evaluating `v1.7.0` accomplishments, empirical limitations, and the `v2.0` roadmap (NPC utility schedules, 2-bone `Q16.16` kinematics, and unified stage boss combat).
- [`docs/DEV_NOTE_AUDIO_AND_VISUAL_MATH.md`](docs/DEV_NOTE_AUDIO_AND_VISUAL_MATH.md) — Field notes on WebAudio synthesis pitfalls (including the accidental "dying whale" leviathan SFX) and volumetric `CLUT8` rendering math.

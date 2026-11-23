# Zero-Asset Software Rendering, Cellular Sheaf Spatial Partitioning, and Multi-Modal Procedural Mechanics in a `480×272` Open-World Test Bed (`RI-Haunted-Township`)

**Author:** Borealiscodes  
**Date:** November 23, 2026  
**Repository:** `https://github.com/Borealiscodes/RI-Haunted-Township`  
**Build Target:** `v1.7.0` (`f973586`) — Mobile-First Termux / Browser ES2023 Test Bed  

---

## Abstract

We present **`RI-Haunted-Township`**, a zero-dependency, zero-asset `480×272` software-rendered open-world horror-mystery test bed built and verified entirely on mobile hardware (Termux + Node.js v24 + HTML5 Canvas + WebAudio API). Rather than relying on external sprite sheets, GPU shaders, or pre-recorded audio files, the engine synthesizes a 1,920-meter coastal Rhode Island township from deterministic `Q16.16` fixed-point kinematics, an 8-bank `256`-color `CLUT8` palette with `4×4` Bayer ordered dithering, a $120\text{ px}$ spatial-hash cellular sheaf (`TownshipSpatialSheaf`), Verlet cloth-and-chime physics, hybrid melee-to-Danmaku combat transitions, and a `ConvolverNode`-reverberated pipe-organ synthesizer. In the spirit of transparent engineering, we evaluate both the test bed's breakthroughs and its candid limitations—most notably the mechanical stiffness of the final 5-Spell-Card Bullet-Hell encounter and the psychoacoustic pitfalls encountered while synthesizing organ and marimba timbres—and outline concrete mathematical and architectural upgrades for future iterations (`v2.0`).

---

## 1. System Architecture & Accomplishments as an Experimental Test Bed

`RI-Haunted-Township` was engineered as a compact laboratory to test how many interacting gameplay and simulation systems can coexist inside a deterministic fixed-point framebuffer (`130,560` pixels/frame) with zero external assets:

1. **8-Bank Multi-Material `CLUT8` Software Rasterizer (`src/render/township_renderer.js`):**
   * Partitioned a 256-entry `Uint32Array` color lookup table into **8 distinct 32-shade material banks** (*Starry Indigo Sky*, *Stormy Atlantic Teal*, *Cedar Burlap*, *Colonial Clapboard Ivory*, *Coastal Evergreen*, *Lantern Amber*, *Crimson Raincoat*, and *Astral Amethyst*).
   * Achieved 2.5D diorama relief via horizontal Gouraud-like span interpolation (`fillShadedRect`), roof-eave drop shadows, and barycentric volumetric light frustums (`fillLightCone`) for the rotating **Blackwater Lighthouse** beacon and patrolling Watcher searchlights.
2. **Spatial-Hash Cellular Sheaf & Sub-Pixel Platforming (`src/core/spatial_sheaf.js`, `src/world/township_world.js`):**
   * Divided the `1,920 px` coastline into `120 px` spatial buckets (`16` cells) to bound entity queries and $k$-hop ($k=2$) alignment-tension propagation to $O(1)$ per frame.
   * Combined damped `Q16.16` jump kinematics (`6`-frame coyote time), pushable cedar cargo crates, dark recessed doorway stealth alcoves (`[HIDDEN IN DOORWAY]`), and a `14`-frame angular crescent Gladius slash.
3. **Verlet Cloth & Color-Coded *Journey*-Style Harmonic Puzzle (`src/physics/verlet_canopy.js`):**
   * Coupled wind-driven Verlet cloth ribbons with five color-coded pentatonic bells (`#1 Azure [D4]`, `#2 Crimson [Eb4]`, `#3 Emerald [G4]`, `#4 Gold [A4]`, `#5 Amethyst [Bb4]`), expanding halo ripples, and automatic background-music ducking (`bgmGain: 0.16 → 0.015`) when entering the belfry zone (`990m–1230m`).
4. **Dual-Path Faction Economy & Alternating Combat (`src/economy/faction_attache.js`, `src/physics/bullet_hell_arena.js`):**
   * Implemented a Soul-Wisp economy with three named faction envoys (**Brother Caleb** at `340m`, **Sister Mara** at `760m`, and **Archivist Vane** at `1460m`) offering both peaceful relic trades and violent combat bypasses (melee seizure or a Danmaku spell-card duel), culminating in an alternating Melee-to-5-Spell-Card boss encounter at the Manor Gate (`1730m`).

---

## 2. Candid Self-Critique: What Worked vs. What Needs Work

Evaluating `v1.7.0` objectively reveals clear strengths alongside specific mechanical and sensory bottlenecks:

| Subsystem | What Succeeded | Candid Limitation / Failure Mode |
| :--- | :--- | :--- |
| **Visual Diorama (`CLUT8`)** | 8-bank material separation, volumetric lighthouse cones, and shaded gambrel houses read clearly at `480×272`. | Characters and NPCs rely on simple geometric primitives (`fillTri` / `fillCircle`), lacking articulated skeletal or multi-frame pixel-art silhouettes. |
| **Audio Synthesis (`WebAudio`)** | `4.6s` pre-delayed `ConvolverNode` stone-nave reverb, `±3.5¢` *Voix Céleste* pipe-organ shimmer, and *Journey* chime ducking create genuine atmosphere. | Early FM marimba (`3.98:1`) and continuous pitch-gliding Theremin experiments produced harsh Casio-like sidebands and an accidental "dying whale" leviathan call. |
| **NPCs & Trading** | Named envoys with proximity dialogue, Soul-Wisp costs, and combat bypasses prove multi-path progression works. | NPCs stand stationary beside stalls without daily schedules, branching dialogue trees, memory of player crimes, or inter-faction retaliation. |
| **Final Boss Encounter** | Coherent phase shift from overworld melee armor-break into a 5-Spell-Card Danmaku arena with `⏳ Bullet-Time` and touch-drag control. | The overlay box (`268×180 px`) separates bullet dodging from the platforming stage; melee combat lacks combo windows, telegraphed boss wind-ups, and hit-stop feedback. |

---

## 3. Mathematical & Computational Tricks Discovered During Experimentation

Our iterative builds (`v1.0` → `v1.7`) uncovered several reusable algorithmic and DSP techniques for constrained browser engines:

### 3.1 Volumetric Light Frustums via Barycentric Bayer Attenuation
To render translucent lighthouse beams and Watcher gaze cones inside an indexed 8-bit framebuffer without alpha-blending hardware, we compute barycentric coordinates $(w_0, w_1, w_2)$ across the light triangle and map normalized radial distance $\rho = |x - x_{\text{apex}}| / \Delta x$ through a `4×4` Bayer ordered-dithering matrix $B(x,y)$:
$$I(x, y) = \text{bank}_{\text{light}} + \text{clamp}\!\left(\left\lfloor I_0 (1 - 0.72\rho) \right\rfloor + \frac{B(x \bmod 4, y \bmod 4)}{4},\; 4,\; 29\right)$$
Modulating the apex angle by $\sin(\omega t)$ and $\cos(\omega t)$ produces convincing 3D lighthouse beam foreshortening at zero floating-point texture cost.

### 3.2 Pre-Delayed `ConvolverNode` Impulse Synthesis & *Voix Céleste* Beating
Replacing metallic `DelayNode` feedback loops with a procedurally generated stereo impulse response $h_c[n]$ eliminated comb-filtering harshness:
$$h_c[n] = \sum_{k \in \{38, 74, 118, 175\}\text{ms}} (-1)^c \, 0.55\,\delta[n - n_{k,c}] + u(n - n_{\text{pre}}) \, \eta[n]\left(1 - \frac{n - n_{\text{pre}}}{N - n_{\text{pre}}}\right)^{2.1}$$
where $n_{\text{pre}} = 0.065 f_s$ preserves dry pipe-organ transient clarity before the stone nave blooms. Pairing two pure sine ranks at $\pm 3.5\text{ cents}$ ($f_{\pm} = f_0 \cdot 2^{\pm 3.5/1200}$) generates a slow acoustic beat frequency $\Delta f \approx 0.00404 f_0$ ($\approx 1.78\text{ Hz}$ at $A_4$), emulating the draft-driven *Voix Céleste* rank of a 19th-century New England church organ.

### 3.3 Accidental Bio-Acoustic SFX Synthesis ("Dying Whale" Discovery)
During `v1.4`, driving a continuous oscillator with slow exponential pitch ramps (`exponentialRampToValueAtTime` over `160–240 ms`) and a `5.2 Hz` vibrato LFO inside a feedback delay unintentionally synthesized an expressive **humpback whale / abyssal leviathan call**. Documenting and isolating such accidental attractors turns failed musical experiments into a dedicated procedural Foley library.

---

## 4. Roadmap for `v2.0`: Upgrading NPCs, Visual Style & Boss Combat

### 4.1 Giving NPCs Genuine Behavioral Depth
1. **Utility-AI Daily Schedules & Patrol Graphs:** Replace static coordinates with a `Q16.16` time-of-day clock (`Dusk → Fog-Rise → Midnight`) where **Brother Caleb** lights coastal lanterns, **Sister Mara** harvests herbs near the Old Mill, and **Archivist Vane** retreats into the belfry when Watchers patrol nearby.
2. **Faction Reputation Propagation via the Cellular Sheaf:** Propagate player actions (e.g., striking down Brother Caleb) across `TownshipSpatialSheaf` edges so neighboring Bell-Keepers raise prices, lock doors, or dispatch armored inquisitors, while rival Flesh-Harvesters offer discounts.
3. **Multi-Turn Branching Dialogue & Rumor Graph:** Store a compact bitmask of discovered clues (`CLUE_LIGHTHOUSE_LOG`, `CLUE_BELFRY_CHIME`, `CLUE_MANOR_DEED`) so NPC dialogue dynamically adapts to what Evelyn has actually witnessed.

### 4.2 Upgrading Visual Style & Character Articulation
1. **Hierarchical Inverse-Kinematics / 2-Bone Limbs (`Q16.16`):** Replace single-line legs and triangle cloaks with 2-segment articulated limbs (thigh/shin, upper-arm/forearm) and Verlet scarf physics on Evelyn and all three envoys, giving walk cycles, jumps, and Gladius lunges weight and silhouette clarity.
2. **Normal-Mapped Dithered Relief (`CLUT8` Bump Passes):** Store a lightweight height-field buffer for brick chimneys, clapboard siding, and cobblestones, perturbing shade indices by $\nabla H \cdot \vec{L}_{\text{lantern}}$ so Evelyn's swinging oil lantern casts real-time dynamic highlights across building facades.
3. **Parallax Multi-Plane Depth:** Add a foreground silhouettes layer (harbor pilings, iron cemetery gates, drifting fog wisps at `1.35×` camera scroll) in front of the player plane to create true *LittleBigPlanet* 2.5D depth.

### 4.3 Transforming the Boss Fight into an Integrated Stage Encounter
* **Unified Stage Combat (No Boxed Overlay):** Keep the Manor Gatekeeper directly inside the `480×272` architectural stage—leaping across bell-tower ledges, telegraphed with a `24`-frame crimson wind-up and `4`-frame hit-stop freeze on parry—so platforming, Gladius parries, and Danmaku bullet curtains occupy the exact same spatial geometry.

---

## 5. Conclusion

`RI-Haunted-Township` demonstrates that a mobile-first, zero-asset `Q16.16` engine can unify software-rendered 2.5D graphics, cellular sheaf spatial indexing, Verlet physics, harmonic puzzles, faction economics, and procedural cathedral audio inside less than `60 KB` of pure ES2023 JavaScript. By treating both its successes and its rougher mechanics as transparent experimental data, this repository serves as a solid architectural foundation for deeper narrative and kinetic simulations.

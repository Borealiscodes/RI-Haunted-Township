# Field Notes on WebAudio Synthesis & `Q16.16` 2.5D Diorama Math (`RI-Haunted-Township` `v1.0`–`v1.4`)

**Author:** Borealiscodes  
**Date:** November 23, 2026  
**Repository:** `://github.com`  
**Scope:** Empirical Audio & Visual Engineering Dev Note

---

## 1. Acoustic Lessons Learned: From "Dying Whale" Theremins to Balanced WebAudio

Building zero-asset procedural soundtracks in the WebAudio API revealed sharp psychoacoustic lessons about gain staging, pitch envelopes, and overtone ratios:

### 1.1 The Accidental "Dying Whale" Leviathan Effect (`v1.4` Lesson)
* **What Happened:** Attempting to emulate Delia Derbyshire's *Doctor Who* Radiophonic Workshop lead using a continuous sine oscillator with `exponentialRampToValueAtTime(nextHz, now + 0.16)` over wide intervals (`A4 → D5 → F4`), combined with a `5.2 Hz` vibrato LFO and a `350 ms` feedback delay, produced a resonant, mournful sub-aquatic glissando indistinguishable from a **dying humpback whale**.
* **Why It Happened:** Continuous oscillators never re-trigger an amplitude envelope; when paired with slow exponential frequency glides (`> 120 ms`) and tape feedback, human ears perceive the continuous pitch bend as a vocalizing marine mammal rather than a discrete musical melody.
* **Future SFX Reuse:** Keep this exact recipe (`sine` + `5 Hz` vibrato LFO + `160–240 ms` `exponentialRampToValueAtTime` + `350 ms` delay) in our toolkit for **abyssal sea-monster calls, foghorn groans, and eldritch leviathan ambience**.
* **How to Fix Musical Leads:** Discrete melodic instruments require per-note amplitude envelopes (`attack → decay → release`) with short portamento (`< 25 ms`) or zero pitch-glide between notes.

### 1.2 Inharmonic Overtones vs. Consonance
* **Discordance Trap:** Multiplying a carrier frequency by non-integer ratios (`2.756×` or `3.98×`) creates metallic bell/wood partials. While crisp for **short percussive transient strikes** (`< 200 ms`, like our FM bone-marimba or struck wind-chimes), sustaining inharmonic ratios across slow melodic notes generates clashing tritones and beats.
* **Rule of Thumb:** Restrict sustained pads and bowed strings to integer multiples (`1.0×` root, `1.498×` fifth, `2.0×` octave) and keep master background gain low (`0.12–0.16`) so `speechSynthesis` (`en-GB`) narration remains intelligible.

### 1.3 Filtering & Sub-Bass Clarity
* **Muddiness Trap:** Routing percussion or wooden marimbas through the same dark `340 Hz` lowpass filter as the cello/sub-bass strips away their transient click, making them sound "diluted."
* **Solution:** Use a **dual-bus topology**—route sub-bass (`D1 = 36.71 Hz`) and pads through a `lowpass` filter (`320–480 Hz`), while routing percussive FM marimba transients (`I(t) = 2.2 f_c e^{-t/0.035}`) directly to the master compressor/gain bus.

---

## 2. Visual & Spatial Math Lessons: Making `480×272` Look Like a 2.5D Diorama

### 2.1 Why Single-Bank `CLUT8` Wireframes Looked Flat
* **Early Limitation (`v1.0`–`v1.1`):** Dedicating 64 palette entries to a single monochrome alignment tint forced sky, ocean, houses, and characters to share one hue, making wireframes look sparse and unreadable.
* **Breakthrough (`v1.2`–`v1.3`):** Partitioning the 256-color `CLUT8` table into **8 distinct 32-shade material banks** (*Starry Indigo Sky*, *Atlantic Teal Sea*, *Cedar Burlap*, *Colonial Ivory*, *Coastal Evergreen*, *Lantern Amber*, *Crimson Raincoat*, and *Astral Amethyst*) immediately gave the town recognizable New England architecture.

### 2.2 2.5D Directional Shading & Volumetric Light Frustums
* **Directional Relief (`fillShadedRect`):** Interpolating shade indices across horizontal spans (`shadeLeft = 25 → shadeRight = 11`) plus roof-eave drop shadows (`4 px` dark band beneath gambrel roofs) creates immediate cylindrical volume on the **Blackwater Lighthouse** and depth on clapboard houses.
* **Volumetric Searchlight Cones (`fillLightCone`):** Replacing 2-line wireframes with barycentric-filled triangles (`fillTri`) modulated by distance attenuation and `4×4` Bayer ordered dithering (`BAYER_4X4`):
  $$\text{glow}(x, y) = \text{clamp}\!\left(\left\lfloor I_{\max}\left(1 - 0.72\frac{|x - x_{\text{apex}}|}{\Delta x}\right)\right\rfloor + \text{Bayer}(x,y),\; 4,\; 29\right)$$
  makes the lighthouse beacon and patrolling Watcher searchlights feel physically present in the coastal fog.

### 2.3 `Q16.16` Sub-Pixel Kinematics & Open-World Scaling
* **Sub-Pixel Platforming:** Representing positions and velocities in signed `Q16.16` fixed-point (`1.0 px = 65,536`) with damped horizontal acceleration (`vx += (target - vx) >> 2`), gravity (`+13,400 / frame²`), and 6-frame coyote-time forgiveness eliminates integer jitter and makes rooftop jumping and 14-frame crescent Gladius slashes feel fluid.
* **Spatial Partitioning:** Dividing the `1,920 px` coastline into `120 px` spatial hash buckets (`TownshipSpatialSheaf`) keeps entity lookups and $k$-hop ($k=2$) local cellular sheaf tension $O(1)$ per frame.

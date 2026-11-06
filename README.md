# Phantom Bots · ROV Defender

A separate browser game with direct ROV control in a procedural 3D underwater world. The original Lake Lab site and its source are unchanged.

## Play locally

From `dist/`, run `python3 -m http.server 4174`, then open http://localhost:4174. No install or build is needed. Three.js is bundled locally.

## Controls

- WASD: move forward/back and strafe.
- Arrow keys or drag the scene: aim the ROV.
- E / Q: rise / descend.
- Shift: boost.
- C: chemical spray; X: scraper; H: hydro jet; N: eDNA sample.
- 1–4: select a tool; Space: activate it.
- V: first-person / chase camera. Escape: pause.
- Touch devices also get movement and fire buttons; drag to aim.

## Level requirements and combat

The first lake has 240 quaggas (204 in loose colonies and 36 strays), plus 600 more-common zebras on low rocky bed patches. Each has 100 health, with a small health bar shown nearby. Remove 80% (192) and survey 25% of the unique water volume to advance. The target rises 2.5 percentage points per level to 95%, while the lake, population, budget, and time increase. Level 1 has a forgiving $4,000 budget and five-minute timer, with a reduced objective intended for a 2–3 minute presentation demonstration. Level 2 has 320 mussels, $4,750, and 5:30.

The bottom slopes continuously toward the shore rather than forming a flat center and steep rim. The ROV can contact the lakebed. Rocks block movement without pushing the ROV upward. Five separate rock impacts destroy it and require a restart; one sustained contact counts once. Hull status is shown below the large live score.

All tools have unlimited paid uses and strict maximum reach:

| Tool | Price | Reach | Area radius | Damage |
| --- | --- | --- | --- | --- |
| Scraper | $3 | 3 m | 1.8 m | 45 at point blank, falling to 9 at maximum reach |
| Hydro blaster | $40 | 6 m | 2.6 m | 120, one-shotting mussels in range |
| Chemical spray | $95 | 8 m | 3.2 m | 180, also killing good species |
| eDNA | $150 | 4.5 m radius at ROV position | spherical volume | Up to 90 score for newly sampled water |

Hold Space to repeatedly activate the selected tool. The ground outline and target count show its current footprint; organisms beyond maximum reach cannot be affected. Travel costs $1.70/m, or $2.80/m with boost. Misses still cost money.

Wildlife losses are real: chemical spray triggers a belly-up drift and fade for affected perch, and a wilt/fade for aquatic plants. Each native perch costs 2,500 score points; aquatic plants cost 1,500. Penalties accumulate without a cap and can make scores negative. The large live score displays losses prominently. Only quagga removal earns points: 5 each. Zebra removals earn zero and do not count toward the removal objective.

Quagga mussels are freshwater species. The stylized setting, damage, and treatment rules are fictional arcade mechanics.

## Local network

Serve `dist/` using `python3 -m http.server 4175 --bind 0.0.0.0`. Other devices on the same LAN can open the host computer's local IP on port 4175. The computer and server must remain running.

## Verification

Run `node tests/rules.cjs`, `node --check dist/app.js`, and `node --check dist/engine.js`.

The rules tests cover loose-colony and stray distribution across 40 randomized lakes, gentle slopes, area damage and distance falloff, strict weapon ranges, hydro one-shot removal, actual wildlife deaths and severe negative scores, five distinct rock impacts, floor contact, restart, level requirements, and unlimited paid uses.

## Spatial eDNA coverage

Each sample represents a 4.5 m-radius sphere centered on the ROV. Water volume is approximated using 3D cells clipped to the lakebed, shoreline, and surface. The level requires at least 25% of these unique water cells to be covered by the union of sampling spheres. Repeating a sample at an unchanged position adds no coverage or score, while still costing $150. Partial overlaps only add new cells. Moving and changing depth are necessary. Purple wire outlines mark completed samples and the next-sample forecast shows the potential new percentage. This is a game model, not a physical eDNA dispersion model or the literal volume collected in a bottle.

## Visual species identification and rocky habitat

Zebra and quagga shells use nearly the same striped texture, with distinct shell meshes and similar coloring. Each shell begins unidentified. In active play, visibility inside the actual camera frustum, within 18 m, and unobstructed by lakebed or boulders accrues toward 3 seconds of visual identification. Progress is stored separately per shell, pauses when looking away, and resumes on return; it also pauses with the game. The small purple strip and target-panel meter show identification progress. Species and distance remain hidden until identification completes, then individual labels show both. Rocky textures have feathered, sand-toned edges rather than dark habitat circles, and some quaggas share rocky substrate. Identified quaggas use mint target health bars; identified zebras use blue bars. Unknown healthy shells have neutral bars.

Every zebra has a rock-bed attachment ID and is placed on a raised, irregular rocky surface. The same rock-bed height function drives the lakebed, bed mesh, shell support, water-volume clipping, and ROV floor contact. Zebra shells never spawn on bare sand. The 80% removal goal applies only to the 240 quaggas, irrespective of whether the player has identified them before removal. Wildlife penalties and 25% eDNA water-coverage requirements are unchanged.

## Hidden invasion front

Every randomized lake has an invisible straight distribution boundary. All quagga placements, including loose-colony members, sediment strays, and rocky-bed relocations, stay strictly on its invaded side. Zebra mussels may occupy rocky beds on either side. The starting position is 4.8 m outside the boundary, facing toward it; the ROV can cross freely. No geometry, physical wall, stripe, or sonar line reveals the boundary.

eDNA samples now record a simulated local quagga-presence signal, position, and mission time, alongside unique water-volume coverage. Amber sample outlines and sonar markers indicate a positive signal; purple means not detected. The survey panel tracks both kinds of observations so players can compare sites near the unseen front. The 25% coverage objective is unchanged, and repeating a sample still cannot farm coverage points. The signal is a simplified game lookup, not a real PCR assay or transport model, and does not establish the cause of a distribution edge or prove future containment.

This is a fictional invasion-front scenario. No verified Lake Mendota quagga-boundary map was used; the Wisconsin DNR Lake Mendota record consulted documents zebra mussels: https://apps.dnr.wi.gov/lakes/invasives/AISDetail.aspx?roiseq=55108569 .

## Lake-Patrol-inspired model refresh

The procedural ROV, pilot tool housings, native fish, aquatic plants, and survey buoy were rebuilt in `dist/visuals.js` with the visual direction of https://github.com/penguinyou88/Lake-Patrol as a read-only reference. The reference repository was not edited, cloned into this project, committed to, or pushed to. All new meshes and textures are generated locally at runtime.

The ROV now has an off-white paneled survey hull, cyan trim, camera dome, orange tail fins, and three-blade thruster pods. Its rotor animation responds to thrust and reverse, the model banks on steering inputs, and tool housings animate at activation. Native perch school with articulated forked tails and pectoral fins, avoid the ROV and rocks, and drift/fade after harm. Ribbon grass uses rooted, current-driven GPU animation and wilts after chemical harm. The buoy bobs with a pulsing survey light.

The rock meshes, rock textures and bed surfaces, zebra/quagga meshes and textures, detection, hidden invasion front, sampling, prices, controls, score rules, and collision logic are preserved.

Visual checks: `node tests/visuals.cjs` verifies model hierarchy, geometry proportions, frame-rate-independent propeller motion, banking and tool animation, articulated schooling fish, avoidance, harm animation, and rooted grass animation.

Battery and collision update: all movement, steering, and tool activations consume battery. One surface buoy (lightning marker on sonar) automatically recharges within 3 m and above 1.8 m depth. Empty battery and five separate rock impacts cause a 2.6-second destruction sequence with debris, rising bubbles, shockwave, and camera shake before the retry screen. Procedural branching coral sways gently, blocks movement, and remains vulnerable to chemical wildlife penalties. Existing vehicle, rock, shell, fish, and grass models are preserved. Verify energy rules with `node tests/battery.cjs`.

Educational narration: 16 ordered field notes start on Dive in, retry, or the next level. Each caption updates when its utterance begins; the next starts directly in the speech completion callback. Game pauses also pause narration. Voice can be muted while timed captions continue; unavailable speech falls back to captions. Text and source links live in `dist/facts.js`, with sources available in the pilot guide. The Geneva Lake date is confirmed by Wisconsin DNR; the game's invasion line and identification remain explicitly simulated. Run `node tests/narration.cjs` to verify sequencing and controls.

Radio narration now uses pre-rendered local voice clips with a narrowband filter, gentle saturation, static, and short squelch sounds. Captions stay visible during each transmission. Regenerate changed facts with `python3 scripts/build-radio.py`; unchanged recordings are reused.

Current narration (replaces the earlier system/radio voices): generate with `node scripts/build-neural-facts.mjs`. It uses Kokoro-82M's `am_michael` neural male voice at natural pitch and normal speed, without radio filtering. The local development dependency is pinned in `.narration-runtime/package-lock.json`; model files are cached there and are not shipped to players. Only generated WAV recordings are served from `dist/audio/`. No speech service receives the fact text. R-O-V is explicitly pronounced as three letters, and eDNA is also expanded for speech. The macOS `build-radio.py` script is retained as a legacy renderer.

Neural speech attribution: [Kokoro / kokoro-js](https://github.com/hexgrad/kokoro), Apache-2.0; [Kokoro-82M model](https://huggingface.co/hexgrad/Kokoro-82M), Apache-2.0; [ONNX conversion](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX). These are voice-generation dependencies only; the running game remains a static site.

Living ecosystem update: the health indicator is now derived from the actual world state rather than subtracting a fixed amount per wildlife death. Full quagga infestation starts the lake at 25% recovery potential; removing quaggas raises that potential toward 100%. The living fish fraction and fish vitality set the main recovery limit, and surviving coral/grass contribute habitat quality. The HUD shows live fish counts and quagga-removal progress. Fish swimming activity gradually increases as infestation pressure falls. This is an arcade recovery model, not a real-time ecological forecast. Verify with `node tests/ecosystem.cjs`.

Pitch runaway: up/down arrows now allow full pitch rotation. Beyond ±180°, steering and tools are locked out; pitch spin and surge speed accelerate continuously. Surge direction is fixed when control is lost, while the ROV model tumbles. Movement uses short collision substeps so fast motion cannot skip obstacles. First contact with a rock, coral, lakebed, or lakeshore explodes the vehicle and reaches the retry screen. Pause freezes the runaway, and retry resets it. The pitch indicator warns at 150°. The chase camera stays stable during the tumble. Verify with `node tests/pitch-runaway.cjs` and `node tests/failure-flow.cjs`.

Camera follow: the third-person camera follows heading and damped pitch, with a level horizon and camera pitch capped around 46°. It remains underwater and shortens its arm near terrain/rocks. During vertical runaway it uses a fixed outside heading and level pitch so the ROV remains visible. Pitch failure still starts immediately at ±90°. See `node tests/camera.cjs` and `node tests/pitch-runaway.cjs`.

Gentle turning: Left/Right steer normally with a modest bank that automatically settles when released. There are no full side rolls, turn cutoff, or horizontal runaway. Verify `node tests/roll.cjs`.

Wildlife update: seven animated schools contain 70 fish, including perch, bluegill, lake trout, and northern pike. Added species share the existing articulated swimming/fleeing rig, with species-specific silhouettes, colors, and markings. Coral uses smooth curved tapered branches, rounded tips, fan variants, and current sway; its visual height matches its existing collider. ROV, mussels, and rocks are unchanged. Model gallery: `dist/wildlife-gallery.html`. Validation: `node tests/visuals.cjs`, `node tests/fish-hazards.cjs`, `node tests/ecosystem.cjs`.

Mussel life cycle: surviving initial breeding cohorts produce juveniles after a 20-second opening period. Juveniles mature after 36 seconds and join the breeding population, creating accelerating growth, bounded by habitat and a rendering population cap. New zebras settle only on rock beds; new quaggas stay behind the invasion front and increase the percentage-based removal requirement. At 2.3 m zebra proximity, six seconds of accumulated exposure starts thruster attachment. Fouling reduces speed and rotor rate and damages the new 100% hull-health pool; rocks also cost 20 health and still explode on the fifth impact. The surface charger cleans 12% fouling/sec without repairing hull. Attached shells appear around thrusters. Pausing freezes reproduction/fouling; restarting resets both. This greatly compresses real veliger settlement and maturation times. Source: https://www.dnr.state.mn.us/invasives/aquaticanimals/zebramussel/index.html . Validation: `node tests/mussel-life.cjs`.

Beginner tutorial: the welcome screen offers Start beginner tutorial or Skip tutorial / dive in. Ten guided practice steps cover movement, steering/camera, depth, identification, tools/wildlife, eDNA, battery/resources, charging, and mission goals. Successful actions advance the lesson; Next tip allows manual progression. Practice freezes mission time, waives costs, and disables damage, runaway, fouling, reproduction, and level completion. Finishing or skipping reloads the original level with fresh resources and restores normal rules; practice totals do not carry over. Replay is available from pause. Validation: `node tests/tutorial.cjs`; full tutorial and skip paths also checked in browser.

Tutorial pointers: each lesson highlights a relevant HUD region and connects it to the lesson with an arrow and label. Clickable indicator labels switch focus between related controls. Pointer bounds follow the current layout, the lesson moves away from its highlighted target, and callouts hide on pause or exit.

The zebra-safety tutorial lesson explicitly explains the 2.3 m / six-second fouling hazard, persistent motor slowdown and hull damage, explosion at zero hull health, and surface-station cleaning. It points to fouling, hull health, and sonar and waits for Understood so the warning cannot auto-advance.

Vessel equipment viewer: View vessel in the header, Inspect ROV & equipment on the welcome screen, and View vessel & equipment in pause open a dedicated interactive 3D inspector. Drag/arrow keys rotate; scroll or +/− zoom; Reset view restores framing. Select camera/lights, sonar, thrusters, hydro, scraper, chemicals, eDNA, battery, or computer to locate it and read its role. Cutaway shows illustrative internal equipment inside a reference-inspired one-metre Phantom Bots inspection model. A running dive pauses while the inspector is open and resumes on close; opening from an already paused dive preserves pause. The second renderer is lazy and stops its animation when closed.

Reference inspection update: the dedicated viewer model follows the supplied yellow/orange Phantom Bots illustration, including cutaway electronics, twin green chemical tanks, blue hydro pump, tail/side props, eDNA intake and detection chamber, battery bay, sonar sensors, and ribbed suction intake. Scraper jaws remain represented as a game tool. All equipment together fits exactly 1,000 mm overall; full model envelope is approximately 1,000 × 434 × 508 mm (L/W/H). Selected component dimensions are scaled model bounding-box estimates including mounts/connections. Technical data separates reference features, proposed targets (battery 14.8 V / 10 Ah / 148 Wh), unknown engineering values, and arcade rules. The game URL stays http://192.168.0.135:4175/; the inspector is an in-page dialog. Horizontal drag direction was reversed as requested.

eDNA education: tutorial, vessel sampler description, guide, sampling HUD hint, and narrated facts now explicitly explain the team’s focus on early warning of baby-mussel (veliger) spread. The text also distinguishes DNA detection from proof of living larvae, because DNA may come from adults or larvae. Sampling mechanics are unchanged.

## GitHub Pages

This is a buildless static game. The Pages workflow validates the game, prepares `_site/` from `dist/`, and deploys it using GitHub Actions when `main` changes. Asset paths are relative, so the game works under a repository's Pages subpath.

Local validation and packaging:

```sh
node scripts/check.mjs
node scripts/prepare-pages.mjs
```

In the GitHub repository's Settings → Pages, select **GitHub Actions** as the source. No API keys or backend server are needed. The local narration model/runtime, old audio renders, and local hosting configuration are ignored by Git; the current 16 narration clips are included.

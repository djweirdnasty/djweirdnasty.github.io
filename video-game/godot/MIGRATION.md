# Youie — Godot Migration

This directory contains the Godot 4 port of **Youie**, migrated from the
original single-file browser game (`../resident_evil_proto.html`, ~3,400 lines
of HTML/CSS/JavaScript). The original game is untouched and remains the
specification — `index.html` still opens the browser version.

## Layout

```
godot/
  project.godot            Godot 4.7 project (GDScript only, no C++)
  scenes/main.tscn         Main scene: env, light, camera rig, level root, HUD
  scripts/
    main.gd                Game orchestrator: states, levels, items, camera, input
    levels_data.gd         Direct port of all 10 level definitions
    world_builder.gd       Converts 2D level rects -> 3D floor/walls/doors/props
    player.gd              Movement, weapons, health, combat states (gameplay)
    zombie.gd              Zombie AI, grab/bite, feeding, boss variant (gameplay)
    bullet.gd              Projectiles, wall hits, splash damage, breakable walls
    hud.gd                 Title screen, HUD, QTE prompts, cutscenes, vignette
    character_rig.gd       3D character wrapper: GLB rig, scale, turning,
                           crossfaded AnimationPlayer states, hit flash
    sprite_prep.gd         Chroma-key texture prep (muzzle flash FX)
    rig_test.gd            Standalone character viewer (scenes/rig_test.tscn)
  assets/models/           3D GLB models (rigged + animated):
    Man_LongSleeves.glb      player = Youie — Quaternius "Man in Long Sleeves"
                             (Animated Men Pack), retinted to the Youie
                             palette via retint(): dark skin, black top,
                             black jeans, black/red sneakers
    Animated_Zombie.glb      normal zombies — Quaternius "Animated Zombie",
                             real human zombie w/ 41-bone Mixamo rig
    Pistol_9mm.glb           pistol prop — Quaternius "9mm Pistol" (Beretta),
                             attached to the player's Wrist.R bone
    Shotgun.glb              shotgun prop — Quaternius "Shotgun" (CC0)
    FlareGun.glb             grenade launcher prop — Quaternius "Flare Gun"
                             (CC0), tinted gunmetal via prop tint
    RocketLauncher.glb       RPG prop — Quaternius "Rocket Launcher" (CC0)
    Rogue.glb                KayKit placeholder (kept for reference)
    Skeleton_Warrior.glb     boss — KayKit placeholder (Throw attack)
    Skeleton_Minion.glb      unused now (kept for reference)
    Man_A.glb, Man_B.glb,    other CC0 candidates from the same pack
    Man_Suit.glb             (not currently used)
  assets/sprites/          Original PNG sprite sheets (kept as reference/FX)
    characters/YOUIE-CHARACTER-AND-WEAPON-SPRITE-SHEET.png
                             Youie final-art reference sheet: state rows
                             (idle/walk/run/jump/shoot/reload/hit/death) +
                             weapon lineup. Its "SMG" block is the stand-in
                             for the in-game Grenade Launcher — there is no
                             SMG inventory item (see "Known differences").
```

## System mapping

| Browser (JS/canvas)                  | Godot                                   |
|--------------------------------------|-----------------------------------------|
| `requestAnimationFrame` loop         | `_process` / `_physics_process`         |
| Canvas 2D draw calls                 | 3D meshes; characters are skeletal GLBs |
| 640x480 world coordinates            | Same coordinates on the XZ plane        |
| Rect collision + grid flow-field     | Same math ported (kept logic parity)    |
| Sprite-sheet characters              | `character_rig.gd` + KayKit GLB rigs    |
| WASD/mouse/mobile input              | Godot `InputMap` actions + mouse        |
| DOM HUD / menus                      | `hud.gd` Control nodes (CanvasLayer)    |
| `localStorage` win flag              | `user://youie-winner.save`              |

## 3D character layer (Option 3)

Characters are real 3D skeletal models, not billboarded sprites.
`character_rig.gd` wraps each GLB: it scales into world units (mesh-AABB
measure by default, `src_height` override for assets whose bind AABB is
unreliable — the Quaternius zombie renders ~8.5 units tall at scale 1, so it
uses `src_height=8.5`), grounds the feet, smooth-turns toward facing, drives
`AnimationPlayer` states with crossfades, manages handslot props via
`set_attachment()` (built-in GLB meshes) or `show_prop()` (external GLB
weapons), and applies a red material overlay for hit flashes.

State mapping — the player now uses `Man_LongSleeves.glb` (Quaternius
CharacterArmature, 62 bones, 24 clips incl. dedicated gun poses). player.gd
keeps its KayKit-era state names; `rig.anim_alias` translates:
`Unarmed_Idle`→`Idle_Neutral`, `Walking_A`→`Walk`, `Running_A`→`Run`,
`Running_Armed`→`Run_Shoot`, `1H_Ranged_Aiming`→`Idle_Gun_Pointing`,
`1H_Ranged_Shoot`→`Idle_Gun_Shoot`, `1H_Ranged_Reload`→`Interact`,
`Hit_A/B`→`HitRecieve`/`HitRecieve_2`, `Dodge_Backward`→`Roll`,
`Death_A/B`/`Death_A_Pose`/`Lie_Pose`→`Death`, `Lie_StandUp`→`Roll`.
`rig.retint(YOUIE_PALETTE)` recolors the flat-color materials (mesh-scoped
keys like `Casual_Legs:Skin` turn the bare legs into black jeans).
Weapon props are calibrated per weapon via `Player.WEAPON_PROPS`
(glb/slot/pos/rot/scale/muzzle length/tint); transforms were solved with
rig_test's `--prop-aim --prop-barrel --prop-up` (maps the prop's muzzle
axis to the aim direction in bone space) rather than hand-tuned Eulers.
All four inventory weapons use real Quaternius firearm GLBs on the
`Wrist.R` bone: Pistol→9mm Beretta, Shotgun→pump shotgun,
Grenade Launcher→flare gun (tinted gunmetal), RPG→rocket launcher.
Zombies (`Animated_Zombie.glb`): `Zombie|ZombieIdle`, `Zombie|ZombieWalk`
shamble, `Zombie|ZombieRun` (fast), `Zombie|ZombieBite` (grab/bite/attack),
`Zombie|ZombieCrawl` → fade (death — the asset ships no death clip). Boss
still uses `Skeleton_Warrior.glb` (KayKit anims) pending a final ghoul model.
The original sprite sheets remain in `assets/sprites/` as design reference.

## Asset sources and licenses

| Asset | Creator | Source | License |
|-------|---------|--------|---------|
| Rogue.glb, Skeleton_Minion.glb, Skeleton_Warrior.glb | KayKit | github.com/KayKit-Game-Assets (Adventurers/Skeletons packs) | CC0 — no attribution required |
| Animated_Zombie.glb | Quaternius | poly.pizza/m/jkrEvQZb8J | **CC-BY — attribution required** |
| Pistol_9mm.glb | Quaternius | poly.pizza/m/BoZWhFdsj4 | **CC-BY — attribution required** |
| Shotgun.glb | Quaternius | poly.pizza/m/8Z4HaN1NyS | CC0 — no attribution required |
| FlareGun.glb | Quaternius | poly.pizza/m/44H9OBUqTC | CC0 — no attribution required |
| RocketLauncher.glb | Quaternius | poly.pizza/m/GCqUvqleqN | CC0 — no attribution required |
| Man_LongSleeves.glb, Man_A.glb, Man_B.glb, Man_Suit.glb | Quaternius | poly.pizza/bundle/Animated-Men-Pack-DAC9SDgMQT | CC0 — no attribution required |

Required attribution (ship this with any build):
"Animated Zombie" and "9mm Pistol" by Quaternius (https://quaternius.com),
licensed under CC-BY 4.0, via poly.pizza.

## What is ported

- All 10 levels: walls, doors (key/grey/item/exit), themes, decorations,
  lore notes, secret breakable walls, item/container placement.
- Player: WASD/arrow movement, mouse aim, directional sprite animation,
  health/FINE-CAUTION-DANGER states, reload, interact, grab/struggle,
  boss knockdown/get-up.
- Weapons with original stats: pistol, shotgun, grenade launcher, RPG
  (splash damage included). RPG unlock after beating the game, matching
  the original's winner save flag.
- Zombies: spawn/AI pathing, grab -> struggle -> bite sequence, death,
  feeding-on-corpses, and the Paulgaul boss variant (throw/knockdown).
- Items: keys, grey keys, master key, ammo, meds, weapon pickups,
  searchable containers, loot boxes behind item-doors.
- HUD: health bar + portrait, level/ammo/keys line, interaction prompts,
  QTE prompts ("MASH SPACE!"), level intro hints, cutscene text, vignette.
- Title screen, intro cutscene, death/feeding scene, ending, badges flow.

## Dev flags

- `--autostart` — skip title/intro, jump straight into level 1.
- `--shot` — save a viewport screenshot to `/tmp/youie_shot.png` (~frame 150).
- `--shot-level N` — after autostart, jump to level index N (0-based).
- `--shot-walk` — inject diagonal movement for screenshot verification.
- `--shot-close` — close camera + debug light for character inspection.
- `--smoke` — headless smoke test: builds all 10 levels, fires a shot,
  runs AI, exercises grab/struggle, walks the win path, prints `SMOKE ...`.
- `scenes/rig_test.tscn` — standalone character viewer:
  `Godot --path godot res://scenes/rig_test.tscn --anim Idle --glb res://...`

Run: `Godot --path godot --headless --smoke --quit-after 4000`

## Known differences / remaining work

- No audio: the original has no audio system; none was invented. Godot
  `AudioStreamPlayer` nodes can be added where the HTML shell had hooks.
- Browser-only site features (auth, leaderboard, comments, content
  carousel in the HTML shell) are intentionally not ported — they are
  website integrations, not gameplay.
- Lighting/mood is tuned darker than the canvas version; adjust
  `scenes/main.tscn` (ambient energy, `PlayerLight`) to taste.
- Final-art replacement is in progress (three milestones done): normal
  zombies use a real human zombie model, the player is a retinted human
  model reading as Youie (dark skin, black clothes, black/red sneakers),
  and all four inventory weapons are real firearm GLBs. Still placeholder:
  the boss (Skeleton_Warrior). Note the game inventory is
  Pistol/Shotgun/Grenade Launcher/RPG — the reference sprite sheet's "SMG"
  does not exist in `levels_data.gd`; the grenade launcher fills that slot.
  Remaining Youie fidelity gaps: no dreadlocks (short spiky hair), no
  visible PAICHI chest patch, no forearm tattoos, top reads as a dark
  hoodie rather than a t-shirt — flat-color materials can't carry those
  details; a custom texture/model pass would be needed.
- The zombie asset has no death clip — `Zombie|ZombieCrawl` plays as the
  collapse before the existing fade-out. Gameplay death state unchanged.
- GDExtension/C++ still untouched — not needed so far.

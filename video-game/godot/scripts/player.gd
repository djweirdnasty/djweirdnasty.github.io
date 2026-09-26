class_name Player
extends CharacterBody3D

## Port of the JS player object + player rendering block from
## resident_evil_proto.html. World position is the character's CENTER on the
## XZ plane (JS used x+size/2, y+size/2 everywhere — we store the center).

signal died
signal health_changed

const SPRITES := "res://assets/sprites/"
const MODEL := "res://assets/models/Man_LongSleeves.glb"
const PISTOL_GLB := "res://assets/models/Pistol_9mm.glb"
const SHOTGUN_GLB := "res://assets/models/Shotgun.glb"
const LAUNCHER_GLB := "res://assets/models/FlareGun.glb"
const RPG_GLB := "res://assets/models/RocketLauncher.glb"
# Per-weapon prop calibration: GLB, hand bone, offset/rotation/scale (prop axes:
# muzzle dir / gun-up), muzzle length in world units, optional tint.
# Solved via rig_test.tscn --prop-aim/--prop-barrel, not hand-tuned Eulers.
const WEAPON_PROPS := {
	"Pistol": {
		"glb": PISTOL_GLB, "slot": "Wrist.R",
		"pos": Vector3(-0.0012, 0, -0.0006),
		"rot": Vector3(2.51, -79.87, -88.90),
		"scale": 0.0013, "muzzle": 22.0,
	},
	"Shotgun": {
		"glb": SHOTGUN_GLB, "slot": "Wrist.R",
		"pos": Vector3.ZERO,
		"rot": Vector3(-87.31, -103.25, -156.67),
		"scale": 0.0022, "muzzle": 30.0,
	},
	"Grenade Launcher": {
		"glb": LAUNCHER_GLB, "slot": "Wrist.R",
		"pos": Vector3.ZERO,
		"rot": Vector3(2.50, -79.88, 91.09),
		"scale": 0.0015, "muzzle": 20.0,
		"tint": Color(0.13, 0.13, 0.16),  # pink flare shell -> gunmetal
	},
	"RPG": {
		"glb": RPG_GLB, "slot": "Wrist.R",
		"pos": Vector3(0.0008, 0, -0.0008),
		"rot": Vector3(2.51, -79.82, 91.16),
		"scale": 0.0045, "muzzle": 42.0,
	},
}
# Character visual height in world units (walls are 90 tall).
const MODEL_HEIGHT := 62.0
# The GLB's skinned render height at scale 1 (empirical — bind AABB is
# unreliable for Quaternius casual rigs).
const MODEL_SRC_HEIGHT := 1.4

# Youie palette: dark skin, black PAICHI tee, black jeans (bare-leg skin on
# Casual_Legs tinted black), black/red sneakers, black hair/brows.
const YOUIE_PALETTE := {
	"Skin": Color(0.30, 0.18, 0.11),
	"Casual_Legs:Skin": Color(0.09, 0.09, 0.11),  # bare legs -> black jeans
	"Hair": Color(0.03, 0.03, 0.035),
	"Eyebrows": Color(0.05, 0.04, 0.03),
	"Purple": Color(0.07, 0.07, 0.08),    # shirt body + shoe accents -> black
	"LightBlue": Color(0.09, 0.09, 0.11), # shorts -> black jeans
	"White": Color(0.45, 0.06, 0.06),     # sneaker base -> red
}

# Game anim names -> Quaternius CharacterArmature clips.
const YOUIE_ANIMS := {
	"Unarmed_Idle": "CharacterArmature|Idle_Neutral",
	"Walking_A": "CharacterArmature|Walk",
	"Running_A": "CharacterArmature|Run",
	"Running_Armed": "CharacterArmature|Run_Shoot",
	"1H_Ranged_Aiming": "CharacterArmature|Idle_Gun_Pointing",
	"1H_Ranged_Shoot": "CharacterArmature|Idle_Gun_Shoot",
	"1H_Ranged_Reload": "CharacterArmature|Interact",
	"Hit_A": "CharacterArmature|HitRecieve",
	"Hit_B": "CharacterArmature|HitRecieve_2",
	"Dodge_Backward": "CharacterArmature|Roll",
	"Death_A": "CharacterArmature|Death",
	"Death_B": "CharacterArmature|Death",
	"Death_A_Pose": "CharacterArmature|Death",
	"Lie_Pose": "CharacterArmature|Death",
	"Lie_StandUp": "CharacterArmature|Roll",
	"Idle": "CharacterArmature|Idle",
	"Interact": "CharacterArmature|Interact",
}

# ---- Gameplay state (mirrors the JS player object) --------------------------
var size := 14.0
var speed := 120.0
var health := 100
var max_health := 100
var ammo := 0
var ammo_reserve := 0
var keys := 0
var grey_keys := 0
var master_keys := 0
var weapons: Array = []
var weapon_index := -1
var weapon = null  # Dictionary or null
var last_hit := 0
var dead := false
var won := false
var death_start := 0
# Combat state machine (freshCombatState)
var grabbed_by = null        # Zombie node or null
var grab_phase = null        # 'grab' | 'struggle' | 'biteNeck' | 'biteArm' | 'escape'
var grab_phase_start := 0
var grab_bite_type = null
var knocked_down := false
var knock_phase = null       # 'thrown' | 'impact' | 'getup'
var knock_start := 0
var mash_count := 0
var reloading := false
var reload_start := 0
var facing := Vector2(1, 0)
var last_shot := -100000

var world2: Vector2:   # center position in 640x480 space
	get: return Vector2(position.x, position.z)
	set(v): position = Vector3(v.x, 0, v.y)

var rig: CharacterRig3D        # 3D skeletal character (visual layer)
var muzzle_sprite: Sprite3D
var muzzle_light: OmniLight3D
var _muzzle_until := 0
var _muzzle_len := 14.0
var _shot_anim_at := -1


func _ready() -> void:
	add_to_group("player")
	collision_layer = 2
	collision_mask = 1
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(size, 30, size)
	shape.shape = box
	shape.position.y = 15
	add_child(shape)

	rig = CharacterRig3D.new()
	rig.setup(MODEL, MODEL_HEIGHT, Color(1, 1, 1), MODEL_SRC_HEIGHT)
	rig.retint(YOUIE_PALETTE)
	rig.anim_alias = YOUIE_ANIMS
	# Locomotion/idle clips loop; one-shots (death, getup, shoot, hits) play
	# through and hold their last frame.
	rig.set_looping(["Idle", "Unarmed_Idle", "Walking_A", "Running_A",
		"Running_Armed", "1H_Ranged_Aiming", "1H_Ranged_Shooting", "Hit_B",
		"Interact"])
	add_child(rig)

	muzzle_sprite = Sprite3D.new()
	muzzle_sprite.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	muzzle_sprite.pixel_size = 1.0
	muzzle_sprite.shaded = false
	muzzle_sprite.alpha_cut = SpriteBase3D.ALPHA_CUT_DISABLED
	muzzle_sprite.texture = SpritePrep.tex(SPRITES + "fx/muzzleflash.png")
	muzzle_sprite.visible = false
	add_child(muzzle_sprite)
	muzzle_light = OmniLight3D.new()
	muzzle_light.light_color = Color(1.0, 0.85, 0.4)
	muzzle_light.light_energy = 3.0
	muzzle_light.omni_range = 140.0
	muzzle_light.visible = false
	add_child(muzzle_light)



func reset_state(start: Vector2, beaten := false) -> void:
	world2 = start
	health = max_health
	keys = 0; grey_keys = 0; master_keys = 0
	dead = false; won = false; last_hit = 0
	facing = Vector2(1, 0)
	reset_combat()
	if beaten:
		weapons = [LevelsData.weapon("RPG")]
		weapon_index = 0
		weapon = weapons[0].duplicate()
		ammo = 2; ammo_reserve = 18
	else:
		weapons = []
		weapon_index = -1
		weapon = null
		ammo = 0; ammo_reserve = 0


func reset_combat() -> void:
	grabbed_by = null; grab_phase = null; grab_phase_start = 0; grab_bite_type = null
	knocked_down = false; knock_phase = null; knock_start = 0
	mash_count = 0
	reloading = false; reload_start = 0


func can_act() -> bool:
	return grabbed_by == null and not knocked_down and not dead and not won


func move_input(dir: Vector2, dt: float) -> void:
	if not can_act():
		velocity = Vector3.ZERO
		return
	if dir != Vector2.ZERO:
		facing = dir.normalized()
	velocity = Vector3(dir.x, 0, dir.y).normalized() * speed
	move_and_slide()
	# Keep inside the world bounds (JS clamp).
	position.x = clampf(position.x, size * 0.5, LevelsData.WORLD.x - size * 0.5)
	position.z = clampf(position.z, size * 0.5, LevelsData.WORLD.y - size * 0.5)


# Grapple + knockdown + reload state machines — port of handlePlayerCombatState.
func combat_update(now: int, msg_cb: Callable) -> void:
	if grabbed_by:
		var z = grabbed_by
		var elapsed: int = now - grab_phase_start
		match grab_phase:
			"grab":
				if elapsed >= LevelsData.GRAB_MS:
					grab_phase = "struggle"
					grab_phase_start = now
					mash_count = 0
			"struggle":
				if mash_count >= LevelsData.STRUGGLE_MASH_NEEDED:
					grab_phase = "escape"
					grab_phase_start = now
				elif elapsed >= LevelsData.STRUGGLE_WINDOW_MS:
					grab_bite_type = "biteNeck" if randf() < 0.5 else "biteArm"
					grab_phase = grab_bite_type
					grab_phase_start = now
			"biteNeck", "biteArm":
				if elapsed >= LevelsData.BITE_MS:
					health -= z.damage
					last_hit = now
					health_changed.emit()
					if health <= 0:
						die(now)
						msg_cb.call("YOU DIED. Press R to respawn.", 5000)
					else:
						grabbed_by = null
						grab_phase = null
						z.last_attack = now
			"escape":
				if elapsed >= LevelsData.ESCAPE_MS:
					grabbed_by = null
					grab_phase = null
					z.last_attack = now

	if knocked_down:
		var elapsed: int = now - knock_start
		match knock_phase:
			"thrown":
				if elapsed >= LevelsData.THROWN_MS:
					knock_phase = "impact"
					knock_start = now
			"impact":
				if elapsed >= LevelsData.IMPACT_MS:
					knock_phase = "getup"
					knock_start = now
					mash_count = 0
			"getup":
				var getup_duration: int = maxi(300, LevelsData.GETUP_BASE_MS - mash_count * 100)
				if elapsed >= getup_duration:
					knocked_down = false
					knock_phase = null

	if reloading and now - reload_start >= LevelsData.RELOAD_MS:
		reloading = false
		reload_weapon()


func die(now: int) -> void:
	dead = true
	death_start = now
	grabbed_by = null
	grab_phase = null
	knocked_down = false
	knock_phase = null
	died.emit()


func start_reload(now: int) -> bool:
	if weapon == null or reloading or grabbed_by or knocked_down or dead or won:
		return false
	reloading = true
	reload_start = now
	return true


func reload_weapon() -> void:
	if weapon == null:
		return
	var cap: int = weapon.get("mag_size", 12)
	var needed: int = cap - ammo
	var take: int = mini(needed, ammo_reserve)
	ammo += take
	ammo_reserve -= take


func try_shoot(now: int, aim: Vector2, out_of_ammo_cb: Callable) -> Variant:
	if weapon == null or dead or won:
		return null
	if grabbed_by or knocked_down or reloading:
		return null
	if ammo <= 0:
		out_of_ammo_cb.call()
		return null
	var cd: int = LevelsData.SHOT_COOLDOWN.get(weapon.name, 250)
	if now - last_shot < cd:
		return null
	var p := world2
	var d := aim - p
	var len := d.length()
	if len == 0.0:
		return null
	last_shot = now
	ammo -= 1
	_muzzle_until = now + LevelsData.MUZZLE_FLASH_MS
	return {
		"pos": p,
		"vel": d / len * LevelsData.BULLET_SPEED,
		"size": weapon.bullet_size,
		"color": weapon.color,
		"damage": weapon.damage,
		"splash": weapon.get("splash", 0),
		"life": LevelsData.BULLET_LIFE,
	}


func collect(it: Dictionary, msg_cb: Callable, lvl: Dictionary) -> void:
	it.taken = true
	match it.type:
		"key":
			keys += 1
			msg_cb.call("Key acquired! (%d/%d)" % [keys, lvl.keys_needed], 2000)
		"greyKey":
			grey_keys += 1
			msg_cb.call("Grey key acquired!", 2000)
		"masterKey":
			master_keys += 1
			msg_cb.call("Master key acquired!", 2000)
		"ammo":
			ammo_reserve += it.amount
			msg_cb.call("Ammo reserve +%d" % it.amount, 2000)
		"med":
			health = mini(max_health, health + it.amount)
			health_changed.emit()
			var med_name := "First Aid Spray" if it.amount >= 100 else ("Green Herb" if it.amount >= 50 else "Medkit")
			msg_cb.call("%s +%d HP" % [med_name, it.amount], 2000)
		"lore":
			msg_cb.call(it.text, 6000)
		"weapon":
			var wname: String = it.weapon
			var idx := weapons.find_custom(func(w): return w.name == wname)
			if idx >= 0:
				weapon_index = idx
			else:
				weapons.append(LevelsData.weapon(wname))
				weapon_index = weapons.size() - 1
			weapon = weapons[weapon_index].duplicate()
			ammo_reserve += it.get("amount", 0)
			reload_weapon()
			msg_cb.call(wname + " acquired!", 2000)


func switch_weapon(i: int, msg_cb: Callable) -> void:
	if i < 0 or i >= weapons.size():
		return
	weapon_index = i
	weapon = weapons[weapon_index].duplicate()
	msg_cb.call("Switched to " + weapon.name, 2000)


# ---- Visual state (3D character rig; gameplay unchanged) --------------------
func update_visual(now: int, aim: Vector2, moving: bool) -> void:
	var p := world2
	var d := aim - p
	if now - last_hit < 200:
		rig.flash()

	# Muzzle flash + light, visible for MUZZLE_FLASH_MS after a shot.
	var muzzle_on: bool = now < _muzzle_until and weapon != null and not dead
	muzzle_sprite.visible = muzzle_on
	muzzle_light.visible = muzzle_on
	if muzzle_on:
		var aim_ang := atan2(d.y, d.x)
		var dist: float = size * (2.6 if weapon.name == "Shotgun" else 2.1)
		var flen: float = size * (0.9 + randf() * 0.4)
		var mpos := Vector3(cos(aim_ang) * dist, MODEL_HEIGHT * 0.55, sin(aim_ang) * dist)
		var gp: Vector3 = rig.prop_muzzle_position(
			Vector3(cos(aim_ang), 0, sin(aim_ang)), _muzzle_len) if rig != null else Vector3.INF
		if gp != Vector3.INF:
			mpos = to_local(gp)
		muzzle_sprite.position = mpos
		var mw := flen * 2.0
		var mh := mw * (float(muzzle_sprite.texture.get_height()) / muzzle_sprite.texture.get_width())
		muzzle_sprite.scale = Vector3(mw / muzzle_sprite.texture.get_width(), mh / muzzle_sprite.texture.get_height(), 1)
		muzzle_sprite.modulate.a = 1.0 - float(now - last_shot) / LevelsData.MUZZLE_FLASH_MS
		muzzle_light.position = muzzle_sprite.position

	# --- Death: fall, then hold the corpse pose (feeder zombies eat it) ---
	if dead:
		if now - death_start <= LevelsData.PLAYER_DEATH_ANIM_MS:
			rig.play("Death_A", 0.1)
		else:
			rig.play("Death_A_Pose", 0.4)
		return

	# --- Grab / knockdown / reload / shoot states ---
	if grabbed_by:
		rig.face(grabbed_by.world2 - p)
		match grab_phase:
			"grab":
				rig.play("Hit_A", 0.08)
			"struggle":
				rig.play("Hit_B", 0.15)
			"escape":
				rig.play("Dodge_Backward", 0.1)
			"biteNeck", "biteArm":
				rig.play("Hit_A", 0.05)
		return
	if knocked_down:
		match knock_phase:
			"thrown":
				rig.play("Death_B", 0.08)
			"impact":
				rig.play("Lie_Pose", 0.1)
			"getup":
				rig.play("Lie_StandUp", 0.1)
		return

	# Facing: armed characters aim at the cursor, unarmed face movement.
	var armed: bool = weapon != null
	_muzzle_len = 14.0
	if armed:
		var cfg: Dictionary = WEAPON_PROPS.get(weapon.name, {})
		if cfg.is_empty():
			rig.clear_prop()
			rig.set_attachment("2H_Crossbow")
		else:
			rig.set_attachment("")
			rig.show_prop(cfg.glb, cfg.slot, cfg.pos, cfg.rot, cfg.scale,
				cfg.get("tint", Color(1, 1, 1)))
			_muzzle_len = cfg.muzzle
	else:
		rig.set_attachment("")
		rig.clear_prop()
	if armed or not moving:
		rig.face(d if d.length() > 4.0 else facing)

	if reloading:
		rig.play("1H_Ranged_Reload", 0.12)
	elif armed and now - last_shot < 200:
		if _shot_anim_at != last_shot:
			_shot_anim_at = last_shot
			rig.play("1H_Ranged_Shoot", 0.05, true)
	elif moving:
		var move_anim := "Running_A" if speed > 90.0 else "Walking_A"
		if armed and move_anim == "Running_A" and rig.has_anim("Running_Armed"):
			move_anim = "Running_Armed"
		rig.play(move_anim, 0.15)
		if not armed:
			rig.face(facing)
	elif armed:
		rig.play("1H_Ranged_Aiming", 0.18)
	else:
		rig.play("Unarmed_Idle", 0.18)

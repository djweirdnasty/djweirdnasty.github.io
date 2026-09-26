class_name Zombie
extends CharacterBody3D

## Port of the JS zombie entity: wander/LOS-chase AI, separation steering,
## grab attack (normal) / throw attack (boss), corpse feeding and death
## animation. Position is the entity CENTER on the XZ plane.

const MODEL := "res://assets/models/Animated_Zombie.glb"
const BOSS_MODEL := "res://assets/models/Skeleton_Warrior.glb"
const MODEL_HEIGHT := 56.0
const MODEL_SRC_HEIGHT := 8.5   # measured render height of Animated_Zombie.glb
const BOSS_HEIGHT := 105.0

# Animation names on the Quaternius "Animated Zombie" rig.
const Z_IDLE := "Zombie|ZombieIdle"
const Z_WALK := "Zombie|ZombieWalk"
const Z_RUN := "Zombie|ZombieRun"
const Z_BITE := "Zombie|ZombieBite"
const Z_CRAWL := "Zombie|ZombieCrawl"

var size := 12.0
var speed := 45.0
var health := 3.0
var max_health := 3.0
var damage := 25.0
var attack_cooldown := 900
var last_attack := 0
var stagger := 0
var vel2 := Vector2.ZERO
var dying := false
var death_start := 0
var is_boss := false
var is_big_monster := false
var feeding_on_corpse := false
var is_feeder := false   # designated corpse-eater after the player dies
var spawn_index := 0

var world2: Vector2:
	get: return Vector2(position.x, position.z)
	set(v): position = Vector3(v.x, 0, v.y)

var rig: CharacterRig3D
var hp_bar: Sprite3D
var hp_fill: Sprite3D


func setup(def: Dictionary, lvl: Dictionary) -> void:
	# JS zombie spawn defs are top-left coords; store the center.
	size = def.get("size", 12)
	world2 = Vector2(def.x + size * 0.5, def.y + size * 0.5)
	speed = def.get("speed", lvl.get("zombie_speed", 45))
	health = def.get("health", lvl.get("zombie_health", 3))
	max_health = def.get("max_health", health)
	damage = def.get("damage", lvl.get("zombie_damage", 25))
	attack_cooldown = def.get("attack_cooldown", 900)
	is_boss = def.get("is_boss", false)
	is_big_monster = def.get("is_big_monster", false)


func _ready() -> void:
	add_to_group("zombies")
	collision_layer = 2
	collision_mask = 1
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(size, 30, size)
	shape.shape = box
	shape.position.y = 15
	add_child(shape)

	rig = CharacterRig3D.new()
	var h := BOSS_HEIGHT if is_big_monster else MODEL_HEIGHT
	if is_big_monster:
		rig.setup(BOSS_MODEL, h, Color(0.55, 0.8, 0.55))
		rig.set_looping(["Idle", "Idle_Combat", "Walking_D_Skeletons", "PickUp",
			"Hit_B", "Death_C_Pose", "Lie_Idle", "Lie_Pose"])
	else:
		rig.setup(MODEL, h, Color(1, 1, 1), MODEL_SRC_HEIGHT)
		rig.set_looping([Z_IDLE, Z_WALK, Z_RUN, Z_BITE, Z_CRAWL])
	add_child(rig)

	# Floating health bar (JS draws it above big monsters).
	var white := Image.create(1, 1, false, Image.FORMAT_RGBA8)
	white.fill(Color.WHITE)
	var wt := ImageTexture.create_from_image(white)
	hp_bar = Sprite3D.new()
	hp_bar.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	hp_bar.pixel_size = 1.0
	hp_bar.shaded = false
	hp_bar.texture = wt
	hp_bar.modulate = Color(0.05, 0.05, 0.05, 0.8)
	hp_bar.scale = Vector3(size * 2.5, 4, 1)
	hp_bar.position.y = h + 12
	add_child(hp_bar)
	hp_fill = Sprite3D.new()
	hp_fill.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	hp_fill.pixel_size = 1.0
	hp_fill.shaded = false
	hp_fill.texture = wt
	hp_fill.modulate = Color(0.1, 1.0, 0.15)
	hp_fill.scale = Vector3(size * 2.5, 4, 1)
	hp_fill.position.y = h + 12
	hp_fill.no_depth_test = true
	hp_fill.render_priority = 1
	hp_bar.no_depth_test = true
	add_child(hp_fill)


# AI — direct port of the zombie block in update(). Returns true if it wants
# to attack the player this frame (caller resolves grab vs throw).
func update_ai(dt: float, now: int, player, zombies: Array, can_see: Callable, feeder: bool) -> Variant:
	is_feeder = feeder
	if dying:
		return null
	var z := world2
	var p: Vector2 = player.world2
	var d := p - z
	var dist := d.length()

	# Feeding on a dead NPC — stays put until the player gets close.
	if feeding_on_corpse and not player.dead:
		if dist < 120.0:
			feeding_on_corpse = false
			return { "event": "stop_feeding" }
		vel2 = Vector2.ZERO
		return null

	if player.dead:
		# The designated feeder stays on the corpse; everyone else wanders off.
		if is_feeder:
			vel2 = Vector2.ZERO
			return null
		var a := now * 0.0005 + spawn_index * 2.39996
		var slow := 0.3 if now < stagger else 1.0
		var desired := Vector2(sin(a), cos(a)) * speed * slow
		vel2 = vel2.lerp(desired, 5.0 * dt)
		_clamp_speed()
		velocity = Vector3(vel2.x, 0, vel2.y)
		move_and_slide()
		return null

	var can_see_player: bool = dist < LevelsData.ZOMBIE_SIGHT_RANGE and can_see.call(z, p)
	var attack_range: float = player.size * 0.5 + size * 0.5 + 4.0

	var desired := Vector2.ZERO
	if can_see_player and dist > attack_range:
		desired = d / dist
	elif dist > attack_range:
		var a := now * 0.0005 + spawn_index * 2.3
		desired = Vector2(sin(a) * 0.4, cos(a * 1.3) * 0.4)

	# Separation from other zombies.
	for oz in zombies:
		if oz == self or oz.dying:
			continue
		var sd: Vector2 = z - oz.world2
		var sdist: float = sd.length()
		if sdist > 0.0 and sdist < size * 1.5:
			desired += sd / sdist * 1.5
	if desired.length() > 0.0:
		desired = desired.normalized()

	var accel := 5.0
	var slow := 0.3 if now < stagger else 1.0
	if dist > attack_range:
		vel2 = vel2.lerp(desired * speed * slow, accel * dt)
	else:
		vel2 *= 0.8
	_clamp_speed()
	velocity = Vector3(vel2.x, 0, vel2.y)
	move_and_slide()

	# Attack check.
	if not player.dead and player.grabbed_by == null and not player.knocked_down \
			and dist < attack_range and now - last_attack > attack_cooldown:
		last_attack = now
		return { "event": "attack", "boss": is_boss }
	return null


func _clamp_speed() -> void:
	if vel2.length() > speed:
		vel2 = vel2.normalized() * speed


func kill(now: int) -> void:
	dying = true
	death_start = now
	vel2 = Vector2.ZERO
	collision_layer = 0


func update_visual(now: int, player) -> void:
	var z := world2
	var p: Vector2 = player.world2
	var to_player := p - z

	if now < stagger:
		rig.flash()

	if dying:
		if is_big_monster:
			rig.play("Death_A" if now - death_start <= LevelsData.ZOMBIE_DEATH_ANIM_MS else "Death_A_Pose", 0.15)
		else:
			# Collapse into the crawl pose, then hold as a corpse.
			var t: float = minf(1.0, float(now - death_start) / LevelsData.ZOMBIE_DEATH_ANIM_MS)
			rig.pose(Z_CRAWL, 0.15 + 0.3 * t)
		return

	if is_big_monster:
		var bm_moving: bool = vel2.length() > 2.0
		if not player.dead and now - last_attack < 900:
			rig.face(to_player)
			rig.play("Throw", 0.1)
		elif bm_moving:
			rig.face(vel2)
			rig.play("Walking_D_Skeletons", 0.15)
		else:
			rig.face(to_player)
			rig.play("Idle_Combat", 0.2)
		_update_hp_bar()
		return
	hp_bar.visible = false
	hp_fill.visible = false

	if feeding_on_corpse or (player.dead and is_feeder):
		rig.play(Z_CRAWL, 0.2)  # crawling over the corpse, feeding
		return

	var moving: bool = vel2.length() > 2.0
	var holding_player: bool = player.grabbed_by == self

	if holding_player:
		rig.face(to_player)
		match player.grab_phase:
			"grab", "biteNeck", "biteArm":
				rig.play(Z_BITE, 0.08)
			_:
				rig.play(Z_IDLE, 0.15)
	elif not player.dead and now - last_attack < LevelsData.ZOMBIE_ATTACK_ANIM_MS:
		rig.face(to_player)
		rig.play(Z_BITE, 0.08)
	elif moving:
		rig.face(vel2)
		rig.play(Z_RUN if speed > 60.0 else Z_WALK, 0.15)
	else:
		rig.face(to_player)
		rig.play(Z_IDLE, 0.2)


func _update_hp_bar() -> void:
	hp_bar.visible = true
	hp_fill.visible = true
	var pct: float = maxf(0.0, health) / max_health
	hp_fill.scale.x = size * 2.5 * pct
	hp_fill.position.x = -(size * 2.5 - hp_fill.scale.x) * 0.5
	hp_fill.modulate = Color(0.1, 1.0, 0.15) if pct > 0.5 else (Color(1.0, 0.7, 0.1) if pct > 0.25 else Color(1.0, 0.1, 0.1))

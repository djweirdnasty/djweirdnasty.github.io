class_name Main
extends Node3D

## Orchestrates the Godot port of Youie — a direct translation of the update()
## loop, level management and game-state flow from resident_evil_proto.html.

const LAYER_WORLD := 1

@onready var world: WorldBuilder = $LevelRoot
@onready var entities: Node3D = $Entities
@onready var camera_rig: Node3D = $CameraRig
@onready var camera: Camera3D = $CameraRig/Camera3D
@onready var hud: HUD = $HUD
@onready var crosshair: MeshInstance3D = $Crosshair

var player: Player
var zombies: Array = []
var bullets: Array = []

# ---- Game state (mirrors the JS globals) ----
var current_level := 0
var walls: Array = []              # [{x,y,w,h, hp?, max_hp?, breakable?, contains?, body, mesh}]
var door := {}
var door_body: StaticBody3D
var door_mesh: MeshInstance3D
var grey_door = null               # {x,y,w,h,opened,body,mesh}
var item_doors: Array = []         # [{x,y,w,h,opened,locked,contains,body,mesh}]
var items: Array = []              # [{type,x,y,size,...,taken,node}]
var corpse_scene = null            # {x,y,zombie}
var corpse_bodies: Array = []      # [{x,y}]
var feeding_zombie = null
var level_states := {}
var pending_big_monsters := {}
var level_zombies: Array = []

var game_started := false
var cutscene_active := false
var intro_shown := false
var game_beaten := false

var aim := Vector2(400, 240)       # world-space aim point
var moving := false
var current_interactable = null
var message := ""
var message_until := 0


func _ready() -> void:
	_register_input()
	game_beaten = FileAccess.file_exists("user://youie-winner.save")

	player = Player.new()
	player.died.connect(_on_player_died)
	entities.add_child(player)

	_make_crosshair()
	_touch_ui = load("res://scripts/touch_ui.gd").new()
	_touch_ui.visible = _has_touch()
	hud.add_child(_touch_ui)
	hud.title_screen.visible = true
	hud.title_screen.gui_input.connect(_on_title_input)
	if "--smoke" in OS.get_cmdline_args() or "--smoke" in OS.get_cmdline_user_args():
		call_deferred("_smoke_test")
	elif "--autostart" in OS.get_cmdline_args() or "--autostart" in OS.get_cmdline_user_args():
		# Skip title + intro cutscene (dev/verification convenience).
		intro_shown = true
		call_deferred("restart")
	if "--shot" in OS.get_cmdline_args():
		_shot_at = 150
	for i in OS.get_cmdline_args().size():
		if OS.get_cmdline_args()[i] == "--shot-level" and i + 1 < OS.get_cmdline_args().size():
			_shot_level = int(OS.get_cmdline_args()[i + 1])


var _shot_at := -1
var _frame := 0
var _shot_level := -1


# Headless smoke test: exercises restart, all 10 level builds, shooting,
# zombie AI, pickups and the win path. Run with --smoke.
func _smoke_test() -> void:
	intro_shown = true
	restart()
	await get_tree().physics_frame
	await get_tree().physics_frame
	print("SMOKE start: level=", current_level, " walls=", walls.size(), " items=", items.size(), " zombies=", zombies.size())
	# Move + shoot.
	Input.action_press("move_right")
	await get_tree().create_timer(0.3).timeout
	Input.action_release("move_right")
	aim = Vector2(400, 240)
	player.weapons.append(LevelsData.weapon("Pistol"))
	player.weapon_index = 0
	player.weapon = player.weapons[0].duplicate()
	player.ammo = 12
	shoot()
	await get_tree().create_timer(0.2).timeout
	print("SMOKE shot fired, bullets=", bullets.size(), " ammo=", player.ammo)
	# Collect key, unlock, walk out the door.
	for it in items:
		if it.type == "key" and not it.taken:
			collect_item(it, LevelsData.LEVELS[current_level])
	player.keys = 99
	_update_door_visual()
	player.world2 = Vector2(610, 220)
	await get_tree().physics_frame
	await get_tree().physics_frame
	print("SMOKE after exit: level=", current_level, " zombies=", zombies.size())
	# Let AI run a moment on a populated level.
	await get_tree().create_timer(1.0).timeout
	print("SMOKE ai ok, zombie hp sample=", zombies[0].health if zombies.size() > 0 else -1)
	# Grab state machine on level 2 (has zombies).
	next_level()
	await get_tree().process_frame
	if zombies.size() > 0:
		var z: Zombie = zombies[0]
		z.last_attack = 0
		player.world2 = z.world2
		await get_tree().create_timer(0.1).timeout
		print("SMOKE grab phase=", player.grab_phase)
		await get_tree().create_timer(0.6).timeout
		print("SMOKE struggle phase=", player.grab_phase)
		player.mash_count = 99
		await get_tree().create_timer(0.7).timeout
		print("SMOKE post-grab phase=", player.grab_phase, " grabbed=", player.grabbed_by != null)
	# Walk every remaining level.
	for i in range(3, 10):
		next_level()
		await get_tree().process_frame
		print("SMOKE level=", current_level, " zombies=", zombies.size(), " walls=", walls.size(), " items=", items.size(), " grey_door=", grey_door != null, " item_doors=", item_doors.size())
	# Win.
	next_level()
	await get_tree().process_frame
	print("SMOKE won=", player.won)
	print("SMOKE DONE")


func _register_input() -> void:
	var binds := {
		"move_up": [KEY_W, KEY_UP],
		"move_down": [KEY_S, KEY_DOWN],
		"move_left": [KEY_A, KEY_LEFT],
		"move_right": [KEY_D, KEY_RIGHT],
		"interact": [KEY_E],
		"reload": [KEY_R],
		"mash": [KEY_SPACE],
		"weapon_1": [KEY_1], "weapon_2": [KEY_2], "weapon_3": [KEY_3], "weapon_4": [KEY_4],
		"fullscreen": [KEY_F11],
	}
	for action in binds:
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		for key in binds[action]:
			var ev := InputEventKey.new()
			ev.physical_keycode = key
			InputMap.action_add_event(action, ev)
	if not InputMap.has_action("shoot"):
		InputMap.add_action("shoot")
	var mb := InputEventMouseButton.new()
	mb.button_index = MOUSE_BUTTON_LEFT
	InputMap.action_add_event("shoot", mb)


func _make_crosshair() -> void:
	var torus := TorusMesh.new()
	torus.inner_radius = 4.0
	torus.outer_radius = 6.0
	crosshair.mesh = torus
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(0, 1, 0)
	m.emission_enabled = true
	m.emission = Color(0, 1, 0)
	m.emission_energy_multiplier = 1.5
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	crosshair.material_override = m
	crosshair.rotation_degrees.x = 90
	crosshair.position.y = 1.0


var _touch_ui: Control = null
var _aim_suppress_pos := Vector2(-9999, -9999)

# is_touchscreen_available() is unreliable on the web export, so also
# probe navigator.maxTouchPoints and lazily reveal the controls on the
# first real touch event.
func _has_touch() -> bool:
	if "--touch" in OS.get_cmdline_args() or DisplayServer.is_touchscreen_available():
		return true
	if OS.has_feature("web"):
		return float(JavaScriptBridge.eval("navigator.maxTouchPoints || 0")) > 0
	return false


func _on_title_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		restart()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("fullscreen"):
		var mode := DisplayServer.window_get_mode()
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED if mode == DisplayServer.WINDOW_MODE_FULLSCREEN else DisplayServer.WINDOW_MODE_FULLSCREEN)
	if event.is_action_pressed("shoot"):
		if not game_started or player.dead or player.won:
			if hud.title_screen.visible:
				return
			restart()
			return
		shoot()
	if event.is_action_pressed("mash") and game_started and not player.dead and not player.won:
		if player.grab_phase == "struggle" or player.knock_phase == "getup":
			player.mash_count += 1
	if event.is_action_pressed("interact"):
		do_interact()
	if event.is_action_pressed("reload"):
		if not game_started or player.dead or player.won:
			restart()
		elif player.start_reload(Time.get_ticks_msec()):
			show_message("Reloading...")
	for i in 4:
		if event.is_action_pressed("weapon_%d" % (i + 1)) and i < player.weapons.size():
			player.switch_weapon(i, show_message)


# ---------------------------------------------------------------------------
# Game flow — restart / respawn / level transitions (ports of the JS fns)
# ---------------------------------------------------------------------------

func restart() -> void:
	if cutscene_active:
		return
	if player.dead:
		respawn()
		return
	game_started = true
	hud.title_screen.visible = false
	hud.cutscene_panel.visible = false
	hud.win_panel.visible = false
	current_level = 0
	level_states = {}
	pending_big_monsters = {}
	var start0: Dictionary = LevelsData.LEVELS[0].start
	player.reset_state(Vector2(start0.x, start0.y), game_beaten)
	# player.reset_state sets pos at level start; loadLevel will place it.
	if intro_shown:
		load_level(0, game_beaten)
	else:
		intro_shown = true
		show_cutscene(LevelsData.INTRO_TEXT, func(): load_level(0, game_beaten))


func respawn() -> void:
	game_started = true
	hud.title_screen.visible = false
	hud.cutscene_panel.visible = false
	hud.win_panel.visible = false
	player.dead = false
	feeding_zombie = null
	corpse_scene = null
	corpse_bodies = []
	player.health = player.max_health
	player.last_hit = 0
	player.reset_combat()
	save_level_state(current_level)
	current_level = 0
	load_level(0, true, "")
	show_message("Respawned in Safe Room.", 3000)


func next_level() -> void:
	save_level_state(current_level)
	current_level += 1
	if current_level >= LevelsData.LEVELS.size():
		player.won = true
		game_beaten = true
		var f := FileAccess.open("user://youie-winner.save", FileAccess.WRITE)
		if f: f.store_string("true"); f.close()
		show_message("ALL LEVELS CLEARED! Press R to restart.", 5000)
		show_cutscene(LevelsData.ENDING_TEXT, func(): hud.win_panel.visible = true)
	else:
		load_level(current_level, true, "left")
		show_message("Level %d cleared. Next floor." % (current_level + 1), 3000)


func prev_level() -> void:
	if current_level <= 0:
		return
	save_level_state(current_level)
	current_level -= 1
	load_level(current_level, true, "right")
	show_message("Back to floor %d" % (current_level + 1), 2000)


func show_cutscene(text: String, cb: Callable) -> void:
	cutscene_active = true
	game_started = false
	hud.show_cutscene(text, func():
		cutscene_active = false
		game_started = true
		cb.call())


func _on_player_died() -> void:
	pass  # feeding_zombie was already assigned at the attack site


# ---------------------------------------------------------------------------
# Level save / load — ports of saveLevelState() and loadLevel()
# ---------------------------------------------------------------------------

func save_level_state(n: int) -> void:
	if n < 0 or n >= LevelsData.LEVELS.size():
		return
	var zs: Array = []
	for z in zombies:
		zs.append({
			"x": z.world2.x - z.size * 0.5, "y": z.world2.y - z.size * 0.5,
			"size": z.size, "speed": z.speed, "health": z.health, "max_health": z.max_health,
			"damage": z.damage, "attack_cooldown": z.attack_cooldown,
			"is_boss": z.is_boss, "is_big_monster": z.is_big_monster,
			"feeding_on_corpse": z.feeding_on_corpse,
		})
	var its: Array = []
	for it in items:
		var d: Dictionary = it.duplicate()
		d.erase("node")
		its.append(d)
	var ws: Array = []
	for w in walls:
		ws.append({ "x": w.x, "y": w.y, "w": w.w, "h": w.h,
			"hp": w.get("hp", 0), "max_hp": w.get("max_hp", 0),
			"breakable": w.get("breakable", false), "contains": w.get("contains") })
	var ids: Array = []
	for d in item_doors:
		ids.append({ "x": d.x, "y": d.y, "w": d.w, "h": d.h, "opened": d.opened, "locked": d.locked, "contains": d.contains })
	level_states[n] = {
		"items": its, "walls": ws, "item_doors": ids, "zombies": zs,
		"corpse_scene": { "x": corpse_scene.x, "y": corpse_scene.y } if corpse_scene else null,
		"corpse_bodies": corpse_bodies.duplicate(),
		"keys": player.keys, "grey_keys": player.grey_keys, "master_keys": player.master_keys,
		"grey_door": { "x": grey_door.x, "y": grey_door.y, "w": grey_door.w, "h": grey_door.h, "opened": grey_door.opened } if grey_door else null,
	}


func load_level(n: int, preserve := false, from := "") -> void:
	current_level = n
	var lvl: Dictionary = LevelsData.LEVELS[current_level]

	# Clear previous level.
	world.clear()
	for z in zombies: z.queue_free()
	for b in bullets: b.queue_free()
	zombies = []
	bullets = []
	items = []
	item_doors = []
	corpse_bodies = []
	corpse_scene = null
	grey_door = null

	var st = level_states.get(current_level)
	var fresh := st == null

	# --- Walls ---
	var base_walls := LevelsData.level_walls(lvl)
	if not fresh and st.has("walls"):
		walls = []
		for w in st.walls:
			walls.append({ "x": w.x, "y": w.y, "w": w.w, "h": w.h,
				"hp": w.get("hp", 0), "max_hp": w.get("max_hp", w.get("hp", 0)),
				"breakable": w.get("breakable", false), "contains": w.get("contains") })
	else:
		walls = base_walls
		for w in LevelsData.SECRET_WALLS[current_level]:
			walls.append({ "x": w.x, "y": w.y, "w": w.w, "h": w.h,
				"hp": w.hp, "max_hp": w.hp, "breakable": true, "contains": w.contains })

	world.build_floor(lvl.get("theme", "office"))
	for w in walls:
		var body := world.build_wall(w)
		w.body = body
		w.mesh = body.get_child(1)
		if w.get("breakable") and w.hp < w.max_hp * 0.5:
			w.mesh.material_override = world.wall_break_dmg_mat

	# --- Exit door (blocks until enough keys) ---
	door = lvl.door.duplicate()
	door_body = world.build_door(door, world.door_mat)
	door_mesh = door_body.get_child(1)
	world.build_door_frame(door)
	_update_door_visual()

	# --- Items ---
	if not fresh:
		for it in st.items:
			items.append(it.duplicate())
		item_doors = []
		if current_level % 3 == 0 and current_level + 4 < LevelsData.LEVELS.size() and st.has("item_doors"):
			for d in st.item_doors:
				item_doors.append(d.duplicate())
	else:
		for it in lvl.items:
			var d: Dictionary = it.duplicate()
			d.taken = false
			items.append(d)
		# Locked loot box every 3rd level.
		if current_level % 3 == 0 and current_level + 4 < LevelsData.LEVELS.size():
			var sx: float = 60 if current_level == 0 else lvl.start.x + 40
			var sy: float = 100 if current_level == 0 else lvl.start.y
			item_doors = [{ "x": sx, "y": sy, "w": 16, "h": 40, "opened": false, "locked": true,
				"contains": LevelsData.ITEM_DOOR_LOOT[current_level] }]

	# Master key / lore / loot key injections.
	var mkey = LevelsData.MASTER_KEY_SPAWNS[current_level]
	if mkey != null and not items.any(func(i): return i.type == "masterKey"):
		items.append({ "type": "masterKey", "x": mkey.x, "y": mkey.y, "size": 8, "taken": false })
	if current_level < LevelsData.LORE_NOTES.size() and not items.any(func(i): return i.type == "lore"):
		var ln = LevelsData.LORE_NOTES[current_level]
		items.append({ "type": "lore", "x": ln.x, "y": ln.y, "size": 8, "text": ln.text, "taken": false })
	if current_level >= 4 and (current_level - 4) % 3 == 0 and not items.any(func(i): return i.type == "lootKey" and i.get("target_level") == current_level - 4):
		items.append({ "type": "lootKey", "x": 300, "y": 120, "size": 8, "target_level": current_level - 4, "taken": false })

	for it in items:
		if not it.taken:
			it.node = world.build_item(it)

	# --- Grey door ---
	if not fresh and st.has("grey_door") and st.grey_door != null:
		grey_door = st.grey_door.duplicate()
	elif lvl.has("grey_door"):
		grey_door = lvl.grey_door.duplicate()
		grey_door.opened = false
	if grey_door:
		grey_door.body = world.build_door(grey_door, world.grey_door_mat)
		grey_door.mesh = grey_door.body.get_child(1)

	# --- Item doors (loot boxes) ---
	for d in item_doors:
		d.body = world.build_door(d, world.loot_box_mat)
		d.mesh = d.body.get_child(1)
		d.mesh.scale = Vector3(1, 0.45, 1)

	# --- Decorations ---
	for d in lvl.get("decorations", []):
		world.build_decoration(d)

	# --- Zombies ---
	if not fresh and st.has("zombies"):
		for zd in st.zombies:
			_spawn_zombie(zd, lvl)
	else:
		var count: int = 0 if current_level == 0 else 2 * current_level - 1
		var idx := 0
		for zd in lvl.zombies:
			if idx >= count:
				break
			_spawn_zombie(zd, lvl)
			idx += 1
	# Pending big monsters queued by loot keys.
	if pending_big_monsters.has(current_level):
		for bm in pending_big_monsters[current_level]:
			_spawn_zombie(bm, lvl)
		pending_big_monsters.erase(current_level)

	# --- Feeding scene ---
	if not fresh and st.get("corpse_scene"):
		var saved = st.corpse_scene
		var feeder = zombies.filter(func(z): return z.feeding_on_corpse)
		if feeder.size() > 0:
			corpse_scene = { "x": saved.x, "y": saved.y, "zombie": feeder[0] }
	elif lvl.has("feeding_scene") and zombies.size() > 0:
		var fs = lvl.feeding_scene
		var best: Zombie = null
		var best_dist := INF
		for z in zombies:
			var dd: float = (z.world2 - Vector2(fs.x, fs.y)).length()
			if dd < best_dist:
				best_dist = dd
				best = z
		if best:
			best.world2 = Vector2(fs.x, fs.y)
			best.feeding_on_corpse = true
			corpse_scene = { "x": fs.x, "y": fs.y, "zombie": best }
			world.build_corpse(fs.x, fs.y)

	# --- Corpse bodies ---
	if not fresh:
		for b in st.get("corpse_bodies", []):
			corpse_bodies.append(b)
	for b in corpse_bodies:
		world.build_corpse(b.x, b.y)

	# --- Player placement (JS: player.x = returnDoor.x - player.size etc.,
	# converted here to center coordinates) ---
	if from == "left":
		player.world2 = Vector2(LevelsData.RETURN_DOOR.x - player.size * 0.5, LevelsData.RETURN_DOOR.y + LevelsData.RETURN_DOOR.h * 0.5)
	elif from == "right":
		player.world2 = Vector2(door.x - player.size * 0.5, door.y + door.h * 0.5)
	else:
		player.world2 = Vector2(lvl.start.x + player.size * 0.5, lvl.start.y + player.size * 0.5)
	if not preserve:
		player.weapons = []
		player.weapon_index = -1
		player.weapon = null
	elif player.weapon_index >= 0 and player.weapon_index < player.weapons.size():
		player.weapon = player.weapons[player.weapon_index].duplicate()

	if game_started:
		var back_hint := " Press LEFT to go back." if current_level > 0 else ""
		show_message("%s: %s%s" % [lvl.name, ("Find %d keys." % lvl.keys_needed) if lvl.keys_needed > 1 else "Find the key. Escape.", back_hint], 3000)


func _spawn_zombie(def: Dictionary, lvl: Dictionary) -> Zombie:
	var z := Zombie.new()
	z.setup(def, lvl)
	z.feeding_on_corpse = def.get("feeding_on_corpse", false)
	entities.add_child(z)
	z.spawn_index = zombies.size()
	zombies.append(z)
	return z


func _update_door_visual() -> void:
	var lvl: Dictionary = LevelsData.LEVELS[current_level]
	var unlocked: bool = player.keys >= lvl.keys_needed
	door_body.collision_layer = 0 if unlocked else LAYER_WORLD
	door_mesh.material_override = world.door_open_mat if unlocked else world.door_mat


# ---------------------------------------------------------------------------
# Interaction & items
# ---------------------------------------------------------------------------

func is_container_linked(lvl: Dictionary, it: Dictionary) -> bool:
	for d in lvl.get("decorations", []):
		if not d.type in LevelsData.CONTAINER_TYPES:
			continue
		var dc := Vector2(d.x + d.w * 0.5, d.y + d.h * 0.5)
		if Vector2(it.x, it.y).distance_to(dc) < LevelsData.INTERACT_RANGE:
			return true
	return false


func find_interactable(lvl: Dictionary) -> Variant:
	var p := player.world2
	var best = null
	var best_d: float = LevelsData.INTERACT_RANGE
	for d in lvl.get("decorations", []):
		var dc := Vector2(d.x + d.w * 0.5, d.y + d.h * 0.5)
		var dist := p.distance_to(dc)
		if dist > best_d:
			continue
		if d.type == "blood" or d.type == "bloodTrail":
			best = { "kind": "blood", "d": d }
			best_d = dist
		elif d.type in LevelsData.CONTAINER_TYPES:
			var found = null
			for it in items:
				if not it.taken and Vector2(it.x, it.y).distance_to(dc) < LevelsData.INTERACT_RANGE:
					found = it
					break
			if found:
				best = { "kind": "container", "d": d, "item": found }
				best_d = dist
	return best


func do_interact() -> void:
	if not game_started or player.dead or player.won or current_interactable == null:
		return
	if current_interactable.kind == "blood":
		show_message(LevelsData.BLOOD_FLAVOR_TEXT[randi() % LevelsData.BLOOD_FLAVOR_TEXT.size()], 2500)
	elif current_interactable.kind == "container":
		collect_item(current_interactable.item, LevelsData.LEVELS[current_level])
		current_interactable = null


func interact_prompt_text() -> String:
	if current_interactable == null:
		return ""
	if current_interactable.kind == "blood":
		return "[E] Inspect"
	return "[E] Search " + LevelsData.CONTAINER_LABELS.get(current_interactable.d.type, "Container")


func collect_item(it: Dictionary, lvl: Dictionary) -> void:
	it.taken = true
	if it.has("node") and is_instance_valid(it.node):
		it.node.queue_free()
	if it.type == "lootKey":
		show_message("Loot key acquired! Something big is coming...", 2000)
		var target: int = it.target_level
		var nxt := current_level + 1
		if not pending_big_monsters.has(target):
			pending_big_monsters[target] = []
		var bm0 = LevelsData.BIG_MONSTER_DEF.duplicate()
		bm0.x = 80; bm0.y = 200
		pending_big_monsters[target].append(bm0)
		if level_states.has(target) and level_states[target].has("item_doors") and level_states[target].item_doors.size() > 0:
			level_states[target].item_doors[0].locked = false
			var d = level_states[target].item_doors[0]
			var bm = LevelsData.BIG_MONSTER_DEF.duplicate()
			bm.x = d.x + d.w + 20
			bm.y = d.y
			if not level_states[target].has("zombies"):
				level_states[target].zombies = []
			level_states[target].zombies.append(bm)
		if nxt < LevelsData.LEVELS.size():
			if not pending_big_monsters.has(nxt):
				pending_big_monsters[nxt] = []
			var bm2 = LevelsData.BIG_MONSTER_DEF.duplicate()
			bm2.x = 300; bm2.y = 240
			pending_big_monsters[nxt].append(bm2)
		return
	player.collect(it, show_message, lvl)
	if it.type == "key":
		_update_door_visual()


# ---------------------------------------------------------------------------
# Shooting / bullets
# ---------------------------------------------------------------------------

func shoot() -> void:
	var def = player.try_shoot(Time.get_ticks_msec(), aim, func(): show_message("Out of ammo!"))
	if def == null:
		return
	var b := Bullet.new()
	entities.add_child(b)
	b.setup(def)
	bullets.append(b)


func auto_aim() -> Vector2:
	var p := player.world2
	var best := INF
	var t := aim
	for z in zombies:
		var dd: float = p.distance_to(z.world2)
		if dd < best:
			best = dd
			t = z.world2
	return t


func _rect_hit(ax: float, ay: float, aw: float, ah: float, w: Dictionary) -> bool:
	return ax < w.x + w.w and ax + aw > w.x and ay < w.y + w.h and ay + ah > w.y


func _player_rect() -> Dictionary:
	var p := player.world2
	return { "x": p.x - player.size * 0.5, "y": p.y - player.size * 0.5, "w": player.size, "h": player.size }


# ---------------------------------------------------------------------------
# Line of sight — direct port of canSee() segment/rect intersection
# ---------------------------------------------------------------------------

func _seg_intersects(a: Vector2, b: Vector2, c: Vector2, d: Vector2) -> bool:
	var denom: float = (d.y - c.y) * (b.x - a.x) - (d.x - c.x) * (b.y - a.y)
	if denom == 0.0:
		return false
	var ua: float = ((d.x - c.x) * (a.y - c.y) - (d.y - c.y) * (a.x - c.x)) / denom
	var ub: float = ((b.x - a.x) * (a.y - c.y) - (b.y - a.y) * (a.x - c.x)) / denom
	return ua >= 0.0 and ua <= 1.0 and ub >= 0.0 and ub <= 1.0


func _seg_rect(a: Vector2, b: Vector2, w: Dictionary) -> bool:
	var tl := Vector2(w.x, w.y)
	var tr := Vector2(w.x + w.w, w.y)
	var br := Vector2(w.x + w.w, w.y + w.h)
	var bl := Vector2(w.x, w.y + w.h)
	return _seg_intersects(a, b, tl, tr) or _seg_intersects(a, b, tr, br) \
		or _seg_intersects(a, b, br, bl) or _seg_intersects(a, b, bl, tl)


func can_see(a: Vector2, b: Vector2) -> bool:
	for w in walls:
		if _seg_rect(a, b, w):
			return false
	if grey_door and not grey_door.opened and _seg_rect(a, b, grey_door):
		return false
	return true


func has_exited() -> bool:
	var p := player.world2
	if door.x + door.w >= LevelsData.WORLD.x - 40:
		return p.x > door.x + door.w
	if door.x <= 40:
		return p.x < door.x
	if door.y <= 40:
		return p.y < door.y
	if door.y + door.h >= LevelsData.WORLD.y - 40:
		return p.y > door.y + door.h
	return false


func show_message(text: String, time := 2000) -> void:
	message = text
	message_until = Time.get_ticks_msec() + time


# ---------------------------------------------------------------------------
# Per-frame update — port of update() / draw() logic
# ---------------------------------------------------------------------------

func _process(delta: float) -> void:
	var now := Time.get_ticks_msec()
	_frame += 1
	if "--shot-close" in OS.get_cmdline_args():
		if _frame == 5:
			camera.position = Vector3(0, 220, 170)
			var dl := OmniLight3D.new()
			dl.light_energy = 3.0
			dl.omni_range = 300.0
			dl.position = Vector3(0, 120, 0)
			player.add_child(dl)
	if _shot_level >= 0 and _frame == 30:
		player.keys = 99
		load_level(_shot_level, true)
		player.world2 = Vector2(320, 300)
	var wargs := OS.get_cmdline_args()
	for i in wargs.size():
		if wargs[i] == "--shot-weapon" and i + 1 < wargs.size() and _frame == 35:
			player.weapons = [LevelsData.weapon(wargs[i + 1])]
			player.weapon_index = 0
			player.weapon = player.weapons[0].duplicate()
			player.ammo = 12; player.ammo_reserve = 30
	if _shot_at > 0 and _frame >= _shot_at:
		_shot_at = -1
		var img := get_viewport().get_texture().get_image()
		img.save_png("/tmp/youie_shot.png")
		print("SHOT saved /tmp/youie_shot.png")
		print("SHOTDBG player=", player.position, " cam_rig=", camera_rig.position,
			" model_gp=", player.rig.model.global_position if player.rig and player.rig.model else null,
			" anim=", player.rig.current if player.rig else "none",
			" model_vis=", player.rig.model.visible if player.rig and player.rig.model else null)

	# Aim: project mouse ray onto the ground plane (y=0). Skip while the
	# touch UI is handling a finger — otherwise stick/button touches swing
	# the crosshair (and facing) to the bottom of the screen. The emulated
	# mouse position lingers after the finger lifts, so also skip while it
	# still equals the position held at release.
	var mouse := get_viewport().get_mouse_position()
	var aim_ok := true
	if _touch_ui != null:
		if _touch_ui.is_capturing():
			_aim_suppress_pos = mouse
			aim_ok = false
		elif mouse == _aim_suppress_pos:
			aim_ok = false
		else:
			_aim_suppress_pos = Vector2(-9999, -9999)
	if aim_ok:
		var ro := camera.project_ray_origin(mouse)
		var rn := camera.project_ray_normal(mouse)
		if rn.y != 0.0:
			var t := -ro.y / rn.y
			if t > 0.0:
				var hit := ro + rn * t
				aim = Vector2(clampf(hit.x, 0, LevelsData.WORLD.x), clampf(hit.z, 0, LevelsData.WORLD.y))
	crosshair.position = Vector3(aim.x, 1.0, aim.y)

	# Camera follows the player (JS lerp 0.1), clamped to the world.
	var p := player.world2
	camera_rig.position = camera_rig.position.lerp(Vector3(p.x, 0, p.y), 0.1)
	camera.look_at(camera_rig.position + Vector3(0, 0, 30))

	if game_started:
		player.update_visual(now, aim, moving and player.can_act())
		for z in zombies:
			z.update_visual(now, player)

	# Item pickups bob and spin.
	for it in items:
		if it.has("node") and is_instance_valid(it.node) and not it.taken:
			it.node.rotation.y += delta * 1.5
			it.node.position.y = 6.0 + sin(now * 0.003 + it.x) * 2.0

	# HUD.
	var lvl: Dictionary = LevelsData.LEVELS[mini(current_level, LevelsData.LEVELS.size() - 1)]
	hud.set_health(player.health, player.max_health)
	var ammo_mag = player.ammo
	var ammo_res = player.ammo_reserve
	hud.set_info(current_level + 1, lvl.name, player.health, ammo_mag, ammo_res, player.keys, lvl.keys_needed, player.weapon.name if player.weapon else "NONE")
	if now > message_until:
		message = ""
	hud.set_message(message)
	hud.set_interact(interact_prompt_text() if game_started and not player.dead and not player.won else "")
	if player.grab_phase == "struggle":
		hud.show_mash(true, float(player.mash_count) / LevelsData.STRUGGLE_MASH_NEEDED, "MASH SPACE!")
	elif player.knock_phase == "getup":
		hud.show_mash(true, float(player.mash_count) * 100.0 / LevelsData.GETUP_BASE_MS, "MASH SPACE TO GET UP!")
	else:
		hud.show_mash(false, 0)
	if player.reloading:
		hud.show_reload(true, float(now - player.reload_start) / LevelsData.RELOAD_MS)
	else:
		hud.show_reload(false, 0)


func _physics_process(dt: float) -> void:
	if not game_started or player.dead or player.won:
		return
	var now := Time.get_ticks_msec()
	var lvl: Dictionary = LevelsData.LEVELS[current_level]

	# --- Player movement ---
	var dir := Vector2(
		Input.get_axis("move_left", "move_right"),
		Input.get_axis("move_up", "move_down"))
	if "--shot-walk" in OS.get_cmdline_args() and _frame > 40 and _frame < 140:
		dir = Vector2(0.7, 0.7)
		aim = player.world2 + Vector2(-150, -60)
	moving = dir != Vector2.ZERO and player.can_act()
	player.move_input(dir, dt)
	player.combat_update(now, show_message)

	var prect := _player_rect()

	# --- Locked-door message (the body itself blocks movement) ---
	if player.keys < lvl.keys_needed and _rect_hit(prect.x, prect.y, prect.w, prect.h, door):
		show_message("Locked. Need %d keys." % lvl.keys_needed)

	if player.keys >= lvl.keys_needed and has_exited():
		next_level()
		return

	# --- Return door ---
	if current_level > 0 and dir.x < 0 and player.world2.x < LevelsData.RETURN_DOOR.x:
		prev_level()
		return

	# --- Grey door ---
	if grey_door and not grey_door.opened and _rect_hit(prect.x, prect.y, prect.w, prect.h, grey_door):
		if player.master_keys > 0:
			grey_door.opened = true
			grey_door.body.collision_layer = 0
			show_message("Master key opens the door!")
		elif player.grey_keys > 0:
			grey_door.opened = true
			player.grey_keys -= 1
			grey_door.body.collision_layer = 0
			show_message("Grey door unlocked!")
		else:
			show_message("Locked. Need a key.")

	# --- Item doors (loot boxes) ---
	for d in item_doors:
		if d.opened:
			continue
		if _rect_hit(prect.x, prect.y, prect.w, prect.h, d):
			if d.locked:
				show_message("Locked. Need loot key.")
				continue
			d.opened = true
			d.body.collision_layer = 0
			d.mesh.visible = false
			var contains: Dictionary = d.contains.duplicate()
			contains.x = d.x + d.w * 0.5
			contains.y = d.y + d.h * 0.5
			contains["size"] = contains.get("size", 8)
			contains.taken = false
			contains.node = world.build_item(contains)
			items.append(contains)

	# --- Item pickup ---
	for it in items:
		if it.taken or is_container_linked(lvl, it):
			continue
		var isz: float = it.get("size", 8)
		var ir := Rect2(it.x - isz, it.y - isz, isz * 2, isz * 2)
		if ir.intersects(Rect2(prect.x, prect.y, prect.w, prect.h)):
			collect_item(it, lvl)

	# --- Interact prompt ---
	current_interactable = find_interactable(lvl)

	# --- Zombies ---
	for i in range(zombies.size() - 1, -1, -1):
		var z: Zombie = zombies[i]
		if z.dying:
			if now - z.death_start > LevelsData.ZOMBIE_DEATH_ANIM_MS:
				zombies.remove_at(i)
				z.queue_free()
			continue
		var ev = z.update_ai(dt, now, player, zombies, can_see, z == feeding_zombie)
		if ev == null:
			continue
		if ev.event == "stop_feeding":
			corpse_scene = null
			corpse_bodies.append({ "x": z.world2.x, "y": z.world2.y })
			world.build_corpse(z.world2.x, z.world2.y)
			show_message("The zombie noticed you!", 2000)
		elif ev.event == "attack":
			if ev.boss:
				player.knocked_down = true
				player.knock_phase = "thrown"
				player.knock_start = now
				player.health -= z.damage
				player.last_hit = now
				if player.health <= 0:
					feeding_zombie = z
					player.knocked_down = false
					player.knock_phase = null
					player.die(now)
					show_message("YOU DIED. Press R to respawn.", 5000)
			else:
				player.grabbed_by = z
				player.grab_phase = "grab"
				player.grab_phase_start = now
				player.mash_count = 0
				feeding_zombie = z
				show_message("Mash SPACE to break free!", LevelsData.STRUGGLE_WINDOW_MS + LevelsData.GRAB_MS)

	# --- Bullets ---
	for i in range(bullets.size() - 1, -1, -1):
		var b: Bullet = bullets[i]
		var np := b.world2 + b.vel * dt
		b.world2 = np
		b.life -= dt
		var remove := np.x < 0 or np.y < 0 or np.x > LevelsData.WORLD.x or np.y > LevelsData.WORLD.y or b.life <= 0.0
		var direct_hit = null
		for wi in range(walls.size() - 1, -1, -1):
			var w = walls[wi]
			if _rect_hit(np.x - b.size * 0.5, np.y - b.size * 0.5, b.size, b.size, w):
				if w.get("breakable"):
					w.hp -= b.damage
					if w.hp <= 0:
						w.body.queue_free()
						walls.remove_at(wi)
						if w.get("contains"):
							var reward: Dictionary = w.contains.duplicate()
							reward.x = w.x + w.w * 0.5
							reward.y = w.y + w.h * 0.5
							reward["size"] = reward.get("size", 8)
							reward.taken = false
							reward.node = world.build_item(reward)
							items.append(reward)
						show_message("Secret wall destroyed!")
					elif w.hp < w.max_hp * 0.5:
						w.mesh.material_override = world.wall_break_dmg_mat
				remove = true
				break
		if not remove:
			for z in zombies:
				if z.dying:
					continue
				var zw: float = z.size * 0.5 + b.size * 0.5
				if absf(np.x - z.world2.x) < zw and absf(np.y - z.world2.y) < zw:
					z.health -= b.damage
					z.stagger = now + 300
					z.vel2 += b.vel * 0.15
					remove = true
					direct_hit = z
					if z.health <= 0:
						z.kill(now)
					break
		if b.splash > 0 and remove:
			for oz in zombies:
				if oz == direct_hit or oz.dying:
					continue
				var dd: float = (oz.world2 - np).length()
				if dd < b.splash:
					oz.health -= b.damage
					oz.stagger = now + 300
					if dd > 0:
						oz.vel2 += (oz.world2 - np) / dd * 60.0
		if remove:
			bullets.remove_at(i)
			b.queue_free()

	# Mark newly-lethal splash victims as dying (JS parity).
	for z in zombies:
		if z.health <= 0 and not z.dying:
			z.kill(now)

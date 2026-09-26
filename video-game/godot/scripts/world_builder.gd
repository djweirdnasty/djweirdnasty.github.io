class_name WorldBuilder
extends Node3D

## Builds the 3D representation of a level: floor, walls, doors, decorations
## and item pickups. Coordinates stay in the original 640x480 world space
## mapped onto the XZ plane (world.x -> x, world.y -> z).

const LAYER_WORLD := 1
const LAYER_BODY := 2

# Decoration types that are floor decals — never solid.
const DECAL_TYPES := ["blood", "bloodTrail", "chemicalSpill"]

static func w2v(x: float, y: float, h := 0.0) -> Vector3:
	return Vector3(x, h, y)

static func rect_center(r: Dictionary) -> Vector2:
	return Vector2(r.x + r.w * 0.5, r.y + r.h * 0.5)

var wall_mat: StandardMaterial3D
var wall_break_mat: StandardMaterial3D
var wall_break_dmg_mat: StandardMaterial3D
var door_mat: StandardMaterial3D
var door_open_mat: StandardMaterial3D
var grey_door_mat: StandardMaterial3D
var loot_box_mat: StandardMaterial3D


func _init() -> void:
	wall_mat = _mat("#3a3a3a", 0.95, 0.0)
	wall_break_mat = _mat("#6a4a32", 0.9, 0.0)
	wall_break_dmg_mat = _mat("#5a3a22", 0.9, 0.0)
	door_mat = _mat("#4a2f18", 0.8, 0.2)
	door_open_mat = _mat("#1f5a24", 0.8, 0.0)
	grey_door_mat = _mat("#5a5a66", 0.6, 0.5)
	loot_box_mat = _mat("#7a5a20", 0.8, 0.1)

func _mat(c: String, rough := 0.9, metal := 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(c)
	m.roughness = rough
	m.metallic = metal
	return m


func clear() -> void:
	for c in get_children():
		c.queue_free()


func make_box(size: Vector3, color: String, rough := 0.9, metal := 0.0) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = size
	mi.mesh = bm
	mi.material_override = _mat(color, rough, metal)
	return mi


# Solid wall: physics body + box mesh. Returns the StaticBody3D.
func build_wall(w: Dictionary) -> StaticBody3D:
	var body := StaticBody3D.new()
	body.collision_layer = LAYER_WORLD
	body.collision_mask = 0
	body.position = w2v(w.x + w.w * 0.5, w.y + w.h * 0.5, LevelsData.WALL_HEIGHT * 0.5)
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(w.w, LevelsData.WALL_HEIGHT, w.h)
	shape.shape = box
	body.add_child(shape)
	var mesh := make_box(Vector3(w.w, LevelsData.WALL_HEIGHT, w.h), "#3a3a3a")
	if w.get("breakable"):
		mesh.material_override = wall_break_mat
	else:
		mesh.material_override = wall_mat
	body.add_child(mesh)
	add_child(body)
	return body


# Blocking door slab (exit door, grey door). Collision is toggled by the game.
func build_door(r: Dictionary, mat: Material) -> StaticBody3D:
	var body := StaticBody3D.new()
	body.collision_layer = LAYER_WORLD
	body.collision_mask = 0
	body.position = w2v(r.x + r.w * 0.5, r.y + r.h * 0.5, LevelsData.WALL_HEIGHT * 0.5)
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(maxf(r.w, 4.0), LevelsData.WALL_HEIGHT, maxf(r.h, 4.0))
	shape.shape = box
	body.add_child(shape)
	var mesh := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = Vector3(maxf(r.w, 4.0), LevelsData.WALL_HEIGHT * 0.85, maxf(r.h, 4.0))
	mesh.mesh = bm
	mesh.material_override = mat
	body.add_child(mesh)
	add_child(body)
	return body


func build_floor(theme: String) -> void:
	var colors: Dictionary = LevelsData.THEME_FLOOR_COLORS.get(theme, LevelsData.THEME_FLOOR_COLORS.office)
	# Replicates drawFloor(): base fill + checkerboard tiles + accent grid lines.
	var img := Image.create(int(LevelsData.WORLD.x), int(LevelsData.WORLD.y), false, Image.FORMAT_RGBA8)
	img.fill(Color(colors.base))
	var tile := Color(colors.tile)
	var accent := Color(colors.accent)
	var ts := 32
	for ty in range(0, int(LevelsData.WORLD.y), ts):
		for tx in range(0, int(LevelsData.WORLD.x), ts):
			if (tx / ts + ty / ts) % 2 == 0:
				img.fill_rect(Rect2i(tx, ty, ts, ts), tile)
	for y in range(0, int(LevelsData.WORLD.y), ts):
		img.fill_rect(Rect2i(0, y, int(LevelsData.WORLD.x), 1), accent)
	for x in range(0, int(LevelsData.WORLD.x), ts):
		img.fill_rect(Rect2i(x, 0, 1, int(LevelsData.WORLD.y)), accent)
	var tex := ImageTexture.create_from_image(img)
	var mat := StandardMaterial3D.new()
	mat.albedo_texture = tex
	mat.roughness = 1.0
	mat.uv1_scale = Vector3(1, 1, 1)
	var floor_mi := MeshInstance3D.new()
	var plane := PlaneMesh.new()
	plane.size = Vector2(LevelsData.WORLD.x, LevelsData.WORLD.y)
	floor_mi.mesh = plane
	floor_mi.material_override = mat
	floor_mi.position = w2v(LevelsData.WORLD.x * 0.5, LevelsData.WORLD.y * 0.5, 0.0)
	floor_mi.name = "Floor"
	add_child(floor_mi)
	# Static floor collider (keeps raycasts/queries simple and entities grounded).
	var body := StaticBody3D.new()
	body.collision_layer = LAYER_WORLD
	body.collision_mask = 0
	body.position = w2v(LevelsData.WORLD.x * 0.5, LevelsData.WORLD.y * 0.5, -1.0)
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(LevelsData.WORLD.x, 2.0, LevelsData.WORLD.y)
	shape.shape = box
	body.add_child(shape)
	body.name = "FloorBody"
	add_child(body)


# Decoration props — 3D interpretations of the canvas-drawn set dressing.
func build_decoration(d: Dictionary) -> Node3D:
	var root := Node3D.new()
	root.position = w2v(d.x, d.y)
	var w: float = d.w
	var h: float = d.h
	match d.type:
		"desk":
			root.add_child(_box_at(w, h * 0.4, 22.0, "#3a2a1a", w * 0.5, h * 0.5))
			root.add_child(_box_at(w, h * 0.4, 3.0, "#4a3a2a", w * 0.5, h * 0.5, 24.0))
		"computer":
			root.add_child(_box_at(w, h, 16.0, "#1a1a2a", w * 0.5, h * 0.5))
			var screen := _box_at(w - 8, h - 8, 1.0, "#00ff44", w * 0.5, h * 0.5, 12.0)
			screen.material_override.emission_enabled = true
			screen.material_override.emission = Color("#00ff44")
			screen.material_override.emission_energy_multiplier = 0.7
			root.add_child(screen)
		"filingCabinet":
			root.add_child(_box_at(w, h, 42.0, "#2a2a2a", w * 0.5, h * 0.5))
			for i in range(1, int(h / 15)):
				root.add_child(_box_at(w, 1.0, 42.5, "#1a1a1a", w * 0.5, i * 15.0))
		"crate":
			var c := _box_at(w, w, w, "#4a3a20", w * 0.5, h * 0.5)
			c.rotation.y = PI * 0.03
			root.add_child(c)
		"locker":
			root.add_child(_box_at(w, h, 48.0, "#2a2a3a", w * 0.5, h * 0.5))
			root.add_child(_box_at(2.0, h, 49.0, "#1a1a2a", w * 0.5, h * 0.5))
		"gasCan":
			root.add_child(_box_at(w, h, 26.0, "#aa3322", w * 0.5, h * 0.5))
			root.add_child(_box_at(6, 4, 4.0, "#cc4433", w * 0.5, h * 0.5, 28.0))
		"plant":
			var pot := MeshInstance3D.new()
			var cyl := CylinderMesh.new()
			cyl.top_radius = 4.0; cyl.bottom_radius = 5.0; cyl.height = 7.0
			pot.mesh = cyl
			pot.material_override = _mat("#3a2a1a")
			pot.position = Vector3(w * 0.5, 3.5, h * 0.5)
			root.add_child(pot)
			var bush := MeshInstance3D.new()
			var sph := SphereMesh.new()
			sph.radius = w * 0.55; sph.height = w * 1.1
			bush.mesh = sph
			bush.material_override = _mat("#2a4a1a")
			bush.position = Vector3(w * 0.5, 8.0 + w * 0.4, h * 0.5)
			root.add_child(bush)
		"blood":
			root.add_child(_disc(w * 0.5, h * 0.5, Color(0.32, 0.0, 0.0, 0.75), w * 0.5, h * 0.5))
			for i in 5:
				var px: float = randf() * w
				var py: float = randf() * h
				root.add_child(_disc(2.0 + randf() * 3.0, 2.0 + randf() * 3.0, Color(0.47, 0.0, 0.0, 0.55), px, py))
		"bloodTrail":
			for i in range(0, int(w), 8):
				var r := 3.0 + randf() * 2.0
				root.add_child(_disc(r, r, Color(0.32, 0.0, 0.0, 0.6), float(i), h * 0.5))
		"testTube":
			var tube := MeshInstance3D.new()
			var tc := CylinderMesh.new()
			tc.top_radius = w * 0.4; tc.bottom_radius = w * 0.4; tc.height = h
			tube.mesh = tc
			var glass := _mat("#1a2a3a")
			glass.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
			glass.albedo_color.a = 0.45
			tube.material_override = glass
			tube.position = Vector3(w * 0.5, h * 0.5, w * 0.5)
			root.add_child(tube)
			var liquid := MeshInstance3D.new()
			var lc := CylinderMesh.new()
			lc.top_radius = w * 0.32; lc.bottom_radius = w * 0.32; lc.height = h * 0.6
			liquid.mesh = lc
			var lm := _mat("#00c896")
			lm.emission_enabled = true
			lm.emission = Color("#00c896")
			lm.emission_energy_multiplier = 0.5
			liquid.material_override = lm
			liquid.position = Vector3(w * 0.5, h * 0.32, w * 0.5)
			root.add_child(liquid)
		"chemicalSpill":
			root.add_child(_disc(w * 0.5, h * 0.5, Color(0.0, 0.7, 0.31, 0.3), w * 0.5, h * 0.5))
			root.add_child(_disc(w * 0.33, h * 0.33, Color(0.0, 0.86, 0.39, 0.25), w * 0.5, h * 0.5))
		"hospitalBed":
			root.add_child(_box_at(w, h, 14.0, "#3a3a4a", w * 0.5, h * 0.5, 12.0))
			root.add_child(_box_at(w, h * 0.3, 15.0, "#1a1a2a", w * 0.5, h * 0.82, 13.0))
			for lx in [4.0, w - 4.0]:
				for lz in [4.0, h - 4.0]:
					root.add_child(_box_at(4, 4, 12.0, "#1a1a2a", lx, lz))
		"warningSign":
			root.add_child(_box_at(3, 3, 30.0, "#444444", w * 0.5, h * 0.5))
			var sign := MeshInstance3D.new()
			var prism := PrismMesh.new()
			prism.size = Vector3(w, 22.0, 4.0)
			sign.mesh = prism
			sign.material_override = _mat("#ccaa00")
			sign.position = Vector3(w * 0.5, 40.0, h * 0.5)
			sign.rotation.y = PI * 0.5
			root.add_child(sign)
		_:
			root.add_child(_box_at(w, h, 12.0, "#333333", w * 0.5, h * 0.5))
	# Solid props block movement; floor decals stay walkable. Collider tops out
	# at 28 so bullets (fired at ~40) pass over furniture.
	if not d.type in DECAL_TYPES:
		var body := StaticBody3D.new()
		body.collision_layer = LAYER_WORLD
		body.collision_mask = 0
		var shape := CollisionShape3D.new()
		var box := BoxShape3D.new()
		box.size = Vector3(w, 28.0, h)
		shape.shape = box
		shape.position = Vector3(w * 0.5, 14.0, h * 0.5)
		body.add_child(shape)
		root.add_child(body)
	add_child(root)
	return root


func _box_at(w: float, d: float, h: float, color: String, cx: float, cz: float, y := -1.0) -> MeshInstance3D:
	var mi := make_box(Vector3(w, h, d), color)
	mi.position = Vector3(cx, (h * 0.5) if y < 0.0 else y, cz)
	return mi


func _disc(rx: float, rz: float, color: Color, cx: float, cz: float) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var cyl := CylinderMesh.new()
	cyl.top_radius = rx
	cyl.bottom_radius = rx
	cyl.height = 0.4
	mi.mesh = cyl
	var m := _mat("#800000")
	m.albedo_color = color
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mi.material_override = m
	mi.scale.z = rz / maxf(rx, 0.001)
	mi.position = Vector3(cx, 0.35, cz)
	return mi


# ---- Item pickups -----------------------------------------------------------
# Small stylized 3D props standing in for the canvas-drawn item icons.

func build_item(it: Dictionary) -> Node3D:
	var root := Node3D.new()
	root.name = "Item"
	root.position = w2v(it.x, it.y, 0.0)
	var s: float = it.get("size", 8)
	match it.type:
		"key", "greyKey", "masterKey", "lootKey":
			var col := "#ffd24a"
			if it.type == "greyKey": col = "#9a9aa5"
			elif it.type == "masterKey": col = "#ff9a2a"
			elif it.type == "lootKey": col = "#c76bff"
			var ring := MeshInstance3D.new()
			var torus := TorusMesh.new()
			torus.inner_radius = s * 0.22
			torus.outer_radius = s * 0.42
			ring.mesh = torus
			ring.material_override = _mat(col, 0.35, 0.7)
			ring.rotation.x = PI * 0.5
			root.add_child(ring)
			var shaft := _box_at(s * 0.9, s * 0.18, s * 0.18, col, s * 0.55, 0)
			shaft.material_override.metallic = 0.7
			shaft.material_override.roughness = 0.35
			shaft.rotation.y = 0.0
			root.add_child(shaft)
			root.add_child(_box_at(s * 0.14, s * 0.34, s * 0.18, col, s * 0.85, s * 0.12))
		"ammo":
			root.add_child(_box_at(s * 1.4, s, s * 0.9, "#2a4a22", 0, 0, 6))
			root.add_child(_box_at(s * 1.2, s * 0.7, s * 0.5, "#c8a24a", 0, 0, 9))
		"med":
			root.add_child(_box_at(s * 1.6, s * 1.2, s * 0.8, "#e8e8e8", 0, 0, 6))
			var cr1 := _box_at(s * 1.0, s * 0.28, s * 0.15, "#cc2222", 0, 0, 9.0)
			var cr2 := _box_at(s * 0.28, s * 0.9, s * 0.15, "#cc2222", 0, 0, 9.0)
			root.add_child(cr1)
			root.add_child(cr2)
		"weapon":
			var wname: String = it.get("weapon", "Pistol")
			var col := "#222222" if wname == "Pistol" else ("#3a2a1a" if wname == "Shotgun" else "#2a3a2a")
			root.add_child(_box_at(s * 2.0, s * 0.35, s * 0.5, col, 0, 0, 7))
			var barrel := MeshInstance3D.new()
			var cyl := CylinderMesh.new()
			cyl.top_radius = s * 0.14; cyl.bottom_radius = s * 0.14
			cyl.height = s * (1.6 if wname == "Shotgun" else 1.1)
			barrel.mesh = cyl
			barrel.material_override = _mat("#111111", 0.5, 0.6)
			barrel.rotation.z = PI * 0.5
			barrel.position = Vector3(s * 0.9, 7, 0)
			root.add_child(barrel)
		"lore":
			root.add_child(_box_at(s * 1.2, s * 1.5, 0.6, "#d8d4c0", 0, 0, 6))
		_:
			root.add_child(_box_at(s, s, s, "#888888", 0, 0, 6))
	root.position.y = 0.0
	add_child(root)
	return root


# Corpse body left behind by a feeding zombie or decorative corpse scene.
func build_corpse(x: float, y: float) -> Node3D:
	var root := Node3D.new()
	root.position = w2v(x, y)
	root.add_child(_disc(10, 7, Color(0.35, 0.0, 0.0, 0.7), 0, 0))
	var body_mesh := _box_at(16, 7, 5.0, "#2a2a28", 0, 0)
	body_mesh.rotation.y = randf() * PI
	root.add_child(body_mesh)
	add_child(root)
	return root


# Simple door-frame posts so doorways read as openings in 3D.
func build_door_frame(r: Dictionary) -> void:
	for px in [r.x, r.x + r.w]:
		var post := make_box(Vector3(6, LevelsData.WALL_HEIGHT, 6), "#222222")
		post.position = w2v(px, r.y + r.h * 0.5, LevelsData.WALL_HEIGHT * 0.5)
		add_child(post)

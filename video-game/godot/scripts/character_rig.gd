class_name CharacterRig3D
extends Node3D

## Wraps a GLB character (KayKit-style: Skeleton3D + AnimationPlayer) for use
## as the visual layer of a CharacterBody3D. Handles scaling into world units,
## smooth yaw turning, crossfaded animation states, and a hit-flash overlay.
## The rig never affects physics — the parent body owns movement/collision.

var model: Node3D
var ap: AnimationPlayer
var target_yaw := 0.0
var yaw_speed := 14.0      # rad/s — snappy but smooth turning
var current := ""
var _meshes: Array = []
var attachments: Dictionary = {}   # prop name -> MeshInstance3D on handslot bones
var _attachment := ""
var _slots: Dictionary = {}        # BoneAttachment3D name -> node
var _prop: Node3D = null
var _prop_key := ""
var _prop_tint := Color(1, 1, 1)
var _skeleton: Skeleton3D
var _flash_mat: StandardMaterial3D
var _flash_until := 0
# Game-facing anim names -> actual clip names in the loaded GLB. Lets
# player.gd/zombie.gd keep their existing state code across model swaps.
var anim_alias: Dictionary = {}


func _resolve(anim_name: String) -> String:
	return str(anim_alias.get(anim_name, anim_name))


# Show exactly one built-in weapon prop ("" = none).
func set_attachment(prop: String) -> void:
	if prop == _attachment:
		return
	_attachment = prop
	for k in attachments:
		attachments[k].visible = (k == prop)


# Attach an external GLB prop to a bone slot (e.g. a real firearm in the
# hand). Called with the same key every frame is a no-op.
func show_prop(glb_path: String, slot := "handslot_r", pos := Vector3.ZERO,
		rot_deg := Vector3.ZERO, prop_scale := 1.0,
		tint := Color(1, 1, 1)) -> void:
	var key := "%s|%s" % [glb_path, slot]
	if key == _prop_key:
		return
	clear_prop()
	_prop_key = key
	_prop_tint = tint
	if not _slots.has(slot):
		# No dedicated attachment node — bind to the named skeleton bone.
		if _skeleton == null or _skeleton.find_bone(slot) < 0:
			return
		var ba := BoneAttachment3D.new()
		ba.name = slot
		ba.bone_name = slot
		_skeleton.add_child(ba)
		_slots[slot] = ba
	var ps: PackedScene = load(glb_path)
	if ps == null:
		return
	_prop = ps.instantiate()
	_slots[slot].add_child(_prop)
	# pos is expressed in the prop's own axes (-X = barrel/muzzle, +Z = up),
	# so a config offset stays meaningful regardless of bone orientation.
	var rb := Basis.from_euler(Vector3(
		deg_to_rad(rot_deg.x), deg_to_rad(rot_deg.y), deg_to_rad(rot_deg.z)))
	_prop.position = rb * pos
	_prop.rotation_degrees = rot_deg
	_prop.scale = Vector3.ONE * prop_scale
	if _prop_tint != Color(1, 1, 1):
		for m in _prop.find_children("*", "MeshInstance3D", true, false):
			var mi := m as MeshInstance3D
			if mi.mesh == null:
				continue
			for si in mi.mesh.get_surface_count():
				var mat: Material = mi.get_active_material(si)
				if mat == null:
					continue
				var dup := mat.duplicate()
				if dup is StandardMaterial3D:
					dup.albedo_color = _prop_tint
				mi.set_surface_override_material(si, dup)


func clear_prop() -> void:
	if _prop != null:
		_prop.queue_free()
	_prop = null
	_prop_key = ""


# World-space muzzle position of the attached external prop: the prop origin
# (grip/hand) pushed `barrel_len` units along the aim direction. Returns
# Vector3.INF when no external prop is attached.
func prop_muzzle_position(dir: Vector3, barrel_len := 14.0) -> Vector3:
	if _prop == null:
		return Vector3.INF
	return _prop.global_position + dir.normalized() * barrel_len

# glTF characters face +Z; Godot yaw for facing dir (dx,dz) on XZ is atan2(dx,dz).
func face(dir: Vector2) -> void:
	if dir.length() > 0.01:
		target_yaw = atan2(dir.x, dir.y)


func setup(glb_path: String, target_height: float, tint := Color(1, 1, 1),
		src_height := 0.0) -> void:
	var ps: PackedScene = load(glb_path)
	model = ps.instantiate()
	add_child(model)
	for c in model.find_children("*", "AnimationPlayer", true, false):
		ap = c
		break
	# KayKit packs embed every weapon prop as a visible mesh on the handslot
	# bones — hide them all; set_attachment() reveals one at a time.
	for c in model.find_children("*", "MeshInstance3D", true, false):
		_meshes.append(c)
		var par_name := str(c.get_parent().name)
		if par_name.begins_with("handslot"):
			attachments[c.name] = c
			c.visible = false
	for c in model.find_children("*", "BoneAttachment3D", true, false):
		_slots[c.name] = c
	for c in model.find_children("*", "Skeleton3D", true, false):
		_skeleton = c
		break

	# Scale so the character height maps to target_height world units and feet
	# sit on the node origin. src_height (empirically calibrated render height
	# at scale 1) is authoritative when provided — skinned output scale can't
	# always be derived from bones/mesh AABBs across exporters.
	if src_height > 0.0:
		model.scale = Vector3.ONE * (target_height / src_height)
	else:
		var aabb := AABB()
		var first := true
		for m in _meshes:
			if not (m.get_parent() is Skeleton3D):
				continue
			var ma: AABB = m.get_aabb()
			ma = m.transform * ma
			aabb = ma if first else aabb.merge(ma)
			first = false
		if aabb.size.y > 0.0:
			var s := target_height / aabb.size.y
			model.scale = Vector3.ONE * s
			model.position.y = -aabb.position.y * s

	if tint != Color(1, 1, 1):
		_apply_tint(tint)

	_flash_mat = StandardMaterial3D.new()
	_flash_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	_flash_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_flash_mat.albedo_color = Color(1.0, 0.15, 0.1, 0.55)


# Recolor named surface materials (e.g. Quaternius flat-color palettes) toward
# the Youie palette. map = material resource_name -> Color; a "MeshName:MatName"
# key recolors only that surface on that mesh.
func retint(map: Dictionary) -> void:
	for m in _meshes:
		if m.mesh == null:
			continue
		for si in m.mesh.get_surface_count():
			var mat: Material = m.get_active_material(si)
			if mat == null:
				continue
			var key: String = "%s:%s" % [m.name, mat.resource_name]
			var target: Variant = map.get(key, map.get(mat.resource_name))
			if target == null:
				continue
			var dup := mat.duplicate()
			if dup is StandardMaterial3D:
				dup.albedo_color = target
			m.set_surface_override_material(si, dup)


func _apply_tint(tint: Color) -> void:
	for m in _meshes:
		if m.mesh == null:
			continue
		for si in m.mesh.get_surface_count():
			var mat: Material = m.get_active_material(si)
			if mat == null:
				continue
			var dup: Material = mat.duplicate()
			if dup is StandardMaterial3D:
				dup.albedo_color = tint
			m.set_surface_override_material(si, dup)


func set_looping(names: Array) -> void:
	if ap == null:
		return
	for n in names:
		var a: String = _resolve(n)
		if ap.has_animation(a):
			ap.get_animation(a).loop_mode = Animation.LOOP_LINEAR


func has_anim(anim_name: String) -> bool:
	return ap != null and ap.has_animation(_resolve(anim_name))


func play(anim_name: String, fade := 0.15, restart := false, speed := 1.0) -> void:
	anim_name = _resolve(anim_name)
	if ap == null or not ap.has_animation(anim_name):
		return
	if anim_name == current and not restart:
		return
	current = anim_name
	ap.play(anim_name, fade, speed)


# Time-mapped pose selection: seeks to t in [0,1] of the animation and holds it.
func pose(anim_name: String, t: float) -> void:
	anim_name = _resolve(anim_name)
	if ap == null or not ap.has_animation(anim_name):
		return
	if anim_name != current:
		current = anim_name
		ap.play(anim_name, 0.08)
	var a: Animation = ap.get_animation(anim_name)
	if a == null:
		return
	ap.seek(clampf(t, 0.0, 1.0) * a.length, true)
	ap.pause()


func flash(duration_ms := 160) -> void:
	_flash_until = Time.get_ticks_msec() + duration_ms


func _process(delta: float) -> void:
	if model == null:
		return
	model.rotation.y = lerp_angle(model.rotation.y, target_yaw, minf(1.0, yaw_speed * delta))
	var flashing := Time.get_ticks_msec() < _flash_until
	for m in _meshes:
		m.material_overlay = _flash_mat if flashing else null

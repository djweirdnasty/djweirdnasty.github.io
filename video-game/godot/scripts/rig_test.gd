extends Node3D

## Standalone character-rig verification scene. Run:
##   Godot --path godot res://scenes/rig_test.tscn [--anim Idle] [--glb res://...]

var _frame := 0
var _rig: CharacterRig3D
var _face := Vector2(0.6, 0.8)
var _prop_aim := false
var _prop_flip := false
var _prop_scale := 1.0
var _prop_barrel := "-X"   # prop-local muzzle axis
var _prop_up := "Z"        # prop-local gun-up axis


func _axis(name: String) -> Vector3:
	match name.to_upper():
		"X": return Vector3.RIGHT
		"-X": return Vector3.LEFT
		"Y": return Vector3.UP
		"-Y": return Vector3.DOWN
		"Z": return Vector3.BACK
		"-Z": return Vector3.FORWARD
	return -Vector3.RIGHT


func _ready() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.15, 0.16, 0.2)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.8, 0.8, 0.85)
	env.ambient_light_energy = 0.8
	$WorldEnvironment.environment = env

	# Ground plane so grounding is visible.
	var mi := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(400, 400)
	mi.mesh = pm
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(0.2, 0.22, 0.25)
	mi.material_override = m
	add_child(mi)

	var glb := "res://assets/models/Rogue.glb"
	var anim := "Idle"
	var raw_scale := 0.0
	var src_h := 0.0
	var youie := false
	var args := OS.get_cmdline_args()
	for i in args.size():
		if args[i] == "--glb" and i + 1 < args.size():
			glb = args[i + 1]
		if args[i] == "--anim" and i + 1 < args.size():
			anim = args[i + 1]
		if args[i] == "--raw-scale" and i + 1 < args.size():
			raw_scale = float(args[i + 1])
		if args[i] == "--src-height" and i + 1 < args.size():
			src_h = float(args[i + 1])
		if args[i] == "--youie":
			youie = true
	_rig = CharacterRig3D.new()
	if raw_scale > 0.0:
		var ps: PackedScene = load(glb)
		_rig.model = ps.instantiate()
		_rig.add_child(_rig.model)
		for c in _rig.model.find_children("*", "AnimationPlayer", true, false):
			_rig.ap = c
			break
		_rig.model.scale = Vector3.ONE * raw_scale
	else:
		_rig.setup(glb, 60.0, Color(1, 1, 1), src_h)
	if youie:
		_rig.retint(Player.YOUIE_PALETTE)
	_rig.set_looping(["Idle", "Unarmed_Idle", "Walking_A", "Running_A", "1H_Ranged_Aiming",
		"Idle_Combat", "Walking_D_Skeletons", "PickUp", "Lie_Pose", "Death_A_Pose", "Death_C_Pose",
		"CharacterArmature|Idle", "CharacterArmature|Walk", "CharacterArmature|Run",
		"CharacterArmature|Idle_Gun", "CharacterArmature|Idle_Gun_Pointing",
		"CharacterArmature|Run_Shoot"])
	add_child(_rig)
	_rig.play(anim)
	print("RIGTEST glb=", glb, " anim=", anim, " scale=", _rig.model.scale)
	var prop := ""
	var prop_slot := "handslot_r"
	var prop_scale := 1.0
	var prop_rot := Vector3.ZERO
	var prop_pos := Vector3.ZERO
	var prop_tint := Color(1, 1, 1)
	for i in args.size():
		if args[i] == "--prop" and i + 1 < args.size():
			prop = args[i + 1]
		if args[i] == "--prop-slot" and i + 1 < args.size():
			prop_slot = args[i + 1]
		if args[i] == "--prop-scale" and i + 1 < args.size():
			prop_scale = float(args[i + 1])
			_prop_scale = prop_scale
		if args[i] == "--prop-rot" and i + 1 < args.size():
			var v: PackedStringArray = args[i + 1].split(",")
			prop_rot = Vector3(float(v[0]), float(v[1]), float(v[2]))
		if args[i] == "--prop-pos" and i + 1 < args.size():
			var v2: PackedStringArray = args[i + 1].split(",")
			prop_pos = Vector3(float(v2[0]), float(v2[1]), float(v2[2]))
		if args[i] == "--prop-tint" and i + 1 < args.size():
			var v5: PackedStringArray = args[i + 1].split(",")
			prop_tint = Color(float(v5[0]), float(v5[1]), float(v5[2]))
		if args[i] == "--face" and i + 1 < args.size():
			var v3: PackedStringArray = args[i + 1].split(",")
			_face = Vector2(float(v3[0]), float(v3[1]))
		if args[i] == "--cam" and i + 1 < args.size():
			var v4: PackedStringArray = args[i + 1].split(",")
			$Camera3D.position = Vector3(float(v4[0]), float(v4[1]), float(v4[2]))
			$Camera3D.look_at(Vector3(0, float(v4[3]) if v4.size() > 3 else 30.0, 0))
	if prop != "":
		_rig.show_prop(prop, prop_slot, prop_pos, prop_rot, prop_scale, prop_tint)
	_prop_aim = "--prop-aim" in args
	_prop_flip = "--prop-flip" in args
	for i in args.size():
		if args[i] == "--prop-barrel" and i + 1 < args.size():
			_prop_barrel = args[i + 1]
		if args[i] == "--prop-up" and i + 1 < args.size():
			_prop_up = args[i + 1]


func _process(_d: float) -> void:
	_frame += 1
	if _rig:
		_rig.face(_face)
	# Solve the prop's local rotation once the pose has settled: barrel axis
	# (+X in prop space) -> character forward; prop up (+Z) -> world up.
	if _prop_aim and _frame == 60 and _rig._prop != null:
		var slot: BoneAttachment3D = _rig._prop.get_parent()
		var fwd := Vector3(_face.x, 0, _face.y).normalized()
		if _prop_flip:
			fwd = -fwd
		# Desired world orientation: muzzle axis -> fwd, gun-up axis -> world up.
		# Build source frame (prop axes) and target frame, both orthonormal.
		var b := _axis(_prop_barrel)
		var u := _axis(_prop_up)
		var s_x := b.normalized()
		var s_y := u.normalized().cross(s_x).normalized()
		var s_z := s_x.cross(s_y)
		var src := Basis(s_x, s_y, s_z)          # maps canonical -> prop frame
		var t_x := Vector3(fwd.x, 0, fwd.z)
		var t_y := Vector3.UP.cross(t_x).normalized()
		var t_z := Vector3.UP
		var dst := Basis(t_x, t_y, t_z)          # maps canonical -> world frame
		var slot_basis: Basis = slot.global_transform.basis.orthonormalized()
		var local_basis := slot_basis.inverse() * dst * src.inverse()
		_rig._prop.basis = local_basis
		_rig._prop.scale = Vector3.ONE * _prop_scale
		print("PROP_AIM euler_deg=", local_basis.get_euler() * 180.0 / PI,
			" euler_yxz=", local_basis.get_euler(EULER_ORDER_YXZ) * 180.0 / PI)
	if _frame == 60 and _rig != null and _rig._prop != null:
		print("PROPDBG gp=", _rig._prop.global_position,
			" slot_gp=", (_rig._prop.get_parent() as Node3D).global_position)
	if _frame == 90:
		var img := get_viewport().get_texture().get_image()
		img.save_png("/tmp/rig_test.png")
		print("RIGTEST saved /tmp/rig_test.png")
	if _frame > 100:
		get_tree().quit()

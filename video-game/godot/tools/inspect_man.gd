extends SceneTree

func _init() -> void:
	var files := ["Man_A.glb", "Man_B.glb", "Man_LongSleeves.glb", "Man_Suit.glb"]
	for f in files:
		var path: String = "res://assets/models/" + f
		print("\n===== ", f, " =====")
		var ps: PackedScene = load(path)
		if ps == null:
			print("FAILED TO LOAD")
			continue
		var inst := ps.instantiate()
		_dump(inst, 0)
		inst.queue_free()
	quit()


func _dump(n: Node, depth: int) -> void:
	var pad := "  ".repeat(depth)
	var info := pad + n.name + " <" + n.get_class() + ">"
	if n is Skeleton3D:
		info += " bones=%d" % n.get_bone_count()
	if n is MeshInstance3D:
		var m: Mesh = n.mesh
		if m:
			info += " surf=%d aabb=%s" % [m.get_surface_count(), str(m.get_aabb().size)]
			for s in m.get_surface_count():
				var mat := m.surface_get_material(s)
				if mat:
					info += " | mat[%d]=%s" % [s, mat.resource_name]
	if n is AnimationPlayer:
		var anims: PackedStringArray = n.get_animation_list()
		info += " anims=%d" % anims.size()
		print(info)
		for a in anims:
			print(pad + "   anim: ", a)
	else:
		print(info)
	for c in n.get_children():
		_dump(c, depth + 1)

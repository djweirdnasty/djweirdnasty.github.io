extends SceneTree

func _init() -> void:
	var ps: PackedScene = load("res://assets/models/Man_LongSleeves.glb")
	var inst := ps.instantiate()
	_find(inst)
	quit()

func _find(n: Node) -> void:
	if n is Skeleton3D:
		for i in n.get_bone_count():
			print("bone %d: %s" % [i, n.get_bone_name(i)])
	for c in n.get_children():
		_find(c)

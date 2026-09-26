extends SceneTree

func _init() -> void:
	var ps: PackedScene = load("res://assets/models/Man_LongSleeves.glb")
	var inst := ps.instantiate()
	var mi: MeshInstance3D = null
	_find(inst, mi)
	quit()


func _find(n: Node, _mi) -> void:
	for c in n.get_children():
		_find(c, _mi)
	if n is MeshInstance3D:
		var m: Mesh = n.mesh
		print("\nMESH ", n.name)
		for s in m.get_surface_count():
			var mat := m.surface_get_material(s)
			if mat is BaseMaterial3D:
				var bm := mat as BaseMaterial3D
				print("  surf %d  name=%s  albedo=%s  tex=%s" % [
					s, mat.resource_name, str(bm.albedo_color),
					bm.albedo_texture.resource_path if bm.albedo_texture else "none"])
			else:
				print("  surf %d  name=%s class=%s" % [s, mat.resource_name if mat else "?", mat.get_class() if mat else "?"])

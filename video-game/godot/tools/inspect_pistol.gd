extends SceneTree

func _init() -> void:
	for f in ["Pistol_9mm.glb", "Shotgun.glb", "FlareGun.glb", "RocketLauncher.glb"]:
		print("\n===== ", f, " =====")
		var ps: PackedScene = load("res://assets/models/" + f)
		var inst := ps.instantiate()
		_dump(inst, 0)
		inst.queue_free()
	quit()

func _dump(n: Node, depth: int) -> void:
	var pad := "  ".repeat(depth)
	var info := pad + n.name + " <" + n.get_class() + ">"
	if n is Node3D:
		info += " pos=%s rot=%s scale=%s" % [str((n as Node3D).position), str((n as Node3D).rotation_degrees), str((n as Node3D).scale)]
	if n is MeshInstance3D and (n as MeshInstance3D).mesh:
		info += " aabb=%s pos=%s" % [str((n as MeshInstance3D).mesh.get_aabb().size), str((n as MeshInstance3D).mesh.get_aabb().position)]
	print(info)
	for c in n.get_children():
		_dump(c, depth + 1)

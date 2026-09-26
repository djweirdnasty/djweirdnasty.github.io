extends SceneTree

func _init() -> void:
	var rig := CharacterRig3D.new()
	rig.setup("res://assets/models/Man_LongSleeves.glb", 62.0, Color(1, 1, 1), 1.4)
	rig.anim_alias = Player.YOUIE_ANIMS
	rig.set_looping(["Idle", "Unarmed_Idle", "Walking_A", "Running_A",
		"Running_Armed", "1H_Ranged_Aiming", "1H_Ranged_Shooting", "Hit_B",
		"Interact"])
	for n in rig.ap.get_animation_list():
		var a: Animation = rig.ap.get_animation(n)
		print("%s  loop=%d len=%.2f" % [n, a.loop_mode, a.length])
	quit()

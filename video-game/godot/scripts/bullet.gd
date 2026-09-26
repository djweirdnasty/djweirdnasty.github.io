class_name Bullet
extends Node3D

## Port of the JS bullet object. Movement and hit resolution are driven by
## main.gd (which owns the wall/zombie lists); this node carries the visual
## and the bullet's data fields.

var vel := Vector2.ZERO
var size := 3.0
var damage := 1.0
var splash := 0.0
var life := 1.2
var bullet_color := Color(1, 1, 0)

var world2: Vector2:
	get: return Vector2(position.x, position.z)
	set(v): position = Vector3(v.x, position.y, v.y)

var _mesh: MeshInstance3D


func setup(def: Dictionary) -> void:
	world2 = def.pos
	vel = def.vel
	size = def.get("size", 3)
	damage = def.get("damage", 1)
	splash = def.get("splash", 0)
	life = def.get("life", 1.2)
	bullet_color = Color(def.get("color", "#ff0"))


func _ready() -> void:
	_mesh = MeshInstance3D.new()
	var sph := SphereMesh.new()
	sph.radius = size * 0.5
	sph.height = size
	_mesh.mesh = sph
	var m := StandardMaterial3D.new()
	m.albedo_color = bullet_color
	m.emission_enabled = true
	m.emission = m.albedo_color
	m.emission_energy_multiplier = 2.0
	_mesh.material_override = m
	position.y = 40.0  # roughly gun height
	add_child(_mesh)

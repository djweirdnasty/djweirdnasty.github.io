class_name LevelsData
extends RefCounted

## Direct port of the level/gameplay data tables from resident_evil_proto.html.
## All coordinates are in the original 640x480 world space, which maps 1:1
## onto the XZ plane (x -> x, y -> z).

const WORLD := Vector2(640, 480)
const WALL_HEIGHT := 90.0

const OUTER_WALLS := [
	{ "x": 40,  "y": 40,  "w": 560, "h": 20 },  # top
	{ "x": 40,  "y": 40,  "w": 20,  "h": 120 }, # left upper
	{ "x": 40,  "y": 280, "w": 20,  "h": 160 }, # left lower
	{ "x": 580, "y": 40,  "w": 20,  "h": 120 }, # right upper
	{ "x": 580, "y": 280, "w": 20,  "h": 160 }, # right lower
	{ "x": 40,  "y": 420, "w": 560, "h": 20 },  # bottom
]

const INNER_MANSION := [
	{ "x": 40,  "y": 180, "w": 220, "h": 20 },
	{ "x": 200, "y": 280, "w": 400, "h": 20 },
	{ "x": 300, "y": 60,  "w": 20,  "h": 120 },
	{ "x": 420, "y": 180, "w": 20,  "h": 100 },
]

const INNER_OPEN := [
	{ "x": 280, "y": 180, "w": 80, "h": 80 },
]

const DOORS := {
	"right": { "x": 580, "y": 160, "w": 20, "h": 120 },
	"top":   { "x": 300, "y": 40,  "w": 40, "h": 20 },
}

const RETURN_DOOR := { "x": 40, "y": 160, "w": 20, "h": 120 }

const WEAPONS := {
	"Pistol":           { "name": "Pistol",           "damage": 1,   "color": "#ff0", "bullet_size": 3,  "mag_size": 12 },
	"Shotgun":          { "name": "Shotgun",          "damage": 8,   "color": "#f00", "bullet_size": 5,  "mag_size": 6 },
	"Grenade Launcher": { "name": "Grenade Launcher", "damage": 20,  "color": "#888", "bullet_size": 8,  "splash": 60,  "mag_size": 3 },
	"RPG":              { "name": "RPG",              "damage": 100, "color": "#0f0", "bullet_size": 14, "splash": 120, "mag_size": 2 },
}

const SHOT_COOLDOWN := { "Pistol": 200, "Shotgun": 600, "Grenade Launcher": 800, "RPG": 1200 }

# Combat timing (ms) — grapple / knockdown / reload state machines.
const PLAYER_DEATH_ANIM_MS := 700
const ZOMBIE_DEATH_ANIM_MS := 900
const ZOMBIE_ATTACK_ANIM_MS := 500
const GRAB_MS := 500
const STRUGGLE_WINDOW_MS := 1400
const STRUGGLE_MASH_NEEDED := 6
const BITE_MS := 600
const ESCAPE_MS := 450
const THROWN_MS := 750
const IMPACT_MS := 300
const GETUP_BASE_MS := 900
const RELOAD_MS := 900
const HURT_MS := 350
const RECOIL_MS := 90
const MUZZLE_FLASH_MS := 70
const INTERACT_RANGE := 44.0
const ZOMBIE_SIGHT_RANGE := 200.0
const BULLET_SPEED := 500.0
const BULLET_LIFE := 1.2

const CONTAINER_TYPES := ["locker", "crate", "desk", "filingCabinet", "gasCan"]
const CONTAINER_LABELS := { "locker": "Locker", "crate": "Crate", "desk": "Desk", "filingCabinet": "Cabinet", "gasCan": "Gas Can" }
const BLOOD_FLAVOR_TEXT := [
	"There's blood on the floor...",
	"Where did this blood come from?",
	"This blood looks fresh.",
	"Something terrible happened here.",
]

const INTRO_TEXT := "You wake in the safe room of an abandoned estate. The front door is jammed. Something is moving in the halls. Find a way out — and pray you are not the only one still breathing."
const ENDING_TEXT := "You burst through the final door. The cold air hits your face. You made it out. But the estate is still out there... and something is still inside."

const THEME_FLOOR_COLORS := {
	"office":  { "base": "#1a1a1a", "tile": "#222222", "accent": "#2a2a2a" },
	"storage": { "base": "#1a1612", "tile": "#242018", "accent": "#2a2418" },
	"lab":     { "base": "#121818", "tile": "#1a2222", "accent": "#1e2828" },
	"medical": { "base": "#1a1818", "tile": "#222020", "accent": "#282424" },
	"escape":  { "base": "#161210", "tile": "#1e1814", "accent": "#241e16" },
}

static func _w(set_a: Array, set_b: Array) -> Array:
	var out := set_a.duplicate()
	out.append_array(set_b)
	return out

static func weapon(n: String) -> Dictionary:
	return WEAPONS[n].duplicate(true)

const LEVELS := [
	{
		"name": "Safe Room", "theme": "office",
		"start": { "x": 80, "y": 360 },
		"walls": [], # filled in _build()
		"_wall_set": "mansion",
		"door": DOORS.right,
		"keys_needed": 1,
		"items": [
			{ "type": "key", "x": 120, "y": 120, "size": 8 },
			{ "type": "weapon", "x": 540, "y": 120, "size": 10, "weapon": "Pistol", "amount": 12 },
			{ "type": "ammo", "x": 500, "y": 100, "size": 8, "amount": 4 },
			{ "type": "ammo", "x": 450, "y": 360, "size": 8, "amount": 4 },
			{ "type": "med",  "x": 100, "y": 360, "size": 8, "amount": 40 },
		],
		"decorations": [
			{ "type": "desk", "x": 80, "y": 80, "w": 80, "h": 35 },
			{ "type": "computer", "x": 100, "y": 60, "w": 30, "h": 25 },
			{ "type": "filingCabinet", "x": 480, "y": 60, "w": 30, "h": 50 },
			{ "type": "plant", "x": 540, "y": 380, "w": 25, "h": 30 },
			{ "type": "blood", "x": 300, "y": 300, "w": 40, "h": 30 },
		],
		"zombies": [
			{ "x": 420, "y": 160, "size": 28, "speed": 40, "health": 20, "max_health": 20, "damage": 30, "attack_cooldown": 1500, "is_boss": true, "is_big_monster": true }
		],
		"zombie_health": 2, "zombie_speed": 45, "zombie_damage": 20,
	},
	{
		"name": "Bigger Room", "theme": "storage",
		"start": { "x": 80, "y": 400 },
		"walls": [], "_wall_set": "open",
		"door": DOORS.right,
		"keys_needed": 1,
		"items": [
			{ "type": "key", "x": 120, "y": 80, "size": 8 },
			{ "type": "ammo", "x": 320, "y": 240, "size": 8, "amount": 6 },
			{ "type": "ammo", "x": 540, "y": 80, "size": 8, "amount": 4 },
			{ "type": "med",  "x": 80,  "y": 360, "size": 8, "amount": 40 },
		],
		"zombies": [
			{ "x": 200, "y": 120 }, { "x": 500, "y": 80 }, { "x": 450, "y": 350 },
			{ "x": 120, "y": 250 }, { "x": 560, "y": 360 }, { "x": 350, "y": 120 },
			{ "x": 320, "y": 320 }, { "x": 520, "y": 250 },
		],
		"zombie_health": 3, "zombie_speed": 52, "zombie_damage": 25,
		"feeding_scene": { "x": 350, "y": 200 },
		"decorations": [
			{ "type": "crate", "x": 150, "y": 80, "w": 30, "h": 30 },
			{ "type": "crate", "x": 185, "y": 80, "w": 30, "h": 30 },
			{ "type": "locker", "x": 520, "y": 60, "w": 25, "h": 45 },
			{ "type": "gasCan", "x": 480, "y": 350, "w": 20, "h": 25 },
			{ "type": "blood", "x": 340, "y": 190, "w": 50, "h": 40 },
		],
	},
	{
		"name": "Two Keys", "theme": "lab",
		"start": { "x": 80, "y": 360 },
		"walls": [], "_wall_set": "mansion",
		"door": DOORS.right,
		"keys_needed": 2,
		"items": [
			{ "type": "key", "x": 120, "y": 120, "size": 8 },
			{ "type": "key", "x": 520, "y": 120, "size": 8 },
			{ "type": "ammo", "x": 300, "y": 100, "size": 8, "amount": 4 },
			{ "type": "ammo", "x": 450, "y": 360, "size": 8, "amount": 4 },
			{ "type": "med",  "x": 100, "y": 360, "size": 8, "amount": 40 },
		],
		"zombies": [
			{ "x": 160, "y": 120 }, { "x": 540, "y": 120 }, { "x": 480, "y": 120 },
			{ "x": 160, "y": 360 }, { "x": 450, "y": 360 }, { "x": 320, "y": 240 },
		],
		"zombie_health": 3, "zombie_speed": 62, "zombie_damage": 25,
		"decorations": [
			{ "type": "testTube", "x": 80, "y": 80, "w": 15, "h": 30 },
			{ "type": "testTube", "x": 100, "y": 80, "w": 15, "h": 30 },
			{ "type": "chemicalSpill", "x": 320, "y": 200, "w": 50, "h": 40 },
			{ "type": "desk", "x": 480, "y": 80, "w": 70, "h": 30 },
			{ "type": "blood", "x": 200, "y": 350, "w": 40, "h": 30 },
		],
	},
	{
		"name": "Horde", "theme": "medical",
		"start": { "x": 80, "y": 360 },
		"walls": [], "_wall_set": "mansion",
		"door": DOORS.right,
		"keys_needed": 1,
		"items": [
			{ "type": "key", "x": 540, "y": 120, "size": 8 },
			{ "type": "ammo", "x": 500, "y": 100, "size": 8, "amount": 4 },
			{ "type": "ammo", "x": 450, "y": 360, "size": 8, "amount": 4 },
			{ "type": "ammo", "x": 120, "y": 120, "size": 8, "amount": 6 },
			{ "type": "med",  "x": 100, "y": 360, "size": 8, "amount": 60 },
		],
		"zombies": [
			{ "x": 160, "y": 120 }, { "x": 500, "y": 120 }, { "x": 480, "y": 120 },
			{ "x": 160, "y": 360 }, { "x": 450, "y": 360 }, { "x": 540, "y": 360 },
			{ "x": 300, "y": 120 }, { "x": 300, "y": 240 }, { "x": 320, "y": 360 }, { "x": 200, "y": 240 },
		],
		"zombie_health": 4, "zombie_speed": 55, "zombie_damage": 35,
		"decorations": [
			{ "type": "hospitalBed", "x": 80, "y": 80, "w": 60, "h": 35 },
			{ "type": "hospitalBed", "x": 480, "y": 80, "w": 60, "h": 35 },
			{ "type": "bloodTrail", "x": 200, "y": 200, "w": 80, "h": 15 },
			{ "type": "plant", "x": 540, "y": 380, "w": 25, "h": 30 },
			{ "type": "blood", "x": 350, "y": 300, "w": 45, "h": 35 },
		],
	},
	{
		"name": "Magnum Run", "theme": "office",
		"start": { "x": 80, "y": 360 },
		"walls": [], "_wall_set": "mansion",
		"door": DOORS.right,
		"keys_needed": 1,
		"items": [
			{ "type": "weapon", "x": 320, "y": 240, "size": 10, "weapon": "Shotgun", "amount": 12 },
			{ "type": "key", "x": 120, "y": 120, "size": 8 },
			{ "type": "greyKey", "x": 500, "y": 240, "size": 8 },
			{ "type": "ammo", "x": 500, "y": 100, "size": 8, "amount": 4 },
			{ "type": "ammo", "x": 450, "y": 360, "size": 8, "amount": 4 },
			{ "type": "med",  "x": 100, "y": 360, "size": 8, "amount": 80 },
		],
		"zombies": [
			{ "x": 160, "y": 120 }, { "x": 500, "y": 120 }, { "x": 480, "y": 120 },
			{ "x": 160, "y": 360 }, { "x": 450, "y": 360 }, { "x": 320, "y": 150 },
			{ "x": 320, "y": 320 }, { "x": 540, "y": 360 }, { "x": 540, "y": 120 },
			{ "x": 250, "y": 240 },
		],
		"zombie_health": 8, "zombie_speed": 70, "zombie_damage": 40,
		"decorations": [
			{ "type": "desk", "x": 80, "y": 80, "w": 80, "h": 35 },
			{ "type": "computer", "x": 100, "y": 60, "w": 30, "h": 25 },
			{ "type": "filingCabinet", "x": 480, "y": 60, "w": 30, "h": 50 },
			{ "type": "filingCabinet", "x": 510, "y": 60, "w": 30, "h": 50 },
			{ "type": "blood", "x": 300, "y": 300, "w": 50, "h": 35 },
		],
	},
	{
		"name": "Nightmare Hall", "theme": "storage",
		"start": { "x": 80, "y": 360 },
		"walls": [], "_wall_set": "mansion",
		"door": DOORS.right,
		"keys_needed": 2,
		"items": [
			{ "type": "key", "x": 120, "y": 120, "size": 8 },
			{ "type": "key", "x": 540, "y": 120, "size": 8 },
			{ "type": "ammo", "x": 320, "y": 240, "size": 8, "amount": 4 },
			{ "type": "ammo", "x": 450, "y": 360, "size": 8, "amount": 4 },
			{ "type": "med",  "x": 100, "y": 360, "size": 8, "amount": 50 },
		],
		"zombies": [
			{ "x": 160, "y": 120 }, { "x": 500, "y": 120 }, { "x": 480, "y": 120 },
			{ "x": 160, "y": 360 }, { "x": 450, "y": 360 }, { "x": 540, "y": 360 },
			{ "x": 300, "y": 120 }, { "x": 300, "y": 240 }, { "x": 320, "y": 360 },
			{ "x": 200, "y": 240 }, { "x": 540, "y": 240 }, { "x": 120, "y": 240 },
		],
		"zombie_health": 5, "zombie_speed": 66, "zombie_damage": 35,
		"decorations": [
			{ "type": "crate", "x": 150, "y": 80, "w": 30, "h": 30 },
			{ "type": "crate", "x": 185, "y": 80, "w": 30, "h": 30 },
			{ "type": "crate", "x": 150, "y": 115, "w": 30, "h": 30 },
			{ "type": "locker", "x": 520, "y": 60, "w": 25, "h": 45 },
			{ "type": "gasCan", "x": 480, "y": 350, "w": 20, "h": 25 },
			{ "type": "blood", "x": 350, "y": 200, "w": 40, "h": 30 },
		],
	},
	{
		"name": "Open Chamber", "theme": "lab",
		"start": { "x": 80, "y": 400 },
		"walls": [
			{ "x": 460, "y": 60,  "w": 120, "h": 20 }, { "x": 460, "y": 140, "w": 120, "h": 20 },
			{ "x": 440, "y": 60,  "w": 20,  "h": 20 }, { "x": 440, "y": 140, "w": 20,  "h": 20 },
		],
		"_wall_set": "open",
		"door": DOORS.right,
		"grey_door": { "x": 440, "y": 80, "w": 20, "h": 60 },
		"keys_needed": 1,
		"items": [
			{ "type": "key", "x": 120, "y": 80, "size": 8 },
			{ "type": "weapon", "x": 500, "y": 100, "size": 10, "weapon": "Grenade Launcher", "amount": 5 },
			{ "type": "ammo", "x": 320, "y": 240, "size": 8, "amount": 6 },
			{ "type": "ammo", "x": 540, "y": 80, "size": 8, "amount": 4 },
			{ "type": "ammo", "x": 120, "y": 360, "size": 8, "amount": 4 },
			{ "type": "med",  "x": 540, "y": 360, "size": 8, "amount": 60 },
		],
		"zombies": [
			{ "x": 200, "y": 120 }, { "x": 450, "y": 350 },
			{ "x": 120, "y": 250 }, { "x": 560, "y": 360 }, { "x": 350, "y": 120 },
			{ "x": 320, "y": 320 }, { "x": 520, "y": 250 }, { "x": 250, "y": 80 },
			{ "x": 560, "y": 160 }, { "x": 100, "y": 160 }, { "x": 350, "y": 350 },
			{ "x": 520, "y": 120 }, { "x": 200, "y": 360 },
		],
		"zombie_health": 6, "zombie_speed": 70, "zombie_damage": 38,
		"decorations": [
			{ "type": "testTube", "x": 80, "y": 80, "w": 15, "h": 30 },
			{ "type": "testTube", "x": 100, "y": 80, "w": 15, "h": 30 },
			{ "type": "testTube", "x": 120, "y": 80, "w": 15, "h": 30 },
			{ "type": "chemicalSpill", "x": 320, "y": 200, "w": 60, "h": 45 },
			{ "type": "desk", "x": 480, "y": 80, "w": 70, "h": 30 },
			{ "type": "blood", "x": 200, "y": 350, "w": 45, "h": 30 },
		],
	},
	{
		"name": "Triple Lock", "theme": "medical",
		"start": { "x": 80, "y": 360 },
		"walls": [], "_wall_set": "mansion",
		"door": DOORS.right,
		"keys_needed": 3,
		"items": [
			{ "type": "key", "x": 120, "y": 120, "size": 8 },
			{ "type": "key", "x": 520, "y": 120, "size": 8 },
			{ "type": "key", "x": 540, "y": 360, "size": 8 },
			{ "type": "ammo", "x": 300, "y": 240, "size": 8, "amount": 6 },
			{ "type": "ammo", "x": 450, "y": 360, "size": 8, "amount": 4 },
			{ "type": "med",  "x": 100, "y": 360, "size": 8, "amount": 70 },
		],
		"zombies": [
			{ "x": 160, "y": 120 }, { "x": 500, "y": 120 }, { "x": 540, "y": 120 },
			{ "x": 160, "y": 360 }, { "x": 450, "y": 360 }, { "x": 540, "y": 360 },
			{ "x": 300, "y": 120 }, { "x": 300, "y": 240 }, { "x": 320, "y": 360 },
			{ "x": 200, "y": 240 }, { "x": 540, "y": 240 }, { "x": 120, "y": 240 },
			{ "x": 400, "y": 200 },
		],
		"zombie_health": 7, "zombie_speed": 72, "zombie_damage": 40,
		"decorations": [
			{ "type": "hospitalBed", "x": 80, "y": 80, "w": 60, "h": 35 },
			{ "type": "hospitalBed", "x": 480, "y": 80, "w": 60, "h": 35 },
			{ "type": "bloodTrail", "x": 200, "y": 180, "w": 100, "h": 15 },
			{ "type": "bloodTrail", "x": 350, "y": 280, "w": 80, "h": 15 },
			{ "type": "plant", "x": 540, "y": 380, "w": 25, "h": 30 },
			{ "type": "blood", "x": 300, "y": 350, "w": 50, "h": 35 },
		],
	},
	{
		"name": "Heavy Breach", "theme": "escape",
		"start": { "x": 80, "y": 400 },
		"walls": [], "_wall_set": "open",
		"door": DOORS.right,
		"keys_needed": 1,
		"items": [
			{ "type": "weapon", "x": 320, "y": 240, "size": 10, "weapon": "Shotgun", "amount": 14 },
			{ "type": "key", "x": 540, "y": 400, "size": 8 },
			{ "type": "ammo", "x": 120, "y": 80, "size": 8, "amount": 4 },
			{ "type": "ammo", "x": 120, "y": 360, "size": 8, "amount": 4 },
			{ "type": "med",  "x": 540, "y": 80, "size": 8, "amount": 80 },
		],
		"zombies": [
			{ "x": 200, "y": 120 }, { "x": 500, "y": 80 }, { "x": 450, "y": 350 },
			{ "x": 120, "y": 250 }, { "x": 560, "y": 360 }, { "x": 350, "y": 120 },
			{ "x": 320, "y": 320 }, { "x": 520, "y": 250 }, { "x": 250, "y": 80 },
			{ "x": 560, "y": 160 }, { "x": 100, "y": 160 }, { "x": 350, "y": 350 },
			{ "x": 520, "y": 120 }, { "x": 200, "y": 360 }, { "x": 450, "y": 120 },
		],
		"zombie_health": 10, "zombie_speed": 72, "zombie_damage": 45,
		"decorations": [
			{ "type": "warningSign", "x": 300, "y": 60, "w": 25, "h": 25 },
			{ "type": "gasCan", "x": 150, "y": 350, "w": 20, "h": 25 },
			{ "type": "gasCan", "x": 480, "y": 350, "w": 20, "h": 25 },
			{ "type": "blood", "x": 250, "y": 200, "w": 50, "h": 35 },
			{ "type": "blood", "x": 400, "y": 300, "w": 45, "h": 30 },
		],
	},
	{
		"name": "Final Escape", "theme": "escape",
		"start": { "x": 80, "y": 360 },
		"walls": [], "_wall_set": "mansion",
		"door": DOORS.right,
		"keys_needed": 2,
		"items": [
			{ "type": "weapon", "x": 320, "y": 240, "size": 10, "weapon": "Shotgun", "amount": 16 },
			{ "type": "key", "x": 120, "y": 120, "size": 8 },
			{ "type": "key", "x": 540, "y": 120, "size": 8 },
			{ "type": "ammo", "x": 300, "y": 100, "size": 8, "amount": 6 },
			{ "type": "ammo", "x": 450, "y": 360, "size": 8, "amount": 4 },
			{ "type": "med",  "x": 100, "y": 360, "size": 8, "amount": 100 },
		],
		"zombies": [
			{ "x": 160, "y": 120 }, { "x": 500, "y": 120 }, { "x": 540, "y": 120 },
			{ "x": 160, "y": 360 }, { "x": 450, "y": 360 }, { "x": 540, "y": 360 },
			{ "x": 300, "y": 120 }, { "x": 300, "y": 240 }, { "x": 320, "y": 360 },
			{ "x": 200, "y": 240 }, { "x": 540, "y": 240 }, { "x": 120, "y": 240 },
			{ "x": 520, "y": 360 }, { "x": 350, "y": 80 }, { "x": 250, "y": 120 },
			{ "x": 120, "y": 360 }, { "x": 500, "y": 240 }, { "x": 450, "y": 120 },
		],
		"zombie_health": 12, "zombie_speed": 75, "zombie_damage": 50,
		"decorations": [
			{ "type": "warningSign", "x": 300, "y": 60, "w": 25, "h": 25 },
			{ "type": "warningSign", "x": 100, "y": 200, "w": 25, "h": 25 },
			{ "type": "gasCan", "x": 480, "y": 80, "w": 20, "h": 25 },
			{ "type": "blood", "x": 200, "y": 250, "w": 55, "h": 35 },
			{ "type": "blood", "x": 400, "y": 320, "w": 50, "h": 35 },
			{ "type": "bloodTrail", "x": 250, "y": 180, "w": 120, "h": 15 },
		],
	},
]

const LORE_NOTES := [
	{ "x": 80, "y": 80, "text": "Front door is jammed. Find another way out." },
	{ "x": 560, "y": 80, "text": "This hall held parties. Now it holds bodies." },
	{ "x": 300, "y": 80, "text": "Two keys for two locks. Someone wanted guests to stay." },
	{ "x": 80, "y": 120, "text": "They keep coming. The bites are not the worst part." },
	{ "x": 560, "y": 360, "text": "A magnum is hidden in the east wing. Heavy hands only." },
	{ "x": 300, "y": 240, "text": "The halls loop. I keep passing the same portrait." },
	{ "x": 80, "y": 80, "text": "The grey door needs a master key. It is in the archives." },
	{ "x": 560, "y": 80, "text": "Three locks? This was never just a house." },
	{ "x": 560, "y": 120, "text": "The breach is here. They are breaking through the walls." },
	{ "x": 300, "y": 80, "text": "Get to the helipad. It is the only way off this estate." },
]

const MASTER_KEY_SPAWNS := [
	null, null, null, null, null, null,
	{ "x": 300, "y": 120 },
	{ "x": 300, "y": 120 },
	{ "x": 560, "y": 80 },
	{ "x": 120, "y": 80 },
]

const SECRET_WALLS := [
	[],
	[{ "x": 300, "y": 180, "w": 20, "h": 80, "hp": 10, "breakable": true, "contains": { "type": "ammo", "amount": 10, "size": 8 } }],
	[{ "x": 500, "y": 260, "w": 60, "h": 20, "hp": 12, "breakable": true, "contains": { "type": "med", "amount": 40, "size": 8 } }],
	[{ "x": 200, "y": 120, "w": 20, "h": 60, "hp": 15, "breakable": true, "contains": { "type": "ammo", "amount": 12, "size": 8 } }],
	[{ "x": 400, "y": 300, "w": 80, "h": 20, "hp": 18, "breakable": true, "contains": { "type": "weapon", "weapon": "Shotgun", "amount": 8, "size": 10 } }],
	[{ "x": 100, "y": 200, "w": 20, "h": 60, "hp": 20, "breakable": true, "contains": { "type": "med", "amount": 80, "size": 8 } }],
	[{ "x": 540, "y": 160, "w": 40, "h": 20, "hp": 15, "breakable": true, "contains": { "type": "ammo", "amount": 12, "size": 8 } }],
	[{ "x": 300, "y": 240, "w": 20, "h": 60, "hp": 18, "breakable": true, "contains": { "type": "med", "amount": 60, "size": 8 } }],
	[{ "x": 120, "y": 80, "w": 80, "h": 20, "hp": 25, "breakable": true, "contains": { "type": "ammo", "amount": 16, "size": 8 } }],
	[{ "x": 300, "y": 240, "w": 60, "h": 20, "hp": 30, "breakable": true, "contains": { "type": "weapon", "weapon": "Shotgun", "amount": 10, "size": 10 } }],
]

# Loot table for locked item doors (every 3rd level, mirrored from JS).
const ITEM_DOOR_LOOT := [
	{ "type": "ammo", "amount": 8 },
	{ "type": "med", "amount": 40 },
	{ "type": "ammo", "amount": 8 },
	{ "type": "med", "amount": 60 },
	{ "type": "weapon", "weapon": "Pistol", "amount": 12 },
	{ "type": "ammo", "amount": 8 },
	{ "type": "med", "amount": 60 },
	{ "type": "ammo", "amount": 8 },
	{ "type": "med", "amount": 80 },
	{ "type": "weapon", "weapon": "Shotgun", "amount": 12 },
]

const BIG_MONSTER_DEF := { "size": 28, "speed": 40, "health": 20, "max_health": 20, "damage": 30, "attack_cooldown": 1500, "is_boss": true, "is_big_monster": true }

# Resolved wall list for a level (outer + interior set + per-level extras).
static func level_walls(lvl: Dictionary) -> Array:
	var out: Array = []
	for w in OUTER_WALLS:
		out.append(w.duplicate())
	var interior: Array = INNER_MANSION if lvl.get("_wall_set") == "mansion" else INNER_OPEN
	for w in interior:
		out.append(w.duplicate())
	for w in lvl.get("walls", []):
		out.append(w.duplicate())
	return out

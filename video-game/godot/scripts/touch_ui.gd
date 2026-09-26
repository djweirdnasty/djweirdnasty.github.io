class_name TouchUI
extends Control

## Virtual on-screen controls for touch devices (port of the 2D game's
## touch layer). Buttons feed InputEventAction through
## Input.parse_input_event so gameplay input flows through the same
## InputMap actions as the keyboard/mouse bindings — movement reaches
## Input.get_axis in _physics_process, action presses reach
## _unhandled_input in main.gd. Taps outside the buttons still reach the
## viewport, where mouse-from-touch emulation drives aim + click-shoot.
## FIRE mirrors the 2D game: one button covers shooting, grab/getup
## mashing, and restart.

const GREEN := Color(0.0, 1.0, 0.0)
const BTN := 72.0
const GAP := 10.0

var mono := SystemFont.new()


func _ready() -> void:
	mono.font_names = PackedStringArray(["Courier New", "Courier", "monospace"])
	# Parent is a CanvasLayer, so anchor stretching does not apply —
	# size the root manually and keep it synced with the viewport.
	position = Vector2.ZERO
	size = get_viewport_rect().size
	get_viewport().size_changed.connect(func(): size = get_viewport_rect().size)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_build_dpad()
	_build_actions()


# Screen taps are emulated to mouse events and GUI controls may consume
# them before _unhandled_input, so reveal on the first real touch here —
# _input sees every event regardless of consumption.
func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch or event is InputEventScreenDrag:
		visible = true


func _press(action: String, pressed: bool) -> void:
	var ev := InputEventAction.new()
	ev.action = action
	ev.pressed = pressed
	Input.parse_input_event(ev)


func _button(text: String) -> Button:
	var b := Button.new()
	b.text = text
	b.size = Vector2(BTN, BTN)
	b.custom_minimum_size = Vector2(BTN, BTN)
	b.focus_mode = Control.FOCUS_NONE
	b.add_theme_font_override("font", mono)
	b.add_theme_font_size_override("font_size", 24)
	b.add_theme_color_override("font_color", GREEN)
	var bs := StyleBoxFlat.new()
	bs.bg_color = Color(0.0, 0.4, 0.0, 0.35)
	bs.border_color = GREEN
	bs.set_border_width_all(2)
	bs.set_corner_radius_all(10)
	b.add_theme_stylebox_override("normal", bs)
	var bsh: StyleBoxFlat = bs.duplicate()
	bsh.bg_color = Color(0.0, 0.6, 0.0, 0.55)
	b.add_theme_stylebox_override("hover", bsh)
	b.add_theme_stylebox_override("pressed", bsh)
	return b


func _hold_button(action: String, text: String) -> Button:
	var b := _button(text)
	b.button_down.connect(func(): _press(action, true))
	b.button_up.connect(func(): _press(action, false))
	return b


func _build_dpad() -> void:
	var d := Control.new()
	d.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	d.position = Vector2(16, -(3 * BTN + 2 * GAP + 16))
	d.size = Vector2(3 * BTN + 2 * GAP, 3 * BTN + 2 * GAP)
	add_child(d)
	var up := _hold_button("move_up", "^")
	up.position = Vector2(BTN + GAP, 0)
	d.add_child(up)
	var left := _hold_button("move_left", "<")
	left.position = Vector2(0, BTN + GAP)
	d.add_child(left)
	var right := _hold_button("move_right", ">")
	right.position = Vector2(2 * (BTN + GAP), BTN + GAP)
	d.add_child(right)
	var down := _hold_button("move_down", "v")
	down.position = Vector2(BTN + GAP, 2 * (BTN + GAP))
	d.add_child(down)


func _build_actions() -> void:
	var a := Control.new()
	a.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	a.position = Vector2(-(4 * BTN + 3 * GAP + 16), -(3 * BTN + 2 * GAP + 16))
	a.size = Vector2(4 * BTN + 3 * GAP, 3 * BTN + 2 * GAP)
	add_child(a)
	for i in 4:
		var w := _hold_button("weapon_%d" % (i + 1), str(i + 1))
		w.position = Vector2(i * (BTN + GAP), 0)
		a.add_child(w)
	var e := _hold_button("interact", "E")
	e.position = Vector2(0, BTN + GAP)
	a.add_child(e)
	var r := _hold_button("reload", "R")
	r.position = Vector2(0, 2 * (BTN + GAP))
	a.add_child(r)
	var fire := _button("FIRE")
	fire.size = Vector2(3 * BTN + 2 * GAP, 2 * BTN + GAP)
	fire.custom_minimum_size = fire.size
	fire.position = Vector2(BTN + GAP, BTN + GAP)
	fire.button_down.connect(func(): _press("mash", true); _press("shoot", true))
	fire.button_up.connect(func(): _press("shoot", false); _press("mash", false))
	a.add_child(fire)

class_name TouchUI
extends Control

## Virtual on-screen controls for touch devices (port of the 2D game's
## touch layer). A floating analog stick handles movement; FIRE / E / R /
## weapon buttons inject InputEventAction through Input.parse_input_event
## so they flow through the same InputMap actions as the keyboard/mouse
## bindings — movement reaches Input.get_axis in _physics_process, action
## presses reach _unhandled_input in main.gd.
##
## Taps outside the controls still reach the viewport, where
## mouse-from-touch emulation drives aim. While a touch is captured by
## the controls (is_capturing()), main.gd skips the aim projection so the
## crosshair/facing does not jump to fingers resting on the stick or
## buttons. FIRE mirrors the 2D game: one button covers shooting,
## grab/getup mashing, and restart.

const GREEN := Color(0.0, 1.0, 0.0)
const BTN := 72.0
const GAP := 10.0


## Floating analog stick — touch anywhere in its zone plants the base at
## the fingertip; dragging emits a normalized direction. Released touches
## recenter to zero. Draws itself; no textures needed.
class JoyStick extends Control:
	const R := 100.0        # max knob travel
	const KNOB_R := 40.0
	const DEAD := 0.12      # deadzone on the normalized axis

	var value := Vector2.ZERO
	var _tid := -1
	var _origin := Vector2.ZERO
	var _knob := Vector2.ZERO


	func _gui_input(event: InputEvent) -> void:
		if event is InputEventScreenTouch and event.pressed and _tid == -1:
			_tid = event.index
			_origin = event.position
			_drag(event.position)


	func _input(event: InputEvent) -> void:
		if _tid == -1:
			return
		if event is InputEventScreenDrag and event.index == _tid:
			_drag(event.position - global_position)
		elif event is InputEventScreenTouch and not event.pressed and event.index == _tid:
			_tid = -1
			_knob = Vector2.ZERO
			_apply(Vector2.ZERO)


	func _drag(local_pos: Vector2) -> void:
		var v := local_pos - _origin
		if v.length() > R:
			v = v.normalized() * R
		_knob = v
		_apply(v / R)


	func _apply(v: Vector2) -> void:
		value = Vector2.ZERO if v.length() < DEAD else v
		queue_redraw()


	func _draw() -> void:
		var c := size * 0.5
		# Idle hint so players know the zone is there.
		draw_arc(c, R * 0.8, 0.0, TAU, 64, Color(GREEN, 0.35), 3.0, true)
		draw_circle(c, KNOB_R * 0.8, Color(0.0, 0.5, 0.0, 0.15))
		if _tid == -1:
			return
		draw_circle(_origin, R, Color(0.0, 0.4, 0.0, 0.25))
		draw_arc(_origin, R, 0.0, TAU, 64, Color(GREEN, 0.8), 2.5, true)
		draw_circle(_origin + _knob, KNOB_R, Color(0.0, 0.7, 0.0, 0.55))
		draw_arc(_origin + _knob, KNOB_R, 0.0, TAU, 48, Color(GREEN, 0.95), 2.5, true)


var mono := SystemFont.new()
var _stick: JoyStick
var _zones: Array[Control] = []
var _captured := {}          # touch indices that started on the UI
var _move_actions := ["move_left", "move_right", "move_up", "move_down"]
var _move_strengths := [0.0, 0.0, 0.0, 0.0]


func _ready() -> void:
	mono.font_names = PackedStringArray(["Courier New", "Courier", "monospace"])
	# Parent is a CanvasLayer, so anchor stretching does not apply —
	# size the root manually and keep it synced with the viewport.
	position = Vector2.ZERO
	size = get_viewport_rect().size
	get_viewport().size_changed.connect(func(): size = get_viewport_rect().size)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_build_stick()
	_build_actions()


# Screen taps are emulated to mouse events and GUI controls may consume
# them before _unhandled_input, so reveal on the first real touch here —
# _input sees every event regardless of consumption. Also track which
# touches started on UI zones so main.gd can freeze aim during them.
func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch or event is InputEventScreenDrag:
		visible = true
	if event is InputEventScreenTouch:
		if event.pressed:
			if _hits_zone(event.position):
				_captured[event.index] = true
		else:
			_captured.erase(event.index)


func is_capturing() -> bool:
	return not _captured.is_empty()


func _hits_zone(viewport_pos: Vector2) -> bool:
	for z in _zones:
		if z.get_global_rect().has_point(viewport_pos):
			return true
	return false


# Push the stick's analog direction into the move_* actions as strengths,
# so Input.get_axis reports partial deflection — walk speed scales with
# how far the stick is pushed.
func _process(_dt: float) -> void:
	if _stick == null:
		return
	var v := _stick.value
	var s := [maxf(-v.x, 0.0), maxf(v.x, 0.0), maxf(-v.y, 0.0), maxf(v.y, 0.0)]
	for i in 4:
		if s[i] == _move_strengths[i]:
			continue
		_move_strengths[i] = s[i]
		var ev := InputEventAction.new()
		ev.action = _move_actions[i]
		ev.pressed = s[i] > 0.0
		ev.strength = s[i]
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


func _press(action: String, pressed: bool) -> void:
	var ev := InputEventAction.new()
	ev.action = action
	ev.pressed = pressed
	Input.parse_input_event(ev)


func _build_stick() -> void:
	_stick = JoyStick.new()
	_stick.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	_stick.position = Vector2(12, -(300 + 12))
	_stick.size = Vector2(330, 300)
	add_child(_stick)
	_zones.append(_stick)


func _build_actions() -> void:
	var a := Control.new()
	a.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	a.position = Vector2(-(4 * BTN + 3 * GAP + 16), -(3 * BTN + 2 * GAP + 16))
	a.size = Vector2(4 * BTN + 3 * GAP, 3 * BTN + 2 * GAP)
	add_child(a)
	_zones.append(a)
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

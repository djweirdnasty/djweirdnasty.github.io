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
const BTN := 56.0
const GAP := 8.0


## Floating analog stick — touch anywhere in its zone plants the base at
## the fingertip; dragging emits a normalized direction. Released touches
## recenter to zero. Draws itself; no textures needed.
class JoyStick extends Control:
	const DEAD := 0.12      # deadzone on the normalized axis

	var value := Vector2.ZERO
	var scale_factor := 1.0
	var active := false
	var _tid := -1
	var _origin := Vector2.ZERO
	var _knob := Vector2.ZERO


	func _gui_input(event: InputEvent) -> void:
		if event is InputEventScreenTouch and event.pressed and _tid == -1:
			_tid = event.index
			active = true
			_origin = event.position
			_drag(event.position)


	func _input(event: InputEvent) -> void:
		if _tid == -1:
			return
		if event is InputEventScreenDrag and event.index == _tid:
			_drag(event.position - global_position)
		elif event is InputEventScreenTouch and not event.pressed and event.index == _tid:
			_tid = -1
			active = false
			_knob = Vector2.ZERO
			_apply(Vector2.ZERO)


	func _drag(local_pos: Vector2) -> void:
		var v := local_pos - _origin
		var travel := minf(100.0 * scale_factor, size.x * 0.38)
		if v.length() > travel:
			v = v.normalized() * travel
		_knob = v
		_apply(v / travel)


	func _apply(v: Vector2) -> void:
		value = Vector2.ZERO if v.length() < DEAD else v
		queue_redraw()


	func _draw() -> void:
		var c := size * 0.5
		var radius := minf(100.0 * scale_factor, size.x * 0.38)
		var knob_radius := minf(40.0 * scale_factor, size.x * 0.16)
		# Idle hint so players know the zone is there.
		draw_arc(c, radius * 0.8, 0.0, TAU, 64, Color(GREEN, 0.35), 3.0 * scale_factor, true)
		draw_circle(c, knob_radius * 0.8, Color(0.0, 0.5, 0.0, 0.15))
		if _tid == -1:
			return
		draw_circle(_origin, radius, Color(0.0, 0.4, 0.0, 0.25))
		draw_arc(_origin, radius, 0.0, TAU, 64, Color(GREEN, 0.8), 2.5 * scale_factor, true)
		draw_circle(_origin + _knob, knob_radius, Color(0.0, 0.7, 0.0, 0.55))
		draw_arc(_origin + _knob, knob_radius, 0.0, TAU, 48, Color(GREEN, 0.95), 2.5 * scale_factor, true)


var mono := SystemFont.new()
var control_scale := 1.0
var handedness := "right"
var aim_direction := Vector2.RIGHT
var _stick: JoyStick
var _aim_stick: JoyStick
var _actions: Control
var _zones: Array[Control] = []
var _captured := {}          # touch indices that started on the UI
var _move_actions := ["move_left", "move_right", "move_up", "move_down"]
var _move_strengths := [0.0, 0.0, 0.0, 0.0]
var _weapon_buttons: Array[Button] = []
var _interact_button: Button
var _reload_button: Button
var _fire_button: Button
var _aim_mode := false


func _ready() -> void:
	mono.font_names = PackedStringArray(["Courier New", "Courier", "monospace"])
	# Parent is a CanvasLayer, so anchor stretching does not apply —
	# size the root manually and keep it synced with the viewport.
	position = Vector2.ZERO
	size = get_viewport_rect().size
	get_viewport().size_changed.connect(func(): size = get_viewport_rect().size; _layout_controls())
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_build_stick()
	_build_actions()
	_layout_controls()


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
				if _aim_stick.get_global_rect().has_point(event.position):
					_aim_mode = true
			else:
				_aim_mode = false
		else:
			_captured.erase(event.index)


func is_capturing() -> bool:
	return not _captured.is_empty()


func is_aiming() -> bool:
	return _aim_mode and aim_direction != Vector2.ZERO


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
	if _aim_stick.active and _aim_stick.value.length() >= JoyStick.DEAD:
		aim_direction = _aim_stick.value.normalized()


func set_control_scale(value: float) -> void:
	control_scale = clampf(value, 0.75, 1.35)
	_layout_controls()


func set_handedness(value: String) -> void:
	handedness = "left" if value == "left" else "right"
	_layout_controls()


func _layout_controls() -> void:
	if _stick == null or _aim_stick == null or _actions == null:
		return
	var s := control_scale
	var pad_side := minf(280.0 * s, maxf(110.0, (size.x - 36.0) * 0.5))
	var pad_size := Vector2.ONE * pad_side
	var left := handedness == "left"
	_stick.scale_factor = s
	_aim_stick.scale_factor = s
	# Corner anchors misbehave for children of a CanvasLayer (offsets are
	# applied against the parent size at write time, then re-resolved), so
	# keep all anchors top-left and use plain parent coordinates — this
	# re-runs whenever the viewport resizes.
	for c in [_stick, _aim_stick, _actions]:
		c.set_anchors_preset(Control.PRESET_TOP_LEFT)
	_stick.size = pad_size
	_aim_stick.size = pad_size
	_stick.position = Vector2(size.x - pad_size.x - 12 if left else 12,
		size.y - pad_size.y - 12)
	_aim_stick.position = Vector2(12 if left else size.x - pad_size.x - 12,
		size.y - pad_size.y - 12)
	var button_size := Vector2(BTN, BTN) * s
	var gap := GAP * s
	var width := 4 * button_size.x + 3 * gap
	# Action cluster sits directly above the aim stick so the same thumb
	# can reach FIRE/E/R without leaving the pad. Weapon row stays on top.
	var actions_h := button_size.y * 2 + gap
	_actions.size = Vector2(width, actions_h)
	_actions.position = Vector2(
		12 if left else size.x - width - 12,
		size.y - pad_size.y - actions_h - 20)
	for i in _weapon_buttons.size():
		_weapon_buttons[i].position = Vector2(i * (button_size.x + gap), 0)
		_weapon_buttons[i].size = button_size
		_weapon_buttons[i].custom_minimum_size = button_size
		_weapon_buttons[i].add_theme_font_size_override("font_size", roundi(24 * s))
	_interact_button.position = Vector2(0, button_size.y + gap)
	_interact_button.size = button_size
	_interact_button.custom_minimum_size = button_size
	_interact_button.add_theme_font_size_override("font_size", roundi(24 * s))
	_reload_button.position = Vector2(button_size.x + gap, button_size.y + gap)
	_reload_button.size = button_size
	_reload_button.custom_minimum_size = button_size
	_reload_button.add_theme_font_size_override("font_size", roundi(24 * s))
	_fire_button.position = Vector2(2 * (button_size.x + gap), button_size.y + gap)
	_fire_button.size = Vector2(2 * button_size.x + gap, button_size.y)
	_fire_button.custom_minimum_size = _fire_button.size
	_fire_button.add_theme_font_size_override("font_size", roundi(24 * s))


func _button(text: String) -> Button:
	var b := Button.new()
	b.text = text
	b.size = Vector2(BTN, BTN) * control_scale
	b.custom_minimum_size = b.size
	b.focus_mode = Control.FOCUS_NONE
	b.add_theme_font_override("font", mono)
	b.add_theme_font_size_override("font_size", roundi(24 * control_scale))
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
	add_child(_stick)
	_zones.append(_stick)
	_aim_stick = JoyStick.new()
	add_child(_aim_stick)
	_zones.append(_aim_stick)


func _build_actions() -> void:
	_actions = Control.new()
	add_child(_actions)
	_zones.append(_actions)
	for i in 4:
		var weapon := _hold_button("weapon_%d" % (i + 1), str(i + 1))
		_weapon_buttons.append(weapon)
		_actions.add_child(weapon)
	_interact_button = _hold_button("interact", "E")
	_actions.add_child(_interact_button)
	_reload_button = _hold_button("reload", "R")
	_actions.add_child(_reload_button)
	_fire_button = _button("FIRE")
	_fire_button.button_down.connect(func(): _press("mash", true); _press("shoot", true))
	_fire_button.button_up.connect(func(): _press("shoot", false); _press("mash", false))
	_actions.add_child(_fire_button)

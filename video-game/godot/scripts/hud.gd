class_name HUD
extends CanvasLayer

signal new_game_requested
signal resume_requested
signal settings_requested
signal settings_closed
signal setting_changed(name: String, value: Variant)
signal remap_requested(action: String)
signal reset_bindings_requested

## Godot Control recreation of the original game's HTML/canvas UI:
## title screen, cutscene overlay, HUD (portrait, health, ammo, keys, weapon),
## interact prompt, QTE/reload bars, message line, vignette.

const GREEN := Color(0.0, 1.0, 0.0)
const YELLOW := Color(1.0, 1.0, 0.0)

var portrait: TextureRect
var health_fill: ColorRect
var status_label: Label
var info_label: Label
var message_label: Label
var interact_label: Label
var mash_panel: Control
var mash_label: Label
var mash_fill: ColorRect
var reload_fill: ColorRect
var reload_panel: Control
var title_screen: Control
var resume_button: Button
var storage_notice: Label
var settings_panel: Control
var cutscene_panel: Control
var cutscene_text: Label
var win_panel: Control
var vignette: TextureRect
var remap_status: Label

var mono := SystemFont.new()
var _labels: Array[Label] = []
var _setting_controls := {}
var _binding_buttons := {}
var _text_scale := 1.0
var _settings_from_title := false


func _ready() -> void:
	mono.font_names = PackedStringArray(["Courier New", "Courier", "monospace"])
	layer = 10
	_build_hud()
	_build_title()
	_build_settings()
	_build_cutscene()
	_build_win()
	_build_vignette()


func _lbl(text: String, size: int, color: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_override("font", mono)
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.add_theme_color_override("font_shadow_color", Color(0, 0, 0))
	l.add_theme_constant_override("shadow_offset_x", 2)
	l.add_theme_constant_override("shadow_offset_y", 2)
	l.set_meta("base_font_size", size)
	_labels.append(l)
	return l


func _build_hud() -> void:
	var hud := Control.new()
	hud.name = "HudRoot"
	hud.set_anchors_preset(Control.PRESET_FULL_RECT)
	hud.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(hud)
	var options := _button("OPTIONS")
	options.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	options.position = Vector2(-116, 12)
	options.size = Vector2(104, 36)
	options.pressed.connect(func(): open_settings(false); settings_requested.emit())
	hud.add_child(options)

	# Portrait + health bar (top-left, like the canvas HUD).
	var portrait_tex := AtlasTexture.new()
	portrait_tex.atlas = SpritePrep.tex("res://assets/sprites/characters/main-character.png")
	var pw := portrait_tex.atlas.get_width()
	var ph := portrait_tex.atlas.get_height()
	portrait_tex.region = Rect2(pw * 0.15, 0, pw * 0.7, ph * 0.25)
	portrait = TextureRect.new()
	portrait.texture = portrait_tex
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	portrait.position = Vector2(10, 10)
	portrait.size = Vector2(64, 64)
	portrait.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud.add_child(portrait)

	var bar_bg := ColorRect.new()
	bar_bg.color = Color(0.1, 0.1, 0.1, 0.9)
	bar_bg.position = Vector2(82, 38)
	bar_bg.size = Vector2(102, 10)
	bar_bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud.add_child(bar_bg)
	health_fill = ColorRect.new()
	health_fill.color = Color("#20ff40")
	health_fill.position = Vector2(83, 39)
	health_fill.size = Vector2(100, 8)
	health_fill.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud.add_child(health_fill)
	status_label = _lbl("FINE", 13, Color("#20ff40"))
	status_label.position = Vector2(190, 34)
	hud.add_child(status_label)

	info_label = _lbl("", 15, GREEN)
	info_label.position = Vector2(10, 82)
	hud.add_child(info_label)

	message_label = _lbl("", 18, GREEN)
	message_label.set_anchors_preset(Control.PRESET_CENTER_TOP)
	message_label.position = Vector2(-320, 92)
	message_label.size = Vector2(640, 30)
	message_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hud.add_child(message_label)

	interact_label = _lbl("", 16, Color(1.0, 0.85, 0.4))
	interact_label.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	interact_label.position = Vector2(-160, -120)
	interact_label.size = Vector2(320, 24)
	interact_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hud.add_child(interact_label)

	# Mash-QTE bar (struggle / getup).
	mash_panel = Control.new()
	mash_panel.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	mash_panel.position = Vector2(-160, -160)
	mash_panel.size = Vector2(320, 44)
	mash_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	mash_label = _lbl("MASH SPACE!", 16, YELLOW)
	mash_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	mash_label.size = Vector2(320, 20)
	mash_panel.add_child(mash_label)
	var mash_bg := ColorRect.new()
	mash_bg.color = Color(0.1, 0.1, 0.1, 0.9)
	mash_bg.position = Vector2(0, 26)
	mash_bg.size = Vector2(320, 10)
	mash_panel.add_child(mash_bg)
	mash_fill = ColorRect.new()
	mash_fill.color = Color(1.0, 1.0, 0.0)
	mash_fill.position = Vector2(1, 27)
	mash_fill.size = Vector2(0, 8)
	mash_panel.add_child(mash_fill)
	hud.add_child(mash_panel)
	mash_panel.visible = false

	# Reload bar.
	reload_panel = Control.new()
	reload_panel.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	reload_panel.position = Vector2(-100, -160)
	reload_panel.size = Vector2(200, 30)
	reload_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var rl := _lbl("RELOADING", 14, GREEN)
	rl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	rl.size = Vector2(200, 18)
	reload_panel.add_child(rl)
	var rbg := ColorRect.new()
	rbg.color = Color(0.1, 0.1, 0.1, 0.9)
	rbg.position = Vector2(0, 20)
	rbg.size = Vector2(200, 8)
	reload_panel.add_child(rbg)
	reload_fill = ColorRect.new()
	reload_fill.color = Color(0.0, 1.0, 0.0)
	reload_fill.position = Vector2(1, 21)
	reload_fill.size = Vector2(0, 6)
	reload_panel.add_child(reload_fill)
	hud.add_child(reload_panel)
	reload_panel.visible = false


func _panel(color: Color) -> Panel:
	var p := Panel.new()
	p.set_anchors_preset(Control.PRESET_FULL_RECT)
	var sb := StyleBoxFlat.new()
	sb.bg_color = color
	p.add_theme_stylebox_override("panel", sb)
	return p


func _build_title() -> void:
	title_screen = _panel(Color(0.02, 0.02, 0.02, 0.9))
	var v := VBoxContainer.new()
	v.set_anchors_preset(Control.PRESET_CENTER)
	v.position = Vector2(-260, -220)
	v.size = Vector2(520, 440)
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	title_screen.add_child(v)
	var title := _lbl("YOUIE", 64, YELLOW)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(title)
	var help := "WASD / arrows + mouse: move, aim, and shoot | E: interact | R: reload | Touch: dual sticks + FIRE"
	for line in ["Survive the estate. Find a way out.", "", "Find keys, fight zombies, and escape each level.", help]:
		var l := _lbl(line, 16, GREEN)
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		v.add_child(l)
	storage_notice = _lbl("Browser storage may be blocked; progress may not persist.", 14, YELLOW)
	storage_notice.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	storage_notice.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	storage_notice.visible = false
	v.add_child(storage_notice)
	var start := _button("NEW GAME")
	start.pressed.connect(func(): new_game_requested.emit())
	v.add_child(start)
	resume_button = _button("RESUME")
	resume_button.disabled = true
	resume_button.pressed.connect(func(): resume_requested.emit())
	v.add_child(resume_button)
	var options := _button("OPTIONS & ACCESSIBILITY")
	options.pressed.connect(func(): open_settings(true); settings_requested.emit())
	v.add_child(options)
	title_screen.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(title_screen)


func _button(text: String) -> Button:
	var b := Button.new()
	b.text = text
	b.custom_minimum_size = Vector2(220, 42)
	b.add_theme_font_override("font", mono)
	b.add_theme_font_size_override("font_size", 18)
	b.add_theme_color_override("font_color", GREEN)
	b.focus_mode = Control.FOCUS_ALL
	var bs := StyleBoxFlat.new()
	bs.bg_color = Color(0.0, 0.2, 0.0, 0.7)
	bs.border_color = GREEN
	bs.set_border_width_all(1)
	bs.set_corner_radius_all(6)
	b.add_theme_stylebox_override("normal", bs)
	var hover: StyleBoxFlat = bs.duplicate()
	hover.bg_color = Color(0.0, 0.4, 0.0, 0.9)
	b.add_theme_stylebox_override("hover", hover)
	b.add_theme_stylebox_override("pressed", hover)
	return b


func _build_settings() -> void:
	settings_panel = _panel(Color(0.01, 0.01, 0.01, 0.96))
	settings_panel.visible = false
	var layout := VBoxContainer.new()
	layout.set_anchors_preset(Control.PRESET_FULL_RECT)
	layout.offset_left = 24
	layout.offset_top = 18
	layout.offset_right = -24
	layout.offset_bottom = -18
	settings_panel.add_child(layout)
	var heading := _lbl("OPTIONS & ACCESSIBILITY", 30, YELLOW)
	heading.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	layout.add_child(heading)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_child(scroll)
	var rows := VBoxContainer.new()
	rows.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(rows)
	_add_option_row(rows, "Struggle / get-up", "qte_mode", ["Rapid presses", "Hold", "Reduced presses"], ["press", "hold", "assist"])
	_add_option_row(rows, "Touch layout", "touch_layout", ["Right-handed", "Left-handed"], ["right", "left"])
	_add_slider_row(rows, "Touch control size", "touch_size", 0.75, 1.35, 0.05)
	_add_slider_row(rows, "Aim sensitivity", "aim_sensitivity", 0.5, 2.0, 0.1)
	_add_slider_row(rows, "Text size", "text_scale", 0.8, 1.5, 0.1)
	var controls := _lbl("Keyboard bindings — select an action, then press a key", 16, YELLOW)
	rows.add_child(controls)
	for action in ["move_up", "move_down", "move_left", "move_right", "interact", "reload", "mash"]:
		var row := HBoxContainer.new()
		var name := _lbl(action.replace("_", " ").capitalize(), 16, GREEN)
		name.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(name)
		var key_button := _button("Unassigned")
		key_button.custom_minimum_size = Vector2(180, 36)
		key_button.pressed.connect(func(): remap_requested.emit(action))
		_binding_buttons[action] = key_button
		row.add_child(key_button)
		rows.add_child(row)
	remap_status = _lbl("", 15, YELLOW)
	remap_status.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	rows.add_child(remap_status)
	var reset := _button("RESTORE DEFAULT KEYS")
	reset.pressed.connect(func(): reset_bindings_requested.emit())
	layout.add_child(reset)
	var back := _button("BACK")
	back.pressed.connect(close_settings)
	layout.add_child(back)
	add_child(settings_panel)


func _add_option_row(parent: VBoxContainer, label: String, key: String, names: Array, values: Array) -> void:
	var row := HBoxContainer.new()
	var title := _lbl(label, 17, GREEN)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(title)
	var option := OptionButton.new()
	option.add_theme_font_override("font", mono)
	for i in names.size():
		option.add_item(names[i])
		option.set_item_metadata(i, values[i])
	option.item_selected.connect(func(index: int): setting_changed.emit(key, option.get_item_metadata(index)))
	row.add_child(option)
	_setting_controls[key] = option
	parent.add_child(row)


func _add_slider_row(parent: VBoxContainer, label: String, key: String, min_value: float, max_value: float, step: float) -> void:
	var row := HBoxContainer.new()
	var title := _lbl(label, 17, GREEN)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(title)
	var slider := HSlider.new()
	slider.min_value = min_value
	slider.max_value = max_value
	slider.step = step
	slider.custom_minimum_size = Vector2(220, 32)
	slider.value_changed.connect(func(value: float): setting_changed.emit(key, value))
	row.add_child(slider)
	_setting_controls[key] = slider
	parent.add_child(row)


func set_resume_available(available: bool) -> void:
	resume_button.disabled = not available


func set_storage_persistent(persistent: bool) -> void:
	storage_notice.visible = not persistent


func open_settings(from_title: bool) -> void:
	_settings_from_title = from_title
	title_screen.visible = false
	settings_panel.visible = true


func close_settings() -> void:
	settings_panel.visible = false
	title_screen.visible = _settings_from_title
	settings_closed.emit()


func apply_settings(values: Dictionary) -> void:
	for key in _setting_controls:
		var control: Control = _setting_controls[key]
		var value = values.get(key)
		if control is OptionButton:
			for i in control.item_count:
				if control.get_item_metadata(i) == value:
					control.select(i)
		elif control is HSlider and value != null:
			control.value = value
	set_text_scale(float(values.get("text_scale", 1.0)))


func set_text_scale(scale: float) -> void:
	_text_scale = scale
	for label in _labels:
		if is_instance_valid(label):
			label.add_theme_font_size_override("font_size", roundi(float(label.get_meta("base_font_size")) * scale))


func set_action_binding(action: String, key_name: String) -> void:
	if _binding_buttons.has(action):
		_binding_buttons[action].text = key_name


func set_remap_status(text: String) -> void:
	remap_status.text = text


func _build_cutscene() -> void:
	cutscene_panel = _panel(Color(0, 0, 0, 0.95))
	cutscene_panel.visible = false
	var v := VBoxContainer.new()
	v.set_anchors_preset(Control.PRESET_CENTER)
	v.position = Vector2(-310, -90)
	v.size = Vector2(620, 180)
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	cutscene_panel.add_child(v)
	cutscene_text = _lbl("", 19, GREEN)
	cutscene_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	cutscene_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(cutscene_text)
	var spacer := Control.new()
	spacer.custom_minimum_size = Vector2(0, 24)
	v.add_child(spacer)
	var btn := Button.new()
	btn.text = "Continue"
	btn.add_theme_font_override("font", mono)
	btn.add_theme_font_size_override("font_size", 18)
	btn.add_theme_color_override("font_color", Color(0, 0, 0))
	var bs := StyleBoxFlat.new()
	bs.bg_color = GREEN
	btn.add_theme_stylebox_override("normal", bs)
	v.add_child(btn)
	btn.pressed.connect(func(): cutscene_panel.visible = false; _on_cutscene_done())
	add_child(cutscene_panel)


var _cutscene_cb: Callable
func show_cutscene(text: String, cb: Callable) -> void:
	cutscene_text.text = text
	_cutscene_cb = cb
	cutscene_panel.visible = true
func _on_cutscene_done() -> void:
	if _cutscene_cb.is_valid():
		_cutscene_cb.call()


func _build_win() -> void:
	win_panel = _panel(Color(0, 0, 0, 0.92))
	win_panel.visible = false
	var v := VBoxContainer.new()
	v.set_anchors_preset(Control.PRESET_CENTER)
	v.position = Vector2(-240, -80)
	v.size = Vector2(480, 160)
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	win_panel.add_child(v)
	var t := _lbl("YOU ESCAPED", 48, YELLOW)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(t)
	var l := _lbl("All levels cleared. Press R to play again.", 18, GREEN)
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(l)
	add_child(win_panel)


func _build_vignette() -> void:
	# Radial darkening overlay matching drawVignette(), flicker driven in _process.
	var grad := Gradient.new()
	grad.set_color(0, Color(0, 0, 0, 0))
	grad.set_color(1, Color(0, 0, 0, 0.55))
	grad.offsets = PackedFloat32Array([0.68, 1.0])
	var gt := GradientTexture2D.new()
	gt.gradient = grad
	gt.fill = GradientTexture2D.FILL_RADIAL
	gt.fill_from = Vector2(0.5, 0.5)
	gt.fill_to = Vector2(0.5, 0.0)
	gt.width = 1024
	gt.height = 1024
	vignette = TextureRect.new()
	vignette.texture = gt
	vignette.set_anchors_preset(Control.PRESET_FULL_RECT)
	vignette.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	vignette.stretch_mode = TextureRect.STRETCH_SCALE
	vignette.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(vignette)


func _process(_delta: float) -> void:
	var now := Time.get_ticks_msec()
	var flicker: float = 0.7 + sin(now * 0.003) * 0.03 + (-0.12 if randf() < 0.02 else 0.0)
	vignette.modulate.a = clampf(flicker, 0.0, 1.0)


func set_health(hp: int, max_hp: int) -> void:
	var pct := clampf(float(hp) / max_hp, 0.0, 1.0)
	health_fill.size.x = 100 * pct
	var c := Color("#20ff40") if pct > 0.6 else (Color("#ffaa00") if pct > 0.3 else Color("#ff2020"))
	health_fill.color = c
	status_label.text = "FINE" if pct > 0.6 else ("CAUTION" if pct > 0.3 else "DANGER")
	status_label.add_theme_color_override("font_color", c)


func set_info(level_num: int, level_name: String, hp: int, ammo_mag, ammo_res, keys: int, keys_needed: int, weapon_name: String, zombies_left := -1) -> void:
	var ammo_text := "%s/%s" % [str(ammo_mag), str(ammo_res)]
	var goal_text := "ZOMBIES: %d" % zombies_left if zombies_left >= 0 else "KEYS: %d/%d" % [keys, keys_needed]
	info_label.text = "LV: %d [%s]  HP: %d  AMMO: %s  %s  GUN: %s" % [level_num, level_name, maxi(0, hp), ammo_text, goal_text, weapon_name]


func set_message(text: String) -> void:
	message_label.text = text


func set_interact(text: String) -> void:
	interact_label.text = text


func show_mash(show: bool, pct: float, label_text := "MASH SPACE!") -> void:
	mash_panel.visible = show
	mash_label.text = label_text
	mash_fill.size.x = 318 * clampf(pct, 0.0, 1.0)


func show_reload(show: bool, pct: float) -> void:
	reload_panel.visible = show
	reload_fill.size.x = 198 * clampf(pct, 0.0, 1.0)

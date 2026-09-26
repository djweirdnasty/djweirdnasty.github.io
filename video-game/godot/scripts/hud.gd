class_name HUD
extends CanvasLayer

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
var cutscene_panel: Control
var cutscene_text: Label
var win_panel: Control
var vignette: TextureRect

var mono := SystemFont.new()


func _ready() -> void:
	mono.font_names = PackedStringArray(["Courier New", "Courier", "monospace"])
	layer = 10
	_build_hud()
	_build_title()
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
	return l


func _build_hud() -> void:
	var hud := Control.new()
	hud.name = "HudRoot"
	hud.set_anchors_preset(Control.PRESET_FULL_RECT)
	hud.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(hud)

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
	title_screen = _panel(Color(0.02, 0.02, 0.02, 0.85))
	var v := VBoxContainer.new()
	v.set_anchors_preset(Control.PRESET_CENTER)
	v.position = Vector2(-240, -120)
	v.size = Vector2(480, 240)
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	title_screen.add_child(v)
	var title := _lbl("YOUIE", 64, YELLOW)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(title)
	for line in ["It is a survival shooter under development", "", "Click to start", "", "Find keys, fight zombies, escape each level.", "WASD: move | Click: shoot | E: interact | R: reload"]:
		var l := _lbl(line, 16, GREEN if not line.begins_with("WASD") else Color(0.53, 0.53, 0.53))
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		v.add_child(l)
	var btn := Button.new()
	btn.custom_minimum_size = Vector2(10, 10)
	btn.visible = false
	title_screen.add_child(btn)
	title_screen.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(title_screen)


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


func set_info(level_num: int, level_name: String, hp: int, ammo_mag, ammo_res, keys: int, keys_needed: int, weapon_name: String) -> void:
	var ammo_text := "%s/%s" % [str(ammo_mag), str(ammo_res)]
	info_label.text = "LV: %d [%s]  HP: %d  AMMO: %s  KEYS: %d/%d  GUN: %s" % [level_num, level_name, maxi(0, hp), ammo_text, keys, keys_needed, weapon_name]


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

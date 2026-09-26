class_name SpritePrep
extends RefCounted

## Port of the original game's sprite pipeline:
## - chromaKeyBlackBackground(): flood-fills the solid black background of a
##   sheet into transparency, preserving dark interior detail.
## - Per-frame content anchors (bottom-center of the alpha bounding box) so
##   unevenly-aligned frames don't wobble, mirroring computeFrameAnchors().

class KeyedSheet:
	var image: Image
	var texture: Texture2D

	func _init(img: Image, tex: Texture2D) -> void:
		image = img
		texture = tex

	# Returns [{rect: Rect2, anchor: Vector2}] — anchor is the bottom-center of
	# the frame's opaque content in sheet pixels, used to plant feet at the
	# entity origin exactly like the JS anchor code.
	func region_frames(rects: Array) -> Array:
		var out: Array = []
		for r in rects:
			out.append({ "rect": r, "anchor": _content_anchor(r) })
		return out

	func grid_frames(cols: int, rows: int, row: int) -> Array:
		var fw := float(image.get_width()) / cols
		var fh := float(image.get_height()) / rows
		var rects: Array = []
		for c in cols:
			var x := roundi(c * fw)
			var y := roundi(row * fh)
			rects.append(Rect2(x, y, roundi((c + 1) * fw) - x, roundi((row + 1) * fh) - y))
		return region_frames(rects)

	func strip_frames(x: float, y: float, w: float, h: float, count: int) -> Array:
		var rects: Array = []
		var fw := w / count
		for i in count:
			var sx := roundi(x + i * fw)
			rects.append(Rect2(sx, y, roundi(x + (i + 1) * fw) - sx, h))
		return region_frames(rects)

	func _content_anchor(r: Rect2) -> Vector2:
		var min_x := int(r.end.x)
		var max_x := int(r.position.x)
		var max_y := -1
		var x0 := int(r.position.x)
		var y0 := int(r.position.y)
		var x1 := mini(int(r.end.x), image.get_width())
		var y1 := mini(int(r.end.y), image.get_height())
		for py in range(y0, y1):
			for px in range(x0, x1):
				if image.get_pixel(px, py).a8 > 8:
					if px < min_x: min_x = px
					if px > max_x: max_x = px
					if py > max_y: max_y = py
		if max_y < 0:
			return Vector2(r.size.x * 0.5, r.size.y)
		return Vector2(r.position.x + (min_x + max_x) * 0.5, r.position.y + max_y)


static var _sheet_cache: Dictionary = {}
static var _tex_cache: Dictionary = {}

static func clear_cache() -> void:
	_sheet_cache.clear()
	_tex_cache.clear()

static func load_image(path: String) -> Image:
	var img: Image = null
	var res := load(path)
	if res != null and res.has_method("get_image"):
		img = res.get_image()
	if img == null:
		img = Image.new()
		if img.load(path) != OK:
			push_error("SpritePrep: failed to load " + path)
			return Image.create(4, 4, false, Image.FORMAT_RGBA8)
	if img.get_format() != Image.FORMAT_RGBA8:
		img.convert(Image.FORMAT_RGBA8)
	return img

# Direct port of chromaKeyBlackBackground(): flood-fill from the image border
# across near-black pixels (r,g,b <= 6) and set them transparent.
static func chroma_key(img: Image) -> Image:
	var w := img.get_width()
	var h := img.get_height()
	var visited := PackedByteArray()
	visited.resize(w * h)
	var stack: PackedInt32Array = PackedInt32Array()
	for x in w:
		stack.push_back(x)
		stack.push_back(x + (h - 1) * w)
	for y in h:
		stack.push_back(y * w)
		stack.push_back(y * w + (w - 1))
	while not stack.is_empty():
		var i := stack[stack.size() - 1]
		stack.resize(stack.size() - 1)
		if i < 0 or i >= w * h or visited[i]:
			continue
		visited[i] = 1
		var p := img.get_pixel(i % w, i / w)
		if p.r8 > 6 or p.g8 > 6 or p.b8 > 6:
			continue
		img.set_pixel(i % w, i / w, Color(p.r, p.g, p.b, 0.0))
		var x := i % w
		var y := i / w
		if x > 0: stack.push_back(i - 1)
		if x < w - 1: stack.push_back(i + 1)
		if y > 0: stack.push_back(i - w)
		if y < h - 1: stack.push_back(i + w)
	return img

static func sheet(path: String, keyed := false) -> KeyedSheet:
	var k := path + "|" + str(keyed)
	if _sheet_cache.has(k):
		return _sheet_cache[k]
	var img := load_image(path)
	if keyed:
		img = chroma_key(img)
	var tex := ImageTexture.create_from_image(img)
	var s := KeyedSheet.new(img, tex)
	_sheet_cache[k] = s
	return s

static func tex(path: String) -> Texture2D:
	if _tex_cache.has(path):
		return _tex_cache[path]
	var img := load_image(path)
	var t := ImageTexture.create_from_image(img)
	_tex_cache[path] = t
	return t

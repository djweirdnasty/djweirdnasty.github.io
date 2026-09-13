#!/usr/bin/env python3
"""Auto-generate article thumbnails from article images or titles."""
import json
import os
import re
import textwrap
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

THUMB_WIDTH = 400
THUMB_HEIGHT = 300
THUMB_DIR = Path('thumbs')
THUMB_DIR.mkdir(exist_ok=True)


def slugify(path):
    return path.strip('/').replace('.html', '')


def find_font():
    candidates = [
        '/System/Library/Fonts/Helvetica.ttc',
        '/System/Library/Fonts/Arial.ttf',
        '/Library/Fonts/Arial Rounded MT Bold.ttf',
        '/System/Library/Fonts/HelveticaNeue.ttc',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None


def make_text_thumbnail(title, category, out_path):
    """Generate a thumbnail from the title if no image is available."""
    img = Image.new('RGB', (THUMB_WIDTH, THUMB_HEIGHT), '#0a0a0f')
    draw = ImageDraw.Draw(img)

    # Branded gradient-like background using shapes
    for y in range(0, THUMB_HEIGHT, 4):
        alpha = int(40 * (1 - y / THUMB_HEIGHT))
        draw.line([(0, y), (THUMB_WIDTH, y)], fill=(255, 91, 215, alpha), width=2)

    # Category tag
    font_path = find_font()
    if font_path:
        tag_font = ImageFont.truetype(font_path, 18)
        title_font = ImageFont.truetype(font_path, 28)
        small_font = ImageFont.truetype(font_path, 14)
    else:
        tag_font = ImageFont.load_default()
        title_font = ImageFont.load_default()
        small_font = ImageFont.load_default()

    if category:
        tag_bbox = draw.textbbox((0, 0), category.upper(), font=tag_font)
        tag_w = tag_bbox[2] - tag_bbox[0]
        draw.rectangle([20, 20, 30 + tag_w, 50], fill='#ff4d8f')
        draw.text((25, 22), category.upper(), fill='#fff', font=tag_font)

    # Wrap title to ~16 chars per line
    wrapped = textwrap.wrap(title, width=18)
    if len(wrapped) > 5:
        wrapped = wrapped[:5]
        wrapped[-1] = wrapped[-1][:25] + '...'

    y = 80
    for line in wrapped:
        draw.text((20, y), line, fill='#fff', font=title_font)
        y += 38

    # Brand mark
    draw.text((20, THUMB_HEIGHT - 30), 'DJWEIRDNASTY', fill='#ff5bd7', font=small_font)

    img.save(out_path, 'WEBP', quality=80)


def make_image_thumbnail(src_path, out_path):
    """Generate a thumbnail from an existing article image."""
    try:
        img = Image.open(src_path)
    except Exception as e:
        print(f"Cannot open {src_path}: {e}")
        return False

    # Convert to RGB if necessary
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')

    # Calculate center crop for 4:3 aspect
    target_ratio = THUMB_WIDTH / THUMB_HEIGHT
    w, h = img.size
    current_ratio = w / h

    if current_ratio > target_ratio:
        # Image is wider: crop width
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    else:
        # Image is taller: crop height
        new_h = int(w / target_ratio)
        top = (h - new_h) // 2
        img = img.crop((0, top, w, top + new_h))

    img = img.resize((THUMB_WIDTH, THUMB_HEIGHT), Image.LANCZOS)
    img.save(out_path, 'WEBP', quality=80)
    return True


def get_category(path):
    for c in ['music', 'sports', 'entertainment', 'national']:
        if f'news-{c}' in path:
            return c
    if 'news-' in path:
        return 'news'
    return 'djweirdnasty'


def main():
    with open('contents.json') as f:
        items = json.load(f)

    for item in items:
        path = item.get('path', '')
        if not path.endswith('.html'):
            continue
        slug = slugify(path)
        thumb_name = f'thumb-{slug}.webp'
        thumb_path = THUMB_DIR / thumb_name

        # Determine source image
        src_img = item.get('img', '')
        generated = False

        if src_img and os.path.exists(src_img.lstrip('/')):
            generated = make_image_thumbnail(src_img.lstrip('/'), thumb_path)

        if not generated:
            title = item.get('title', '') or 'DJWEIRDNASTY'
            category = get_category(path)
            make_text_thumbnail(title, category, thumb_path)
            generated = True

        if generated:
            item['thumb'] = f'thumbs/{thumb_name}'
            print('Generated:', item['thumb'])

    with open('contents.json', 'w') as f:
        json.dump(items, f, indent=2)

    print('Thumbnails generated and contents.json updated.')


if __name__ == '__main__':
    main()

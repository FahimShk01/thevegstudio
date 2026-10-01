"""
compress_images.py — Compress all menu/food images to WebP
Reduces 2-3MB PNGs down to ~80-200KB WebP without visible quality loss.
Also compresses root JPGs (logo, hero, founder).
"""
import os, sys
from pathlib import Path
from PIL import Image

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).parent
MENU_IMG_DIR = ROOT / "assets" / "images" / "menu"
MAX_SIDE = 600          # max width OR height for menu card images
QUALITY = 82            # WebP quality (82 is excellent visual / small file)
ROOT_JPGS = ["logo.jpg", "hero_food.jpg", "founder_chef_studio.jpg",
             "veg_studio_logo_hq.jpg"]

def compress_one(src: Path, dst: Path, max_side=None, quality=QUALITY):
    try:
        img = Image.open(src)
        # Convert to RGB/RGBA for WebP
        if img.mode in ('RGBA', 'LA'):
            pass  # keep alpha
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        if max_side:
            img.thumbnail((max_side, max_side), Image.LANCZOS)
        img.save(dst, "WEBP", quality=quality, method=6)
        src_kb = src.stat().st_size // 1024
        dst_kb = dst.stat().st_size // 1024
        saving = 100 - round(dst_kb / max(src_kb, 1) * 100)
        print(f"  OK: {src.name[:50]:50s}  {src_kb:>5}KB -> {dst_kb:>4}KB  (-{saving}%)")
        return True
    except Exception as e:
        print(f"  SKIP {src.name}: {e}")
        return False

total_before = 0
total_after = 0
converted = 0

print("\n=== Menu images ===")
for src in sorted(MENU_IMG_DIR.rglob("*")):
    if src.suffix.lower() not in (".png", ".jpg", ".jpeg"):
        continue
    dst = src.with_suffix(".webp")
    if dst.exists():
        print(f"  ALREADY: {src.name}")
        continue
    total_before += src.stat().st_size
    if compress_one(src, dst, max_side=MAX_SIDE):
        total_after += dst.stat().st_size
        converted += 1

print(f"\n=== Root images ===")
for name in ROOT_JPGS:
    src = ROOT / name
    if not src.exists():
        continue
    dst = src.with_suffix(".webp")
    if dst.exists():
        print(f"  ALREADY: {name}")
        continue
    total_before += src.stat().st_size
    max_s = 200 if "logo" in name else 900
    if compress_one(src, dst, max_side=max_s):
        total_after += dst.stat().st_size
        converted += 1

print(f"\n{'='*70}")
print(f"Converted {converted} images")
print(f"Total before: {total_before//1024//1024} MB")
print(f"Total after:  {total_after//1024//1024} MB  ({100 - round(total_after/max(total_before,1)*100)}% smaller)")
print("Done! Now update HTML/JS to use .webp paths.")

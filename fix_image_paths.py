"""
fix_image_paths.py — Correctly replace all .png/.jpg paths in menuData with .webp
"""
import re, sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).parent
MENU_DATA = ROOT / "js" / "data" / "menuData.js"

def fix_paths(filepath: Path):
    text = filepath.read_text(encoding='utf-8')
    changes = 0
    
    def replace_ext(m):
        nonlocal changes
        full = m.group(0)  # e.g. "assets/images/menu/pizza/cheese burst.png"
        # Check if .webp version exists
        webp_path = ROOT / full.replace('.png', '.webp').replace('.jpg', '.webp').replace('.jpeg', '.webp')
        if webp_path.exists():
            changes += 1
            # Replace the extension
            new = re.sub(r'\.(png|jpg|jpeg)$', '.webp', full)
            return new
        return full
    
    # Match asset paths ending in image extension
    pattern = re.compile(r'assets/images/menu/[^"\'<>\s]+\.(png|jpg|jpeg)')
    updated = pattern.sub(replace_ext, text)
    
    if changes > 0:
        filepath.write_text(updated, encoding='utf-8')
        print(f"Fixed {changes} paths in {filepath.name}")
    else:
        print(f"No changes in {filepath.name}")

fix_paths(MENU_DATA)
print("Done!")

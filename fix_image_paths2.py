"""
fix_image_paths2.py — Simple regex replace all .png/.jpg paths in menuData to .webp
"""
import re, sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
CWD = Path.cwd()
MENU_DATA = CWD / "js" / "data" / "menuData.js"

def fix_paths(filepath: Path):
    text = filepath.read_text(encoding='utf-8')
    changes = 0
    
    def replace_ext(m):
        nonlocal changes
        full = m.group(0)  # e.g. assets/images/menu/pizza/cheese burst.png
        ext = m.group(1)   # png, jpg, or jpeg
        # Check if .webp version exists
        webp_path = CWD / full.replace('.' + ext, '.webp')
        if webp_path.exists():
            changes += 1
            return full[:-len(ext)] + 'webp'
        print(f"  SKIP (no webp): {full}")
        return full
    
    pattern = re.compile(r'assets/images/menu/[^"\'<>\s]+\.(png|jpg|jpeg)')
    updated = pattern.sub(replace_ext, text)
    
    if changes > 0:
        filepath.write_text(updated, encoding='utf-8')
        print(f"Fixed {changes} paths in {filepath.name}")
    else:
        print(f"No changes in {filepath.name}")

fix_paths(MENU_DATA)
print("Done!")

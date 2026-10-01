"""
update_image_paths.py — Rewrite image paths in menuData.js and index.html to use .webp
"""
import re, sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).parent
MENU_DATA = ROOT / "js" / "data" / "menuData.js"
INDEX_HTML = ROOT / "index.html"
MENU_IMG_BASE = ROOT / "assets" / "images" / "menu"

def webp_if_exists(match):
    """Replace .png / .jpg / .jpeg with .webp if a .webp counterpart exists."""
    full_path_str = match.group(0)
    # extract just the path (between quotes or as attribute value)
    # We'll work on the whole matched string
    def replace_ext(m2):
        path_str = m2.group(0)
        # Try to find the .webp file
        candidate = ROOT / path_str.lstrip("/")
        webp_candidate = candidate.with_suffix(".webp")
        if webp_candidate.exists():
            return path_str[:path_str.rfind(".")] + ".webp"
        return path_str
    
    result = re.sub(r'assets/images/menu/[^\s"\'<>]+\.(png|jpg|jpeg)', replace_ext, full_path_str)
    return result

# Pattern to match image paths
IMG_PATTERN = re.compile(r'assets/images/menu/[^\s"\'<>\\\n]+\.(png|jpg|jpeg)')

def process_file(filepath: Path, description: str):
    original = filepath.read_text(encoding="utf-8")
    
    changes = 0
    def replacer(m):
        nonlocal changes
        path_str = m.group(0)
        candidate = ROOT / path_str
        webp_candidate = candidate.with_suffix(".webp")
        if webp_candidate.exists():
            changes += 1
            new_path = path_str[:path_str.rfind(".")] + ".webp"
            return new_path
        return path_str
    
    updated = IMG_PATTERN.sub(replacer, original)
    
    if changes > 0:
        filepath.write_text(updated, encoding="utf-8")
        print(f"  {description}: replaced {changes} image paths to .webp")
    else:
        print(f"  {description}: no changes needed")
    
    return changes

print("=== Updating image paths to .webp ===")
process_file(MENU_DATA, "menuData.js")
process_file(INDEX_HTML, "index.html")
print("\nDone!")

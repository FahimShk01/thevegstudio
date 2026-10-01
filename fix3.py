import re, sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
CWD = Path.cwd()
MENU_DATA = CWD / "js" / "data" / "menuData.js"

text = MENU_DATA.read_text(encoding='utf-8')

# Simple approach: replace all occurrences of .png and .jpg in asset paths
# Pattern matches full asset path including extension
pattern = re.compile(r'(assets/images/menu/[^"\'<>\s]+?)\.(png|jpg|jpeg)')

changes = 0
def replacer(m):
    global changes
    base = m.group(1)
    ext = m.group(2)
    webp_path = CWD / (base + '.webp')
    if webp_path.exists():
        changes += 1
        return base + '.webp'
    print(f"  SKIP (no webp): {base}.{ext}")
    return m.group(0)

updated = pattern.sub(replacer, text)
print(f"Changes: {changes}")
if changes > 0:
    MENU_DATA.write_text(updated, encoding='utf-8')
    print("Written!")
else:
    print("No changes.")

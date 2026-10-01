import re, sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
CWD = Path('c:/Users/farhan/Downloads/appi')
MENU_DATA = CWD / "js" / "data" / "menuData.js"

text = MENU_DATA.read_text(encoding='utf-8')
original_text = text

# Find all distinct image paths in the file
found = re.findall(r'assets/images/menu/[^"\'<>\s]+\.(png|jpg|jpeg)', text)
print(f"Total paths to check: {len(found)}")

# Do line-by-line replacement
lines = text.split('\n')
new_lines = []
for line in lines:
    # Find image path in this line
    m = re.search(r'(assets/images/menu/[^"\'<>\s]+)\.(png|jpg|jpeg)', line)
    if m:
        base = m.group(1)
        ext = m.group(2)
        webp_path = CWD / (base + '.webp')
        if webp_path.exists():
            line = line.replace('.' + ext + '"', '.webp"')
        else:
            print(f"  NO WEBP: {base}.{ext}")
    new_lines.append(line)

new_text = '\n'.join(new_lines)
if new_text != original_text:
    MENU_DATA.write_text(new_text, encoding='utf-8')
    count = text.count('.png"') + text.count('.jpg"') + text.count('.jpeg"')
    count2 = new_text.count('.png"') + new_text.count('.jpg"')  
    print(f"Converted {count - count2} paths to .webp")
else:
    print("No changes made")
print("Done!")

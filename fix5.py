"""Final fix: simple string replacements for known path patterns"""
import re, sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')

MENU_DATA = Path('c:/Users/farhan/Downloads/appi/js/data/menuData.js')
text = MENU_DATA.read_text(encoding='utf-8-sig')

original = text

# Replace .png" -> .webp" and .jpg" -> .webp" only in asset paths
# We know webp files exist for everything except bbqnuggets
text = re.sub(r'(assets/images/menu/[^"<>]+)\.png"', r'\1.webp"', text)
text = re.sub(r'(assets/images/menu/[^"<>]+)\.jpg"', r'\1.webp"', text)
text = re.sub(r'(assets/images/menu/[^"<>]+)\.jpeg"', r'\1.webp"', text)

# Restore bbqnuggets (no webp for it)
text = text.replace('assets/images/menu/nuggets/bbqnuggets.webp"', 
                    'assets/images/menu/nuggets/bbqnuggets.png"')

if text != original:
    MENU_DATA.write_text(text, encoding='utf-8')
    print("SUCCESS: Updated menuData.js image paths to .webp")
else:
    print("No changes")
print("Done!")

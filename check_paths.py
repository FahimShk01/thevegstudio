import re
from pathlib import Path
data = Path('js/data/menuData.js').read_text(encoding='utf-8')
remaining = re.findall(r'assets/images/menu/[^\s"\'<>\\\n]+\.(png|jpg|jpeg)', data)
print(f'Remaining non-webp paths in menuData: {len(remaining)}')
for r in remaining[:15]:
    print(' ', r)

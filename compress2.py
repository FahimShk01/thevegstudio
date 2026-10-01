import os
from PIL import Image

dirs_to_check = ['.', 'assets/images']

for d in dirs_to_check:
    if not os.path.exists(d): continue
    for f in os.listdir(d):
        if f == 'menu-hero-bg.png':
            path = os.path.join(d, f)
            webp_path = os.path.join(d, 'menu-hero-bg.webp')
            try:
                img = Image.open(path)
                print(f"Converting {path} to WebP")
                img.save(webp_path, 'WEBP', quality=75)
                print(f"  New size: {os.path.getsize(webp_path)/1024:.1f} KB")
            except Exception as e:
                print(f"Error on {path}: {e}")

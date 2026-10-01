import os
from PIL import Image

def find_large_pngs(root_dir):
    for root, dirs, files in os.walk(root_dir):
        for f in files:
            if f.lower().endswith('.png'):
                path = os.path.join(root, f)
                size = os.path.getsize(path)
                if size > 500000:  # > 500 KB
                    webp_path = os.path.splitext(path)[0] + '.webp'
                    try:
                        img = Image.open(path)
                        print(f"Converting {path} ({size/1024/1024:.2f} MB) to WebP")
                        img.save(webp_path, 'WEBP', quality=75)
                        print(f"  New size: {os.path.getsize(webp_path)/1024:.1f} KB")
                    except Exception as e:
                        print(f"Error on {path}: {e}")

find_large_pngs('.')

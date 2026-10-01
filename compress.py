import os
from PIL import Image

dirs_to_check = ['.', 'assets/images']

for d in dirs_to_check:
    if not os.path.exists(d): continue
    for f in os.listdir(d):
        if f.lower().endswith(('.jpg', '.png', '.jpeg')):
            path = os.path.join(d, f)
            size = os.path.getsize(path)
            if size > 150000:  # > 150 KB
                try:
                    img = Image.open(path)
                    print(f"Compressing {path} (Original: {size/1024:.1f} KB)")
                    if img.mode in ('RGBA', 'P') and f.lower().endswith('.jpg'):
                        img = img.convert('RGB')
                    
                    if f.lower().endswith('.png'):
                        # convert to webp and save as .png? 
                        # No, just save as optimized PNG or Webp.
                        # Wait, let's just optimize them as they are, reducing quality slightly for JPEG.
                        if img.mode == 'RGBA':
                            # Can't easily compress PNG without WebP, but we can resize if it's huge
                            pass
                    else:
                        img.save(path, quality=60, optimize=True)
                        print(f"  New size: {os.path.getsize(path)/1024:.1f} KB")
                except Exception as e:
                    print(f"Error on {path}: {e}")

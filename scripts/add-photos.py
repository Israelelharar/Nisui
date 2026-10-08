#!/usr/bin/env python3
"""
Turns a folder of a client's photos (jpg/png/webp/heic*) into the site's
format and prints the entries to paste into clients/<slug>/content/photos.ts.

    python3 scripts/add-photos.py <client-slug> <folder-with-photos>

For each photo: <id>.webp (long side 1600px) and <id>-sm.webp (560px wide),
in clients/<slug>/photos/. The id comes from the file name (lowercase,
dashes). EXIF rotation is applied and location data is dropped (re-encoded).
Captions are left for you to write: they're the heart of it.

* HEIC needs `pip install pillow-heif`.
"""
import re, sys
from pathlib import Path
from PIL import Image, ImageOps

try:
    import pillow_heif  # type: ignore
    pillow_heif.register_heif_opener()
except Exception:
    pass

if len(sys.argv) != 3:
    sys.exit(__doc__)
slug, src = sys.argv[1], Path(sys.argv[2])
out = Path(__file__).resolve().parent.parent / 'clients' / slug / 'photos'
if not out.parent.exists():
    sys.exit(f'clients/{slug} does not exist. Copy clients/_template first.')
out.mkdir(exist_ok=True)

entries = []
for f in sorted(src.iterdir()):
    if f.suffix.lower() not in {'.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'}:
        continue
    pid = re.sub(r'[^a-z0-9]+', '-', f.stem.lower()).strip('-') or f'photo-{len(entries) + 1}'
    im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
    im.thumbnail((1600, 1600), Image.LANCZOS)
    im.save(out / f'{pid}.webp', 'WEBP', quality=82)
    sm = im.copy()
    sm.thumbnail((560, 10_000), Image.LANCZOS)
    sm.save(out / f'{pid}-sm.webp', 'WEBP', quality=80)
    entries.append((pid, im.width, im.height))
    print(f'  {pid}.webp  {im.width}x{im.height}', file=sys.stderr)

print('\n// paste into clients/%s/content/photos.ts, then write the captions' % slug)
for pid, w, h in entries:
    print(f"  {{ id: '{pid}', alt: '', caption: '', categories: ['us'], width: {w}, height: {h} }},")

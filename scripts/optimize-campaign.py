"""Create responsive copies only; run with the existing Pillow installation."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
source = root.parent / 'prototype/v02/renders'
destination = root / 'public/images/chronos'
destination.mkdir(parents=True, exist_ok=True)
catalog = {
    'campaign': 'chronos_aion_campaign_01',
    'macro': 'chronos_aion_macro_02',
    'craftsmanship': 'chronos_aion_craftsmanship_03',
    'leather': 'chronos_aion_leather_04',
    'philosophy': 'chronos_philosophy_05',
    'beyond': 'chronos_beyond_time_06',
}
manifest = {}
for key, name in catalog.items():
    original = source / f'{name}.png'
    with Image.open(original) as loaded:
        image = ImageOps.exif_transpose(loaded).convert('RGB')
        width, height = image.size
        variants = []
        for target in sorted({720, 1200, width}):
            if target > width:
                continue
            resized = image.resize((target, round(height * target / width)), Image.Resampling.LANCZOS)
            path = destination / f'{name}-{target}.webp'
            resized.save(path, 'WEBP', quality=86, method=6)
            variants.append({'width': target, 'file': path.name, 'bytes': path.stat().st_size})
        fallback_width = min(1200, width)
        path = destination / f'{name}.jpg'
        image.resize((fallback_width, round(height * fallback_width / width)), Image.Resampling.LANCZOS).save(path, 'JPEG', quality=85, optimize=True, progressive=True)
        manifest[key] = {'name': name, 'width': width, 'height': height, 'variants': variants, 'fallback': path.name, 'fallbackBytes': path.stat().st_size, 'originalBytes': original.stat().st_size, 'sourceSha256': hashlib.sha256(original.read_bytes()).hexdigest()}
(root / 'src/data').mkdir(exist_ok=True)
(root / 'src/data/image-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'originalBytes': sum(a['originalBytes'] for a in manifest.values()), 'largestWebpBytes': sum(a['variants'][-1]['bytes'] for a in manifest.values()), 'allCopiesBytes': sum(a['fallbackBytes'] + sum(v['bytes'] for v in a['variants']) for a in manifest.values())}, indent=2))

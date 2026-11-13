"""Prepare proportional lossless WebP variants from the user archive; no retouching.
Usage: python tools/prepare-club-images.py "/path/to/сайт фото.zip"
Requires Pillow. Originals are read, not rewritten. All 32 files must be accounted for.
"""
import hashlib
import io
import json
import sys
import zipfile
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
inputs = json.loads((root / 'tools/club-image-inputs.json').read_text())
originals = {}
with zipfile.ZipFile(sys.argv[1]) as archive:
    for entry in archive.infolist():
        if entry.is_dir():
            continue
        name = entry.filename
        if not entry.flag_bits & 0x800:
            name = name.encode('cp437').decode('cp866')
        name = Path(name).name
        if name in originals:
            raise ValueError(f'Duplicate archive name: {name}')
        originals[name] = archive.read(entry)
if set(originals) != {item['file'] for item in inputs}:
    raise ValueError('Archive and reviewed mapping differ; review new files first')
output = root / 'public/images/clubs'
output.mkdir(parents=True, exist_ok=True)
clubs = json.loads((root / 'src/data/clubs.json').read_text())
by_id = {club['id']: club for club in clubs}
for club in clubs:
    for field in ['cover', 'photo', 'logo']:
        club.pop(field, None)
manifest = []
for item in inputs:
    data = originals[item['file']]
    record = {'originalFile': item['file'], 'originalBytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
    if item.get('duplicateOf'):
        if data != originals[item['duplicateOf']]:
            raise ValueError('Expected byte-identical duplicate')
        record['duplicateOf'] = item['duplicateOf']
        manifest.append(record)
        continue
    if item.get('excluded'):
        record.update({'clubId': item['clubId'], 'excluded': True, 'exclusionReason': item['exclusionReason']})
        manifest.append(record)
        continue
    source = Image.open(io.BytesIO(data))
    source = ImageOps.exif_transpose(source)
    icc = source.info.get('icc_profile')
    source = source.convert('RGBA' if 'A' in source.getbands() else 'RGB')
    sizes = [240, 480, 640] if item['role'] == 'logo' else [480, 960, 1280]
    variants = []
    seen = set()
    for limit in sizes:
        image = source.copy()
        image.thumbnail((limit, limit), Image.Resampling.LANCZOS)
        if image.size in seen:
            continue
        seen.add(image.size)
        name = f"{item['clubId']}-{item['role']}-{image.width}.webp"
        path = output / name
        image.save(path, 'WEBP', lossless=True, method=6, exact=True, **({'icc_profile': icc} if icc else {}))
        variants.append({'src': f'images/clubs/{name}', 'width': image.width, 'height': image.height, 'bytes': path.stat().st_size})
    largest = variants[-1]
    media = {key: item[key] for key in ['kind', 'fit', 'background', 'alt']}
    media.update({'src': largest['src'], 'width': largest['width'], 'height': largest['height'], 'position': item.get('position', '50% 50%'), 'variants': variants})
    by_id[item['clubId']][item['role']] = media
    record.update({'clubId': item['clubId'], 'role': item['role'], 'kind': item['kind'], 'fit': item['fit'], 'sourceWidth': source.width, 'sourceHeight': source.height, 'variants': variants})
    manifest.append(record)
(root / 'src/data/clubs.json').write_text(json.dumps(clubs, ensure_ascii=False, indent=2) + '\n')
(root / 'src/data/club-image-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'filesReviewed': len(manifest), 'clubsWithImages': sum(bool(club.get('photo') or club.get('logo')) for club in clubs), 'originalBytes': sum(len(data) for data in originals.values()), 'webBytesAllVariants': sum(v['bytes'] for record in manifest for v in record.get('variants', []))}))

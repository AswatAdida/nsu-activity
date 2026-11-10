"""Reproduce reviewed OCR/seed proposals against the exact original floor plans.

The review manifest supplies visually checked labels and seeds. This command
does not perform OCR or assign new numbers. Its output is a proposal, not an
update to the published room set.
"""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image
from detect_room import make_candidate


def reproduce(repo, report):
    images = {}
    results = []
    for record in report['records']:
        if record['status'] != 'candidate-needs-user-review':
            continue
        source = repo / record['sourceImage']
        if source not in images:
            if hashlib.sha256(source.read_bytes()).hexdigest() != record['sourceImageSha256']:
                raise ValueError(f'Source image changed: {source}')
            images[source] = Image.open(source).convert('RGB')
        image = images[source]
        if record['gapClosing']:
            # Only five source-inspected doorway gaps; never change the PNG.
            import numpy as np
            from scipy import ndimage
            pixels = np.asarray(image).astype(np.int16)
            red, green, blue = np.moveaxis(pixels, -1, 0)
            walls = (green > 100) & (green > red * 1.25) & (green > blue * 1.25)
            size = record['closingKernelPixels']
            closed = (walls |
                      ndimage.binary_closing(walls, structure=np.ones((1, size))) |
                      ndimage.binary_closing(walls, structure=np.ones((size, 1))))
            pixels = np.asarray(image).copy()
            pixels[closed & ~walls] = [100, 190, 20]
            image = Image.fromarray(pixels)
        polygon, details = make_candidate(image, tuple(record['seedPixels']),
                                          record['roomNumber'], 'academic-1', record['floor'])
        if len(polygon['points']) != record['vertexCount']:
            raise ValueError(f'Boundary changed: {record["roomNumber"]}')
        if details['interiorAreaPixels'] != record['interiorAreaPixels']:
            raise ValueError(f'Area changed: {record["roomNumber"]}')
        results.append(polygon)
    results.sort(key=lambda room: (room['floor'], room['id']))
    return results


def main():
    repo = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', type=Path, default=repo / 'public/data/other-floors-review.json')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.output.resolve() == (repo / 'public/data/room-polygons.json').resolve():
        parser.error('Do not overwrite published geometry with unapproved proposals')
    report = json.loads(args.report.read_text())
    results = reproduce(repo, report)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text('[\n' + ',\n'.join('  ' + json.dumps(room, ensure_ascii=False, separators=(',', ':')) for room in results) + '\n]\n')
    print(f'Reproduced {len(results)} proposals; published geometry unchanged')


if __name__ == '__main__':
    main()

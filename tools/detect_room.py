"""Extract a CLOSED room interior from a green-wall floor plan and a seed.

This is a proposal generator, not OCR or automatic approval of geometry.
The original image is read only. No gaps are closed and no walls are invented.
"""
import argparse
from collections import defaultdict, deque
import hashlib
import json
from pathlib import Path

from PIL import Image


def is_wall(rgb):
    red, green, blue = rgb
    return green > 100 and green > red * 1.25 and green > blue * 1.25


def detect_room(image, seed, max_fraction=0.05):
    image = image.convert('RGB')
    width, height = image.size
    x, y = seed
    if not (0 <= x < width and 0 <= y < height):
        raise ValueError('Seed is outside the image')
    pixels = image.load()
    if is_wall(pixels[x, y]):
        raise ValueError('Seed lies on a green wall')
    region = {(x, y)}
    queue = deque(region)
    while queue:
        x, y = queue.popleft()
        if x in (0, width - 1) or y in (0, height - 1):
            raise ValueError('Region reaches the image border: room is not closed')
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if (nx, ny) in region or is_wall(pixels[nx, ny]):
                continue
            region.add((nx, ny))
            if len(region) > width * height * max_fraction:
                raise ValueError('Region is too large: likely corridor or open doorway')
            queue.append((nx, ny))

    # Directed pixel-cell edges; clockwise in image coordinates.
    edges = defaultdict(list)
    for x, y in region:
        for neighbor, start, end in (
            ((x, y - 1), (x, y), (x + 1, y)),
            ((x + 1, y), (x + 1, y), (x + 1, y + 1)),
            ((x, y + 1), (x + 1, y + 1), (x, y + 1)),
            ((x - 1, y), (x, y + 1), (x, y)),
        ):
            if neighbor not in region:
                edges[start].append(end)
    if any(len(destinations) != 1 for destinations in edges.values()):
        raise ValueError('Ambiguous pixel boundary: manual review required')
    start = min(edges)
    point = start
    boundary = []
    visited = set()
    while point not in visited:
        visited.add(point)
        boundary.append(point)
        point = edges[point][0]
    if point != start or len(visited) != len(edges):
        raise ValueError('Boundary has holes or multiple loops: manual review required')

    # Remove only EXACTLY collinear pixel edges. Preserve corners and notches.
    corners = []
    for i, current in enumerate(boundary):
        previous, following = boundary[i - 1], boundary[(i + 1) % len(boundary)]
        cross = ((current[0] - previous[0]) * (following[1] - current[1]) -
                 (current[1] - previous[1]) * (following[0] - current[0]))
        if cross:
            corners.append(current)
    return corners, len(region)


def make_candidate(image, seed, room_id, building_id, floor):
    corners, area = detect_room(image, seed)
    width, height = image.size
    # Match the viewer's 0–1000 coordinate system; no image rescaling.
    points = [[round(x / width * 1000, 1), round(y / height * 1000, 1)]
              for x, y in corners]
    if len({tuple(p) for p in points}) != len(points):
        raise ValueError('Normalization collapsed vertices: manual review required')
    return {'id': room_id, 'buildingId': building_id, 'floor': floor, 'points': points}, {
        'imageSize': [width, height], 'seedPixels': list(seed),
        'interiorAreaPixels': area, 'boundaryPixels': [list(p) for p in corners],
        'coordinateSystem': 'SVG viewBox 0 0 1000 1000',
        'wallRule': 'G > 100 and G > 1.25*R and G > 1.25*B',
        'method': '4-connected flood fill, directed pixel boundary, collinear-only simplification',
        'status': 'candidate-needs-human-review',
        'labelRecognition': 'not performed; seed and room number supplied by operator',
        'boundaryMeaning': 'inner edge of green wall pixels; not wall centre line',
        'gapClosing': False,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--image', type=Path, required=True)
    parser.add_argument('--seed', nargs=2, type=int, required=True, metavar=('X', 'Y'))
    parser.add_argument('--room', required=True)
    parser.add_argument('--building', default='academic-1')
    parser.add_argument('--floor', type=int, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    if args.image.resolve() in (args.output.resolve(), args.report.resolve()):
        parser.error('Output must not replace the source image')
    if args.output.resolve() == args.report.resolve():
        parser.error('Candidate and report must use different files')
    image = Image.open(args.image)
    candidate, report = make_candidate(image, tuple(args.seed), args.room, args.building, args.floor)
    report.update({'roomId': args.room, 'buildingId': args.building, 'floor': args.floor,
                   'sourceImage': args.image.as_posix(),
                   'sourceImageSha256': hashlib.sha256(args.image.read_bytes()).hexdigest()})
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps([candidate], ensure_ascii=False, indent=2) + '\n')
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(f'Candidate {args.room}: {len(candidate["points"])} vertices, {report["interiorAreaPixels"]} interior pixels')


if __name__ == '__main__':
    main()

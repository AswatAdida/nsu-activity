import unittest
from pathlib import Path

from PIL import Image, ImageDraw
from detect_room import detect_room, make_candidate


class RoomDetectionTests(unittest.TestCase):
    def test_closed_room_keeps_text_and_does_not_cross_walls(self):
        image = Image.new('RGB', (40, 40), 'white')
        draw = ImageDraw.Draw(image)
        draw.rectangle((10, 10, 20, 20), outline=(100, 190, 20))
        draw.line((13, 13, 17, 17), fill='black', width=1)
        corners, area = detect_room(image, (15, 17), max_fraction=0.1)
        self.assertEqual(corners, [(11, 11), (20, 11), (20, 20), (11, 20)])
        self.assertEqual(area, 81)

    def test_open_room_is_rejected_instead_of_inventing_a_wall(self):
        image = Image.new('RGB', (40, 40), 'white')
        draw = ImageDraw.Draw(image)
        draw.rectangle((10, 10, 20, 20), outline=(100, 190, 20))
        draw.point((20, 15), fill='white')
        with self.assertRaises(ValueError):
            detect_room(image, (15, 15), max_fraction=0.2)

    def test_invalid_seed_is_rejected(self):
        image = Image.new('RGB', (20, 20), (100, 190, 20))
        for seed in ((-1, 0), (20, 1), (5, 5)):
            with self.assertRaises(ValueError):
                detect_room(image, seed)

    def test_actual_5222_is_stable_for_two_interior_seeds(self):
        path = Path(__file__).resolve().parents[1] / 'public/floorplans/floor-5.png'
        with Image.open(path) as image:
            first, report = make_candidate(image, (110, 870), '5222', 'academic-1', 5)
            second, _ = make_candidate(image, (100, 860), '5222', 'academic-1', 5)
        self.assertEqual(first, second)
        self.assertEqual(report['interiorAreaPixels'], 7656)
        self.assertEqual(len(first['points']), 8)
        self.assertEqual(first['id'], '5222')
        self.assertEqual(report['gapClosing'], False)


if __name__ == '__main__':
    unittest.main()

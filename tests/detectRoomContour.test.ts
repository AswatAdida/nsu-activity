import assert from 'node:assert/strict'
import test from 'node:test'
import { detectRoomContour } from '../src/data/detectRoomContour.ts'

function fixture(width = 40, height = 40) {
  const data = new Uint8ClampedArray(width * height * 4).fill(255)
  const set = (x: number, y: number, rgb: number[]) => data.set([...rgb, 255], (y * width + x) * 4)
  for (let x = 10; x <= 20; x++) { set(x, 10, [100, 190, 20]); set(x, 20, [100, 190, 20]) }
  for (let y = 10; y <= 20; y++) { set(10, y, [100, 190, 20]); set(20, y, [100, 190, 20]) }
  return { image: { width, height, data }, set }
}

test('detects a closed interior and ignores black label pixels', () => {
  const { image, set } = fixture()
  set(15, 15, [0, 0, 0])
  const result = detectRoomContour(image, [15, 15], 0.1)
  assert.equal(result.areaPixels, 81)
  assert.deepEqual(result.points, [[275, 275], [500, 275], [500, 500], [275, 500]])
  assert.deepEqual(detectRoomContour(image, [13, 17], 0.1), result)
})

test('rejects open regions, corridor-sized regions and wall/outside seeds', () => {
  const { image, set } = fixture()
  for (const seed of [[10, 15], [-1, 5], [40, 5], [12.5, 15]] as [number, number][]) {
    assert.throws(() => detectRoomContour(image, seed, 0.1))
  }
  assert.throws(() => detectRoomContour(image, [15, 15], 0.01), /слишком большая/)
  set(20, 15, [255, 255, 255])
  assert.throws(() => detectRoomContour(image, [15, 15], 0.2))
  assert.throws(() => detectRoomContour(image, [15, 15], 1), /край плана/)
})

test('rejects internal green obstacles instead of silently discarding holes', () => {
  const { image, set } = fixture()
  set(15, 15, [100, 190, 20])
  assert.throws(() => detectRoomContour(image, [12, 12], 0.1), /внутренние препятствия/)
})

test('keeps a nonrectangular notch and matches Python halfway rounding', () => {
  const { image, set } = fixture(128, 128)
  set(19, 14, [100, 190, 20]); set(19, 15, [100, 190, 20])
  const result = detectRoomContour(image, [12, 12])
  assert.equal(result.areaPixels, 79)
  assert.equal(result.points.length, 8)
  assert.ok(result.points.some(([x]) => x === 156.2)) // 20 / 128 * 1000 = 156.25
  assert.ok(result.points.some(([x]) => x === 148.4))
})

test('rejects invalid image buffers and fractions', () => {
  const { image } = fixture()
  assert.throws(() => detectRoomContour({ ...image, data: [] }, [15, 15]))
  assert.throws(() => detectRoomContour(image, [15, 15], 0))
})

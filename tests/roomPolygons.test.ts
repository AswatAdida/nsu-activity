import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { conflictingPolygons, geometryError, mergePolygons, parsePolygons } from '../src/data/roomPolygons.ts'
import type { Point } from '../src/data/roomPolygons.ts'

const published = JSON.parse(readFileSync(new URL('../public/data/room-polygons.json', import.meta.url), 'utf8'))
const square: Point[] = [[10, 10], [20, 10], [20, 20], [10, 20]]
const polygon = { id: '0250', buildingId: 'academic-1', floor: 0, points: square }

test('all published contours round-trip without changes to coordinates or leading zero', () => {
  const parsed = parsePolygons(published)
  assert.equal(parsed.length, 97)
  assert.deepEqual(JSON.parse(JSON.stringify(parsed)), published)
  assert.ok(parsed.some(p => p.id === '0250'))
})

test('rejects malformed data, duplicates, and invalid geometry atomically', () => {
  for (const invalid of [null, {}, [{ ...polygon, id: 250 }], [{ ...polygon, floor: 1.5 }],
    [{ ...polygon, points: [[NaN, 0], [1, 0], [1, 1]] }],
    [{ ...polygon, points: [[-1, 0], [1, 0], [1, 1]] }],
    [polygon, polygon], [polygon, { ...polygon, id: 'bad', points: [] }]]) {
    assert.throws(() => parsePolygons(invalid))
  }
  for (const points of [
    [[0, 0], [10, 10]],
    [[0, 0], [10, 0], [20, 0]],
    [[0, 0], [10, 10], [0, 10], [10, 0]],
    [[0, 0], [10, 0], [10, 10], [0, 0]],
    [[0, 0], [10, 0], [5, 0], [10, 10]],
    [[0, 0], [10, 0], [10, 10], [5, 0], [0, 10]],
  ] as Point[][]) assert.ok(geometryError(points), JSON.stringify(points))
  assert.equal(geometryError(square), null)
  assert.equal(geometryError([[0, 0], [10, 0], [10, 10], [5, 5], [0, 10]]), null)
})

test('merge retains other floors/buildings and changes conflicts only by explicit policy', () => {
  const current = parsePolygons(published)
  const incoming = [{ ...current[0], points: square },
    { ...polygon, floor: 5 }, { ...polygon, buildingId: 'another-building' }]
  const before = structuredClone(current)
  assert.equal(conflictingPolygons(current, incoming).length, 1)
  assert.equal(conflictingPolygons(current, current).length, 0)
  const keep = mergePolygons(current, incoming, false)
  assert.equal(keep.length, current.length + 2)
  assert.deepEqual(keep[0], current[0])
  const replace = mergePolygons(current, incoming, true)
  assert.equal(replace.length, current.length + 2)
  assert.deepEqual(replace[0].points, square)
  assert.deepEqual(replace.slice(1, current.length), current.slice(1))
  assert.deepEqual(current, before)
})

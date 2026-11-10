import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { parsePolygons } from '../src/data/roomPolygons.ts'

test('approved 5222 geometry matches the reviewed candidate and preserves six existing rooms', () => {
  const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
  const [room] = parsePolygons(read('../public/data/room-polygons-5222-candidate.json'))
  assert.equal(room.id, '5222')
  assert.equal(room.floor, 5)
  assert.equal(room.buildingId, 'academic-1')
  assert.equal(room.points.length, 8)
  const published = parsePolygons(read('../public/data/room-polygons.json'))
  assert.equal(published.length, 7)
  assert.deepEqual(published.find(p => p.id === room.id), room)
  assert.deepEqual(published.filter(p => p.id !== room.id).map(p => p.id).sort(), ['0250', '1332', '2253', '2348', '3314', '5272'])
  const [review] = read('../docs/geometry-review-log.json')
  assert.equal(review.status, 'approved')
  assert.equal(review.roomId, room.id)
  assert.equal(review.candidateSha256, createHash('sha256').update(readFileSync(new URL('../public/data/room-polygons-5222-candidate.json', import.meta.url))).digest('hex'))
  const report = read('../docs/room-5222-detection.json')
  assert.equal(report.status, 'candidate-needs-human-review')
  assert.equal(report.gapClosing, false)
  assert.equal(report.boundaryPixels.length, room.points.length)
  assert.deepEqual(room.points, report.boundaryPixels.map(([x, y]: number[]) =>
    [Math.round(x / 2048 * 10000) / 10, Math.round(y / 2048 * 10000) / 10]))
})

test('six further proposals are valid but remain outside published geometry', () => {
  const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
  const candidates = parsePolygons(read('../public/data/room-polygons-next-candidates.json'))
  assert.deepEqual(candidates.map(room => room.id), ['2241', '2270', '2271', '2323', '3140', '3266'])
  const publishedIds = new Set(parsePolygons(read('../public/data/room-polygons.json')).map(room => room.id))
  assert.ok(candidates.every(room => !publishedIds.has(room.id)))
  assert.ok(read('../docs/next-room-detection.json').every((report: { status: string }) => report.status === 'candidate-needs-human-review'))
})

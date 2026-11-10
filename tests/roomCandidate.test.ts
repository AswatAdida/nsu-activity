import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { parsePolygons } from '../src/data/roomPolygons.ts'

test('5222 proposal uses the existing schema and does not replace published geometry', () => {
  const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
  const [room] = parsePolygons(read('../public/data/room-polygons-5222-candidate.json'))
  assert.equal(room.id, '5222')
  assert.equal(room.floor, 5)
  assert.equal(room.buildingId, 'academic-1')
  assert.equal(room.points.length, 8)
  const published = parsePolygons(read('../public/data/room-polygons.json'))
  assert.equal(published.length, 6)
  assert.equal(published.some(p => p.id === room.id), false)
  const report = read('../docs/room-5222-detection.json')
  assert.equal(report.status, 'candidate-needs-human-review')
  assert.equal(report.gapClosing, false)
  assert.equal(report.boundaryPixels.length, room.points.length)
  assert.deepEqual(room.points, report.boundaryPixels.map(([x, y]: number[]) =>
    [Math.round(x / 2048 * 10000) / 10, Math.round(y / 2048 * 10000) / 10]))
})

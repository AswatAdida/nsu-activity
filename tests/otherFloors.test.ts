import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { parsePolygons, polygonKey } from '../src/data/roomPolygons.ts'

const read = (name: string) => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'))
const candidates = parsePolygons(read('../public/data/room-polygons-other-floors-candidates.json'))
const published = parsePolygons(read('../public/data/room-polygons.json'))
const report = read('../public/data/other-floors-review.json')

test('377 approved contours are published without replacing user geometry', () => {
  assert.equal(candidates.length, 377)
  assert.deepEqual([...new Set(candidates.map(p => p.floor))].sort(), [0, 1, 2, 4, 5])
  const existing = new Map(published.map(p => [polygonKey(p), p]))
  for (const room of candidates) assert.deepEqual(existing.get(polygonKey(room)), room)
  assert.equal(published.filter(p => p.floor === 3).length, 87)
  assert.equal(published.length, 480)
  assert.equal(report.sourceImageModified, false)
  assert.equal(report.records.filter((r: { status: string }) => r.status === 'candidate-needs-user-review').length, candidates.length)
})

test('sources are pinned and doorway closures and label ambiguities remain explicit', () => {
  for (const floor of [0, 1, 2, 4, 5]) {
    const bytes = readFileSync(new URL(`../public/floorplans/floor-${floor}.png`, import.meta.url))
    const hash = createHash('sha256').update(bytes).digest('hex')
    assert.ok(report.records.filter((r: { floor: number }) => r.floor === floor)
      .every((r: { sourceImageSha256: string }) => r.sourceImageSha256 === hash))
  }
  assert.equal(report.records.filter((r: { gapClosing: boolean }) => r.gapClosing).length, 5)
  assert.equal(report.issues.length, 7)
  assert.equal(report.issues.filter((r: { status: string; originalStatus?: string }) => r.status === 'resolved-distinct-physical-room' && r.originalStatus === 'duplicate-source-label').length, 4)
  assert.ok(!candidates.some(p => p.floor === 1 && p.id === '1280'))
  assert.ok(!candidates.some(p => p.floor === 4 && ['4316', '3307', '3107'].includes(p.id)))
  assert.equal(report.unassignedLegendLabels[0].label, '1239')
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { campusRooms } from '../src/data/campusRooms.ts'
import { parsePolygons, conflictingPolygons } from '../src/data/roomPolygons.ts'
import { polygonNumber, resolvePolygonRoom } from '../src/data/roomIdentity.ts'

const polygons = parsePolygons(JSON.parse(readFileSync(new URL('../public/data/room-polygons.json', import.meta.url), 'utf8')))

test('all 480 physical polygons resolve one-to-one to distinct room records', () => {
  assert.equal(polygons.length, 480)
  const rooms = polygons.map(polygon => resolvePolygonRoom(polygon, campusRooms))
  assert.ok(rooms.every(Boolean))
  assert.equal(new Set(rooms.map(room => room!.id)).size, 480)
})

test('same-floor duplicate numbers keep their printed label and separate identities', () => {
  for (const [floor, number] of [[1, '1280'], [4, '4316']] as const) {
    const matches = polygons.filter(p => p.floor === floor && polygonNumber(p) === number)
    assert.equal(matches.length, 2)
    assert.notEqual(matches[0].id, matches[1].id)
    assert.notEqual(matches[0].roomId, matches[1].roomId)
    for (const polygon of matches) {
      assert.equal(resolvePolygonRoom(polygon, campusRooms)?.number, number)
      assert.equal(resolvePolygonRoom(polygon, campusRooms)?.id, polygon.roomId)
    }
    assert.equal(resolvePolygonRoom({ id: number, buildingId: 'academic-1', floor }, campusRooms), undefined)
  }
})

test('3307 and 3107 on floor four never select their third-floor counterparts', () => {
  for (const number of ['3307', '3107']) {
    const third = resolvePolygonRoom(polygons.find(p => p.floor === 3 && polygonNumber(p) === number)!, campusRooms)!
    const fourth = resolvePolygonRoom(polygons.find(p => p.floor === 4 && polygonNumber(p) === number)!, campusRooms)!
    assert.equal(third.floor, 3)
    assert.equal(fourth.floor, 4)
    assert.notEqual(third.id, fourth.id)
    assert.equal(resolvePolygonRoom({ id: number, buildingId: 'academic-1', floor: 4, roomId: third.id }, campusRooms), undefined)
  }
})

test('import/export preserves physical identity and flags identity conflicts', () => {
  const polygon = polygons.find(p => p.number === '1280')!
  assert.deepEqual(parsePolygons(JSON.parse(JSON.stringify([polygon]))), [polygon])
  assert.equal(conflictingPolygons([polygon], [{ ...polygon, roomId: 'different-room' }]).length, 1)
  assert.throws(() => parsePolygons([{ ...polygon, number: 1280 }]))
  assert.throws(() => parsePolygons([{ ...polygon, roomId: ' ' }]))
})

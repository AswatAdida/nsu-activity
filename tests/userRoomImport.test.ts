import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { parsePolygons } from '../src/data/roomPolygons.ts'
import { campusRooms } from '../src/data/campusRooms.ts'
import { userDigitizedRooms } from '../src/data/userDigitizedRooms.ts'
import { activitySessions } from '../src/data/activitySessions.ts'
import { validateCampusData } from '../src/data/validateCampusData.ts'

const bytes = readFileSync(new URL('../public/data/room-polygons.json', import.meta.url))
const polygons = parsePolygons(JSON.parse(bytes.toString()))
const report = JSON.parse(readFileSync(new URL('../docs/user-room-import-2026-11-10.json', import.meta.url), 'utf8'))

test('raw user export and unchanged points are preserved with two approved label corrections', () => {
  const rawBytes = readFileSync(new URL('../docs/source-exports/room-polygons-3.json', import.meta.url))
  assert.equal(createHash('sha256').update(rawBytes).digest('hex'), report.sourceSha256)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), report.preparedGeometrySha256)
  const corrected = parsePolygons(JSON.parse(rawBytes.toString())).map(room => ({ ...room,
    id: room.floor === 3 && room.id === '3241' ? '3141' : room.floor === 3 && room.id === '3242' ? '3142' : room.id }))
  assert.deepEqual(polygons, corrected)
  assert.equal(polygons.length, 97)
  assert.equal(userDigitizedRooms.length, 84)
  for (const polygon of polygons) {
    assert.equal(campusRooms.filter(room => room.buildingId === polygon.buildingId &&
      room.floor === polygon.floor && room.number === polygon.id).length, 1, polygon.id)
  }
  assert.deepEqual(validateCampusData(), [])
})

test('new geometry creates no invented club meetings, attendance, room purpose or block', () => {
  const ids = new Set(userDigitizedRooms.map(room => room.id))
  assert.ok(activitySessions.every(session => !ids.has(session.roomId ?? '') &&
    (session.alternativeRoomIds ?? []).every(id => !ids.has(id))))
  for (const room of userDigitizedRooms) {
    assert.equal(room.floor, 3)
    assert.equal(room.kind, 'other')
    assert.equal(room.block, null)
    assert.equal(room.planPosition, null)
    assert.equal(room.sources?.[0].kind, 'user-message')
  }
  assert.equal(polygons.find(p => p.id === '3304')?.points.length, 394)
})

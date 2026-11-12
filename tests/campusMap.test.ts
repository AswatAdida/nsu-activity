import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { campusSites } from '../src/data/campusSites.ts'
import { buildings } from '../src/data/buildings.ts'
import { campusRooms } from '../src/data/campusRooms.ts'
import { activitySessions } from '../src/data/activitySessions.ts'
import { buildingContext, roomNavigation } from '../src/data/campusNavigation.ts'
import { evaluateBuildingActivity, parseCampusDateTime, sessionsForBuildings } from '../src/data/activityState.ts'

// Pinned OSM vertices fetched from the map API on 2026-11-11. No invented footprints.
const hashes: Record<string, string> = {
  'academic-1': '4be6802c5e71802465be3da37bec7367a04968ceaaf2dcaf3a9c5eb2592eb205',
  'dorm-5': '6035a77e3b27490ad074554939dac51788c5220570194d9a47f1593efdd3fb6f',
  'dorm-6': '3c6225cb323fabf342630cf7315d861a3b4aef70dafaf19928fe20b6d4bab683',
  'sports-new': '21b2fa166362ccc0d3d036219985ae09f753e2ad6c77a5ff61d4953a909508ff',
  'sports-old': '6ebd998b8937768ca987b2f962352f3c1ec7fed8d19d78d41ac8555d3e167873',
  stc: 'a662093a2cf1c686b88ba4008bee2ea4dc55a0d20d219c9535b5fd0510c56559',
}
test('all ten existing building records map to six verified physical footprints', () => {
  assert.equal(buildings.length, 10)
  assert.equal(campusSites.length, 6)
  const members = campusSites.flatMap(site => site.buildingIds)
  assert.equal(new Set(members).size, 10)
  assert.deepEqual([...members].sort(), buildings.map(building => building.id).sort())
  for (const building of buildings) {
    const site = campusSites.find(site => site.id === building.mapSiteId)!
    assert.ok(site.buildingIds.includes(building.id))
    assert.deepEqual(building.coordinates, site.center)
    assert.equal(building.address, site.address)
  }
})
test('OSM geometry keeps closed rings, courtyard hole, source IDs and snapshot vertices', () => {
  for (const site of campusSites) {
    assert.match(site.source.url, /^https:\/\/www.openstreetmap.org\/(way|relation)\/\d+$/)
    assert.ok(site.source.version > 0)
    assert.equal(createHash('sha256').update(JSON.stringify(site.rings)).digest('hex'), hashes[site.id])
    for (const ring of site.rings) {
      assert.ok(ring.length >= 4)
      assert.deepEqual(ring[0], ring.at(-1))
      assert.ok(ring.every(([lat, lon]) => lat > 54.84 && lat < 54.85 && lon > 83.08 && lon < 83.10))
    }
  }
  assert.equal(campusSites.find(site => site.id === 'academic-1')!.rings.length, 2)
})
test('sports aliases and dorm annexes merge without losing source rooms or meetings', () => {
  const sports = buildingContext('sports-new')!
  assert.ok(sports.rooms.some(room => room.id === 'sports-aerobics'))
  assert.deepEqual(sports.sessions, buildingContext('sports-12-1')!.sessions)
  assert.equal(new Set(sports.sessions.map(session => session.id)).size, sports.sessions.length)
  const old = buildingContext('sports-old')!
  assert.ok(old.sessions.some(session => session.locationKind === 'outdoor'))
  assert.ok(old.sessions.some(session => session.id === 'siberica-tue'))
  assert.deepEqual(buildingContext('dorm-5')!.sessions, buildingContext('dorm-5-annex')!.sessions)
  assert.ok(buildingContext('dorm-5')!.sessions.some(session => session.id === 'ethno-mon'))
  assert.ok(buildingContext('dorm-5')!.sessions.some(session => session.id === 'catalog-theatre-mon'))
  assert.deepEqual(buildingContext('dorm-6')!.rooms, buildingContext('dorm-6-annex')!.rooms)
  assert.match(buildings.find(building => building.id === 'dorm-6-annex')!.geographyNote!, /не установлены/)
})
test('physical building state combines aliases and changes with the same campus instant as rooms', () => {
  const site = campusSites.find(site => site.id === 'sports-new')!
  const sessions = sessionsForBuildings(activitySessions, campusRooms, site.buildingIds)
  assert.equal(evaluateBuildingActivity(sessions, campusRooms, site.buildingIds, parseCampusDateTime('2026-11-13T18:30')!).status, 'scheduled')
  assert.equal(evaluateBuildingActivity(sessions, campusRooms, site.buildingIds, parseCampusDateTime('2026-11-13T21:00')!).status, 'known')
  const stc = buildingContext('stc')!
  assert.equal(evaluateBuildingActivity(stc.sessions, campusRooms, stc.memberIds, new Date()).status, 'no-data')
})
test('navigation uses stable room identity, including ambiguous printed numbers', () => {
  const repeated = campusRooms.filter(room => room.floor === 1 && room.number === '1280')
  assert.equal(repeated.length, 2)
  assert.notEqual(roomNavigation(repeated[0].id)!.roomId, roomNavigation(repeated[1].id)!.roomId)
  assert.deepEqual(roomNavigation('academic-1-3314'), { buildingId: 'academic-1', floor: 3, roomId: 'academic-1-3314' })
  assert.deepEqual(roomNavigation('sports-new-309'), { buildingId: 'sports-new', floor: null, roomId: 'sports-new-309' })
  assert.equal(roomNavigation('missing'), null)
  assert.equal(buildingContext('missing'), null)
  assert.deepEqual(buildings.find(building => building.id === 'academic-1')!.floors, [0, 1, 2, 3, 4, 5])
  assert.ok(buildings.filter(building => building.id !== 'academic-1').every(building => building.floors.length === 0))
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { activitySessions } from '../src/data/activityModel.ts'
import { activitySessions as original } from '../src/data/activitySessions.ts'
import { clubs, sessionsForClub } from '../src/data/activityCatalog.ts'
import { campusRooms } from '../src/data/campusRooms.ts'
import { buildings } from '../src/data/buildings.ts'
import { studentWeek } from '../src/data/personalSchedule.ts'
import { sessionMapTarget } from '../src/data/campusNavigation.ts'

test('catalogue projection preserves all original records and exact source descriptions', () => {
  assert.equal(original.length, 25)
  assert.equal(activitySessions.length, 45)
  assert.equal(new Set(activitySessions.map(session => session.id)).size, 45)
  for (const session of original) assert.equal(activitySessions.find(item => item.id === session.id), session)
  for (const session of activitySessions.filter(session => session.catalogSource)) {
    const club = clubs.find(club => club.id === session.catalogSource!.clubId)!
    assert.equal(session.catalogSource!.schedule, club.schedule)
    assert.equal(session.catalogSource!.location, club.location)
    assert.equal(session.clubName, club.name)
    assert.equal(session.validFrom, undefined)
    assert.equal(session.validUntil, undefined)
    if (session.roomId) assert.ok(campusRooms.some(room => room.id === session.roomId))
    if (session.buildingId) assert.ok(buildings.some(building => building.id === session.buildingId))
  }
})
test('unambiguous catalogue sessions now appear in the same map/calendar model', () => {
  const week = studentWeek(['swing', 'media', 'theatre', 'digma'], '2026-11-12')
  assert.ok(week.days[2].entries.some(entry => entry.session.id === 'catalog-swing-wed' && entry.session.startTime === '20:00' && entry.session.endTime === '22:00'))
  const media = week.days[4].entries.find(entry => entry.session.id === 'catalog-media-fri')!.session
  assert.equal(media.endTime, null)
  assert.deepEqual(sessionMapTarget(media), { buildingId: 'academic-1', floor: 0, roomId: 'academic-1-0250' })
  assert.ok(week.undated.some(session => session.clubId === 'digma' && session.startTime === null))
  assert.ok(!week.unstructured.some(club => club.id === 'swing'))
})
test('source prose is not converted to invented rooms or day-to-address assignments', () => {
  const theatre = sessionsForClub('theatre')
  assert.deepEqual(sessionMapTarget(theatre.find(session => session.dayOfWeek === 1)!), { buildingId: 'dorm-5', roomId: null, floor: null })
  assert.equal(sessionMapTarget(theatre.find(session => session.dayOfWeek === 4)!), null)
  assert.equal(sessionMapTarget(sessionsForClub('fire').find(session => session.dayOfWeek === 2)!), null)
  assert.equal(sessionMapTarget(sessionsForClub('vocal')[0]), null)
  assert.equal(sessionMapTarget(sessionsForClub('cinema')[0]), null) // a base is not the meeting place
  assert.equal(sessionsForClub('dansu').length, 0) // conflicting source timetables remain intact
  assert.equal(sessionsForClub('asian').length, 0) // 'Saturdays according to schedule' is not every Saturday
})
test('existing precise sessions override matching catalogue descriptions without duplicates', () => {
  assert.equal(sessionsForClub('fire').filter(session => session.dayOfWeek === 5).length, 1)
  assert.equal(sessionsForClub('medieval').filter(session => session.dayOfWeek === 3).length, 1)
  assert.equal(sessionsForClub('inter').length, 1)
  const taverna = sessionsForClub('taverna')
  assert.equal(taverna.length, 7)
  assert.ok(taverna.every(session => session.endTime === null && session.roomId === null))
})

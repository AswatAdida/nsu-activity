import assert from 'node:assert/strict'
import test from 'node:test'
import { clubs, baseRoomIds, sessionsForClub } from '../src/data/activityCatalog.ts'
import { clubColor, readClubSelection, sanitizeClubSelection, SELECTION_KEY, studentWeek, writeClubSelection } from '../src/data/personalSchedule.ts'
import { activityPlaces, buildingContext, sessionMapTarget } from '../src/data/campusNavigation.ts'
import { activitySessions } from '../src/data/activitySessions.ts'
import { campusRooms } from '../src/data/campusRooms.ts'
import { evaluateActivity } from '../src/data/activityState.ts'

test('selection storage survives serialization, rejects stale IDs and tolerates blocked/corrupt storage', () => {
  let saved = ''
  const storage = { getItem: (key: string) => { assert.equal(key, SELECTION_KEY); return saved }, setItem: (key: string, value: string) => { assert.equal(key, SELECTION_KEY); saved = value } }
  assert.equal(writeClubSelection(storage, ['inter', 'book', 'inter', 'deleted']), true)
  assert.deepEqual(readClubSelection(storage), ['inter', 'book'])
  assert.deepEqual(sanitizeClubSelection([null, 2, 'inter', 'inter']), ['inter'])
  saved = '{invalid'
  assert.deepEqual(readClubSelection(storage), [])
  assert.deepEqual(readClubSelection({ getItem: () => { throw new Error('private mode') } }), [])
  assert.equal(writeClubSelection({ setItem: () => { throw new Error('quota') } }, ['inter']), false)
  assert.equal(writeClubSelection(storage, []), true)
  assert.deepEqual(readClubSelection(storage), [])
})
test('a selected week uses source sessions, sorted starts and one record for alternative rooms', () => {
  const week = studentWeek(['inter', 'mtg', 'board-games'], '2026-11-12')
  assert.equal(week.start, '2026-11-09')
  assert.equal(week.days.length, 7)
  assert.deepEqual(week.days[5].entries.map(entry => entry.session.id), ['mtg-sat', 'board-games-sat', 'interclub-sat'])
  assert.equal(week.days[5].entries.filter(entry => entry.session.id === 'board-games-sat').length, 1)
  assert.equal(week.days[5].entries.find(entry => entry.session.id === 'board-games-sat')!.session.endTime, null)
  assert.ok(week.days[5].entries.every(entry => entry.date === '2026-11-14'))
  assert.equal(studentWeek([], '2026-11-12').days.flatMap(day => day.entries).length, 0)
  assert.throws(() => studentWeek(['inter'], 'not-a-date'), RangeError)
})
test('anchorless periods and seasonal bounds do not enter a fabricated calendar week', () => {
  const week = studentWeek(['book', 'tea', 'ultimate'], '2026-11-12')
  assert.equal(week.days.flatMap(day => day.entries).length, 0)
  assert.deepEqual(week.undated.map(session => session.id).sort(), ['bookclub-sun', 'tea-sat', 'ultimate-mon', 'ultimate-sun', 'ultimate-thu'])
})
test('known weekdays without starts retain dated day blocks and unknown end stays null', () => {
  const week = studentWeek(['mountain-tourism', 'academian-english'], '2026-11-12')
  assert.equal(week.days[0].entries[0].session.id, 'mountain-run-mon')
  assert.equal(week.days[0].entries[0].session.startTime, null)
  assert.equal(week.days[4].entries[0].session.id, 'mountain-run-fri')
  const english = week.days[6].entries.find(entry => entry.session.id === 'academian-english-sun')!
  assert.equal(english.session.endTime, null)
})
test('announced clubs and unstructured catalogue descriptions are separated without weekly events', () => {
  const week = studentWeek(['historical-political', 'omut'], '2026-11-12')
  assert.equal(week.days.flatMap(day => day.entries).length, 0)
  assert.deepEqual(week.withoutRegular.map(club => club.id), ['historical-political'])
  assert.deepEqual(week.unstructured.map(club => club.id), ['omut'])
  assert.equal(baseRoomIds.has('academic-1-212'), true)
  assert.equal(baseRoomIds.has('academic-1-2323'), true)
  assert.equal(evaluateActivity([], new Date(), baseRoomIds.has('academic-1-2323')).status, 'base')
  assert.equal(sessionsForClub('inter')[0].id, 'interclub-sat')
})
test('all source building/room references remain reachable through six unified places', () => {
  assert.equal(activityPlaces.length, 6)
  assert.equal(activityPlaces.filter(place => place.group === 'sports').length, 2)
  assert.equal(new Set(activityPlaces.flatMap(place => place.memberIds)).size, 10)
  for (const room of campusRooms) assert.ok(buildingContext(room.buildingId)!.rooms.some(item => item.id === room.id))
  for (const session of activitySessions) {
    const linked = activityPlaces.flatMap(place => buildingContext(place.id)!.sessions)
    assert.ok(linked.some(item => item.id === session.id))
  }
  assert.notDeepEqual(buildingContext('sports-new')!.site.rings, buildingContext('sports-old')!.site.rings)
  assert.deepEqual(buildingContext('dorm-5-annex')!.rooms, buildingContext('dorm-5')!.rooms)
  assert.ok(buildingContext('dorm-6')!.rooms.some(room => room.id === 'dorm-6-dance-unverified-annex' && room.floor === null))
})
test('map targets use exact known rooms, building-only evidence and genuine alternatives', () => {
  const byId = (id: string) => activitySessions.find(session => session.id === id)!
  assert.deepEqual(sessionMapTarget(byId('interclub-sat')), { buildingId: 'academic-1', floor: 3, roomId: 'academic-1-3314' })
  assert.deepEqual(sessionMapTarget(byId('ultimate-mon')), { buildingId: 'sports-new', floor: null, roomId: null })
  assert.deepEqual(sessionMapTarget(byId('board-games-sat')), { buildingId: 'academic-1', floor: null, roomId: null })
  assert.deepEqual(sessionMapTarget(byId('medieval-wed')), { buildingId: 'dorm-6', floor: null, roomId: 'dorm-6-dance' })
  assert.equal(sessionMapTarget({ ...byId('board-games-sat'), alternativeRoomIds: ['sports-new-309'] }), null)
  assert.equal(sessionMapTarget({ ...byId('board-games-sat'), alternativeRoomIds: ['missing-room'] }), null)
})
test('club identity colours are stable and distinct for all catalogue entries', () => {
  assert.equal(new Set(clubs.map(club => clubColor(club.id))).size, clubs.length)
  assert.equal(clubColor('inter'), clubColor('inter'))
})

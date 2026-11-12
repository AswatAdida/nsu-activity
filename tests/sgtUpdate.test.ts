import assert from 'node:assert/strict'
import test from 'node:test'
import { sessionsForClub, clubs } from '../src/data/activityCatalog.ts'
import { studentWeek } from '../src/data/personalSchedule.ts'
import { evaluateActivity } from '../src/data/activityState.ts'
import { parseCampusDateTime } from '../src/data/campusTime.ts'
import { clubMapContext, sessionMapTarget } from '../src/data/campusNavigation.ts'
test('SGT keeps one club and the same two weekly training IDs with 19:00 starts and no invented ends', () => {
  assert.equal(clubs.filter(club => club.id === 'mountain-tourism').length, 1)
  const sessions = sessionsForClub('mountain-tourism')
  assert.equal(sessions.length, 3)
  for (const [id, weekday] of [['mountain-run-mon', 1], ['mountain-run-fri', 5]] as const) {
    const session = sessions.find(session => session.id === id)!
    assert.equal(session.startTime, '19:00')
    assert.equal(session.endTime, null)
    assert.equal(session.dayOfWeek, weekday)
    assert.equal(session.recurrence, 'weekly')
    assert.equal(session.buildingId, 'sports-old')
    assert.equal(session.roomId, null)
    assert.notEqual(session.locationKind, 'outdoor')
    assert.equal(session.sourceHistory?.[0].recordedOn, '2026-11-10')
    assert.equal(session.source?.recordedOn, '2026-11-12')
    assert.ok(session.notes?.some(note => note.includes('Ранее:')))
    assert.deepEqual(sessionMapTarget(session), { buildingId: 'sports-old', floor: null, roomId: null })
    assert.equal(evaluateActivity([session], parseCampusDateTime('2026-11-09T19:30')!).status, 'known')
  }
  assert.ok(sessions.some(session => session.id === 'mountain-lecture-thu' && session.roomId === 'sports-new-223'))
})
test('SGT appears on Monday and Friday in the calendar, while the existing Thursday lecture is retained', () => {
  const week = studentWeek(['mountain-tourism'], '2026-11-09')
  assert.deepEqual(week.days.filter(day => day.entries.length).map(day => [day.date, day.entries[0].session.startTime]), [['2026-11-09', '19:00'], ['2026-11-12', '19:00'], ['2026-11-13', '19:00']])
  const context = clubMapContext('mountain-tourism')!
  assert.deepEqual(context.places.map(place => place.id).sort(), ['sports-new', 'sports-old'])
  assert.equal(context.sessions.length, 3)
})

import assert from 'node:assert/strict'
import test from 'node:test'
import type { ActivitySession, RecurrenceRule } from '../src/data/campusTypes.ts'
import { occursOnDate, recurrenceLabel, isSessionActive, nextSessionStart, calendarIssue } from '../src/data/sessionSchedule.ts'
import { parseCampusDateTime, campusDateTime } from '../src/data/campusTime.ts'
import { activitySessions } from '../src/data/activitySessions.ts'
const base: ActivitySession = { id: 'fixture', clubName: 'Fixture only', roomId: null, dayOfWeek: 3, startTime: '18:00', endTime: '19:00', recurrence: 'weekly', locationStatus: 'confirmed', attendanceMin: null, attendanceMax: null }
const withRule = (recurrenceRule: RecurrenceRule) => ({ ...base, recurrenceRule })
test('intervals require anchors and calculate every two/three weeks without ISO-week guesses', () => {
  for (const weeks of [2, 3]) {
    const missing = withRule({ kind: 'interval', weeks })
    assert.ok(calendarIssue(missing))
    assert.equal(occursOnDate(missing, '2026-11-04'), false)
    assert.equal(nextSessionStart(missing, new Date()), null)
    const anchored = withRule({ kind: 'interval', weeks, anchorDate: '2026-11-04' })
    assert.equal(occursOnDate(anchored, '2026-11-04'), true)
    assert.equal(occursOnDate(anchored, '2026-11-11'), false)
    assert.equal(occursOnDate(anchored, weeks === 2 ? '2026-11-18' : '2026-11-25'), true)
    assert.equal(occursOnDate(anchored, '2026-11-05'), false)
    assert.equal(recurrenceLabel(anchored), weeks === 2 ? 'Раз в две недели' : 'Раз в три недели')
  }
})
test('specific weeks are anchored cycles, not guessed calendar parity', () => {
  const session = withRule({ kind: 'weeks', cycleWeeks: 4, weeks: [1, 3], anchorDate: '2026-11-02' })
  assert.equal(occursOnDate(session, '2026-11-04'), true)
  assert.equal(occursOnDate(session, '2026-11-11'), false)
  assert.equal(occursOnDate(session, '2026-11-18'), true)
  assert.equal(occursOnDate(session, '2026-11-25'), false)
  assert.equal(occursOnDate(session, '2026-12-02'), true)
  assert.equal(occursOnDate(withRule({ kind: 'weeks', cycleWeeks: 2, weeks: [1] }), '2026-11-04'), false)
})
test('seasonal months work across New Year and skip off-season dates', () => {
  const session = withRule({ kind: 'seasonal', months: [9, 10, 11, 12, 1, 2, 3, 4], pattern: { kind: 'weekly' } })
  assert.equal(occursOnDate(session, '2026-11-04'), true)
  assert.equal(occursOnDate(session, '2027-01-06'), true)
  assert.equal(occursOnDate(session, '2027-05-05'), false)
  assert.equal(campusDateTime(nextSessionStart(session, parseCampusDateTime('2027-05-01T12:00')!)!), '2027-09-01T18:00')
})
test('announced meetings appear only on explicitly supplied dates', () => {
  const announced = { ...withRule({ kind: 'announced', dates: ['2026-11-12'] }), dayOfWeek: null }
  assert.equal(occursOnDate(announced, '2026-11-12'), true)
  assert.equal(occursOnDate(announced, '2026-11-19'), false)
  assert.equal(isSessionActive(announced, parseCampusDateTime('2026-11-12T18:30')!), true)
  assert.equal(isSessionActive(announced, parseCampusDateTime('2026-11-19T18:30')!), false)
  assert.equal(nextSessionStart(announced, parseCampusDateTime('2026-11-13T12:00')!), null)
  assert.equal(occursOnDate(withRule({ kind: 'announced' }), '2026-11-12'), false)
  assert.equal(recurrenceLabel(announced), 'По анонсам')
})
test('invalid anchors, cycles and season data do not generate occurrences', () => {
  for (const rule of [ { kind: 'interval', weeks: 3, anchorDate: '2026-02-30' }, { kind: 'interval', weeks: 0, anchorDate: '2026-11-04' }, { kind: 'weeks', cycleWeeks: 2, weeks: [3], anchorDate: '2026-11-04' }, { kind: 'seasonal', months: [13], pattern: { kind: 'weekly' } }, { kind: 'announced', dates: ['not-a-date'] } ] as RecurrenceRule[]) assert.equal(occursOnDate(withRule(rule), '2026-11-04'), false)
})
test('source book/odd-week records retain known recurrence without fabricated dates', () => {
  for (const id of ['bookclub-sun', 'tea-sat']) {
    const session = activitySessions.find(session => session.id === id)!
    assert.ok(calendarIssue(session))
    assert.equal(nextSessionStart(session, parseCampusDateTime('2026-11-12T12:00')!), null)
  }
  assert.equal(recurrenceLabel(activitySessions.find(session => session.id === 'bookclub-sun')!), 'Раз в три недели')
  assert.equal(recurrenceLabel(base), 'Каждую среду')
  const english = activitySessions.find(session => session.id === 'siberian-english-sun')!
  assert.equal(occursOnDate(english, '2026-11-15'), true)
  assert.equal(english.endTime, null)
  assert.equal(isSessionActive(english, parseCampusDateTime('2026-11-15T18:30')!), false)
})

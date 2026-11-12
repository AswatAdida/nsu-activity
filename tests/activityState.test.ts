import assert from 'node:assert/strict'
import test from 'node:test'
import type { ActivitySession } from '../src/data/campusTypes.ts'
import { evaluateActivity, evaluateBuildingActivity, campusDateTime, parseCampusDateTime, sessionsForRoom, sessionsForBuilding, effectiveSessionTimes, nextSessionStart } from '../src/data/activityState.ts'
import { activitySessions } from '../src/data/activitySessions.ts'
import { campusRooms } from '../src/data/campusRooms.ts'

const session: ActivitySession = { id: 'test', clubName: 'Test', roomId: 'room', dayOfWeek: 6, startTime: '18:10', endTime: '20:00', recurrence: 'weekly', attendanceMin: null, attendanceMax: null, locationStatus: 'confirmed', scheduleStatus: 'reported' }
const at = (value: string) => parseCampusDateTime(value)!
const evaluate = (patch: Partial<ActivitySession> = {}, time = '2026-11-14T18:10') => evaluateActivity([{ ...session, ...patch }], at(time))
test('Novosibirsk time is explicit and invalid dates are rejected', () => {
  assert.equal(at('2026-11-14T18:10').toISOString(), '2026-11-14T11:10:00.000Z')
  assert.equal(campusDateTime(new Date('2026-11-14T20:00:00Z')), '2026-11-15T03:00')
  for (const value of ['', '2026-02-30T12:00', '2026-11-14T24:00']) assert.equal(parseCampusDateTime(value), null)
})
test('working regular records are blue; exact current intervals are green with exclusive ends', () => {
  assert.equal(evaluate().status, 'scheduled')
  assert.equal(evaluate({}, '2026-11-14T18:09').status, 'known')
  assert.equal(evaluate({}, '2026-11-14T20:00').status, 'known')
  assert.equal(evaluate({ scheduleStatus: 'needs-confirmation' }).status, 'scheduled')
  assert.equal(evaluate({}, '2026-11-15T18:10').status, 'known')
})
test('unknown end remains unknown and never becomes a one-hour green interval', () => {
  const input = { ...session, endTime: null }
  const original = structuredClone(input)
  assert.equal(evaluateActivity([input], at('2026-11-14T18:30')).status, 'known')
  assert.equal(effectiveSessionTimes(input).end, null)
  assert.equal(effectiveSessionTimes(input).assumedDuration, false)
  assert.deepEqual(input, original)
})
test('incomplete and ambiguous regular records retain blue, without guessed activity', () => {
  for (const patch of [{ startTime: null }, { dayOfWeek: null }, { dayOfWeek: 8 }, { startTime: '25:00' }, { endTime: '18:10' }, { locationStatus: 'approximate' }, { locationStatus: 'unknown' }, { alternativeRoomIds: ['other'] }, { recurrence: 'every-3-weeks' }, { recurrence: 'usually-odd-weeks' }, { validityNeedsClarification: true }] as Partial<ActivitySession>[]) {
    assert.equal(evaluate(patch).status, 'known', JSON.stringify(patch))
    assert.equal(evaluate(patch).uncertain, true)
  }
  assert.equal(evaluateActivity([session], new Date(NaN)).status, 'known')
})
test('overnight intervals use their start date and real source end', () => {
  const patch = { dayOfWeek: 7, startTime: '23:00', endTime: '01:00', validUntil: '2026-11-15' }
  assert.equal(evaluate(patch, '2026-11-16T00:30').status, 'scheduled')
  assert.equal(evaluate(patch, '2026-11-16T01:00').status, 'known')
  assert.equal(evaluate({ ...patch, endTime: null }, '2026-11-16T00:30').status, 'known')
  assert.equal(evaluate({ validFrom: '2026-11-15' }).status, 'known')
  assert.equal(evaluate({ validUntil: 'invalid' }).uncertain, true)
})
test('colour priority is green, blue, purple base, grey no evidence', () => {
  const base = { ...session, recurrence: 'Нерегулярно, по анонсам' }
  assert.equal(evaluateActivity([base], at('2026-11-14T18:10')).status, 'base')
  assert.equal(evaluateActivity([session, base], at('2026-11-14T18:10')).status, 'scheduled')
  assert.equal(evaluateActivity([session, base], at('2026-11-14T21:10')).status, 'known')
  assert.equal(evaluateActivity([], new Date(), true).status, 'base')
  assert.deepEqual(evaluateActivity([], new Date()), { status: 'no-data', uncertain: false, reasons: [] })
})
test('location scope never marks every alternative room occupied', () => {
  const board = { ...activitySessions.find(s => s.id === 'board-games-sat')!, endTime: '20:00' }
  const instant = at('2026-11-14T18:30')
  for (const id of [board.roomId!, ...board.alternativeRoomIds!]) {
    assert.ok(sessionsForRoom([board], id).includes(board))
    assert.equal(evaluateActivity(sessionsForRoom([board], id), instant).status, 'known')
  }
  assert.equal(evaluateBuildingActivity([board], campusRooms, ['academic-1'], instant).status, 'scheduled')
  assert.equal(evaluateBuildingActivity([{ ...board, alternativeRoomIds: ['sports-new-309'] }], campusRooms, ['academic-1'], instant).status, 'known')
  assert.equal(sessionsForBuilding(activitySessions, campusRooms, 'academic-1').filter(s => s.id === board.id).length, 1)
})
test('upcoming starts can be known even when ends are unknown; periods are respected', () => {
  assert.equal(campusDateTime(nextSessionStart({ ...session, endTime: null }, at('2026-11-14T18:11'))!), '2026-11-21T18:10')
  assert.equal(campusDateTime(nextSessionStart({ ...session, validFrom: '2027-01-01' }, at('2026-11-14T18:11'))!), '2027-01-02T18:10')
  assert.equal(nextSessionStart({ ...session, validUntil: '2026-11-13' }, at('2026-11-14T18:10')), null)
})

import assert from 'node:assert/strict'
import test from 'node:test'
import type { ActivitySession } from '../src/data/campusTypes.ts'
import { evaluateActivity, evaluateBuildingActivity, campusDateTime, parseCampusDateTime, sessionsForRoom, sessionsForBuilding, effectiveSessionTimes, nextSessionStart } from '../src/data/activityState.ts'
import { activitySessions } from '../src/data/activitySessions.ts'
import { campusRooms } from '../src/data/campusRooms.ts'

const session: ActivitySession = { id: 'test', clubName: 'Test', roomId: 'room', dayOfWeek: 6, startTime: '18:10', endTime: '20:00', recurrence: 'weekly', attendanceMin: null, attendanceMax: null, locationStatus: 'confirmed', scheduleStatus: 'confirmed' }
const at = (value: string) => parseCampusDateTime(value)!
const evaluate = (patch: Partial<ActivitySession> = {}, time = '2026-11-14T18:10') => evaluateActivity([{ ...session, ...patch }], at(time))

test('Novosibirsk wall time parsing is explicit and rejects invalid dates', () => {
  assert.equal(at('2026-11-14T18:10').toISOString(), '2026-11-14T11:10:00.000Z')
  assert.equal(campusDateTime(new Date('2026-11-14T20:00:00Z')), '2026-11-15T03:00')
  for (const value of ['', '2026-02-30T12:00', '2026-11-14T24:00']) assert.equal(parseCampusDateTime(value), null)
})
test('weekly intervals include start and exclude end in campus time', () => {
  assert.equal(evaluate().status, 'scheduled')
  assert.equal(evaluate({}, '2026-11-14T18:09').status, 'known')
  assert.equal(evaluate({}, '2026-11-14T20:00').status, 'known')
  assert.equal(evaluate({}, '2026-11-15T18:10').status, 'known')
  assert.deepEqual(evaluateActivity([], at('2026-11-14T18:10')), { status: 'no-data', uncertain: false, reasons: [] })
})
test('owner confirmation policy and one-hour default do not rewrite source evidence', () => {
  const input = { ...session, scheduleStatus: 'needs-confirmation' as const, endTime: null }
  const original = structuredClone(input)
  assert.equal(evaluateActivity([input], at('2026-11-14T18:10')).status, 'scheduled')
  assert.equal(evaluateActivity([input], at('2026-11-14T19:10')).status, 'known')
  assert.equal(effectiveSessionTimes(input).endTime, '19:10')
  assert.equal(effectiveSessionTimes(input).assumedDuration, true)
  assert.deepEqual(input, original)
  assert.equal(evaluateActivity([input], at('2026-11-14T18:10'), { confirmSchedules: false, defaultDurationMinutes: null }).status, 'uncertain')
})
test('unknown starts, dates, places and recurrences never become green', () => {
  for (const patch of [{ startTime: null }, { dayOfWeek: null }, { dayOfWeek: 8 }, { startTime: '25:00' }, { endTime: '18:10' }, { locationStatus: 'approximate' }, { locationStatus: 'unknown' }, { alternativeRoomIds: ['other'] }, { recurrence: 'every-3-weeks' }, { recurrence: 'usually-odd-weeks' }, { validityNeedsClarification: true }] as Partial<ActivitySession>[]) {
    assert.equal(evaluate(patch).status, 'uncertain', JSON.stringify(patch))
    assert.equal(evaluate(patch).uncertain, true)
    if (!('locationStatus' in patch) && !('alternativeRoomIds' in patch)) assert.equal(nextSessionStart({ ...session, ...patch }, at('2026-11-14T18:10')), null)
  }
  assert.equal(evaluateActivity([session], new Date(NaN)).status, 'known')
  assert.equal(evaluateActivity([session], new Date(NaN)).uncertain, true)
})
test('overnight intervals and validity bounds use the meeting start date', () => {
  const patch = { dayOfWeek: 7, startTime: '23:00', endTime: '01:00', validUntil: '2026-11-15' }
  assert.equal(evaluate(patch, '2026-11-16T00:30').status, 'scheduled')
  assert.equal(evaluate(patch, '2026-11-16T01:00').status, 'known')
  assert.equal(evaluate({ validFrom: '2026-11-15' }).status, 'known')
  assert.equal(evaluate({ validUntil: '2026-11-13' }).status, 'known')
  assert.equal(evaluate({ validUntil: 'invalid' }).uncertain, true)
  assert.equal(evaluate({ dayOfWeek: 7, startTime: '23:30', endTime: null }, '2026-11-16T00:29').status, 'scheduled')
  assert.equal(evaluate({ dayOfWeek: 7, startTime: '23:30', endTime: null }, '2026-11-16T00:30').status, 'known')
})
test('priority is active, then regular, then uncertain; uncertainty remains visible', () => {
  const unknown = { ...session, startTime: null }
  assert.equal(evaluateActivity([unknown], at('2026-11-14T18:10')).status, 'uncertain')
  const state = evaluateActivity([session, unknown], at('2026-11-14T18:10'))
  assert.equal(state.status, 'scheduled')
  assert.equal(state.uncertain, true)
  assert.equal(evaluateActivity([session, unknown], at('2026-11-14T21:10')).status, 'known')
})
test('building scope resolves alternative rooms only within its own physical site', () => {
  const board = activitySessions.find(s => s.id === 'board-games-sat')!
  const instant = at('2026-11-14T18:30')
  for (const id of [board.roomId!, ...board.alternativeRoomIds!]) {
    assert.ok(sessionsForRoom(activitySessions, id).includes(board))
    assert.equal(evaluateActivity(sessionsForRoom(activitySessions, id), instant).status, 'uncertain')
  }
  const building = sessionsForBuilding(activitySessions, campusRooms, 'academic-1')
  assert.equal(building.filter(s => s.id === board.id).length, 1)
  assert.equal(evaluateBuildingActivity([board], campusRooms, ['academic-1'], instant).status, 'scheduled')
  assert.equal(evaluateBuildingActivity([{ ...board, alternativeRoomIds: ['sports-new-309'] }], campusRooms, ['academic-1'], instant).status, 'uncertain')
  assert.equal(evaluateBuildingActivity([{ ...board, locationStatus: 'unknown' }], campusRooms, ['academic-1'], instant).status, 'uncertain')
  assert.ok(!building.some(s => s.id === 'ultimate-mon'))
})
test('upcoming starts use campus dates, validity and selected instant', () => {
  assert.equal(campusDateTime(nextSessionStart(session, at('2026-11-14T18:10'))!), '2026-11-14T18:10')
  assert.equal(campusDateTime(nextSessionStart(session, at('2026-11-14T18:11'))!), '2026-11-21T18:10')
  assert.equal(campusDateTime(nextSessionStart({ ...session, validFrom: '2027-01-01' }, at('2026-11-14T18:11'))!), '2027-01-02T18:10')
  assert.equal(nextSessionStart({ ...session, validUntil: '2026-11-13' }, at('2026-11-14T18:10')), null)
})
test('real data respects the one-hour policy without inventing missing periods', () => {
  const english = activitySessions.find(s => s.id === 'academian-english-sun')!
  assert.equal(evaluateActivity([english], at('2026-11-15T18:29')).status, 'scheduled')
  assert.equal(evaluateActivity([english], at('2026-11-15T18:30')).status, 'known')
  const ultimate = activitySessions.find(s => s.id === 'ultimate-mon')!
  assert.equal(evaluateActivity([ultimate], at('2026-11-16T21:00')).status, 'uncertain')
  assert.equal(nextSessionStart(ultimate, at('2026-11-16T20:00')), null)
})

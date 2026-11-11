import assert from 'node:assert/strict'
import test from 'node:test'
import type { ActivitySession } from '../src/data/campusTypes.ts'
import { evaluateActivity, campusDateTime, parseCampusDateTime, sessionsForRoom, sessionsForBuilding } from '../src/data/activityState.ts'
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
test('partial, approximate, unverified and unsupported schedules never become green', () => {
  for (const patch of [{ endTime: null }, { startTime: null }, { dayOfWeek: null }, { dayOfWeek: 8 }, { startTime: '25:00' }, { endTime: '18:10' }, { scheduleStatus: undefined }, { scheduleStatus: 'reported' }, { scheduleStatus: 'needs-confirmation' }, { locationStatus: 'approximate' }, { locationStatus: 'unknown' }, { alternativeRoomIds: ['other'] }, { recurrence: 'every-3-weeks' }, { recurrence: 'usually-odd-weeks' }] as Partial<ActivitySession>[]) {
    assert.equal(evaluate(patch).status, 'known', JSON.stringify(patch))
    assert.equal(evaluate(patch).uncertain, true)
  }
  assert.equal(evaluateActivity([session], new Date(NaN)).status, 'known')
})
test('overnight intervals and validity bounds use the meeting start date', () => {
  const patch = { dayOfWeek: 7, startTime: '23:00', endTime: '01:00', validUntil: '2026-11-15' }
  assert.equal(evaluate(patch, '2026-11-16T00:30').status, 'scheduled')
  assert.equal(evaluate(patch, '2026-11-16T01:00').status, 'known')
  assert.equal(evaluate({ validFrom: '2026-11-15' }).status, 'known')
  assert.equal(evaluate({ validUntil: '2026-11-13' }).status, 'known')
  assert.equal(evaluate({ validUntil: 'invalid' }).uncertain, true)
})
test('aggregation preserves active plus uncertain evidence and deduplicates building sessions', () => {
  const state = evaluateActivity([session, { ...session, endTime: null }], at('2026-11-14T18:10'))
  assert.equal(state.status, 'scheduled')
  assert.equal(state.uncertain, true)
  const board = activitySessions.find(s => s.id === 'board-games-sat')!
  for (const id of [board.roomId!, ...board.alternativeRoomIds!]) assert.ok(sessionsForRoom(activitySessions, id).includes(board))
  const building = sessionsForBuilding(activitySessions, campusRooms, 'academic-1')
  assert.equal(building.filter(s => s.id === board.id).length, 1)
  assert.ok(!building.some(s => s.id === 'ultimate-mon'))
  assert.ok(sessionsForBuilding(activitySessions, campusRooms, 'sports-new').some(s => s.id === 'ultimate-mon'))
})
test('existing records are not silently promoted to confirmed schedules', () => {
  for (const session of activitySessions) assert.notEqual(evaluateActivity([session], at('2026-11-14T18:30')).status, 'scheduled')
})

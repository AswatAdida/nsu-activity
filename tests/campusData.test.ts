import assert from 'node:assert/strict'
import test from 'node:test'
import clubs from '../src/data/clubs.json' with { type: 'json' }
import { activitySessions } from '../src/data/activitySessions.ts'
import { campusRooms } from '../src/data/campusRooms.ts'
import { validateCampusData } from '../src/data/validateCampusData.ts'
import { formatSessionTime } from '../src/data/sessionDisplay.ts'

test('expanded campus data keeps all club, building and room references valid', () => {
  assert.deepEqual(validateCampusData(), [])
  assert.equal(clubs.length, 33)
  assert.equal(new Set(clubs.map(c => c.id)).size, 33)
})

test('all newly provided meetings have provenance and unknown attendance remains null', () => {
  const imported = activitySessions.filter(s => s.source)
  assert.equal(imported.length, 20)
  for (const session of imported) {
    assert.equal(session.attendanceMin, null)
    assert.equal(session.attendanceMax, null)
    assert.equal(session.source?.kind, 'user-message')
    assert.equal(session.source?.recordedOn, session.id.startsWith('mountain-run-') ? '2026-11-12' : '2026-11-10')
    if (session.id.startsWith('mountain-run-')) assert.equal(session.sourceHistory?.[0].recordedOn, '2026-11-10')
  }
  assert.equal(activitySessions.some(s => s.clubId === 'dansu'), false)
  assert.equal(activitySessions.some(s => s.clubId === 'omut'), false)
  assert.equal(activitySessions.some(s => s.clubId === 'confucius-knowledge'), false)
})

test('board games are one meeting with several possible rooms; English clubs remain separate', () => {
  const games = activitySessions.filter(s => s.clubId === 'board-games')
  assert.equal(games.length, 1)
  assert.equal(games[0].roomId, 'academic-1-2241')
  assert.deepEqual(games[0].alternativeRoomIds, ['academic-1-2270', 'academic-1-2271'])
  const english = activitySessions.filter(s => ['siberian-english', 'academian-english'].includes(s.clubId ?? ''))
  assert.equal(english.length, 2)
  assert.deepEqual(english.map(s => s.startTime), ['18:00', '17:30'])
  assert.ok(english.every(s => s.endTime === null && s.roomId === 'academic-1-5222'))
})

test('rectorate 212 clarification is retained; sports floors and uncertain dorm annex remain unknown', () => {
  const rectorate = campusRooms.find(r => r.id === 'academic-1-212')!
  assert.equal(rectorate.buildingId, 'academic-1')
  assert.equal(rectorate.floor, 2)
  assert.equal(rectorate.block, 'Ректорат')
  assert.equal(activitySessions.find(s => s.clubId === 'historical-political')?.roomId, rectorate.id)
  assert.equal(campusRooms.find(r => r.id === 'sports-new-309')?.floor, null)
  assert.equal(campusRooms.find(r => r.id === 'sports-new-223')?.floor, null)
  assert.equal(campusRooms.find(r => r.id === 'dorm-6-dance-unverified-annex')?.buildingId, 'dorm-6')
  assert.ok(campusRooms.some(r => r.id === 'academic-1-2253'))
})

test('missing start or end time is displayed explicitly', () => {
  assert.equal(formatSessionTime({ dayOfWeek: 1, startTime: null, endTime: null }), 'Понедельник · время начала не указано')
  assert.equal(formatSessionTime({ dayOfWeek: 7, startTime: '17:30', endTime: null }), 'Воскресенье · 17:30')
})

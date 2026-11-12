import rawClubs from './clubs.json' with { type: 'json' }
import { activitySessions as storedSessions } from './activitySessions.ts'
import type { ActivitySession } from './campusTypes.ts'

// Exact transcription of unambiguous catalogue descriptions. No general prose parser:
// changing a source string disables its projection until the mapping is reviewed.
type Slot = { key: string; day: number | null; start: string | null; end: string | null; roomId?: string; buildingId?: string; locationNote?: string }
type Projection = { clubId: string; schedule: string; location: string; recurrence?: string; slots: Slot[] }
const projections: Projection[] = [
  { clubId: 'medieval', schedule: 'Среда 18:00–20:00 · Воскресенье 15:00–19:00', location: 'Пристройка общежития № 6; Пирогова, 12/1, ауд. 224', slots: [{ key: 'sun', day: 7, start: '15:00', end: '19:00' }] },
  { clubId: 'swing', schedule: 'Среда 20:00–22:00 · Пятница 19:00–22:00', location: 'Танцевальный зал, пристройка общежития № 6, Пирогова, 16', slots: [
    { key: 'wed', day: 3, start: '20:00', end: '22:00', roomId: 'dorm-6-dance' },
    { key: 'fri', day: 5, start: '19:00', end: '22:00', roomId: 'dorm-6-dance' },
  ] },
  { clubId: 'digma', schedule: 'Примерно раз в две недели', location: 'Обычно 3-й блок', recurrence: 'every-2-weeks', slots: [{ key: 'periodic', day: null, start: null, end: null }] },
  { clubId: 'fire', schedule: 'Вт 19:30–22:00 · Пт 18:00–21:00 · Вс 12:00–17:30', location: 'Пирогова, 16; Пирогова, 12/1; Пирогова, 12', slots: [
    { key: 'tue', day: 2, start: '19:30', end: '22:00' }, { key: 'sun', day: 7, start: '12:00', end: '17:30' },
  ] },
  { clubId: 'vocal', schedule: 'Пн 19:00–21:30 · Ср 18:00–21:00 · Вс 11:00–16:00', location: 'Пирогова, 11/2; пристройка общежития № 5, Пирогова, 14', slots: [
    { key: 'mon', day: 1, start: '19:00', end: '21:30' }, { key: 'wed', day: 3, start: '18:00', end: '21:00' }, { key: 'sun', day: 7, start: '11:00', end: '16:00' },
  ] },
  { clubId: 'cinema', schedule: 'Вторник 18:10–21:00', location: 'База — ауд. 2253; место встречи уточняется', slots: [{ key: 'tue', day: 2, start: '18:10', end: '21:00' }] },
  { clubId: 'theatre', schedule: 'Понедельник и четверг 18:30–22:00', location: 'Пн: общежитие № 5, зал на 1-м этаже; Чт: «Юность», Строителей, 21', slots: [
    { key: 'mon', day: 1, start: '18:30', end: '22:00', buildingId: 'dorm-5', locationNote: 'Общежитие № 5, зал на 1-м этаже' }, { key: 'thu', day: 4, start: '18:30', end: '22:00', locationNote: '«Юность», Строителей, 21' },
  ] },
  { clubId: 'taverna', schedule: 'Будни с 18:10 · Сб с 14:30 · Вс с 12:40', location: 'Разные аудитории НГУ, уточняйте в анонсах', slots: [
    ...[1, 2, 3, 4, 5].map(day => ({ key: `weekday-${day}`, day, start: '18:10', end: null })),
    { key: 'sat', day: 6, start: '14:30', end: null }, { key: 'sun', day: 7, start: '12:40', end: null },
  ] },
  { clubId: 'media', schedule: 'Пятница с 18:00', location: 'Кабинет 0250', slots: [{ key: 'fri', day: 5, start: '18:00', end: null, roomId: 'academic-1-0250' }] },
]
const derived: ActivitySession[] = projections.flatMap(projection => {
  const club = rawClubs.find(club => club.id === projection.clubId)
  if (!club || club.schedule !== projection.schedule || club.location !== projection.location) return []
  return projection.slots.filter(slot => !storedSessions.some(session => (session.clubId ? session.clubId === club.id : session.clubName === club.name) && session.dayOfWeek === slot.day && session.startTime === slot.start && session.endTime === slot.end)).map(slot => ({
    id: `catalog-${club.id}-${slot.key}`, clubId: club.id, clubName: club.name,
    roomId: slot.roomId ?? null, buildingId: slot.buildingId,
    locationNote: slot.locationNote ?? club.location, locationStatus: slot.roomId || slot.buildingId ? 'confirmed' : 'unknown',
    dayOfWeek: slot.day, startTime: slot.start, endTime: slot.end,
    recurrence: projection.recurrence ?? 'weekly', attendanceMin: null, attendanceMax: null,
    catalogSource: { clubId: club.id, schedule: club.schedule, location: club.location },
  }))
})
// Both map and planner consume this model. Original records and text remain unchanged.
export const activitySessions: ActivitySession[] = [...storedSessions, ...derived]

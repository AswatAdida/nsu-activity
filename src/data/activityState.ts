import type { ActivitySession, CampusRoom } from './campusTypes.ts'
import { calendarIssue, isRegularSession, isSessionActive, timeMinutes } from './sessionSchedule.ts'
export { CAMPUS_TIME_ZONE, campusDateTime, parseCampusDateTime } from './campusTime.ts'
export { effectiveSessionTimes, nextSessionStart } from './sessionSchedule.ts'

export type ActivityState = {
  status: 'no-data' | 'base' | 'known' | 'scheduled'
  uncertain: boolean // Metadata retained; not a visual category.
  reasons: string[]
}
export const activityLabels = {
  'no-data': 'Нет сведений об активности', base: 'Базовое место объединения',
  known: 'Есть регулярные занятия', scheduled: 'Занятие по расписанию',
}
export const activityColors = { 'no-data': '#94a3b8', base: '#9333ea', known: '#2563eb', scheduled: '#16a34a' }
export function evaluateActivity(sessions: readonly ActivitySession[], instant: Date, hasBase = false): ActivityState {
  const reasons = new Set<string>()
  let active = false
  for (const session of sessions) {
    const issue = calendarIssue(session)
    if (issue) reasons.add(issue)
    if (timeMinutes(session.startTime) === null) reasons.add('Время начала не указано')
    if (timeMinutes(session.endTime) === null) reasons.add('Время окончания не указано')
    if (session.startTime && session.startTime === session.endTime) reasons.add('Длительность не определена')
    const exactLocation = session.locationStatus === 'confirmed' && !session.alternativeRoomIds?.length
    if (!exactLocation) reasons.add('Место указано приблизительно')
    if (exactLocation && isSessionActive(session, instant)) active = true
  }
  if (!Number.isFinite(+instant) && sessions.length) reasons.add('Дата и время не выбраны')
  const regular = sessions.some(isRegularSession)
  const base = hasBase || sessions.some(session => !isRegularSession(session))
  return { status: active ? 'scheduled' : regular ? 'known' : base ? 'base' : 'no-data', uncertain: reasons.size > 0, reasons: [...reasons] }
}
export function sessionsForRoom(sessions: readonly ActivitySession[], roomId: string) {
  return sessions.filter(session => session.roomId === roomId || session.alternativeRoomIds?.includes(roomId))
}
export function sessionsForBuilding(sessions: readonly ActivitySession[], rooms: readonly CampusRoom[], buildingId: string) {
  const ids = new Set(rooms.filter(room => room.buildingId === buildingId).map(room => room.id))
  return sessions.filter(session => session.buildingId === buildingId || (session.roomId !== null && ids.has(session.roomId)) || session.alternativeRoomIds?.some(id => ids.has(id)))
}
export function sessionsForBuildings(sessions: readonly ActivitySession[], rooms: readonly CampusRoom[], buildingIds: readonly string[]) {
  const selected = new Set(buildingIds.flatMap(id => sessionsForBuilding(sessions, rooms, id)))
  return sessions.filter(session => selected.has(session))
}
export function evaluateBuildingActivity(sessions: readonly ActivitySession[], rooms: readonly CampusRoom[], buildingIds: readonly string[], instant: Date, hasBase = false) {
  const localRoomIds = new Set(rooms.filter(room => buildingIds.includes(room.buildingId)).map(room => room.id))
  return evaluateActivity(sessions.map(session => {
    const candidates = [session.roomId, ...(session.alternativeRoomIds ?? [])].filter((id): id is string => id !== null)
    const knownSite = session.locationStatus !== 'unknown' && candidates.length > 0 && candidates.every(id => localRoomIds.has(id))
    return knownSite ? { ...session, locationStatus: 'confirmed', alternativeRoomIds: [] } as ActivitySession : session
  }), instant, hasBase)
}
// Keep this module independent of React and geometry; both map levels share these rules.

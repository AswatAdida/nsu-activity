import type { ActivitySession, CampusRoom } from './campusTypes.ts'

export const CAMPUS_TIME_ZONE = 'Asia/Novosibirsk'
export type ActivityPolicy = { confirmSchedules: boolean; defaultDurationMinutes: number | null }
// Explicit project-owner instruction for stage 2. Preserve original source fields.
export const activityPolicy: ActivityPolicy = { confirmSchedules: true, defaultDurationMinutes: 60 }
export type ActivityState = {
  status: 'no-data' | 'uncertain' | 'known' | 'scheduled'
  uncertain: boolean
  reasons: string[]
}
export const activityLabels = {
  'no-data': 'Нет сведений о мероприятиях',
  uncertain: 'Данные требуют уточнения',
  known: 'Известны регулярные встречи',
  scheduled: 'Встреча по расписанию',
}
export const activityColors = { 'no-data': '#94a3b8', uncertain: '#ea580c', known: '#2563eb', scheduled: '#16a34a' }
const formatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: CAMPUS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})
export function campusDateTime(instant: Date): string {
  const parts = formatter.formatToParts(instant)
  const part = (type: string) => parts.find(p => p.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`
}

export function parseCampusDateTime(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const date = new Date(`${value}:00+07:00`)
  return Number.isFinite(date.getTime()) && campusDateTime(date) === value ? date : null
}
const minutes = (value: string | null) => value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
  ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : null
const timeFromMinutes = (value: number) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`

export function effectiveSessionTimes(session: Pick<ActivitySession, 'startTime' | 'endTime'>, policy = activityPolicy) {
  const start = minutes(session.startTime)
  const assumedDuration = session.endTime === null && start !== null && policy.defaultDurationMinutes !== null
  const end = assumedDuration ? (start + policy.defaultDurationMinutes!) % 1440 : minutes(session.endTime)
  return { start, end, endTime: end === null ? null : timeFromMinutes(end), assumedDuration }
}

function scheduleIssues(session: ActivitySession, policy: ActivityPolicy) {
  const issues: string[] = []
  if (!policy.confirmSchedules && session.scheduleStatus !== 'confirmed') issues.push('Расписание не подтверждено')
  if (session.recurrence !== 'weekly') issues.push('Периодичность не позволяет определить точную дату')
  if (session.validityNeedsClarification) issues.push('Границы периода действия расписания требуют уточнения')
  const { start, end } = effectiveSessionTimes(session, policy)
  if (!Number.isInteger(session.dayOfWeek) || session.dayOfWeek! < 1 || session.dayOfWeek! > 7 || start === null || end === null || start === end) issues.push('День или время указаны не полностью')
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && parseCampusDateTime(`${value}T00:00`) !== null
  if ((session.validFrom && !validDate(session.validFrom)) || (session.validUntil && !validDate(session.validUntil)) || (session.validFrom && session.validUntil && session.validFrom > session.validUntil)) issues.push('Период действия расписания некорректен')
  return issues
}

// Pure evaluator shared by rooms and campus sites. Colour priority is independent of
// the uncertainty flag: one regular meeting can coexist with incomplete evidence.
export function evaluateActivity(sessions: readonly ActivitySession[], instant: Date, policy = activityPolicy): ActivityState {
  if (!sessions.length) return { status: 'no-data', uncertain: false, reasons: [] }
  const reasons = new Set<string>()
  let scheduled = false, regular = false
  const local = Number.isFinite(instant.getTime()) ? campusDateTime(instant) : null
  const localDay = local ? new Date(`${local.slice(0, 10)}T00:00:00Z`).getUTCDay() || 7 : 0
  const now = local ? minutes(local.slice(11))! : 0
  for (const session of sessions) {
    const issues = scheduleIssues(session, policy)
    if (session.locationStatus !== 'confirmed' || session.alternativeRoomIds?.length) issues.push('Место встречи уточняется')
    issues.forEach(issue => reasons.add(issue))
    if (issues.length) continue
    regular = true
    if (!local) continue
    const { start, end } = effectiveSessionTimes(session, policy)
    if (start === null || end === null) continue
    // An overnight meeting belongs to its start date, including validity bounds.
    const afterMidnight = end < start && now < end
    const startDate = afterMidnight
      ? new Date(Date.parse(`${local.slice(0, 10)}T00:00:00Z`) - 86400000).toISOString().slice(0, 10)
      : local.slice(0, 10)
    const day = afterMidnight ? (localDay === 1 ? 7 : localDay - 1) : localDay
    if ((session.validFrom && startDate < session.validFrom) || (session.validUntil && startDate > session.validUntil)) continue
    if (day === session.dayOfWeek && (end > start ? now >= start && now < end : now >= start || now < end)) scheduled = true
  }
  if (!local) reasons.add('Выберите корректные дату и время')
  return { status: scheduled ? 'scheduled' : regular ? 'known' : 'uncertain', uncertain: reasons.size > 0, reasons: [...reasons] }
}

export function sessionsForRoom(sessions: readonly ActivitySession[], roomId: string) {
  return sessions.filter(s => s.roomId === roomId || s.alternativeRoomIds?.includes(roomId))
}

export function sessionsForBuilding(sessions: readonly ActivitySession[], rooms: readonly CampusRoom[], buildingId: string) {
  const ids = new Set(rooms.filter(r => r.buildingId === buildingId).map(r => r.id))
  return sessions.filter(s => s.buildingId === buildingId || (s.roomId !== null && ids.has(s.roomId)) || s.alternativeRoomIds?.some(id => ids.has(id)))
}

export function sessionsForBuildings(sessions: readonly ActivitySession[], rooms: readonly CampusRoom[], buildingIds: readonly string[]) {
  const selected = new Set(buildingIds.flatMap(id => sessionsForBuilding(sessions, rooms, id)))
  return sessions.filter(session => selected.has(session))
}

// A known building may contain an unknown room. At that broader scope, alternative
// rooms only cease to be ambiguous if every candidate belongs to the selected site.
export function evaluateBuildingActivity(sessions: readonly ActivitySession[], rooms: readonly CampusRoom[], buildingIds: readonly string[], instant: Date) {
  const localRoomIds = new Set(rooms.filter(room => buildingIds.includes(room.buildingId)).map(room => room.id))
  return evaluateActivity(sessions.map(session => {
    const candidates = [session.roomId, ...(session.alternativeRoomIds ?? [])].filter((id): id is string => id !== null)
    const knownSite = session.locationStatus !== 'unknown' && candidates.length > 0 && candidates.every(id => localRoomIds.has(id))
    return knownSite ? { ...session, locationStatus: 'confirmed', alternativeRoomIds: [] } as ActivitySession : session
  }), instant)
}

// One next start per session; unsupported recurrences never generate guessed dates.
// Location may still need clarification and is displayed alongside the occurrence.
export function nextSessionStart(session: ActivitySession, instant: Date, policy = activityPolicy): Date | null {
  if (!Number.isFinite(instant.getTime()) || scheduleIssues(session, policy).length) return null
  const today = campusDateTime(instant).slice(0, 10)
  const baseDay = session.validFrom && session.validFrom > today ? session.validFrom : today
  const base = Date.parse(`${baseDay}T00:00:00Z`)
  const weekday = new Date(base).getUTCDay() || 7
  let day = new Date(base + ((session.dayOfWeek! - weekday + 7) % 7) * 86400000).toISOString().slice(0, 10)
  let result = parseCampusDateTime(`${day}T${session.startTime}`)!
  if (result < instant) {
    day = new Date(Date.parse(`${day}T00:00:00Z`) + 7 * 86400000).toISOString().slice(0, 10)
    result = parseCampusDateTime(`${day}T${session.startTime}`)!
  }
  return session.validUntil && day > session.validUntil ? null : result
}

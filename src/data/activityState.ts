import type { ActivitySession, CampusRoom } from './campusTypes.ts'

export const CAMPUS_TIME_ZONE = 'Asia/Novosibirsk'
export type ActivityState = {
  status: 'no-data' | 'known' | 'scheduled'
  uncertain: boolean
  reasons: string[]
}
export const activityLabels = {
  'no-data': 'Нет сведений о мероприятиях',
  known: 'Есть сведения о встречах',
  scheduled: 'Встреча по расписанию',
}
export const activityColors = { 'no-data': '#94a3b8', known: '#2563eb', scheduled: '#16a34a' }

export function campusDateTime(instant: Date): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: CAMPUS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(instant)
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

// Pure evaluator: accepts any session set, including a future building-level selection.
// Missing confirmation, unknown recurrence or missing times never imply an active meeting.
export function evaluateActivity(sessions: readonly ActivitySession[], instant: Date): ActivityState {
  const reasons = new Set<string>()
  let scheduled = false
  const local = Number.isFinite(instant.getTime()) ? campusDateTime(instant) : null
  const localDay = local ? new Date(`${local.slice(0, 10)}T00:00:00Z`).getUTCDay() || 7 : 0
  const now = local ? minutes(local.slice(11))! : 0
  for (const session of sessions) {
    const issues: string[] = []
    if (session.scheduleStatus !== 'confirmed') issues.push('Расписание не подтверждено')
    if (session.locationStatus !== 'confirmed' || session.alternativeRoomIds?.length) issues.push('Место встречи уточняется')
    if (session.recurrence !== 'weekly') issues.push('Периодичность не позволяет определить точную дату')
    const start = minutes(session.startTime), end = minutes(session.endTime)
    if (!Number.isInteger(session.dayOfWeek) || session.dayOfWeek! < 1 || session.dayOfWeek! > 7 || start === null || end === null || start === end) issues.push('День или время указаны не полностью')
    if (!local) issues.push('Выберите корректные дату и время')
    const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && parseCampusDateTime(`${value}T00:00`) !== null
    if ((session.validFrom && !validDate(session.validFrom)) || (session.validUntil && !validDate(session.validUntil)) || (session.validFrom && session.validUntil && session.validFrom > session.validUntil)) issues.push('Период действия расписания некорректен')
    issues.forEach(issue => reasons.add(issue))
    if (issues.length || !local || start === null || end === null) continue
    // For an overnight meeting, validity belongs to the date on which it starts.
    const afterMidnight = end < start && now < end
    const startDate = afterMidnight
      ? new Date(Date.parse(`${local.slice(0, 10)}T00:00:00Z`) - 86400000).toISOString().slice(0, 10)
      : local.slice(0, 10)
    const day = afterMidnight ? (localDay === 1 ? 7 : localDay - 1) : localDay
    if (session.validFrom && startDate < session.validFrom || session.validUntil && startDate > session.validUntil) continue
    if (day === session.dayOfWeek && (end > start ? now >= start && now < end : now >= start || now < end)) scheduled = true
  }
  return { status: scheduled ? 'scheduled' : sessions.length ? 'known' : 'no-data', uncertain: reasons.size > 0, reasons: [...reasons] }
}

export function sessionsForRoom(sessions: readonly ActivitySession[], roomId: string) {
  return sessions.filter(s => s.roomId === roomId || s.alternativeRoomIds?.includes(roomId))
}

export function sessionsForBuilding(sessions: readonly ActivitySession[], rooms: readonly CampusRoom[], buildingId: string) {
  const ids = new Set(rooms.filter(r => r.buildingId === buildingId).map(r => r.id))
  return sessions.filter(s => s.buildingId === buildingId || (s.roomId !== null && ids.has(s.roomId)) || s.alternativeRoomIds?.some(id => ids.has(id)))
}

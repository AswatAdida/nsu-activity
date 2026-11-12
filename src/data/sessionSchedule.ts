import type { ActivitySession, RecurrenceRule, WeeklyPattern } from './campusTypes.ts'
import { addDays, campusDateTime, dayOfWeek, parseCampusDateTime, validCampusDate, weekStart } from './campusTime.ts'

export const weekdays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
const everyDay = ['Каждый понедельник', 'Каждый вторник', 'Каждую среду', 'Каждый четверг', 'Каждую пятницу', 'Каждую субботу', 'Каждое воскресенье']
const monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']

// Adapt only known source descriptions. Unknown prose never becomes a weekly event.
export function recurrenceFor(session: ActivitySession): RecurrenceRule {
  if (session.recurrenceRule) return session.recurrenceRule
  switch (session.recurrence) {
    case 'weekly': return { kind: 'weekly' }
    case 'every-2-weeks': return { kind: 'interval', weeks: 2 }
    case 'every-3-weeks': return { kind: 'interval', weeks: 3 }
    case 'usually-odd-weeks': return { kind: 'weeks', cycleWeeks: 2, weeks: [1] }
    case 'Воскресенья с сентября по апрель': return { kind: 'seasonal', months: [9, 10, 11, 12, 1, 2, 3, 4], pattern: { kind: 'weekly' } }
    case 'Нерегулярно, по анонсам': return { kind: 'announced' }
    default: return { kind: 'unknown' }
  }
}
export const isRegularSession = (session: ActivitySession) => !['announced', 'unknown'].includes(recurrenceFor(session).kind)
export function recurrenceLabel(session: ActivitySession): string {
  const rule = recurrenceFor(session)
  if (session.catalogSource?.schedule === 'Примерно раз в две недели') return 'Примерно раз в две недели'
  if (!session.recurrenceRule && session.recurrence === 'usually-odd-weeks') return 'Обычно по нечётным неделям'
  const weekly = session.dayOfWeek && session.dayOfWeek >= 1 && session.dayOfWeek <= 7 ? everyDay[session.dayOfWeek - 1] : 'Еженедельно'
  const patternLabel = (pattern: WeeklyPattern) => pattern.kind === 'weekly' ? weekly : pattern.kind === 'interval'
    ? pattern.weeks === 2 ? 'Раз в две недели' : pattern.weeks === 3 ? 'Раз в три недели' : `Раз в ${pattern.weeks} недель`
    : `По неделям ${pattern.weeks.join(', ')} в цикле из ${pattern.cycleWeeks} недель`
  if (rule.kind === 'announced') return 'По анонсам'
  if (rule.kind === 'unknown') return session.recurrence || 'Периодичность не указана'
  if (rule.kind === 'seasonal') return `${patternLabel(rule.pattern)} · ${rule.months.join(',') === '9,10,11,12,1,2,3,4' ? 'с сентября по апрель' : `сезон: ${rule.months.map(month => monthNames[month - 1]).join(', ')}`}`
  return patternLabel(rule)
}
export const timeMinutes = (value: string | null) => value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
  ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : null
export function effectiveSessionTimes(session: Pick<ActivitySession, 'startTime' | 'endTime'>) {
  return { start: timeMinutes(session.startTime), end: timeMinutes(session.endTime), endTime: session.endTime, assumedDuration: false }
}
function patternIssue(pattern: WeeklyPattern): string | null {
  if (pattern.kind === 'weekly') return null
  const cycle = pattern.kind === 'interval' ? pattern.weeks : pattern.cycleWeeks
  if (!Number.isInteger(cycle) || cycle < 1 || cycle > 52) return 'Периодичность не определена'
  if (pattern.kind === 'weeks' && (!pattern.weeks.length || pattern.weeks.some(week => !Number.isInteger(week) || week < 1 || week > cycle))) return 'Номера недель не определены'
  if (!pattern.anchorDate || !validCampusDate(pattern.anchorDate)) return 'Для определения дат нужна опорная дата'
  return null
}
export function calendarIssue(session: ActivitySession): string | null {
  const rule = recurrenceFor(session)
  if (session.validityNeedsClarification) return 'Период действия указан без точных границ'
  if ((session.validFrom && !validCampusDate(session.validFrom)) || (session.validUntil && !validCampusDate(session.validUntil)) || (session.validFrom && session.validUntil && session.validFrom > session.validUntil)) return 'Период действия не определён'
  if (rule.kind === 'announced') return rule.dates?.length && rule.dates.every(validCampusDate) ? null : 'По анонсам, конкретные даты не указаны'
  if (rule.kind === 'unknown') return 'Периодичность не определена'
  if (!Number.isInteger(session.dayOfWeek) || session.dayOfWeek! < 1 || session.dayOfWeek! > 7) return 'День недели не указан'
  if (rule.kind === 'seasonal') {
    if (!rule.months.length || rule.months.some(month => !Number.isInteger(month) || month < 1 || month > 12)) return 'Сезон не определён'
    return patternIssue(rule.pattern)
  }
  return patternIssue(rule)
}
function patternMatches(pattern: WeeklyPattern, date: string): boolean {
  if (pattern.kind === 'weekly') return true
  const delta = Math.round((Date.parse(`${weekStart(date)}T00:00:00Z`) - Date.parse(`${weekStart(pattern.anchorDate!)}T00:00:00Z`)) / 604800000)
  const cycle = pattern.kind === 'interval' ? pattern.weeks : pattern.cycleWeeks
  const index = ((delta % cycle) + cycle) % cycle
  return pattern.kind === 'interval' ? index === 0 : pattern.weeks.includes(index + 1)
}
export function occursOnDate(session: ActivitySession, date: string): boolean {
  if (!validCampusDate(date) || calendarIssue(session)) return false
  if ((session.validFrom && date < session.validFrom) || (session.validUntil && date > session.validUntil)) return false
  const rule = recurrenceFor(session)
  if (rule.kind === 'announced') return rule.dates!.includes(date)
  if (rule.kind === 'unknown' || dayOfWeek(date) !== session.dayOfWeek) return false
  if (rule.kind === 'seasonal') return rule.months.includes(Number(date.slice(5, 7))) && patternMatches(rule.pattern, date)
  return patternMatches(rule, date)
}
export function isSessionActive(session: ActivitySession, instant: Date): boolean {
  if (!Number.isFinite(+instant)) return false
  const { start, end } = effectiveSessionTimes(session)
  if (start === null || end === null || start === end) return false
  const local = campusDateTime(instant), now = timeMinutes(local.slice(11))!
  const date = end < start && now < end ? addDays(local.slice(0, 10), -1) : local.slice(0, 10)
  return occursOnDate(session, date) && (end > start ? now >= start && now < end : now >= start || now < end)
}
export function nextSessionStart(session: ActivitySession, instant: Date): Date | null {
  if (!Number.isFinite(+instant) || timeMinutes(session.startTime) === null || calendarIssue(session)) return null
  const today = campusDateTime(instant).slice(0, 10)
  const base = session.validFrom && session.validFrom > today ? session.validFrom : today
  const rule = recurrenceFor(session)
  if (rule.kind === 'announced') return rule.dates!.map(date => parseCampusDateTime(`${date}T${session.startTime}`)!).filter(date => date >= instant && occursOnDate(session, campusDateTime(date).slice(0, 10))).sort((a, b) => +a - +b)[0] ?? null
  for (let offset = 0; offset < 1464; offset++) {
    const date = addDays(base, offset)
    if (session.validUntil && date > session.validUntil) break
    if (!occursOnDate(session, date)) continue
    const result = parseCampusDateTime(`${date}T${session.startTime}`)!
    if (result >= instant) return result
  }
  return null
}

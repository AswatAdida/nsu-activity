import type { ActivitySession } from './campusTypes.ts'
import { activitySessions } from './activityModel.ts'
import { clubs, sessionClub, sessionsForClub } from './activityCatalog.ts'
import { addDays, validCampusDate, weekStart } from './campusTime.ts'
import { calendarIssue, isRegularSession, occursOnDate, timeMinutes } from './sessionSchedule.ts'

export const SELECTION_KEY = 'nsu-activity:selected-clubs:v1'
export function sanitizeClubSelection(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const allowed = new Set(clubs.map(club => club.id))
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && allowed.has(id)))]
}
export function readClubSelection(storage: Pick<Storage, 'getItem'>): string[] {
  try { return sanitizeClubSelection(JSON.parse(storage.getItem(SELECTION_KEY) ?? '[]')) } catch { return [] }
}
export function writeClubSelection(storage: Pick<Storage, 'setItem'>, value: string[]): boolean {
  try { storage.setItem(SELECTION_KEY, JSON.stringify(sanitizeClubSelection(value))); return true } catch { return false }
}
export type ScheduleOccurrence = { session: ActivitySession; date: string }
export function studentWeek(selectedIds: readonly string[], date: string) {
  if (!validCampusDate(date)) throw new RangeError('Для расписания нужна корректная дата')
  const start = weekStart(date)
  const sessions = activitySessions.filter(session => selectedIds.includes(sessionClub(session)?.id ?? ''))
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(start, index)
    const entries: ScheduleOccurrence[] = sessions.filter(session => occursOnDate(session, day)).sort((a, b) =>
      (timeMinutes(a.startTime) ?? Infinity) - (timeMinutes(b.startTime) ?? Infinity) || a.clubName.localeCompare(b.clubName, 'ru')
    ).map(session => ({ session, date: day }))
    return { date: day, entries }
  })
  return {
    start, days,
    undated: sessions.filter(session => isRegularSession(session) && calendarIssue(session) !== null),
    withoutRegular: clubs.filter(club => selectedIds.includes(club.id) && !sessionsForClub(club.id).some(isRegularSession) && (sessionsForClub(club.id).length > 0 || club.status === 'inactive' || /Без фиксированного расписания|По анонсам/i.test(club.schedule))),
    unstructured: clubs.filter(club => selectedIds.includes(club.id) && !sessionsForClub(club.id).length && club.status !== 'inactive' && !/Без фиксированного расписания|По анонсам/i.test(club.schedule)),
  }
}
export type MapSessionRequest = { sessionId?: string; roomId?: string; date?: string; token: number }
// Stable colours identify clubs; they do not encode map activity or invent durations.
export function clubColor(clubId: string) {
  const index = Math.max(0, clubs.findIndex(club => club.id === clubId))
  return `hsl(${((index * 137.508) % 360).toFixed(3)} 65% 38%)`
}

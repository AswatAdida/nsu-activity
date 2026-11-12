import type { ActivitySession } from './campusTypes'

const days = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

export function formatSessionTime(session: Pick<ActivitySession, 'dayOfWeek' | 'startTime' | 'endTime'>) {
  const day = session.dayOfWeek ? days[session.dayOfWeek] : 'День уточняется'
  if (!session.startTime) return `${day} · время начала не указано`
  return `${day} · ${session.startTime}${session.endTime ? `–${session.endTime}` : ''}`
}

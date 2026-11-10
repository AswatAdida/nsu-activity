
import { buildings } from './buildings.ts'
import { campusRooms } from './campusRooms.ts'
import { activitySessions } from './activitySessions.ts'
import clubs from './clubs.json' with { type: 'json' }

export function validateCampusData(): string[] {
  const errors: string[] = []

  const buildingIds = new Set(buildings.map(b => b.id))
  const roomIds = new Set(campusRooms.map(r => r.id))
  const clubIds = new Set(clubs.map(club => club.id))
  const clubNames = new Set(clubs.map(club => club.name))

  for (const [label, ids] of [
    ['Здания', buildings.map(b => b.id)],
    ['Помещения', campusRooms.map(r => r.id)],
    ['Встречи', activitySessions.map(s => s.id)],
    ['Клубы', clubs.map(c => c.id)],
  ] as const) {
    if (new Set(ids).size !== ids.length) errors.push(`${label}: повторяющиеся идентификаторы`)
  }

  for (const room of campusRooms) {
    if (!buildingIds.has(room.buildingId)) {
      errors.push(
        `Помещение ${room.id}: неизвестное здание ${room.buildingId}`
      )
    }
  }

  for (const session of activitySessions) {
    if (session.roomId && !roomIds.has(session.roomId)) {
      errors.push(
        `Мероприятие ${session.id}: неизвестное помещение ${session.roomId}`
      )
    }
    for (const roomId of session.alternativeRoomIds ?? []) {
      if (!roomIds.has(roomId)) errors.push(`Мероприятие ${session.id}: неизвестное альтернативное помещение ${roomId}`)
    }
    if (session.buildingId && !buildingIds.has(session.buildingId)) {
      errors.push(`Мероприятие ${session.id}: неизвестное здание ${session.buildingId}`)
    }
    if (session.clubId ? !clubIds.has(session.clubId) : !clubNames.has(session.clubName)) {
      errors.push(`Мероприятие ${session.id}: неизвестное объединение`)
    }
    if (session.clubId && clubs.find(club => club.id === session.clubId)?.name !== session.clubName) {
      errors.push(`Мероприятие ${session.id}: название не соответствует идентификатору объединения`)
    }
    if (session.dayOfWeek !== null && (!Number.isInteger(session.dayOfWeek) || session.dayOfWeek < 1 || session.dayOfWeek > 7)) {
      errors.push(`Мероприятие ${session.id}: неверный день недели`)
    }
    for (const time of [session.startTime, session.endTime]) {
      if (time !== null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) errors.push(`Мероприятие ${session.id}: неверное время ${time}`)
    }
  }

  for (const club of clubs) {
    for (const roomId of 'baseRoomIds' in club ? club.baseRoomIds ?? [] : []) {
      if (!roomIds.has(roomId)) errors.push(`Клуб ${club.id}: неизвестное базовое помещение ${roomId}`)
    }
  }

  return errors
}

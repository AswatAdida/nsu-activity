
import { buildings } from './buildings'
import { campusRooms } from './campusRooms'
import { activitySessions } from './activitySessions'

export function validateCampusData(): string[] {
  const errors: string[] = []

  const buildingIds = new Set(buildings.map(b => b.id))
  const roomIds = new Set(campusRooms.map(r => r.id))

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
  }

  return errors
}

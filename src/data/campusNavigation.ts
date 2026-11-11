import { buildings } from './buildings.ts'
import { campusSites } from './campusSites.ts'
import { campusRooms } from './campusRooms.ts'
import { activitySessions } from './activitySessions.ts'
import { sessionsForBuildings } from './activityState.ts'

export function buildingContext(buildingId: string) {
  const building = buildings.find(building => building.id === buildingId)
  if (!building) return null
  const site = campusSites.find(site => site.id === building.mapSiteId)
  // Sports aliases describe one interior. Dormitory/annex records remain separate.
  const memberIds = site?.sharedInterior ? site.buildingIds : [buildingId]
  const rooms = campusRooms.filter(room => memberIds.includes(room.buildingId))
  const sessions = sessionsForBuildings(activitySessions, campusRooms, memberIds)
  const clubs = [...new Map(sessions.map(session => [session.clubId ?? session.clubName, session.clubName])).values()]
  return { building, site, memberIds, rooms, sessions, clubs }
}

export function roomNavigation(roomId: string) {
  const room = campusRooms.find(room => room.id === roomId)
  if (!room) return null
  return { buildingId: room.buildingId, floor: room.floor, roomId: room.id }
}

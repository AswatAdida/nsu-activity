import { buildings } from './buildings.ts'
import { campusSites } from './campusSites.ts'
import { campusRooms } from './campusRooms.ts'
import { activitySessions } from './activityModel.ts'
import { sessionsForBuildings } from './activityState.ts'
import type { ActivitySession } from './campusTypes.ts'

// View model only: original building/room IDs and all geographic rings stay unchanged.
export const activityPlaces = campusSites.map(site => {
  const representative = buildings.find(building => building.id === site.buildingIds[0])!
  const name = site.id === 'dorm-5' ? 'Общежитие № 5' : site.id === 'dorm-6' ? 'Общежитие № 6'
    : site.id === 'sports-old' ? 'Старый спорткомплекс НГУ и тир' : representative.name
  return { ...representative, geographyNote: site.id.startsWith('sports-') ? undefined : representative.geographyNote, id: site.id, name, memberIds: site.buildingIds, group: representative.type === 'sports' ? 'sports' : 'campus' }
})
export function placeForBuilding(buildingId: string) {
  return activityPlaces.find(place => place.memberIds.includes(buildingId) || place.id === buildingId)
}
export function buildingContext(buildingId: string) {
  const building = placeForBuilding(buildingId)
  if (!building) return null
  const site = campusSites.find(site => site.id === building.id)!
  const memberIds = site.buildingIds
  const rooms = campusRooms.filter(room => memberIds.includes(room.buildingId))
  const sessions = sessionsForBuildings(activitySessions, campusRooms, memberIds)
  const clubs = [...new Map(sessions.map(session => [session.clubId ?? session.clubName, session.clubName])).values()]
  return { building, site, memberIds, rooms, sessions, clubs }
}
export function roomNavigation(roomId: string) {
  const room = campusRooms.find(room => room.id === roomId)
  if (!room) return null
  return { buildingId: placeForBuilding(room.buildingId)?.id ?? room.buildingId, floor: room.floor, roomId: room.id }
}
export function sessionMapTarget(session: ActivitySession) {
  if (session.roomId && session.locationStatus === 'confirmed' && !session.alternativeRoomIds?.length) {
    const target = roomNavigation(session.roomId)
    if (target) return target
  }
  const candidates = [session.roomId, ...(session.alternativeRoomIds ?? [])].filter((id): id is string => id !== null)
  const candidatePlaces = candidates.map(id => {
    const room = campusRooms.find(room => room.id === id)
    return room ? placeForBuilding(room.buildingId)?.id ?? room.buildingId : null
  })
  const places = candidatePlaces.every(Boolean) ? [...new Set(candidatePlaces)] : []
  const buildingId = session.buildingId ? placeForBuilding(session.buildingId)?.id ?? session.buildingId : places.length === 1 ? places[0]! : null
  return buildingId ? { buildingId, floor: null, roomId: null } : null
}
export function sessionLocationLabel(session: ActivitySession): string {
  const ids = [session.roomId, ...(session.alternativeRoomIds ?? [])].filter((id): id is string => id !== null)
  const rooms = ids.map(id => campusRooms.find(room => room.id === id)).filter(room => room !== undefined)
  const roomPlaces = rooms.map(room => placeForBuilding(room.buildingId))
  const sharedPlace = rooms.length === ids.length && new Set(roomPlaces.map(place => place?.id)).size === 1 ? roomPlaces[0] : undefined
  const place = session.buildingId ? placeForBuilding(session.buildingId) : sharedPlace
  const roomLabel = rooms.length > 1 ? `Возможные помещения: ${rooms.map(room => `${room.name}${!sharedPlace ? ` (${placeForBuilding(room.buildingId)?.name ?? room.buildingId})` : ''}`).join(', ')}` : rooms[0]?.name
  return [place?.name, roomLabel ?? session.locationNote ?? 'Помещение не указано', session.locationKind === 'outdoor' && !session.locationNote?.toLocaleLowerCase('ru').includes('на улице') ? 'На улице' : null].filter(Boolean).join(' · ')
}

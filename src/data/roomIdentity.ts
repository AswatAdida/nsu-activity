import type { CampusRoom } from './campusTypes'
import type { RoomPolygon } from './roomPolygons'

type PolygonIdentity = Pick<RoomPolygon, 'id' | 'buildingId' | 'floor' | 'number' | 'roomId'>
export const polygonNumber = (polygon: PolygonIdentity) => polygon.number ?? polygon.id

export function resolvePolygonRoom(polygon: PolygonIdentity, rooms: CampusRoom[]): CampusRoom | undefined {
  const matches = rooms.filter(room => room.buildingId === polygon.buildingId &&
    room.floor === polygon.floor && room.number === polygonNumber(polygon))
  if (polygon.roomId) return matches.find(room => room.id === polygon.roomId)
  // Never choose the first occurrence of an ambiguous printed number.
  return matches.length === 1 ? matches[0] : undefined
}

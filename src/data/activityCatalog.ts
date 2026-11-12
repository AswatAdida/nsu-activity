import rawClubs from './clubs.json' with { type: 'json' }
import type { Club } from '../types/club.ts'
import type { ActivitySession } from './campusTypes.ts'
import { activitySessions } from './activityModel.ts'
import { isRegularSession } from './sessionSchedule.ts'
export const clubs = rawClubs as Club[]
export function sessionClub(session: ActivitySession): Club | undefined {
  return clubs.find(club => session.clubId ? club.id === session.clubId : club.name === session.clubName)
}
export function sessionsForClub(clubId: string) {
  return activitySessions.filter(session => sessionClub(session)?.id === clubId)
}
// A base is evidence of a club's location, not of a weekly or currently active meeting.
export const baseRoomIds = new Set(clubs.flatMap(club => {
  const sessions = sessionsForClub(club.id)
  const bases = sessions.filter(session => !isRegularSession(session)).flatMap(session => [session.roomId, ...(session.alternativeRoomIds ?? [])].filter((id): id is string => id !== null))
  return [...(sessions.some(isRegularSession) ? [] : club.baseRoomIds ?? []), ...bases]
}))

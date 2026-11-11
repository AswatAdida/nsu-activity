import { Clock3, Users } from 'lucide-react'
import type { ActivitySession } from '../data/campusTypes'
import { campusRooms } from '../data/campusRooms'
import { formatSessionTime } from '../data/sessionDisplay'
import { activityPolicy, effectiveSessionTimes } from '../data/activityState'

export function ActivitySessionDetails({ session }: { session: ActivitySession }) {
  const roomIds = session.alternativeRoomIds?.length
    ? [session.roomId, ...session.alternativeRoomIds] : []
  const effective = effectiveSessionTimes(session)
  return <div className="border-t border-blue-300/30 pt-3">
    <p className="font-medium">{session.clubName}</p>
    {session.locationKind === 'outdoor' && <p className="mt-1 text-xs text-amber-200">На улице у здания</p>}
    <p className="mt-2 flex items-start gap-2 text-sm text-blue-100"><Clock3 className="shrink-0" size={16} />{formatSessionTime({ ...session, endTime: effective.endTime })}</p>
    <p className="mt-1 text-xs text-blue-200">Периодичность: {session.recurrence === 'weekly' ? 'Еженедельно' : session.recurrence}</p>
    {effective.assumedDuration && <p className="mt-1 text-xs text-blue-100">Длительность принята равной 1 часу; в источнике окончание не указано.</p>}
    {session.validityNeedsClarification && <p className="mt-1 text-xs text-amber-200">Период действия расписания требует уточнения; точная дата не определяется.</p>}
    {session.locationNote && <p className="mt-2 text-sm text-blue-100">{session.locationNote}</p>}
    {roomIds.length > 0 && <p className="mt-2 text-sm text-blue-100">Возможные аудитории: {roomIds.map(id => campusRooms.find(r => r.id === id)?.number ?? id).join(', ')}. Место уточняется в анонсе.</p>}
    {session.attendanceMin !== null ? <p className="mt-2 flex items-center gap-2 text-sm text-blue-100"><Users size={16} />{session.attendanceMin}{session.attendanceMax !== null && session.attendanceMax !== session.attendanceMin ? `–${session.attendanceMax}` : ''} участников</p> : <p className="mt-2 text-xs text-blue-200">Посещаемость не указана</p>}
    <p className="mt-2 text-xs text-blue-200">{activityPolicy.confirmSchedules || session.scheduleStatus === 'confirmed' ? 'Расписание принято как подтверждённое' : 'Расписание требует уточнения'}</p>
    {session.notes?.map(note => <p key={note} className="mt-2 text-xs text-blue-100">{note}</p>)}
    {session.source && <p className="mt-2 text-xs text-blue-200">Источник: сообщение пользователя от {session.source.recordedOn}.{session.source.url && <> <a href={session.source.url} target="_blank" rel="noopener noreferrer" className="underline">Сообщество</a></>}</p>}
  </div>
}

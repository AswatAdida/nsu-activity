import type { ActivitySession } from '../data/campusTypes'
import { sessionClub } from '../data/activityCatalog'
import { campusRooms } from '../data/campusRooms'
import { sessionMapTarget, sessionLocationLabel } from '../data/campusNavigation'
import { dateLabel, dayOfWeek } from '../data/campusTime'
import { ClubVisual } from './ClubVisual'
import { ActivitySessionDetails } from './ActivitySessionDetails'

type Props = { session: ActivitySession; date?: string; onMap?: () => void; onRoom?: (id: string) => void }
export default function SessionInfo({ session, date, onMap, onRoom }: Props) {
  const club = sessionClub(session)
  const candidates = [session.roomId, ...(session.alternativeRoomIds ?? [])].filter((id): id is string => id !== null)
  return <article className="space-y-3 rounded-2xl border border-blue-200 bg-white p-4" aria-label="Информация о занятии" data-session-details={session.id}>
    <div className="flex items-center gap-4">{club && <ClubVisual club={club} image={club.logo} compact />}<div><p className="eyebrow">ЗАНЯТИЕ ОБЪЕДИНЕНИЯ</p><h3 className="mt-1 text-lg font-bold">{session.clubName}</h3></div></div>
    {club && <p className="text-sm text-slate-600">{club.description}</p>}
    {date && <p className="text-sm font-semibold">{dateLabel(date)} · Новосибирск</p>}
    <p className="text-sm">{sessionLocationLabel(session)}</p>
    {!sessionMapTarget(session) && <p className="text-xs text-slate-500">Точное место на карте не определено. Доступно описание места из источника.</p>}
    <div className="rounded-xl bg-[#173e6a] p-4 text-white"><ActivitySessionDetails session={date && session.dayOfWeek === null ? { ...session, dayOfWeek: dayOfWeek(date) } : session} /></div>
    {session.alternativeRoomIds?.length ? <div><p className="text-sm font-semibold">Одна встреча с альтернативными аудиториями</p>{onRoom && <div className="mt-2 flex flex-wrap gap-2">{candidates.map(id => <button key={id} type="button" onClick={() => onRoom(id)} className="rounded-lg border border-blue-200 px-3 py-2 text-sm text-blue-800">{campusRooms.find(room => room.id === id)?.name ?? id}</button>)}</div>}</div> : null}
    {club?.url && <a href={club.url} target="_blank" rel="noreferrer" className="block text-sm font-semibold text-blue-800 underline">Сообщество объединения</a>}
    {onMap && <button type="button" onClick={onMap} className="rounded-xl bg-[#173e6a] px-4 py-3 text-sm font-semibold text-white">Открыть место на карте</button>}
  </article>
}

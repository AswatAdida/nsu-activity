import { clubMapContext } from '../data/campusNavigation'
import { campusRooms } from '../data/campusRooms'
import { formatSessionTime } from '../data/sessionDisplay'
import { ClubVisual } from './ClubVisual'

type Props = { clubId: string; onPlace: (id: string) => void; onSession: (id: string) => void; onRoom: (id: string) => void }
export default function ClubMapPanel({ clubId, onPlace, onSession, onRoom }: Props) {
  const context = clubMapContext(clubId)
  if (!context) return null
  const { club, sessions, bases, places, unplaced } = context
  return <article className="mb-5 rounded-2xl border border-slate-200 bg-white p-5" aria-label="Места объединения" data-map-club={clubId}>
    <div className="flex items-center gap-4"><ClubVisual club={club} image={club.logo ?? club.cover} compact /><div><p className="eyebrow">ОБЪЕДИНЕНИЕ НА КАРТЕ</p><h3 className="mt-1 text-xl font-bold">{club.name}</h3><p className="mt-1 text-sm text-slate-500">{club.category}</p></div></div>
    <p className="mt-4 text-sm text-slate-600">{club.location}</p>
    <div className="mt-4 flex flex-wrap gap-2">{places.map(place => <button key={place.id} type="button" onClick={() => onPlace(place.id)} className="action-secondary">{place.name} · {place.address}</button>)}</div>
    {(!places.length || unplaced > 0) && <p className="mt-3 text-xs text-slate-500">{!places.length ? 'Место пока не привязано к карте. Выше сохранено описание из источника.' : 'Для части занятий точное место не определено; можно открыть сведения о конкретной встрече.'}</p>}
    {!!sessions.length && <details className="mt-4 text-sm"><summary className="font-semibold text-blue-900">Занятия и места ({sessions.length})</summary><div className="mt-3 grid gap-2 sm:grid-cols-2">{sessions.map(session => <button key={session.id} type="button" onClick={() => onSession(session.id)} className="rounded-xl border border-slate-200 p-3 text-left text-sm hover:bg-blue-50">{formatSessionTime(session)}</button>)}</div></details>}
    {bases.map(base => <button key={base.roomId} type="button" onClick={() => onRoom(base.roomId)} className="mt-3 block text-sm text-blue-800 underline">База: {campusRooms.find(room => room.id === base.roomId)?.name ?? base.roomId}</button>)}
  </article>
}

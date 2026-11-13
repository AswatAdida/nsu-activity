import { buildingContext } from '../data/campusNavigation'
import { campusRooms } from '../data/campusRooms'
import { activityColors, activityLabels, campusDateTime, evaluateBuildingActivity, nextSessionStart } from '../data/activityState'
import { isRegularSession } from '../data/sessionSchedule'
import { baseRoomIds } from '../data/activityCatalog'
import { geographyEvidence } from '../data/geographyEvidence'
import { ActivitySessionDetails } from './ActivitySessionDetails'
import type { ActivityState } from '../data/activityState'

type Props = {
  buildingId: string
  instant: Date | null
  activityByRoom: ReadonlyMap<string, ActivityState>
  onExplore: () => void
  onRoomSelect: (id: string) => void
  onBack: () => void
}
export default function BuildingCard({ buildingId, instant, activityByRoom, onExplore, onRoomSelect, onBack }: Props) {
  const context = buildingContext(buildingId)
  if (!context) return null
  const { building, site, memberIds, rooms, sessions, clubs } = context
  const activity = evaluateBuildingActivity(sessions, campusRooms, memberIds, instant ?? new Date(NaN), rooms.some(room => baseRoomIds.has(room.id)))
  const upcoming = instant ? sessions.flatMap(session => {
    const start = nextSessionStart(session, instant)
    return start ? [{ session, start }] : []
  }).sort((a, b) => +a.start - +b.start) : []
  const indoors = sessions.filter(session => session.locationKind !== 'outdoor')
  const outdoors = sessions.filter(session => session.locationKind === 'outdoor')
  return <article className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5" aria-label="Карточка здания" data-building-card={buildingId}>
    <button type="button" onClick={onBack} className="text-sm font-semibold text-blue-800 underline">← К общей карте кампуса</button>
    <div>
      <h3 className="text-xl font-bold">{building.name}</h3>
      <p className="mt-1 text-sm text-slate-600">{building.address ?? 'Адрес уточняется'}</p>
      <p className="mt-3 flex items-center gap-2 text-sm font-medium"><span className="h-3 w-3 shrink-0 rounded-full" style={{ background: activityColors[activity.status] }} />{activityLabels[activity.status]}</p>
      {building.geographyNote && <p className="mt-2 text-xs text-amber-800">{building.geographyNote}</p>}
    </div>
    <dl className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
      <div><dt className="text-slate-600">Объединений со встречами</dt><dd className="mt-1 text-lg font-bold">{clubs.length}</dd></div>
      <div><dt className="text-slate-600">Регулярных встреч</dt><dd className="mt-1 text-lg font-bold">{sessions.filter(isRegularSession).length}</dd></div>
    </dl>
    {clubs.length > 0 && <div><h4 className="font-semibold">Объединения</h4><ul className="mt-2 list-inside list-disc space-y-1 text-sm">{clubs.map(name => <li key={name}>{name}</li>)}</ul></div>}

    <div>
      <h4 className="font-semibold">Доступные этажи</h4>
      <p className="mt-1 text-sm text-slate-600">{building.floors.length ? `${building.floors.join(', ')} · планы учебного корпуса № 1` : 'Поэтажных планов пока нет; доступны известные помещения и встречи.'}</p>
      <button type="button" onClick={onExplore} className="mt-3 w-full rounded-xl bg-[#173e6a] px-4 py-3 text-sm font-semibold text-white">{building.floors.length ? 'Открыть этажи и помещения' : 'Открыть помещения и мероприятия'}</button>
    </div>
    <div>
      <h4 className="font-semibold">Ближайшие известные начала встреч</h4>
      <p className="mt-1 text-xs text-slate-500">Относительно выбранного времени · Новосибирск. Уточняйте место в расписании ниже.</p>
      {upcoming.length ? <ul className="mt-2 space-y-2 text-sm">{upcoming.slice(0, 5).map(({ session, start }) => <li key={session.id} className="rounded-lg bg-slate-50 p-2"><span className="font-semibold">{campusDateTime(start).replace('T', ' ')}</span> · {session.clubName}{session.locationKind === 'outdoor' && ' · На улице'}{(session.locationStatus !== 'confirmed' || session.alternativeRoomIds?.length) ? ' · Место уточняется' : ''}</li>)}</ul> : <p className="mt-2 text-sm text-slate-600">{instant ? 'Нет встреч с вычислимой ближайшей датой.' : 'Выберите корректные дату и время.'}</p>}
    </div>
    <div>
      <h4 className="font-semibold">Известные помещения ({rooms.length})</h4>
      {rooms.length ? <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto">{rooms.map(room => <li key={room.id}><button type="button" onClick={() => onRoomSelect(room.id)} className="flex w-full items-start gap-2 rounded-lg border border-slate-200 p-2 text-left text-sm hover:bg-blue-50"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: activityColors[activityByRoom.get(room.id)!.status] }} /><span>{room.name}<span className="block text-xs text-slate-500">{room.floor === null ? 'Этаж не указан' : `${room.floor} этаж`} · {activityLabels[activityByRoom.get(room.id)!.status]}</span></span></button></li>)}</ul> : <p className="mt-2 text-sm text-slate-600">Сведений о помещениях пока нет.</p>}
    </div>
    {sessions.length === 0 && <p className="text-sm text-slate-600">В базе нет сведений о мероприятиях. Это не означает, что мероприятий здесь нет.</p>}
    {indoors.length > 0 && <div className="rounded-xl bg-[#173e6a] p-4 text-white"><h4 className="font-semibold">Встречи и расписания</h4><div className="mt-2 max-h-96 space-y-3 overflow-y-auto">{indoors.map(session => <div key={session.id}><p className="text-xs text-blue-100">{session.roomId ? campusRooms.find(room => room.id === session.roomId)?.name : 'Точное помещение не указано · мероприятие на уровне здания'}</p><ActivitySessionDetails session={session} /></div>)}</div></div>}
    {outdoors.length > 0 && <div className="rounded-xl bg-[#173e6a] p-4 text-white"><h4 className="font-semibold">На улице у здания</h4><p className="mt-1 text-xs text-blue-100">Эти встречи не проходят внутри спорткомплекса.</p><div className="mt-2 space-y-3">{outdoors.map(session => <ActivitySessionDetails key={session.id} session={session} />)}</div></div>}
    {site && <details className="text-xs text-slate-600"><summary className="cursor-pointer font-semibold">Источники положения на карте</summary><ul className="mt-2 space-y-2"><li><a className="underline" href={site.source.url} target="_blank" rel="noreferrer">OpenStreetMap · версия {site.source.version} · проверено {site.source.checkedOn}</a></li>{geographyEvidence[site.id]?.map(source => <li key={source.url}><a className="underline" href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><p className="mt-2">Контур здания не задаёт точного положения аудитории или входа.</p></details>}
  </article>
}

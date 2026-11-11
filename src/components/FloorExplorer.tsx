import FloorPolygonEditor from './FloorPolygonEditor'
import { useMemo, useState } from 'react'
import { Search, DoorOpen } from 'lucide-react'
import rawClubs from '../data/clubs.json'
import type { Club } from '../types/club'
import { buildingNames } from '../data/buildingLabels'
import { ActivitySessionDetails } from './ActivitySessionDetails'
import { buildings } from '../data/buildings'
import { campusRooms } from '../data/campusRooms'
import { activitySessions } from '../data/activitySessions'
import FloorPlanViewer from './FloorPlanViewer'
import { activityColors, activityLabels } from '../data/activityState'
import type { ActivityState } from '../data/activityState'
import { buildingContext } from '../data/campusNavigation'

type Props = {
  selectedBuildingId: string
  selectedRoomId: string | null
  activityByRoom: ReadonlyMap<string, ActivityState>
  onRoomSelect: (id: string | null) => void
  onBuildingChange: (buildingId: string) => void
}

const clubs = rawClubs as Club[]

export default function FloorExplorer({
  selectedBuildingId,
  selectedRoomId,
  activityByRoom,
  onRoomSelect,
  onBuildingChange,
}: Props) {
  const initialRoom = campusRooms.find(room => room.id === selectedRoomId)
  const [floor, setFloor] = useState<number | null>(initialRoom?.floor ?? (selectedBuildingId === 'academic-1' ? 3 : null))
  const [query, setQuery] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)

  const context = buildingContext(selectedBuildingId)
  const building = context?.building
  const buildingRooms = context?.rooms ?? []

  const floors = building?.floors ?? []

  const visibleRooms = buildingRooms.filter(
    room => floors.length === 0 || floor === null || room.floor === floor
  )

  const searchResults = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('ru')
    if (!q) return []

    return campusRooms.filter(room =>
      [room.number, room.name]
        .filter(Boolean)
        .some(value => value!.toLocaleLowerCase('ru').includes(q))
    )
  }, [query])

  const selected = campusRooms.find(
    room => room.id === selectedRoomId && context?.memberIds.includes(room.buildingId)
  )

  const sessions = selected ? activitySessions.filter(
    session => session.roomId === selected.id || session.alternativeRoomIds?.includes(selected.id)
  ) : []
  const baseClubs = selected ? clubs.filter(club => club.baseRoomIds?.includes(selected.id)) : []
  const buildingSessions = context?.sessions.filter(session => session.roomId === null) ?? []

  function chooseRoom(roomId: string) {
    const room = campusRooms.find(r => r.id === roomId)
    if (!room) return

    setFloor(room.floor)
    onRoomSelect(room.id)
    setQuery('')
  }

  return (
    <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 sm:p-8">
      <h2 className="text-2xl font-bold">
        Поэтажная навигация
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Найди аудиторию, выбери этаж и посмотри
        студенческие мероприятия.
      </p>

      <div className="relative mt-6">
        <Search
          size={20}
          className="absolute left-4 top-3.5 text-slate-400"
        />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Номер аудитории или название зала..."
          aria-label="Поиск аудитории"
          className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 outline-none focus:border-blue-600"
        />

        {query.trim() && (
          <div className="absolute z-[1000] mt-2 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">
            {searchResults.length ? (
              searchResults.map(room => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => chooseRoom(room.id)}
                  className="block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-blue-50"
                >
                  <span className="font-medium">
                    {room.name}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    {buildingNames[room.buildingId]}
                    {room.floor !== null
                      ? ` · ${room.floor} этаж`
                      : ''}
                  </span>
                </button>
              ))
            ) : (
              <p className="p-4 text-sm text-slate-500">
                Помещение пока отсутствует в базе.
              </p>
            )}
          </div>
        )}
      </div>

      <label
        htmlFor="building-select"
        className="mb-2 mt-6 block text-sm font-semibold"
      >
        Здание
      </label>

      <select
        id="building-select"
        value={building?.id ?? ''}
        onChange={e => {
          onBuildingChange(e.target.value)
          setFloor(e.target.value === 'academic-1' ? 3 : null)
          onRoomSelect(null)
        }}
        className="w-full rounded-xl border border-slate-200 bg-white p-3"
      >
        {buildings.map(b => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setFloor(null)
            onRoomSelect(null)
          }}
          className={`rounded-lg px-4 py-2 text-sm ${
            floor === null
              ? 'bg-[#16468c] text-white'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {floors.length ? 'Все этажи' : 'Известные помещения'}
        </button>

        {floors.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => {
              setFloor(f)
              onRoomSelect(null)
            }}
            className={`rounded-lg px-4 py-2 text-sm ${
              floor === f
                ? 'bg-[#16468c] text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {f} этаж
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(270px,1fr)]">
        <div className="min-w-0">
          {building?.id === 'academic-1' && floor !== null ? (
            <FloorPlanViewer
              key={floor}
              floor={floor}
              activityByRoom={activityByRoom}
              selectedRoomId={selected?.id ?? null}
              onRoomSelect={onRoomSelect}
            />
          ) : (
            <div className="flex min-h-24 items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              {floor === null && floors.length > 0
                ? 'Выбери этаж для просмотра плана'
                : 'План этого здания пока не загружен'}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">
            Помещения ({visibleRooms.length})
          </h3>

          {visibleRooms.length === 0 && (
            <p className="text-sm text-slate-500">
              Для этого этажа пока нет записей в базе помещений.
            </p>
          )}

          <div className="max-h-80 space-y-3 overflow-y-auto pr-1" role="region" aria-label="Список помещений">
          {visibleRooms.map(room => (
            <button
              key={room.id}
              type="button"
              onClick={() => chooseRoom(room.id)}
              className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left ${
                selectedRoomId === room.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <DoorOpen size={20} className="shrink-0" style={{ color: activityColors[activityByRoom.get(room.id)!.status] }} />
              <div>
                <p className="font-medium">{room.name}</p>
                <p className="text-xs text-slate-600">{activityLabels[activityByRoom.get(room.id)!.status]}{activityByRoom.get(room.id)!.uncertain && ' · ? Требует уточнения'}</p>
                <p className="text-xs text-slate-500">
                  {room.block
                    ? room.block === 'Ректорат' ? 'Ректорат' : `${room.block} блок`
                    : 'Блок не указан'}
                </p>
              </div>
            </button>
          ))}
          </div>

          {buildingSessions.length > 0 && <div className="rounded-xl bg-[#163e79] p-5 text-white">
            <h3 className="font-bold">Встречи без указанной аудитории / на улице</h3>
            <div className="mt-3 space-y-4">{buildingSessions.map(session => <ActivitySessionDetails key={session.id} session={session} />)}</div>
          </div>}

          {selected && (
            <div className="rounded-xl bg-[#163e79] p-5 text-white">
              <h3 className="text-lg font-bold">
                {selected.name}
              </h3>

              <p className="mt-2 text-sm">{activityLabels[activityByRoom.get(selected.id)!.status]}</p>
              {activityByRoom.get(selected.id)!.reasons.map(reason => <p key={reason} className="mt-1 text-xs text-amber-200">? {reason}</p>)}
              {sessions.length ? (
                <div className="mt-4 space-y-4">
                  {sessions.map(session => <ActivitySessionDetails key={session.id} session={session} />)}
                </div>
              ) : (
                <p className="mt-3 text-sm text-blue-100">
                  Сведений о регулярных мероприятиях в нашей базе пока нет.
                </p>
              )}

              {baseClubs.length > 0 && <div className="mt-4 text-sm text-blue-100">
                <p className="font-semibold">База объединений</p>
                {baseClubs.map(club => <p key={club.id} className="mt-2">{club.name}. {club.schedule}</p>)}
                <p className="mt-2 text-xs">Место базирования не означает регулярные встречи в этой аудитории.</p>
              </div>}
              <p className="mt-4 text-xs text-blue-200">Наличие записи о помещении не означает, что его контур уже оцифрован.</p>
            </div>
          )}
        </div>
      </div>
      {building?.id === 'academic-1' && floor !== null && (
  <div className="mt-6">
    <button
      type="button"
      onClick={() => setEditorOpen(open => !open)}
      className="rounded-xl border border-blue-300 px-5 py-3 text-sm font-semibold text-[#16468c] hover:bg-blue-50"
    >
      {editorOpen ? 'Закрыть редактор' : 'Редактировать контуры помещений'}
    </button>

    {editorOpen && (
      <FloorPolygonEditor key={floor} floor={floor} />
    )}
  </div>
)}
    </section>
  )
}

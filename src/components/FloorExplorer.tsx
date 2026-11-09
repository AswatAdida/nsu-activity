
import { useMemo, useState } from 'react'
import { Search, DoorOpen, Clock3, Users } from 'lucide-react'
import { buildings } from '../data/buildings'
import { campusRooms } from '../data/campusRooms'
import { activitySessions } from '../data/activitySessions'
import FloorPlanViewer from './FloorPlanViewer'

type Props = {
  selectedBuilding: string
  onBuildingChange: (building: string) => void
}

const days = [
  '',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
]

const buildingNames: Record<string, string> = {
  'academic-1': 'Новый корпус НГУ',
  'dorm-6-annex': 'Пристройка общежития № 6',
  'dorm-5': 'Общежитие № 5',
  'sports-12-1': 'Спортивные помещения, Пирогова 12/1',
  stc: 'СТЦ НГУ',
}

export default function FloorExplorer({
  selectedBuilding,
  onBuildingChange,
}: Props) {
  const [floor, setFloor] = useState<number | null>(3)
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const building = buildings.find(
    b => buildingNames[b.id] === selectedBuilding
  )

  const buildingRooms = campusRooms.filter(
    room => room.buildingId === building?.id
  )

  const floors = building?.floors ?? []

  const visibleRooms = buildingRooms.filter(
    room => floor === null || room.floor === floor
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
    room => room.id === selectedRoom
  )

  const sessions = activitySessions.filter(
    session => session.roomId === selectedRoom
  )

  function chooseRoom(roomId: string) {
    const room = campusRooms.find(r => r.id === roomId)
    if (!room) return

    const name = buildingNames[room.buildingId]
    if (name) onBuildingChange(name)

    setFloor(room.floor)
    setSelectedRoom(room.id)
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
          onBuildingChange(buildingNames[e.target.value])
          setFloor(e.target.value === 'academic-1' ? 3 : null)
          setSelectedRoom(null)
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
            setSelectedRoom(null)
          }}
          className={`rounded-lg px-4 py-2 text-sm ${
            floor === null
              ? 'bg-[#16468c] text-white'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          Все этажи
        </button>

        {floors.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => {
              setFloor(f)
              setSelectedRoom(null)
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
        <div>
          {building?.id === 'academic-1' && floor !== null ? (
            <FloorPlanViewer
              key={floor}
              floor={floor}
              selectedRoom={selected?.number ?? null}
              onRoomSelect={number => {
                const room = campusRooms.find(
                  r =>
                    r.buildingId === 'academic-1' &&
                    r.number === number
                )
                if (room) setSelectedRoom(room.id)
              }}
            />
          ) : (
            <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              {floor === null
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

          {visibleRooms.map(room => (
            <button
              key={room.id}
              type="button"
              onClick={() => chooseRoom(room.id)}
              className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left ${
                selectedRoom === room.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <DoorOpen size={20} className="text-[#16468c]" />
              <div>
                <p className="font-medium">{room.name}</p>
                <p className="text-xs text-slate-500">
                  {room.block
                    ? `${room.block} блок`
                    : 'Блок не указан'}
                </p>
              </div>
            </button>
          ))}

          {selected && (
            <div className="rounded-xl bg-[#163e79] p-5 text-white">
              <h3 className="text-lg font-bold">
                {selected.name}
              </h3>

              {sessions.length ? (
                <div className="mt-4 space-y-4">
                  {sessions.map(session => (
                    <div
                      key={session.id}
                      className="border-t border-blue-300/30 pt-3"
                    >
                      <p className="font-medium">
                        {session.clubName}
                      </p>

                      <p className="mt-2 flex items-center gap-2 text-sm text-blue-100">
                        <Clock3 size={16} />
                        {session.dayOfWeek
                          ? days[session.dayOfWeek]
                          : 'День уточняется'}
                        {session.startTime
                          ? ` · ${session.startTime}–${session.endTime ?? '?'}`
                          : ''}
                      </p>

                      <p className="mt-1 text-xs text-blue-200">
                        Периодичность: {session.recurrence}
                      </p>

                      {session.attendanceMin !== null && (
                        <p className="mt-2 flex items-center gap-2 text-sm text-blue-100">
                          <Users size={16} />
                          {session.attendanceMin}
                          {session.attendanceMax !== null &&
                            session.attendanceMax !== session.attendanceMin
                            ? `–${session.attendanceMax}`
                            : ''}{' '}
                          участников
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-blue-100">
                  Подтверждённых регулярных мероприятий
                  в нашей базе пока нет.
                </p>
              )}

              <p className="mt-4 text-xs text-blue-200">
                Расположение метки на плане требует проверки.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

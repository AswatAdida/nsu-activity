
import { useEffect, useState } from 'react'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

import type { RoomPolygon } from '../data/roomPolygons'
import { polygonNumber, resolvePolygonRoom } from '../data/roomIdentity'
import { campusRooms } from '../data/campusRooms'
import { activityColors, activityLabels } from '../data/activityState'
import type { ActivityState } from '../data/activityState'

const markers: Record<number, { id: string; x: number; y: number }[]> = {
  0: [{ id: '0250', x: 9.4, y: 7.5 }],
  1: [{ id: '1332', x: 91.4, y: 14.6 }],
  2: [
    { id: '2348', x: 65.0, y: 11.7 },
    { id: '2253', x: 42.0, y: 6.0 },
  ],
  3: [{ id: '3314', x: 91.3, y: 20.8 }],
  4: [],
  5: [{ id: '5272', x: 22.6, y: 10.2 }],
}

type Props = {
  floor: number
  activityByRoom: ReadonlyMap<string, ActivityState>
  selectedRoomId?: string | null
  onRoomSelect?: (id: string) => void
}

export default function FloorPlanViewer({
  floor,
  activityByRoom,
  selectedRoomId,
  onRoomSelect,
}: Props) {
  const [zoom, setZoom] = useState(1)
  const [polygons, setPolygons] = useState<RoomPolygon[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadPolygons() {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}data/room-polygons.json`
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data: RoomPolygon[] = await response.json()

        if (!cancelled) {
          setPolygons(data)
        }
      } catch (error) {
        console.error('Ошибка загрузки контуров:', error)
      }
    }

    void loadPolygons()

    return () => {
      cancelled = true
    }
  }, [])

  const floorPolygons = polygons.filter(
    polygon =>
      polygon.buildingId === 'academic-1' &&
      polygon.floor === floor
  )

  const polygonIds = new Set(
    floorPolygons.map(polygonNumber)
  )

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <p className="font-semibold text-slate-900">
            Учебный корпус № 1 · {floor} этаж
          </p>
          <p className="text-xs text-slate-500">
            Нажми на любое помещение, чтобы посмотреть сведения о встречах.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Уменьшить"
            onClick={() =>
              setZoom(z => Math.max(0.7, +(z - 0.25).toFixed(2)))
            }
            className="rounded-lg border border-slate-200 p-2"
          >
            <ZoomOut size={17} />
          </button>

          <span className="min-w-12 text-center text-xs">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            aria-label="Увеличить"
            onClick={() =>
              setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))
            }
            className="rounded-lg border border-slate-200 p-2"
          >
            <ZoomIn size={17} />
          </button>

          <button
            type="button"
            aria-label="Сбросить масштаб"
            onClick={() => setZoom(1)}
            className="rounded-lg border border-slate-200 p-2"
          >
            <RotateCcw size={17} />
          </button>
        </div>
      </div>

      <div className="max-h-[680px] overflow-auto bg-slate-50 p-3">
        <div
          className="relative mx-auto"
          style={{
            width: `${zoom * 100}%`,
            minWidth: '500px',
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}floorplans/floor-${floor}.png`}
            alt={`План ${floor} этажа`}
            className="block h-auto w-full select-none"
            draggable={false}
          />

          <svg
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            {floorPolygons.map(room => {
              const record = resolvePolygonRoom(room, campusRooms)
              const activity = record ? activityByRoom.get(record.id) : undefined
              const status = activity?.status ?? 'no-data'
              const label = `${record?.name ?? `Помещение ${polygonNumber(room)}`} · ${activityLabels[status]}${activity?.uncertain ? ' · ? Данные требуют уточнения' : ''}`
              const isSelected = Boolean(record && selectedRoomId === record.id)

              const points = room.points
                .map(([x, y]) => `${x},${y}`)
                .join(' ')

              return (
                <polygon
                  key={room.id}
                  data-polygon-id={room.id}
                  data-room-id={record?.id}
                  points={points}
                  fill={activityColors[status]}
                  data-activity={status}
                  role="button"
                  tabIndex={0}
                  aria-label={label}
                  aria-pressed={isSelected}
                  onKeyDown={event => {
                    if (record && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault()
                      onRoomSelect?.(record.id)
                    }
                  }}
                  fillOpacity={isSelected ? 0.4 : 0.2}
                  stroke={isSelected ? '#0f172a' : activity?.uncertain ? '#b45309' : activityColors[status]}
                  strokeDasharray={activity?.uncertain ? '5 4' : undefined}
                  strokeWidth={isSelected ? 5 : 2}
                  vectorEffect="non-scaling-stroke"
                  className="cursor-pointer"
                  onClick={() => { if (record) onRoomSelect?.(record.id) }}
                >
                  <title>{label}{activity?.reasons.length ? `: ${activity.reasons.join('; ')}` : ''}</title>
                </polygon>
              )
            })}
          </svg>

          {(markers[floor] ?? [])
            .filter(marker => !polygonIds.has(marker.id))
            .map(marker => (
              <button
                type="button"
                key={marker.id}
                title={`Аудитория ${marker.id}`}
                onClick={() => {
                  const record = resolvePolygonRoom({ id: marker.id, buildingId: 'academic-1', floor }, campusRooms)
                  if (record) onRoomSelect?.(record.id)
                }}
                className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white px-2 py-1 text-xs font-bold text-white shadow-lg ${
                  selectedRoomId === resolvePolygonRoom({ id: marker.id, buildingId: 'academic-1', floor }, campusRooms)?.id
                    ? 'ring-2 ring-slate-900'
                    : ''
                }`}
                style={{
                  backgroundColor: activityColors[activityByRoom.get(resolvePolygonRoom({ id: marker.id, buildingId: 'academic-1', floor }, campusRooms)?.id ?? '')?.status ?? 'no-data'],
                  left: `${marker.x}%`,
                  top: `${marker.y}%`,
                }}
              >
                {marker.id}
              </button>
            ))}
        </div>
      </div>

      <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
        Цвет показывает сведения об активности; пунктир — неопределённость. Тёмная рамка — выбранное помещение. Круглые отметки обозначают помещения без контура.
      </p>
    </div>
  )
}


import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { Download, RotateCcw, Undo2, Trash2 } from 'lucide-react'

type Point = [number, number]

type RoomPolygon = {
  id: string
  buildingId: string
  floor: number
  points: Point[]
}

type Props = {
  floor: number
}

const STORAGE_KEY = 'nsu-activity-room-polygons-v1'

function loadPolygons(): RoomPolygon[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as RoomPolygon[] : []
  } catch {
    return []
  }
}

export default function FloorPolygonEditor({ floor }: Props) {
  const [polygons, setPolygons] = useState<RoomPolygon[]>(loadPolygons)
  const [roomId, setRoomId] = useState('')
  const [points, setPoints] = useState<Point[]>([])
  const [zoom, setZoom] = useState(1)
  const [showLabels, setShowLabels] = useState(true)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(polygons))
  }, [polygons])

  const currentPolygons = polygons.filter(
    p => p.buildingId === 'academic-1' && p.floor === floor
  )

  function addPoint(event: MouseEvent<SVGSVGElement>) {
    if (!roomId.trim()) return

    const rect = event.currentTarget.getBoundingClientRect()

    const x = ((event.clientX - rect.left) / rect.width) * 1000
    const y = ((event.clientY - rect.top) / rect.height) * 1000

    setPoints(previous => [
      ...previous,
      [Math.round(x * 10) / 10, Math.round(y * 10) / 10],
    ])
  }

  function savePolygon() {
    const id = roomId.trim()

    if (!id || points.length < 3) return

    const polygon: RoomPolygon = {
      id,
      buildingId: 'academic-1',
      floor,
      points,
    }

    setPolygons(previous => [
      ...previous.filter(
        p => !(
          p.buildingId === polygon.buildingId &&
          p.floor === polygon.floor &&
          p.id === polygon.id
        )
      ),
      polygon,
    ])

    setPoints([])
    setRoomId('')
  }

  function removePolygon(id: string) {
    if (!window.confirm(`Удалить контур аудитории ${id}?`)) return

    setPolygons(previous =>
      previous.filter(
        p => !(
          p.buildingId === 'academic-1' &&
          p.floor === floor &&
          p.id === id
        )
      )
    )
  }

  function editPolygon(polygon: RoomPolygon) {
    setRoomId(polygon.id)
    setPoints(polygon.points)

    setPolygons(previous =>
      previous.filter(p => p !== polygon)
    )
  }

  function exportJSON() {
    const data = JSON.stringify(polygons, null, 2)

    const blob = new Blob([data], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'room-polygons.json'
    link.click()

    URL.revokeObjectURL(url)
  }

  function polygonPoints(points: Point[]) {
    return points.map(([x, y]) => `${x},${y}`).join(' ')
  }

  return (
    <section className="mt-6 rounded-2xl border border-blue-200 bg-white p-4">
      <h3 className="text-lg font-bold">
        Редактор контуров · {floor} этаж
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        Введи номер аудитории и последовательно нажимай
        на углы помещения на плане. Минимум три точки.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={roomId}
          onChange={e => setRoomId(e.target.value)}
          placeholder="Номер аудитории"
          className="min-w-40 flex-1 rounded-lg border border-slate-300 p-2"
        />

        <button
          type="button"
          onClick={() => setPoints(p => p.slice(0, -1))}
          disabled={!points.length}
          className="rounded-lg bg-slate-100 px-3 py-2 disabled:opacity-40"
          title="Отменить последнюю точку"
        >
          <Undo2 size={18} />
        </button>

        <button
          type="button"
          onClick={() => setPoints([])}
          className="rounded-lg bg-slate-100 px-3 py-2"
          title="Очистить текущий контур"
        >
          <RotateCcw size={18} />
        </button>

        <button
          type="button"
          disabled={!roomId.trim() || points.length < 3}
          onClick={savePolygon}
          className="rounded-lg bg-[#16468c] px-4 py-2 text-white disabled:opacity-40"
        >
          Сохранить контур
        </button>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm">
        <span>Точек: {points.length}</span>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={e => setShowLabels(e.target.checked)}
          />
          Подписи
        </label>

        <button
          type="button"
          onClick={() => setZoom(z => Math.max(1, z - 0.25))}
          className="rounded border px-2"
        >
          −
        </button>

        <span>{Math.round(zoom * 100)}%</span>

        <button
          type="button"
          onClick={() => setZoom(z => Math.min(4, z + 0.25))}
          className="rounded border px-2"
        >
          +
        </button>
      </div>

      <div className="mt-4 max-h-[700px] overflow-auto rounded-xl bg-slate-100 p-2">
        <div
          className="relative mx-auto"
          style={{
            width: `${zoom * 100}%`,
            minWidth: '500px',
            aspectRatio: '1 / 1',
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}floorplans/floor-${floor}.png`}
            alt={`План ${floor} этажа`}
            className="absolute inset-0 h-full w-full select-none"
            draggable={false}
          />

          <svg
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full cursor-crosshair"
            onClick={addPoint}
          >
            {currentPolygons.map(polygon => {
              const centerX =
                polygon.points.reduce((s, p) => s + p[0], 0) /
                polygon.points.length

              const centerY =
                polygon.points.reduce((s, p) => s + p[1], 0) /
                polygon.points.length

              return (
                <g key={polygon.id} pointerEvents="none">
                  <polygon
                    points={polygonPoints(polygon.points)}
                    fill="#2563eb"
                    fillOpacity={0.22}
                    stroke="#1d4ed8"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                  />

                  {showLabels && (
                    <text
                      x={centerX}
                      y={centerY}
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight="bold"
                      fill="#1e3a8a"
                    >
                      {polygon.id}
                    </text>
                  )}
                </g>
              )
            })}

            {points.length > 0 && (
              <g pointerEvents="none">
                <polyline
                  points={polygonPoints(points)}
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth={3}
                  vectorEffect="non-scaling-stroke"
                />

                {points.map(([x, y], index) => (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r={4}
                    fill="#dc2626"
                    stroke="white"
                    strokeWidth={1}
                  />
                ))}
              </g>
            )}
          </svg>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          Размечено помещений: {currentPolygons.length}
        </p>

        <button
          type="button"
          onClick={exportJSON}
          className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white"
        >
          <Download size={16} />
          Экспорт JSON
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {currentPolygons.map(polygon => (
          <div
            key={polygon.id}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <button
              type="button"
              onClick={() => editPolygon(polygon)}
              className="font-medium text-blue-700"
              title="Изменить контур"
            >
              {polygon.id}
            </button>

            <button
              type="button"
              onClick={() => removePolygon(polygon.id)}
              title="Удалить контур"
              className="text-red-600"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Контуры автоматически сохраняются в браузере.
        Для переноса в проект используй «Экспорт JSON».
        Не очищай данные сайта до экспорта.
      </p>
    </section>
  )
}

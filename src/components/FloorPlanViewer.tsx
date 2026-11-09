import { useState } from 'react'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

// Percent positions are manually aligned with the supplied floor-plan images.
// These are clickable room labels, not verified room boundary polygons.
const markers: Record<number, { id: string; x: number; y: number }[]> = {
  0: [{ id: '0250', x: 9.4, y: 7.5 }],
  1: [{ id: '1332', x: 91.4, y: 14.6 }],
  2: [{ id: '2348', x: 65.0, y: 11.7 }, { id: '2253', x: 42.0, y: 6.0 }],
  3: [{ id: '3314', x: 91.3, y: 20.8 }],
  4: [],
  5: [{ id: '5272', x: 22.6, y: 10.2 }],
}

type Props = {
  floor: number
  selectedRoom?: string | null
  onRoomSelect?: (id: string) => void
}

export default function FloorPlanViewer({ floor, selectedRoom, onRoomSelect }: Props) {
  const [zoom, setZoom] = useState(1)
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <p className="font-semibold text-slate-900">Учебный корпус № 1 · {floor} этаж</p>
          <p className="text-xs text-slate-500">Оригинальная схема; синие отметки — аудитории с данными о клубах</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Уменьшить" onClick={() => setZoom(z => Math.max(0.7, +(z - 0.25).toFixed(2)))} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-100"><ZoomOut size={17}/></button>
          <span className="min-w-12 text-center text-xs text-slate-600">{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="Увеличить" onClick={() => setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-100"><ZoomIn size={17}/></button>
          <button type="button" aria-label="Сбросить масштаб" onClick={() => setZoom(1)} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-100"><RotateCcw size={17}/></button>
        </div>
      </div>
      <div className="max-h-[680px] overflow-auto bg-[#f8fafc] p-3">
        <div className="relative mx-auto" style={{ width: `${zoom * 100}%`, minWidth: '500px' }}>
          <img src={`${import.meta.env.BASE_URL}floorplans/floor-${floor}.png`} alt={`Оригинальный план ${floor} этажа учебного корпуса № 1 НГУ`} className="block h-auto w-full select-none" draggable={false}/>
          {(markers[floor] ?? []).map(marker => (
            <button
              type="button"
              key={marker.id}
              title={`Аудитория ${marker.id}`}
              aria-label={`Выбрать аудиторию ${marker.id}`}
              onClick={() => onRoomSelect?.(marker.id)}
              className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white px-2 py-1 text-xs font-bold text-white shadow-lg transition hover:scale-110 ${selectedRoom === marker.id ? 'bg-amber-600 ring-4 ring-amber-200' : 'bg-[#16468c]'}`}
              style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
            >
              {marker.id}
            </button>
          ))}
        </div>
      </div>
      <p className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">Метки размещены вручную по изображениям и требуют визуальной проверки. Они не обозначают границы помещений.</p>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { DoorOpen, Clock3 } from 'lucide-react'
import { rooms } from '../data/rooms'
import FloorPlanViewer from './FloorPlanViewer'

type Props = {
  selectedBuilding: string
  onBuildingChange: (building: string) => void
}

export default function FloorExplorer({ selectedBuilding, onBuildingChange }: Props) {
  const buildings = [...new Set(rooms.map(r => r.building))]
  const [floor, setFloor] = useState<number | null>(3)
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const buildingRooms = useMemo(() => rooms.filter(r => r.building === selectedBuilding), [selectedBuilding])
  const isNewBuilding = selectedBuilding === 'Новый корпус НГУ'
  const floors = isNewBuilding ? [0, 1, 2, 3, 4, 5] : [...new Set(buildingRooms.map(r => r.floor).filter((f): f is number => f !== null))].sort((a,b) => a-b)
  const visibleRooms = buildingRooms.filter(r => floor === null || r.floor === floor)
  const selected = buildingRooms.find(r => r.id === selectedRoom)

  return (
    <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 sm:p-8">
      <h2 className="text-2xl font-bold">Поэтажная навигация</h2>
      <p className="mt-2 text-sm text-slate-500">Выбери корпус, этаж и аудиторию. На планах отмечены помещения, связанные со студенческими объединениями.</p>
      <label htmlFor="building-select" className="mt-6 mb-2 block text-sm font-semibold">Здание</label>
      <select id="building-select" value={selectedBuilding} onChange={e => { onBuildingChange(e.target.value); setFloor(e.target.value === 'Новый корпус НГУ' ? 3 : null); setSelectedRoom(null) }} className="w-full rounded-xl border border-slate-200 bg-white p-3">
        {buildings.map(name => <option key={name} value={name}>{name}</option>)}
      </select>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => { setFloor(null); setSelectedRoom(null) }} className={`rounded-lg px-4 py-2 text-sm ${floor === null ? 'bg-[#16468c] text-white' : 'bg-slate-100 text-slate-700'}`}>Все этажи</button>
        {floors.map(f => <button key={f} type="button" onClick={() => { setFloor(f); setSelectedRoom(null) }} className={`rounded-lg px-4 py-2 text-sm ${floor === f ? 'bg-[#16468c] text-white' : 'bg-slate-100 text-slate-700'}`}>{f} этаж</button>)}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(270px,1fr)]">
        <div>
          {isNewBuilding && floor !== null ? (
            <FloorPlanViewer key={floor} floor={floor} selectedRoom={selectedRoom} onRoomSelect={setSelectedRoom}/>
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-[#f1f5fb] p-6 text-center">
              <p className="font-semibold">{floor === null ? 'Выбери этаж, чтобы увидеть план' : 'План этого здания пока не загружен'}</p>
              <p className="mt-2 text-sm text-slate-500">Для других корпусов, СТЦ и общежитий добавим отдельные планы.</p>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">Помещения с данными о мероприятиях ({visibleRooms.length})</h3>
          {visibleRooms.length === 0 && <p className="text-sm text-slate-500">На этом этаже пока нет привязанных мероприятий. Это не означает, что аудитории отсутствуют.</p>}
          {visibleRooms.map(room => (
            <button type="button" key={room.id} onClick={() => setSelectedRoom(room.id)} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${selectedRoom === room.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
              <DoorOpen size={20} className="shrink-0 text-[#16468c]"/>
              <div><p className="font-medium">{room.name}</p><p className="text-xs text-slate-500">{room.block ?? 'Блок не указан'}{room.floor !== null ? ` · ${room.floor} этаж` : ''}</p></div>
            </button>
          ))}
          {selected && <div className="rounded-xl bg-[#163e79] p-5 text-white">
            <h3 className="text-lg font-bold">{selected.name}</h3>
            <p className="mt-3 text-sm text-blue-100">{selected.clubs.join(', ')}</p>
            <p className="mt-3 flex items-start gap-2 text-sm"><Clock3 size={17} className="shrink-0"/>{selected.schedule}</p>
            <p className="mt-3 text-xs text-blue-200">Интерактивная отметка на схеме; контур помещения ещё не оцифрован.</p>
          </div>}
        </div>
      </div>
    </section>
  )
}


import { MapContainer, TileLayer } from 'react-leaflet'
import { rooms } from '../data/rooms'
import 'leaflet/dist/leaflet.css'

type CampusMapProps = {
  selectedBuilding: string
  onBuildingSelect: (building: string) => void
}

export default function CampusMap({
  selectedBuilding,
  onBuildingSelect,
}: CampusMapProps) {
  const buildings = [...new Set(rooms.map(room => room.building))]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {buildings.map(building => (
          <button
            key={building}
            type="button"
            onClick={() => onBuildingSelect(building)}
            className={`rounded-xl border px-4 py-2 text-sm transition ${
              selectedBuilding === building
                ? 'border-[#16468c] bg-[#16468c] text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
            }`}
          >
            {building}
          </button>
        ))}
      </div>

      <div className="h-[550px] overflow-hidden rounded-2xl border border-slate-200">
        <MapContainer
          center={[54.843, 83.093]}
          zoom={15}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </MapContainer>
      </div>

      <p className="text-sm text-slate-500">
        Выбрано: <strong>{selectedBuilding}</strong>.
        Поэтажная информация отображается ниже.
        Контуры зданий добавим после подготовки геоданных.
      </p>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { MapContainer, Polygon, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { buildings } from '../data/buildings'
import { campusSites } from '../data/campusSites'
import { activityColors, activityLabels } from '../data/activityState'
import type { ActivityState } from '../data/activityState'
import 'leaflet/dist/leaflet.css'

type CampusMapProps = {
  selectedBuildingId: string | null
  activityBySite: ReadonlyMap<string, ActivityState>
  activityByBuilding: ReadonlyMap<string, ActivityState>
  onBuildingSelect: (buildingId: string) => void
}

function MapFocus({ selectedBuildingId }: { selectedBuildingId: string | null }) {
  const map = useMap()
  useEffect(() => {
    const site = campusSites.find(site => site.buildingIds.includes(selectedBuildingId ?? ''))
    const points = site?.rings[0] ?? campusSites.flatMap(site => site.rings[0])
    const fit = () => {
      map.invalidateSize({ animate: false })
      map.fitBounds(points, { padding: [24, 24], maxZoom: site ? 18 : 16, animate: false })
    }
    const frame = window.requestAnimationFrame(fit)
    const observer = new ResizeObserver(fit)
    observer.observe(map.getContainer())
    return () => { window.cancelAnimationFrame(frame); observer.disconnect() }
  }, [map, selectedBuildingId])
  return null
}

export default function CampusMap({ selectedBuildingId, activityBySite, activityByBuilding, onBuildingSelect }: CampusMapProps) {
  const [tilesUnavailable, setTilesUnavailable] = useState(false)
  const mappedIds = new Set(campusSites.flatMap(site => site.buildingIds))
  return <div className="min-w-0 space-y-4">
    <div className="relative h-[360px] overflow-hidden rounded-2xl border border-slate-200 sm:h-[480px]" aria-label="Интерактивная карта кампуса">
      <MapContainer center={[54.845, 83.092]} zoom={16} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" eventHandlers={{ tileerror: () => setTilesUnavailable(true) }} />
        <MapFocus selectedBuildingId={selectedBuildingId} />
        {campusSites.map(site => {
          const activity = activityBySite.get(site.id)!
          const selected = site.buildingIds.includes(selectedBuildingId ?? '')
          return <Polygon key={site.id} positions={site.rings} pathOptions={{
            fillColor: activityColors[activity.status], fillOpacity: 0.45,
            color: selected ? '#0f172a' : activityColors[activity.status], weight: selected ? 4 : 2,
            dashArray: activity.uncertain ? '6 4' : undefined,
          }} eventHandlers={{
            click: () => onBuildingSelect(site.buildingIds[0]),
            add: event => {
              const element = event.target.getElement() as SVGElement | undefined
              if (!element) return
              element.setAttribute('data-site-id', site.id)
              element.setAttribute('role', 'button')
              element.setAttribute('tabindex', '0')
              element.setAttribute('aria-label', `Открыть ${site.name}`)
              element.onkeydown = event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onBuildingSelect(site.buildingIds[0])
                }
              }
            },
          }}>
            <Tooltip sticky>{site.name} · {activityLabels[activity.status]}{activity.uncertain ? ' · ?' : ''}</Tooltip>
            <Popup autoPan={false}><div className="space-y-2">
              <p className="font-bold">{site.name}</p>
              <p>{activityLabels[activity.status]}{activity.uncertain ? ' · Есть уточняемые сведения' : ''}</p>
              {site.buildingIds.map(id => <button key={id} type="button" className="block w-full rounded border border-slate-300 p-2 text-left" onClick={() => onBuildingSelect(id)}>{buildings.find(building => building.id === id)!.name}</button>)}
            </div></Popup>
          </Polygon>
        })}
      </MapContainer>
    </div>
    {tilesUnavailable && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Фон OpenStreetMap не загрузился. Проверенные контуры и список зданий доступны; попробуйте обновить страницу позже.</p>}
    <p className="text-xs text-slate-500">Выберите контур или здание в списке. У общежитий и пристроек общий контур; отдельные входы не размечены. Цвет общего контура учитывает все встречи по этому адресу, включая встречи у здания на улице.</p>
    <div className="grid gap-2 sm:grid-cols-2" aria-label="Здания кампуса">
      {buildings.map(building => {
        const state = activityByBuilding.get(building.id)
        return <button key={building.id} type="button" data-building-id={building.id} aria-pressed={selectedBuildingId === building.id} onClick={() => onBuildingSelect(building.id)} className={`flex min-w-0 items-start gap-2 rounded-xl border p-3 text-left text-sm ${selectedBuildingId === building.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
          <span aria-hidden="true" className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: activityColors[state?.status ?? 'no-data'] }} />
          <span><span className="block font-medium">{building.name}</span><span className="mt-1 block text-xs text-slate-600">{building.address ?? 'Адрес уточняется'} · {state ? activityLabels[state.status] : 'Положение на карте уточняется'}{state?.uncertain && ' · ?'}</span></span>
        </button>
      })}
    </div>
    {buildings.some(building => !mappedIds.has(building.id)) && <p className="text-sm text-amber-800">Для части зданий положение ещё не установлено. Они доступны в списке и не размещены на карте предположительно.</p>}
    <p className="text-xs text-slate-500">Геометрия: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">© участники OpenStreetMap, ODbL</a>. Источники конкретного здания доступны в его карточке.</p>
  </div>
}

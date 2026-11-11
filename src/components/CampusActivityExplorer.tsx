import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { activitySessions } from '../data/activitySessions'
import { campusRooms } from '../data/campusRooms'
import { campusSites } from '../data/campusSites'
import { buildings } from '../data/buildings'
import { campusDateTime, evaluateActivity, evaluateBuildingActivity, parseCampusDateTime, sessionsForBuildings, sessionsForRoom } from '../data/activityState'
import { buildingContext, roomNavigation } from '../data/campusNavigation'
import ActivityTimeFilter from './ActivityTimeFilter'
import BuildingCard from './BuildingCard'
import CampusMap from './CampusMap'
const FloorExplorer = lazy(() => import('./FloorExplorer'))

export default function CampusActivityExplorer() {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [floorOpen, setFloorOpen] = useState(false)
  const [mode, setMode] = useState<'now' | 'chosen'>('now')
  const [now, setNow] = useState(() => new Date())
  const [chosenTime, setChosenTime] = useState(() => campusDateTime(new Date()))
  const buildingPanel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (mode !== 'now') return
    const timer = window.setInterval(() => setNow(new Date()), 15000)
    return () => window.clearInterval(timer)
  }, [mode])
  useEffect(() => {
    if (selectedBuildingId && !floorOpen && window.innerWidth < 1024) buildingPanel.current?.scrollIntoView({ block: 'start' })
  }, [selectedBuildingId, floorOpen])
  const instant = useMemo(() => mode === 'now' ? now : parseCampusDateTime(chosenTime), [mode, now, chosenTime])
  const activityByRoom = useMemo(() => new Map(campusRooms.map(room => [room.id,
    evaluateActivity(sessionsForRoom(activitySessions, room.id), instant ?? new Date(NaN)),
  ])), [instant])
  const activityBySite = useMemo(() => new Map(campusSites.map(site => [site.id,
    evaluateBuildingActivity(sessionsForBuildings(activitySessions, campusRooms, site.buildingIds), campusRooms, site.buildingIds, instant ?? new Date(NaN)),
  ])), [instant])
  const activityByBuilding = useMemo(() => new Map(buildings.map(building => {
    const context = buildingContext(building.id)!
    return [building.id, evaluateBuildingActivity(context.sessions, campusRooms, context.memberIds, instant ?? new Date(NaN))]
  })), [instant])
  const selectedBuilding = buildings.find(building => building.id === selectedBuildingId)

  function chooseBuilding(id: string) {
    setSelectedBuildingId(id)
    setSelectedRoomId(null)
    setFloorOpen(false)
  }
  function navigateRoom(id: string | null) {
    if (id === null) { setSelectedRoomId(null); return }
    const target = roomNavigation(id)
    if (!target) return
    setSelectedBuildingId(target.buildingId)
    setSelectedRoomId(target.roomId)
    setFloorOpen(true)
  }
  function backToCampus() {
    setFloorOpen(false)
    setSelectedBuildingId(null)
    setSelectedRoomId(null)
  }
  return <section id="campus-activity" className="mt-10 scroll-mt-5" aria-label="Карта студенческой активности">
    <h2 className="text-2xl font-bold">Карта студенческой активности</h2>
    <p className="mt-2 text-sm text-slate-600">Выбери здание, затем этаж и помещение, чтобы узнать о встречах объединений.</p>
    <ActivityTimeFilter mode={mode} value={chosenTime} instant={instant} onMode={value => { setNow(new Date()); setMode(value) }} onValue={setChosenTime} />
    <nav aria-label="Навигация по кампусу" className="my-5 flex flex-wrap items-center gap-2 text-sm">
      <button type="button" onClick={backToCampus} className="font-semibold text-blue-800 underline">Карта кампуса</button>
      {selectedBuilding && <><span aria-hidden="true">/</span><button type="button" onClick={() => setFloorOpen(false)} className="text-left font-semibold text-blue-800 underline">{selectedBuilding.name}</button></>}
      {floorOpen && <><span aria-hidden="true">/</span><span aria-current="page">Этажи и помещения</span></>}
    </nav>
    {floorOpen && selectedBuildingId ? <>
      <button type="button" onClick={backToCampus} className="rounded-xl border border-blue-300 bg-white px-4 py-3 text-sm font-semibold text-blue-800">← К общей карте кампуса</button>
      <Suspense fallback={<p className="mt-5 text-sm text-slate-600" role="status">Загружаем поэтажную навигацию…</p>}><FloorExplorer key={selectedBuildingId} selectedBuildingId={selectedBuildingId} selectedRoomId={selectedRoomId} activityByRoom={activityByRoom} onRoomSelect={navigateRoom} onBuildingChange={id => { setSelectedBuildingId(id); setSelectedRoomId(null) }} /></Suspense>
    </> : <div className={`grid items-start gap-5 ${selectedBuildingId ? 'lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)]' : ''}`}>
      <CampusMap selectedBuildingId={selectedBuildingId} activityBySite={activityBySite} activityByBuilding={activityByBuilding} onBuildingSelect={chooseBuilding} />
      {selectedBuildingId && <div ref={buildingPanel} className="min-w-0 scroll-mt-5"><BuildingCard buildingId={selectedBuildingId} instant={instant} activityByRoom={activityByRoom} onExplore={() => setFloorOpen(true)} onRoomSelect={navigateRoom} onBuildingSelect={chooseBuilding} onBack={backToCampus} /></div>}
    </div>}
  </section>
}

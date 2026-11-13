import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { activitySessions } from '../data/activityModel'
import { campusRooms } from '../data/campusRooms'
import { campusSites } from '../data/campusSites'
import { baseRoomIds } from '../data/activityCatalog'
import type { MapSessionRequest } from '../data/personalSchedule'
import SessionInfo from './SessionInfo'
import ClubMapPanel from './ClubMapPanel'
import { campusDateTime, evaluateActivity, evaluateBuildingActivity, parseCampusDateTime, sessionsForBuildings, sessionsForRoom } from '../data/activityState'
import { activityPlaces, buildingContext, clubMapContext, roomNavigation, sessionMapTarget } from '../data/campusNavigation'
import ActivityTimeFilter from './ActivityTimeFilter'
import BuildingCard from './BuildingCard'
import CampusMap from './CampusMap'
const FloorExplorer = lazy(() => import('./FloorExplorer'))

export default function CampusActivityExplorer({ request }: { request?: MapSessionRequest | null }) {
  const requestedSession = activitySessions.find(session => session.id === request?.sessionId)
  const initialClub = request?.clubId ? clubMapContext(request.clubId) : null
  const [selectedClubId, setSelectedClubId] = useState(initialClub?.club.id ?? null)
  const initialTarget = request?.roomId ? roomNavigation(request.roomId) : requestedSession ? sessionMapTarget(requestedSession) : initialClub?.places.length === 1 ? { buildingId: initialClub.places[0].id, roomId: null, floor: null } : null
  const initialTime = request?.date && requestedSession?.startTime ? `${request.date}T${requestedSession.startTime}` : null
  const [selectedSessionId, setSelectedSessionId] = useState(requestedSession?.id ?? null)
  const selectedSession = activitySessions.find(session => session.id === selectedSessionId)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(initialTarget?.buildingId ?? null)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(initialTarget?.roomId ?? null)
  const [floorOpen, setFloorOpen] = useState(Boolean(initialTarget?.roomId))
  const [mode, setMode] = useState<'now' | 'chosen'>(initialTime ? 'chosen' : 'now')
  const [now, setNow] = useState(() => new Date())
  const [chosenTime, setChosenTime] = useState(() => initialTime ?? campusDateTime(new Date()))
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
    evaluateActivity(sessionsForRoom(activitySessions, room.id), instant ?? new Date(NaN), baseRoomIds.has(room.id)),
  ])), [instant])
  const activityBySite = useMemo(() => new Map(campusSites.map(site => [site.id,
    evaluateBuildingActivity(sessionsForBuildings(activitySessions, campusRooms, site.buildingIds), campusRooms, site.buildingIds, instant ?? new Date(NaN), campusRooms.some(room => site.buildingIds.includes(room.buildingId) && baseRoomIds.has(room.id))),
  ])), [instant])
  const selectedBuilding = activityPlaces.find(place => place.id === selectedBuildingId)


  function chooseBuilding(id: string) {
    setSelectedSessionId(null)
    setSelectedBuildingId(buildingContext(id)?.building.id ?? id)
    setSelectedRoomId(null)
    setFloorOpen(false)
  }
  function navigateRoom(id: string | null, keepSession = false) {
    if (!keepSession) setSelectedSessionId(null)
    if (id === null) { setSelectedRoomId(null); return }
    const target = roomNavigation(id)
    if (!target) return
    setSelectedBuildingId(target.buildingId)
    setSelectedRoomId(target.roomId)
    setFloorOpen(true)
  }
  function backToCampus() {
    setSelectedClubId(null)
    setSelectedSessionId(null)
    setFloorOpen(false)
    setSelectedBuildingId(null)
    setSelectedRoomId(null)
  }
  function navigateSession(id: string) {
    const session = activitySessions.find(session => session.id === id)
    if (!session) return
    const target = sessionMapTarget(session)
    setSelectedSessionId(id)
    setSelectedBuildingId(target?.buildingId ?? null)
    setSelectedRoomId(target?.roomId ?? null)
    setFloorOpen(Boolean(target?.roomId))
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
    {selectedClubId && <ClubMapPanel clubId={selectedClubId} onPlace={chooseBuilding} onSession={navigateSession} onRoom={id => navigateRoom(id)} />}
    {selectedSession && <div className="mb-5"><SessionInfo session={selectedSession} date={request?.date} onRoom={id => navigateRoom(id, true)} /></div>}
    {floorOpen && selectedBuildingId ? <>
      <button type="button" onClick={backToCampus} className="rounded-xl border border-blue-300 bg-white px-4 py-3 text-sm font-semibold text-blue-800">← К общей карте кампуса</button>
      <Suspense fallback={<p className="mt-5 text-sm text-slate-600" role="status">Загружаем поэтажную навигацию…</p>}><FloorExplorer key={selectedBuildingId} selectedBuildingId={selectedBuildingId} selectedRoomId={selectedRoomId} activityByRoom={activityByRoom} onRoomSelect={id => navigateRoom(id)} onBuildingChange={id => { setSelectedSessionId(null); setSelectedBuildingId(id); setSelectedRoomId(null) }} /></Suspense>
    </> : <div className={`grid items-start gap-5 ${selectedBuildingId ? 'lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)]' : ''}`}>
      <CampusMap selectedBuildingId={selectedBuildingId} activityBySite={activityBySite} activityByBuilding={activityBySite} onBuildingSelect={chooseBuilding} />
      {selectedBuildingId && <div ref={buildingPanel} className="min-w-0 scroll-mt-5"><BuildingCard buildingId={selectedBuildingId} instant={instant} activityByRoom={activityByRoom} onExplore={() => setFloorOpen(true)} onRoomSelect={id => navigateRoom(id)} onBack={backToCampus} /></div>}
    </div>}
  </section>
}

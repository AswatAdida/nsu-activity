import { lazy, Suspense, useRef, useState } from 'react'
import { Header } from './components/Header'
import type { AppView } from './components/Header'
const ClubCatalog = lazy(() => import('./components/ClubCatalog'))
import CampusActivityExplorer from './components/CampusActivityExplorer'
const PersonalSchedule = lazy(() => import('./components/PersonalSchedule'))
import type { ActivitySession } from './data/campusTypes'
import { readClubSelection, sanitizeClubSelection, writeClubSelection } from './data/personalSchedule'
import type { MapSessionRequest } from './data/personalSchedule'

function App() {
  const [view, setView] = useState<AppView>('map')
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    try { return readClubSelection(window.localStorage) } catch { return [] }
  })
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [mapRequest, setMapRequest] = useState<MapSessionRequest | null>(null)
  const requestToken = useRef(0)
  function updateSelection(ids: string[]) {
    const next = sanitizeClubSelection(ids)
    setSelectedIds(next)
    try { setStorageAvailable(writeClubSelection(window.localStorage, next)) } catch { setStorageAvailable(false) }
  }
  function openSession(session: ActivitySession, date?: string) {
    setMapRequest({ sessionId: session.id, date, token: ++requestToken.current })
    setView('map')
    window.scrollTo({ top: 0 })
  }
  function openBase(roomId: string) {
    setMapRequest({ roomId, token: ++requestToken.current })
    setView('map')
    window.scrollTo({ top: 0 })
  }
  function openClubMap(clubId: string) {
    setMapRequest({ clubId, token: ++requestToken.current })
    setView('map')
    window.scrollTo({ top: 0 })
  }
  return <div className="min-h-screen bg-[#f5f7f9] text-slate-900">
    <Header view={view} onNavigate={setView} />
    <main className="site-main">
      <div className="site-intro"><span>Твоё сообщество. Твоё расписание. Твой кампус.</span><span>Новосибирск · Академгородок</span></div>
      <div hidden={view !== 'map'}><CampusActivityExplorer key={mapRequest?.token ?? 'campus'} request={mapRequest} /></div>
      <div hidden={view !== 'catalog'}><Suspense fallback={<p className="empty-state">Загружаем каталог…</p>}><ClubCatalog selectedIds={selectedIds} onOpenMap={openClubMap} onOpenSchedule={id => { updateSelection([...selectedIds, id]); setView('schedule') }} /></Suspense></div>
      <div hidden={view !== 'schedule'}><Suspense fallback={<p className="empty-state">Загружаем расписание…</p>}><PersonalSchedule selectedIds={selectedIds} onSelection={updateSelection} onMap={openSession} onBaseRoom={openBase} storageAvailable={storageAvailable} /></Suspense></div>
    </main>
    <footer className="site-footer">NSU Activity · Время Новосибирска · Подробности встреч — в сообществах объединений</footer>
  </div>
}
export default App

import { useRef, useState } from 'react'
import { Header } from './components/Header'
import type { AppView } from './components/Header'
import ClubCatalog from './components/ClubCatalog'
import CampusActivityExplorer from './components/CampusActivityExplorer'
import PersonalSchedule from './components/PersonalSchedule'
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
  return <div className="min-h-screen bg-[#f6f8fc] text-slate-900">
    <Header view={view} onNavigate={setView} />
    <main className="mx-auto max-w-6xl px-5 pb-16">
      <p className="mb-5 mt-5 text-sm text-slate-600">Знакомься с объединениями НГУ, находи места занятий и составляй собственное расписание.</p>
      <div hidden={view !== 'map'}><CampusActivityExplorer key={mapRequest?.token ?? 'campus'} request={mapRequest} /></div>
      <div hidden={view !== 'catalog'}><ClubCatalog onOpenSchedule={id => { updateSelection([...selectedIds, id]); setView('schedule') }} /></div>
      <div hidden={view !== 'schedule'}><PersonalSchedule selectedIds={selectedIds} onSelection={updateSelection} onMap={openSession} onBaseRoom={openBase} storageAvailable={storageAvailable} /></div>
    </main>
    <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">NSU Activity · Время Новосибирска · Подробности встреч — в сообществах объединений</footer>
  </div>
}
export default App

import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Header } from './components/Header'
import { ClubCard } from './components/ClubCard'
import rawClubs from './data/clubs.json'
import type { Club } from './types/club'
import CampusMap from './components/CampusMap'
import FloorExplorer from './components/FloorExplorer'

const clubs = rawClubs as Club[]
const categories = ['Все', ...Array.from(new Set(clubs.map(c => c.category)))]

function App() {
  const [search, setSearch] = useState('')
  const [selectedBuilding, setSelectedBuilding] = useState(
  'Новый корпус НГУ'
)
  const [category, setCategory] = useState('Все')
  const [showInactive, setShowInactive] = useState(true)
  const filtered = useMemo(() => clubs.filter(c => {
    const q = search.toLocaleLowerCase('ru').trim()
    const matchesText = [c.name, c.description, c.location, c.schedule].join(' ').toLocaleLowerCase('ru').includes(q)
    return matchesText && (category === 'Все' || c.category === category) && (showInactive || c.status === 'active')
  }), [search, category, showInactive])
  return <div className="min-h-screen bg-[#f6f8fc] text-slate-900"><Header /><main className="mx-auto max-w-6xl px-5 pb-20"><section className="mt-8 rounded-3xl bg-[#163e79] px-7 py-12 text-white sm:px-12"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Новосибирский государственный университет</p><h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">Найди своё объединение</h1><p className="mt-4 max-w-2xl text-base leading-relaxed text-blue-100">Знакомься со студенческими сообществами, узнавай расписание встреч и находи занятия по интересам.</p><div className="mt-7 flex flex-wrap gap-3 text-sm"><span className="rounded-full border border-blue-300/40 px-4 py-2">{clubs.length} объединений в каталоге</span><span className="rounded-full border border-blue-300/40 px-4 py-2">Данные от представителей клубов</span></div></section><section className="mt-10" aria-label="Поиск и фильтры"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-bold">Каталог объединений</h2><p className="mt-1 text-sm text-slate-500">Найди подходящее направление</p></div><span className="text-sm text-slate-500">Найдено: {filtered.length}</span></div><div className="relative mt-5"><Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Поиск объединений" value={search} onChange={e => setSearch(e.target.value)} placeholder="Название, направление, место или день встречи..." className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 outline-none transition focus:border-[#16468c] focus:ring-2 focus:ring-blue-100" /></div><div className="mt-4 flex flex-wrap gap-2">{categories.map(c => <button key={c} type="button" onClick={() => setCategory(c)} aria-pressed={category === c} className={'rounded-full border px-4 py-2 text-sm font-medium transition ' + (category === c ? 'border-[#16468c] bg-[#16468c] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300')}>{c}</button>)}</div><label className="mt-5 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="accent-[#16468c]" /><SlidersHorizontal size={16} /> Показывать объединения без регулярных встреч</label></section><section className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Карточки объединений">{filtered.map(club => <ClubCard key={club.id} club={club} />)}</section>{filtered.length === 0 && <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Ничего не найдено. Попробуй изменить запрос или фильтры.</div>}<section className="mx-auto max-w-7xl px-4 py-10">
    <h2 className="mb-4 text-2xl font-bold text-slate-900">
      Карта студенческой активности
    </h2>

    <CampusMap
  selectedBuilding={selectedBuilding}
  onBuildingSelect={setSelectedBuilding}
/> <FloorExplorer
  selectedBuilding={selectedBuilding}
  onBuildingChange={setSelectedBuilding}
/>
  </section></main><footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">NSU Activity · Учебный прототип · Расписание уточняйте в сообществах объединений</footer></div>
}
export default App

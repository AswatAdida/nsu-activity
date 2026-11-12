import { GraduationCap } from 'lucide-react'
export type AppView = 'map' | 'catalog' | 'schedule'
export function Header({ view, onNavigate }: { view: AppView; onNavigate: (view: AppView) => void }) {
  return <header className="border-b border-slate-200 bg-white">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-4">
      <div className="rounded-xl bg-[#16468c] p-2.5 text-white"><GraduationCap size={25} /></div>
      <div><h1 className="text-xl font-bold tracking-tight">NSU Activity</h1><div className="text-xs text-slate-500">Студенческая жизнь НГУ</div></div>
      <nav aria-label="Основная навигация" className="flex w-full flex-wrap gap-2 md:ml-auto md:w-auto">
        {([['map', 'Карта кампуса'], ['catalog', 'Каталог объединений'], ['schedule', 'Моё расписание']] as const).map(([id, label]) => <button key={id} type="button" aria-current={view === id ? 'page' : undefined} onClick={() => onNavigate(id)} className={`rounded-xl px-3 py-2 text-sm font-semibold ${view === id ? 'bg-[#16468c] text-white' : 'bg-slate-50 text-blue-900 hover:bg-blue-50'}`}>{label}</button>)}
      </nav>
    </div>
  </header>
}

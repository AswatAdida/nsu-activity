import { MapPin, Grid2X2, CalendarDays } from 'lucide-react'
export type AppView = 'map' | 'catalog' | 'schedule'
export function Header({ view, onNavigate }: { view: AppView; onNavigate: (view: AppView) => void }) {
  const links = [{ id: 'map', title: 'Карта кампуса', icon: MapPin }, { id: 'catalog', title: 'Каталог объединений', icon: Grid2X2 }, { id: 'schedule', title: 'Моё расписание', icon: CalendarDays }] as const
  return <header className="site-header"><div className="site-header-inner">
    <button type="button" onClick={() => onNavigate('map')} className="site-brand" aria-label="NSU Activity — на карту кампуса"><span className="brand-monogram" aria-hidden="true">N</span><span><h1>NSU Activity</h1><span className="brand-subtitle">Студенческие объединения НГУ</span></span></button>
    <nav aria-label="Основная навигация" className="site-navigation">{links.map(({ id, title, icon: Icon }) => <button key={id} type="button" aria-current={view === id ? 'page' : undefined} onClick={() => onNavigate(id)}><Icon size={17} aria-hidden="true" /><span>{title}</span></button>)}</nav>
  </div></header>
}

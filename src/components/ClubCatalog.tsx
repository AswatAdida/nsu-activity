import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { ClubCard } from './ClubCard'
import { clubs } from '../data/activityCatalog'

const categories = ['Все', ...Array.from(new Set(clubs.map(club => club.category)))]
type Props = { selectedIds: string[]; onOpenSchedule: (id: string) => void; onOpenMap: (id: string) => void }
export default function ClubCatalog({ selectedIds, onOpenSchedule, onOpenMap }: Props) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Все')
  const [showInactive, setShowInactive] = useState(true)
  const [sort, setSort] = useState('images')
  const filtered = useMemo(() => {
    const q = search.toLocaleLowerCase('ru').trim()
    const score = (club: typeof clubs[number]) => club.cover?.kind === 'photo' ? club.cover.fit === 'cover' ? 4 : 3 : club.cover ? 2 : club.logo ? 1 : 0
    return clubs.filter(club => [club.name, club.shortName, club.description, club.location, club.schedule].join(' ').toLocaleLowerCase('ru').includes(q) && (category === 'Все' || club.category === category) && (showInactive || club.status === 'active')).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name, 'ru') : score(b) - score(a))
  }, [search, category, showInactive, sort])
  return <section className="catalog-page" aria-label="Каталог объединений">
    <div className="catalog-heading"><div><p className="eyebrow">НГУ · СООБЩЕСТВА КАМПУСА</p><h2 className="page-title">Найди своих.</h2><p className="page-description">Творчество, спорт, языки и новые знакомства.<br className="hidden sm:block" /> Выбери то, что сделает твоё студенчество особенным.</p></div><p className="catalog-count"><strong>{clubs.length}</strong><span>объединения<br />в одном месте</span></p></div>
    <section className="catalog-filters" aria-label="Поиск и фильтры">
      <div className="catalog-search-row"><div className="catalog-search"><Search size={19} aria-hidden="true" /><input aria-label="Поиск объединений" value={search} onChange={event => setSearch(event.target.value)} placeholder="Клуб, направление, место или день…" /></div><select aria-label="Порядок объединений" value={sort} onChange={event => setSort(event.target.value)}><option value="images">Сначала с изображениями</option><option value="name">По алфавиту</option></select></div>
      <div className="catalog-categories" aria-label="Направления объединений">{categories.map(value => <button key={value} type="button" onClick={() => setCategory(value)} aria-pressed={category === value}>{value}</button>)}</div>
      <div className="catalog-filter-footer"><label><input type="checkbox" checked={showInactive} onChange={event => setShowInactive(event.target.checked)} /><SlidersHorizontal size={15} aria-hidden="true" />Показывать без регулярных встреч</label><span role="status">Найдено: {filtered.length}</span></div>
    </section>
    <section className="catalog-grid" aria-label="Карточки объединений">{filtered.map(club => <ClubCard key={club.id} club={club} selected={selectedIds.includes(club.id)} onOpenSchedule={() => onOpenSchedule(club.id)} onOpenMap={() => onOpenMap(club.id)} />)}</section>
    {!filtered.length && <p className="empty-state">Ничего не найдено. Попробуй изменить запрос или направление.</p>}
  </section>
}

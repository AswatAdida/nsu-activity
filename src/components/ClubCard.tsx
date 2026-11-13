import { ChevronDown, CalendarDays, MapPin, Users, ExternalLink } from 'lucide-react'
import type { Club } from '../types/club'
import { ClubVisual } from './ClubVisual'

type Props = { club: Club; selected?: boolean; onOpenSchedule: () => void; onOpenMap: () => void }
export function ClubCard({ club, selected, onOpenSchedule, onOpenMap }: Props) {
  return <article className="club-card" data-club-card={club.id}>
    <ClubVisual club={club} />
    <div className="club-card-body">
      <div className="club-card-meta"><span>{club.category}</span><span className={club.status === 'active' ? 'club-status' : 'club-status muted'}>{club.status === 'active' ? 'Действует' : 'Без регулярных встреч'}</span></div>
      <h3>{club.name}</h3>
      <p className="club-description">{club.description}</p>
      <div className="club-facts">
        <p><CalendarDays size={16} aria-hidden="true" /><span>{club.schedule}</span></p>
        <p><MapPin size={16} aria-hidden="true" /><span>{club.location}</span></p>
      </div>
      <details className="club-details"><summary>Подробнее об объединении <ChevronDown size={14} aria-hidden="true" /></summary>
        <div className="club-details-content">
          {club.photo && club.logo && <ClubVisual club={club} image={club.logo} compact />}
          <p>{club.description}</p><p><strong>Расписание.</strong> {club.schedule}</p><p><strong>Место.</strong> {club.location}</p>
          <p className="flex items-start gap-2"><Users size={16} className="shrink-0" aria-hidden="true" />{club.attendance}</p>
          {club.notes?.map(note => <p key={note}>{note}</p>)}
          {club.sources?.map((source, index) => <p key={index} className="source-note">Источник: {source.kind === 'poster' ? 'афиша пользователя' : 'сведения пользователя'}, {source.recordedOn}.{source.note && ` ${source.note}`}</p>)}
        </div>
      </details>
      <div className="club-card-actions">
        <button type="button" onClick={onOpenSchedule} className="action-primary" aria-label={`В расписание: ${club.name}`}><CalendarDays size={15} aria-hidden="true" />{selected ? 'В расписании' : 'В расписание'}</button>
        <button type="button" onClick={onOpenMap} className="action-secondary" aria-label={`На карте: ${club.name}`}><MapPin size={15} aria-hidden="true" />На карте</button>
      </div>
      {club.url ? <a className="club-community" href={club.url} target="_blank" rel="noopener noreferrer">Сообщество <ExternalLink size={14} aria-hidden="true" /></a> : <span className="club-community muted">Сообщество пока не указано</span>}
    </div>
  </article>
}

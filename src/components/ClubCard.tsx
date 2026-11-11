import { CalendarDays, MapPin, Users, ExternalLink } from 'lucide-react'
import type { Club } from '../types/club'
import { activityPolicy } from '../data/activityState'

export function ClubCard({ club }: { club: Club }) {
  return <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
    <div className="mb-3 flex items-start justify-between gap-3">
      <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#16468c]">{club.category}</span>
      <span className={'text-xs ' + (club.status === 'active' ? 'text-emerald-700' : 'text-amber-700')}>{club.status === 'active' ? 'Действует' : 'Нет регулярных встреч'}</span>
    </div>
    <h3 className="text-lg font-bold text-slate-900">{club.name}</h3>
    <p className="mt-1 text-sm text-slate-600">{club.description}</p>
    <div className="mt-5 flex-1 space-y-3 text-sm text-slate-600">
      <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 shrink-0 text-[#16468c]" size={17} />{club.schedule}</p>
      {club.scheduleStatus && <p className="text-xs text-amber-800">{activityPolicy.confirmSchedules ? 'Расписание принято как подтверждённое' : club.scheduleStatus === 'needs-confirmation' ? 'Расписание требует уточнения' : 'Расписание со слов пользователя; актуальность не проверена'}</p>}
      <p className="flex items-start gap-2"><MapPin className="mt-0.5 shrink-0 text-[#16468c]" size={17} />{club.location}</p>
      <p className="flex items-start gap-2"><Users className="mt-0.5 shrink-0 text-[#16468c]" size={17} />{club.attendance}</p>
      {club.notes?.map(note => <p key={note} className="text-xs leading-relaxed text-slate-500">{note}</p>)}
    </div>
    <div className="mt-5 border-t border-slate-100 pt-4">
      {club.url ? <a className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#16468c] hover:underline" href={club.url} target="_blank" rel="noopener noreferrer">Сообщество <ExternalLink size={15} /></a> : <span className="text-sm text-slate-400">Ссылка уточняется</span>}
      {club.sources?.map((source, i) => <p key={i} className="mt-2 text-xs text-slate-500">Источник: {source.kind === 'poster' ? 'афиша, предоставленная пользователем' : 'сведения пользователя'}, получены {source.recordedOn}.{source.note && ` ${source.note}`}</p>)}
    </div>
  </article>
}

import { useMemo, useRef, useState, useEffect } from 'react'
import { clubs, sessionsForClub, sessionClub } from '../data/activityCatalog'
import { campusRooms } from '../data/campusRooms'
import { addDays, campusDateTime, dateLabel, validCampusDate, weekStart } from '../data/campusTime'
import { sessionLocationLabel } from '../data/campusNavigation'
import { clubColor, studentWeek } from '../data/personalSchedule'
import { calendarIssue, recurrenceLabel, weekdays } from '../data/sessionSchedule'
import type { ActivitySession } from '../data/campusTypes'
import SessionInfo from './SessionInfo'

type Props = {
  selectedIds: string[]
  onSelection: (ids: string[]) => void
  onMap: (session: ActivitySession, date?: string) => void
  onBaseRoom: (roomId: string) => void
  storageAvailable: boolean
}
export default function PersonalSchedule({ selectedIds, onSelection, onMap, onBaseRoom, storageAvailable }: Props) {
  const [search, setSearch] = useState('')
  const [week, setWeek] = useState(() => weekStart(campusDateTime(new Date()).slice(0, 10)))
  const [view, setView] = useState<'week' | 'list'>(() => window.innerWidth < 768 ? 'list' : 'week')
  const [selected, setSelected] = useState<{ session: ActivitySession; date?: string } | null>(null)
  const detailPanel = useRef<HTMLDivElement>(null)
  const schedule = useMemo(() => studentWeek(selectedIds, week), [selectedIds, week])
  const activeSelection = selected && selectedIds.includes(sessionClub(selected.session)?.id ?? '') ? selected : null
  useEffect(() => { if (activeSelection) detailPanel.current?.scrollIntoView({ block: 'nearest' }) }, [activeSelection])
  const visibleClubs = clubs.filter(club => club.name.toLocaleLowerCase('ru').includes(search.trim().toLocaleLowerCase('ru')))
  function changeWeek(value: string) { setWeek(value); setSelected(null) }
  function sessionButton(session: ActivitySession, date?: string) {
    const club = sessionClub(session)
    return <button key={session.id} type="button" data-schedule-session={session.id} data-occurrence-date={date ?? ''} onClick={() => setSelected({ session, date })} className="block w-full min-w-0 rounded-xl border border-slate-200 border-l-4 bg-white p-3 text-left text-sm shadow-sm hover:bg-blue-50" style={{ borderLeftColor: clubColor(club?.id ?? '') }}>
      <span className="block font-bold">{session.startTime ?? 'Время уточняется'}{session.startTime && session.endTime ? `–${session.endTime}` : ''}</span>
      <span className="mt-1 block font-semibold">{session.clubName}</span>
      <span className="mt-1 block text-xs text-slate-600">{sessionLocationLabel(session)}</span>
      <span className="mt-1 block text-xs text-slate-600">{recurrenceLabel(session)}</span>
    </button>
  }
  return <section id="personal-schedule" className="space-y-6" aria-label="Моё расписание">
    <div><h2 className="text-2xl font-bold">Моё расписание</h2><p className="mt-2 text-sm text-slate-600">Выбери объединения. Занятия появятся по дням выбранной недели · время Новосибирска.</p></div>
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Интересующие объединения ({selectedIds.length})</h3><button type="button" onClick={() => { onSelection([]); setSelected(null) }} disabled={!selectedIds.length} className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40">Сбросить выбор</button></div>
      <input aria-label="Найти объединение для расписания" value={search} onChange={event => setSearch(event.target.value)} placeholder="Название объединения" className="mt-3 w-full rounded-xl border border-slate-300 p-3 text-sm" />
      <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">{visibleClubs.map(club => <label key={club.id} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${selectedIds.includes(club.id) ? 'border-blue-400 bg-blue-50' : 'border-slate-200'}`}><input type="checkbox" data-club-choice={club.id} checked={selectedIds.includes(club.id)} onChange={event => onSelection(event.target.checked ? [...selectedIds, club.id] : selectedIds.filter(id => id !== club.id))} className="mt-1 shrink-0 accent-blue-800" /><span>{club.name}</span></label>)}</div>
      {!visibleClubs.length && <p className="mt-3 text-sm text-slate-500">Объединения не найдены.</p>}
      <p className="mt-3 text-xs text-slate-500" role="status">{storageAvailable ? 'Выбор сохраняется в этом браузере.' : 'Браузер не разрешает сохранять выбор. На этой странице расписание работает.'}</p>
    </div>
    {selectedIds.length === 0 ? <p className="rounded-xl bg-blue-50 p-5 text-sm text-blue-900">Отметь интересующие объединения, чтобы составить своё расписание.</p> : <>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" aria-label="Предыдущая неделя" onClick={() => changeWeek(addDays(week, -7))} className="rounded-lg border border-slate-300 bg-white px-3 py-2">←</button>
        <label className="min-w-0 text-sm">Неделя с <input type="date" aria-label="Неделя расписания" value={week} onChange={event => { if (validCampusDate(event.target.value)) changeWeek(weekStart(event.target.value)) }} className="max-w-full rounded-lg border border-slate-300 bg-white p-2" /></label>
        <button type="button" aria-label="Следующая неделя" onClick={() => changeWeek(addDays(week, 7))} className="rounded-lg border border-slate-300 bg-white px-3 py-2">→</button>
        <button type="button" onClick={() => changeWeek(weekStart(campusDateTime(new Date()).slice(0, 10)))} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">Текущая неделя</button>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Вид расписания">{(['week', 'list'] as const).map(mode => <button key={mode} type="button" onClick={() => setView(mode)} aria-pressed={view === mode} className={`rounded-xl border px-4 py-2 text-sm ${view === mode ? 'border-blue-800 bg-blue-800 text-white' : 'border-slate-300 bg-white'}`}>{mode === 'week' ? 'Недельное расписание' : 'Список занятий'}</button>)}</div>
      <div className={view === 'week' ? 'overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-3' : ''} aria-label={view === 'week' ? 'Недельный календарь' : 'Занятия по дням'}>
        <div className={view === 'week' ? 'grid min-w-[1050px] grid-cols-7 items-start gap-3' : 'space-y-4'}>{schedule.days.map((day, index) => <section key={day.date} data-schedule-day={day.date} className="min-w-0 space-y-3 rounded-xl bg-slate-50 p-2">
          <h3 className="font-bold">{weekdays[index]}<span className="mt-1 block text-xs font-normal text-slate-600">{dateLabel(day.date)}</span></h3>
          <div className="space-y-3">{day.entries.filter(entry => entry.session.startTime).map(entry => sessionButton(entry.session, entry.date))}</div>
          {day.entries.some(entry => !entry.session.startTime) && <div className="space-y-3"><h4 className="text-sm font-semibold">Время уточняется</h4>{day.entries.filter(entry => !entry.session.startTime).map(entry => sessionButton(entry.session, entry.date))}</div>}
          {!day.entries.length && <p className="text-xs text-slate-500">Нет выбранных занятий на этот день.</p>}
        </section>)}</div>
      </div>
      {schedule.undated.length > 0 && <section className="space-y-3" aria-label="Периодические занятия без точных дат"><h3 className="text-lg font-bold">Периодические занятия без точных дат</h3><p className="text-sm text-slate-600">Периодичность известна, но данных для конкретных дат недостаточно. Эти записи не добавлены в календарную неделю.</p><div className="grid gap-3 sm:grid-cols-2">{schedule.undated.map(session => <div key={session.id} data-undated-session={session.id} className="space-y-1"><p className="text-xs text-slate-600">{session.dayOfWeek ? weekdays[session.dayOfWeek - 1] : 'День не указан'} · {calendarIssue(session)}</p>{sessionButton(session)}</div>)}</div></section>}
      {schedule.withoutRegular.length > 0 && <section className="space-y-3" aria-label="Выбранные объединения без постоянного расписания"><h3 className="text-lg font-bold">Выбранные объединения без постоянного расписания</h3><div className="grid gap-3 sm:grid-cols-2">{schedule.withoutRegular.map(club => <article key={club.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"><h4 className="font-semibold">{club.name}</h4><p className="text-sm text-slate-600">{club.schedule}</p>{sessionsForClub(club.id).map(session => sessionButton(session))}{!sessionsForClub(club.id).length && <p className="text-xs text-slate-500">В календарной базе пока нет отдельных занятий этого объединения. Описание из каталога сохранено выше.</p>}{club.baseRoomIds?.map(id => <button key={id} type="button" onClick={() => onBaseRoom(id)} className="block text-left text-sm text-blue-800 underline">Базовое место: {campusRooms.find(room => room.id === id)?.name ?? id}</button>)}{club.url && <a href={club.url} target="_blank" rel="noreferrer" className="block text-sm text-blue-800 underline">Сообщество</a>}</article>)}</div></section>}
      {schedule.unstructured.length > 0 && <section className="space-y-3" aria-label="Объединения без календарных записей"><h3 className="text-lg font-bold">Объединения без календарных записей</h3><p className="text-sm text-slate-600">Описание расписания из каталога сохранено. Отдельные занятия ещё не представлены в календарной базе.</p><div className="grid gap-3 sm:grid-cols-2">{schedule.unstructured.map(club => <article key={club.id} className="space-y-2 rounded-xl border border-slate-200 bg-white p-4"><h4 className="font-semibold">{club.name}</h4><p className="text-sm text-slate-600">{club.schedule}</p><p className="text-xs text-slate-500">{club.location}</p>{club.baseRoomIds?.map(id => <button key={id} type="button" onClick={() => onBaseRoom(id)} className="block text-left text-sm text-blue-800 underline">Базовое место: {campusRooms.find(room => room.id === id)?.name ?? id}</button>)}{club.url && <a href={club.url} target="_blank" rel="noreferrer" className="block text-sm text-blue-800 underline">Сообщество</a>}</article>)}</div></section>}
    </>}
    {activeSelection && <div ref={detailPanel} className="scroll-mt-4"><div className="mb-2 text-right"><button type="button" onClick={() => setSelected(null)} className="text-sm text-blue-800 underline">Закрыть сведения о занятии</button></div><SessionInfo session={activeSelection.session} date={activeSelection.date} onMap={() => onMap(activeSelection.session, activeSelection.date)} /></div>}
  </section>
}

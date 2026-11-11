import { activityColors, activityLabels, campusDateTime } from '../data/activityState'

type Props = { mode: 'now' | 'chosen'; value: string; instant: Date | null; onMode: (mode: 'now' | 'chosen') => void; onValue: (value: string) => void }
export default function ActivityTimeFilter({ mode, value, instant, onMode, onValue }: Props) {
  return <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
    <fieldset className="flex min-w-0 flex-wrap items-center gap-3">
      <legend className="mb-2 font-semibold">Время активности · Новосибирск (UTC+7)</legend>
      <label className="flex items-center gap-2"><input type="radio" name="activity-time" checked={mode === 'now'} onChange={() => onMode('now')} />Сейчас</label>
      <label className="flex items-center gap-2"><input type="radio" name="activity-time" checked={mode === 'chosen'} onChange={() => onMode('chosen')} />Выбрать дату и время</label>
      {mode === 'chosen' && <input type="datetime-local" aria-label="Дата и время в Новосибирске" value={value} onChange={e => onValue(e.target.value)} className="min-w-0 max-w-full rounded-lg border border-slate-300 bg-white p-2" />}
    </fieldset>
    <p role="status">{instant ? `На ${campusDateTime(instant).replace('T', ' ')} · Новосибирск` : 'Введите корректные дату и время. Активность не определена.'}</p>
    <ul aria-label="Легенда активности" className="flex flex-wrap gap-x-5 gap-y-2">
      {(['scheduled', 'known', 'uncertain', 'no-data'] as const).map(status => <li key={status} className="flex items-center gap-2"><span className="h-3 w-5 rounded-sm" style={{ background: activityColors[status] }} />{activityLabels[status]}</li>)}
      <li className="flex items-center gap-2"><span className="h-3 w-5 border-2 border-dashed border-amber-600" />Пунктир / ? — есть уточняемые сведения</li>
    </ul>
    <p className="text-xs text-slate-600">Цвета одинаковы для зданий и помещений. Зелёный — ожидаемая встреча по расписанию, не фактическое присутствие. Расписания считаются подтверждёнными; если окончание не указано, используется 1 час. Неизвестное начало, периодичность или неточное место требуют уточнения. Серый означает отсутствие сведений в базе. Если есть разные сведения, приоритет: зелёный → синий → оранжевый.</p>
  </div>
}

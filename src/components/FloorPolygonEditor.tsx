import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, MouseEvent, PointerEvent } from 'react'
import { Download, RotateCcw, Undo2, Trash2 } from 'lucide-react'
import { conflictingPolygons, geometryError, isPoint, mergePolygons, parsePolygons, polygonKey } from '../data/roomPolygons'
import type { Point, RoomPolygon } from '../data/roomPolygons'
import { suggestRoomContour } from '../data/suggestRoomContour'

type Props = { floor: number }
type Draft = { roomId: string; originalId: string | null; points: Point[]; method?: 'assisted' }
const STORAGE_KEY = 'nsu-activity-room-polygons-v1'
const emptyDraft = (): Draft => ({ roomId: '', originalId: null, points: [] })
const errorText = (error: unknown) => error instanceof Error ? error.message : String(error)
const polygonPoints = (points: Point[]) => points.map(p => p.join(',')).join(' ')
const button = 'rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40'

function readPolygons() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return { polygons: raw === null ? [] : parsePolygons(JSON.parse(raw)), exists: raw !== null, error: '' }
  } catch (error) {
    return { polygons: [] as RoomPolygon[], exists: true, error: `Не удалось прочитать сохранённые контуры: ${errorText(error)}. Исходная запись не изменена.` }
  }
}
function readDraft(key: string) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return { draft: emptyDraft(), error: '' }
    const value = JSON.parse(raw)
    if (!value || typeof value.roomId !== 'string' ||
      !(value.originalId === null || typeof value.originalId === 'string') ||
      !Array.isArray(value.points) || !value.points.every(isPoint)) throw new Error('Неверный формат черновика')
    return { draft: value as Draft, error: '' }
  } catch (error) {
    return { draft: emptyDraft(), error: `Не удалось восстановить черновик: ${errorText(error)}. Исходная запись не изменена.` }
  }
}

export default function FloorPolygonEditor({ floor }: Props) {
  const draftKey = `${STORAGE_KEY}-draft-academic-1-${floor}`
  const [initial] = useState(readPolygons)
  const [initialDraft] = useState(() => readDraft(draftKey))
  const [polygons, setPolygons] = useState<RoomPolygon[]>(initial.polygons)
  const [draft, setDraft] = useState<Draft>(initialDraft.draft)
  const [storageErrors, setStorageErrors] = useState({ polygons: initial.error, draft: initialDraft.error })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(!initial.exists)
  const [pendingImport, setPendingImport] = useState<RoomPolygon[] | null>(null)
  const [mode, setMode] = useState<'manual' | 'assisted'>('manual')
  const [detecting, setDetecting] = useState(false)
  const detection = useRef<AbortController | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [zoom, setZoom] = useState(1)
  const [showLabels, setShowLabels] = useState(true)
  const [selectedVertex, setSelectedVertex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ index: number; pointerId: number } | null>(null)
  const suppressClick = useRef(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const protectedKeys = useRef(new Set<string>())
  const hasDraft = Boolean(draft.roomId || draft.points.length || draft.originalId)

  // Preserve unreadable data before an explicit edit/import replaces it.
  function writeStorage(key: string, value: unknown, protect: boolean) {
    try {
      if (protect && !protectedKeys.current.has(key)) {
        const original = localStorage.getItem(key)
        if (original !== null) localStorage.setItem(`${key}-recovery-${Date.now()}`, original)
        protectedKeys.current.add(key)
      }
      localStorage.setItem(key, JSON.stringify(value))
      setStorageErrors(previous => ({ ...previous, [key === STORAGE_KEY ? 'polygons' : 'draft']: '' }))
      return true
    } catch (error) {
      setStorageErrors(previous => ({ ...previous, [key === STORAGE_KEY ? 'polygons' : 'draft']: `Не удалось сохранить в браузере: ${errorText(error)}. Последние изменения только в памяти; скачайте контуры и черновик перед закрытием.` }))
      return false
    }
  }
  function updateDraft(next: Draft) {
    setDraft(next)
    writeStorage(draftKey, next, Boolean(initialDraft.error))
  }
  function commitPolygons(next: RoomPolygon[]) {
    setPolygons(next)
    return writeStorage(STORAGE_KEY, next, Boolean(initial.error))
  }

  useEffect(() => {
    if (initial.exists) return
    let cancelled = false
    async function seed() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/room-polygons.json`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = parsePolygons(await response.json())
        if (cancelled) return
        setPolygons(data)
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }
        catch (error) { setStorageErrors(previous => ({ ...previous, polygons: `Контуры загружены, но сохранение в браузере недоступно: ${errorText(error)}` })) }
        setMessage('Загружены опубликованные контуры. Можно продолжать разметку.')
      } catch (error) {
        if (!cancelled) setMessage(`Не удалось загрузить опубликованные контуры: ${errorText(error)}. Повторите загрузку или импортируйте JSON.`)
      } finally { if (!cancelled) setBusy(false) }
    }
    void seed()
    return () => { cancelled = true }
  }, [initial.exists])

  useEffect(() => {
    if (!hasDraft && !storageErrors.polygons && !storageErrors.draft) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasDraft, storageErrors.polygons, storageErrors.draft])

  useEffect(() => () => {
    const controller = detection.current
    detection.current = null
    controller?.abort()
  }, [])

  const currentPolygons = polygons.filter(p => p.buildingId === 'academic-1' && p.floor === floor)
  const conflicts = pendingImport ? conflictingPolygons(polygons, pendingImport) : []
  const validationError = draft.points.length ? geometryError(draft.points) : null

  function applyImport(incoming: RoomPolygon[], replace: boolean) {
    commitPolygons(mergePolygons(polygons, incoming, replace))
    setPendingImport(null)
    setMessage(`Обработано контуров: ${incoming.length}. Экспорт включает все здания и этажи. Черновик не изменён.`)
  }
  function offerImport(incoming: RoomPolygon[]) {
    if (conflictingPolygons(polygons, incoming).length) setPendingImport(incoming)
    else applyImport(incoming, false)
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    try { offerImport(parsePolygons(JSON.parse(await file.text()))) }
    catch (error) { setMessage(`Импорт отменён: ${errorText(error)}. Сохранённые контуры не изменены.`) }
    finally { setBusy(false) }
  }
  async function loadPublished() {
    setBusy(true)
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/room-polygons.json`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      offerImport(parsePolygons(await response.json()))
    } catch (error) { setMessage(`Ошибка загрузки: ${errorText(error)}`) }
    finally { setBusy(false) }
  }
  function savePolygon() {
    const id = draft.roomId.trim()
    const error = geometryError(draft.points)
    if (!id || error) { setMessage(error || 'Укажите номер аудитории.'); return }
    const polygon: RoomPolygon = { id, buildingId: 'academic-1', floor, points: draft.points }
    if (draft.originalId === null && polygons.some(p => polygonKey(p) === polygonKey(polygon)) &&
      !window.confirm(`Заменить существующий контур аудитории ${id}?`)) return
    if (commitPolygons(mergePolygons(polygons, [polygon], true))) {
      updateDraft(emptyDraft())
      setSelectedVertex(null)
      setMessage(`Контур ${id} сохранён. Для публикации экспортируйте JSON.`)
    }
  }
  function editPolygon(polygon: RoomPolygon) {
    if (hasDraft && !window.confirm('Заменить текущий черновик выбранным контуром?')) return
    updateDraft({ roomId: polygon.id, originalId: polygon.id, points: polygon.points.map(p => [...p] as Point) })
    setSelectedVertex(null)
  }
  function removePolygon(polygon: RoomPolygon) {
    if (!window.confirm(`Удалить контур аудитории ${polygon.id}?`)) return
    commitPolygons(polygons.filter(p => polygonKey(p) !== polygonKey(polygon)))
  }
  function cancelDraft() {
    if (hasDraft && !window.confirm('Отменить изменения черновика? Сохранённый контур останется на месте.')) return
    updateDraft(emptyDraft())
    setSelectedVertex(null)
  }
  function exportJSON(includeDraft = false) {
    const data = includeDraft ? { buildingId: 'academic-1', floor, ...draft } : polygons
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = includeDraft ? `room-draft-floor-${floor}.json` : 'room-polygons.json'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  function eventPoint(event: { clientX: number; clientY: number }): Point | null {
    const svg = svgRef.current
    const matrix = svg?.getScreenCTM()
    if (!svg || !matrix) return null
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const local = point.matrixTransform(matrix.inverse())
    return [local.x, local.y].map(n => Math.round(Math.max(0, Math.min(1000, n)) * 10) / 10) as Point
  }
  async function findContour(point: Point) {
    if (!imageRef.current || detection.current) return
    const controller = new AbortController()
    detection.current = controller
    setDetecting(true)
    try {
      const result = await suggestRoomContour(imageRef.current, point, controller.signal)
      if (controller.signal.aborted) return
      const error = geometryError(result.points)
      if (error) throw new Error(error)
      if (draft.points.length && !window.confirm('Заменить точки текущего черновика найденной границей? Сохранённый контур останется на месте.')) {
        setMessage('Черновик не изменён. Можно продолжить вручную или выбрать другую точку.')
        return
      }
      updateDraft({ ...draft, points: result.points, method: 'assisted' })
      setSelectedVertex(null)
      setMessage(`Предложена граница из ${result.points.length} вершин. Проверьте её по стенам, при необходимости поправьте и нажмите «Сохранить контур».`)
    } catch (error) {
      if (!controller.signal.aborted) setMessage(`Поиск не выполнен: ${errorText(error)} Черновик не изменён.`)
    } finally {
      if (detection.current === controller) { detection.current = null; setDetecting(false) }
    }
  }
  function cancelDetection() {
    const controller = detection.current
    detection.current = null
    controller?.abort()
    setDetecting(false)
    setMessage('Поиск отменён. Черновик не изменён.')
  }
  function addPoint(event: MouseEvent<SVGSVGElement>) {
    if (suppressClick.current) { suppressClick.current = false; return }
    if (busy || pendingImport || detection.current) return
    if (!draft.roomId.trim()) { setMessage('Сначала введите номер аудитории.'); return }
    const point = eventPoint(event)
    if (point) {
      if (mode === 'assisted') void findContour(point)
      else updateDraft({ ...draft, points: [...draft.points, point] })
    }
  }
  function startDrag(event: PointerEvent<SVGCircleElement>, index: number) {
    event.stopPropagation()
    if (busy || pendingImport || detection.current || event.button !== 0) return
    setSelectedVertex(index)
    drag.current = { index, pointerId: event.pointerId }
    suppressClick.current = true
    svgRef.current?.setPointerCapture(event.pointerId)
  }
  function moveVertex(event: PointerEvent<SVGSVGElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return
    const point = eventPoint(event)
    if (point) updateDraft({ ...draft, points: draft.points.map((p, i) => i === drag.current!.index ? point : p) })
  }
  function stopDrag(event: PointerEvent<SVGSVGElement>) {
    if (drag.current?.pointerId !== event.pointerId) return
    drag.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    setTimeout(() => { suppressClick.current = false }, 0)
  }
  function insertVertex(event: MouseEvent<SVGLineElement>, index: number) {
    event.stopPropagation()
    if (busy || pendingImport || detection.current) return
    const point = eventPoint(event)
    if (!point) return
    const a = draft.points[index], b = draft.points[(index + 1) % draft.points.length]
    const lengthSquared = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2
    const t = lengthSquared ? Math.max(0, Math.min(1,
      ((point[0] - a[0]) * (b[0] - a[0]) + (point[1] - a[1]) * (b[1] - a[1])) / lengthSquared)) : 0
    const projected = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])].map(n => Math.round(n * 10) / 10) as Point
    updateDraft({ ...draft, points: [...draft.points.slice(0, index + 1), projected, ...draft.points.slice(index + 1)] })
    setSelectedVertex(index + 1)
  }
  function removeVertex() {
    if (selectedVertex === null || draft.points.length <= 3) return
    updateDraft({ ...draft, points: draft.points.filter((_, i) => i !== selectedVertex) })
    setSelectedVertex(null)
  }

  return (
    <section className="mt-6 rounded-2xl border border-blue-200 bg-white p-4" aria-label="Редактор контуров">
      <h3 className="text-lg font-bold">Редактор контуров · {floor} этаж</h3>
      <p className="mt-2 text-sm text-slate-500">Выберите ручную разметку или поиск границы по клику внутри помещения. Вершины можно перетаскивать; нажатие на ребро добавляет вершину. Синие контуры — сохранённые, красный — черновик.</p>
      {Object.entries(storageErrors).filter(([, message]) => message).map(([key, message]) => <p key={key} role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{message}</p>)}
      <p role="status" className="mt-3 text-sm text-slate-600">{detecting ? 'Ищу границу помещения…' : busy ? 'Загрузка контуров…' : message}</p>
      {detecting && <button type="button" className={button} onClick={cancelDetection}>Отменить поиск</button>}
      {pendingImport && <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm" role="group" aria-label="Конфликты импорта">
        <p>Отличающиеся контуры ({conflicts.length}): {conflicts.map(p => `${p.buildingId}, этаж ${p.floor}, ${p.id}`).join('; ')}. Остальные помещения будут объединены.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className={button} onClick={() => applyImport(pendingImport, false)}>Сохранить текущие версии</button>
          <button type="button" className={button} onClick={() => applyImport(pendingImport, true)}>Заменить версиями из файла</button>
          <button type="button" className={button} onClick={() => setPendingImport(null)}>Отменить импорт</button>
        </div>
      </div>}
      <fieldset disabled={busy || detecting || Boolean(pendingImport)}>
        <div className="mt-4 flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={importFile} className="hidden" aria-label="Файл контуров JSON" />
          <button type="button" className={button} onClick={() => fileRef.current?.click()}>Импорт JSON</button>
          <button type="button" className={button} onClick={() => void loadPublished()}>Загрузить опубликованные контуры</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Существующая разметка не заменяется без выбора при конфликте. Загрузите опубликованные контуры, если они отсутствуют в браузере.</p>
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
          <p className="text-sm font-semibold">Способ разметки</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={`${button} ${mode === 'manual' ? 'bg-[#16468c] text-white' : 'bg-white'}`} aria-pressed={mode === 'manual'} onClick={() => setMode('manual')}>Точки вручную</button>
            <button type="button" className={`${button} ${mode === 'assisted' ? 'bg-[#16468c] text-white' : 'bg-white'}`} aria-pressed={mode === 'assisted'} onClick={() => setMode('assisted')}>Найти контур по клику</button>
          </div>
          <p className="mt-2 text-sm text-slate-600">{mode === 'assisted' ? 'Введите номер аудитории и нажмите внутри неё на плане. Будет предложена граница по зелёным стенам. Проверьте, что выделено именно нужное помещение: открытая дверь может объединить соседние комнаты.' : 'Нажимайте на углы помещения, чтобы расставить точки вручную.'}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <input value={draft.roomId} readOnly={draft.originalId !== null} onChange={e => updateDraft({ ...draft, roomId: e.target.value })} placeholder="Номер аудитории" aria-label="Номер аудитории" className="min-w-40 flex-1 rounded-lg border border-slate-300 p-2 read-only:bg-slate-100" />
          <button type="button" className={button} title="Убрать последнюю точку" aria-label="Убрать последнюю точку" disabled={!draft.points.length} onClick={() => { updateDraft({ ...draft, points: draft.points.slice(0, -1) }); setSelectedVertex(null) }}><Undo2 size={18} /></button>
          <button type="button" className={button} title="Очистить точки черновика" aria-label="Очистить точки черновика" onClick={() => { if (window.confirm('Очистить точки черновика?')) { updateDraft({ ...draft, points: [] }); setSelectedVertex(null) } }}><RotateCcw size={18} /></button>
          <button type="button" disabled={!draft.roomId.trim() || Boolean(geometryError(draft.points))} onClick={savePolygon} className="rounded-lg bg-[#16468c] px-4 py-2 text-white disabled:opacity-40">Сохранить контур</button>
          <button type="button" className={button} disabled={!hasDraft} onClick={cancelDraft}>Отменить изменения</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">{draft.originalId ? `Редактируется ${draft.originalId}. Оригинал сохраняется до нажатия «Сохранить контур».` : 'Создание нового контура. Номер аудитории сохраняется как строка, включая начальные нули.'}</p>
        {draft.method === 'assisted' && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-900">Это предложенная граница. Проверьте стены и дверные участки перед сохранением. Её можно поправить вершинами.</p>}
        {validationError && <p className="mt-2 text-sm text-amber-800">{validationError}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span>Точек: {draft.points.length}</span>
          <button type="button" className={button} disabled={selectedVertex === null || draft.points.length <= 3} onClick={removeVertex}>Удалить выбранную вершину</button>
          <label className="flex items-center gap-2"><input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} />Подписи</label>
          <button type="button" aria-label="Уменьшить план редактора" className={button} onClick={() => setZoom(z => Math.max(1, z - 0.25))}>−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="Увеличить план редактора" className={button} onClick={() => setZoom(z => Math.min(4, z + 0.25))}>+</button>
        </div>
      </fieldset>
      <div className="mt-4 max-h-[700px] overflow-auto rounded-xl bg-slate-100 p-2">
        <div className="relative mx-auto" style={{ width: `${zoom * 100}%`, minWidth: '500px', aspectRatio: '1 / 1' }}>
          <img ref={imageRef} src={`${import.meta.env.BASE_URL}floorplans/floor-${floor}.png`} alt={`План ${floor} этажа`} className="absolute inset-0 h-full w-full select-none" draggable={false} />
          <svg ref={svgRef} viewBox="0 0 1000 1000" preserveAspectRatio="none" className="absolute inset-0 h-full w-full cursor-crosshair" style={{ touchAction: 'none' }} onClick={addPoint} onPointerMove={moveVertex} onPointerUp={stopDrag} onPointerCancel={stopDrag} onLostPointerCapture={() => { drag.current = null }}>
            {currentPolygons.map(polygon => <g key={polygon.id} pointerEvents="none">
              <polygon points={polygonPoints(polygon.points)} fill="#2563eb" fillOpacity={0.22} stroke="#1d4ed8" strokeWidth={2} vectorEffect="non-scaling-stroke" />
              {showLabels && <text x={polygon.points.reduce((s, p) => s + p[0], 0) / polygon.points.length} y={polygon.points.reduce((s, p) => s + p[1], 0) / polygon.points.length} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#1e3a8a">{polygon.id}</text>}
            </g>)}
            {draft.points.length > 0 && <g>
              <polyline points={polygonPoints(draft.points)} fill="none" stroke="#dc2626" strokeWidth={3} vectorEffect="non-scaling-stroke" pointerEvents="none" />
              {draft.points.length >= 3 && <line x1={draft.points.at(-1)![0]} y1={draft.points.at(-1)![1]} x2={draft.points[0][0]} y2={draft.points[0][1]} stroke="#dc2626" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" pointerEvents="none" />}
              {draft.points.length >= 2 && draft.points.map((p, i) => {
                if (i === draft.points.length - 1 && draft.points.length < 3) return null
                const next = draft.points[(i + 1) % draft.points.length]
                return <line key={`edge-${i}`} data-edge={i} x1={p[0]} y1={p[1]} x2={next[0]} y2={next[1]} stroke="transparent" strokeWidth={12} vectorEffect="non-scaling-stroke" className="cursor-copy" onClick={e => insertVertex(e, i)}><title>Нажмите, чтобы добавить вершину</title></line>
              })}
              {draft.points.map(([x, y], index) => <circle key={index} data-vertex={index} cx={x} cy={y} r={7 / zoom} fill={selectedVertex === index ? '#f59e0b' : '#dc2626'} stroke="white" strokeWidth={1} className="cursor-move" role="button" aria-label={`Вершина ${index + 1}`} tabIndex={busy || detecting || pendingImport ? -1 : 0} onPointerDown={e => startDrag(e, index)} onClick={e => { e.stopPropagation(); suppressClick.current = false; if (!busy && !pendingImport && !detection.current) setSelectedVertex(index) }} onKeyDown={e => {
                if (busy || pendingImport || detection.current) return
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedVertex(index) }
                if (e.key === 'Delete' && draft.points.length > 3) { e.preventDefault(); updateDraft({ ...draft, points: draft.points.filter((_, i) => i !== index) }); setSelectedVertex(null) }
              }}><title>Вершина {index + 1}: {x}, {y}</title></circle>)}
            </g>}
          </svg>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">На этаже: {currentPolygons.length} · Всего: {polygons.length}</p>
        <button type="button" disabled={busy} onClick={() => exportJSON()} className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-40"><Download size={16} />Экспорт JSON</button>
        {hasDraft && <button type="button" className={button} onClick={() => exportJSON(true)}>Скачать черновик</button>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {currentPolygons.map(polygon => <div key={polygon.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <button type="button" disabled={busy || detecting || Boolean(pendingImport)} onClick={() => editPolygon(polygon)} className="font-medium text-blue-700" title="Изменить контур">{polygon.id}</button>
          <button type="button" disabled={busy || detecting || Boolean(pendingImport) || draft.originalId === polygon.id} onClick={() => removePolygon(polygon)} title={`Удалить контур ${polygon.id}`} aria-label={`Удалить контур ${polygon.id}`} className="text-red-600 disabled:opacity-40"><Trash2 size={15} /></button>
        </div>)}
      </div>
      <p className="mt-4 text-xs text-slate-500">Черновик сохраняется отдельно для каждого этажа и восстанавливается при открытии. Экспорт JSON включает только сохранённые контуры всех этажей; сначала сохраните нужный черновик. «Скачать черновик» — отдельная резервная копия, не файл для публикации. Для публикации замените public/data/room-polygons.json в репозитории экспортированным файлом. Просмотрщик показывает опубликованную версию.</p>
    </section>
  )
}

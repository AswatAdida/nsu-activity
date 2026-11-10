// Coordinates use the viewer's SVG viewBox (0–1000), not image pixels.
export type Point = [number, number]
export type RoomPolygon = {
  id: string
  buildingId: string
  floor: number
  points: Point[]
}

export const polygonKey = (p: Pick<RoomPolygon, 'buildingId' | 'floor' | 'id'>) =>
  JSON.stringify([p.buildingId, p.floor, p.id])

const EPS = 1e-8
const cross = (a: Point, b: Point, c: Point) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])

function onSegment(a: Point, b: Point, p: Point) {
  return Math.abs(cross(a, b, p)) < EPS &&
    p[0] >= Math.min(a[0], b[0]) - EPS && p[0] <= Math.max(a[0], b[0]) + EPS &&
    p[1] >= Math.min(a[1], b[1]) - EPS && p[1] <= Math.max(a[1], b[1]) + EPS
}

function intersects(a: Point, b: Point, c: Point, d: Point) {
  const abC = cross(a, b, c), abD = cross(a, b, d)
  const cdA = cross(c, d, a), cdB = cross(c, d, b)
  return ((abC > EPS && abD < -EPS || abC < -EPS && abD > EPS) &&
    (cdA > EPS && cdB < -EPS || cdA < -EPS && cdB > EPS)) ||
    onSegment(a, b, c) || onSegment(a, b, d) ||
    onSegment(c, d, a) || onSegment(c, d, b)
}

export function isPoint(value: unknown): value is Point {
  return Array.isArray(value) && value.length === 2 &&
    value.every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1000)
}

export function geometryError(points: Point[]): string | null {
  if (points.length < 3) return 'Нужно минимум три вершины.'
  if (!points.every(isPoint)) return 'Координаты должны быть числами от 0 до 1000.'
  if (new Set(points.map(p => JSON.stringify(p))).size !== points.length)
    return 'Вершины повторяются. Последнюю точку не нужно совмещать с первой.'
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length]
    const c = points[(i + 2) % points.length]
    area += a[0] * b[1] - b[0] * a[1]
    if (Math.abs(cross(a, b, c)) < EPS &&
      (a[0] - b[0]) * (c[0] - b[0]) + (a[1] - b[1]) * (c[1] - b[1]) > EPS)
      return 'Соседние рёбра накладываются друг на друга.'
    for (let j = i + 2; j < points.length; j++) {
      if (i === 0 && j === points.length - 1) continue
      if (intersects(a, b, points[j], points[(j + 1) % points.length]))
        return 'Контур пересекает или касается сам себя.'
    }
  }
  return Math.abs(area) < EPS ? 'Площадь контура равна нулю.' : null
}

export function parsePolygons(value: unknown): RoomPolygon[] {
  if (!Array.isArray(value)) throw new Error('Ожидается массив контуров JSON.')
  const keys = new Set<string>()
  return value.map((item, index) => {
    const label = `Контур ${index + 1}`
    if (!item || typeof item !== 'object' ||
      typeof item.id !== 'string' || !item.id.trim() || item.id !== item.id.trim() ||
      typeof item.buildingId !== 'string' || !item.buildingId.trim() ||
      item.buildingId !== item.buildingId.trim() ||
      !Number.isInteger(item.floor) || !Array.isArray(item.points) || !item.points.every(isPoint))
      throw new Error(`${label}: неверные поля id, buildingId, floor или points. Номер аудитории должен быть строкой.`)
    const error = geometryError(item.points)
    if (error) throw new Error(`${label} (${item.id}): ${error}`)
    const key = polygonKey(item)
    if (keys.has(key)) throw new Error(`${label}: повтор здания, этажа и номера аудитории.`)
    keys.add(key)
    return { id: item.id, buildingId: item.buildingId, floor: item.floor,
      points: item.points.map(([x, y]: Point): Point => [x, y]) }
  })
}

export function mergePolygons(current: RoomPolygon[], incoming: RoomPolygon[], replace: boolean) {
  const result = new Map(current.map(p => [polygonKey(p), p]))
  for (const polygon of incoming) {
    const key = polygonKey(polygon)
    if (replace || !result.has(key)) result.set(key, polygon)
  }
  return [...result.values()]
}

export function conflictingPolygons(current: RoomPolygon[], incoming: RoomPolygon[]) {
  const existing = new Map(current.map(p => [polygonKey(p), p]))
  return incoming.filter(p => {
    const previous = existing.get(polygonKey(p))
    return previous && JSON.stringify(previous.points) !== JSON.stringify(p.points)
  })
}

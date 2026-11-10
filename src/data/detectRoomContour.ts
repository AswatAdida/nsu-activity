export type PixelImage = { width: number; height: number; data: ArrayLike<number> }
export type DetectionResult = { points: [number, number][]; areaPixels: number }

// Same green-wall rule and pixel-boundary method as tools/detect_room.py.
// This identifies a connected area, not the room number or its purpose.
export function detectRoomContour(image: PixelImage, seed: [number, number], maxFraction = 0.05): DetectionResult {
  const { width, height, data } = image
  const total = width * height
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2 ||
    total > 16_777_216 || data.length !== total * 4 || !(maxFraction > 0 && maxFraction <= 1)) {
    throw new Error('Не удалось прочитать изображение плана.')
  }
  const [sx, sy] = seed
  if (!Number.isInteger(sx) || !Number.isInteger(sy) || sx < 0 || sx >= width || sy < 0 || sy >= height) {
    throw new Error('Нажмите внутри помещения, вдали от края плана.')
  }
  // 0 = free pixel, 1 = green wall, 2 = selected interior.
  const mask = new Uint8Array(total)
  for (let i = 0; i < total; i++) {
    const red = data[i * 4], green = data[i * 4 + 1], blue = data[i * 4 + 2]
    mask[i] = green > 100 && green > red * 1.25 && green > blue * 1.25 ? 1 : 0
  }
  const seedIndex = sy * width + sx
  if (mask[seedIndex] === 1 || data[seedIndex * 4 + 3] === 0) {
    throw new Error('Выбрана стена или пустая часть плана. Нажмите внутри аудитории.')
  }
  const limit = Math.floor(total * maxFraction)
  const queue = new Uint32Array(limit + 1)
  queue[0] = seedIndex
  mask[seedIndex] = 2
  let tail = 1
  for (let head = 0; head < tail; head++) {
    const index = queue[head], x = index % width, y = Math.floor(index / width)
    if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
      throw new Error('Область выходит за край плана. Выберите другую точку или ручной режим.')
    }
    for (const next of [index + 1, index - 1, index + width, index - width]) {
      if (mask[next] !== 0) continue
      if (tail >= limit) throw new Error('Область слишком большая — возможно, это коридор или открытая дверь. Используйте ручной режим.')
      mask[next] = 2
      queue[tail++] = next
    }
  }

  const stride = width + 1
  const edges = new Map<number, number>()
  let start = -1, startX = Infinity, startY = Infinity
  function edge(x1: number, y1: number, x2: number, y2: number) {
    const a = y1 * stride + x1
    if (edges.has(a)) throw new Error('Граница неоднозначна. Попробуйте ручной режим.')
    edges.set(a, y2 * stride + x2)
    if (x1 < startX || x1 === startX && y1 < startY) {
      start = a; startX = x1; startY = y1
    }
  }
  for (let i = 0; i < tail; i++) {
    const index = queue[i], x = index % width, y = Math.floor(index / width)
    if (mask[index - width] !== 2) edge(x, y, x + 1, y)
    if (mask[index + 1] !== 2) edge(x + 1, y, x + 1, y + 1)
    if (mask[index + width] !== 2) edge(x + 1, y + 1, x, y + 1)
    if (mask[index - 1] !== 2) edge(x, y + 1, x, y)
  }
  let point = start
  const visited = new Set<number>()
  const boundary: [number, number][] = []
  while (!visited.has(point)) {
    visited.add(point)
    boundary.push([point % stride, Math.floor(point / stride)])
    const next = edges.get(point)
    if (next === undefined) throw new Error('Граница не замкнута. Используйте ручной режим.')
    point = next
  }
  if (point !== start || visited.size !== edges.size) {
    throw new Error('В области есть внутренние препятствия или несколько границ. Используйте ручной режим.')
  }
  const corners = boundary.filter((p, i) => {
    const a = boundary[(i + boundary.length - 1) % boundary.length], b = boundary[(i + 1) % boundary.length]
    return (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]) !== 0
  })
  if (corners.length > 512) throw new Error('Граница слишком сложная. Попробуйте ручной режим.')

  // Match Python's ties-to-even rounding when a coordinate is exactly halfway.
  const normalize = (coordinate: number, size: number) => {
    const scaled = coordinate * 10000, lower = Math.floor(scaled / size), remainder = scaled % size
    return (remainder * 2 === size ? lower + lower % 2 : Math.round(scaled / size)) / 10
  }
  const points: [number, number][] = corners.map(([x, y]) => [normalize(x, width), normalize(y, height)])
  if (new Set(points.map(p => p.join(','))).size !== points.length) {
    throw new Error('Слишком мелкие детали границы. Используйте ручной режим.')
  }
  return { points, areaPixels: tail }
}

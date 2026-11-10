import type { DetectionResult } from './detectRoomContour'
import type { Point } from './roomPolygons'

// Read only the original floor-plan image, never the overlaid SVG contours.
export function suggestRoomContour(image: HTMLImageElement, point: Point, signal: AbortSignal): Promise<DetectionResult> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Поиск отменён', 'AbortError')); return }
    if (!image.complete || !image.naturalWidth || !image.naturalHeight) {
      reject(new Error('План ещё не загружен. Дождитесь изображения и повторите поиск.')); return
    }
    let worker: Worker | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    function cleanup() { worker?.terminate(); clearTimeout(timer); signal.removeEventListener('abort', abort) }
    function abort() { cleanup(); reject(new DOMException('Поиск отменён', 'AbortError')) }
    try {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) throw new Error('Браузер не поддерживает поиск по изображению. Используйте ручной режим.')
      context.drawImage(image, 0, 0)
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
      worker = new Worker(new URL('./roomDetection.worker.ts', import.meta.url), { type: 'module' })
      signal.addEventListener('abort', abort, { once: true })
      timer = setTimeout(() => { cleanup(); reject(new Error('Поиск занял слишком много времени. Попробуйте ручной режим.')) }, 15000)
      worker.onmessage = (event: MessageEvent<{ result?: DetectionResult; error?: string }>) => {
        cleanup()
        if (event.data.error) reject(new Error(event.data.error))
        else if (event.data.result) resolve(event.data.result)
        else reject(new Error('Не удалось прочитать найденную границу.'))
      }
      worker.onerror = event => { event.preventDefault(); cleanup(); reject(new Error('Не удалось запустить поиск. Используйте ручной режим.')) }
      worker.postMessage({ width: canvas.width, height: canvas.height, pixels: pixels.buffer,
        seed: [Math.floor(point[0] / 1000 * canvas.width), Math.floor(point[1] / 1000 * canvas.height)] }, [pixels.buffer])
    } catch (error) { cleanup(); reject(error) }
  })
}

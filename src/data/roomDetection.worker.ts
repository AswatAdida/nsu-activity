import { detectRoomContour } from './detectRoomContour'

self.addEventListener('message', (event: MessageEvent<{
  width: number; height: number; pixels: ArrayBuffer; seed: [number, number]
}>) => {
  try {
    const { width, height, pixels, seed } = event.data
    const result = detectRoomContour({ width, height, data: new Uint8ClampedArray(pixels) }, seed)
    self.postMessage({ result })
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Не удалось найти границу.' })
  }
})

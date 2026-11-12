// Run after npm run build. Browser binaries: npx playwright install chromium,
// or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to a system Chromium executable.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { checkStudentPlanner } from './studentBrowserChecks.mjs'
import { checkVisualCatalog } from './catalogVisualChecks.mjs'

const port = process.env.CAMPUS_TEST_PORT ?? '4173'
const origin = `http://127.0.0.1:${port}`
const base = `${origin}/nsu-activity/`
const artifacts = resolve('work/browser-artifacts')
await mkdir(artifacts, { recursive: true })
const server = spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', port, '--strictPort'], { stdio: 'pipe' })
let serverOutput = ''
server.stdout.on('data', chunk => { serverOutput += chunk })
server.stderr.on('data', chunk => { serverOutput += chunk })
let browser
try {
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Preview exited: ${serverOutput}`)
    try { if ((await fetch(base)).ok) { ready = true; break } } catch { /* starting */ }
    await delay(100)
  }
  assert.ok(ready, `Preview failed to start: ${serverOutput}`)
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, headless: true })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'ru-RU', timezoneId: 'America/New_York' })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  const section = page.locator('#campus-activity')
  const input = page.getByLabel('Дата и время в Новосибирске')
  const site = id => page.locator(`path[data-site-id="${id}"]`)
  const room = id => page.locator(`polygon[data-room-id="${id}"]`)
  const card = page.locator('[data-building-card]')
  const choose = async id => {
    await page.locator(`[data-building-id="${id}"]`).click()
    await page.locator(`[data-building-card="${id}"]`).waitFor()
  }
  const back = async () => {
    await section.getByRole('button', { name: '← К общей карте кампуса', exact: true }).click()
    await site('academic-1').waitFor()
  }
  const fillTime = async value => {
    await input.fill(value)
    await section.getByRole('status').filter({ hasText: value.replace('T', ' ') }).waitFor()
  }
  const hasColor = async (locator, color) => {
    await locator.waitFor()
    await page.waitForFunction(({ selector, color }) => document.querySelector(selector)?.getAttribute('fill') === color, { selector: await locator.evaluate(el => el.tagName === 'path' ? `path[data-site-id="${el.dataset.siteId}"]` : `polygon[data-room-id="${el.dataset.roomId}"]`), color })
  }
  const noOverflow = async label => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, label)

  await site('academic-1').waitFor()
  assert.equal(await page.locator('path[data-site-id]').count(), 6)
  assert.equal(await page.locator('[data-building-id]').count(), 6)
  await page.getByLabel('Выбрать дату и время', { exact: true }).check()
  await fillTime('2026-11-13T18:30')
  await hasColor(site('sports-new'), '#16a34a')
  await hasColor(site('stc'), '#94a3b8')
  // Actual pointer click on a footprint and keyboard activation on another.
  await site('sports-old').click({ force: true })
  await page.locator('[data-building-card="sports-old"]').waitFor()
  assert.ok(await card.getByRole('heading', { name: 'Встречи и расписания', exact: true }).count())
  assert.equal(await page.locator('path[data-site-id][stroke-dasharray]').count(), 0)
  await site('academic-1').focus()
  await page.keyboard.press('Enter')
  await page.locator('[data-building-card="academic-1"]').waitFor()
  await choose('stc')
  assert.ok(await card.getByText('В базе нет сведений о мероприятиях.', { exact: false }).count())
  assert.equal(await page.locator('[data-building-id="dorm-5-annex"]').count(), 0)
  await choose('dorm-5')
  assert.ok(await card.getByText('Репетиционный зал', { exact: false }).count())
  await choose('academic-1')
  await fillTime('2026-11-14T18:30')
  await hasColor(site('academic-1'), '#16a34a')
  await card.getByRole('button', { name: 'Открыть этажи и помещения' }).click()
  await room('academic-1-3314').waitFor()
  assert.equal(await page.getByLabel('Выбрать дату и время', { exact: true }).count(), 1)
  await hasColor(room('academic-1-3314'), '#16a34a')
  await room('academic-1-3314').click()
  assert.equal(await room('academic-1-3314').getAttribute('aria-pressed'), 'true')
  assert.equal(await room('academic-1-3314').getAttribute('fill'), '#16a34a')
  // Selection/focus outlines follow the polygon at every zoom, never its rectangle.
  const chosen = room('academic-1-3314')
  const sourcePoints = await chosen.getAttribute('points')
  await chosen.focus()
  await page.keyboard.press('Enter')
  for (let step = 0; step <= 8; step++) {
    assert.equal(await chosen.evaluate(el => getComputedStyle(el).outlineStyle), 'none')
    assert.equal(await chosen.evaluate(el => getComputedStyle(el).strokeWidth), '5px')
    assert.equal(await chosen.getAttribute('vector-effect'), 'non-scaling-stroke')
    assert.equal(await chosen.getAttribute('points'), sourcePoints)
    if (step < 8) await page.getByRole('button', { name: 'Увеличить', exact: true }).click()
  }
  await page.getByRole('button', { name: 'Сбросить масштаб', exact: true }).click()
  assert.equal(await page.locator('polygon[stroke-dasharray]').count(), 0)
  assert.equal((await page.getByLabel('Легенда активности').textContent()).includes('?'), false)
  const grey = page.locator('polygon[data-activity="no-data"]').first()
  await grey.dispatchEvent('click')
  assert.ok(await section.getByText('Сведений о регулярных мероприятиях в нашей базе пока нет.', { exact: true }).count())

  let total = 0
  for (let floor = 0; floor <= 5; floor++) {
    await page.getByRole('button', { name: `${floor} этаж`, exact: true }).click()
    const polygons = page.locator('polygon[data-polygon-id]')
    await polygons.first().waitFor()
    const count = await polygons.count()
    total += count
    for (let index = 0; index < count; index++) {
      const polygon = polygons.nth(index)
      await polygon.dispatchEvent('click')
      assert.equal(await polygon.getAttribute('aria-pressed'), 'true')
      assert.ok(await polygon.getAttribute('data-room-id'))
    }
    await noOverflow(`390px floor ${floor}`)
    console.log(`Floor ${floor}: selected ${count} physical contours`)
  }
  assert.equal(total, 480)
  await fillTime('2026-11-15T18:29')
  await hasColor(room('academic-1-5222'), '#2563eb')
  await fillTime('2026-11-15T18:30')
  await hasColor(room('academic-1-5222'), '#2563eb')
  assert.equal(await page.locator('polygon[data-activity="scheduled"]').count(), 0)
  await page.getByRole('button', { name: '2 этаж', exact: true }).click()
  await room('academic-1-2241').waitFor()
  await fillTime('2026-11-14T18:30')
  await hasColor(room('academic-1-2241'), '#2563eb')
  await hasColor(room('academic-1-2323'), '#9333ea')
  // Search changes both the building and room, without a second building search.
  await page.getByLabel('Поиск аудитории').fill('309')
  await page.getByRole('button', { name: 'Аудитория 309', exact: false }).click()
  assert.equal(await page.locator('#building-select').inputValue(), 'sports-new')
  assert.equal(await page.locator('polygon[data-polygon-id]').count(), 0)
  assert.ok(await section.getByText('План этого здания пока не загружен', { exact: true }).count())
  assert.equal(await section.getByText('Длительность принята равной 1 часу;', { exact: false }).count(), 0)
  assert.ok(await section.getByText('Воскресенье · 17:30', { exact: true }).count())
  await back()
  assert.equal(await input.inputValue(), '2026-11-14T18:30')
  await hasColor(site('academic-1'), '#16a34a')

  await choose('academic-1')
  await card.getByRole('button', { name: 'Открыть этажи и помещения' }).click()
  await room('academic-1-3314').waitFor()
  await page.getByRole('button', { name: 'Редактировать контуры помещений' }).click()
  await page.getByRole('heading', { name: 'Редактор контуров · 3 этаж', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Закрыть редактор' }).click()
  assert.equal(await page.locator('polygon[data-polygon-id]').count(), 87)
  await noOverflow('390px editor closed')
  await back()
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await noOverflow(`${width}px campus`)
    await section.screenshot({ path: `${artifacts}/campus-${width}.png` })
  }
  await input.fill('')
  await section.getByRole('status').filter({ hasText: 'Введите корректные дату и время' }).waitFor()
  assert.equal(await page.locator('path[data-site-id][fill="#16a34a"]').count(), 0)
  await page.getByLabel('Сейчас', { exact: true }).check()
  assert.equal(await input.count(), 0)
  await checkStudentPlanner(page, artifacts)
  await checkVisualCatalog(page, artifacts)
  // Network failure must not remove local map geometry or navigation.
  await page.route('https://tile.openstreetmap.org/**', route => route.abort())
  await page.reload({ waitUntil: 'domcontentloaded' })
  await site('academic-1').waitFor()
  await section.getByRole('status').filter({ hasText: 'Фон OpenStreetMap не загрузился' }).waitFor()
  assert.equal(await page.locator('path[data-site-id]').count(), 6)
  await choose('academic-1')
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ contours: total, places: 6, sourceBuildingIds: 10, sites: 6, widths: [320, 390, 1440], sharedTime: true, editor: true, noPlanNavigation: true, updatedTraining: true, keyboard: true, tileFailureFallback: true, pageErrors: errors }))
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}

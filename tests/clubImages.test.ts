import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import rawClubs from '../src/data/clubs.json' with { type: 'json' }
import manifest from '../src/data/club-image-manifest.json' with { type: 'json' }
import { primaryClubImage, type Club } from '../src/types/club.ts'
const clubs = rawClubs as Club[]
function webpDimensions(bytes: Buffer) {
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF')
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP')
  for (let offset = 12; offset + 8 < bytes.length;) {
    const kind = bytes.toString('ascii', offset, offset + 4), length = bytes.readUInt32LE(offset + 4), data = offset + 8
    if (kind === 'VP8X') return { width: bytes.readUIntLE(data + 4, 3) + 1, height: bytes.readUIntLE(data + 7, 3) + 1 }
    if (kind === 'VP8L') {
      assert.equal(bytes[data], 0x2f)
      const bits = bytes.readUInt32LE(data + 1)
      return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 }
    }
    offset += 8 + length + (length % 2)
  }
  throw new Error('Lossless WebP image dimensions missing')
}
test('all 32 archive inputs are reviewed and the only duplicate is accounted for', () => {
  assert.equal(manifest.length, 32)
  assert.equal(clubs.filter(club => primaryClubImage(club)).length, 23)
  const duplicate = manifest.find(image => image.originalFile === 'jven.jpg')!
  assert.equal(duplicate.duplicateOf, 'омут.jpg')
  assert.equal(duplicate.sha256, manifest.find(image => image.originalFile === 'омут.jpg')!.sha256)
  assert.equal(manifest.filter(image => image.duplicateOf).length, 1)
})
test('web assets exist, are proportional, never upscaled, losslessly encoded and correctly described', () => {
  for (const source of manifest) {
    if (source.duplicateOf || source.excluded) continue
    const club = clubs.find(club => club.id === source.clubId)!
    const media = club[source.role as 'photo' | 'logo' | 'banner']!
    assert.ok(media.alt.length > 15)
    assert.equal(media.fit, source.fit)
    for (const variant of media.variants) {
      assert.match(variant.src, /^images\/clubs\/[a-z0-9-]+\.webp$/)
      const bytes = readFileSync(new URL(`../public/${variant.src}`, import.meta.url))
      assert.deepEqual(webpDimensions(bytes), { width: variant.width, height: variant.height })
      assert.equal(bytes.length, variant.bytes)
      assert.ok(variant.width <= source.sourceWidth! && variant.height <= source.sourceHeight!)
      assert.ok(Math.abs(variant.width / source.sourceWidth! - variant.height / source.sourceHeight!) <= 1 / source.sourceWidth! + 1 / source.sourceHeight!)
      assert.ok(bytes.includes(Buffer.from('VP8L')), 'Lossless pixels; no lossy VP8 conversion')
    }
  }
})
test('photos outrank logos, logos outrank banners, banners outrank placeholders', () => {
  for (const club of clubs) {
    assert.equal(primaryClubImage(club), club.photo ?? club.logo ?? club.banner)
    for (const media of [club.photo, club.logo, club.banner]) if (media) assert.equal(media.fit, 'contain')
  }
  for (const id of ['dansu', 'fire', 'russian-speaking', 'mountain-tourism', 'ethno']) {
    const club = clubs.find(club => club.id === id)!
    assert.equal(primaryClubImage(club), club.photo)
    assert.equal(primaryClubImage(club)!.kind, 'photo')
  }
  const club = clubs.find(club => club.id === 'craft')!
  assert.equal(primaryClubImage(club), club.logo)
  assert.equal(primaryClubImage({ ...club, logo: undefined }), club.banner)
  assert.equal(primaryClubImage({ ...club, logo: undefined, banner: undefined }), undefined)
  assert.equal(clubs.find(club => club.id === 'bridge')!.logo!.width, 200)
})
test('clubs without photos or emblems use their supplied artwork before a placeholder', () => {
  for (const id of ['mtg', 'mafia', 'taverna']) {
    const club = clubs.find(club => club.id === id)!
    assert.ok(club.banner)
    assert.equal(primaryClubImage(club), club.banner)
  }
  assert.equal(clubs.filter(club => !primaryClubImage(club)).length, 10)
})

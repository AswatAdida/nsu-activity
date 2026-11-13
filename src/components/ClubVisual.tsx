import { useState } from 'react'
import { primaryClubImage, type Club, type ClubImage } from '../types/club'

export function ClubVisual({ club, image = primaryClubImage(club), compact = false }: { club: Club; image?: ClubImage; compact?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  if (!image || failedSrc === image.src) return <div className={compact ? 'club-avatar placeholder' : 'club-media placeholder'} role="img" aria-label={`Изображение объединения «${club.name}» пока не добавлено`}>
    <span className="placeholder-monogram" aria-hidden="true">{club.shortName ?? club.name.split(/\s+/).slice(0, 2).map(word => word[0]).join('')}</span>
    {!compact && <span className="placeholder-caption" aria-hidden="true">СООБЩЕСТВО НГУ</span>}
  </div>
  const fullSrc = `${import.meta.env.BASE_URL}${image.src}`
  const picture = <img src={fullSrc} srcSet={image.variants.map(variant => `${import.meta.env.BASE_URL}${variant.src} ${variant.width}w`).join(', ')} sizes={compact ? '64px' : image.kind === 'logo' ? '240px' : '(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) calc((100vw - 60px)/2), 370px'} width={image.width} height={image.height} alt={image.alt} loading="lazy" decoding="async" onError={() => setFailedSrc(image.src)} style={{ objectFit: compact ? 'contain' : image.fit, objectPosition: image.position ?? '50% 50%', maxWidth: compact || image.fit === 'contain' ? `min(100%, ${image.width}px)` : undefined, maxHeight: compact || image.fit === 'contain' ? `min(100%, ${image.height}px)` : undefined }} />
  return <div className={`${compact ? 'club-avatar' : 'club-media'} media-${image.kind} fit-${image.fit}`} data-image-kind={image.kind} data-image-fit={image.fit} style={{ backgroundColor: image.background ?? '#eef2f6' }}>
    {compact ? picture : <a href={fullSrc} target="_blank" rel="noreferrer" aria-label={`Открыть изображение: ${club.name}`}>{picture}</a>}
  </div>
}

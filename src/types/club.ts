import type { DataSource } from '../data/campusTypes'

export type ClubImage = {
  src: string
  width: number
  height: number
  alt: string
  kind: 'photo' | 'logo' | 'banner' | 'illustration'
  fit: 'cover' | 'contain'
  position?: string
  background?: string
  variants: { src: string; width: number; height: number; bytes: number }[]
}

export type Club = {
  id: string
  name: string
  category: string
  shortName?: string
  photo?: ClubImage
  logo?: ClubImage
  banner?: ClubImage
  description: string
  schedule: string
  location: string
  attendance: string
  url: string
  status: 'active' | 'inactive'
  baseRoomIds?: string[]
  scheduleStatus?: 'reported' | 'needs-confirmation'
  sources?: DataSource[]
  notes?: string[]
}

// One selection rule for all full-size club visuals.
export function primaryClubImage(club: Club): ClubImage | undefined {
  return club.photo ?? club.logo ?? club.banner
}

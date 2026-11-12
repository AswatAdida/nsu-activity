
export type DataSource = {
  kind: 'user-message' | 'poster' | 'floor-plan'
  recordedOn: string
  url?: string
  note?: string
}

export type CampusSite = {
  id: string
  name: string
  address: string
  buildingIds: string[]
  sharedInterior: boolean
  center: [number, number]
  rings: [number, number][][] // outer ring, then holes; latitude, longitude
  source: { url: string; version: number; checkedOn: string }
  geometrySources: { url: string; version: number; checkedOn: string }[]
}

export type Building = {
  id: string
  name: string
  address: string | null
  type: 'academic' | 'dormitory' | 'sports' | 'cultural' | 'other'
  coordinates: [number, number] | null
  floors: number[]
  mapSiteId?: string
  geographyNote?: string
}

export type CampusRoom = {
  id: string
  buildingId: string
  number: string | null
  name: string
  floor: number | null
  block: string | null
  kind: 'classroom' | 'dance' | 'sports' | 'studio' | 'other'
  planPosition: {
    x: number
    y: number
  } | null
  sources?: DataSource[]
}

export type WeeklyPattern =
  | { kind: 'weekly' }
  | { kind: 'interval'; weeks: number; anchorDate?: string }
  | { kind: 'weeks'; cycleWeeks: number; weeks: number[]; anchorDate?: string }

export type RecurrenceRule = WeeklyPattern
  | { kind: 'seasonal'; months: number[]; pattern: WeeklyPattern }
  | { kind: 'announced'; dates?: string[] }
  | { kind: 'unknown' }

export type ActivitySession = {
  id: string
  clubId?: string
  clubName: string
  roomId: string | null
  alternativeRoomIds?: string[]
  buildingId?: string
  locationNote?: string
  locationKind?: 'indoor' | 'outdoor'
  validityNeedsClarification?: boolean
  dayOfWeek: number | null // 1 = понедельник, 7 = воскресенье
  startTime: string | null
  endTime: string | null
  recurrence: string
  recurrenceRule?: RecurrenceRule // Structured rule; the original description remains intact.
  attendanceMin: number | null
  attendanceMax: number | null
  locationStatus: 'confirmed' | 'approximate' | 'unknown'
  scheduleStatus?: 'confirmed' | 'reported' | 'needs-confirmation'
  // Inclusive local dates in Asia/Novosibirsk; absent bounds mean no stated limit.
  validFrom?: string
  validUntil?: string
  source?: DataSource
  catalogSource?: { clubId: string; schedule: string; location: string }
  notes?: string[]
}

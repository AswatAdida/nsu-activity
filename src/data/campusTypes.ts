
export type Building = {
  id: string
  name: string
  address: string | null
  type: 'academic' | 'dormitory' | 'sports' | 'cultural' | 'other'
  coordinates: [number, number] | null
  floors: number[]
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
}

export type ActivitySession = {
  id: string
  clubName: string
  roomId: string | null
  dayOfWeek: number | null // 1 = понедельник, 7 = воскресенье
  startTime: string | null
  endTime: string | null
  recurrence: string
  attendanceMin: number | null
  attendanceMax: number | null
  locationStatus: 'confirmed' | 'approximate' | 'unknown'
}

import type { DataSource } from '../data/campusTypes'

export type Club = {
  id: string
  name: string
  category: string
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

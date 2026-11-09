
import type { Building } from './campusTypes'

export const buildings: Building[] = [
  {
    id: 'academic-1',
    name: 'Учебный корпус № 1 НГУ',
    address: 'Пирогова, 1',
    type: 'academic',
    coordinates: null,
    floors: [0, 1, 2, 3, 4, 5],
  },
  {
    id: 'dorm-6-annex',
    name: 'Пристройка общежития № 6',
    address: 'Пирогова, 16',
    type: 'dormitory',
    coordinates: null,
    floors: [],
  },
  {
    id: 'dorm-5',
    name: 'Общежитие № 5',
    address: null,
    type: 'dormitory',
    coordinates: null,
    floors: [],
  },
  {
    id: 'sports-12-1',
    name: 'Спортивные помещения, Пирогова 12/1',
    address: 'Пирогова, 12/1',
    type: 'sports',
    coordinates: null,
    floors: [],
  },
  {
    id: 'stc',
    name: 'СТЦ НГУ',
    address: null,
    type: 'cultural',
    coordinates: null,
    floors: [],
  },
]

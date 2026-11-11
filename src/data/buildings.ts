
import type { Building } from './campusTypes'
import { campusSites } from './campusSites.ts'

const records: Building[] = [
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
  {
    "id": "sports-new",
    "name": "Новый спорткомплекс НГУ",
    "address": null,
    "type": "sports",
    "coordinates": null,
    "floors": []
  },
  {
    "id": "sports-old",
    "name": "Старый спорткомплекс НГУ",
    "address": null,
    "type": "sports",
    "coordinates": null,
    "floors": []
  },
  {
    "id": "sports-shooting",
    "name": "Тир НГУ, Пирогова, 12",
    "address": "Пирогова, 12",
    "type": "sports",
    "coordinates": null,
    "floors": []
  },
  {
    "id": "dorm-5-annex",
    "name": "Пристройка общежития № 5",
    "address": null,
    "type": "dormitory",
    "coordinates": null,
    "floors": []
  },
  {
    "id": "dorm-6",
    "name": "Общежитие № 6",
    "address": null,
    "type": "dormitory",
    "coordinates": null,
    "floors": []
  },
]

// Retain logical IDs and room/session references while sharing verified physical footprints.
export const buildings: Building[] = records.map(building => {
  const site = campusSites.find(site => site.buildingIds.includes(building.id))
  return {
    ...building,
    address: site?.address ?? building.address,
    coordinates: site?.center ?? null,
    mapSiteId: site?.id,
    geographyNote: building.id.endsWith('-annex')
      ? 'Показан общий контур общежития. Отдельная граница и вход пристройки не установлены.'
      : building.id === 'stc'
        ? 'СТЦ расположен в пристройке по адресу Пирогова, 6. Показан общий контур здания; граница зала не установлена.'
        : site?.sharedInterior
          ? 'Несколько записей справочника относятся к одному физическому зданию; встречи и помещения показаны совместно.'
          : undefined,
  }
})

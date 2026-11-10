
import type { CampusRoom } from './campusTypes'
import { userDigitizedRooms } from './userDigitizedRooms.ts'

export const campusRooms: CampusRoom[] = [
  {
    id: 'academic-1-0250',
    buildingId: 'academic-1',
    number: '0250',
    name: 'Кабинет 0250',
    floor: 0,
    block: '2',
    kind: 'other',
    planPosition: null,
  },
  {
    id: 'academic-1-1332',
    buildingId: 'academic-1',
    number: '1332',
    name: 'Аудитория 1332',
    floor: 1,
    block: '3',
    kind: 'classroom',
    planPosition: null,
  },
  {
    id: 'academic-1-2348',
    buildingId: 'academic-1',
    number: '2348',
    name: 'Аудитория 2348',
    floor: 2,
    block: '3',
    kind: 'classroom',
    planPosition: null,
  },
  {
    id: 'academic-1-3314',
    buildingId: 'academic-1',
    number: '3314',
    name: 'Аудитория 3314',
    floor: 3,
    block: '3',
    kind: 'classroom',
    planPosition: null,
  },
  {
    id: 'academic-1-5272',
    buildingId: 'academic-1',
    number: '5272',
    name: 'Аудитория 5272',
    floor: 5,
    block: '2',
    kind: 'classroom',
    planPosition: null,
  },
  {
    id: 'dorm-6-dance',
    buildingId: 'dorm-6-annex',
    number: null,
    name: 'Танцевальный зал',
    floor: null,
    block: null,
    kind: 'dance',
    planPosition: null,
  },
  {
    id: 'sports-aerobics',
    buildingId: 'sports-12-1',
    number: null,
    name: 'Зал аэробики',
    floor: null,
    block: null,
    kind: 'sports',
    planPosition: null,
  },
  {
    "id": "academic-1-5222",
    "buildingId": "academic-1",
    "number": "5222",
    "name": "Аудитория 5222",
    "floor": 5,
    "block": "2",
    "kind": "classroom",
    "planPosition": null,
    "sources": [
      {
        "kind": "floor-plan",
        "recordedOn": "2026-11-10",
        "note": "Этаж и номер сопоставлены с public/floorplans/floor-5.png; геометрия здесь не задаётся."
      }
    ]
  },
  {
    "id": "academic-1-3266",
    "buildingId": "academic-1",
    "number": "3266",
    "name": "Аудитория 3266",
    "floor": 3,
    "block": "2",
    "kind": "classroom",
    "planPosition": null,
    "sources": [
      {
        "kind": "floor-plan",
        "recordedOn": "2026-11-10",
        "note": "Этаж и номер сопоставлены с public/floorplans/floor-3.png; геометрия здесь не задаётся."
      }
    ]
  },
  {
    "id": "academic-1-2323",
    "buildingId": "academic-1",
    "number": "2323",
    "name": "Аудитория 2323",
    "floor": 2,
    "block": "3",
    "kind": "classroom",
    "planPosition": null,
    "sources": [
      {
        "kind": "floor-plan",
        "recordedOn": "2026-11-10",
        "note": "Этаж и номер сопоставлены с public/floorplans/floor-2.png; геометрия здесь не задаётся."
      }
    ]
  },
  {
    "id": "academic-1-2241",
    "buildingId": "academic-1",
    "number": "2241",
    "name": "Аудитория 2241",
    "floor": 2,
    "block": "2",
    "kind": "classroom",
    "planPosition": null,
    "sources": [
      {
        "kind": "floor-plan",
        "recordedOn": "2026-11-10",
        "note": "Этаж и номер сопоставлены с public/floorplans/floor-2.png; геометрия здесь не задаётся."
      }
    ]
  },
  {
    "id": "academic-1-2270",
    "buildingId": "academic-1",
    "number": "2270",
    "name": "Аудитория 2270",
    "floor": 2,
    "block": "2",
    "kind": "classroom",
    "planPosition": null,
    "sources": [
      {
        "kind": "floor-plan",
        "recordedOn": "2026-11-10",
        "note": "Этаж и номер сопоставлены с public/floorplans/floor-2.png; геометрия здесь не задаётся."
      }
    ]
  },
  {
    "id": "academic-1-2271",
    "buildingId": "academic-1",
    "number": "2271",
    "name": "Аудитория 2271",
    "floor": 2,
    "block": "2",
    "kind": "classroom",
    "planPosition": null,
    "sources": [
      {
        "kind": "floor-plan",
        "recordedOn": "2026-11-10",
        "note": "Этаж и номер сопоставлены с public/floorplans/floor-2.png; геометрия здесь не задаётся."
      }
    ]
  },
  {
    "id": "academic-1-3140",
    "buildingId": "academic-1",
    "number": "3140",
    "name": "Аудитория 3140",
    "floor": 3,
    "block": "1",
    "kind": "classroom",
    "planPosition": null,
    "sources": [
      {
        "kind": "floor-plan",
        "recordedOn": "2026-11-10",
        "note": "Этаж и номер сопоставлены с public/floorplans/floor-3.png; геометрия здесь не задаётся."
      }
    ]
  },
  {
    "id": "academic-1-2253",
    "buildingId": "academic-1",
    "number": "2253",
    "name": "Аудитория 2253",
    "floor": 2,
    "block": "2",
    "kind": "classroom",
    "planPosition": null,
    "sources": [
      {
        "kind": "floor-plan",
        "recordedOn": "2026-11-10",
        "note": "Этаж и номер сопоставлены с public/floorplans/floor-2.png; геометрия здесь не задаётся."
      }
    ]
  },
  {
    "id": "sports-new-309",
    "buildingId": "sports-new",
    "number": "309",
    "name": "Аудитория 309",
    "floor": null,
    "block": null,
    "kind": "classroom",
    "planPosition": null,
    "sources": [
      {
        "kind": "user-message",
        "recordedOn": "2026-11-10",
        "note": "Место передано пользователем. Этаж и контур помещения не указаны."
      }
    ]
  },
  {
    "id": "sports-new-223",
    "buildingId": "sports-new",
    "number": "223",
    "name": "Аудитория 223",
    "floor": null,
    "block": null,
    "kind": "classroom",
    "planPosition": null,
    "sources": [
      {
        "kind": "user-message",
        "recordedOn": "2026-11-10",
        "note": "Место передано пользователем. Этаж и контур помещения не указаны."
      }
    ]
  },
  {
    "id": "dorm-5-annex-rehearsal",
    "buildingId": "dorm-5-annex",
    "number": null,
    "name": "Репетиционный зал",
    "floor": null,
    "block": null,
    "kind": "other",
    "planPosition": null,
    "sources": [
      {
        "kind": "user-message",
        "recordedOn": "2026-11-10",
        "note": "Место передано пользователем. Этаж и контур помещения не указаны."
      }
    ]
  },
  {
    "id": "dorm-6-dance-unverified-annex",
    "buildingId": "dorm-6",
    "number": null,
    "name": "Танцевальный зал (пристройка не уточнена)",
    "floor": null,
    "block": null,
    "kind": "dance",
    "planPosition": null,
    "sources": [
      {
        "kind": "user-message",
        "recordedOn": "2026-11-10",
        "note": "Место передано пользователем. Этаж и контур помещения не указаны."
      }
    ]
  },
  {
    "id": "academic-1-212",
    "buildingId": "academic-1",
    "number": "212",
    "name": "Аудитория 212 (ректорат)",
    "floor": 2,
    "block": "Ректорат",
    "kind": "classroom",
    "planPosition": null,
    "sources": [
      {
        "kind": "user-message",
        "recordedOn": "2026-11-10",
        "note": "Пользователь уточнил: 2-й этаж нового корпуса, ректорат. На имеющемся плане этажа контур этой аудитории не представлен."
      }
    ]
  },
  ...userDigitizedRooms,
]

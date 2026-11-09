
export type Room = {
  id: string
  building: string
  floor: number | null
  block?: string
  name: string
  clubs: string[]
  schedule: string
  verifiedPosition: boolean
}

export const rooms: Room[] = [
  {
    id: '3314',
    building: 'Новый корпус НГУ',
    floor: 3,
    block: '3 блок',
    name: 'Аудитория 3314',
    clubs: ['Интерклуб НГУ'],
    schedule: 'Суббота, 18:10–20:00',
    verifiedPosition: false,
  },
  {
    id: '5272',
    building: 'Новый корпус НГУ',
    floor: 5,
    block: '2 блок',
    name: 'Аудитория 5272',
    clubs: ['Книжный клуб НГУ'],
    schedule: 'Воскресенье, 18:00–20:00, раз в 3 недели',
    verifiedPosition: false,
  },
  {
    id: '1332',
    building: 'Новый корпус НГУ',
    floor: 1,
    block: '3 блок',
    name: 'Аудитория 1332',
    clubs: ['Чайный клуб НГУ'],
    schedule: 'Обычно субботы нечётных недель, 16:20–19:20',
    verifiedPosition: false,
  },
  {
    id: '2348',
    building: 'Новый корпус НГУ',
    floor: 2,
    block: '3 блок',
    name: 'Аудитория 2348',
    clubs: ['Чайный клуб НГУ', 'Asian Club'],
    schedule: 'По расписанию мероприятий',
    verifiedPosition: false,
  },
  {
    id: 'dorm6-dance',
    building: 'Пристройка общежития № 6',
    floor: null,
    name: 'Танцевальный зал',
    clubs: ['Медиваль', 'Swing Dance NSU'],
    schedule: 'Среда и пятница, время зависит от объединения',
    verifiedPosition: false,
  },
  {
    id: 'sports-aerobics',
    building: 'Спортивные помещения, Пирогова 12/1',
    floor: null,
    name: 'Зал аэробики',
    clubs: ['Мастерская огня и света'],
    schedule: 'Пятница, 18:00–21:00',
    verifiedPosition: false,
  },
]

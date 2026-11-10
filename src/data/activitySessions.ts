
import type { ActivitySession } from './campusTypes'

export const activitySessions: ActivitySession[] = [
  {
    id: 'interclub-sat',
    clubName: 'Интерклуб НГУ',
    roomId: 'academic-1-3314',
    dayOfWeek: 6,
    startTime: '18:10',
    endTime: '20:00',
    recurrence: 'weekly',
    attendanceMin: 15,
    attendanceMax: 17,
    locationStatus: 'confirmed',
  },
  {
    id: 'bookclub-sun',
    clubName: 'Книжный клуб НГУ',
    roomId: 'academic-1-5272',
    dayOfWeek: 7,
    startTime: '18:00',
    endTime: '20:00',
    recurrence: 'every-3-weeks',
    attendanceMin: 25,
    attendanceMax: 30,
    locationStatus: 'confirmed',
  },
  {
    id: 'tea-sat',
    clubName: 'Чайный клуб НГУ',
    roomId: 'academic-1-1332',
    dayOfWeek: 6,
    startTime: '16:20',
    endTime: '19:20',
    recurrence: 'usually-odd-weeks',
    attendanceMin: 25,
    attendanceMax: 30,
    locationStatus: 'approximate',
  },
  {
    id: 'medieval-wed',
    clubName: 'Медиваль',
    roomId: 'dorm-6-dance',
    dayOfWeek: 3,
    startTime: '18:00',
    endTime: '20:00',
    recurrence: 'weekly',
    attendanceMin: 10,
    attendanceMax: 10,
    locationStatus: 'confirmed',
  },
  {
    id: 'fire-friday',
    clubName: 'Мастерская огня и света',
    roomId: 'sports-aerobics',
    dayOfWeek: 5,
    startTime: '18:00',
    endTime: '21:00',
    recurrence: 'weekly',
    attendanceMin: 5,
    attendanceMax: 10,
    locationStatus: 'confirmed',
  },
  {
    "id": "siberian-english-sun",
    "clubId": "siberian-english",
    "clubName": "Siberian English Club",
    "roomId": "academic-1-5222",
    "dayOfWeek": 7,
    "startTime": "18:00",
    "endTime": null,
    "recurrence": "Воскресенья с сентября по апрель",
    "attendanceMin": null,
    "attendanceMax": null,
    "locationStatus": "confirmed",
    "scheduleStatus": "needs-confirmation",
    "source": {
      "kind": "user-message",
      "recordedOn": "2026-11-10",
      "url": "https://vk.ru/siberianenglishclub",
      "note": "Пользователь передал текст расписания, действующего с сентября 2025 года."
    },
    "notes": [
      "В предоставленном тексте расписание указано с сентября 2025 года. Актуальность требует проверки."
    ]
  },
  {
    "id": "academian-english-sun",
    "clubId": "academian-english",
    "clubName": "Academian English Club (Novosibirsk)",
    "roomId": "academic-1-5222",
    "dayOfWeek": 7,
    "startTime": "17:30",
    "endTime": null,
    "recurrence": "weekly",
    "attendanceMin": null,
    "attendanceMax": null,
    "locationStatus": "confirmed",
    "scheduleStatus": "reported",
    "source": {
      "kind": "user-message",
      "recordedOn": "2026-11-10",
      "url": "https://vk.ru/academianenglishclub"
    },
    "notes": [
      "В той же аудитории указана встреча Siberian English Club с 18:00. Время окончания и связь клубов неизвестны."
    ]
  },
  {
    "id": "russian-speaking-sun",
    "clubId": "russian-speaking",
    "clubName": "Русский разговорный клуб НГУ",
    "roomId": "academic-1-3266",
    "dayOfWeek": 7,
    "startTime": "15:00",
    "endTime": null,
    "recurrence": "weekly",
    "attendanceMin": null,
    "attendanceMax": null,
    "locationStatus": "confirmed",
    "scheduleStatus": "reported",
    "source": {
      "kind": "user-message",
      "recordedOn": "2026-11-10",
      "url": "https://vk.ru/rscciep"
    }
  },
  {
    "id": "intellectual-games-thu",
    "clubId": "intellectual-games",
    "clubName": "Клуб интеллектуальных игр НГУ | КИИ НГУ",
    "roomId": "academic-1-5222",
    "dayOfWeek": 4,
    "startTime": "18:10",
    "endTime": null,
    "recurrence": "weekly",
    "attendanceMin": null,
    "attendanceMax": null,
    "locationStatus": "confirmed",
    "scheduleStatus": "reported",
    "source": {
      "kind": "user-message",
      "recordedOn": "2026-11-10",
      "url": "https://vk.ru/kii_nsu"
    }
  },
  {
    "id": "board-games-sat",
    "clubId": "board-games",
    "clubName": "Клуб настольных игр НГУ",
    "roomId": "academic-1-2241",
    "dayOfWeek": 6,
    "startTime": "18:00",
    "endTime": null,
    "recurrence": "weekly",
    "attendanceMin": null,
    "attendanceMax": null,
    "locationStatus": "approximate",
    "scheduleStatus": "reported",
    "source": {
      "kind": "user-message",
      "recordedOn": "2026-11-10",
      "url": "https://vk.ru/games_odina"
    },
    "alternativeRoomIds": [
      "academic-1-2270",
      "academic-1-2271"
    ],
    "notes": [
      "Одна игротека с несколькими возможными аудиториями: 2241, 2270, 2271. Место уточняйте в анонсе; отдельные одновременные мероприятия не предполагаются."
    ]
  },
  {
    "id": "ultimate-mon",
    "clubId": "ultimate",
    "clubName": "НИИ ТУДА — команда НГУ по алтимат фрисби",
    "roomId": null,
    "dayOfWeek": 1,
    "startTime": "20:45",
    "endTime": "22:00",
    "recurrence": "weekly",
    "attendanceMin": null,
    "attendanceMax": null,
    "locationStatus": "confirmed",
    "scheduleStatus": "reported",
    "source": {
      "kind": "user-message",
      "recordedOn": "2026-11-10",
      "url": "https://vk.ru/ultimate_nsu",
      "note": "В предоставленном тексте указан период: осень–зима 2026."
    },
    "buildingId": "sports-new",
    "locationNote": "Новый спорткомплекс НГУ, зал не указан",
    "notes": [
      "Осень–зима 2026 года. Новичкам нужно согласовать участие с организатором."
    ]
  },
  {
    "id": "ultimate-thu",
    "clubId": "ultimate",
    "clubName": "НИИ ТУДА — команда НГУ по алтимат фрисби",
    "roomId": null,
    "dayOfWeek": 4,
    "startTime": "17:45",
    "endTime": "19:30",
    "recurrence": "weekly",
    "attendanceMin": null,
    "attendanceMax": null,
    "locationStatus": "confirmed",
    "scheduleStatus": "reported",
    "source": {
      "kind": "user-message",
      "recordedOn": "2026-11-10",
      "url": "https://vk.ru/ultimate_nsu",
      "note": "В предоставленном тексте указан период: осень–зима 2026."
    },
    "buildingId": "sports-new",
    "locationNote": "Новый спорткомплекс НГУ, зал не указан",
    "notes": [
      "Осень–зима 2026 года. Новичкам нужно согласовать участие с организатором."
    ]
  },
  {
    "id": "ultimate-sun",
    "clubId": "ultimate",
    "clubName": "НИИ ТУДА — команда НГУ по алтимат фрисби",
    "roomId": null,
    "dayOfWeek": 7,
    "startTime": "12:45",
    "endTime": "15:00",
    "recurrence": "weekly",
    "attendanceMin": null,
    "attendanceMax": null,
    "locationStatus": "confirmed",
    "scheduleStatus": "reported",
    "source": {
      "kind": "user-message",
      "recordedOn": "2026-11-10",
      "url": "https://vk.ru/ultimate_nsu",
      "note": "В предоставленном тексте указан период: осень–зима 2026."
    },
    "buildingId": "sports-new",
    "locationNote": "Новый спорткомплекс НГУ, зал не указан",
    "notes": [
      "Осень–зима 2026 года. Новичкам нужно согласовать участие с организатором."
    ]
  },
  {
    "id": "siberica-tue",
    "clubId": "siberica-legion",
    "clubName": "Клуб СМБ в НГУ «Siberica LegioN*»",
    "roomId": null,
    "dayOfWeek": 2,
    "startTime": "21:00",
    "endTime": "23:00",
    "recurrence": "weekly",
    "attendanceMin": null,
    "attendanceMax": null,
    "locationStatus": "confirmed",
    "scheduleStatus": "reported",
    "source": {
      "kind": "user-message",
      "recordedOn": "2026-11-10",
      "url": "https://vk.ru/nsu_knights"
    },
    "buildingId": "sports-shooting",
    "locationNote": "Тир НГУ, Пирогова, 12; точное помещение не указано"
  },
  {
    "id": "siberica-wed",
    "clubId": "siberica-legion",
    "clubName": "Клуб СМБ в НГУ «Siberica LegioN*»",
    "roomId": null,
    "dayOfWeek": 3,
    "startTime": "21:00",
    "endTime": "23:00",
    "recurrence": "weekly",
    "attendanceMin": null,
    "attendanceMax": null,
    "locationStatus": "confirmed",
    "scheduleStatus": "reported",
    "source": {
      "kind": "user-message",
      "recordedOn": "2026-11-10",
      "url": "https://vk.ru/nsu_knights"
    },
    "buildingId": "sports-shooting",
    "locationNote": "Тир НГУ, Пирогова, 12; точное помещение не указано"
  },
  {
    "id": "siberica-thu",
    "clubId": "siberica-legion",
    "clubName": "Клуб СМБ в НГУ «Siberica LegioN*»",
    "roomId": null,
    "dayOfWeek": 4,
    "startTime": "21:00",
    "endTime": "23:00",
    "recurrence": "weekly",
    "attendanceMin": null,
    "attendanceMax": null,
    "locationStatus": "confirmed",
    "scheduleStatus": "reported",
    "source": {
      "kind": "user-message",
      "recordedOn": "2026-11-10",
      "url": "https://vk.ru/nsu_knights"
    },
    "buildingId": "sports-shooting",
    "locationNote": "Тир НГУ, Пирогова, 12; точное помещение не указано"
  },
  {
    "id": "siberica-sun",
    "clubId": "siberica-legion",
    "clubName": "Клуб СМБ в НГУ «Siberica LegioN*»",
    "roomId": null,
    "dayOfWeek": 7,
    "startTime": "18:00",
    "endTime": "22:00",
    "recurrence": "weekly",
    "attendanceMin": null,
    "attendanceMax": null,
    "locationStatus": "confirmed",
    "scheduleStatus": "reported",
    "source": {
      "kind": "user-message",
      "recordedOn": "2026-11-10",
      "url": "https://vk.ru/nsu_knights"
    },
    "buildingId": "sports-shooting",
    "locationNote": "Тир НГУ, Пирогова, 12; точное помещение не указано"
  },
  {
    "id": "bridge-sun",
    "clubId": "bridge",
    "clubName": "Бридж-клуб НГУ",
    "roomId": "sports-new-309",
    "dayOfWeek": 7,
    "startTime": "17:30",
    "endTime": null,
    "recurrence": "weekly",
    "attendanceMin": null,
    "attendanceMax": null,
    "locationStatus": "confirmed",
    "scheduleStatus": "reported",
    "source": {
      "kind": "user-message",
      "recordedOn": "2026-11-10",
      "url": "https://vk.ru/bridge_nsu"
    }
  },
  {
    "id": "mtg-sat",
    "clubId": "mtg",
    "clubName": "Клуб MTG «Planeswalker» | НГУ | NSU",
    "roomId": "academic-1-3140",
    "dayOfWeek": 6,
    "startTime": "16:20",
    "endTime": "20:00",
    "recurrence": "weekly",
    "attendanceMin": null,
    "attendanceMax": null,
    "locationStatus": "confirmed",
    "scheduleStatus": "reported",
    "source": {
      "kind": "user-message",
      "recordedOn": "2026-11-10",
      "url": "https://vk.ru/mtg_nsu"
    }
  },
  {
    "id": "historical-political-announced",
    "clubId": "historical-political",
    "clubName": "Дискуссионный клуб НГУ",
    "roomId": "academic-1-212",
    "dayOfWeek": null,
    "startTime": null,
    "endTime": null,
    "recurrence": "Нерегулярно, по анонсам",
    "attendanceMin": null,
    "attendanceMax": null,
    "locationStatus": "approximate",
    "scheduleStatus": "needs-confirmation",
    "source": {
      "kind": "user-message",
      "recordedOn": "2026-11-10",
      "url": "https://vk.ru/istpolitclubnsu"
    },
    "locationNote": "Базовая аудитория 212, 2-й этаж нового корпуса, ректорат. Встречи нерегулярные, по анонсам."
  },
  {
    "id": "ethno-mon",
    "clubId": "ethno",
    "clubName": "Этноклуб НГУ «Семёнов день»",
    "roomId": "dorm-5-annex-rehearsal",
    "dayOfWeek": 1,
    "startTime": "19:00",
    "endTime": null,
    "recurrence": "weekly",
    "attendanceMin": null,
    "attendanceMax": null,
    "locationStatus": "confirmed",
    "scheduleStatus": "reported",
    "source": {
      "kind": "user-message",
      "recordedOn": "2026-11-10",
      "url": "https://vk.ru/etnoclubnsu"
    }
  },
  {
    "id": "ethno-sun",
    "clubId": "ethno",
    "clubName": "Этноклуб НГУ «Семёнов день»",
    "roomId": "dorm-6-dance-unverified-annex",
    "dayOfWeek": 7,
    "startTime": "13:00",
    "endTime": null,
    "recurrence": "weekly",
    "attendanceMin": null,
    "attendanceMax": null,
    "locationStatus": "confirmed",
    "scheduleStatus": "reported",
    "source": {
      "kind": "user-message",
      "recordedOn": "2026-11-10",
      "url": "https://vk.ru/etnoclubnsu"
    },
    "notes": [
      "В источнике указано общежитие № 6. Не установлено, находится ли зал в пристройке."
    ]
  },
  {
    "id": "mountain-run-mon",
    "clubId": "mountain-tourism",
    "clubName": "Секция горного туризма НГУ",
    "roomId": null,
    "dayOfWeek": 1,
    "startTime": null,
    "endTime": null,
    "recurrence": "weekly",
    "attendanceMin": null,
    "attendanceMax": null,
    "locationStatus": "confirmed",
    "scheduleStatus": "reported",
    "source": {
      "kind": "user-message",
      "recordedOn": "2026-11-10",
      "url": "https://vk.ru/mountainnsu"
    },
    "buildingId": "sports-old",
    "locationNote": "У крыльца старого спорткомплекса НГУ, на улице",
    "notes": [
      "Время начала и окончания беговой тренировки не указано."
    ]
  },
  {
    "id": "mountain-run-fri",
    "clubId": "mountain-tourism",
    "clubName": "Секция горного туризма НГУ",
    "roomId": null,
    "dayOfWeek": 5,
    "startTime": null,
    "endTime": null,
    "recurrence": "weekly",
    "attendanceMin": null,
    "attendanceMax": null,
    "locationStatus": "confirmed",
    "scheduleStatus": "reported",
    "source": {
      "kind": "user-message",
      "recordedOn": "2026-11-10",
      "url": "https://vk.ru/mountainnsu"
    },
    "buildingId": "sports-old",
    "locationNote": "У крыльца старого спорткомплекса НГУ, на улице",
    "notes": [
      "Время начала и окончания беговой тренировки не указано."
    ]
  },
  {
    "id": "mountain-lecture-thu",
    "clubId": "mountain-tourism",
    "clubName": "Секция горного туризма НГУ",
    "roomId": "sports-new-223",
    "dayOfWeek": 4,
    "startTime": "19:00",
    "endTime": null,
    "recurrence": "weekly",
    "attendanceMin": null,
    "attendanceMax": null,
    "locationStatus": "confirmed",
    "scheduleStatus": "reported",
    "source": {
      "kind": "user-message",
      "recordedOn": "2026-11-10",
      "url": "https://vk.ru/mountainnsu"
    }
  },
]

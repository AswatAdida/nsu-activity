// Identity/address cross-checks for the OSM footprints in campusSites.ts.
export const geographyEvidence: Record<string, { title: string; url: string }[]> = {
  'academic-1': [{ title: 'НГУ: адрес учебного корпуса', url: 'https://www.classes.nsu.ru/index.html' }],
  'dorm-5': [
    { title: 'НГУ: общежития и адреса', url: 'https://saes.nsu.ru/accommodation/' },
    { title: 'НГУ: пристройка общежития № 5', url: 'https://t.me/s/nsuniversity/10962' },
  ],
  'dorm-6': [{ title: 'НГУ: общежития и адреса', url: 'https://saes.nsu.ru/accommodation/' }],
  'sports-new': [{ title: 'НГУ: новый спорткомплекс на Пирогова, 12/1', url: 'https://techtalks.nsu.ru/' }],
  'sports-old': [{ title: 'OpenStreetMap: старый спорткомплекс и тир', url: 'https://www.openstreetmap.org/way/45782820' }],
  stc: [{ title: 'НГУ: СТЦ на Пирогова, 6, пристройка', url: 'https://t.me/s/nsuniversity?before=9769' }],
}

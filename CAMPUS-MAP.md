# Campus map geographic foundation

The original OSM snapshot and all 480 room contours are unchanged. Current application semantics, unified places, student selection and verification are documented in [STUDENT-SCHEDULE.md](STUDENT-SCHEDULE.md). The former stage 2 one-hour default and orange/uncertainty styling have been removed at the owner's request.

## Geographic sources and precision

Coordinates are derived exclusively from OpenStreetMap vertices retrieved on **2026-11-11** through the [OSM map API](https://api.openstreetmap.org/api/0.6/map?bbox=83.085,54.837,83.106,54.850). `campusSites.ts` retains source vertices, source object IDs and versions. The academic building's courtyard is retained as an interior ring. Centers are bounding-box midpoints for navigation, **not entrance coordinates**. Vertex hashes are pinned in `tests/campusMap.test.ts`.

| Physical site | Address / center (latitude, longitude) | OSM source and versions | Identity/address cross-check |
| --- | --- | --- | --- |
| Academic building 1 | Пирогова, 1 / 54.8432437, 83.0898888 | [relation 6836799](https://www.openstreetmap.org/relation/6836799), v13; outer [way 462936769](https://www.openstreetmap.org/way/462936769), v7; courtyard [way 474129850](https://www.openstreetmap.org/way/474129850), v7 | [NSU classroom service](https://www.classes.nsu.ru/index.html) |
| Dormitory 5 and annex | Пирогова, 14 / 54.8472999, 83.0923265 | [way 463272129](https://www.openstreetmap.org/way/463272129), v6 | [NSU accommodation addresses](https://saes.nsu.ru/accommodation/), [NSU annex announcement](https://t.me/s/nsuniversity/10962) |
| Dormitory 6 and annex | Пирогова, 16 / 54.8481492, 83.0923479 | [way 463272128](https://www.openstreetmap.org/way/463272128), v4 | [NSU accommodation addresses](https://saes.nsu.ru/accommodation/); the existing meeting records identify the annex |
| New sports complex / sports rooms 12/1 | Пирогова, 12/1 / 54.8464391, 83.0957358 | [way 45781070](https://www.openstreetmap.org/way/45781070), v21 | [NSU Tech Talks location](https://techtalks.nsu.ru/) |
| Old sports complex / shooting range | Пирогова, 12 / 54.8471919, 83.095535 | [way 45782820](https://www.openstreetmap.org/way/45782820), v16 | OSM `name:en` identifies the old complex; `description` identifies the shooting range; existing meeting source gives Пирогова, 12 |
| STC in the building at Пирогова, 6 | Пирогова, 6 / 54.8464107, 83.0933505 | [way 42243964](https://www.openstreetmap.org/way/42243964), v14; `loc_name=СТЦ` | [Official NSU announcement](https://t.me/s/nsuniversity?before=9769), post 9753, explicitly says “Пирогова, 6 (пристройка, СТЦ)” |

All ten original building IDs and all room/session references are retained in the source model. The interface now presents **six unified activity places**: each dormitory is combined with its annex, and aliases of each sports building share one card. “Спортивные объекты НГУ” groups the new and old complexes, while retaining their separate coordinates and footprints. Indoor rooms retain their source IDs and descriptions, including uncertainty about whether a hall is in an annex. See [STUDENT-SCHEDULE.md](STUDENT-SCHEDULE.md) for the current navigation, colours and recurrence rules.

Separate annex and STC hall boundaries/entrances have not been reliably identified. They are **not assigned invented polygons or offset markers**: the map shows the known enclosing building and explicitly states the precision limit. Sources are also linked in each building card. A future unmapped record stays in the list with a location clarification rather than receiving guessed coordinates.

Geographic database extracts in `campusSites.ts`: © OpenStreetMap contributors, [Open Database License (ODbL) 1.0](https://www.openstreetmap.org/copyright). Both the base map and the extracted footprint layer are attributed. Original room geometry and PNG files are unaffected.

## Browser connectivity

The app uses the standard OSM tile URL and keeps the local verified footprint layer available if imagery fails to load. A failed tile request displays a short notice; the application does not disable TLS validation. The browser test includes a simulated tile-network failure. No runtime geocoding or Overpass calls are required.

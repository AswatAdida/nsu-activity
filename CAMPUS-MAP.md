# Unified campus activity map — stage 2

The existing catalogue, floor plans 0–5, 480 room polygons, room IDs, and polygon editor are retained. No backend, database, fictitious floors, rooms or meetings were introduced.

## Navigation and time

`CampusActivityExplorer` owns the selected building/room, navigation view, and one time filter. `CampusMap`, `BuildingCard`, and `FloorExplorer` consume that state. A map click opens the building card; from there users open floors or known rooms directly. Search can navigate across buildings using physical room IDs, including duplicate printed labels. Breadcrumbs and “К общей карте кампуса” return to the overview without resetting time. Floor navigation and the existing editor load on demand.

All controls, interval checks and upcoming starts use `Asia/Novosibirsk`. “Now” refreshes every 15 seconds. A chosen instant stays fixed across navigation. The legend is shared by buildings and rooms. Grey means no evidence in the database; it does not assert that no events occur.

## Activity policy authorized by the project owner

The stage 2 request explicitly treats all schedules as confirmed and supplies a one-hour duration when the end is missing. `activityPolicy` applies these rules without replacing original source status or time fields. UI displays the assumed hour. Missing start/weekday, unsupported recurrence, ambiguous location and unknown seasonal bounds still cannot generate a green result or a guessed upcoming date.

Colour priority: expected meeting now (green), a complete regular schedule at another time (blue), only incomplete/ambiguous evidence (orange), no evidence (grey). A dashed outline / `?` can coexist with blue or green when another record requires clarification. Upcoming lists show one next start per calculable weekly session; every-three-week and odd-week schedules have no anchor date and therefore yield no fabricated occurrences. Regular-record counts include the supplied recurring descriptions, even when an exact next date cannot be calculated.

Alternative rooms inside a single building do not make its location uncertain at building scope. The same evidence remains orange at room scope: no claim is made that all candidate rooms are occupied. Two outdoor running sessions retain building associations but are explicitly displayed as outside, not inside rooms. Their unknown starts remain unknown. The three ultimate sessions refer to “autumn–winter 2026”; exact validity endpoints are not supplied, so they remain marked for clarification rather than silently recurring indefinitely. No dates were invented for this phrase.

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

All ten original logical building records remain available. The new sports complex and sports rooms at 12/1 share a physical site and interior; the old sports complex and shooting range share another. Their room/session sets are combined without duplicating meetings. Dormitories and annexes keep separate cards and room associations while the **common mapped footprint aggregates all meetings at the site**. List dots/cards refer to the selected logical premises, so an annex may have meetings while its dormitory card has no evidence. Shared footprints are explained in the interface.

Separate annex and STC hall boundaries/entrances have not been reliably identified. They are **not assigned invented polygons or offset markers**: the map shows the known enclosing building and explicitly states the precision limit. Sources are also linked in each building card. A future unmapped record stays in the list with a location clarification rather than receiving guessed coordinates.

Geographic database extracts in `campusSites.ts`: © OpenStreetMap contributors, [Open Database License (ODbL) 1.0](https://www.openstreetmap.org/copyright). Both the base map and the extracted footprint layer are attributed. Original room geometry and PNG files are unaffected.

## Validation

- `npm test`: timezone, policy/default duration, interval boundaries, overnight meetings, validity, upcoming dates, colour priority, location scope, aliases, source hashes, navigation IDs, and existing geometry/editor/data checks.
- `npm run build`; `npm run lint`; `git diff --check`.
- Browser checks exercise campus → building → floor → room → meetings, all 480 contours, duplicate labels, the shared time filter, rooms with no evidence, no-plan buildings, outdoor events, keyboard access, editor opening, return navigation, and mobile layouts.

External OSM base tiles require connectivity and are subject to the tile service's policy; failures do not remove the local verified footprint layer or building list. No geocoding or Overpass requests are made at runtime.

### Reproduce the browser checks

```sh
npm ci
npm run build
npx playwright install chromium
npm run test:browser
# Or, with an already installed system browser:
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
```

The script starts/stops a local production preview, uses a Russian browser locale and a deliberately different browser time zone, and saves screenshots under ignored `work/browser-artifacts/`. It also tests a simulated tile-network failure.

### Result of this implementation's checks

- `npm test`: **37/37** pass.
- `npm run build`: passes; floor navigation is split into an on-demand chunk.
- `npm run lint` and `git diff --check`: pass.
- Production-preview browser run: all **480** physical contours selected across floors 0–5, **10** logical building entries and **6** physical sites; shared time, the default-hour end boundary, orange candidate rooms, no-data rooms, search across buildings, no-plan fallback, outdoor meetings, editor opening/closing, return navigation, keyboard activation and widths **320/390/1440 px** pass without page JavaScript exceptions.
- This managed Chromium does not trust the environment proxy's certificate for external tile requests (`ERR_CERT_AUTHORITY_INVALID`). Live OSM imagery could not be visually verified here. The application uses the standard OSM tile URL; its local footprints remain interactive and its tile-error notice was verified, including a separate simulated network failure. TLS verification was not disabled to obtain screenshots.
- Original room PNG, polygon JSON, room catalogue and identity/editor geometry sources have no diff.

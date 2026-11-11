# Activity semantics (stage 1)

Floor plans keep their original PNG files, polygon coordinates, and physical room IDs. Grey means no event evidence in the database, not an empty room. Blue means there is meeting evidence. Green means a meeting is expected according to a complete, explicitly confirmed weekly schedule. Selection uses a dark outline and does not replace the activity colour.

`src/data/activityState.ts` is a pure evaluator independent of React and geometry. It accepts a session set and an absolute instant. `sessionsForRoom` includes alternative locations; `sessionsForBuilding` collects direct building references and room references, without duplicating a session. A future campus map can feed the latter into the same evaluator; this change does not colour buildings or add geometry.

All date/time controls and schedule calculations use `Asia/Novosibirsk` (UTC+7). The start of an interval is inclusive and the end exclusive. Overnight meetings belong to the day they start. Optional `validFrom` / `validUntil` are inclusive campus dates. “Now” refreshes every 15 seconds; a chosen time stays fixed while navigating floors.

A green result requires `scheduleStatus: 'confirmed'`, confirmed location without alternatives, valid weekday and start/end times, and `recurrence: 'weekly'`. Other recurrence strings are deliberately not interpreted: three-week cycles lack an anchor date, odd-week schedules lack an agreed calendar, and seasonal prose is not structured validity. Missing or `reported` / `needs-confirmation` status never counts as confirmed. No existing source data has been upgraded to confirmed. Therefore the current database has blue/grey rooms with uncertainty indicators, but no green rooms until a schedule is actually verified. Do not add confirmation merely to obtain a green demo.

Uncertainty is orthogonal to colour: a dashed amber outline and textual `?` mark incomplete or unverified evidence; the selected room panel gives reasons. An active confirmed meeting can coexist with another uncertain record. Base club locations alone do not imply meetings.

## Validation

- `npm test`: evaluator covers campus timezone and invalid input, interval boundaries, weekdays, overnight meetings, validity dates, incomplete and unverified schedules, unsupported recurrences, alternative locations, and building aggregation. Existing identity tests verify all 480 contours and repeated printed numbers.
- `npm run build` and `npm run lint`.
- Browser checks: all floors, contour selection and duplicate identities, mobile width, time control, and keyboard selection. Original PNG and geometry files must remain absent from the diff.

# Room activity semantics

Stage 1 introduced the geometry-independent activity evaluator and floor time filter. Stage 2 reuses this engine for the unified campus map and lifts navigation/time state into `CampusActivityExplorer`.

Current rules, the project-owner confirmation and one-hour-duration policy, geographic sources, source precision and validation are documented in [CAMPUS-MAP.md](CAMPUS-MAP.md). The raw source schedules are retained; they are interpreted with the explicit shared policy rather than being rewritten.

The original PNG files, all 480 room polygons, repeated-number physical identities and polygon editor remain compatible. No base-club location is treated as evidence of a scheduled meeting by itself.

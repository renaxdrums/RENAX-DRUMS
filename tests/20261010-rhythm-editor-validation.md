# Rhythm editor — 2026-10-10

## Scope

Bravura score editing, attack/rest duration fusion, default beat grouping and custom groups of 2/3, state colors, cyan playback highlight, musical pulse and single-system scale-to-width. Existing circular controls, sound banks, voice preparation, song UI and exports stay under their existing engines.

The orange pencil selects editing. Clicking a note/rest exposes duration and click-state controls. Lengthening consumes following events within its group; shortening leaves an explicit rest. Unrepresentable durations and durations beyond a group are disabled. Initial inactive slots remain rests; inactive slots after an attack extend it to the next attack or group boundary. Steps edited later regenerate only their affected group; unaffected explicit rests survive.

Grouping defaults: 7/8 = 2+2+3; 13/8 = 2+2+2+2+2+3; compound eighth measures use groups of 3. Custom grouping changes the order of 2/3 groups while preserving the measure sum. A sustained part split into a new group becomes a leading rest there, so grouping does not add attacks. Compound pulse stays dotted-quarter even for 2+2+2 ligatures in 6/8.

Edits save optional rhythmEditor metadata with the existing measure, and project attacks into legal existing subdivisions. During playback, a measure's already scheduled states remain frozen until the next scheduled cycle; timing and audio context are retained.

## Validation

- `rhythm-editor-core-test.mjs`: fusion examples 1/2/4 and 1/3/4; leading rests; explicit rests; shortening and absorption; group boundaries; 7/8, 13/8, 6/8 defaults; all legal current subdivision ratios; preservation of unaffected edited groups.
- `rhythm-editor-test.cjs`: real SVG pointer selection, duration and state changes, 6/8 custom grouping, live edit adopted at next cycle, dotted-quarter pulse intervals despite 2+2+2 beams; song persistence after reload; playback stops at song end; all allowed tuplets render; 13/8 with 52 attacks remains on one stave without horizontal overflow.
- `rhythm-score-test.cjs`: updated fusion note count and cyan color; source unchanged by read-only viewing; note/rest playback; view switching preserves scheduled click intervals; all subdivisions; poly score; multiple measures; Start/Reset positions; responsive bounds.
- `pulse-popup-live-test.cjs`: both voice banks remain exactly on the scheduled pulse grid.
- Checked screenshots at 320/390 portrait, 768 tablet, 844 landscape and 1440 desktop in headless Chromium.

The historical songs-playback test cannot reach its old “Nouveau morceau” navigation path in the current baseline. Its persistence/playback checks are covered by the editor integration test through the current song API and actual transport button.

Limit: no physical-device Safari/Firefox verification. Dense notation is deliberately reduced to remain on one stave, per the requested behavior.

## Manual test

1. Open Partition, then the orange pencil. In one quarter beat with 4 subdivisions, activate 1/2/4: expect sixteenth/eighth/sixteenth. Activate 2/4: expect leading sixteenth rest/eighth/sixteenth.
2. Select the first note, enlarge it to a quarter, then shorten to an eighth: following elements are consumed, then an eighth rest appears. Change the remaining rest to Clic 2 and check the matching step and sound.
3. In 7/8, check 2+2+3; enable custom groups and choose 3+2+2. In 6/8, choose 2+2+2 and verify the pulse still marks two dotted quarters.
4. Edit a note during playback: audio continues; the new pattern applies on the next pass. Stop/restart and switch visualization.
5. Edit a saved song, reload and reopen it; notes/rests/groups survive. On a phone, load a dense 13/8: one reduced stave, no second system or horizontal scroll.

## Independent tools panel — 2026-10-10

Editor controls now sit beside the vertical visualization buttons, in a separate flat dark panel. Duration controls include orange note symbols. On short screens, the icon stack and tools are compact; long tool lists remain scrollable. The score scales to both the available width and height, preserving one stave and exposing the complete music below the tools.

The editor integration test asserts matching top alignment of tools/icons, placement to the right, one stave, no horizontal overflow, and a complete SVG inside the paper bounds at all five tested viewports. Playback, cycle adoption, song persistence and duration/state edits pass unchanged.

Manual: open the pencil; check the tools are beside the visualization icons. Select a note and edit its duration. Rotate the phone; verify the complete stave remains visible and scroll the tools to reach click states and grouping.

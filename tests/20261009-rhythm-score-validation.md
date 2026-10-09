# Optional Bravura rhythm score view

Scope: add a read-only score view in Visualisation and two permanent icon buttons directly below
Métronome / Polyrythmie. Existing Start/Reset coordinates, circular view, controls, song data,
French Piper guide, English guide, audio engine and exporters are unchanged.
The two buttons select circular visualization or the score explicitly.
Reset has no score icon. New files own the view.

The locally served VexFlow 4.2.5 Bravura-only bundle retains the original font
outlines. It loads on demand. The current measure is engraved with notes and
rests, correct signature and supported subdivisions (including tuplets).
Long metronome measures wrap by beat. Polyrhythm uses two staves sharing the
same timing formatter. Dense scores scroll within the visualization area.
The existing visual event scheduling supplies audio-clock timestamps; no
click is generated or rescheduled by the score view. Only sounding noteheads
turn blue for their musical duration, then return to black; rests stay black.
Stop and Reset clear highlights. Resizing and view switching preserve playback.

Validation:
- Pure conversion test covers every supported denominator/subdivision pair:
  exact total beat duration, click/rest states, grouping and unmodified data.
- Real Chromium UI test covers Bravura SVG rendering, rests, triplet/quintuplet/
  sextuplet/septuplet rendering, all supported subdivisions, blue notehead RGB
  (22,131,255), black during a rest and after Stop, measure transitions, view
  switching during Play, unchanged 250/500 ms scheduled click intervals,
  and unchanged source measures. No page errors.
- Start and Reset bounding boxes match a page without the new view within
  1 pixel. Smartphone 390×844, narrow 320×640, tablet 768×1024, landscape 844×390 and desktop
  1440×1000 pass layout checks, including no page overflow and icon visibility.
- Smartphone and desktop screenshots were visually inspected.
- Syntax and diff checks pass. Review: draw is cached by rhythm/width; live
  progress changes notehead classes only. No voice or exporter source changed.

Manual test:
1. Reload; in Visualisation, click Partition under Métronome / Polyrythmie. Confirm Bravura
   notation uses the available width and Métronome restores the original circular view.
2. Enter notes, rests and a triplet. Play: notes turn blue in order and return
   to black; rests stay black. Toggle both ways while playing, then Stop/Reset.
3. Try multiple measures and a song; confirm the current measure follows
   playback. Repeat on phone and PC, including landscape and a dense rhythm.

Device-specific listening and blue-head timing on the user's phone remain
manual checks. The score is a display, not a score editor or export feature.

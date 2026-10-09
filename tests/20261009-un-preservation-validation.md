# French female final « un »: preserve the complete waveform

Scope: stop trimming the isolated French /œ̃/ number when joining it to a section label. Keep the acoustic timing landmark at the existing 1% amplitude threshold, compensating for the retained pre-roll. Other number cropping, the voice model, UI, click engine and volume settings remain unchanged. Cache revisions propagate the module change.

Validation: `node tests/amorce-un-preservation-test.mjs` passes: weak attack and decay retained sample by sample, source PCM unchanged, anchor compensated, two-phoneme number cropping and timing unchanged. `node tests/amorce-syllables-test.mjs` passes. Syntax and diff checks pass.

Real neural check: Kokoro ff_siwis, /ˈœ̃/, 24 kHz; complete standalone number waveform retained after concatenation, modulo uniform normalization gain. Peak 0.589734. The existing detected onset remains on the planned target with zero calculated error at 60, 120, 180 and 300 BPM in 4/4.

Limits: this removes a waveform-cropping mechanism; listening has not established that it is the sole cause of the reported sound. Full browser integration could not run: local Chromium exits with SIGSEGV at launch. No claim of perceptual or device playback validation.

Manual test: reload the updated site; use French vocal guide, label « Intro 1 », 4/4, 120 BPM and two measures per block. Listen to successive « un » attacks and endings; verify alignment with subsequent counts. Repeat at 60 and 180 BPM, then check « Intro 2 », English announcements, stop/restart and MP3 export.

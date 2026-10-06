# Voice timing validation

Run with Node.js, Playwright and Chrome installed:

```
node tests/timing-test.cjs
node tests/regression-test.cjs
node tests/live-test.cjs
```

`PLAYWRIGHT_MODULE` can name a bundled Playwright installation. `CHROME_PATH` can select a Chrome executable. `TEST_URL` selects the deployed site instead of the harness's local HTTP server. `TEST_OUTPUT_DIR` selects where reports are saved. The regression test compares against commit `aa737d673d5e38a2145609d19f7f678938165f2b` and requires that commit in the local Git history. Run it against the local server.

`python tests/analyze-voices.py` verifies all 40 shipped English mono PCM WAV files (requires NumPy). Each SHA-256 identity and reviewed vowel-region landmark is stored in `voice-anchors.json`. The analysis uses a 300–2500 Hz band envelope, a 10 ms RMS window, 8 ms Gaussian smoothing, and a 1 ms step. Within the reviewed region it checks the rising flank of the vowel nucleus. The region prevents consonant pre-voicing, noise bursts or a later syllable from being mistaken for the intended onset. Replacing any sample requires recalibration.

The timing test renders the actual voice playback function through Chrome's OfflineAudioContext at 48 kHz, isolates each word on its own channel, then locates its annotated vowel region by matching the rendered waveform to the source sample. The annotation is loaded separately from the application's scheduling table. It runs the actual scheduler with uneven simulated callbacks (17–40 ms), checking the count sequence and beat grid against separately calculated expectations. Cases cover all numbers 1–20; 60/120 BPM; 3/4, 4/4, 5/4; subdivisions 2–8; and sequenced measures at 60→120→90 BPM. Acceptable landmark and interval error: 1.1 ms, with no clipped pre-roll in these normal conditions. `BASELINE_INDEX` optionally substitutes an older HTML file for a local regression check.

The live test uses a running AudioContext and the real browser timers. It records source start times and offsets, reconstructs the calibrated attack times, and checks 1→2→3→4→1 at both 60 and 120 BPM. This checks scheduled audio timing; it does not record a microphone or the user's sound device.

The regression test compares non-vocal PCM renders for every bank, state and first-beat accent; allows at most 0.000001 amplitude floating-point rounding; exercises 10,000 reference beats at 60 BPM; and verifies cancellation of scheduled voice sources on Stop.

The first version's initial RMS-threshold test did not validate perceptual rhythm and was rejected by the user. Its historical reports in `validation-2026-10-05/` must not be treated as a successful perceptual validation. Current English-only reports are in `validation-2026-10-06-english-only/`. Previous reports describe historical versions.

These tests validate explicit reviewed vowel landmarks and actual waveform timing. Human perception of soft consonants and syllabic stress is not identical to an envelope maximum, and an offline render cannot certify every listener's subjective rhythm or device latency. The user validated male EN through twenty and requested stressed-syllable alignment for female eleven. Universal perceptual perfection is not claimed.

Subdivision checks: node tests/subdivision-test.cjs; node tests/subdivision-live-test.cjs; node tests/subdivision-mix-test.cjs. Optional SUBDIVISION_BASELINE points to an old local index.html for before/after levels and defect reproduction. Current subdivision reports: validation-2026-10-06-subdivisions/. Live edits adopt the changed audio subdivision layout on the next pass of the measure, while visuals preserve musical phase.

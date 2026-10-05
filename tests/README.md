# Voice timing validation

Run with Node.js, Playwright and Chrome installed:

```
node tests/timing-test.cjs
node tests/regression-test.cjs
node tests/live-test.cjs
```

`PLAYWRIGHT_MODULE` can name a bundled Playwright installation. `CHROME_PATH` can select a Chrome executable. `TEST_URL` selects the deployed site instead of the harness's local HTTP server. `TEST_OUTPUT_DIR` selects where reports are saved. The regression test compares against commit `aa737d673d5e38a2145609d19f7f678938165f2b` and requires that commit in the local Git history. Run it against the local server.

`python tests/analyze-voices.py` independently measures all 80 shipped mono PCM WAV files (requires NumPy). Its attack detector uses a 5 ms RMS window, 1 ms hop, and the first 10 consecutive windows above 20% of the sample's peak RMS, with a 0.01 amplitude floor. Keep the attack table calibrated if samples change.

The timing test renders the actual voice playback function through Chrome's OfflineAudioContext at 48 kHz, isolates each word on its own channel, then detects its attack independently. It runs the actual scheduler with uneven simulated callbacks (17–40 ms), checking the count sequence and beat grid against separately calculated expectations. Cases cover all numbers 1–20; 60/120 BPM; 3/4, 4/4, 5/4; subdivisions 2–8; and sequenced measures at 60→120→90 BPM. Acceptable attack and interval error: 1.1 ms, with no clipped pre-roll in these normal conditions.

The live test uses a running AudioContext and the real browser timers. It records source start times and offsets, reconstructs the calibrated attack times, and checks 1→2→3→4→1 at both 60 and 120 BPM. This checks scheduled audio timing; it does not record a microphone or the user's sound device.

The regression test compares non-vocal PCM renders for every bank, state and first-beat accent; allows at most 0.000001 amplitude floating-point rounding; exercises 10,000 reference beats at 60 BPM; and verifies cancellation of scheduled voice sources on Stop.

These tests validate an explicit acoustic attack anchor. Human perception of soft consonants and syllabic stress is not identical to an RMS threshold, and an offline render cannot certify every listener's subjective rhythm or device latency. No subjective listening result is claimed.

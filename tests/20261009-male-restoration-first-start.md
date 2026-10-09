# Restore male announcements and wake audio on first Play

Scope: restore bm_george for French Guide Vocal announcements, keeping the existing English voice. Resume Web Audio inside the first Play gesture before awaiting guide preparation. Cache revisions propagate both changes. The two rejected female « un » experiments are excluded; other synthesis, song data, UI and audio levels are unchanged.

Validation: syntax and diff checks pass. `amorce-un-preservation-test.mjs` passes. `amorce-first-start-test.cjs` passes with fixtures and the real Kokoro/WASM runtime: context initially suspended, one Play starts playback, preparation sees running audio, exactly one announcement session starts, Stop/Start works, no page errors. Both « 1 » and « un » produce the same bm_george waveform, 25,800 samples at 24 kHz, peak 0.464313. Listening quality and phone-specific autoplay behavior remain user checks.

Manual check: open the updated site in a fresh tab; open a song with Guide Vocal; click Play once and wait for initial preparation. Confirm playback begins without Stop/Start. Listen to French labels « 1 » and « un », then another French label and an English block. Stop and restart. The guide should use the male voice and preserve the arrangement.

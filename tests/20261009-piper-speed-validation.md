# French Piper SIWIS guide and preparation speed

Scope: French Guide Vocal only. Replace French Kokoro with the approved
unquantized Piper SIWIS medium model and original inference settings.
English Kokoro bm_george, click banks, score, playback scheduling, rest behavior,
MIDI and MP3 exporters remain unchanged. Cache revisions cover the amended
phonemizer dependency as well as the guide entry point.

One persistent French worker retains the ONNX session. Existing in-memory
promise caching deduplicates identical labels; IndexedDB retains up to 64
French PCM/timing results across reloads. Storage failure falls back to ordinary
synthesis. First-time model download is still required for unseen announcements.

Validation in Chromium 153 with real ONNX/WASM inference, mirrored unchanged
model/runtime files:
- Three approved phrases have the same NFD phoneme sequence as Python Piper:
  couplet 1, refrain 1, introduction 1. The standalone 1 and un both use /œ̃/.
- Model graph/weights are unchanged. Exposing the existing duration output
  produced exactly equal PCM to the original model in Python ONNX Runtime
  with equal random seed (maximum difference 0). Sum of duration frames ×256
  equals PCM length. Browser validates this relationship on every synthesis.
- Latest speed run: first model/session preparation plus couplet 1: 6.93 s,
  including local asset delivery, excluding an internet cold-download estimate.
  Subsequent tested labels: 0.17–0.57 s. Same-page cache: <1 ms. After page
  reload, persisted couplet 1: 1.7 ms without loading the model. These are
  environment measurements, not guarantees for every device or connection.
- piper-speed-test.cjs passes for approved phrases, 1, un, Fin, Pré-refrain,
  Couplet 2 : guitare, Bonjour. Refrain, Fin.; finite audio, peak <0.801,
  phoneme timings and persistent-cache retrieval; no page errors.
- Real first-start test passes: suspended audio resumes on first Play before
  preparation; one session starts, Stop/Start works, both 1/un are Piper.
- Real mobile-viewport integration passes: FR/EN/FR guide voices, two count-in
  measures, automatic stop, unchanged library, MIDI equality, existing click
  bank behavior. MP3 export: 567,360 bytes; decoded true peak 0.872 (<1).
- Syntax checks pass for the amended and new modules.

Manual check: reload the published site, play a French Guide Vocal song with
Couplet 1 / Refrain 1 / Introduction 1 and labels 1 / un. Confirm first Play
starts, pronunciation and announcement placement are satisfactory. Stop, reopen
and play again to check cached preparation, then listen to its MP3 export and
an English section. Listening and phone-specific timing remain user checks.

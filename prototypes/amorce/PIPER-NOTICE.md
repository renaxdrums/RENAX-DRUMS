# French Guide Vocal voice

The French guide uses the unquantized `fr_FR-siwis-medium` Piper voice from
[rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices/tree/c10ece1aade47bb51c153c893d14e5bf8e5b7117/fr/fr_FR/siwis/medium).
Original inference settings are retained: noise scale 0.667, length scale 1,
noise width 0.8, 22,050 Hz. The English Kokoro guide voice is unchanged.

The upstream [model card](https://huggingface.co/rhasspy/piper-voices/blob/c10ece1aade47bb51c153c893d14e5bf8e5b7117/fr/fr_FR/siwis/medium/MODEL_CARD)
credits the [SIWIS French speech dataset](https://datashare.is.ed.ac.uk/handle/10283/2353),
licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), and training
finetuned from the U.S. English Lessac medium voice. Piper voices repository:
MIT. eSpeak NG phonemization: GPL-3.0. ONNX Runtime Web: MIT.

The original model weights and operators are unchanged. The browser exposes
an existing VITS duration tensor as an additional output for the guide's
phoneme timing, then applies the existing loudness normalization. Those
predicted timestamps are not independently certified acoustic boundaries.

A bounded browser-local cache stores up to 64 French announcements and their
timing, keyed by engine/settings revision and label. Storage failure falls
back to synthesis. No labels or generated speech are uploaded.

# Replier un bloc depuis ses zones libres — 6 octobre 2026

Demande ajoutée après l'export MP3 et la correction du chrono. Modification isolée dans un nouveau commit, sur la base `781fe554f5c5af27be373c8e1a591e2e167c37d7`.

- `songs.js` : une seule ligne modifiée ; le clic dans une zone libre d'un bloc ouvert le replie, tandis que le clic sur un bloc replié l'ouvre.
- `index.html` : révision de l'URL de `songs.js` pour éviter le cache de l'ancienne version.
- `tests/song-block-area-toggle-test.cjs` : tests des zones libres et de la préservation des paramètres et de la lecture.
- `tests/validation-2026-10-06-block-toggle/song-block-area-toggle-results.json` : résultats.

PASS : résumé, aperçu du clic, espaces libres près des paramètres et des actions, ouverture/fermeture par le titre, champs et numbox toujours utilisables, comportement mobile. Replier pendant la lecture ne l'arrête pas, ne remplace pas son contexte audio et ne modifie pas la bibliothèque.

Non-régression : blocs repliables, libellés conservés, suppression, ouverture mobile, lecture/arrêt du morceau, profils isolés et export de deux MP3 valides. Aucune modification du scheduler, des samples, de la grille, des structures enregistrées, du chrono ou du module d'export.

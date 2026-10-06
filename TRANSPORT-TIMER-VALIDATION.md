# Chrono Play / Stop — 6 octobre 2026

Modification demandée après le commit d'export MP3 `fe724ef913056031a54724e3f301d22ca6c2be39`, dans un commit séparé.

- `index.html` : remettre le chrono de durée à zéro au démarrage et à l'arrêt du transport commun au métronome et aux morceaux ; actualiser immédiatement son affichage.
- `tests/transport-timer-test.cjs` : deux cycles Play / Stop par transport, clavier, écoulement du chrono et fin automatique du morceau.
- `tests/validation-2026-10-06-transport-timer/transport-timer-results.json` : résultats.

Format d'affichage conservé (`0:00` pour zéro). Le comptage musical, le scheduler, les structures, la playlist, les banques et l'export MP3 restent inchangés. Le compte à rebours d'entraînement garde son comportement.

Validation : chrono immédiatement nul au Play et au Stop, durée qui augmente pendant la lecture, remise à zéro à la fin naturelle du morceau. Contrôles supplémentaires : personnalisation du chrono, lecture/arrêt du morceau et export MP3.

La validation MP3 reste attachée à son commit d'origine, avec [son rapport](https://github.com/renaxdrums/RENAX-DRUMS/blob/fe724ef913056031a54724e3f301d22ca6c2be39/MP3-EXPORT-VALIDATION.md). La fenêtre Windows native de destination demeure à valider manuellement ; le contrat de l'API et les exports sur GitHub Pages ont été testés.

# Export MP3 — validation du 6 octobre 2026

Base verrouillée : `e9478bbb4fff39fb97fbd05f9901e209fd67437f`.

## Périmètre

Seul fichier existant modifié : `index.html`, exactement deux lignes supplémentaires (chargement de la feuille de style et du script d'export).

Fichiers d'application ajoutés :

- `mp3-export.js` : bouton EXPORT MP3 dans la Playlist, sélection du morceau, fenêtre native de destination, rendu isolé et vérification après encodage.
- `mp3-export.css` : styles limités à la fenêtre d'export.
- `mp3-export-worker.js` : analyse des crêtes, gain du programme complet, limiteur de sécurité et encodage.
- `vendor/lamejs/lame.min.js`, `LICENSE`, `COPYING`, `COPYING.LESSER`, `NOTICE.md`, `UPSTREAM-COMMIT.txt` : encodeur lamejs 1.2.1 non modifié et attribution/licences, source amont épinglée.

Tests ajoutés : `tests/mp3-export-test.cjs`, `tests/mp3-score-reference-test.cjs`, `tests/mp3-native-picker-test.cjs`, `tests/mp3-published-test.cjs`. Rapports ajoutés dans `tests/validation-2026-10-06-mp3/` : `mp3-export-results.json`, `mp3-score-reference-results.json`, `mp3-scope-results.json`, `mp3-regression-results.json`. Le test de publication vérifie aussi la fenêtre centrée, la playlist vide, la vue Profil, l'affichage mobile et le message des navigateurs sans API de destination.

`songs.js`, `songs.css`, les banques, les WAV, le scheduler, la grille, les structures et les réglages existants restent inchangés. Aucun champ de banque ou de volume par bloc n'a été ajouté. Les anciens fichiers d'archives et workflows sont conservés dans l'arbre Git de base. Une différence locale antérieure dans un workflow est exclue de ce commit.

## Rendu et niveau

Le morceau enregistré est copié en lecture seule. La banque et le volume globaux sont capturés au clic sur Exporter. Une iframe invisible utilise les fonctions audio existantes dans son propre OfflineAudioContext à 48 kHz ; le contexte de lecture principal n'est jamais remplacé. Chaque pas suit exactement le calcul de durée du scheduler actuel, avec ses silences, subdivisions et accents. Les voix conservent les attaques originales et les groupes en /16 et /32. Le pré-déclenchement vocal nécessite 262 ms de pré-roll ; les queues naturelles des banques instrumentales sont conservées. L'encodage MP3 ajoute son délai/padding de format à l'ensemble, sans changer les intervalles musicaux.

Le gain est déterminé sur le rendu complet, avec une mesure de crête reconstruite à huit phases (sinc fenêtrée, 32 coefficients par phase). Un limiteur à anticipation de 5 ms protège le rendu. Le seuil interne de −1,15 dBTP donne une marge de 0,15 dB sous le plafond demandé de −1 dBTP. Le MP3 mono 48 kHz / 320 kbit/s est redécodé et remesuré ; si nécessaire, le gain global est réduit puis l'ensemble réencodé. Aucun clic n'est normalisé séparément. Un volume global nul produit un fichier silencieux.

Sur les huit exports analysés indépendamment par FFmpeg (rééchantillonnage 8×, filtre de 96 coefficients), les crêtes sont de **−1,153 à −1,195 dBTP**, avec **zéro échantillon écrêté**. Le test avec le clic global à 5 % reçoit environ **+28,40 dB** de gain global et atteint −1,193 dBTP. Le limiteur n'altère aucun des rapports sur ces fixtures : son gain minimal reste 1. Sur une impulsion artificielle de niveau 2, il limite à 0,89 (gain minimal 0,445).

Les ratios des accents sont conservés exactement avant encodage (gain commun, limiteur inactif sur les fixtures). Après MP3, l'écart maximal des rapports RMS mesurés est 0,207 dB, dû à l'encodage avec pertes ; ce test ne prétend pas que les échantillons MP3 sont identiques au PCM.

## Tests demandés

| Test | Résultat |
|---|---|
| 1. EXPORT MP3 dans la Playlist | PASS ; absent des réglages de blocs et de la vue Profil |
| 2. Tous les morceaux dans la liste | PASS ; quatre titres, même ordre, sélection par identifiant |
| 3. Plusieurs sélections | PASS ; Essai A et Essai B génèrent des fichiers de durées distinctes correspondant aux morceaux choisis |
| 4. Dossier de destination | PASS du contrat File System Access et de l'écriture dans un dossier réel de test ; **fenêtre Windows native non validée manuellement** |
| 5. Nom de fichier | PASS ; `Essai A.mp3` et `Essai B.mp3`, nom proposé via `suggestedName` ; caractères interdits assainis |
| 6. MP3 valide | PASS ; ffprobe et décodage FFmpeg, sept banques, 48 kHz mono / 320 kbit/s |
| 7. Structure complète et ordre | PASS ; 20 mesures, 88 pulsations, durée musicale 49,690721649 s ; fichier 49,776 s avec queue et padding MP3 |
| 8. Niveau suffisant | PASS ; gain de tout le programme, crêtes proches du plafond demandé, y compris entrée à 5 % |
| 9. Saturation | PASS ; aucune crête au-delà de −1 dBTP, zéro échantillon ≥ 1 en valeur absolue |
| 10. Accents et différences de niveau | PASS ; gain commun, ratios testés, erreur RMS après encodage < 0,207 dB |
| 11. Aucun volume par bloc | PASS ; modèle de bibliothèque et fichiers de playlist inchangés |
| 12. Non-régression | PASS sur les suites ci-dessous ; export pendant la lecture : même contexte, mêmes mesures et intervalles de 500 ms |

La boîte Windows réelle a été déclenchée par le test dédié ; sa manipulation automatisée n'a pas abouti car l'autorisation de contrôle de Chrome a expiré. Ce test ne doit pas être présenté comme un succès. Pour le terminer, exécuter `mp3-native-picker-test.cjs` puis choisir le dossier `tests/results/native-destination` et conserver le nom proposé. Chrome/Edge sur ordinateur est requis pour cette fonction de choix natif ; les navigateurs qui n'exposent pas l'API affichent cette limitation dans la fenêtre d'export. Aucun téléchargement vers un dossier imposé n'est substitué silencieusement au choix de destination.

## Comparaison indépendante avec la lecture

`mp3-score-reference-test.cjs` extrait les événements du scheduler existant puis rend sa sortie de référence. Test : métriques 4/4, 3/4, 5/8, 7/16, 20/32 ; tempos 60, 120, 97 et 123 ; subdivisions 1, 2, 3 et 7 ; silences et trois états de clic.

- Sept banques × 142 événements audibles, soit 994 événements ; mêmes états, accents, contextes et heures de déclenchement.
- Différence de grille : **0 s**.
- Erreur PCM maximale : **4,7684 × 10⁻⁷**, compatible avec l'arrondi Float32 entre rendus séparés.

Suites de non-régression exécutées : `songs-test`, `songs-playback-test`, `song-folded-blocks-test`, `song-navigation-test`, `song-card-style-test`, `song-numbox-test`, `playlist-card-click-test`, `playlist-drag-test`, `customization-timer-test`, `pulse-popup-live-test`, `pulse-popup-test`, `popup-drag-test`, `particle-cleanup-test`, `male-voice-no-click-test`, `grouped-voice-test`, `subdivision-mix-test`, `timing-test`, `regression-test`.

Contrôles couvrant stockage/rechargement, import/export JSON, profils isolés, blocs repliables, menus, glisser-déposer souris/tactile, cercle, fenêtre de pulsation, traces bleues, subdivisions, accents, lecture et arrêt du morceau, chrono et voix. Les 400 repères vocaux ont 0 ms d'erreur mesurée à résolution de 1 ms. Le test de 10 000 pulsations à 60 BPM mesure 0 s de dérive. Les banques instrumentales restent identiques à l'arrondi Float32 près.

## Références techniques

- [File System Access API — documentation Chrome](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access) : picker appelé directement dans le geste utilisateur, avant le rendu, puis écriture et fermeture du fichier choisi.
- [ITU-R BS.1770-2, annexe 2](https://www.itu.int/dms_pubrec/itu-r/rec/bs/R-REC-BS.1770-2-201103-S!!PDF-E.pdf) : distinction entre crête échantillon et crête reconstruite. La mesure du module utilise le filtre documenté ci-dessus ; aucune certification ITU du filtre n'est revendiquée.
- [Source lamejs épinglée](https://github.com/zhuker/lamejs/tree/582bbba6a12f981b984d8fb9e1874499fed85675).

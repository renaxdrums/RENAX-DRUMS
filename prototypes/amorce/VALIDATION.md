# Amorce — test d’écoute, calage à valider

9 octobre 2026. David a autorisé la publication de cette page isolée avec un repère provisoire pour une passe d’écoute. Ce n’est pas une certification du test minimal ni une intégration de la fonction complète. La surveillance automatique est désactivée.

Base du dépôt : `274f5030c501caab8d8e4d0eddb5730522707715`. Les fichiers de l’application existante et les samples restent inchangés. Aucun correctif audio/décompte ancien ou correctif de glisser-déposer n’est présenté comme Amorce.

## Page livrée

Ouvrir `/prototypes/amorce/`. Trois blocs avec libellés libres, FR par défaut, boutons FR/EN près du texte. La première sélection définit une langue commune ; les changements suivants sont locaux. Les réglages du test sont communs aux trois blocs : banque, métrique, subdivisions, tempo et nombre de mesures.

La page synthétise la voix complète localement, obtient des événements phonétiques et calcule un candidat de dernière syllabe. Elle place ce candidat sur le premier temps de la mesure précédente. L’annonce remplace one ; les autres temps utilisent les samples masculins anglais existants. La banque choisie reprend au début du bloc. Le décompte initial contient au moins deux mesures, davantage si le libellé l’exige. Les fonctions audio de l’application sont utilisées dans une instance séparée, à l’intérieur d’un iframe du test ; Stop ferme uniquement le contexte du prototype.

**Le début acoustique réel de la dernière syllabe n’est pas certifié. Son erreur réelle reste non mesurée.** Le dernier mot n’est jamais utilisé comme substitut. Les horodatages de phonèmes ne constituent pas une annotation acoustique indépendante.

## Résultats reproductibles

| Vérification | Résultat | Portée |
| --- | --- | --- |
| Synthèse de sept textes FR/EN | Tous produisent du PCM ; aucun échantillon saturé ; pic 0,7890015 | Synthèse isolée |
| Corpus de 34 libellés, 17 FR et 17 EN | 33 candidats ; Psst EN refusé, absence de noyau détecté | Pas 33 syllabes certifiées |
| Quatre attentes phonotactiques | Introduction FR, Couplet FR, Chorus EN, breakdown EN passent | Attentes linguistiques, pas annotation acoustique |
| 75 calculs monobloc | 40/60/120/240/320 BPM ; 2/3/4/5/7 temps | Repères synthétiques |
| 20 calculs multiblocs | Trois blocs ; 3/4, 4/4, 5/4, 7/8 ; cinq tempos | BPM défini comme la noire ; 7/8 compte des croches |
| 54 rendus audio monoblocs Chromium, 48 kHz | Pic 0,452667 ; zéro saturation ; one remplacé, comptages masculins, reprise de banque | Sept banques, subdivisions 2/4 ; transport du candidat 0 ms, pas erreur acoustique de syllabe |
| Huit rendus audio multiblocs Chromium, 48 kHz | Trois blocs ; 60/240 BPM ; 3/4, 4/4, 5/4, 7/8 ; zéro saturation | Banques claves/cloche/voiceFemale ; subdivisions 4 ; calage acoustique non certifié |
| Stop dans Chromium | Contexte fermé ; source future annulée par fermeture ; Stop répété sans erreur | Contexte de l’application préservé |
| Page mobile Chromium, 390 px | Langue commune puis locale, trois blocs programmés, Stop pendant préparation et lecture, relance, aucun débordement horizontal, aucune erreur JS | Pas de validation perceptive ou de compatibilité universelle |

Preuves JSON dans ce dossier : engine-results, corpus-results, render-results, phonemic-results, stop-results, page-results et sequence-render-results.

La resynthèse de la dernière syllabe a aussi été étudiée : les phonèmes d’Introduction FR et Couplet FR sont conservés, mais Chorus EN et Bottle EN prennent un accent principal supplémentaire lorsque leur fin est synthétisée séparément. Cette méthode n’est pas utilisée par la page. Fire EN regroupe aɪə dans un seul événement : compter les événements vocaliques ne prouve pas le nombre de syllabes.

## Limites explicites

- Trois blocs de même métrique et de même banque, deux à huit mesures par bloc. Ce n’est pas l’éditeur de morceaux complet.
- 40–320 BPM exprimés en noires. Les annonces qui se chevauchent ou débordent dans le bloc sont refusées plutôt que raccourcies.
- Syllabification phonotactique expérimentale : prononciations rares, noms propres, langues mélangées et consonnes ambisyllabiques non certifiés.
- Voix formantique eSpeak NG. L’intelligibilité et le confort d’écoute restent à juger par David.
- Les tests du navigateur utilisent un miroir local des fichiers CDN. La disponibilité du CDN a été vérifiée séparément : HTTP 200 ; données identiques au fichier utilisé dans les tests, SHA-256 `34d8d90d112acd35f6b7cdf3da16125444aeeebc4b68bee87cd55d6f7e4dd3a0`.
- Aucune validation perceptive humaine, aucune garantie d’erreur nulle de dernière syllabe. Timeline et raccourcis de navigation hors périmètre.

## Mini plan de test manuel

1. À 120 BPM en 4/4, lancer la séquence et écouter les trois textes. Vérifier au moins deux mesures de décompte et l’annonce du premier bloc dans la dernière.
2. Entrer des libellés personnels FR/EN, courts et longs. Sélectionner EN une première fois puis FR sur un autre bloc : vérifier la portée commune puis locale.
3. À chaque transition, écouter l’annonce à la place de one, les comptages masculins suivants, puis le retour de la banque choisie. Vérifier les accents et subdivisions.
4. Essayer 3/4, 5/4, 7/8 et 60/240 BPM. Noter les refus de chevauchement ou de débordement, sans les confondre avec un calage validé.
5. Stop pendant le chargement puis pendant la lecture ; relancer. Vérifier que la page principale du métronome fonctionne toujours comme auparavant.
6. Pour chaque texte, noter le début de la dernière syllabe : avant, sur ou après le premier temps de la mesure précédente. Pour une mesure chiffrée conforme, annoter indépendamment la syllabe dans l’enregistrement du mix et comparer sa position à la grille.

## Sources, licence et reproduction

- https://wicg.github.io/speech-api/ : pas d’AudioBuffer ou de repères de syllabes fournis par SpeechSynthesis.
- https://github.com/espeak-ng/espeak-ng/blob/master/src/include/espeak-ng/speak_lib.h : PCM et événements phonétiques.
- https://espeak.sourceforge.net/phonemes.html : entrée phonémique, stress, diphtongues et triphtongues.
- Moteur eSpeak NG Emscripten version 0.4.1 : https://github.com/echogarden-project/espeak-ng-emscripten/tree/7ab07eba2d966ce45040c88d9be953e1d68640e7 ; licence GPL-3.0, COPYING conservé.

Le navigateur charge les fichiers publics du moteur depuis jsDelivr sur cette révision immuable (~19 Mo de données et 604 Ko de JavaScript). Les textes saisis restent sur l’appareil ; aucune clé, aucun compte et aucune installation ne sont requis pour écouter le test. Le CDN doit être accessible.

Pour reproduire les tests en développement, télécharger `espeak-ng.js` et `espeak-ng.data` de cette révision dans ce dossier. Les tests Node sont `tests/amorce-*-test.mjs`. Les tests Chromium pertinents sont amorce-page-test.cjs, amorce-render-test.cjs, amorce-sequence-render-test.cjs et amorce-stop-test.cjs ; ils utilisent le harnais existant, PLAYWRIGHT_MODULE et CHROME_PATH, et servent les modules .mjs avec le MIME JavaScript. Le miroir CDN du harnais n’est pas utilisé par la page publiée.

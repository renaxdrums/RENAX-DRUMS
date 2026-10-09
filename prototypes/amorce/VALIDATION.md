# Amorce — nouvelles voix, calage à valider

9 octobre 2026. Prototype isolé publié pour la passe d'écoute autorisée par David. Ce n'est pas une certification du test minimal complet.

## Version actuelle

Kokoro-82M synthétise localement les libellés libres : Siwis (ff_siwis) en FR, George (bm_george) en EN. eSpeak NG sert seulement à la phonémisation ; sa voix robotique n'est plus jouée. Les événements sont repositionnés à partir des durées prédites par Kokoro, sans réutiliser les timings du son eSpeak.

FR par défaut ; première sélection de langue commune puis modifications locales. Au moins deux mesures de décompte, premier bloc annoncé dans la dernière. L'annonce remplace one. Les enregistrements masculins anglais originaux comptent les temps suivants sans clic principal superposé ; les subdivisions restent entre les temps. La banque choisie reprend au début du bloc. L'adaptation audio reste dans l'iframe du prototype : moteur principal et samples inchangés.

**Le début acoustique réel de la dernière syllabe reste non certifié et son erreur réelle non mesurée.** Les repères prédits ne sont pas une annotation acoustique indépendante ; le dernier mot n'est pas utilisé comme substitut.

## Résultats actuels

| Test | Résultat | Portée |
| --- | --- | --- |
| Six synthèses neuronales FR/EN personnalisées | PCM fini, pic 0,7015051, zéro saturation | Exécution CPU native |
| Synthèse WASM Chromium | Trois annonces avec Siwis et George | Dépendances externes servies par miroir local |
| Huit mixages de trois blocs à 48 kHz | 60/120 BPM ; 3/4, 4/4, 5/4, 7/8 ; subdivisions 4 ; zéro saturation ; pic 0,3706495 | Banques claves/cloche/voiceFemale |
| Quinze rendus de two/three/four | 40/60/120/240/320 BPM ; erreur maximale de transport 0,01205 ms ; aucun oscillateur de clic principal | Début du sample détecté au seuil 1e-5, pas attaque perceptive certifiée |
| Page mobile 390 px | Langue commune puis locale, Stop préparation/lecture, relance, aucun débordement horizontal ou erreur JS | Chromium, pas compatibilité universelle |

Preuves : neural-results.json, count-onset-results.json, page-results.json. Tests : tests/amorce-neural-test.mjs, tests/amorce-count-onset-test.cjs, tests/amorce-page-test.cjs. tests/amorce-neural-route.cjs fournit uniquement le miroir de test et n'est pas chargé en production.

Les autres rapports du dossier concernent le prototype formantique historique ; ils ne valident pas les nouvelles voix. Aucun ancien correctif audio/décompte ou glisser-déposer n'est présenté comme ce travail.

## Limites et revue critique

- Trois blocs de même métrique et banque, deux à huit mesures par bloc, 40–320 BPM en noires.
- Chevauchement ou débordement d'annonce refusé. Au-delà de 508 caractères phonétiques, refus explicite, pas de troncature ou de liste fixe.
- Dernière syllabe, noms propres et prononciations rares restent à valider par annotation acoustique indépendante.
- Premier téléchargement d'environ 140 Mo, puis cache selon le navigateur. Performance sur tous les téléphones non vérifiée.
- Accès requis à jsDelivr et Hugging Face. Les tests navigateur utilisent les fichiers épinglés via un miroir ; l'accès distant de tous les utilisateurs n'est pas certifié.
- Stop empêche la lecture après préparation sans interrompre immédiatement le calcul du worker.
- Texte traité sur l'appareil, aucun compte payant, clé côté client, serveur payant ou installation utilisateur.
- Timeline, raccourcis et intégration à la fonction complète hors périmètre.

## Mini plan manuel

1. À 120 BPM, 4/4, subdivision 1, écouter les annonces FR puis EN et vérifier le décompte minimum de deux mesures.
2. Entrer des libellés libres ; sélectionner EN puis FR sur un autre bloc pour vérifier la portée commune puis locale.
3. Écouter two, three, four sans clic principal doublé ; vérifier la reprise de banque au bloc, puis ajouter des subdivisions.
4. Essayer 60/120 BPM et 3/4, 5/4, 7/8 ; noter les refus de chevauchement.
5. Stop pendant préparation puis lecture ; relancer.
6. Noter la dernière syllabe avant/sur/après le temps précédent. Une mesure réelle exige une annotation indépendante du mix.

## Dépendances et reproduction

- Kokoro-82M quantifié, révision dd4401a9add81ac692d20e240d22ec9dda82cc29 : https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX-timestamped ; Apache-2.0.
- Transformers.js 3.8.1 : https://github.com/huggingface/transformers.js ; Apache-2.0.
- eSpeak NG Emscripten 0.4.1, révision 7ab07eba2d966ce45040c88d9be953e1d68640e7 : https://github.com/echogarden-project/espeak-ng-emscripten ; GPL-3.0, COPYING conservé.
- https://wicg.github.io/speech-api/ : SpeechSynthesis ne fournit pas l'AudioBuffer et les repères de syllabes requis ici.

Pour reproduire, télécharger modèle quantifié, tokenizer et styles ff_siwis/bm_george de la révision épinglée. Fournir TRANSFORMERS_MODULE et NEURAL_ASSETS au test natif ; PLAYWRIGHT_MODULE et CHROME_PATH aux tests Chromium. Les poids ne sont pas ajoutés au dépôt.

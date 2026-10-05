# Comptage vocal révisé — 5 octobre 2026

Référence avant correction : `aa737d673d5e38a2145609d19f7f678938165f2b`. La première correction `a9a30105bac43004091225c72b32118b60df991d` a été rejetée à l'écoute : son seuil de volume ne correspondait pas au moment perçu du nombre.

Les 80 WAV ont été restaurés depuis les enregistrements humains complets des mêmes locuteurs et des mêmes sources. Le traitement précédent pouvait supprimer une consonne faible ou arrêter le mot à une pause interne. Désormais, seul le silence extérieur est retiré, avec une marge protégeant les consonnes ; les pauses internes et les fins de mots sont conservées. Vérification ciblée de 3, 7 et 9 dans les quatre banques ; restauration notamment des fichiers masculins FR 7 et 9, réduits précédemment à environ 135 ms, et du début de « trois » féminin FR.

Chaque sample possède une avance propre pour placer le noyau vocal annoté sur le beat Web Audio. Les consonnes commencent avant ce beat. La vitesse de lecture reste 1. La grille et ses incréments restent inchangés. Le scheduler vocal anticipe les sources, le premier beat attend le pré-roll, les aperçus utilisent la même compensation, et Stop annule les voix déjà planifiées. Les URL des WAV portent une nouvelle version pour éviter que le navigateur réutilise les fichiers tronqués en cache. Aucun changement HTML/CSS ni dans les définitions des banques non vocales.

Mesures sous Chrome, Web Audio à 48 kHz :

| Contrôle | Résultat |
| --- | --- |
| Quatre banques, nombres 1–20 | 80 noyaux vocaux annotés et liés aux SHA-256 des fichiers |
| Rendu vocal, 28 scénarios de 20 nombres | 560 repères sur la grille, erreur mesurée 0 ms avec un pas de recherche de 1 ms |
| 60 BPM, 4/4, horloge réelle | 1,000 s entre attaques calibrées, retour 4→1 inclus |
| 120 BPM, 4/4, horloge réelle | 0,500 s entre attaques calibrées, retour 4→1 inclus |
| 3/4, 5/4, subdivisions 2–8 | Séquence des nombres et grille conformes |
| Plusieurs mesures, 60→120→90 BPM | Transitions conformes, aucun déclenchement tardif |
| 10 000 pulsations à 60 BPM, rappels simulés | Dérive de grille mesurée : 0 s |
| Clic, claves, clic808, beep | Rendus PCM identiques avant/après |
| Cloche | Écart d'arrondi maximal 5,96 × 10⁻⁸ en amplitude flottante ; code inchangé |
| Stop | Voix planifiées annulées |

Les résultats détaillés actuels sont dans `tests/validation-2026-10-05-v2/`. Les anciens résultats dans `tests/validation-2026-10-05/` ne sont pas une validation perceptive. Les callbacks irréguliers sont simulés pour les longs tests ; les contrôles à 60/120 BPM utilisent aussi le vrai timer du navigateur. Les rendus sont comparés au segment vocal annoté du fichier source, indépendamment du tableau utilisé par l'application.

Le nouveau repère suit la montée du noyau vocal dans une région du mot revue, avec une enveloppe filtrée 300–2500 Hz. Ce choix évite de confondre une petite prévoix de « d » ou un bruit de consonne avec la voyelle. Les régions de « treize » et « dix-sept » masculins FR ont été revues pour ne pas choisir une montée plus tardive. Les repères de la version d'écoute améliorée ont été transférés aux enregistrements complets par corrélation, puis contrôlés sur leurs nouvelles enveloppes. Voir `tests/voice-anchors.json` et `complete-voice-restoration.json`.

Ce travail tient compte de la distinction entre début acoustique et moment perçu d'un mot, généralement proche du début de la voyelle ([Rathcke, 2025](https://www.nature.com/articles/s42003-025-07544-8)). Le repère reste une approximation explicite, pas une certification psychoacoustique universelle. L'utilisateur a jugé la nouvelle écoute FR « mieux », a signalé l'amorce de « trois », puis a demandé d'essayer la version complète après le contrôle de 3, 7 et 9. Aucun enregistrement du périphérique de sortie ni suppression de sa latence matérielle n'est revendiqué.

La réussite d'un workflow GitHub Pages établit uniquement le déploiement. Les contrôles audio ci-dessus servent de validation fonctionnelle.

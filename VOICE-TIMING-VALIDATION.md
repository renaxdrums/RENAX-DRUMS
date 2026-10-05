# Validation du comptage vocal — 5 octobre 2026

Référence avant correction : `aa737d673d5e38a2145609d19f7f678938165f2b`.

Les 80 WAV restent inchangés. Chaque sample possède désormais une avance propre, de 0 à 249 ms, pour placer son attaque acoustique mesurée sur le beat Web Audio. La vitesse de lecture reste 1. La grille et ses incréments restent inchangés. Le scheduler vocal anticipe suffisamment les sources, le premier beat attend le pré-roll, les aperçus utilisent la même compensation, et Stop annule les voix déjà planifiées. Aucun changement HTML/CSS ni dans les définitions des banques non vocales.

Mesures sous Chrome, Web Audio à 48 kHz :

| Contrôle | Résultat |
| --- | --- |
| Quatre banques, nombres 1–20 | 80 attaques analysées individuellement |
| Rendu vocal, 28 scénarios de 20 nombres | 560 attaques sur la grille, erreur inférieure à 1 ms (résolution du détecteur) |
| 60 BPM, 4/4, horloge réelle | 1,000 s entre attaques calibrées, retour 4→1 inclus |
| 120 BPM, 4/4, horloge réelle | 0,500 s entre attaques calibrées, retour 4→1 inclus |
| 3/4, 5/4, subdivisions 2–8 | Séquence des nombres et grille conformes |
| Plusieurs mesures, 60→120→90 BPM | Transitions conformes, aucun déclenchement tardif |
| 10 000 pulsations à 60 BPM, rappels simulés | Dérive de grille mesurée : 0 s |
| Clic, claves, clic808, beep | Rendus PCM identiques avant/après |
| Cloche | Écart d'arrondi maximal 5,96 × 10⁻⁸ en amplitude flottante ; code inchangé |
| Stop | Voix planifiées annulées |

Les résultats détaillés et les tests reproductibles se trouvent dans `tests/`. Les callbacks irréguliers sont simulés pour les longs tests ; les contrôles à 60/120 BPM utilisent aussi le vrai timer du navigateur.

L'attaque est définie comme le premier passage soutenu pendant 10 ms au-dessus de 20 % du pic RMS (fenêtre 5 ms, pas 1 ms, plancher 0,01). Ce critère acoustique est explicite et reproductible ; il ne constitue pas une certification psychoacoustique de la perception de chaque auditeur. Aucun test d'écoute humaine, enregistrement du périphérique de sortie, ni élimination de sa latence matérielle n'est revendiqué.

La réussite d'un workflow GitHub Pages établit uniquement le déploiement. Les contrôles audio ci-dessus servent de validation fonctionnelle.

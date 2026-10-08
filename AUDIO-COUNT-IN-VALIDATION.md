# Validation audio et décompte — 8 octobre 2026

## Périmètre
Gains des banques, suppression du rabattement permanent des voix et regroupement des reconstructions des menus lors de l’ajout du décompte. Aucun sample, attaque, structure de morceau, style visuel ou règle de tempo modifié.

## Mesures audio
Rendu Web Audio hors ligne, mono, 48 kHz, volume utilisateur à 100 %. Signal mesuré **avant** la protection de sécurité. 2016 scénarios : banques seules et subdivisions autorisées, trois accents, tempos 20/60/300 BPM, unités 2/4/8/16/32 et superpositions polyrythmiques (2:20, 3:20, 20:20, 20:2 et 2:2 à 300 BPM). Les maxima sont ceux des scénarios testés, pas une preuve exhaustive de toutes les combinaisons possibles.

| Banque | Crête maximale avant protection (dBFS) | Échantillons écrêtés |
|---|---:|---:|
| clic | -1.67 | 0 |
| cloche | -2.72 | 0 |
| claves | -3.10 | 0 |
| clic808 | -2.54 | 0 |
| beep | -4.47 | 0 |
| voiceMale | -2.00 | 0 |
| voiceFemale | -2.00 | 0 |

Décompte rapide (40 pulsations/s) : -1.79 dBFS.

Critère : crête ≤ −0,5 dBFS. Tous les scénarios passent. La protection reste active à −0,1 dBFS ; sa courbe est identique au signal dans toute la plage utilisée. Elle est un plafond instantané de sécurité, pas un compresseur musical : elle n’est jamais sollicitée dans les scénarios mesurés. Aucun ajout de latence.

Les 240 comparaisons couvrent les 40 samples vocaux × trois accents × premier temps ou temps ordinaire. Écart maximal avec le signal original multiplié par 0,25 : 5.96e-08. Attaques et formes d’onde conservées, échantillon par échantillon.

Les subdivisions conservent le gain approuvé de +4,5 dB. Leurs crêtes isolées restent ordonnées : accent 1 : -13.70 dBFS, accent 2 : -10.83 dBFS, accent 3 : -8.71 dBFS.

## Décompte et fluidité
Cause reproduite : le MutationObserver reconstruisait un menu de tempo pour chacune des options ajoutées (281 options de tempo), soit des centaines de reconstructions identiques. Chaque select connecté est désormais reconstruit une fois par lot de mutations. Les éléments retirés ne sont pas traités.

Navigateur Chromium, viewport 390 × 844 : ajout du décompte en 17.4 ms après correction. Avant correction : tâche bloquante de 1 364 ms et environ 174 000 mutations de menus après ajout ; après correction : 1 579 mutations de menus et aucune tâche longue dans le scénario enregistré. Ces mesures ne sont pas celles d’un téléphone physique.

Tests validés : changement du tempo du premier bloc ; inversion réelle des blocs par glisser-déposer ; modification du bloc suivant ; aucune reconstruction de menus au repos ; quatre pulsations de décompte au tempo du premier bloc, puis seize temps du morceau ; arrêt automatique à la fin. Le calcul du tempo reste événementiel.

## Vérifications et limites
Tests dédiés : `audio-headroom-test.cjs`, `audio-linear-mix-test.cjs`, `count-in-performance-test.cjs`. Les tests `grouped-voice-test.cjs`, `male-voice-no-click-test.cjs` et `customization-timer-test.cjs` passent également.

Deux tests anciens ne sont pas utilisables comme validation de cette livraison : `timing-test.cjs` échoue sur ses repères vocaux aussi avec le HTML initial du dépôt ; `songs-playback-test.cjs` attend un ancien bouton « Nouveau morceau ». Ils n’ont pas été modifiés. La conservation des attaques est contrôlée par le nouveau test de comparaison intégrale ; le décompte, les changements de bloc et l’arrêt final sont contrôlés par le nouveau test fonctionnel.

Écoute perceptive, comportement du téléphone physique et sortie analogique non vérifiés. Aucune prétention de mesure de true peak analogique : les valeurs ci-dessus sont des crêtes numériques d’échantillons.

## Mini plan de test utilisateur
1. Recharger le site, ajouter un décompte, puis modifier le bloc suivant : aucune pause perceptible.
2. Changer le tempo du premier bloc, puis inverser les blocs : le décompte doit suivre le nouveau premier tempo. Lancer le morceau et vérifier sa fin automatique.
3. Écouter chaque banque, particulièrement les deux voix, la cloche et la 808, à tempo lent puis rapide, avec subdivisions et accents : pas de saturation ; subdivisions clairement audibles ; accents distincts.

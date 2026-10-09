# Lecture d’un bloc — 9 octobre 2026

Périmètre : retirer l’unité BPM située à droite du numbox Tempo des blocs, ajouter un triangle près des trois points pour écouter uniquement un bloc, et retirer le bouton Dupliquer de la fiche du morceau. La duplication dans le menu du morceau reste disponible. Le résumé « 120 BPM » et les autres interfaces ne changent pas.

La lecture du bloc utilise un snapshot d’une seule section, sans le décompte du morceau. Elle respecte le nombre de mesures, le tempo, la métrique, les subdivisions et les états d’accents/mute. Elle s’arrête à la fin du bloc. Le bouton principal Lire le morceau recharge la structure complète après un aperçu.

## Vérifications automatiques

`tests/song-block-preview-test.cjs` dans Chromium : bloc central de deux mesures en 3/8 à 300 BPM, subdivisions irrégulières 2/1/3 avec un état muet. Dix événements, intervalles conformes à la grille, aucun bloc voisin et aucun décompte. Structure sauvegardée identique avant/après.

Lecture complète après aperçu : trois sections et décompte présents, 16 événements plus deux temps de décompte. Arrêt manuel et passage d’un aperçu à un autre vérifiés. À 390 px, numbox Mesures et Tempo ont exactement le même bord droit ; unité BPM absente ; un triangle par bloc. Menu du bloc utilisable. Bouton Dupliquer de fiche absent ; duplication du morceau par son menu testée. Aucune erreur JavaScript. Résultats : `tests/results/song-block-preview-results.json`.

Revue de périmètre : modification de songs-index2.js ; index.html change uniquement la révision du chargement de ce script. Pas de modification du moteur audio, des samples, des gains, des accents ou du décompte existant.

## Mini plan manuel

1. Ouvrir un morceau et un bloc : vérifier l’alignement des numbox et le triangle à gauche des trois points.
2. Cliquer sur le triangle d’un bloc central : écouter uniquement ses mesures, puis vérifier l’arrêt automatique. Essayer Stop et un autre bloc.
3. Cliquer sur Lire le morceau : vérifier tous les blocs et le décompte enregistré.
4. Vérifier que Dupliquer n’est plus dans la fiche ; dans la playlist, ouvrir les trois points du morceau et tester Dupliquer.

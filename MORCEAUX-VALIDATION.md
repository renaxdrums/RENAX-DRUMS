# Morceaux locaux — validation du 6 octobre 2026

Dans la colonne Séquenceur, choisir Morceaux : une entrée Profil puis une entrée Playlist. Profil regroupe le choix, la création, le renommage et les sauvegardes ; aucun bouton Nouveau morceau sur cette page. Playlist affiche les titres avant leur structure. Cliquer sur un titre ouvre les blocs du morceau. Les petites flèches en haut à gauche reviennent à la page précédente. Les flèches des blocs ordonnent les sections. Lire le morceau est orange.

Chaque profil possède sa bibliothèque dans ce navigateur. Nouveau morceau crée une structure modifiable : libellé libre avec suggestions Intro, Couplet, Refrain, Bridge, Solo et Outro ; nombre de mesures ; tempo. Sélectionner le bloc pour régler sa métrique, ses subdivisions et ses accents avec le métronome. Les sections et morceaux peuvent être copiés. La suppression d'un morceau demande confirmation.

Les modifications sont enregistrées automatiquement dans localStorage sous `renax-drums-songs-v1`. Exporter télécharge une bibliothèque JSON ; Importer valide ce format et ajoute des profils importés sans remplacer les données existantes. Un profil local n'est pas un compte authentifié et ne synchronise pas d'autres appareils. L'export audio MP3 n'est pas inclus à ce stade.

Lire le morceau utilise la grille Web Audio existante, applique le tempo et la métrique de chaque section, puis s'arrête à la fin. Les répétitions sont représentées par les sections plutôt que par une grande liste de mesures. Il n'y a pas de limite de huit mesures pour les morceaux. Le séquenceur classique conserve ses propres mesures et retrouve son état lorsqu'on y revient. Régler le clic ouvre le motif de la section dans le cercle : les subdivisions et accents modifiés sont sauvegardés pour toutes ses répétitions.

Le chrono de durée repart à 0:00 après une personnalisation du métronome. S'il joue, le chrono continue à tourner. Cette remise à zéro ne modifie ni la position musicale ni le scheduler.

## Blocs réduits

Le titre du bloc reprend son libellé. Ajouter ou copier un bloc ouvre celui-ci et réduit les autres. Un bloc réduit conserve son titre, son nombre de mesures, sa métrique et son tempo ; son en-tête permet de le rouvrir ou de le refermer. Les libellés restent sauvegardés. `tests/song-folded-blocks-test.cjs` vérifie ces actions, la suppression du bloc ouvert et la réouverture sur mobile. Rapport dans `tests/validation-2026-10-06-folded-blocks/`.

## Navigation et ergonomie

`tests/song-navigation-test.cjs` vérifie Profil au-dessus de Playlist, création et renommage du profil, absence de Nouveau morceau dans Profil, blocs du séquenceur, sauvegarde des réglages du métronome, bouton Lire orange, flèches de retour et absence de débordement mobile. Rapports actualisés dans `tests/validation-2026-10-06-song-navigation/`.

## Vérifications

- `songs-test.cjs` : construction par l'interface de 4 mesures de 4/4 à 97 BPM, 8 mesures de 4/4 à 97 BPM, puis 8 mesures de 5/4 à 120 BPM ; 20 mesures, 88 pulsations, durée calculée 49,690721649 s ; erreur maximale de grille 5,69e-14 s. Playlist avant structure, conservation après rechargement, export/import, captures ordinateur et mobile. Une structure de 1 000 016 mesures reste représentée sans allouer ces mesures individuellement.
- `songs-playback-test.cjs` : lecture réelle de deux sections, cinq clics espacés de 200 puis 100 ms, arrêt après le dernier temps ; sauvegarde des subdivisions de section ; séparation de deux profils ; restauration du séquenceur.
- `customization-timer-test.cjs` : ouvrir le popup conserve la durée ; modifier une division remet le chrono arrêté à zéro ; modifier un accent pendant la lecture remet la durée à zéro sans arrêter le métronome ; le chrono continue ensuite.
- `pulse-popup-live-test.cjs` : modifications du popup pendant les deux voix anglaises à 120 BPM ; séquence 1,2,3,4 conservée, erreur maximale d'espacement inférieure à 2e-12 ms.
- `regression-test.cjs` : PCM des banques non vocales identique, sauf l'arrondi Float32 déjà connu de la cloche (5,96e-8) ; aucune dérive sur 10 000 temps ; arrêt des samples vocaux planifiés.

Les rapports JSON sont dans `tests/validation-2026-10-06-songs/`. Ces tests fonctionnels sont distincts de la réussite du déploiement GitHub Pages.

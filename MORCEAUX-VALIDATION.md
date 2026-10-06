# Morceaux locaux — validation du 6 octobre 2026

Dans la colonne Séquenceur, choisir Morceaux : une entrée Profil puis une entrée Playlist. Profil regroupe le choix, la création, le renommage et les sauvegardes ; aucun bouton Nouveau morceau sur cette page. Playlist affiche les titres avant leur structure. Cliquer sur un titre ouvre les blocs du morceau. Les petites flèches en haut à gauche reviennent à la page précédente. Lire le morceau est orange et se trouve uniquement dans la barre de lecture générale en bas de l’application.

Chaque profil possède sa bibliothèque dans ce navigateur. Nouveau morceau crée une structure modifiable : libellé libre avec suggestions Intro, Couplet, Refrain, Bridge, Solo et Outro ; nombre de mesures ; tempo. Sélectionner le bloc pour régler sa métrique, ses subdivisions et ses accents avec le métronome. Les morceaux peuvent être dupliqués. Les blocs ne proposent pas de flèches de déplacement ni de bouton Copier ; le bouton de suppression s’appelle Supprimer. La suppression d'un morceau demande confirmation.

Les modifications sont enregistrées automatiquement dans localStorage sous `renax-drums-songs-v1`. Exporter télécharge une bibliothèque JSON ; Importer valide ce format et ajoute des profils importés sans remplacer les données existantes. Un profil local n'est pas un compte authentifié et ne synchronise pas d'autres appareils. L'export audio MP3 n'est pas inclus à ce stade.

Lire le morceau utilise la grille Web Audio existante, applique le tempo et la métrique de chaque section, puis s'arrête à la fin. Les répétitions sont représentées par les sections plutôt que par une grande liste de mesures. Il n'y a pas de limite de huit mesures pour les morceaux. Le séquenceur classique conserve ses propres mesures et retrouve son état lorsqu'on y revient. Le bloc ouvert sélectionne automatiquement son motif dans le métronome, sans bouton Régler le clic : les subdivisions et accents modifiés sont sauvegardés pour toutes ses répétitions.

Le chrono de durée repart à 0:00 après une personnalisation du métronome. S'il joue, le chrono continue à tourner. Cette remise à zéro ne modifie ni la position musicale ni le scheduler.

## Numbox et ouverture des cartes

Mesures et Tempo utilisent le composant `enhanceNumboxSelect` du métronome : bouton 58 × 30 px, même couleur orange, police et menu, sans spinner numérique du navigateur. Le menu Autre permet une valeur de mesures hors des propositions ; la valeur doit rester un entier positif et les limites de tempo restent 20–300 BPM. Les valeurs et leur représentation sont conservées après rechargement. Le registre des widgets utilise un WeakMap pour libérer les widgets des blocs reconstruits.

Un clic sur le titre, le tempo, le résumé, l’aperçu ou le fond d’une carte de playlist ouvre le morceau. Le glisser-déposer reste distinct. Le bloc ouvert sélectionne son motif automatiquement ; le bouton Régler le clic est supprimé.

`tests/song-numbox-test.cjs` compare les styles au vrai numbox du métronome et vérifie menus, valeur personnalisée, rejet de valeur invalide, sauvegarde et mobile. `tests/playlist-card-click-test.cjs` vérifie toutes les zones et l’ouverture au clavier. Rapports dans `tests/validation-2026-10-06-song-numbox/`.

## Ordre de la playlist

Maintenir un morceau puis le glisser au-dessus ou en dessous d’un autre change l’ordre de la playlist. Une ligne orange indique le point d’insertion. L’ordre est sauvegardé automatiquement. Un clic simple ouvre le morceau. La souris et le tactile sont pris en charge, avec défilement de la colonne près des bords. `tests/playlist-drag-test.cjs` vérifie déplacement vers le haut et le bas, rechargement, appui maintenu tactile et clic simple. Rapport dans `tests/validation-2026-10-06-playlist-drag/`.

## Apparence commune avec le séquenceur

Les cartes de la playlist et les blocs des morceaux reprennent les styles du séquenceur : fond #0e131c, espacement interne 8px 10px, angles 5px, titre dans l’en-tête, métrique orange, tempo compact et aperçu du clic. Les blocs conservent le libellé, le nombre de mesures et leur réduction automatique. La lecture du morceau utilise exclusivement le bouton général `playBtn` dans le footer.

`tests/song-card-style-test.cjs` compare les styles calculés aux cartes du séquenceur, vérifie la position du bouton de lecture, le démarrage/l’arrêt du morceau et le retour au bouton Start classique. Rapport dans `tests/validation-2026-10-06-sequencer-cards/`.

## Blocs réduits

Le titre du bloc reprend son libellé. Ajouter un bloc ouvre celui-ci et réduit les autres. Un bloc réduit conserve son titre, son nombre de mesures, sa métrique et son tempo ; son en-tête permet de le rouvrir ou de le refermer. Les libellés restent sauvegardés. `tests/song-folded-blocks-test.cjs` vérifie ces actions, la suppression du bloc ouvert et la réouverture sur mobile. Rapport dans `tests/validation-2026-10-06-folded-blocks/`.

## Navigation et ergonomie

`tests/song-navigation-test.cjs` vérifie Profil au-dessus de Playlist, création et renommage du profil, absence de Nouveau morceau dans Profil, blocs du séquenceur, sauvegarde des réglages du métronome, bouton Lire orange, flèches de retour et absence de débordement mobile. Rapports actualisés dans `tests/validation-2026-10-06-song-navigation/`.

## Vérifications

- `songs-test.cjs` : construction par l'interface de 4 mesures de 4/4 à 97 BPM, 8 mesures de 4/4 à 97 BPM, puis 8 mesures de 5/4 à 120 BPM ; 20 mesures, 88 pulsations, durée calculée 49,690721649 s ; erreur maximale de grille 5,69e-14 s. Playlist avant structure, conservation après rechargement, export/import, captures ordinateur et mobile. Une structure de 1 000 016 mesures reste représentée sans allouer ces mesures individuellement.
- `songs-playback-test.cjs` : lecture réelle de deux sections, cinq clics espacés de 200 puis 100 ms, arrêt après le dernier temps ; sauvegarde des subdivisions de section ; séparation de deux profils ; restauration du séquenceur.
- `customization-timer-test.cjs` : ouvrir le popup conserve la durée ; modifier une division remet le chrono arrêté à zéro ; modifier un accent pendant la lecture remet la durée à zéro sans arrêter le métronome ; le chrono continue ensuite.
- `pulse-popup-live-test.cjs` : modifications du popup pendant les deux voix anglaises à 120 BPM ; séquence 1,2,3,4 conservée, erreur maximale d'espacement inférieure à 2e-12 ms.
- `regression-test.cjs` : PCM des banques non vocales identique, sauf l'arrondi Float32 déjà connu de la cloche (5,96e-8) ; aucune dérive sur 10 000 temps ; arrêt des samples vocaux planifiés.

Les rapports JSON sont dans `tests/validation-2026-10-06-songs/`. Ces tests fonctionnels sont distincts de la réussite du déploiement GitHub Pages.

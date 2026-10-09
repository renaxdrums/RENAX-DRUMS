# Voix française et langue des blocs

La voix française utilise désormais ff_siwis (féminine française native). La voix des annonces anglaises reste bm_george ; les samples masculins anglais de comptage restent inchangés. Les deux voix suivent la normalisation existante.

Tests d'interface : premier bloc EN applique EN aux autres blocs ; modification locale FR du deuxième conservée lors des changements suivants du premier ; nouveau bloc héritant du défaut EN ; état sélectionné orange vérifié FR et EN.

Test d'intégration réel : le script amorce-song-integration-test.cjs vérifie explicitement ff_siwis / bm_george / ff_siwis, la lecture, l'arrêt, l'export MP3 et l'identité du MIDI. Résultats dans amorce-song-integration-results.json.

Mini test : dans un morceau de trois blocs, choisir EN dans le premier, puis FR dans le deuxième. Rebasculer le premier FR puis EN : le deuxième reste FR. Écouter un libellé français puis anglais et exporter le MP3. La qualité perçue et le calage acoustique de nouveaux libellés restent à confirmer à l'écoute ; les assertions automatiques ne les certifient pas.

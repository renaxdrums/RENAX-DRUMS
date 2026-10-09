# Volume FR/EN et séparation des numéros

Les annonces suivent une cible commune de -20 LUFS, mesurée avec une pondération K et un double seuil sur fenêtres de 400 ms. Crête des samples plafonnée à 0,8. La normalisation multiplie les samples sans modifier leur durée ni leurs repères. Une limite de crête peut empêcher d'atteindre la cible pour certains futurs libellés ; elle est explicitement indiquée dans le résultat.

Mesure indépendante FFmpeg ebur128 : Solo FR, Introduction FR, Chorus EN, My custom drum breakdown EN, Couplet 1 FR et Refrain 1 FR = -20,0 LUFS chacun. Voir voice-levels-results.json. Cette égalité mesurée ne garantit pas une perception strictement identique de tous les timbres.

Pour les libellés français terminés par un numéro séparé par un espace, le libellé et le numéro sont synthétisés séparément, puis assemblés avec 80 ms de séparation. Les silences de bord sont retirés en conservant 5 ms de marge. Le texte sauvegardé reste inchangé. Une annonce d'un seul phonème, comme « un », utilise le début acoustique détecté de son segment ; les nombres de plusieurs syllabes conservent le repère de leur dernière syllabe.

Le repère de Solo reste inchangé dans ce correctif demandé uniquement pour le volume et la liaison. Son calage acoustique n'est pas certifié par ces tests.

Mini test : ouvrir un morceau avec Couplet 1 et Refrain 1 en FR, puis un bloc EN. Écouter la séparation des numéros et comparer les niveaux des annonces ; écouter aussi le MP3 exporté. La suppression perceptive du « z » ou du « d » reste à confirmer à l'écoute par David.

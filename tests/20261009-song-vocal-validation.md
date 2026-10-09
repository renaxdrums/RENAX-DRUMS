# Guide Vocal dans les morceaux

Validation du 9 octobre 2026 : lecture du morceau et export MP3 avec les voix neurales réelles, décompte de deux mesures, métriques 3/4 et 4/4 et tempos 100 et 120 BPM. Arrêt en fin de morceau et bibliothèque conservée. Le MIDI reste identique octet pour octet avec ou sans Guide Vocal.

Résultats : MP3 567360 octets, crête décodée 0,8717304 ; PCM crête 0,2790593. Régression MP3 sans guide : sept banques, erreur maximale PCM 1,1920929e-7. Voir amorce-song-integration-results.json et les scripts de tests associés.

Placement : Décompte à gauche, Guide Vocal immédiatement à droite, même ligne vérifiée aux largeurs 1280 et 390 pixels.

Limites : cache des annonces en mémoire pendant la session ; génération initiale nécessaire. Les annonces trop longues pour la structure sont refusées plutôt que décalées. Le repère syllabique repose sur les événements phonétiques ; cette vérification ne constitue pas une mesure acoustique indépendante de chaque libellé possible. Le modèle masculin commun peut donner un accent anglais au français. WebGPU reste désactivé.

Mini test utilisateur : ouvrir un morceau, activer Guide Vocal à côté de Décompte, patienter jusqu'au statut prêt, écouter les transitions puis exporter MP3 et MIDI. Vérifier les libellés personnels, l'annonce du premier bloc et les comptages masculins des temps suivants. L'interface bilingue demandée reste à terminer séparément.

# Deux voix anglaises — 6 octobre 2026

L’utilisateur valide la voix homme EN jusqu’à vingt. Ses vingt WAV et ses vingt repères restent identiques. La voix femme EN reste identique sauf le repère d’eleven : 25→163 ms, sur la montée vocalique de la syllabe accentuée LE de e-LE-ven. Le sample commence donc 138 ms plus tôt ; le mot complet et sa vitesse restent identiques. Les deux voix françaises, leurs options, leurs données de chargement et leurs 40 WAV sont supprimés.

Le clic, les autres banques non vocales, les incréments de la grille et l’UI hors des options françaises supprimées restent inchangés.

Tests mesurables : 40 WAV anglais vérifiés par SHA-256 ; 16 scénarios de 20 nombres, soit 320 repères rendus dans Web Audio à 48 kHz, erreur mesurée 0 ms avec un pas de recherche de 1 ms. Tous les nombres 1–20 sont rendus à 60 et 120 BPM, notamment eleven ; mesures 3/4, 4/4, 5/4, subdivisions 2–8 et séquences 60→120→90 BPM. Aucun pré-roll coupé dans les scénarios normaux.

Les sons non vocaux sont conformes au rendu original : clic, claves, clic808 et beep identiques ; cloche avec seulement l’arrondi flottant maximal 5,96×10⁻⁸, code inchangé. Dérive de grille sur 10 000 pulsations à 60 BPM simulées : 0 s. Stop annule les voix planifiées.

Résultats actuels : tests/validation-2026-10-06-english-only/. Les autres dossiers de validation sont historiques et peuvent décrire les voix françaises retirées. Le workflow ancien de préparation des samples reste un outil historique ; ne pas régénérer les WAV validés sans recalibrer leurs repères.

Le repère est une annotation explicite de la syllabe perçue, pas une certification universelle de perception ni une mesure de la latence du périphérique audio. Un workflow Pages réussi confirme la publication ; les rendus audio mesurés servent au contrôle fonctionnel.

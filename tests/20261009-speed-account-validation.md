# Validation — préparation des voix et connexion directe

9 octobre 2026. Périmètre : prototype Amorce uniquement pour les voix ; accès compte, persistance et trois icônes de l'en-tête uniquement pour l'application.

## Voix

Génération au départ du champ, cache mémoire par texte exact et langue, déduplication des demandes en cours, résultat obsolète ignoré dans l'interface. Cache limité à 24 annonces et perdu au rechargement. Le modèle, les styles, les repères de syllabe et le calage des comptages restent identiques.

Un lien expérimental demande WebGPU avec le même modèle q8. Si l'adaptateur, le chargement ou l'inférence échoue, reprise WASM. Le mode CPU reste le choix par défaut. Ce dispositif ne prouve pas une accélération GPU.

Tests Chromium : génération CPU réelle, huit mixes sans saturation, Stop et relance ; cache réel dédupliqué, accès à une annonce conservée en 0,1 ms dans le harnais. Le test WebGPU a rencontré « WebGPU indisponible » et a correctement repris WASM. Aucun gain GPU mesuré sur cet environnement. Test UI séparé avec synthèse simulée : préparation au blur et ancien résultat ignoré après modification. Les durées affichées distinguent le calcul du worker de la préparation totale, qui inclut la file et le chargement.

Preuves : prototypes/amorce/page-results.json ; tests/amorce-page-test.cjs ; tests/amorce-background-ui-test.cjs.

## Connexion et icônes

Connexion directe dans un dialogue depuis l'en-tête, sans navigation vers les morceaux et sans reconstruction de leur bibliothèque. Les trois boutons font 32 × 32 px, leurs SVG 18 × 18 px sur smartphone et PC. Case Rester connecté : Firebase browserLocalPersistence si cochée, browserSessionPersistence sinon. La préférence est restaurée et supprimée à la déconnexion.

Test navigateur avec SDK Firebase simulé : choix local/session transmis à setPersistence, choix local restauré au rechargement ; bibliothèque et navigation conservées après ouverture/fermeture ; aucune erreur JS. Contrôle visuel mobile effectué. La fermeture/réouverture du navigateur avec un compte Firebase réel n'a pas été testée ; aucune connexion réelle n'a été effectuée.

Preuve : tests/direct-auth-ui-test.cjs. API de référence : https://firebase.google.com/docs/auth/web/auth-state-persistence ; https://huggingface.co/docs/transformers.js/v3.8.1/guides/webgpu.

## Mini plan manuel

1. Saisir un libellé puis passer au suivant : Préparation puis Prêt. Modifier le premier pendant préparation et vérifier que seule sa nouvelle annonce est utilisée.
2. Écouter puis relancer sans modification : aucune régénération. Recharger pour constater que le cache audio est limité à cette page.
3. Comparer les liens CPU et WebGPU : relever le moteur et les secondes affichées avec les mêmes libellés ; confirmer voix et dernière syllabe identiques à l'écoute. Le secours CPU doit rester utilisable.
4. Ouvrir Connexion depuis le métronome ; vérifier les trois icônes sur PC et smartphone et fermer sans changer d'écran.
5. Se connecter avec Rester connecté, fermer puis rouvrir le navigateur ; vérifier le même compte et ses morceaux. Se déconnecter ; vérifier le retour aux morceaux locaux. Répéter sans cocher la case pour une session temporaire.

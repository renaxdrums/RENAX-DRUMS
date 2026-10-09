# Amorce — voix masculine commune et niveau harmonisé

9 octobre 2026. David valide à l'écoute la dernière syllabe et le repère de la version précédente pour ses essais. Cette validation humaine est conservée ; elle ne devient pas une mesure acoustique automatique de tous les libellés.

## Changement demandé

Les annonces FR et EN utilisent désormais le même style Kokoro bm_george. Le phonémiseur conserve la langue choisie ; aucune traduction des libellés. George est une voix anglaise : le français est un essai de style croisé, dont l'accent et la prononciation demandent une nouvelle écoute. La voix française précédente n'est plus utilisée dans ce nouveau test.

Le gain est calculé une fois par annonce afin de viser le même RMS actif de 0,12, avec un plafond de crête de 0,8. Le seuil actif est 2 % de la crête initiale. Ce réglage conserve la dynamique à l'intérieur du texte ; il ne garantit pas une sonie perceptive identique pour toutes les phrases. Les événements, la vitesse, la planification et les samples masculins de comptage restent inchangés.

Le mode WebGPU est suspendu après le bruit parasite signalé par David et l'absence de bénéfice observé. Tous les liens, y compris ceux portant device=webgpu, utilisent désormais WASM. Le code de cache et de préparation anticipée est conservé.

## Mesures et limites

Six textes français et anglais sont synthétisés avec bm_george sur CPU natif : RMS actif 0,12 pour chacun, crête maximale 0,633386, aucun échantillon saturé. Durées et repères sont recalculés avec le même modèle et le nouveau style français ; ce changement de voix exige de réécouter les repères FR.

Preuves : prototypes/amorce/neural-results.json et page-results.json ; tests/amorce-neural-test.mjs et amorce-page-test.cjs. Le test navigateur demande volontairement l'ancien paramètre WebGPU pour vérifier que WASM est utilisé. Les huit rendus de séquences contrôlent la saturation. Les dépendances du modèle sont servies par le miroir de test habituel.

## Mini plan

1. Écouter un même libellé avec FR puis EN ; vérifier la même voix masculine et un niveau comparable.
2. Écouter des libellés français personnels, dont des noms propres : signaler accent ou prononciation incorrecte.
3. Vérifier de nouveau la dernière syllabe en FR à 120 BPM puis 60 BPM. Les samples two/three/four et leurs repères restent ceux de la version corrigée.
4. Utiliser l'ancien lien WebGPU : vérifier WASM affiché près des annonces et absence du parasite rapporté.
5. Modifier un libellé, quitter le champ, attendre Prêt puis relancer sans régénération.

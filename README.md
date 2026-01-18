INSTALLER:

1) une fois dézippé, aller dans backend/server et déposé votre ./env


LANCER LE PROJET (WEB)
1) Aller dans  \backend\server et excécuter "npm install" puis "node .\server.js"

2) Aller dans le dossier frontend et lancer "npm install" puis "npm run dev"

LANCER LE PROJET (DISCORD)

1) Comme dans la partie web exécuté la partie backend

2) À la racine du projet, lancer "npm install" puis "node .\backend\bot\deploy.js" et "node .\backend\bot\index.js"

COMMANDE BOT:

/planning id [jour] [heure]
- Affiche tout (ou une partie) du planning de l'étudiant avec l'id fourni

/modify jour heure cours
- Modifie l'emploi du temps de celui lançant la commande

----------------

NOTES DÉVELOPPEUR:

La commande modify a un bug l'empêchant de cloturer la requête.
(La modification se fait sans encombre, vous pouvez le vérifier en utilisant /planning pour voir le changement.)

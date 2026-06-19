# BonkDrop
Un site web permettant d'envoyer des images, des documents, des vidéos et tout autre type de fichiers sans devoir cliquer sur un lien. Fonctionne avec les e-mails, Discord, WhatsApp et autres types de messageries instantanées. Aucune inscription ou abonnement n'est requis pour son utilisation. BonkDrop n'est pas encore en beta, tout peut être sujet à changement.

## Securisation de la cle API

⚠︎ La cle API ne doit jamais etre dans le frontend.

1. Configurer les variables d'environnement sur le serveur Node:

- `BONKDROP_INTERNAL_API_KEY` = votre clé API privée
- `BONKDROP_INTERNAL_UPLOAD_URL` = URL cible interne (par defaut `https://api.bonkdrop.fr/upload`)
- `BONKDROP_UPLOAD_TIMEOUT_MS` = timeout du proxy vers l'API interne (par defaut `45000`)

2. Lancer le serveur proxy:

```bash
npm start
```

3. Le frontend tente d'abord `/api/upload` (route proxy du serveur Node). En cas de `404/405`, et bascule ensuite automatiquement sur `https://api.bonkdrop.fr/api/upload`.

Si vous recevez `Unauthorized`, verifier d'abord en priorité que `BONKDROP_INTERNAL_API_KEY` est bien configuré sur le serveur Node.

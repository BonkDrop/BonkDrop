# BonkDrop
Un site web permetant d'envoyer des images, des documents, des vidéos et tous autres types de fichiers sans devoir cliquer sur un lien. Fonctionne avec les e-mails, Discord, WhatsApp et tous autres types de messageries instantanées. Aucune inscription ou tout type d'abonnement n'est requis pour son utilisation. 

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

# BonkDrop
Un site web qui permet d'envoyer des images, des documents, des vidéos et tous autres types de fichiers qui sont déjà inclus dans la discussion sans devoir cliquer sur un lien. Fonctionne avec les e-mails, Discord, WhatsApp et tous autres types de messageries instantanées. Aucune inscription n'est requise et c'est 100 % gratuit :)

## Securisation de la cle API

La cle API ne doit jamais etre dans le frontend.

1. Configure les variables d'environnement sur le serveur Node:

- `BONKDROP_INTERNAL_API_KEY` = ta cle API privee
- `BONKDROP_INTERNAL_UPLOAD_URL` = URL cible interne (par defaut `https://api.bonkdrop.fr/upload`)
- `BONKDROP_UPLOAD_TIMEOUT_MS` = timeout du proxy vers l'API interne (par defaut `45000`)

2. Lance le serveur proxy:

```bash
npm start
```

3. Le frontend tente d'abord `/api/upload` (route proxy du serveur Node). En cas de `404/405`, il bascule automatiquement sur `https://api.bonkdrop.fr/upload`.

Si tu recois `Unauthorized`, verifie en priorite que `BONKDROP_INTERNAL_API_KEY` est bien configuree sur le serveur Node.

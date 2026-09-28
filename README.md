# Flowstock

Application de gestion des demandes de matériel, organisée en deux applications JavaScript indépendantes :
une API Node.js/Express/MongoDB (`backend/`) et une interface React/Vite (`frontend/`).

## Prérequis

- Node.js 20.19+ ou 22.12+
- npm
- MongoDB local ou une URI MongoDB configurée

## Installation

```sh
cd frontend && npm install
cd ../backend && npm install
```

À la racine, copiez `.env.example` vers `.env`, puis renseignez au minimum `JWT_SECRET`
(la commande pour en générer un est indiquée dans le fichier).

Chargez les données de démonstration (12 matériels, 8 comptes, 16 demandes) :

```sh
npm --prefix backend run seed            # base vide uniquement
npm --prefix backend run seed -- --reset # remplace les données existantes
```

Les comptes de démonstration (par ex. `amina.diallo@nexa.io`, administratrice) utilisent le mot de passe
`SEED_DEMO_PASSWORD` ; s'il est vide, un mot de passe aléatoire est affiché à la fin du seed.

## Démarrage

Dans deux terminaux depuis la racine :

```sh
npm --prefix backend run dev
npm --prefix frontend run dev
```

API : `http://localhost:5000/api/health`  
Frontend : `http://localhost:5173`

## Rôles

| | Administrateur | Employé |
| --- | --- | --- |
| API | `/api/admin/*` | `/api/employee/*` |
| Écrans | Vue d'ensemble, Demandes, Matériel, Utilisateurs, Paramètres | Catalogue, Mes demandes, Paramètres |
| Code frontend | `src/features/admin/` (bundle séparé) | `src/features/employee/` (bundle séparé) |

- Chaque route est protégée par `requireAuth` + `requireRole(...)` ; un employé ne voit et ne modifie que ses propres demandes.
- On devient administrateur en s'inscrivant avec une adresse listée dans `ADMIN_EMAILS`, ou sur invitation d'un administrateur
  (page Utilisateurs → « Inviter un utilisateur », qui envoie un lien d'inscription par e-mail).

## Authentification et sécurité

- Inscription → code à 6 chiffres envoyé par e-mail (valable 15 min, 5 essais, renvoi après 60 s) → compte activé et connecté.
- Session : JWT signé dans un cookie `httpOnly` / `SameSite=Lax` (7 jours), rechargée à chaque requête (un changement de rôle s'applique immédiatement).
- Force brute : après `LOGIN_MAX_ATTEMPTS` échecs sur une adresse, la connexion est bloquée `LOGIN_LOCK_HOURS` heures
  (même comportement pour une adresse inconnue), plus des plafonds par IP.
- Injections : schémas `zod` stricts sur chaque entrée (champs inconnus refusés), rejet des clés `$…` / `.`,
  `sanitizeFilter` Mongoose, vérification de l'origine des requêtes, en-têtes `helmet`, mots de passe `bcrypt`.

## E-mails (Gmail, gratuit, sans domaine)

1. Activez la validation en deux étapes sur votre compte Google.
2. Créez un mot de passe d'application : <https://myaccount.google.com/apppasswords>.
3. Dans `.env` : `SMTP_USER=votre.adresse@gmail.com`, `SMTP_PASS=<mot de passe d'application sans espaces>`,
   `MAIL_FROM="Materio <votre.adresse@gmail.com>"`.

Sans ces valeurs, les e-mails (codes, invitations) sont affichés dans la console de l'API.
Gmail limite l'envoi à environ 500 e-mails par jour, largement suffisant pour une phase de test.

## Images des matériels (Cloudflare R2)

1. Dans le tableau de bord Cloudflare : **R2 → Créer un bucket** (offre gratuite : 10 Go) → `R2_BUCKET`.
2. **R2 → Gérer les jetons d'API → Créer un jeton** avec la permission « Lecture et écriture d'objets » sur ce bucket
   → `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`. L'identifiant de compte se trouve sur la page R2 → `R2_ACCOUNT_ID`.
3. Optionnel — `R2_PUBLIC_URL` : dans le bucket, **Paramètres → Accès public → URL `r2.dev`** (`https://pub-….r2.dev`)
   ou un domaine personnalisé. Les images sont alors servies directement par Cloudflare.
   - Laissé vide, ou s'il contient l'endpoint `https://<compte>.r2.cloudflarestorage.com` (API S3 privée, refusée par les
     navigateurs), les images sont lues dans le bucket par l'API et servies sur `/media/…`.
   - L'URL affichée est toujours recalculée à partir du `publicId` : changer ce réglage s'applique aussi aux matériels existants
     (les URL enregistrées en base sont resynchronisées au démarrage).

Les images sont envoyées à `POST /api/admin/uploads/materials` (JPEG/PNG/WebP, 5 Mo max, format vérifié sur le contenu),
stockées sous un nom aléatoire, et l'URL publique est toujours reconstruite par le serveur. L'image remplacée est supprimée.
Sans configuration R2, les fichiers sont stockés dans `backend/uploads/` et servis sur `/media/…`.
Les images de démonstration restent dans `frontend/public/images/materials/` (sources et licences : `CREDITS.md`).

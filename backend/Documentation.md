# Documentation technique du backend

## 1. Périmètre et rôle

Le backend est une API REST Node.js destinée à l’application de gestion de matériel Flowstock (interface utilisateur nommée « Materio » dans plusieurs écrans). Il fournit l’authentification, les opérations d’administration et d’employé, la persistance MongoDB, l’envoi de courriels et le stockage des images.

Le frontend communique avec l’API sous le préfixe `/api`. Les images sont exposées séparément sous `/media` (et un ancien chemin local `/uploads` reste servi). Le backend ne sert pas l’application React.

## 2. Technologies et scripts

| Technologie | Usage constaté |
| --- | --- |
| Node.js avec modules ES (`type: module`) | Exécution du serveur et des scripts |
| Express 5 | Serveur HTTP, middleware et routeurs |
| MongoDB et Mongoose 8 | Persistance et schémas de données |
| Zod 4 | Validation stricte des entrées |
| `jsonwebtoken` et `bcryptjs` | Session JWT et hachage des mots de passe |
| `cookie-parser`, `cors`, `helmet` | Cookies, CORS et en-têtes de sécurité |
| `express-rate-limit` | Limites de requêtes par adresse IP |
| Nodemailer | Courriels SMTP ou sortie console de développement |
| AWS SDK S3 | Accès compatible S3 à Cloudflare R2 (ou endpoint S3 configuré) |
| `dotenv` | Chargement de la configuration |
| Nodemon (développement) | Redémarrage automatique du serveur |

Les dépendances et versions déclarées se trouvent dans [package.json](package.json). Les scripts réellement disponibles sont :

| Script | Commande | Effet |
| --- | --- | --- |
| `dev` | `npm run dev` | Lance `src/server.js` avec Nodemon; surveille `src/` et le `.env` à la racine. |
| `start` | `npm start` | Lance le serveur avec Node.js. |
| `seed` | `npm run seed` | Importe les données de démonstration uniquement si la base est vide. |

Aucun script de test ou de lint backend n’est déclaré dans le manifeste.

## 3. Organisation du code

| Répertoire/fichier | Responsabilité |
| --- | --- |
| [src/server.js](src/server.js) | Point d’entrée : vérifie la configuration, connecte MongoDB, synchronise les URL d’images, démarre Express et vérifie SMTP. |
| [src/app.js](src/app.js) | Construit Express et assemble les protections, routeurs, fichiers statiques et gestionnaires d’erreurs. |
| [src/config/env.js](src/config/env.js) | Charge et normalise les variables d’environnement; vérifie les valeurs indispensables et la configuration de production. |
| [src/config/database.js](src/config/database.js) | Configure Mongoose (`sanitizeFilter`, `strictQuery`) et établit la connexion MongoDB. |
| [src/routes/](src/routes/) | Déclare les routes HTTP et leurs middlewares de validation/autorisation. |
| [src/controllers/](src/controllers/) | Implémente les traitements d’authentification, d’administration et d’employé. |
| [src/middleware/](src/middleware/) | Authentification/roles, validation, sécurité, limitation de débit et réponses d’erreur. |
| [src/models/](src/models/) | Schémas Mongoose `User`, `Material`, `Request` et `LoginThrottle`. Le modèle `Request` gère aussi les compteurs de codes de demande. |
| [src/services/](src/services/) | Sessions JWT, limitation des connexions, envoi d’e-mails et stockage d’images. |
| [src/validation/schemas.js](src/validation/schemas.js) | Schémas Zod stricts et contraintes des principales charges utiles. |
| [src/utils/](src/utils/) | Erreurs HTTP applicatives et sérialisation stable des réponses API. |
| [src/seed/](src/seed/) | Données JSON d’exemple et script d’import/reset. |

### Cycle d’une requête

1. `server.js` appelle `assertEnv()`, se connecte à MongoDB et prépare les URL d’images existantes.
2. `app.js` applique Helmet, CORS avec identifiants, lecture des cookies et JSON (limite 100 Ko), puis les protections globales `/api` : plafond de débit, vérification d’origine pour les mutations et rejet des clés d’opérateurs MongoDB.
3. Le routeur choisi vérifie, selon le cas, la session et le rôle puis valide les paramètres/corps avec Zod.
4. Le contrôleur applique la logique métier et consulte ou modifie les modèles Mongoose.
5. Les sérialiseurs convertissent les identifiants en chaînes et les dates en timestamps millisecondes; les réponses d’erreur sont normalisées par le gestionnaire central.

Le serveur emploie Express 5, dont la gestion des rejets des handlers asynchrones transmet les erreurs au middleware central.

## 4. Installation, configuration et lancement

Prérequis indiqués à la racine du projet : Node.js 20.19+ ou 22.12+, npm et MongoDB accessible. Aucun champ `engines` n’est déclaré dans le manifeste backend.

Depuis la racine du dépôt, les installations sont possibles ainsi :

```sh
npm --prefix backend install
npm --prefix frontend install
```

La configuration est lue depuis le fichier `.env` à la racine du dépôt (et non depuis `backend/.env`). Le modèle des variables se trouve dans [../.env.example](../.env.example). Au minimum, renseigner `MONGODB_URI` et un `JWT_SECRET` aléatoire d’au moins 32 caractères. Exemple de valeur MongoDB locale : `mongodb://127.0.0.1:27017/flowstock`.

Démarrage en développement depuis la racine :

```sh
npm --prefix backend run dev
```

Démarrage sans Nodemon :

```sh
npm --prefix backend start
```

Le port par défaut est `5000`; l’interface de développement Vite transmet ses requêtes vers `http://localhost:5000`.

### Variables d’environnement

| Variable | Valeur par défaut / exigence | Fonction |
| --- | --- | --- |
| `NODE_ENV` | Non définie par défaut | `production` active les exigences SMTP/R2 et le flag `secure` du cookie. |
| `PORT` | `5000` | Port d’écoute HTTP. |
| `MONGODB_URI` | Obligatoire | URI MongoDB. |
| `CLIENT_URL` | `http://localhost:5173` | Origine CORS autorisée et origine autorisée pour les requêtes de mutation lorsqu’un en-tête `Origin` est fourni. |
| `JWT_SECRET` | Obligatoire, 32 caractères minimum | Clé du JWT de session et du HMAC des codes de vérification. |
| `SESSION_TTL_DAYS` | `7` | Durée de vie de la session/cookie. |
| `ADMIN_EMAILS` | Liste vide | Adresses séparées par virgules, normalisées en minuscules; à l’inscription ou à la connexion, une adresse listée est promue administrateur. |
| `LOGIN_MAX_ATTEMPTS` | `5` | Échecs de connexion permis par adresse avant verrouillage. |
| `LOGIN_LOCK_HOURS` | `2` | Durée du verrouillage par adresse. |
| `SMTP_HOST` | Non défini | Hôte SMTP. |
| `SMTP_PORT` | `465` | Port SMTP; TLS direct est activé pour le port 465. |
| `SMTP_USER`, `SMTP_PASS` | Non définis | Identifiants SMTP. |
| `MAIL_FROM` | `SMTP_USER` | Expéditeur des messages. |
| `R2_ACCOUNT_ID` | Non défini | Identifiant Cloudflare utilisé pour construire l’endpoint standard. |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Non définis | Identifiants S3/R2. |
| `R2_BUCKET` | Non défini | Bucket R2. |
| `R2_PUBLIC_URL` | Vide | Base d’URL publique facultative (domaine personnalisé ou URL `r2.dev`); une URL de l’endpoint API privé `*.r2.cloudflarestorage.com` est rejetée pour l’accès navigateur. |
| `R2_ENDPOINT` | Non défini | Endpoint S3 alternatif, notamment compatible MinIO; active le mode path-style du client. |
| `SEED_DEMO_PASSWORD` | Vide | Mot de passe commun aux comptes créés par le seed; s’il est vide, un mot de passe aléatoire est généré puis affiché. |

Les paramètres du code de vérification ne sont pas configurables par variables : validité 15 minutes, cinq essais maximum et délai de renvoi de 60 secondes. En production, `assertEnv()` exige également une configuration SMTP et R2 complète. En développement sans SMTP, les e-mails sont imprimés dans la console; sans R2, les images sont conservées sur disque.

### Données de démonstration

```sh
npm --prefix backend run seed
npm --prefix backend run seed -- --reset
```

Le seed est défini dans [src/seed/seed.js](src/seed/seed.js). Sans `--reset`, il ne s’exécute que si les collections utilisateurs et matériels sont vides. Avec `--reset`, il supprime utilisateurs, matériels, demandes, compteurs de limitation de connexion et compteur de codes, puis recharge les fichiers JSON. Le script recrée ensuite le compteur de demandes au moins au maximum des identifiants présents. Les comptes importés sont actifs et partagent le mot de passe indiqué par la variable ou celui aléatoire annoncé en console.

## 5. API HTTP

Toutes les routes listées ci-dessous sont préfixées par `/api`, sauf `/media`. L’authentification utilise le cookie de session `fs_session`; il n’y a pas de jeton Bearer prévu par les clients du projet. Les réponses de succès sont JSON, sauf indication contraire.

### Santé — accès public

| Méthode et chemin | Résultat |
| --- | --- |
| `GET /api/health` | Renvoie `status: "ok"`, l’état de la connexion MongoDB (`connected`/`disconnected`) et un timestamp ISO. |

### Authentification — accès public sauf `me`

| Méthode et chemin | Accès | Corps utile / résultat |
| --- | --- | --- |
| `POST /api/auth/signup` | Public; limite auth | `{ name, email, password, team }`; crée ou complète un compte en attente et envoie un code de vérification. Retourne email, prochain instant de renvoi et durée de validité. |
| `POST /api/auth/verify-email` | Public; limite auth | `{ email, code }` (code à six chiffres); valide le compte, crée la session et renvoie `{ user }`. |
| `POST /api/auth/resend-code` | Public; limite auth | `{ email }`; renvoie un code si le compte est en attente et si le délai le permet. Retourne `202` afin de garder une réponse uniforme pour une adresse sans compte en attente. |
| `POST /api/auth/login` | Public; limite login | `{ email, password }`; ouvre une session si le compte est actif et renvoie `{ user }`. |
| `POST /api/auth/logout` | Public | Efface le cookie et répond `204`. |
| `GET /api/auth/me` | Session obligatoire | Renvoie `{ user }` pour la session courante. |

Contraintes principales : e-mail normalisé en minuscules; nom 2–80 caractères; équipe 2–60; mot de passe 8–128 caractères avec au moins une lettre et un chiffre. La demande d’inscription exige un e-mail vérifié pour activer la connexion. Une invitation pré-crée le rôle et l’équipe; l’inscription conserve les attributs de l’invitation si elle existe.

### Administration — session et rôle `admin` requis sur tout le routeur

| Méthode et chemin | Corps / comportement |
| --- | --- |
| `GET /api/admin/materials` | Liste les matériels non archivés. |
| `POST /api/admin/materials` | Crée un matériel; champs `name`, `category`, `total`, `quantity`, `description` facultative et `imagePublicId` requis (l’image doit être téléversée avant). Réponse `201 { material }`. |
| `PUT /api/admin/materials/:id` | Remplace les champs validés d’un matériel actif; l’image actuelle est conservée si aucun nouvel `imagePublicId` n’est fourni. Réponse `{ material }`. |
| `DELETE /api/admin/materials/:id` | Archive le matériel sans effacer la référence; réponse `204`. |
| `POST /api/admin/materials/:id/restore` | Retire l’archive; réponse `{ material }`. |
| `GET /api/admin/requests` | Liste toutes les demandes, les plus récentes en premier. |
| `POST /api/admin/requests/:code/approve` | Approuve une demande en attente et décrémente le stock; réponse `{ request, material }`. Conflit si stock insuffisant ou demande déjà traitée. |
| `POST /api/admin/requests/:code/reopen` | Annule une approbation, rétablit le stock et remet la demande en attente; réponse `{ request, material }` (matériel possiblement `null`). |
| `POST /api/admin/requests/:code/reject` | Corps `{ reason }` (4–400 caractères); refuse une demande en attente et enregistre le motif; réponse `{ request }`. |
| `GET /api/admin/users` | Liste les utilisateurs. |
| `POST /api/admin/users/invitations` | Corps `{ name, email, role, team }`; crée l’utilisateur invité et envoie un lien d’inscription; réponse `201 { user }`. En cas d’échec d’envoi, l’invitation est supprimée. |
| `PATCH /api/admin/users/:id/role` | Corps `{ role: "admin" | "employee" }`; change le rôle; impossible de changer son propre rôle; réponse `{ user }`. |
| `POST /api/admin/uploads/:folder` | Corps brut `image/jpeg`, `image/png` ou `image/webp` (5 Mo maximum); téléverse et renvoie `{ url, publicId }` avec statut `201`. Le dossier permis actuellement est `materials`. |
| `DELETE /api/admin/uploads/:folder/:fileName` | Supprime une image téléversée inutilisée; refuse si un matériel la référence; réponse `204`. |

Le code demande est de la forme `REQ-` suivi de 1 à 9 chiffres; l’identifiant Mongo des ressources est une chaîne hexadécimale de 24 caractères. Les catégories de matériel prises en charge sont `Informatique`, `Audiovisuel`, `Mobilier` et `Réseau`. Pour un matériel : nom 3–120 caractères, description max. 300, total 1–100000, quantité disponible 0–100000 et jamais supérieure au total.

### Espace employé — session et rôle `employee` requis sur tout le routeur

| Méthode et chemin | Corps / comportement |
| --- | --- |
| `GET /api/employee/materials` | Liste le catalogue actif ainsi que les matériels archivés encore référencés par les demandes de l’utilisateur courant (conservation de l’historique). |
| `GET /api/employee/requests` | Liste uniquement les demandes de l’utilisateur courant. |
| `POST /api/employee/requests` | Corps `{ materialId, quantity, dateNeeded, justification, note? }`; crée une demande `pending` et renvoie `201 { request }`. `dateNeeded` est un timestamp millisecondes; la date doit être comprise entre aujourd’hui et les 366 prochains jours. |
| `POST /api/employee/requests/:code/cancel` | Annule une demande en attente appartenant à l’utilisateur courant; réponse `{ request }`. |

La création exige une quantité de 1–1000, une justification de 8–600 caractères et un matériel actif. Le commentaire facultatif peut être nul et est limité à 300 caractères. La disponibilité est revérifiée au moment de la création, puis le stock n’est réellement décrémenté qu’à l’approbation administrative.

### Médias

| Méthode et chemin | Comportement |
| --- | --- |
| `GET /media/:folder/:fileName` | Diffuse une image stockée localement ou dans un bucket R2 privé; envoie `ETag`, `304` si le cache correspond, `nosniff` et cache immuable d’un an. |
| `GET /uploads/*` | Sert les fichiers du répertoire local d’uploads, chemin historique, avec cache de 30 jours. |

Le `publicId` généré est `materials/<UUID>.<jpg|png|webp>`. L’URL est reconstruite côté serveur : URL publique R2 si configurée correctement, sinon chemin `/media/...`. Les images de démonstration du frontend ne sont pas téléversées par cette API.

## 6. Authentification, autorisation et sécurité

- Après vérification d’e-mail ou connexion, le serveur signe un JWT HS256 avec `sub` (id utilisateur) et `tv` (version de jeton). Il est placé dans un cookie `fs_session` `httpOnly`, `SameSite=Lax`, `path=/`; `secure` est activé en production. La durée suit `SESSION_TTL_DAYS`.
- `requireAuth` relit l’utilisateur dans MongoDB à chaque requête protégée et exige `status === active` ainsi qu’une version de jeton correspondante. Les changements de rôle s’appliquent donc aux autorisations des requêtes suivantes. `requireRole` limite ensuite l’accès à `admin` ou `employee`.
- Les mots de passe sont hachés par bcrypt avec 12 tours. Les codes à six chiffres sont conservés sous forme de HMAC SHA-256, expirent après 15 minutes et sont comparés en temps constant. Jusqu’à cinq essais sont autorisés; délai de renvoi : 60 secondes.
- Les échecs de connexion par adresse sont conservés dans `LoginThrottle`, avec une clé e-mail hachée et index TTL; les valeurs par défaut sont cinq échecs puis deux heures de verrouillage. Un hash factice bcrypt est comparé quand l’adresse est inconnue pour limiter les écarts de temps de réponse.
- Plafonds IP : API générale 600 requêtes/15 min; routes signup/vérification/renvoi 60/15 min; login 20/15 min. Les réponses de limite sont `429` avec code `RATE_LIMITED`.
- Helmet, CORS avec `credentials: true`, vérification d’origine sur POST/PUT/PATCH/DELETE (si un en-tête `Origin` existe), limite JSON de 100 Ko, rejet de clés `$`, `.` et clés dangereuses dans paramètres/corps, filtres Mongoose sécurisés et schémas Zod stricts.
- La validation stricte écarte les propriétés non déclarées; le middleware remplace le corps parsé avec la forme nettoyée et typée.

## 7. Données et règles métier

### Modèles

| Modèle | Données notables |
| --- | --- |
| `User` ([src/models/User.js](src/models/User.js)) | Nom, e-mail unique, hash mot de passe non sélectionné par défaut, rôle (`admin`/`employee`), équipe, état (`invited`/`pending`/`active`), vérification d’e-mail, `tokenVersion`, dates de connexion et timestamps. |
| `Material` ([src/models/Material.js](src/models/Material.js)) | Nom, catégorie, description, quantité disponible, total, image `{ url, publicId }`, `archivedAt` et timestamps. L’archivage conserve les références historiques. |
| `Request` ([src/models/Request.js](src/models/Request.js)) | Code unique, utilisateur, matériel, quantité, date souhaitée, état (`pending`, `approved`, `rejected`, `cancelled`), justification, commentaire, motif de refus, journal historique et timestamps. |
| `LoginThrottle` ([src/models/LoginThrottle.js](src/models/LoginThrottle.js)) | Compteur d’échecs et dates de verrouillage/expiration; l’index TTL élimine les entrées périmées. |

Les codes de demande sont générés par compteur atomique MongoDB et suivent `REQ-n`. Le schéma d’historique accepte les événements `created`, `approved`, `rejected`, `cancelled` et `note`; les contrôleurs observés ajoutent les quatre premiers selon le parcours. Aucun endpoint de note ou d’édition d’historique n’est exposé.

### Parcours de demande et stock

1. L’employé consulte le catalogue puis crée une demande en attente; elle est rattachée à son identifiant et inscrite dans l’historique. Une demande ne réserve pas le stock.
2. L’administrateur peut approuver ou refuser. L’approbation fait une mise à jour Mongo atomique conditionnée par le stock suffisant et diminue `quantity`.
3. Si une autre action traite simultanément la demande, le contrôleur restaure le stock décrémenté et renvoie un conflit.
4. L’annulation de l’approbation par l’administrateur remet la demande en attente et rétablit la quantité. Le refus enregistre un motif sans décrémenter le stock.
5. L’employé peut annuler seulement sa propre demande encore en attente. Les autres états sont terminaux du point de vue de cette action.

Les contrôleurs de demande ne déclenchent pas de courriel de notification lors de l’approbation, du refus ou de l’annulation; les courriels effectivement implémentés concernent la vérification et les invitations.

## 8. Réponses d’erreur et conventions API

Les erreurs contrôlées renvoient généralement `{ message, code }`, avec `details` optionnel et souvent `details.fields` pour les erreurs de formulaire. Le middleware central traite notamment : route absente (`404 NOT_FOUND`), JSON invalide (`400 INVALID_JSON`), charge trop grande (`413 PAYLOAD_TOO_LARGE`), identifiant Mongo invalide (`404 NOT_FOUND`), erreurs HTTP applicatives, puis erreur inattendue (`500 SERVER_ERROR`). Les erreurs serveur internes sont journalisées côté API sans détails techniques renvoyés au client.

Les sérialiseurs dans [src/utils/serializers.js](src/utils/serializers.js) évitent d’exposer directement les documents Mongoose : ids sous forme de chaînes, dates sous forme de nombres en millisecondes (sauf la santé, ISO), états et propriétés explicitement sélectionnés. Une erreur 401 sur une route protégée peut renvoyer `SESSION_EXPIRED` après effacement du cookie.

## 9. Évoluer et maintenir le backend

- Ajouter une route : déclarer le chemin dans le routeur pertinent, poser explicitement les middlewares d’accès et de validation, puis implémenter la logique dans un contrôleur.
- Ajouter ou modifier une entrée : mettre à jour le modèle Mongoose, le schéma Zod correspondant, le sérialiseur et les appels frontend concernés. Ne pas accepter directement des opérateurs MongoDB fournis par le client.
- Ajouter une variable : définir sa lecture, sa normalisation et les contrôles dans [src/config/env.js](src/config/env.js), puis documenter le modèle [../.env.example](../.env.example). Le frontend n’a pas de variables d’environnement propres pour appeler l’API; son proxy Vite est configuré séparément.
- Pour les mutations de stock, conserver la condition et l’incrément dans la même mise à jour MongoDB afin d’éviter de dépasser la quantité disponible. Tenir compte des écritures concurrentes.
- Pour les images, passer par `image-storage.js`; ne jamais accepter une URL arbitraire fournie par un navigateur. R2 public est facultatif en développement mais exigé en production.
- Le code serveur contient des messages et validations en français. Il n’y a pas de documentation OpenAPI/Swagger ni de suite de tests automatisée déclarée dans le projet.

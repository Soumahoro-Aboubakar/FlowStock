# Documentation technique du frontend

## 1. Périmètre

Le frontend est une application monopage React nommée Flowstock dans les métadonnées HTML et « Materio » dans plusieurs éléments d’interface. Il fournit deux espaces selon le rôle : administration (tableau de bord, demandes, inventaire, utilisateurs) et collaborateur (catalogue et demandes personnelles). Les données métier sont obtenues auprès de l’API backend; elles ne sont pas sauvegardées durablement dans le navigateur.

## 2. Technologies et scripts

| Technologie | Usage constaté |
| --- | --- |
| React 19 et React DOM | Interface à composants et rendu du point de montage. |
| Vite 8 et plugin React | Serveur de développement et construction. |
| Tailwind CSS 4 et plugin Vite Tailwind | Styles utilitaires et thème CSS. |
| Redux Toolkit et React Redux | Session, données chargées et route interne; stockage local limité à la navigation par rôle. |
| Inter Variable via Fontsource | Police servie par le paquet frontend. |
| Oxlint | Lint du frontend. |

Les dépendances et versions sont déclarées dans [package.json](package.json). Les commandes disponibles :

| Script | Commande | Effet |
| --- | --- | --- |
| `dev` | `npm run dev` | Lance Vite en mode développement. |
| `build` | `npm run build` | Produit le build optimisé dans le répertoire Vite `dist/`. |
| `lint` | `npm run lint` | Exécute Oxlint. |
| `preview` | `npm run preview` | Sert localement le build Vite pour prévisualisation. |

Aucun script de test frontend n’est déclaré dans le manifeste.

## 3. Installation, configuration et démarrage

Prérequis généraux du dépôt : Node.js 20.19+ ou 22.12+ et npm (voir le manifeste racine du projet). Depuis la racine :

```sh
npm --prefix frontend install
npm --prefix frontend run dev
```

Par défaut, Vite sert le site sur `http://localhost:5173`. Le fichier [vite.config.js](vite.config.js) transmet `/api`, `/uploads` et `/media` à `http://localhost:5000`; il faut donc que le backend soit démarré pour utiliser les fonctionnalités qui dépendent de l’API.

Vérifications et prévisualisation des commandes prévues :

```sh
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run preview
```

Le frontend ne déclare pas de variable `VITE_*` ni de fichier `.env` frontend pour configurer l’URL d’API : les requêtes utilisent des chemins relatifs `/api/...` et le proxy de développement est fixé dans la configuration Vite. Pour un autre déploiement, le routage/proxy HTTP doit donc être configuré hors de ce proxy de développement.

## 4. Architecture du code

| Répertoire/fichier | Responsabilité |
| --- | --- |
| [index.html](index.html) | Document HTML, langue française, titre Flowstock et point de montage `#root`. |
| [src/main.jsx](src/main.jsx) | Monte React en `StrictMode`, enveloppe l’application dans le `Provider` Redux et importe le CSS global. |
| [src/App.jsx](src/App.jsx) | Restaure la session au démarrage, affiche l’authentification et charge paresseusement l’espace correspondant au rôle. |
| [src/api/](src/api/) | Client HTTP partagé et façades auth/admin/employé. |
| [src/store/](src/store/) | Slices Redux de session, données et interface; configuration du store. |
| [src/features/auth/](src/features/auth/) | Écran de connexion, inscription et vérification e-mail. |
| [src/features/admin/](src/features/admin/) | Application et pages d’administration, formulaires et modales. |
| [src/features/employee/](src/features/employee/) | Application collaborateur, catalogue, demandes et formulaire de demande. |
| [src/features/shared/](src/features/shared/) | Shell commun, navigation, en-tête, panneau détail de demande, profil, modales, hooks et contexte. |
| [src/components/layout/](src/components/layout/) | Navigation latérale. |
| [src/components/ui/](src/components/ui/) | Kit de composants d’interface (boutons, champs, tableaux de bord, images, badges, toasts, icônes SVG). |
| [src/services/materialImages.js](src/services/materialImages.js) | Contrôle local et téléversement/abandon d’images via l’API. |
| [src/utils/](src/utils/) | Formatage des dates, textes, statuts et niveaux de stock. |
| [src/index.css](src/index.css) | Imports Tailwind/Inter, thème, arrière-plan, animations, états de chargement et styles d’authentification. |
| [public/images/materials/](public/images/materials/) | Images publiques des matériels de démonstration; crédits dans [CREDITS.md](public/images/materials/CREDITS.md). |

## 5. Démarrage, navigation et état

### Initialisation et sélection de l’espace

`main.jsx` monte `App` avec Redux. `App.jsx` appelle `GET /api/auth/me` au démarrage pour vérifier le cookie existant : pendant ce contrôle, une vue de chargement est affichée; une erreur réseau propose une nouvelle tentative; une réponse non réseau invalide bascule vers l’écran d’authentification. Après connexion ou inscription vérifiée, l’espace est choisi par `user.role` : `AdminApp` ou `EmployeeApp`. Ces deux bundles sont importés avec `React.lazy`, donc l’espace non nécessaire n’est pas chargé avant usage.

Une expiration de session signalée par une réponse 401 sur une route non-auth déclenche une déconnexion locale et un toast. L’API centrale est dans [src/api/client.js](src/api/client.js).

### Navigation

Il n’y a pas de bibliothèque de routage déclarée ni de routes d’URL pour les pages métier. Les écrans sont choisis par une clé de navigation conservée dans `ui.routeByRole`; les pages visibles sont déclarées dans `PAGES` de chaque application. La slice UI mémorise seulement le dernier écran par rôle dans `localStorage` sous la clé `materio-ui`. L’écran revient à sa première page si la route sauvegardée n’existe plus.

L’URL de requête est exceptionnellement utilisée pour le lien d’invitation : `/?view=signup&email=...` ouvre l’inscription avec l’adresse préremplie/verrouillée. Ce paramètre est supprimé après le changement d’écran.

Les entrées de navigation réelles :

| Rôle | Écrans actifs |
| --- | --- |
| Administrateur | `dashboard`, `requests`, `inventory`, `users` |
| Collaborateur | `catalog`, `requests` |

Une page et des composants de paramètres existent en partie, mais l’entrée de navigation et la route sont commentées dans l’application : les paramètres ne constituent donc pas actuellement une fonctionnalité accessible.

### Redux et persistance

| Slice | État et persistance |
| --- | --- |
| `session` ([src/store/sessionSlice.js](src/store/sessionSlice.js)) | `checking`, `guest` ou `authenticated`, avec l’utilisateur courant. Le JWT n’est pas stocké dans Redux/localStorage : le cookie `httpOnly` du backend accompagne les appels. |
| `data` ([src/store/dataSlice.js](src/store/dataSlice.js)) | État de chargement, erreur, `loadedAt`, matériels, demandes et utilisateurs. Source de vérité = API; slice non persistée. Remise à zéro lors de la déconnexion. |
| `ui` ([src/store/uiSlice.js](src/store/uiSlice.js)) | Dernière page par rôle, persistée sous `materio-ui`; l’absence de stockage n’empêche pas la navigation. |

Le store [src/store/store.js](src/store/store.js) purge également l’ancienne clé de démonstration `materio-redux-state`, puis persiste uniquement la partie UI. Les actions mutatives mettent à jour localement les données Redux après la réponse API.

## 6. Pages et fonctionnalités

### Authentification — [src/features/auth/](src/features/auth/)

- Connexion par e-mail et mot de passe.
- Création de compte avec nom, e-mail, équipe et mot de passe, puis écran de saisie du code à six chiffres.
- Renvoi du code avec compte à rebours lorsque l’API le permet.
- Le formulaire peut être ouvert depuis le lien d’invitation avec l’adresse déjà renseignée; l’API conserve le rôle/équipe de l’invitation.
- Les états d’erreur serveur et erreurs de champs sont présentés dans les formulaires.

### Administration — [src/features/admin/](src/features/admin/)

- **Vue d’ensemble** ([pages/Dashboard.jsx](src/features/admin/pages/Dashboard.jsx)) : volumes par état, nombre de demandes récentes, historique sur 14 jours, demandes récemment mises à jour et alertes de stock.
- **Demandes** ([pages/Requests.jsx](src/features/admin/pages/Requests.jsx)) : recherche, filtres de statut/matériel, tris, panneau de détail et historique, approbation/refus, export CSV côté navigateur. Le CSV est généré à partir des données chargées; aucune route d’export backend n’est appelée.
- **Matériel** ([pages/Inventory.jsx](src/features/admin/pages/Inventory.jsx)) : recherche, filtres disponible/faible/épuisé, tris, création/modification et archivage avec possibilité d’annuler l’action via le toast.
- **Utilisateurs** ([pages/Users.jsx](src/features/admin/pages/Users.jsx)) : recherche/filtre de rôle, invitation, consultation des demandes par filtre de recherche et modification du rôle (hors compte courant).
- Les composants de formulaire sont dans [modals/](src/features/admin/modals/). L’image est contrôlée/décodée dans le navigateur, puis envoyée avant la sauvegarde du matériel; les images inutilisées sont supprimées si l’enregistrement échoue.

### Collaborateur — [src/features/employee/](src/features/employee/)

- **Catalogue** ([pages/Catalog.jsx](src/features/employee/pages/Catalog.jsx)) : catalogue actif, recherche, filtre catégorie et état du stock; ouverture du formulaire de demande pour un matériel disponible.
- **Mes demandes** ([pages/MyRequests.jsx](src/features/employee/pages/MyRequests.jsx)) : liste personnelle, consultation du détail et annulation d’une demande encore en attente.
- **Nouvelle demande** ([modals/RequestFormModal.jsx](src/features/employee/modals/RequestFormModal.jsx)) : matériel, quantité, date souhaitée, justification obligatoire et commentaire optionnel; envoie le timestamp de date à l’API.

### Composants communs

[src/features/shared/AppShell.jsx](src/features/shared/AppShell.jsx) partage le chargement des données, la navigation latérale, l’en-tête, les modales, les toasts, les états occupés et le panneau détail de demande. Au retour sur l’onglet, les données sont rechargées silencieusement si plus de 30 secondes se sont écoulées depuis leur chargement. Le détail dans [src/features/shared/RequestDrawer.jsx](src/features/shared/RequestDrawer.jsx) montre demandeur, matériel, justification, motif de refus et historique; il adapte les actions selon le rôle.

La modale de profil ([src/features/shared/ProfileModal.jsx](src/features/shared/ProfileModal.jsx)) affiche les informations de l’utilisateur courant et permet de se déconnecter. Les champs société « Nexa », site « Paris — Siège » et matricule sont des valeurs construites côté interface; aucun formulaire de modification du profil n’est implémenté.

La recherche, le tri et les filtres visibles sont généralement calculés côté client à partir des listes chargées; le backend ne reçoit pas de paramètres de pagination ou de recherche dans les appels actuels.

## 7. Communication avec le backend

### Client HTTP

`api()` dans [src/api/client.js](src/api/client.js) appelle `fetch('/api' + path)` avec `credentials: 'same-origin'`, sérialise le corps JSON, interprète les réponses et convertit les échecs en `ApiError` (`status`, `code`, `details`, `fields`). Il renvoie `null` pour un statut 204. Les erreurs réseau reçoivent le statut `0`; une annulation `AbortError` est propagée. Les appels d’image utilisent un `XMLHttpRequest` séparé pour suivre le progrès du téléversement.

### Appels métier effectivement utilisés

| Fonctionnalité | Méthodes et chemins |
| --- | --- |
| Authentification ([src/api/auth.js](src/api/auth.js)) | `GET /api/auth/me`, `POST /api/auth/login`, `/api/auth/signup`, `/api/auth/verify-email`, `/api/auth/resend-code`, `/api/auth/logout`. |
| Chargement admin ([src/api/admin.js](src/api/admin.js)) | `GET /api/admin/materials`, `/api/admin/requests`, `/api/admin/users` (en parallèle au démarrage de l’espace). |
| Mutations admin | `POST /api/admin/materials`; `PUT` et `DELETE /api/admin/materials/:id`; `POST /api/admin/materials/:id/restore`; `POST /api/admin/requests/:code/approve`, `/reopen`, `/reject`; `POST /api/admin/users/invitations`; `PATCH /api/admin/users/:id/role`. |
| Images admin ([src/services/materialImages.js](src/services/materialImages.js)) | `POST /api/admin/uploads/materials` avec corps binaire et type MIME; `DELETE /api/admin/uploads/:publicId` pour abandonner un téléversement non utilisé. |
| Chargement employé ([src/api/employee.js](src/api/employee.js)) | `GET /api/employee/materials` et `/api/employee/requests` (en parallèle). |
| Mutations employé | `POST /api/employee/requests`; `POST /api/employee/requests/:code/cancel`. |

Les paramètres identifiant/code sont encodés avec `encodeURIComponent`. Les endpoints d’administration et d’employé s’appuient sur la session cookie et les règles d’autorisation du serveur; le frontend ne constitue pas la barrière de sécurité.

## 8. Présentation et conventions techniques

- Le kit visuel réutilisable se trouve dans [src/components/ui/Kit.jsx](src/components/ui/Kit.jsx); les icônes sont dessinées localement en SVG dans [src/components/ui/icons.jsx](src/components/ui/icons.jsx), sans bibliothèque d’icônes importée.
- Les catégories de matériel sont actuellement `Informatique`, `Audiovisuel`, `Mobilier` et `Réseau`. `stockLevel()` dans [src/utils/formatters.js](src/utils/formatters.js) définit « épuisé » si quantité nulle, « faible » si quantité au plus égale à 25 % du total (arrondi supérieur), sinon « disponible ».
- Les dates métier échangées avec l’API sont des millisecondes depuis l’époque Unix; les helpers d’affichage localisent les dates en français (`fr-FR`).
- Les classes utilitaires Tailwind et le thème (couleurs, typographie, animations, préférence de mouvement réduit) sont configurés dans [src/index.css](src/index.css). La police Inter est importée localement depuis Fontsource.
- Les écrans sont responsive et incluent des états de chargement, erreurs, listes vides et messages toast. Les vues peuvent être consultées dans [src/features/](src/features/).

## 9. Faire évoluer et maintenir le frontend

- Pour ajouter un écran à un rôle, créer le composant de page, le déclarer dans `PAGES` de [src/features/admin/AdminApp.jsx](src/features/admin/AdminApp.jsx) ou [src/features/employee/EmployeeApp.jsx](src/features/employee/EmployeeApp.jsx), puis l’ajouter à la navigation dans [src/components/layout/Sidebar.jsx](src/components/layout/Sidebar.jsx). La clé de page est également la valeur mémorisée pour ce rôle.
- Pour ajouter un appel API, utiliser le client commun `api()` et étendre la façade du rôle concerné sous [src/api/](src/api/); traiter les erreurs de formulaire via `ApiError.fields` et les erreurs globales via les toasts.
- Pour ajouter des données au store, mettre à jour la slice correspondante. Les listes métier doivent rester rechargées depuis l’API; ne pas les rendre persistantes dans `localStorage` sans modifier explicitement le modèle de source de vérité.
- Pour faire évoluer un formulaire, garder les contrôles d’interface alignés avec les contraintes Zod du backend; la validation serveur reste autoritaire.
- Pour changer le serveur backend du proxy de développement, modifier [vite.config.js](vite.config.js). Pour une construction déployée, configurer le proxy/routage côté hébergement; le proxy Vite ne constitue pas une configuration de production.
- Les fichiers publics sous [public/images/materials/](public/images/materials/) sont les illustrations statiques de démonstration. Les images ajoutées depuis l’interface transitent par l’API et sont affichées via l’URL qu’elle renvoie.

# MyFolio 📖

> **Gestionnaire de Collections Personnalisable (Concept "Livre")**  
> Une application web immersive permettant de créer et manipuler des bases de données visuelles sous forme de "Livres" interactifs avec un **système de pivot multidimensionnel instantané** (Labels vs Sous-labels) 100% côté client, une **collaboration en temps réel** et une **lecture à voix haute** multilingue.

---

## 🌟 Points Clés & Fonctionnalités

1. **La Bibliothèque (Page d'accueil)** :
   - Présentation sur étagère avec cartes de livres en relief 3D.
   - Création de livres avec sélection parmi **6 designs de couvertures illustrées** vectorielles (Gastronomie, Grimoire Arcanique, Herbier, Voyage, etc.) et personnalisation des couleurs (couverture et marque-page).
   - **Livres favoris** signalés par un marque-page pour mieux se repérer.
   - **Animation 3D d'ouverture de livre** : le contenu est chargé pendant l'animation, puis la couverture s'efface en fondu (pas de flash à l'ouverture).
   - **Transition de retour** : en quittant un livre, la page glisse de gauche à droite pour révéler la bibliothèque.

2. **Écran Scindé "Intérieur du Livre" (Master-Detail)** :
   - **Menu de gauche** : Liste des catégories actives, bouton d'ajout de label/sous-label, modification inline (nom, couleur) et suppression avec confirmation de cascade.
   - **Réorganisation par glisser-déposer** des labels et sous-labels, avec animation de glissement (souris et tactile). L'ordre est enregistré en base et synchronisé chez les collaborateurs.
   - **Bouton Pivot Dynamique** : Bascule instantanément l'axe d'analyse entre Labels et Sous-labels sans rechargement ni requête serveur.
   - **Espace de droite** : Produits filtrés et découpés en sous-sections thématiques avec recherche instantanée.
   - **Paramètres du livre** : modification du titre, de la couverture, des couleurs et des champs depuis l'intérieur du livre.

3. **Fiches Produits** :
   - **Champs personnalisables par livre** : chaque livre définit les champs de ses éléments (texte, nombre, date, lien).
   - **Fiche détaillée agrandie** pour consulter et modifier un élément, avec zoom sur l'image.
   - **Upload d'images optimisé** : les photos sont compressées dans le navigateur avant l'envoi (jusqu'à 15 Mo en entrée), avec remplacement de photo.
   - **Descriptions en Markdown** : titres, listes, gras, liens, tableaux (GFM). Le HTML brut n'est pas interprété.

4. **Lecture à Voix Haute (TTS)** :
   - Bouton de lecture sur les descriptions, avec des **voix neuronales naturelles** (Microsoft Edge, via `msedge-tts`) générées côté serveur et mises en cache sur disque.
   - **Détection automatique de la langue du texte**, phrase par phrase : un texte bilingue est lu avec la bonne voix pour chaque passage. Une phrase mêlant quelques mots étrangers ("J'adore le street food") reste lue dans une seule langue.
   - Les **tableaux Markdown** et les grilles "bonjour - hello" sont lus cellule par cellule, avec la langue de chaque colonne.
   - **Choix de la voix et de l'accent** par langue (ex. anglais britannique, américain, australien…), avec aperçu.
   - Repli automatique sur les voix de l'appareil si le service de synthèse est indisponible.

5. **Sélection & Panier** :
   - **Mode sélection** pour choisir plusieurs éléments, les regrouper dans un panier (vue d'ensemble) et les supprimer en lot.
   - Le **panier est partagé** et synchronisé en temps réel entre les collaborateurs d'un livre.

6. **Partage & Collaboration en Temps Réel** :
   - Partage d'un livre par e-mail avec gestion des rôles : **lecteur** (`viewer`) ou **éditeur** (`editor`), modification du rôle et retrait d'un collaborateur.
   - **Synchronisation en direct** via Socket.IO : livres, éléments, labels, sous-labels, ordre et panier se mettent à jour chez tous les participants, avec indicateur de synchronisation.
   - Labels et sous-labels uniques par livre (pas de doublons créés par deux collaborateurs en même temps).

7. **Comptes Utilisateurs & Sécurité** :
   - Inscription avec **confirmation de l'adresse e-mail par code à 6 chiffres** (et protection anti-robots par champ piège).
   - Connexion par session JWT, **mot de passe oublié** avec lien de réinitialisation par e-mail (SMTP).
   - **Isolation des données** : chaque utilisateur ne voit que ses livres et ceux partagés avec lui.
   - Durcissement serveur : en-têtes de sécurité (Helmet + CSP), limitation de débit (`express-rate-limit`), prise en charge d'un reverse proxy (`TRUST_PROXY`).

8. **Paramètres & Personnalisation** :
   - Profil : informations personnelles, changement de mot de passe, **suppression du compte**.
   - **Thème clair / sombre** avec transition douce.
   - **Interface en 3 langues** : français, anglais, chinois.
   - **Fond d'écran** : ambiances prédéfinies ou image personnelle (compressée et conservée au rafraîchissement).
   - Interface responsive (barre d'outils adaptée à la taille de l'écran, interactions pensées pour le tactile : un seul appui suffit).

9. **Logique Métier & Règles de Gestion** :
   - **Le Pivot Dynamique (Tri A vs Tri B)** :
     - *Tri A (Vue par Labels / ex: Pays)* : Gauche = Pays (France, Japon, Italie), Droite = Plats découpés par types (Entrée, Plat, Dessert, Général).
     - *Tri B (Vue par Sous-labels / ex: Types)* : Gauche = Types (Entrée, Plat, Dessert), Droite = Plats découpés par pays (France, Japon, Italie, Général).
   - **Multi-tagging** : Un produit peut porter plusieurs labels (ex: *Sushi Burrito* visible à la fois dans Japon et USA).
   - **Gestion des Orphelins ("Général")** : Les produits sans sous-label apparaissent automatiquement dans un bloc dédié "Général".
   - **Suppression en Cascade** : Supprimer un tag depuis la colonne de gauche supprime automatiquement en cascade les éléments associés en base de données.
   - **Route Mega-Fetch (`GET /api/books/:id/content`)** : Récupère tout le contenu du livre en une seule requête optimisée au chargement.

---

## 🛠️ Stack Technique

- **Backend** : Node.js (ES Modules), Express, Mongoose (MongoDB NoSQL), Socket.IO (temps réel), JWT + bcryptjs (authentification), Nodemailer (e-mails), Multer (upload d'images), Helmet, express-rate-limit, Dotenv, Cors.
  - *Synthèse vocale* : `msedge-tts` (voix neuronales Edge) avec cache MP3 dans `backend/tts-cache/`.
  - *Détection de langue* : dictionnaires anglais/français (`an-array-of-english-words`, `an-array-of-french-words`, chargés à la demande) et `franc-min` pour les autres langues.
  - *Résilience* : Support automatique d'une instance locale MongoDB ou MongoDB Atlas via `.env`, avec fallback automatique en mémoire pour un démarrage immédiat sans configuration.
- **Frontend** : React 19, Vite, Tailwind CSS v4, Lucide Icons, `react-markdown` + `remark-gfm`, `socket.io-client`.
  - Moteur de projection pivot 100% côté client (`useMemo` et algorithme d'indexation croisée).
  - Animations CSS et FLIP (glisser-déposer, transitions de pages).

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances

À la racine du projet :
```bash
npm run install:all
```
*(Les scripts d'installation du backend sont désactivés via `backend/.npmrc` : `ignore-scripts=true`.)*

### 2. Configuration

Copier `backend/.env.example` en `backend/.env` et l'adapter (MongoDB, `JWT_SECRET`, URL du frontend, SMTP, `TRUST_PROXY`). Sans SMTP, les liens et codes d'e-mail sont affichés dans la console du backend.

### 3. Démarrage Conjoint (Backend + Frontend)

```bash
npm run dev
```

- **Frontend** accessible sur : [http://localhost:3000](http://localhost:3000)
- **Backend API** accessible sur : [http://localhost:5000](http://localhost:5000)

*(Si la base de données est vide au premier lancement, un jeu de démonstration complet reprenant l'exemple fil rouge "Le Menu Gourmand" est automatiquement injecté. Il peut être réinjecté avec `npm run seed`.)*

---

## 🌐 Déploiement (serveur avec PM2)

Le build du frontend est servi directement par le backend Express. Sur le serveur, une seule commande met à jour l'application :

```bash
npm run deploy
```

Elle enchaîne `git pull --ff-only`, une installation reproductible à partir des `package-lock.json` (`npm ci`), le build du frontend et `pm2 restart myfolio`.

---

## 🧪 Tests d'Intégration Automatisés

Pour valider le bon fonctionnement de la base de données, du multi-tagging, des orphelins et de la suppression en cascade :

```bash
cd backend
node src/tests/integrationTest.js
```

D'autres scénarios sont disponibles dans `backend/src/tests/` : authentification, vérification d'e-mail, isolation des données, sécurité, partage, temps réel, panier partagé, champs personnalisés et paramètres (`npm test` lance le test d'isolation).

---

## 📁 Architecture du Projet

```
MyFolio/
├── package.json                   # Scripts globaux (dev, install:all, build, deploy)
├── backend/
│   ├── src/
│   │   ├── config/db.js           # Connexion Mongoose avec fallback
│   │   ├── models/                # User, Book, Label, SubLabel, Product
│   │   ├── controllers/           # Logique CRUD, Mega-Fetch, réordonnancement, TTS
│   │   ├── routes/                # Endpoints REST (auth, books, labels, products, tts)
│   │   ├── middlewares/           # Authentification JWT
│   │   ├── utils/                 # Permissions, Socket.IO, synthèse vocale, détection de langue
│   │   ├── seeds/seedData.js      # Données de démonstration du fil rouge
│   │   └── tests/                 # Tests d'intégration
│   ├── uploads/                   # Fichiers médias téléversés
│   └── tts-cache/                 # Cache audio de la lecture à voix haute (non versionné)
└── frontend/
    ├── src/
    │   ├── assets/covers/         # SVGs illustrés des couvertures de livres
    │   ├── components/
    │   │   ├── auth/              # Connexion, inscription, mentions légales
    │   │   ├── library/           # Bibliothèque, étagères, création et partage de livre
    │   │   ├── book/              # Animation 3D d'ouverture, vue détaillée
    │   │   ├── navigation/        # Colonne de gauche (glisser-déposer) & Bouton Pivot
    │   │   ├── content/           # Workspace produits, Markdown, lecture à voix haute
    │   │   ├── modals/            # Création/édition, fiche détaillée, panier
    │   │   └── settings/          # Paramètres, thème, langue
    │   ├── context/               # Authentification
    │   ├── i18n/                  # Traductions (fr, en, zh)
    │   ├── theme/                 # Thème clair/sombre & fonds d'écran
    │   ├── services/              # Client API HTTP, auth, Socket.IO
    │   ├── utils/                 # Moteur pivot, optimisation d'images, Markdown, préférences de voix
    │   ├── App.jsx                # Orchestrateur d'état React
    │   └── main.jsx
```

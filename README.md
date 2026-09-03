# MyFolio 📖

> **Gestionnaire de Collections Personnalisable (Concept "Livre")**  
> Une application web immersive permettant de créer et manipuler des bases de données visuelles sous forme de "Livres" interactifs avec un **système de pivot multidimensionnel instantané** (Labels vs Sous-labels) 100% côté client.

---

## 🌟 Points Clés & Fonctionnalités

1. **La Bibliothèque (Page d'accueil)** :
   - Présentation sur étagère avec cartes de livres en relief 3D.
   - Création de livres avec sélection parmi **6 designs de couvertures illustrées** vectorielles (Gastronomie, Grimoire Arcanique, Herbier, Voyage, etc.) et personnalisation des couleurs.
   - **Animation fluide 3D d'ouverture de livre** au clic menant vers le contenu intérieur.

2. **Écran Scindé "Intérieur du Livre" (Master-Detail)** :
   - **Menu de gauche** : Liste des catégories actives, bouton d'ajout de label/sous-label, modification inline (nom, couleur) et suppression avec confirmation de cascade.
   - **Bouton Pivot Dynamique** : Bascule instantanément l'axe d'analyse entre Labels et Sous-labels sans rechargement ni requête serveur.
   - **Espace de droite** : Produits filtrés et découpés en sous-sections thématiques avec recherche instantanée.

3. **Logique Métier & Règles de Gestion** :
   - **Le Pivot Dynamique (Tri A vs Tri B)** :
     - *Tri A (Vue par Labels / ex: Pays)* : Gauche = Pays (France, Japon, Italie), Droite = Plats découpés par types (Entrée, Plat, Dessert, Général).
     - *Tri B (Vue par Sous-labels / ex: Types)* : Gauche = Types (Entrée, Plat, Dessert), Droite = Plats découpés par pays (France, Japon, Italie, Général).
   - **Multi-tagging** : Un produit peut porter plusieurs labels (ex: *Sushi Burrito* visible à la fois dans Japon et USA).
   - **Gestion des Orphelins ("Général")** : Les produits sans sous-label apparaissent automatiquement dans un bloc dédié "Général".
   - **Suppression en Cascade** : Supprimer un tag depuis la colonne de gauche supprime automatiquement en cascade les éléments associés en base de données.
   - **Route Mega-Fetch (`GET /api/books/:id/content`)** : Récupère tout le contenu du livre en une seule requête optimisée au chargement.

---

## 🛠️ Stack Technique

- **Backend** : Node.js (ES Modules), Express, Mongoose (MongoDB NoSQL), Multer (upload d'images), Dotenv, Cors.
  - *Résilience* : Support automatique d'une instance locale MongoDB ou MongoDB Atlas via `.env`, avec fallback automatique en mémoire pour un démarrage immédiat sans configuration.
- **Frontend** : React, Vite, Tailwind CSS, Lucide Icons.
  - Moteur de projection pivot 100% côté client (`useMemo` et algorithme d'indexation croisée).

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances

À la racine du projet :
```bash
npm run install:all
```
*(ou `cd backend && npm install` puis `cd frontend && npm install`)*

### 2. Démarrage Conjoint (Backend + Frontend)

```bash
npm run dev
```

- **Frontend** accessible sur : [http://localhost:3000](http://localhost:3000)
- **Backend API** accessible sur : [http://localhost:5000](http://localhost:5000)

*(Si la base de données est vide au premier lancement, un jeu de démonstration complet reprenant l'exemple fil rouge "Le Menu Gourmand" est automatiquement injecté).*

---

## 🧪 Tests d'Intégration Automatisés

Pour valider le bon fonctionnement de la base de données, du multi-tagging, des orphelins et de la suppression en cascade :

```bash
cd backend
node src/tests/integrationTest.js
```

---

## 📁 Architecture du Projet

```
MyFolio/
├── package.json                   # Scripts globaux (dev, install:all)
├── backend/
│   ├── src/
│   │   ├── config/db.js           # Connexion Mongoose avec fallback
│   │   ├── models/                # Book, Label, SubLabel, Product
│   │   ├── controllers/           # Logique CRUD + Mega-Fetch
│   │   ├── routes/                # Endpoints REST
│   │   ├── seeds/seedData.js      # Données de démonstration du fil rouge
│   │   └── tests/                 # Tests d'intégration
│   └── uploads/                   # Fichiers médias téléversés
└── frontend/
    ├── src/
    │   ├── assets/covers/         # SVGs illustrés des couvertures de livres
    │   ├── components/
    │   │   ├── library/           # Bibliothèque, étagères, création de livre
    │   │   ├── book/              # Animation 3D d'ouverture, vue détaillée
    │   │   ├── navigation/        # Colonne de gauche & Bouton Pivot
    │   │   ├── content/           # Workspace produits & sections
    │   │   └── modals/            # Modales de création/édition
    │   ├── services/api.js        # Client API HTTP
    │   ├── utils/pivotEngine.js   # Moteur de tri et de projection multidimensionnelle
    │   ├── App.jsx                # Orchestrateur d'état React
    │   └── main.jsx
```
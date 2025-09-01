# Changelog

## [3.2.0] - 2025-01-01

### ✨ Nouvelles fonctionnalités

#### 🎯 Système de scoring avancé

- **Notation des séries de benchmarks** : Système de scoring 0-10 avec commentaires pour chaque série de tests
- **Interface intuitive** : Composants d'édition inline pour noter/modifier les scores directement dans le modal
- **Persistance des données** : Scores sauvegardés dans les fichiers de données des modèles
- **API unifiée** : Intégration des scores dans l'API existante `/api/models/[name]/benchmark`

#### 🔧 Refactoring modal complet

- **Interface 4 onglets** : Informations, Benchmarks, Historique, Configuration
- **Données timing enrichies** : Affichage des temps d'exécution et métadonnées détaillées
- **Lancement de benchmarks** : Exécution directe depuis le modal avec feedback en temps réel
- **Gestion d'état améliorée** : Hooks personnalisés pour la gestion des données de modèles

#### 📊 Améliorations des benchmarks

- **Correspondance intelligente** : Mapping automatique entre configurations et résultats
- **Statuts visuels** : Indicateurs clairs pour les tests exécutés/non exécutés
- **Historique détaillé** : Suivi complet des exécutions précédentes
- **Configuration flexible** : Support de multiples types de benchmarks

### 🛠️ Améliorations techniques

#### 🔄 API et architecture

- **Endpoints enrichis** : Support PUT/DELETE pour la gestion des scores
- **Structure de données unifiée** : Intégration scores dans les fichiers modèles existants
- **Gestion d'erreurs robuste** : Validation et messages d'erreur améliorés
- **TypeScript complet** : Interfaces exhaustives pour le système de scoring

#### 🎨 Interface utilisateur

- **Design cohérent** : Composants réutilisables avec Tailwind CSS
- **Interactions fluides** : Animations et transitions pour une meilleure UX
- **Responsive design** : Adaptation automatique à différentes tailles d'écran
- **Accessibilité** : Support clavier et lecteurs d'écran

### 🧹 Nettoyage et optimisations

- **Suppression du système de notes obsolète** : Remplacement par le système de scoring
- **Réduction des appels API** : Unification des endpoints pour moins de requêtes
- **Code plus maintenable** : Refactoring des composants complexes
- **Performance améliorée** : Optimisation des re-renders et états

### 📁 Structure des fichiers

```
data/
├── benchmark/
│   └── models/
│       └── [model].json    # Maintenant avec scores intégrés
components/
├── Modal/
│   └── ModelDetailModal.tsx    # Modal refactorisé 4 onglets
lib/
├── types/
│   └── scoring.ts          # Interfaces TypeScript pour scoring
app/api/
└── models/[name]/benchmark/
    └── route.ts            # API unifiée avec gestion scores
```

### 🔧 Configuration requise

- Node.js 18+
- Next.js 14+
- TypeScript 5+

### 📦 Dépendances

- **Nouvelles** : Aucune dépendance externe ajoutée
- **Mises à jour** : Optimisation des hooks existants
- **Supprimées** : Nettoyage des dépendances inutilisées

---

## Migration depuis v3.1.x

### Données existantes

Les données existantes sont automatiquement compatibles. Le nouveau système de scoring s'ajoute aux fichiers modèles sans impacter les données existantes.

### API Breaking Changes

- Aucun breaking change - rétrocompatibilité maintenue
- Nouveaux endpoints optionnels pour le scoring

### Interface utilisateur

- Modal redesigné avec nouveaux onglets
- Système de notes remplacé par scoring (migration automatique)

---

**Contributeurs**: Équipe de développement
**Date de release**: 1er janvier 2025
**Compatibilité**: Rétrocompatible avec v3.1.x

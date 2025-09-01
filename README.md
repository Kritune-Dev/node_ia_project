# Medical LLM Platform v3.2.0

> Plateforme d'analyse IA pour données cliniques ostéopathiques - Interface de benchmarking et scoring avancé

## 🚀 Nouvelle version 3.2.0

### ✨ Fonctionnalités principales

- **🎯 Système de scoring avancé** : Notation 0-10 avec commentaires pour chaque série de benchmarks
- **📊 Modal redesigné** : Interface 4 onglets (Infos, Benchmarks, Historique, Config)
- **⚡ Exécution directe** : Lancement de benchmarks depuis l'interface
- **📈 Données enrichies** : Timing, métadonnées et historique détaillé
- **🔄 API unifiée** : Gestion centralisée des scores et benchmarks

## 🛠️ Installation

```bash
# Cloner le projet
git clone <repository-url>
cd node_ia_project

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.local.example .env.local

# Démarrer en développement
npm run dev
```

## 📖 Utilisation

### Interface principale
1. **Page d'accueil** : Vue d'ensemble des modèles disponibles
2. **Modal détaillé** : Clic sur un modèle pour ouvrir l'interface complète
3. **Onglet Benchmarks** : Voir et exécuter les tests, noter les performances
4. **Onglet Historique** : Suivre l'évolution des résultats

### Système de scoring
```typescript
// Structure des scores
interface SeriesScore {
  score: number        // 0-10
  comment: string      // Commentaire utilisateur
  timestamp: string    // Date de notation
}
```

### API Endpoints

```bash
# Obtenir les données d'un modèle (avec scores)
GET /api/models/[name]

# Gérer les scores
PUT /api/models/[name]/benchmark
DELETE /api/models/[name]/benchmark

# Exécuter des benchmarks
POST /api/benchmark/execute
```

## 🏗️ Architecture

```
app/
├── api/
│   ├── models/[name]/
│   │   └── benchmark/route.ts     # API unifiée scores + benchmarks
│   └── benchmark/
│       └── execute/route.ts       # Exécution des tests
├── benchmark/page.tsx             # Page principale benchmarks
└── page.tsx                       # Accueil

components/
├── Modal/
│   └── ModelDetailModal.tsx       # Modal 4 onglets avec scoring
├── benchmark/
│   └── ModularBenchmarkSystem.tsx # Système de benchmarks
└── [autres composants UI]

data/
├── benchmark/
│   └── models/[model].json        # Données modèles + scores
└── benchmark-configs.json         # Configurations des tests

lib/
├── types/
│   └── scoring.ts                 # Interfaces TypeScript
└── [utilitaires]
```

## 🎯 Fonctionnalités détaillées

### Modal redesigné (4 onglets)

#### 1. **Informations**
- Métadonnées du modèle
- Configuration service
- Statut et performance

#### 2. **Benchmarks**
- Liste des tests disponibles
- **Scoring intégré** : Noter directement chaque série
- Lancement d'exécution en un clic
- Statuts visuels (testé/non testé)

#### 3. **Historique**
- Chronologie des exécutions
- Évolution des scores
- Détails des sessions passées

#### 4. **Configuration**
- Paramètres du modèle
- Options de personnalisation
- Gestion des préférences

### Système de scoring avancé

```tsx
// Utilisation dans l'interface
<SeriesScoreDisplay
  seriesId="smoke_test"
  score={currentScore}
  isEditing={editMode}
  onSave={(score, comment) => updateScore(seriesId, score, comment)}
  onDelete={() => deleteScore(seriesId)}
/>
```

## 🔧 Configuration

### Variables d'environnement
```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
BENCHMARK_DATA_PATH=./data/benchmark
MODEL_CONFIGS_PATH=./data/models-config.json
```

### Structure des données

```json
// data/benchmark/models/model_example.json
{
  "modelName": "example_model",
  "resultsSummary": {
    "smoke_test": { ... }
  },
  "scores": {
    "smoke_test": {
      "score": 8.5,
      "comment": "Très bon sur les tests rapides",
      "timestamp": "2025-01-01T12:00:00Z"
    }
  },
  "history": [ ... ]
}
```

## 📊 Métriques et scoring

### Échelle de notation
- **0-3** : Performance insuffisante
- **4-6** : Performance acceptable
- **7-8** : Bonne performance
- **9-10** : Excellente performance

### Critères de scoring
- Précision des réponses
- Rapidité d'exécution
- Pertinence clinique
- Fiabilité générale

## 🚀 Développement

### Scripts disponibles
```bash
npm run dev          # Développement
npm run build        # Build production
npm run start        # Démarrage production
npm run lint         # Linting
npm run test         # Tests unitaires
```

### Structure de développement
```bash
# Branches principales
main                 # Production stable
develop              # Développement
refactor-benchmark   # Fonctionnalités scoring v3.2.0
```

## 📚 Documentation

- [CHANGELOG.md](./CHANGELOG.md) - Historique des versions
- [docs/MODELS_CONFIG.md](./docs/MODELS_CONFIG.md) - Configuration des modèles

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/scoring-v3`)
3. Commit les changements (`git commit -m 'Add: nouveau système scoring'`)
4. Push vers la branche (`git push origin feature/scoring-v3`)
5. Ouvrir une Pull Request

## 📝 Licence

Projet académique - Mémoire de fin d'études

## 👥 Équipe

Développé dans le cadre d'un mémoire de fin d'études sur l'analyse IA en ostéopathie.

---

**Version actuelle** : 3.2.0  
**Dernière mise à jour** : 1er janvier 2025  
**Compatibilité** : Node.js 18+, Next.js 14+

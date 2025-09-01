# 🏗️ Architecture des Données - Node IA Project

> Documentation complète du système de "pseudo base de données" basé sur des fichiers JSON

## 📋 Vue d'ensemble

Ce projet utilise un système de stockage de données **file-based** entièrement basé sur des fichiers JSON, sans base de données traditionnelle. Cette approche offre simplicité, portabilité et facilité de debug pour un projet de benchmarking d'IA.

## 🗂️ Structure Générale des Données

```
data/
├── models-config.json          # Configuration des modèles LLM
├── benchmark-configs.json      # Configurations des tests de benchmark
└── benchmark/
    ├── history.json            # Index général des benchmarks
    ├── pendingTest.json        # Statut des tests en cours
    ├── results/
    │   └── benchmark_[id].json # Résultats détaillés par benchmark
    └── models/
        └── model_[name].json   # Historique et stats par modèle
```

---

## 📊 1. Configuration des Modèles (`models-config.json`)

### Structure

```json
{
  "models": {
    "[model_name]": {
      "displayName": "string",
      "description": "string",
      "type": "medical|general|rapide",
      "specialties": ["string[]"],
      "parameters": "string",
      "github": "string?",
      "website": "string?",
      "metrics": { "key": "value" },
      "notes": "string?"
    }
  },
  "config": {
    "lastUpdated": "ISO string",
    "version": "string"
  }
}
```

### Utilisation

- **Lecture** : APIs `/api/models` et `/api/models/[name]`
- **Écriture** : API `/api/models/config` et script `manage-models-config.js`
- **Enrichissement** : Fusion avec données Ollama en temps réel

### Types de Modèles

- `medical` : Modèles spécialisés en médecine
- `general` : Modèles usage général
- `rapide` : Modèles optimisés pour la vitesse

---

## 🧪 2. Configuration des Benchmarks (`benchmark-configs.json`)

### Structure

```json
{
  "benchmarks": {
    "[benchmark_id]": {
      "id": "string",
      "name": "string",
      "description": "string",
      "version": "string",
      "testTypes": ["string[]"],
      "parameters": {
        "temperature": "number",
        "timeout": "number",
        "maxTokens": "number",
        "seed": "number"
      },
      "prompts": {
        "system": "string",
        "evaluation": "string"
      },
      "questions": [
        {
          "id": "string",
          "text": "string",
          "category": "string",
          "expectedType": "string",
          "difficulty": "easy|medium|hard",
          "expectedResponse": "string?",
          "keywords": ["string[]"],
          "maxResponseLength": "number?"
        }
      ]
    }
  }
}
```

### Utilisation

- **Lecture** : API `/api/benchmark/configs`
- **Écriture** : API `/api/benchmark/configs` (POST)
- **Exécution** : API `/api/benchmark/execute`

---

## 📈 3. Historique des Benchmarks (`history.json`)

### Structure

```json
{
  "version": "3.0.0",
  "lastUpdated": "ISO string",
  "benchmarks": [
    {
      "id": "benchmark_[timestamp]_[random]",
      "name": "string",
      "timestamp": "ISO string",
      "duration": "number (ms)",
      "successRate": "number (0-100)",
      "status": "completed|failed|running",
      "modelsDisplayNames": ["string[]"],
      "testSeriesNames": ["string[]"],
      "modelCount": "number",
      "questionCount": "number"
    }
  ]
}
```

### Utilisation

- **Lecture** : API `/api/benchmark/history`
- **Écriture** : Automatique lors de l'exécution de benchmarks
- **Suppression** : API `/api/benchmark/history/[id]` (DELETE)

---

## 🔬 4. Résultats Détaillés (`benchmark_[id].json`)

### Structure

```json
{
  "id": "string",
  "displayName": "string",
  "testSeries": "string",
  "timestamp": "ISO string",
  "startTime": "number (timestamp)",
  "summary": {
    "total_tests": "number",
    "successful_tests": "number",
    "failed_tests": "number",
    "total_models": "number",
    "average_response_time": "number",
    "average_tokens_per_second": "number",
    "total_duration": "number",
    "categories_tested": ["string[]"],
    "models_tested": ["string[]"]
  },
  "results": {
    "[model_name]": {
      "model_name": "string",
      "service_url": "string",
      "total_response_time": "number",
      "average_response_time": "number",
      "total_tokens_per_second": "number",
      "average_tokens_per_second": "number",
      "success_rate": "number",
      "questions": {
        "[question_id]": {
          "question": "string",
          "category": "string",
          "difficulty": "string",
          "success": "boolean",
          "response": "string",
          "responseTime": "number",
          "tokensPerSecond": "number",
          "model": "string",
          "isTimeout": "boolean"
        }
      }
    }
  }
}
```

---

## 🔄 Flux de Données

### 1. Lecture des Modèles

```
Ollama API → /api/models → models-config.json → Interface
```

### 2. Exécution de Benchmark

```
Config JSON → Questions → Exécution → Résultats JSON → Historique
```

### 3. Consultation des Résultats

```
history.json → Sélection → benchmark_[id].json → Affichage détaillé
```

---

## 🛠️ APIs de Gestion

| Endpoint                      | Méthode         | Fichier Cible            | Description                |
| ----------------------------- | --------------- | ------------------------ | -------------------------- |
| `/api/models`                 | GET             | `models-config.json`     | Liste des modèles enrichis |
| `/api/models/[name]`          | GET             | `models-config.json`     | Détails d'un modèle        |
| `/api/models/config`          | GET/PUT/DELETE  | `models-config.json`     | Gestion config modèles     |
| `/api/benchmark/configs`      | GET/POST        | `benchmark-configs.json` | Gestion config benchmarks  |
| `/api/benchmark/history`      | GET/POST/DELETE | `history.json`           | Gestion historique         |
| `/api/benchmark/history/[id]` | GET/DELETE      | `benchmark_[id].json`    | Résultats spécifiques      |
| `/api/benchmark/execute`      | POST            | Multiple                 | Exécution benchmark        |

---

## 🧰 Scripts de Gestion

### `manage-models-config.js`

```bash
# Lister les modèles
node scripts/manage-models-config.js list

# Ajouter un modèle
node scripts/manage-models-config.js add [nom]

# Modifier un modèle
node scripts/manage-models-config.js edit [nom]

# Supprimer un modèle
node scripts/manage-models-config.js remove [nom]

# Valider la configuration
node scripts/manage-models-config.js validate

# Synchroniser avec Ollama
node scripts/manage-models-config.js sync
```

### `install-models.js`

```bash
# Installer des modèles Ollama
node scripts/install-models.js
```

---

## 🔧 Mécanismes Techniques

### Gestion des Fichiers

- **Lecture** : `fs.readFileSync()` synchrone pour les APIs
- **Écriture** : `fs.writeFileSync()` avec formatage JSON (`null, 2`)
- **Sécurité** : Vérification d'existence et gestion d'erreurs
- **Migration** : Support des anciens formats avec migration automatique

### Cache et Performance

- **Cache en mémoire** : Service `ModelDataService` avec TTL de 5 minutes
- **Lazy loading** : Chargement à la demande des fichiers
- **Optimisation** : Index dans `history.json` pour éviter le scan complet

### Validation

- **Structure JSON** : Validation des formats requis
- **Types de données** : Vérification des types (string, number, array)
- **Intégrité** : Contrôle de cohérence entre fichiers

---

## 🎯 Avantages de cette Architecture

### ✅ Points Forts

- **Simplicité** : Pas de DB à configurer ou maintenir
- **Portabilité** : Fichiers JSON facilement transférables
- **Debug** : Inspection directe des données
- **Versioning** : Compatible avec Git pour le suivi des changements
- **Backup** : Sauvegarde simple par copie de dossier
- **Transparence** : Structure de données visible et éditable

### ⚠️ Limitations

- **Concurrence** : Pas de gestion des accès simultanés
- **Scalabilité** : Performance dégradée avec de gros volumes
- **Atomicité** : Pas de transactions ACID
- **Indexation** : Recherche séquentielle dans les gros fichiers

---

## 📊 Statistiques Actuelles

```json
{
  "models_configured": 30,
  "benchmark_types": 6,
  "questions_total": 50+,
  "results_stored": 8,
  "disk_usage": "~2MB"
}
```

---

## 🔮 Évolutions Possibles

### Court Terme

- [ ] Compression des résultats anciens
- [ ] Index secondaires pour les recherches
- [ ] Validation de schéma automatique

### Long Terme

- [ ] Migration vers SQLite pour la performance
- [ ] API GraphQL pour les requêtes complexes
- [ ] Système de backup automatique

---

## 🛡️ Bonnes Pratiques

1. **Toujours sauvegarder** avant modification manuelle
2. **Utiliser les scripts** plutôt que l'édition directe
3. **Valider le JSON** après chaque modification
4. **Respecter les formats** d'ID et de timestamp
5. **Nettoyer périodiquement** les anciens résultats

---

_Documentation mise à jour le : septembre 2025_
_Version du système : 3.0.0_

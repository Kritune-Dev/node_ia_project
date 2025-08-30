# 📚 Documentation des Endpoints API v3.0 - RESTful

## 🏗️ Architecture Centralisée

L'API est organisée en **2 couches principales** avec une approche RESTful :

### 🔧 **Couche Technique** - `/api/ollama`

Services bas niveau pour la communication directe avec Ollama

### 🏢 **Couche Métier** - Services business

Services haut niveau avec logique métier et enrichissement des données

---

## 🔧 Couche Technique - `/api/ollama`

### `GET /api/ollama`

**Service principal Ollama**

- **Fonction** : Point d'entrée principal pour vérifier la santé et lister les modèles
- **Réponse** :
  ```json
  {
    "healthy": true,
    "models": ["llama3.1:8b", "mistral:7b"],
    "modelCount": 2,
    "uptime": "2h 30m",
    "version": "0.1.45"
  }
  ```

### `GET /api/ollama/health`

**Monitoring dédié Ollama**

- **Fonction** : Surveillance approfondie du service Ollama (pour debug technique)
- **Réponse** :
  ```json
  {
    "status": "healthy",
    "uptime": "2h 30m 15s",
    "models": 5,
    "memory": "2.3GB",
    "lastCheck": "2025-08-30T14:30:00Z"
  }
  ```

### `POST /api/ollama/generate`

**Proxy de génération centralisé**

- **Fonction** : Point unique pour toutes les générations de texte
- **Body** :
  ```json
  {
    "model": "llama3.1:8b",
    "prompt": "Votre prompt ici",
    "stream": false
  }
  ```
- **Réponse** :
  ```json
  {
    "success": true,
    "response": "Réponse générée",
    "performance": {
      "responseTime": 1250,
      "tokensPerSecond": 45.2
    }
  }
  ```

---

## 🏢 Couche Métier - Services Business

### 🤖 **Gestion des Modèles** - `/api/models`

#### `GET /api/models`

**Liste tous les modèles**

- **Fonction** : Modèles avec métadonnées business (scores, configs, etc.)
- **Source** : Utilise `/api/ollama` + enrichissement
- **Réponse** :
  ```json
  {
    "success": true,
    "models": [
      {
        "name": "llama3.1:8b",
        "family": "llama",
        "size": "8B",
        "benchmarkScore": 85.2,
        "lastUsed": "2025-08-30T12:00:00Z",
        "status": "ready",
        "capabilities": ["text-generation", "conversation"]
      }
    ],
    "count": 5
  }
  ```

#### `GET /api/models/[name]`

**Détails d'un modèle spécifique**

- **Fonction** : Informations complètes d'un modèle
- **URL** : `/api/models/llama3.1:8b`
- **Réponse** :
  ```json
  {
    "success": true,
    "model": {
      "name": "llama3.1:8b",
      "family": "llama",
      "size": "8B",
      "description": "Modèle Llama optimisé...",
      "capabilities": ["text-generation", "conversation"],
      "benchmarkScore": 85.2,
      "customMetadata": {},
      "available": true
    }
  }
  ```

#### `PUT /api/models/[name]`

**Modifier les métadonnées d'un modèle**

- **Fonction** : Mise à jour des métadonnées d'un modèle existant
- **Body** :
  ```json
  {
    "description": "Nouvelle description",
    "capabilities": ["text-generation", "code"],
    "benchmarkScore": 87.5,
    "customMetadata": { "optimized": true }
  }
  ```

#### `POST /api/models/[name]`

**Créer/modifier les métadonnées d'un modèle**

- **Fonction** : Création ou modification complète des métadonnées
- **Body** :
  ```json
  {
    "family": "llama",
    "description": "Description personnalisée",
    "capabilities": ["text-generation"],
    "customMetadata": { "version": "v2" }
  }
  ```

### `GET /api/models/config`

**Configuration des modèles**

- **Fonction** : Retourne la configuration complète des familles de modèles
- **Réponse** :
  ```json
  {
    "families": {
      "llama": {
        "displayName": "Llama",
        "models": ["llama3.1:8b", "llama3.1:70b"]
      }
    }
  }
  ```

---

## 🎯 **Services Benchmark**

### `POST /api/benchmark/execute`

**Exécution de benchmarks**

- **Fonction** : Lance des tests de performance sur les modèles
- **Source** : Utilise `/api/ollama/generate`
- **Body** :
  ```json
  {
    "models": ["llama3.1:8b", "mistral:7b"],
    "questions": [
      {
        "id": "q1",
        "question": "Question de test",
        "expectedLength": "short"
      }
    ]
  }
  ```

### 📋 **Gestion de l'Historique** - `/api/benchmark/history`

#### `GET /api/benchmark/history`

**Liste avec métadonnées légères**

- **Fonction** : Historique complet avec métadonnées légères
- **Réponse** :
  ```json
  {
    "success": true,
    "benchmarks": [
      {
        "id": "benchmark_1756274344640_d9tnd395v",
        "name": "Test Benchmark",
        "timestamp": "2025-08-30T10:30:00Z",
        "duration": 45000,
        "successRate": 85.5,
        "status": "completed",
        "modelCount": 3,
        "questionCount": 5
      }
    ],
    "count": 12
  }
  ```

#### `GET /api/benchmark/history/[id]`

**Résultats complets d'un benchmark**

- **Fonction** : Détails complets d'un benchmark spécifique
- **URL** : `/api/benchmark/history/benchmark_1756274344640_d9tnd395v`
- **Réponse** : Fichier JSON complet avec tous les résultats

#### `POST /api/benchmark/history`

**Ajouter un benchmark dans l'historique**

- **Fonction** : Ajouter ou mettre à jour un benchmark
- **Body** :
  ```json
  {
    "id": "benchmark_new_123",
    "name": "Mon Benchmark",
    "duration": 30000,
    "successRate": 92.3,
    "status": "completed",
    "modelsDisplayNames": ["llama3.1:8b", "mistral:7b"],
    "modelCount": 2,
    "questionCount": 10
  }
  ```

#### `DELETE /api/benchmark/history`

**Supprimer tous les benchmarks**

- **Fonction** : Vider complètement l'historique
- **Query params** : `?deleteFiles=true` pour supprimer aussi les fichiers

#### `DELETE /api/benchmark/history/[id]`

**Supprimer un benchmark spécifique**

- **Fonction** : Supprimer un benchmark par son ID
- **URL** : `/api/benchmark/history/benchmark_1756274344640_d9tnd395v`

---

## 🏥 Services de Santé

### `GET /api/health`

**Santé globale du système**

- **Fonction** : Vérifie la santé de tous les services (Ollama + Next.js + système)
- **Réponse** :
  ```json
  {
    "status": "healthy",
    "services": {
      "ollama": {
        "healthy": true,
        "models": 5,
        "url": "http://localhost:11434"
      },
      "system": {
        "healthy": true,
        "uptime": "5h 20m"
      }
    }
  }
  ```

---

## 🔄 Flux de Données Mis à Jour

```mermaid
graph TD
    A[Frontend] --> B[/api/models]
    A --> C[/api/models/[name]]
    A --> D[/api/benchmark/execute]
    A --> E[/api/benchmark/history]
    A --> F[/api/benchmark/history/[id]]
    A --> G[/api/health]

    B --> H[/api/ollama]
    C --> H
    D --> I[/api/ollama/generate]
    G --> H

    H --> J[Ollama Service]
    I --> J
```

## 📊 Métriques et Performance

Tous les endpoints qui utilisent `/api/ollama/generate` retournent automatiquement :

- **responseTime** : Temps de réponse en ms
- **tokensPerSecond** : Vitesse de génération
- **model** : Modèle utilisé
- **isTimeout** : Indicateur de timeout

## 🚀 Utilisation Recommandée - RESTful

### **Modèles**

- **Lister** : `GET /api/models`
- **Détails** : `GET /api/models/llama3.1:8b`
- **Modifier** : `PUT /api/models/llama3.1:8b`
- **Créer** : `POST /api/models/llama3.1:8b`

### **Benchmarks**

- **Exécuter** : `POST /api/benchmark/execute`
- **Historique** : `GET /api/benchmark/history`
- **Détails** : `GET /api/benchmark/history/[id]`
- **Ajouter** : `POST /api/benchmark/history`
- **Supprimer** : `DELETE /api/benchmark/history/[id]`

### **Génération**

- **Générer du texte** : `POST /api/ollama/generate` (centralisé)

### **Santé**

- **Globale** : `GET /api/health`
- **Ollama** : `GET /api/ollama/health`

## ✅ Restructuration Complétée

### **Endpoints RESTful créés :**

- ✅ `/api/models` - GET (liste)
- ✅ `/api/models/[name]` - GET, PUT, POST (CRUD)
- ✅ `/api/benchmark/history` - GET, POST, DELETE
- ✅ `/api/benchmark/history/[id]` - GET, DELETE

### **Endpoints supprimés :**

- ❌ `/api/benchmark/results/[id]` → Remplacé par `/api/benchmark/history/[id]`
- ❌ `/api/models/[modelName]/complete` → Remplacé par `/api/models/[name]`

### **Architecture finale :**

- 🏗️ **Couche technique** : `/api/ollama` (3 endpoints)
- 🏢 **Couche métier** : `/api/models` (4 endpoints) + `/api/benchmark` (3 endpoints)
- 🏥 **Santé** : `/api/health` (global) vs `/api/ollama/health` (technique)

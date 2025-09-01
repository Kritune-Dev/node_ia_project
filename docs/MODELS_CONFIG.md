# Configuration des Modèles LLM v3.2.0

Ce document explique comment utiliser le système de configuration JSON pour personnaliser les informations des modèles LLM dans l'application, incluant le nouveau système de scoring.

## 📁 Fichiers de Configuration

### Configuration principale
```
data/models-config.json          # Configuration des modèles
```

### Données des modèles (avec scores v3.2.0)
```
data/benchmark/models/           # Données par modèle
├── model_example.json           # Résultats + scores
└── [autres modèles].json
```

## 🏗️ Structure de la Configuration

```json
{
  "models": {
    "nom-du-modele:tag": {
      "displayName": "Nom d'affichage",
      "description": "Description complète du modèle",
      "type": "medical|general",
      "specialties": ["Spécialité 1", "Spécialité 2"],
      "parameters": "7B",
      "github": "https://github.com/...",
      "website": "https://huggingface.co/...",
      "metrics": {
        "accuracy": "85%",
        "performance": "78%"
      },
      "notes": "Notes additionnelles"
    }
  },
  "categories": {
    "medical": {
      "label": "Médical",
      "description": "Modèles spécialisés médicaux",
      "color": "red"
    }
  },
  "specialties": ["Liste", "Des", "Spécialités"],
  "config": {
    "version": "1.0.0",
    "lastUpdated": "2025-08-27T00:00:00Z"
  }
}
```

## 🛠️ Gestion via Script

### Commandes Disponibles

```bash
# Lister tous les modèles configurés
node scripts/manage-models-config.js list

# Ajouter un nouveau modèle
node scripts/manage-models-config.js add "nouveau-modele:latest"

# Modifier un modèle existant
node scripts/manage-models-config.js edit "meditron:latest"

# Supprimer un modèle
node scripts/manage-models-config.js remove "modele:tag"

# Valider la configuration
node scripts/manage-models-config.js validate

# Synchroniser avec Ollama
node scripts/manage-models-config.js sync
```

### Exemple d'Ajout de Modèle

```bash
node scripts/manage-models-config.js add "nouveau-modele:7b"
```

Le script vous demandera interactivement :

- Nom d'affichage
- Description
- Type (medical/general)
- Paramètres (ex: 7B)
- Spécialités (séparées par des virgules)
- URLs GitHub et Website
- Notes

## 🔧 Modification Manuelle

Vous pouvez également éditer directement le fichier JSON :

```json
{
  "models": {
    "mon-modele:latest": {
      "displayName": "Mon Modèle Custom",
      "description": "Description personnalisée de mon modèle",
      "type": "general",
      "specialties": ["Ma spécialité", "Autre spécialité"],
      "parameters": "7B",
      "github": "https://github.com/mon-repo",
      "website": "https://mon-site.com",
      "notes": "Modèle personnalisé pour mes besoins",
      "metrics": {
        "accuracy": "90%",
        "speed": "Fast"
      }
    }
  }
}
```

## 🔄 Fonctionnement du Système

1. **Priorité Configuration** : L'API vérifie d'abord le fichier JSON
2. **Fallback Automatique** : Si un modèle n'est pas configuré, utilise la détection automatique
3. **Données Dynamiques** : Combine les métadonnées JSON avec les données en temps réel d'Ollama
4. **Synchronisation** : Le script permet de détecter les différences entre config et installation

## 📊 Champs Disponibles

### Obligatoires

- `displayName` : Nom affiché dans l'interface
- `description` : Description complète
- `type` : Type de modèle (`medical` ou `general`)

### Optionnels

- `specialties` : Array des spécialités
- `parameters` : Taille du modèle (ex: "7B")
- `github` : URL du repository GitHub
- `website` : URL du site web/HuggingFace
- `notes` : Notes personnalisées
- `metrics` : Métriques personnalisées (objet libre)
- `creator` : Créateur du modèle
- `license` : Licence du modèle

## 🎯 Avantages

- **Personnalisation** : Descriptions et métadonnées sur mesure
- **Maintenance** : Centralisation des informations modèles
- **Flexibilité** : Ajout de nouveaux champs selon les besoins
- **Automatisation** : Scripts pour la gestion
- **Validation** : Vérification de la cohérence

## 🔍 API Response

Avec la configuration JSON, l'API retourne :

```json
{
  "status": "connected",
  "configLoaded": true,
  "models": {
    "all": [...],
    "medical": [...],
    "general": [...]
  }
}
```

Le champ `configLoaded` indique si la configuration JSON a été chargée avec succès.

## 🎯 Système de Scoring v3.2.0

### Structure des données avec scores

```json
{
  "modelName": "example_model",
  "resultsSummary": {
    "smoke_test": {
      "testCount": 10,
      "lastScore": 85.5,
      "lastExecution": "2025-01-01T12:00:00Z"
    }
  },
  "scores": {
    "smoke_test": {
      "score": 8.5,
      "comment": "Excellent sur les tests rapides, quelques hésitations sur les cas complexes",
      "timestamp": "2025-01-01T12:30:00Z",
      "scoredBy": "user",
      "scoredAt": "2025-01-01T12:30:00Z"
    }
  },
  "history": [...]
}
```

### Interface de scoring

Les scores sont gérés directement dans l'onglet "Benchmarks" du modal de détail du modèle :

1. **Affichage** : Les scores existants apparaissent à côté du titre de chaque série
2. **Édition** : Clic sur l'icône d'édition pour modifier un score
3. **Ajout** : Bouton "Noter" pour ajouter un nouveau score
4. **Suppression** : Icône de suppression pour retirer un score

### API de gestion des scores

```typescript
// Ajouter/Modifier un score
PUT /api/models/[name]/benchmark
{
  "type": "scores",
  "scores": {
    "seriesId": {
      "score": 8.5,
      "comment": "Commentaire utilisateur"
    }
  }
}

// Supprimer un score
DELETE /api/models/[name]/benchmark
{
  "type": "scores",
  "seriesId": "smoke_test"
}
```

## 🚨 Notes Importantes

1. **Format JSON** : Respectez la syntaxe JSON (guillemets doubles, virgules)
2. **Encodage** : Utilisez UTF-8 pour les caractères spéciaux
3. **Sauvegarde** : Sauvegardez le fichier avant les modifications importantes
4. **Validation** : Utilisez `node scripts/manage-models-config.js validate` après modifications
5. **Redémarrage** : Les modifications sont prises en compte immédiatement (pas de redémarrage nécessaire)
6. **🆕 Scores** : Les scores sont automatiquement sauvegardés et persistés

## 📋 Exemple Complet

Voir le fichier `data/models-config.json` pour un exemple complet avec tous les modèles actuellement supportés.

#!/usr/bin/env node

/**
 * Script utilitaire pour gérer la configuration des modèles
 * Usage: node scripts/manage-models-config.js [command] [options]
 * 
 * Commandes disponibles:
 *   list                    - Afficher tous les modèles configurés
 *   add <model-name>        - Ajouter un nouveau modèle
 *   edit <model-name>       - Modifier un modèle existant
 *   remove <model-name>     - Supprimer un modèle
 *   validate                - Valider la configuration
 *   sync                    - Synchroniser avec les modèles Ollama installés
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'models-config.json');

// Interface pour les inputs utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Charger la configuration
function loadConfig() {
  try {
    const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('❌ Erreur lors du chargement de la configuration:', error.message);
    process.exit(1);
  }
}

// Sauvegarder la configuration
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    console.log('✅ Configuration sauvegardée');
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error.message);
    process.exit(1);
  }
}

// Afficher tous les modèles
function listModels() {
  const config = loadConfig();
  console.log('\n📋 Modèles configurés:\n');
  
  Object.entries(config.models).forEach(([name, info]) => {
    console.log(`🔸 ${name}`);
    console.log(`   Nom: ${info.displayName}`);
    console.log(`   Type: ${info.type}`);
    console.log(`   Paramètres: ${info.parameters}`);
    console.log(`   Description: ${info.description.substring(0, 80)}...`);
    console.log('');
  });
  
  console.log(`Total: ${Object.keys(config.models).length} modèles\n`);
}

// Ajouter un nouveau modèle
async function addModel(modelName) {
  const config = loadConfig();
  
  if (config.models[modelName]) {
    console.log(`❌ Le modèle ${modelName} existe déjà`);
    return;
  }
  
  console.log(`\n➕ Ajout du modèle: ${modelName}\n`);
  
  const displayName = await question('Nom d\'affichage: ');
  const description = await question('Description: ');
  const type = await question('Type (medical/general): ');
  const parameters = await question('Paramètres (ex: 7B): ');
  const specialtiesInput = await question('Spécialités (séparées par des virgules): ');
  const github = await question('GitHub URL (optionnel): ');
  const website = await question('Website URL (optionnel): ');
  const notes = await question('Notes (optionnel): ');
  
  const specialties = specialtiesInput ? specialtiesInput.split(',').map(s => s.trim()) : [];
  
  config.models[modelName] = {
    displayName,
    description,
    type,
    specialties,
    parameters,
    github: github || "",
    website: website || "",
    notes: notes || ""
  };
  
  // Mettre à jour la timestamp
  config.config.lastUpdated = new Date().toISOString();
  
  saveConfig(config);
  console.log(`✅ Modèle ${modelName} ajouté avec succès`);
}

// Modifier un modèle existant
async function editModel(modelName) {
  const config = loadConfig();
  
  if (!config.models[modelName]) {
    console.log(`❌ Le modèle ${modelName} n'existe pas`);
    return;
  }
  
  const model = config.models[modelName];
  console.log(`\n✏️  Modification du modèle: ${modelName}\n`);
  console.log('Laissez vide pour conserver la valeur actuelle\n');
  
  const displayName = await question(`Nom d'affichage [${model.displayName}]: `);
  const description = await question(`Description [${model.description.substring(0, 50)}...]: `);
  const type = await question(`Type [${model.type}]: `);
  const parameters = await question(`Paramètres [${model.parameters}]: `);
  const specialtiesInput = await question(`Spécialités [${model.specialties.join(', ')}]: `);
  const github = await question(`GitHub [${model.github}]: `);
  const website = await question(`Website [${model.website}]: `);
  const notes = await question(`Notes [${model.notes}]: `);
  
  // Mettre à jour seulement les champs modifiés
  if (displayName.trim()) model.displayName = displayName.trim();
  if (description.trim()) model.description = description.trim();
  if (type.trim()) model.type = type.trim();
  if (parameters.trim()) model.parameters = parameters.trim();
  if (specialtiesInput.trim()) model.specialties = specialtiesInput.split(',').map(s => s.trim());
  if (github.trim()) model.github = github.trim();
  if (website.trim()) model.website = website.trim();
  if (notes.trim()) model.notes = notes.trim();
  
  // Mettre à jour la timestamp
  config.config.lastUpdated = new Date().toISOString();
  
  saveConfig(config);
  console.log(`✅ Modèle ${modelName} modifié avec succès`);
}

// Supprimer un modèle
async function removeModel(modelName) {
  const config = loadConfig();
  
  if (!config.models[modelName]) {
    console.log(`❌ Le modèle ${modelName} n'existe pas`);
    return;
  }
  
  const confirm = await question(`❓ Êtes-vous sûr de vouloir supprimer ${modelName} ? (y/N): `);
  
  if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
    delete config.models[modelName];
    config.config.lastUpdated = new Date().toISOString();
    saveConfig(config);
    console.log(`✅ Modèle ${modelName} supprimé`);
  } else {
    console.log('❌ Suppression annulée');
  }
}

// Valider la configuration
function validateConfig() {
  const config = loadConfig();
  let errors = 0;
  
  console.log('\n🔍 Validation de la configuration...\n');
  
  // Vérifier la structure générale
  if (!config.models || !config.categories || !config.config) {
    console.log('❌ Structure de configuration invalide');
    errors++;
  }
  
  // Vérifier chaque modèle
  Object.entries(config.models).forEach(([name, model]) => {
    if (!model.displayName || !model.description || !model.type) {
      console.log(`❌ ${name}: Champs obligatoires manquants`);
      errors++;
    }
    
    if (!['medical', 'general'].includes(model.type)) {
      console.log(`❌ ${name}: Type invalide (${model.type})`);
      errors++;
    }
    
    if (!Array.isArray(model.specialties)) {
      console.log(`❌ ${name}: Spécialités doivent être un tableau`);
      errors++;
    }
  });
  
  if (errors === 0) {
    console.log('✅ Configuration valide');
  } else {
    console.log(`❌ ${errors} erreur(s) trouvée(s)`);
  }
}

// Synchroniser avec Ollama
async function syncWithOllama() {
  console.log('\n🔄 Synchronisation avec Ollama...\n');
  
  try {
    const response = await fetch('http://localhost:11436/api/tags');
    if (!response.ok) {
      throw new Error('Ollama non accessible');
    }
    
    const data = await response.json();
    const ollamaModels = data.models.map(m => m.name);
    
    const config = loadConfig();
    const configModels = Object.keys(config.models);
    
    console.log(`📊 Modèles Ollama: ${ollamaModels.length}`);
    console.log(`📊 Modèles configurés: ${configModels.length}\n`);
    
    // Modèles dans Ollama mais pas dans la config
    const missingInConfig = ollamaModels.filter(m => !configModels.includes(m));
    if (missingInConfig.length > 0) {
      console.log('🔸 Modèles Ollama non configurés:');
      missingInConfig.forEach(m => console.log(`   - ${m}`));
      console.log('');
    }
    
    // Modèles dans la config mais pas dans Ollama
    const missingInOllama = configModels.filter(m => !ollamaModels.includes(m));
    if (missingInOllama.length > 0) {
      console.log('🔸 Modèles configurés mais non installés:');
      missingInOllama.forEach(m => console.log(`   - ${m}`));
      console.log('');
    }
    
    if (missingInConfig.length === 0 && missingInOllama.length === 0) {
      console.log('✅ Configuration et Ollama synchronisés');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error.message);
  }
}

// Main
async function main() {
  const command = process.argv[2];
  const modelName = process.argv[3];
  
  try {
    switch (command) {
      case 'list':
        listModels();
        break;
      case 'add':
        if (!modelName) {
          console.log('❌ Nom du modèle requis: node manage-models-config.js add <model-name>');
          break;
        }
        await addModel(modelName);
        break;
      case 'edit':
        if (!modelName) {
          console.log('❌ Nom du modèle requis: node manage-models-config.js edit <model-name>');
          break;
        }
        await editModel(modelName);
        break;
      case 'remove':
        if (!modelName) {
          console.log('❌ Nom du modèle requis: node manage-models-config.js remove <model-name>');
          break;
        }
        await removeModel(modelName);
        break;
      case 'validate':
        validateConfig();
        break;
      case 'sync':
        await syncWithOllama();
        break;
      default:
        console.log(`
🛠️  Gestionnaire de configuration des modèles LLM

Usage: node scripts/manage-models-config.js [command] [options]

Commandes disponibles:
  list                    - Afficher tous les modèles configurés
  add <model-name>        - Ajouter un nouveau modèle
  edit <model-name>       - Modifier un modèle existant  
  remove <model-name>     - Supprimer un modèle
  validate                - Valider la configuration
  sync                    - Synchroniser avec les modèles Ollama installés

Exemples:
  node scripts/manage-models-config.js list
  node scripts/manage-models-config.js add "llama3:8b"
  node scripts/manage-models-config.js edit "meditron:latest"
  node scripts/manage-models-config.js sync
        `);
    }
  } finally {
    rl.close();
  }
}

main().catch(console.error);

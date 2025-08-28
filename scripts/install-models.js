#!/usr/bin/env node

/**
 * Script d'installation automatique des modèles LLM médicaux
 * Utilise l'API Ollama pour télécharger les modèles nécessaires
 */

const https = require('https')
const http = require('http')

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11436'

const MEDICAL_MODELS = [
  'llama3.2:3b',
  'phi3:mini', 
  'qwen2:7b',
  'gemma2:latest',
  'mistral:latest',
  'tinyllama:latest',
  'orca2:latest',
  'meditron:latest',
  'medllama2:latest',
  'cniongolo/biomistral:latest'
]

async function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    }

    if (data) {
      const jsonData = JSON.stringify(data)
      options.headers['Content-Length'] = Buffer.byteLength(jsonData)
    }

    const client = urlObj.protocol === 'https:' ? https : http
    const req = client.request(options, (res) => {
      let responseData = ''
      
      res.on('data', (chunk) => {
        responseData += chunk
      })
      
      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {}
          resolve({ status: res.statusCode, data: parsed })
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

async function checkOllamaHealth() {
  try {
    console.log('🔍 Vérification de la connexion Ollama...')
    const response = await makeRequest(`${OLLAMA_BASE_URL}/api/tags`)
    
    if (response.status === 200) {
      console.log('✅ Ollama est accessible')
      return true
    } else {
      console.log(`❌ Ollama non accessible (status: ${response.status})`)
      return false
    }
  } catch (error) {
    console.log(`❌ Erreur de connexion Ollama: ${error.message}`)
    return false
  }
}

async function getInstalledModels() {
  try {
    const response = await makeRequest(`${OLLAMA_BASE_URL}/api/tags`)
    if (response.status === 200 && response.data.models) {
      return response.data.models.map(model => model.name)
    }
    return []
  } catch (error) {
    console.log(`❌ Erreur lors de la récupération des modèles: ${error.message}`)
    return []
  }
}

async function installModel(modelName) {
  try {
    console.log(`📦 Installation de ${modelName}...`)
    
    const response = await makeRequest(`${OLLAMA_BASE_URL}/api/pull`, 'POST', {
      name: modelName,
      stream: false
    })

    if (response.status === 200) {
      console.log(`✅ ${modelName} installé avec succès`)
      return true
    } else {
      console.log(`❌ Échec de l'installation de ${modelName} (status: ${response.status})`)
      return false
    }
  } catch (error) {
    console.log(`❌ Erreur lors de l'installation de ${modelName}: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🚀 Installation des modèles LLM médicaux')
  console.log('==========================================')
  
  // Vérifier la connexion Ollama
  const isHealthy = await checkOllamaHealth()
  if (!isHealthy) {
    console.log('\n❌ Impossible de se connecter à Ollama.')
    console.log('Assurez-vous que Docker Compose est démarré:')
    console.log('  docker-compose up -d')
    process.exit(1)
  }

  // Récupérer les modèles déjà installés
  console.log('\n🔍 Vérification des modèles installés...')
  const installedModels = await getInstalledModels()
  console.log(`📊 ${installedModels.length} modèle(s) déjà installé(s)`)

  // Déterminer les modèles à installer
  const modelsToInstall = MEDICAL_MODELS.filter(model => {
    const isInstalled = installedModels.some(installed => 
      installed === model || installed.startsWith(model.split(':')[0])
    )
    return !isInstalled
  })

  if (modelsToInstall.length === 0) {
    console.log('\n✅ Tous les modèles sont déjà installés!')
    process.exit(0)
  }

  console.log(`\n📋 ${modelsToInstall.length} modèle(s) à installer:`)
  modelsToInstall.forEach(model => console.log(`  - ${model}`))

  // Installation des modèles
  console.log('\n⚡ Début de l\'installation...')
  let successCount = 0
  let failedModels = []

  for (const model of modelsToInstall) {
    const success = await installModel(model)
    if (success) {
      successCount++
    } else {
      failedModels.push(model)
    }
  }

  // Résumé
  console.log('\n📊 RÉSUMÉ DE L\'INSTALLATION')
  console.log('============================')
  console.log(`✅ Modèles installés avec succès: ${successCount}/${modelsToInstall.length}`)
  
  if (failedModels.length > 0) {
    console.log(`❌ Modèles en échec: ${failedModels.length}`)
    failedModels.forEach(model => console.log(`  - ${model}`))
    console.log('\n💡 Conseils pour les échecs:')
    console.log('  - Vérifiez votre connexion internet')
    console.log('  - Certains modèles peuvent être indisponibles')
    console.log('  - Relancez le script plus tard')
  }

  console.log('\n🎉 Installation terminée!')
  console.log('Vous pouvez maintenant utiliser la plateforme d\'analyse IA.')
}

// Gestion des signaux pour une sortie propre
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Installation interrompue par l\'utilisateur')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Installation interrompue')
  process.exit(0)
})

// Lancement du script
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Erreur critique:', error.message)
    process.exit(1)
  })
}

module.exports = { main, checkOllamaHealth, installModel }

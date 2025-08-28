#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const BENCHMARK_DIR = path.join(process.cwd(), 'benchmark_results')
const HISTORY_FILE = path.join(BENCHMARK_DIR, 'history.json')
const BACKUP_DIR = path.join(BENCHMARK_DIR, 'backup')

console.log('🧹 Nettoyage des fichiers de benchmark corrompus...')

// Créer le dossier de sauvegarde
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

// Fonction pour extraire les benchmarks valides d'une structure imbriquée
function extractValidBenchmarks(data, visited = new Set()) {
  const results = []
  
  if (!data || typeof data !== 'object') {
    return results
  }
  
  // Vérifier si c'est un benchmark valide (a un id, timestamp, etc.)
  if (data.id && data.timestamp && !visited.has(data.id)) {
    visited.add(data.id)
    
    // Recalculer les statistiques à partir des résultats
    const results_data = data.results || {}
    const models_tested = Object.keys(results_data).length
    let questions_tested = 0
    let total_tests = 0
    let successful_tests = 0
    let failed_tests = 0
    let timeout_tests = 0
    let total_response_time = 0
    
    // Calculer les statistiques à partir des résultats
    Object.values(results_data).forEach((modelData) => {
      if (modelData && typeof modelData === 'object') {
        const questions = modelData.questions || {}
        const questionCount = Object.keys(questions).length
        
        if (questionCount > questions_tested) {
          questions_tested = questionCount
        }
        
        Object.values(questions).forEach((question) => {
          total_tests++
          if (question && typeof question === 'object') {
            if (question.success) {
              successful_tests++
            } else {
              failed_tests++
            }
            
            if (question.isTimeout) {
              timeout_tests++
            }
            
            if (question.responseTime) {
              total_response_time += question.responseTime
            }
          }
        })
      }
    })
    
    const average_response_time = total_tests > 0 ? total_response_time / total_tests : 0
    
    results.push({
      id: data.id,
      timestamp: data.timestamp,
      benchmark_id: data.benchmark_id || data.id,
      models_tested: models_tested,
      questions_tested: questions_tested,
      results: data.results || {},
      summary: {
        total_tests: total_tests,
        successful_tests: successful_tests,
        failed_tests: failed_tests,
        timeout_tests: timeout_tests,
        average_response_time: average_response_time,
        total_duration: total_response_time
      },
      ratings: data.ratings || {},
      comments: data.comments || {}
    })
  }
  
  // Rechercher récursivement dans les propriétés 'benchmarks'
  if (data.benchmarks && Array.isArray(data.benchmarks)) {
    for (const item of data.benchmarks) {
      results.push(...extractValidBenchmarks(item, visited))
    }
  }
  
  return results
}

// Sauvegarder l'historique actuel
if (fs.existsSync(HISTORY_FILE)) {
  const backupFile = path.join(BACKUP_DIR, `history_backup_${Date.now()}.json`)
  fs.copyFileSync(HISTORY_FILE, backupFile)
  console.log(`📋 Sauvegarde créée: ${backupFile}`)
}

// Charger et nettoyer l'historique
let cleanedBenchmarks = []

try {
  if (fs.existsSync(HISTORY_FILE)) {
    const rawData = fs.readFileSync(HISTORY_FILE, 'utf-8')
    const data = JSON.parse(rawData)
    
    console.log('📖 Extraction des benchmarks valides...')
    cleanedBenchmarks = extractValidBenchmarks(data)
    
    console.log(`✅ ${cleanedBenchmarks.length} benchmarks valides trouvés`)
  }
} catch (error) {
  console.error('❌ Erreur lors du chargement de l\'historique:', error.message)
}

// Nettoyer aussi les fichiers individuels
const files = fs.readdirSync(BENCHMARK_DIR).filter(f => f.startsWith('benchmark_') && f.endsWith('.json'))

for (const file of files) {
  const filePath = path.join(BENCHMARK_DIR, file)
  const backupPath = path.join(BACKUP_DIR, file)
  
  try {
    // Sauvegarder le fichier original
    fs.copyFileSync(filePath, backupPath)
    
    // Charger et nettoyer le fichier
    const rawData = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(rawData)
    
    const validBenchmarks = extractValidBenchmarks(data)
    
    if (validBenchmarks.length === 1) {
      // Sauvegarder seulement le benchmark valide
      fs.writeFileSync(filePath, JSON.stringify(validBenchmarks[0], null, 2))
      console.log(`🔧 Nettoyé: ${file}`)
    } else if (validBenchmarks.length > 1) {
      console.log(`⚠️  Fichier ${file} contient plusieurs benchmarks, suppression...`)
      fs.unlinkSync(filePath)
      
      // Ajouter les benchmarks à l'historique nettoyé
      for (const benchmark of validBenchmarks) {
        if (!cleanedBenchmarks.find(b => b.id === benchmark.id)) {
          cleanedBenchmarks.push(benchmark)
        }
      }
    } else {
      console.log(`❌ Fichier ${file} ne contient aucun benchmark valide, suppression...`)
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error(`❌ Erreur lors du traitement de ${file}:`, error.message)
    fs.unlinkSync(filePath) // Supprimer le fichier corrompu
  }
}

// Trier les benchmarks par date (plus récent en premier)
cleanedBenchmarks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

// Supprimer les doublons par ID
const uniqueBenchmarks = []
const seenIds = new Set()

for (const benchmark of cleanedBenchmarks) {
  if (!seenIds.has(benchmark.id)) {
    seenIds.add(benchmark.id)
    uniqueBenchmarks.push(benchmark)
  }
}

// Sauvegarder l'historique nettoyé
const cleanedHistory = {
  benchmarks: uniqueBenchmarks
}

fs.writeFileSync(HISTORY_FILE, JSON.stringify(cleanedHistory, null, 2))

console.log(`✅ Historique nettoyé sauvegardé avec ${uniqueBenchmarks.length} benchmarks`)
console.log('🎉 Nettoyage terminé!')

// Afficher un résumé
console.log('\n📊 Résumé:')
console.log(`- Benchmarks valides: ${uniqueBenchmarks.length}`)
console.log(`- Fichiers de sauvegarde: ${BACKUP_DIR}`)
console.log(`- Historique nettoyé: ${HISTORY_FILE}`)

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const BENCHMARK_DIR = path.join(process.cwd(), 'benchmark_results')
const HISTORY_FILE = path.join(BENCHMARK_DIR, 'history.json')

// Assurer que le répertoire existe
function ensureBenchmarkDir() {
  if (!fs.existsSync(BENCHMARK_DIR)) {
    fs.mkdirSync(BENCHMARK_DIR, { recursive: true })
  }
}

// Charger l'historique des benchmarks
function loadBenchmarkHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf-8')
      const parsed = JSON.parse(data)
      
      // Validation et nettoyage de la structure
      if (!parsed || typeof parsed !== 'object') {
        console.warn('Structure d\'historique invalide, création d\'un nouvel historique')
        return { benchmarks: [] }
      }
      
      // S'assurer que benchmarks est un tableau
      if (!Array.isArray(parsed.benchmarks)) {
        console.warn('Format benchmarks invalide, création d\'un nouveau tableau')
        return { benchmarks: [] }
      }
      
      // Nettoyer les éventuelles structures imbriquées
      const cleanBenchmarks = parsed.benchmarks.filter((benchmark: any) => {
        return benchmark && 
               typeof benchmark === 'object' && 
               benchmark.id && 
               benchmark.timestamp &&
               !Array.isArray(benchmark.benchmarks) // Éviter les structures imbriquées
      })
      
      if (cleanBenchmarks.length !== parsed.benchmarks.length) {
        console.warn(`Nettoyage automatique: ${parsed.benchmarks.length - cleanBenchmarks.length} entrées corrompues supprimées`)
      }
      
      return { benchmarks: cleanBenchmarks }
    }
    return { benchmarks: [] }
  } catch (error) {
    console.error('Erreur lors du chargement de l\'historique:', error)
    return { benchmarks: [] }
  }
}

// Sauvegarder l'historique des benchmarks
function saveBenchmarkHistory(data: any) {
  try {
    ensureBenchmarkDir()
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    return false
  }
}

export async function GET() {
  try {
    const history = loadBenchmarkHistory()
    
    // Trier par date (plus récent en premier)
    history.benchmarks.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    // Adapter le format pour la compatibilité avec BenchmarkHistory.tsx
    const adaptedBenchmarks = history.benchmarks.map((benchmark: any) => {
      // Si c'est déjà un nouveau format modulaire avec suite
      if (benchmark.suite) {
        return {
          id: benchmark.id,
          benchmark_id: benchmark.id,
          timestamp: benchmark.timestamp,
          suite_name: benchmark.suite.name,
          models_tested: benchmark.models?.length || Object.keys(benchmark.results || {}).length,
          questions_tested: benchmark.summary?.totalTests || 0,
          results: adaptModularResults(benchmark.results),
          summary: {
            total_tests: benchmark.summary?.totalTests || 0,
            successful_tests: benchmark.summary?.completedTests || 0,
            failed_tests: benchmark.summary?.failedTests || 0,
            timeout_tests: 0,
            average_response_time: calculateAverageResponseTime(benchmark.results),
            total_duration: calculateTotalDuration(benchmark)
          },
          ratings: benchmark.ratings || {},
          comments: benchmark.comments || {}
        }
      }
      
      // Retourner tel quel pour les anciens formats déjà compatibles
      return benchmark
    })

    return NextResponse.json({ benchmarks: adaptedBenchmarks })
  } catch (error) {
    console.error('Erreur API benchmark history:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement de l\'historique' },
      { status: 500 }
    )
  }
}

// Fonction pour adapter les résultats modulaires au format attendu par l'interface
function adaptModularResults(modularResults: any[]): any {
  if (!Array.isArray(modularResults)) {
    return {}
  }

  const adapted: any = {}
  
  modularResults.forEach((result: any) => {
    const modelName = result.modelName
    if (!adapted[modelName]) {
      adapted[modelName] = {
        questions: {},
        total_response_time: 0,
        average_response_time: 0,
        average_tokens_per_second: 0,
        success_rate: 0
      }
    }

    adapted[modelName].questions[result.questionId] = {
      success: result.response.error ? false : true,
      response: result.response.response,
      responseTime: result.response.responseTime,
      tokensGenerated: result.response.tokenCount || 0,
      tokensPerSecond: result.response.tokenCount && result.response.responseTime 
        ? (result.response.tokenCount / (result.response.responseTime / 1000)) 
        : 0,
      question: result.question?.text || result.questionId,
      category: result.question?.category || 'unknown',
      difficulty: result.question?.difficulty || 'medium',
      service_url: 'http://localhost:11436', // Par défaut
      isTimeout: result.response.responseTime > 30000,
      user_rating: 0,
      user_comment: '',
      last_updated: result.evaluatedAt || new Date().toISOString()
    }
  })

  // Calculer les métriques globales pour chaque modèle
  Object.keys(adapted).forEach(modelName => {
    const questions = adapted[modelName].questions
    const questionValues = Object.values(questions) as any[]
    
    adapted[modelName].total_response_time = questionValues.reduce((sum, q) => sum + q.responseTime, 0)
    adapted[modelName].average_response_time = questionValues.length > 0 
      ? adapted[modelName].total_response_time / questionValues.length 
      : 0
    adapted[modelName].average_tokens_per_second = questionValues.length > 0
      ? questionValues.reduce((sum, q) => sum + q.tokensPerSecond, 0) / questionValues.length
      : 0
    adapted[modelName].success_rate = questionValues.length > 0
      ? (questionValues.filter(q => q.success).length / questionValues.length) * 100
      : 0
  })

  return adapted
}

// Calculer le temps de réponse moyen
function calculateAverageResponseTime(results: any[]): number {
  if (!Array.isArray(results) || results.length === 0) {
    return 0
  }
  
  const totalTime = results.reduce((sum, result) => {
    return sum + (result.response?.responseTime || 0)
  }, 0)
  
  return totalTime / results.length
}

// Calculer la durée totale
function calculateTotalDuration(benchmark: any): number {
  if (benchmark.completedAt && benchmark.startedAt) {
    return new Date(benchmark.completedAt).getTime() - new Date(benchmark.startedAt).getTime()
  }
  return 0
}

export async function POST(request: NextRequest) {
  try {
    const benchmarkResult = await request.json()
    
    // Ajouter un ID unique et timestamp
    const enrichedResult = {
      ...benchmarkResult,
      id: `benchmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ratings: benchmarkResult.ratings || {},
      comments: benchmarkResult.comments || {}
    }

    const history = loadBenchmarkHistory()
    
    // Vérifier que l'historique a la bonne structure
    if (!history.benchmarks) {
      history.benchmarks = []
    }
    
    // Ajouter uniquement le résultat du benchmark, pas l'historique entier
    history.benchmarks.unshift(enrichedResult)

    // Limiter à 1000 benchmarks pour éviter les fichiers trop volumineux
    if (history.benchmarks.length > 1000) {
      history.benchmarks = history.benchmarks.slice(0, 1000)
    }

    const saved = saveBenchmarkHistory(history)
    
    if (!saved) {
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde' },
        { status: 500 }
      )
    }

    // Sauvegarder seulement le résultat du benchmark individuel (pas l'historique entier)
    const detailFile = path.join(BENCHMARK_DIR, `${enrichedResult.id}.json`)
    try {
      fs.writeFileSync(detailFile, JSON.stringify(enrichedResult, null, 2))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du fichier détaillé:', error)
      // Ne pas faire échouer la requête si c'est juste le fichier détaillé qui pose problème
    }

    return NextResponse.json({ 
      success: true, 
      benchmark: enrichedResult 
    })
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du benchmark:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde du benchmark' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { benchmarkId } = await request.json()
    
    if (!benchmarkId) {
      return NextResponse.json(
        { error: 'ID de benchmark requis' },
        { status: 400 }
      )
    }

    const history = loadBenchmarkHistory()
    const benchmarkIndex = history.benchmarks.findIndex(
      (b: any) => b.id === benchmarkId || b.benchmark_id === benchmarkId
    )
    
    if (benchmarkIndex === -1) {
      return NextResponse.json(
        { error: 'Benchmark non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer le benchmark de l'historique
    history.benchmarks.splice(benchmarkIndex, 1)
    
    const saved = saveBenchmarkHistory(history)
    
    if (!saved) {
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    // Supprimer aussi le fichier détaillé
    const detailFile = path.join(BENCHMARK_DIR, `${benchmarkId}.json`)
    if (fs.existsSync(detailFile)) {
      fs.unlinkSync(detailFile)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression du benchmark:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du benchmark' },
      { status: 500 }
    )
  }
}

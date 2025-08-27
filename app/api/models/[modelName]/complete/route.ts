import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const BENCHMARK_DIR = path.join(process.cwd(), 'benchmark_results')
const HISTORY_FILE = path.join(BENCHMARK_DIR, 'history.json')

interface ModelCompleteData {
  // Informations statiques
  name: string
  displayName: string
  description?: string
  type: 'medical' | 'general'
  size: number
  sizeFormatted: string
  parameters: string
  hasNative: boolean
  services: any[]
  github?: string
  website?: string
  
  // Statistiques de performance
  totalTests: number
  successfulTests: number
  avgResponseTime: number
  avgTokensPerSecond: number
  successRate: number
  avgUserRating: number
  totalRatings: number
  
  // Données temporelles
  lastTested: string
  firstTested: string
  totalBenchmarks: number
  
  // Historique des tests
  benchmarkHistory: BenchmarkResult[]
  
  // Commentaires et notes
  globalComment: string
  
  // Catégories de tests
  categories: { [key: string]: number }
  
  // Évolution des performances
  performanceHistory: PerformancePoint[]
}

interface BenchmarkResult {
  benchmarkId: string
  timestamp: string
  category: string
  questionId: string
  question: string
  response: string
  success: boolean
  responseTime: number
  tokensGenerated: number
  tokensPerSecond: number
  userRating?: number
  userComment?: string
  error?: string
}

interface PerformancePoint {
  date: string
  avgResponseTime: number
  avgTokensPerSecond: number
  successRate: number
  avgRating: number
}

async function loadModels(): Promise<any[]> {
  try {
    // Charger depuis le même endpoint que les autres composants
    const fs = require('fs')
    const path = require('path')
    
    // Importer les fonctions depuis l'API models existante
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)
    
    try {
      const { stdout } = await execAsync('ollama list')
      const lines = stdout.trim().split('\n').slice(1) // Skip header
      
      const models = lines.map((line: string) => {
        const parts = line.trim().split(/\s+/)
        if (parts.length < 3) return null
        
        const name = parts[0]
        const size = parseInt(parts[2]) || 0
        
        return {
          name,
          displayName: name,
          size,
          sizeFormatted: parts[2] || 'N/A',
          type: 'general',
          hasNative: false,
          services: []
        }
      }).filter(Boolean)
      
      return models
    } catch (error) {
      console.error('Erreur lors du chargement des modèles Ollama:', error)
      return []
    }
  } catch (error) {
    console.error('Erreur lors du chargement des modèles:', error)
    return []
  }
}

function loadBenchmarkHistory(): any {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf-8')
      return JSON.parse(data)
    }
    return { benchmarks: [] }
  } catch (error) {
    console.error('Erreur lors du chargement de l\'historique:', error)
    return { benchmarks: [] }
  }
}

function calculateModelStats(modelName: string, benchmarks: any[]): {
  totalTests: number
  successfulTests: number
  avgResponseTime: number
  avgTokensPerSecond: number
  avgUserRating: number
  totalRatings: number
  categories: { [key: string]: number }
  firstTested: string
  lastTested: string
  totalBenchmarks: number
} {
  const stats = {
    totalTests: 0,
    successfulTests: 0,
    avgResponseTime: 0,
    avgTokensPerSecond: 0,
    avgUserRating: 0,
    totalRatings: 0,
    categories: {} as { [key: string]: number },
    firstTested: '',
    lastTested: '',
    totalBenchmarks: 0
  }

  const benchmarksWithModel = benchmarks.filter(benchmark => 
    benchmark.results && benchmark.results[modelName]
  )

  stats.totalBenchmarks = benchmarksWithModel.length

  if (benchmarksWithModel.length === 0) {
    return stats
  }

  // Trier par date pour obtenir premier et dernier test
  const sortedBenchmarks = benchmarksWithModel.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
  
  stats.firstTested = sortedBenchmarks[0].timestamp
  stats.lastTested = sortedBenchmarks[sortedBenchmarks.length - 1].timestamp

  let totalResponseTime = 0
  let totalTokensPerSecond = 0
  let totalRating = 0
  let successfulCount = 0
  let tokensCount = 0

  benchmarksWithModel.forEach(benchmark => {
    const modelData = benchmark.results[modelName]
    const questions = modelData.questions || {}

    Object.entries(questions).forEach(([questionId, questionData]: [string, any]) => {
      stats.totalTests++

      if (questionData.success) {
        stats.successfulTests++
        successfulCount++
        
        if (questionData.responseTime) {
          totalResponseTime += questionData.responseTime
        }
        
        if (questionData.tokensPerSecond) {
          totalTokensPerSecond += questionData.tokensPerSecond
          tokensCount++
        }
      }

      if (questionData.user_rating && questionData.user_rating > 0) {
        totalRating += questionData.user_rating
        stats.totalRatings++
      }

      // Catégories
      const category = questionData.category || 'unknown'
      stats.categories[category] = (stats.categories[category] || 0) + 1
    })
  })

  // Calculer les moyennes
  if (successfulCount > 0) {
    stats.avgResponseTime = totalResponseTime / successfulCount
  }
  
  if (tokensCount > 0) {
    stats.avgTokensPerSecond = totalTokensPerSecond / tokensCount
  }
  
  if (stats.totalRatings > 0) {
    stats.avgUserRating = totalRating / stats.totalRatings
  }

  return stats
}

function getBenchmarkHistory(modelName: string, benchmarks: any[]): BenchmarkResult[] {
  const history: BenchmarkResult[] = []

  benchmarks.forEach(benchmark => {
    if (!benchmark.results || !benchmark.results[modelName]) return

    const modelData = benchmark.results[modelName]
    const questions = modelData.questions || {}

    Object.entries(questions).forEach(([questionId, questionData]: [string, any]) => {
      history.push({
        benchmarkId: benchmark.id || benchmark.benchmark_id,
        timestamp: benchmark.timestamp,
        category: questionData.category || 'unknown',
        questionId,
        question: questionData.question || '',
        response: questionData.response || '',
        success: questionData.success || false,
        responseTime: questionData.responseTime || 0,
        tokensGenerated: questionData.tokensGenerated || 0,
        tokensPerSecond: questionData.tokensPerSecond || 0,
        userRating: questionData.user_rating,
        userComment: questionData.user_comment,
        error: questionData.error
      })
    })
  })

  return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

function getPerformanceHistory(modelName: string, benchmarks: any[]): PerformancePoint[] {
  const performanceMap = new Map<string, {
    tests: number
    successfulTests: number
    totalResponseTime: number
    totalTokensPerSecond: number
    totalRating: number
    ratingCount: number
  }>()

  benchmarks.forEach(benchmark => {
    if (!benchmark.results || !benchmark.results[modelName]) return

    const date = new Date(benchmark.timestamp).toISOString().split('T')[0] // YYYY-MM-DD
    const modelData = benchmark.results[modelName]
    const questions = modelData.questions || {}

    if (!performanceMap.has(date)) {
      performanceMap.set(date, {
        tests: 0,
        successfulTests: 0,
        totalResponseTime: 0,
        totalTokensPerSecond: 0,
        totalRating: 0,
        ratingCount: 0
      })
    }

    const dayStats = performanceMap.get(date)!

    Object.values(questions).forEach((questionData: any) => {
      dayStats.tests++
      
      if (questionData.success) {
        dayStats.successfulTests++
        dayStats.totalResponseTime += questionData.responseTime || 0
        dayStats.totalTokensPerSecond += questionData.tokensPerSecond || 0
      }

      if (questionData.user_rating && questionData.user_rating > 0) {
        dayStats.totalRating += questionData.user_rating
        dayStats.ratingCount++
      }
    })
  })

  return Array.from(performanceMap.entries())
    .map(([date, stats]) => ({
      date,
      avgResponseTime: stats.successfulTests > 0 ? stats.totalResponseTime / stats.successfulTests : 0,
      avgTokensPerSecond: stats.successfulTests > 0 ? stats.totalTokensPerSecond / stats.successfulTests : 0,
      successRate: stats.tests > 0 ? (stats.successfulTests / stats.tests) * 100 : 0,
      avgRating: stats.ratingCount > 0 ? stats.totalRating / stats.ratingCount : 0
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export async function GET(
  request: NextRequest,
  { params }: { params: { modelName: string } }
) {
  try {
    const modelName = decodeURIComponent(params.modelName)
    
    // Charger les données statiques des modèles
    const models = await loadModels()
    const modelInfo = models.find(m => m.name === modelName)
    
    if (!modelInfo) {
      return NextResponse.json(
        { error: 'Modèle non trouvé' },
        { status: 404 }
      )
    }
    
    // Charger l'historique des benchmarks
    const historyData = loadBenchmarkHistory()
    const benchmarks = historyData.benchmarks || []
    
    // Calculer les statistiques
    const stats = calculateModelStats(modelName, benchmarks)
    
    // Récupérer l'historique des tests
    const benchmarkHistory = getBenchmarkHistory(modelName, benchmarks)
    
    // Récupérer l'évolution des performances
    const performanceHistory = getPerformanceHistory(modelName, benchmarks)
    
    const completeData: ModelCompleteData = {
      // Informations statiques
      name: modelInfo.name,
      displayName: modelInfo.displayName || modelInfo.name,
      description: modelInfo.description,
      type: modelInfo.type || 'general',
      size: modelInfo.size || 0,
      sizeFormatted: modelInfo.sizeFormatted || 'N/A',
      parameters: modelInfo.parameters || 'N/A',
      hasNative: modelInfo.hasNative || false,
      services: modelInfo.services || [],
      github: modelInfo.github,
      website: modelInfo.website,
      
      // Statistiques de performance
      totalTests: stats.totalTests,
      successfulTests: stats.successfulTests,
      avgResponseTime: stats.avgResponseTime,
      avgTokensPerSecond: stats.avgTokensPerSecond,
      successRate: stats.totalTests > 0 ? (stats.successfulTests / stats.totalTests) * 100 : 0,
      avgUserRating: stats.avgUserRating,
      totalRatings: stats.totalRatings,
      
      // Données temporelles
      lastTested: stats.lastTested,
      firstTested: stats.firstTested,
      totalBenchmarks: stats.totalBenchmarks,
      
      // Historique des tests
      benchmarkHistory,
      
      // Commentaires et notes (vide côté serveur, géré par le client)
      globalComment: '',
      
      // Catégories de tests
      categories: stats.categories,
      
      // Évolution des performances
      performanceHistory
    }
    
    return NextResponse.json({
      success: true,
      data: completeData
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des données complètes du modèle:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { modelName: string } }
) {
  try {
    const modelName = decodeURIComponent(params.modelName)
    const { globalComment } = await request.json()
    
    // Pour l'instant, on retourne simplement success
    // Le commentaire sera géré côté client via localStorage
    // TODO: Intégrer avec une base de données si nécessaire
    
    return NextResponse.json({
      success: true,
      message: 'Commentaire global mis à jour'
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du commentaire:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

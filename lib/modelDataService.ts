// Note: Ce service est conçu pour fonctionner côté serveur uniquement
// Pour le côté client, nous utiliserons l'API

import fs from 'fs'

// Définir le chemin du fichier d'historique des benchmarks
const HISTORY_FILE = './data/benchmarkHistory.json'

export interface ModelCompleteData {
  // Informations statiques
  name: string
  displayName: string
  description?: string
  type: 'medical' | 'general' | 'rapide'
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

export interface BenchmarkResult {
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

export interface PerformancePoint {
  date: string
  avgResponseTime: number
  avgTokensPerSecond: number
  successRate: number
  avgRating: number
}

class ModelDataService {
  private static instance: ModelDataService
  private modelsCache: any[] = []
  private benchmarksCache: any[] = []
  private lastCacheUpdate = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): ModelDataService {
    if (!ModelDataService.instance) {
      ModelDataService.instance = new ModelDataService()
    }
    return ModelDataService.instance
  }

  private async loadModels(): Promise<any[]> {
    try {
      const response = await fetch('http://localhost:3000/api/models')
      if (response.ok) {
        const data = await response.json()
        return data.models?.all || []
      }
    } catch (error) {
      console.error('Erreur lors du chargement des modèles:', error)
    }
    return []
  }

  private loadBenchmarkHistory(): any {
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

  private async updateCache(): Promise<void> {
    const now = Date.now()
    if (now - this.lastCacheUpdate < this.CACHE_DURATION) {
      return // Cache encore valide
    }

    this.modelsCache = await this.loadModels()
    const historyData = this.loadBenchmarkHistory()
    this.benchmarksCache = historyData.benchmarks || []
    this.lastCacheUpdate = now
  }

  private getGlobalComments(): { [key: string]: string } {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('globalModelComments')
      return saved ? JSON.parse(saved) : {}
    }
    return {}
  }

  private calculateModelStats(modelName: string): {
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

    const benchmarksWithModel = this.benchmarksCache.filter(benchmark => 
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

  private getBenchmarkHistory(modelName: string): BenchmarkResult[] {
    const history: BenchmarkResult[] = []

    this.benchmarksCache.forEach(benchmark => {
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

  private getPerformanceHistory(modelName: string): PerformancePoint[] {
    const performanceMap = new Map<string, {
      tests: number
      successfulTests: number
      totalResponseTime: number
      totalTokensPerSecond: number
      totalRating: number
      ratingCount: number
    }>()

    this.benchmarksCache.forEach(benchmark => {
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

  async getModelCompleteData(modelName: string): Promise<ModelCompleteData | null> {
    await this.updateCache()

    // Trouver le modèle dans les infos statiques
    const modelInfo = this.modelsCache.find(m => m.name === modelName)
    if (!modelInfo) {
      return null
    }

    // Calculer les statistiques
    const stats = this.calculateModelStats(modelName)
    
    // Récupérer l'historique
    const benchmarkHistory = this.getBenchmarkHistory(modelName)
    
    // Récupérer l'évolution des performances
    const performanceHistory = this.getPerformanceHistory(modelName)
    
    // Récupérer les commentaires globaux
    const globalComments = this.getGlobalComments()

    return {
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
      
      // Commentaires et notes
      globalComment: globalComments[modelName] || '',
      
      // Catégories de tests
      categories: stats.categories,
      
      // Évolution des performances
      performanceHistory
    }
  }

  async getAllModelsBasicData(): Promise<Partial<ModelCompleteData>[]> {
    await this.updateCache()
    
    return this.modelsCache.map(model => {
      const stats = this.calculateModelStats(model.name)
      return {
        name: model.name,
        displayName: model.displayName || model.name,
        type: model.type || 'general',
        hasNative: model.hasNative || false,
        totalTests: stats.totalTests,
        successRate: stats.totalTests > 0 ? (stats.successfulTests / stats.totalTests) * 100 : 0,
        avgUserRating: stats.avgUserRating,
        lastTested: stats.lastTested
      }
    })
  }

  // Méthode pour invalider le cache (après un nouveau benchmark)
  invalidateCache(): void {
    this.lastCacheUpdate = 0
  }
}

export default ModelDataService

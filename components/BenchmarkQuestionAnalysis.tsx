'use client'

import { useState, useMemo } from 'react'
import { Trophy, Clock, Zap, Target, TrendingUp, BarChart3, Medal, Star } from 'lucide-react'

interface BenchmarkQuestionAnalysisProps {
  benchmarks: any[]
}

interface QuestionStats {
  questionId: string
  questionText: string
  category: string
  difficulty: string
  totalTests: number
  successRate: number
  averageTime: number
  averageTokensPerSecond: number
  modelResults: {
    modelName: string
    success: boolean
    responseTime: number
    tokensPerSecond: number
    rating?: number
    response?: string
  }[]
}

export default function BenchmarkQuestionAnalysis({ benchmarks }: BenchmarkQuestionAnalysisProps) {
  const [sortBy, setSortBy] = useState<'difficulty' | 'success_rate' | 'speed' | 'rating'>('difficulty')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Agrégation des données par question
  const questionStats = useMemo(() => {
    const stats: { [questionId: string]: QuestionStats } = {}

    benchmarks.forEach(benchmark => {
      Object.entries(benchmark.results || {}).forEach(([modelName, modelData]: [string, any]) => {
        Object.entries(modelData.questions || {}).forEach(([questionId, test]: [string, any]) => {
          if (!stats[questionId]) {
            stats[questionId] = {
              questionId,
              questionText: test.question || 'Question non disponible',
              category: test.category || 'general',
              difficulty: test.difficulty || 'medium',
              totalTests: 0,
              successRate: 0,
              averageTime: 0,
              averageTokensPerSecond: 0,
              modelResults: []
            }
          }

          stats[questionId].modelResults.push({
            modelName,
            success: test.success,
            responseTime: test.responseTime || 0,
            tokensPerSecond: test.tokensPerSecond || 0,
            rating: test.user_rating,
            response: test.response
          })
        })
      })
    })

    // Calculer les statistiques agrégées
    Object.values(stats).forEach(stat => {
      stat.totalTests = stat.modelResults.length
      stat.successRate = (stat.modelResults.filter(r => r.success).length / stat.totalTests) * 100
      stat.averageTime = stat.modelResults.reduce((sum, r) => sum + r.responseTime, 0) / stat.totalTests
      stat.averageTokensPerSecond = stat.modelResults.reduce((sum, r) => sum + r.tokensPerSecond, 0) / stat.totalTests
    })

    return Object.values(stats)
  }, [benchmarks])

  const getTestName = (questionId: string) => {
    switch (questionId) {
      case 'basic_1': return 'Test de fonctionnement de l\'IA'
      case 'basic_2': return 'Test de communication en français'
      case 'medical_1': return 'Symptômes hypertension artérielle'
      case 'medical_2': return 'Mécanisme inhibiteurs ECA'
      case 'medical_3': return 'Étapes de la glycolyse'
      case 'general_1': return 'Causes réchauffement climatique'
      case 'general_2': return 'Concept intelligence artificielle'
      case 'coding_1': return 'Fonction Fibonacci Python'
      case 'reasoning_1': return 'Test de raisonnement logique'
      default: return questionId
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic': return 'bg-green-100 text-green-800 border-green-200'
      case 'medical': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'general': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'coding': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'reasoning': return 'bg-teal-100 text-teal-800 border-teal-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getBestPerformers = (questionStat: QuestionStats) => {
    const successfulResults = questionStat.modelResults.filter(r => r.success)
    
    // Meilleur temps de réponse
    const fastestModel = successfulResults.reduce((fastest, current) => 
      current.responseTime < fastest.responseTime ? current : fastest
    , successfulResults[0])

    // Meilleur débit
    const highestThroughput = successfulResults.reduce((highest, current) => 
      current.tokensPerSecond > highest.tokensPerSecond ? current : highest
    , successfulResults[0])

    // Meilleure note
    const ratedResults = successfulResults.filter(r => r.rating && r.rating > 0)
    const bestRated = ratedResults.length > 0 
      ? ratedResults.reduce((best, current) => 
          (current.rating || 0) > (best.rating || 0) ? current : best
        , ratedResults[0])
      : null

    return { fastestModel, highestThroughput, bestRated }
  }

  const filteredQuestions = questionStats
    .filter(q => selectedCategory === 'all' || q.category === selectedCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'difficulty':
          const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 }
          return (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 2) - (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 2)
        case 'success_rate':
          return b.successRate - a.successRate
        case 'speed':
          return a.averageTime - b.averageTime
        case 'rating':
          const aAvgRating = a.modelResults.filter(r => r.rating).reduce((sum, r) => sum + (r.rating || 0), 0) / a.modelResults.filter(r => r.rating).length || 0
          const bAvgRating = b.modelResults.filter(r => r.rating).reduce((sum, r) => sum + (r.rating || 0), 0) / b.modelResults.filter(r => r.rating).length || 0
          return bAvgRating - aAvgRating
        default:
          return 0
      }
    })

  const categories = ['all', ...Array.from(new Set(questionStats.map(q => q.category)))]

  if (questionStats.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée disponible</h3>
        <p className="text-gray-600">Lancez des benchmarks pour voir l'analyse par question.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Toutes les catégories' : category}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trier par
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="difficulty">Difficulté</option>
              <option value="success_rate">Taux de réussite</option>
              <option value="speed">Rapidité moyenne</option>
              <option value="rating">Note moyenne</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Questions testées</p>
              <p className="text-2xl font-bold text-gray-900">{questionStats.length}</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tests total</p>
              <p className="text-2xl font-bold text-gray-900">
                {questionStats.reduce((sum, q) => sum + q.totalTests, 0)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Réussite moyenne</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(questionStats.reduce((sum, q) => sum + q.successRate, 0) / questionStats.length)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Temps moyen</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(questionStats.reduce((sum, q) => sum + q.averageTime, 0) / questionStats.length)}ms
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Liste des questions */}
      <div className="space-y-4">
        {filteredQuestions.map((questionStat) => {
          const { fastestModel, highestThroughput, bestRated } = getBestPerformers(questionStat)
          const avgRating = questionStat.modelResults.filter(r => r.rating).reduce((sum, r) => sum + (r.rating || 0), 0) / questionStat.modelResults.filter(r => r.rating).length

          return (
            <div key={questionStat.questionId} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {getTestName(questionStat.questionId)}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getCategoryColor(questionStat.category)}`}>
                      {questionStat.category}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(questionStat.difficulty)}`}>
                      {questionStat.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">
                      {questionStat.totalTests} tests
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {questionStat.questionText}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(questionStat.successRate)}%
                  </div>
                  <div className="text-xs text-gray-500">réussite</div>
                </div>
              </div>

              {/* Statistiques globales de la question */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">{Math.round(questionStat.averageTime)}ms</div>
                  <div className="text-xs text-gray-500">Temps moyen</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">{questionStat.averageTokensPerSecond.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">Tokens/sec moyen</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">
                    {avgRating ? avgRating.toFixed(1) : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">Note moyenne</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">{questionStat.modelResults.filter(r => r.success).length}</div>
                  <div className="text-xs text-gray-500">Réussites</div>
                </div>
              </div>

              {/* Champions */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Champions pour cette question
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {fastestModel && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Plus rapide</span>
                      </div>
                      <div className="text-sm text-blue-800">{fastestModel.modelName}</div>
                      <div className="text-xs text-blue-600">{fastestModel.responseTime}ms</div>
                    </div>
                  )}

                  {highestThroughput && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-900">Meilleur débit</span>
                      </div>
                      <div className="text-sm text-green-800">{highestThroughput.modelName}</div>
                      <div className="text-xs text-green-600">{highestThroughput.tokensPerSecond.toFixed(1)} tok/s</div>
                    </div>
                  )}

                  {bestRated && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-yellow-900">Mieux noté</span>
                      </div>
                      <div className="text-sm text-yellow-800">{bestRated.modelName}</div>
                      <div className="text-xs text-yellow-600 flex items-center gap-1">
                        {bestRated.rating}/5
                        <Star className="w-3 h-3 fill-current" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Résultats détaillés par modèle */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  Voir tous les résultats par modèle ({questionStat.modelResults.length})
                </summary>
                <div className="mt-3 space-y-2">
                  {questionStat.modelResults
                    .sort((a, b) => a.responseTime - b.responseTime)
                    .map((result, index) => (
                    <div key={`${result.modelName}-${index}`} className={`flex items-center justify-between p-3 rounded-lg border ${
                      result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="font-medium">{result.modelName}</span>
                        {result.rating && (
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < result.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {result.success ? (
                          <>
                            <span className="text-gray-600">{result.responseTime}ms</span>
                            <span className="text-gray-600">{result.tokensPerSecond.toFixed(1)} tok/s</span>
                            <Medal className={`w-4 h-4 ${
                              index === 0 ? 'text-yellow-500' :
                              index === 1 ? 'text-gray-400' :
                              index === 2 ? 'text-orange-600' : 'text-gray-300'
                            }`} />
                          </>
                        ) : (
                          <span className="text-red-600 text-xs">Échec</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )
        })}
      </div>
    </div>
  )
}

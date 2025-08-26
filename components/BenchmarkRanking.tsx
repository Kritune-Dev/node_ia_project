'use client'

import { useState, useEffect } from 'react'
import { Trophy, Medal, Award, TrendingUp, Clock, Zap, Target, Info, ArrowUpDown } from 'lucide-react'
import ModelDetailModal from './ModelDetailModal'

interface BenchmarkRankingProps {
  benchmarks: any[]
  onSelectBenchmark: (benchmark: any) => void
}

interface ModelStats {
  name: string
  displayName: string
  totalTests: number
  successfulTests: number
  avgResponseTime: number
  avgTokensPerSecond: number
  avgUserRating: number
  totalRatings: number
  categories: { [key: string]: number }
  lastTested: string
  bestBenchmark: any
  hasNative: boolean
  type: string
  size: number
  sizeFormatted: string
}

export default function BenchmarkRanking({ benchmarks, onSelectBenchmark }: BenchmarkRankingProps) {
  const [rankingMode, setRankingMode] = useState<'overall' | 'speed' | 'accuracy' | 'user_rating'>('overall')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [modelStats, setModelStats] = useState<ModelStats[]>([])
  const [models, setModels] = useState<any[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'score'>('score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedModelDetail, setSelectedModelDetail] = useState<any>(null)
  const [showModelModal, setShowModelModal] = useState(false)

  useEffect(() => {
    loadModels()
  }, [])

  useEffect(() => {
    if (models.length > 0) {
      calculateModelStats()
    }
  }, [benchmarks, models])

  const loadModels = async () => {
    try {
      const response = await fetch('/api/models')
      if (response.ok) {
        const data = await response.json()
        setModels(data.models?.all || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des modèles:', error)
    }
  }

  const calculateModelStats = () => {
    const stats: { [key: string]: ModelStats } = {}

    benchmarks.forEach(benchmark => {
      if (!benchmark.results) return

      Object.entries(benchmark.results).forEach(([modelName, data]: [string, any]) => {
        if (!stats[modelName]) {
          // Trouver les informations du modèle
          const modelInfo = models.find(m => m.name === modelName) || {}
          
          stats[modelName] = {
            name: modelName,
            displayName: modelInfo.displayName || modelName,
            totalTests: 0,
            successfulTests: 0,
            avgResponseTime: 0,
            avgTokensPerSecond: 0,
            avgUserRating: 0,
            totalRatings: 0,
            categories: {},
            lastTested: benchmark.timestamp,
            bestBenchmark: benchmark,
            hasNative: modelInfo.hasNative || false,
            type: modelInfo.type || 'general',
            size: modelInfo.size || 0,
            sizeFormatted: modelInfo.sizeFormatted || 'N/A'
          }
        }

        const modelData = data
        const questions = modelData.questions || {}
        
        Object.entries(questions).forEach(([questionId, questionData]: [string, any]) => {
          stats[modelName].totalTests++
          
          if (questionData.success) {
            stats[modelName].successfulTests++
            stats[modelName].avgResponseTime += questionData.responseTime || 0
            stats[modelName].avgTokensPerSecond += questionData.tokensPerSecond || 0
          }

          // Ajouter les ratings utilisateur
          if (questionData.user_rating && questionData.user_rating > 0) {
            stats[modelName].avgUserRating += questionData.user_rating
            stats[modelName].totalRatings++
          }

          // Catégories
          const category = questionData.category || 'unknown'
          stats[modelName].categories[category] = (stats[modelName].categories[category] || 0) + 1
        })

        // Mettre à jour la date de dernier test
        if (new Date(benchmark.timestamp) > new Date(stats[modelName].lastTested)) {
          stats[modelName].lastTested = benchmark.timestamp
          stats[modelName].bestBenchmark = benchmark
        }
      })
    })

    // Calculer les moyennes
    Object.values(stats).forEach(stat => {
      if (stat.successfulTests > 0) {
        stat.avgResponseTime = stat.avgResponseTime / stat.successfulTests
        stat.avgTokensPerSecond = stat.avgTokensPerSecond / stat.successfulTests
      }
      if (stat.totalRatings > 0) {
        stat.avgUserRating = stat.avgUserRating / stat.totalRatings
      }
    })

    setModelStats(Object.values(stats))
  }

  const getOverallScore = (stat: ModelStats): number => {
    const successRate = stat.totalTests > 0 ? (stat.successfulTests / stat.totalTests) * 100 : 0
    const speedScore = stat.avgTokensPerSecond > 0 ? Math.min(stat.avgTokensPerSecond / 10, 100) : 0
    const userScore = stat.avgUserRating > 0 ? (stat.avgUserRating / 5) * 100 : 0
    
    // Pondération: 40% réussite, 30% vitesse, 30% note utilisateur
    return (successRate * 0.4) + (speedScore * 0.3) + (userScore * 0.3)
  }

  const handleModelDetail = (modelName: string) => {
    const model = models.find(m => m.name === modelName)
    if (model) {
      setSelectedModelDetail(model)
      setShowModelModal(true)
    }
  }

  const handleSort = (newSortBy: 'name' | 'size' | 'score') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(newSortBy)
      setSortOrder(newSortBy === 'score' ? 'desc' : 'asc')
    }
  }

  const getSortedModels = () => {
    let sorted = [...modelStats]
    
    // D'abord filtrer par mode de ranking
    switch (rankingMode) {
      case 'overall':
        sorted = sorted.sort((a, b) => getOverallScore(b) - getOverallScore(a))
        break
      case 'speed':
        sorted = sorted.sort((a, b) => b.avgTokensPerSecond - a.avgTokensPerSecond)
        break
      case 'accuracy':
        sorted = sorted.sort((a, b) => {
          const aAccuracy = a.totalTests > 0 ? (a.successfulTests / a.totalTests) * 100 : 0
          const bAccuracy = b.totalTests > 0 ? (b.successfulTests / b.totalTests) * 100 : 0
          return bAccuracy - aAccuracy
        })
        break
      case 'user_rating':
        sorted = sorted.sort((a, b) => b.avgUserRating - a.avgUserRating)
        break
    }

    // Ensuite trier selon le critère choisi
    if (sortBy !== 'score') {
      sorted = sorted.sort((a, b) => {
        let comparison = 0
        
        switch (sortBy) {
          case 'name':
            comparison = a.displayName.localeCompare(b.displayName)
            break
          case 'size':
            comparison = a.size - b.size
            break
        }
        
        return sortOrder === 'desc' ? -comparison : comparison
      })
    }

    return sorted
  }

  const sortedModels = getSortedModels()

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2: return <Medal className="w-6 h-6 text-gray-400" />
      case 3: return <Award className="w-6 h-6 text-amber-600" />
      default: return <div className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">{rank}</div>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (modelStats.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée de classement</h3>
        <p className="text-gray-600">Lancez des benchmarks pour voir le classement des modèles.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Contrôles de classement */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">Classement des Modèles</h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={rankingMode}
              onChange={(e) => setRankingMode(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="overall">Score global</option>
              <option value="speed">Vitesse</option>
              <option value="accuracy">Précision</option>
              <option value="user_rating">Note utilisateur</option>
            </select>
            
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-500">Trier par:</span>
              <button
                onClick={() => handleSort('score')}
                className={`flex items-center gap-1 px-2 py-1 text-sm rounded ${
                  sortBy === 'score' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Score
                {sortBy === 'score' && <ArrowUpDown className="w-3 h-3" />}
              </button>
              <button
                onClick={() => handleSort('name')}
                className={`flex items-center gap-1 px-2 py-1 text-sm rounded ${
                  sortBy === 'name' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Nom
                {sortBy === 'name' && <ArrowUpDown className="w-3 h-3" />}
              </button>
              <button
                onClick={() => handleSort('size')}
                className={`flex items-center gap-1 px-2 py-1 text-sm rounded ${
                  sortBy === 'size' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Taille
                {sortBy === 'size' && <ArrowUpDown className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Podium pour le top 3 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4 text-center">Podium</h3>
        <div className="flex justify-center items-end gap-4">
          {sortedModels.slice(0, 3).map((model, index) => {
            const rank = index + 1
            const height = rank === 1 ? 'h-24' : rank === 2 ? 'h-20' : 'h-16'
            const bgColor = rank === 1 ? 'bg-yellow-100' : rank === 2 ? 'bg-gray-100' : 'bg-amber-100'
            
            return (
              <div key={model.name} className={`${height} ${bgColor} rounded-lg p-3 flex flex-col items-center justify-end min-w-32`}>
                <div className="text-center mb-2">
                  {getRankIcon(rank)}
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <span className="font-medium text-sm">{model.displayName}</span>
                    {model.hasNative && (
                      <div title="Optimisé natif">
                        <Zap className="w-3 h-3 text-yellow-500" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    {rankingMode === 'overall' && `${Math.round(getOverallScore(model))}%`}
                    {rankingMode === 'speed' && `${Math.round(model.avgTokensPerSecond)} t/s`}
                    {rankingMode === 'accuracy' && `${Math.round((model.successfulTests / model.totalTests) * 100)}%`}
                    {rankingMode === 'user_rating' && `${model.avgUserRating.toFixed(1)}/5`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Classement détaillé */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Classement complet</h3>
        </div>
        
        <div className="divide-y">
          {sortedModels.map((model, index) => {
            const rank = index + 1
            const successRate = model.totalTests > 0 ? (model.successfulTests / model.totalTests) * 100 : 0
            const overallScore = getOverallScore(model)
            
            return (
              <div key={model.name} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getRankIcon(rank)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-lg">{model.displayName}</h4>
                        {model.hasNative && (
                          <div title="Optimisé natif">
                            <Zap className="w-4 h-4 text-yellow-500" />
                          </div>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          model.type === 'medical' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {model.type === 'medical' ? 'Médical' : 'Général'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-4">
                        <span>Dernier test: {formatDate(model.lastTested)}</span>
                        <span>Taille: {model.sizeFormatted}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleModelDetail(model.name)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Voir les détails du modèle"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-6 text-center">
                    <div>
                      <div className="text-sm text-gray-500">Score global</div>
                      <div className="font-semibold text-lg">{Math.round(overallScore)}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Précision</div>
                      <div className="font-semibold text-lg">{Math.round(successRate)}%</div>
                      <div className="text-xs text-gray-400">{model.successfulTests}/{model.totalTests}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Vitesse</div>
                      <div className="font-semibold text-lg">{Math.round(model.avgTokensPerSecond)}</div>
                      <div className="text-xs text-gray-400">tokens/sec</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Note utilisateur</div>
                      <div className="font-semibold text-lg">
                        {model.totalRatings > 0 ? model.avgUserRating.toFixed(1) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {model.totalRatings > 0 ? `${model.totalRatings} notes` : 'Aucune note'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectBenchmark(model.bestBenchmark)}
                    className="ml-4 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    Voir détails
                  </button>
                </div>

                {/* Catégories */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(model.categories).map(([category, count]) => (
                    <span key={category} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {category}: {count} tests
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modale de détails du modèle */}
      <ModelDetailModal
        model={selectedModelDetail}
        isVisible={showModelModal}
        onClose={() => setShowModelModal(false)}
      />
    </div>
  )
}

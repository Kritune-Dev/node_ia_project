'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, TrendingUp, Eye, Trash2, Search, Filter } from 'lucide-react'

interface BenchmarkHistoryProps {
  benchmarks: any[]
  onSelectBenchmark: (benchmark: any) => void
  onDataUpdate: () => void
}

export default function BenchmarkHistory({ benchmarks, onSelectBenchmark, onDataUpdate }: BenchmarkHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'models' | 'questions' | 'success_rate'>('date')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const getSuccessRate = (benchmark: any) => {
    if (!benchmark.summary) return 0
    const total = benchmark.summary.total_tests || 0
    const successful = benchmark.summary.successful_tests || 0
    return total > 0 ? Math.round((successful / total) * 100) : 0
  }

  const getTopModel = (benchmark: any): { name: string; score: number } | null => {
    if (!benchmark.results) return null
    
    let bestModel: { name: string; score: number } | null = null
    let bestScore = -1
    
    Object.entries(benchmark.results).forEach(([modelName, data]: [string, any]) => {
      const score = data.success_rate || 0
      if (score > bestScore) {
        bestScore = score
        bestModel = { name: modelName, score }
      }
    })
    
    return bestModel
  }

  const deleteBenchmark = async (benchmarkId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce benchmark ?')) {
      return
    }

    try {
      const response = await fetch('/api/benchmark/history', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ benchmarkId })
      })

      if (response.ok) {
        onDataUpdate()
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const filteredBenchmarks = benchmarks
    .filter(benchmark => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          benchmark.benchmark_id?.toLowerCase().includes(searchLower) ||
          Object.keys(benchmark.results || {}).some(model => 
            model.toLowerCase().includes(searchLower)
          )
        )
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        case 'models':
          return (b.models_tested || 0) - (a.models_tested || 0)
        case 'questions':
          return (b.questions_tested || 0) - (a.questions_tested || 0)
        case 'success_rate':
          return getSuccessRate(b) - getSuccessRate(a)
        default:
          return 0
      }
    })

  if (benchmarks.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun benchmark trouvé</h3>
        <p className="text-gray-600">Lancez votre premier benchmark pour commencer à collecter des données.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par ID de benchmark ou modèle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Trier par date</option>
              <option value="models">Trier par nb. modèles</option>
              <option value="questions">Trier par nb. questions</option>
              <option value="success_rate">Trier par taux de réussite</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des benchmarks */}
      <div className="space-y-4">
        {filteredBenchmarks.map((benchmark) => {
          const successRate = getSuccessRate(benchmark)
          const topModel = getTopModel(benchmark)
          const totalDuration = Object.values(benchmark.results || {}).reduce(
            (sum: number, model: any) => sum + (model.total_response_time || 0), 0
          )

          return (
            <div
              key={benchmark.id || benchmark.benchmark_id}
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">
                      Benchmark {benchmark.benchmark_id || benchmark.id}
                    </h3>
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                      successRate >= 80 ? 'bg-green-100 text-green-800' :
                      successRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {successRate}% réussite
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(benchmark.timestamp)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(totalDuration)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Modèles testés</div>
                      <div className="font-medium">{benchmark.models_tested || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Questions</div>
                      <div className="font-medium">{benchmark.questions_tested || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Tests total</div>
                      <div className="font-medium">{benchmark.summary?.total_tests || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Meilleur modèle</div>
                      <div className="font-medium text-blue-600">
                        {topModel ? `${topModel.name} (${topModel.score}%)` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => onSelectBenchmark(benchmark)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Voir les détails"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteBenchmark(benchmark.id || benchmark.benchmark_id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modèles testés */}
              <div>
                <div className="text-sm text-gray-500 mb-2">Modèles testés:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(benchmark.results || {}).map((modelName) => (
                    <span
                      key={modelName}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                    >
                      {modelName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredBenchmarks.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucun benchmark ne correspond à votre recherche.</p>
        </div>
      )}
    </div>
  )
}

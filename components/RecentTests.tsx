'use client'

import React from 'react'
import { Activity, TrendingUp, Clock, CheckCircle, XCircle, PlayCircle } from 'lucide-react'
import { useBenchmarkHistory } from '../hooks/useApi'

interface BenchmarkItem {
  id: string
  name: string
  timestamp: string
  duration: number
  successRate: number
  status: 'completed' | 'failed' | 'running'
  modelCount: number
  questionCount: number
}

function BenchmarkCard({ benchmark }: { benchmark: BenchmarkItem }) {
  const getStatusIcon = () => {
    switch (benchmark.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'running':
        return <PlayCircle className="w-4 h-4 text-blue-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (benchmark.status) {
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      case 'running':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    }
    return `${seconds}s`
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
    } else if (diffHours > 0) {
      return `Il y a ${diffHours}h`
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `Il y a ${diffMinutes}min`
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">{benchmark.name}</h3>
          <p className="text-sm text-gray-500">{formatDate(benchmark.timestamp)}</p>
        </div>
        
        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="ml-1 capitalize">{benchmark.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-lg font-semibold text-blue-600">
            {benchmark.successRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">Succès</div>
        </div>
        
        <div>
          <div className="text-lg font-semibold text-purple-600">
            {formatDuration(benchmark.duration)}
          </div>
          <div className="text-xs text-gray-500">Durée</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{benchmark.modelCount} modèle{benchmark.modelCount > 1 ? 's' : ''}</span>
        <span>{benchmark.questionCount} question{benchmark.questionCount > 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}

export default function RecentTests() {
  const { benchmarks, isLoading, error, refresh } = useBenchmarkHistory()

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Activity className="w-6 h-6 mr-2 text-green-600" />
            Derniers Tests
          </h2>
        </div>
        
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-24 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Activity className="w-6 h-6 mr-2 text-red-600" />
            Derniers Tests
          </h2>
          <button
            onClick={() => refresh()}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Réessayer
          </button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">❌ Erreur lors du chargement des tests</p>
        </div>
      </div>
    )
  }

  const recentBenchmarks = benchmarks.slice(0, 6)
  const completedBenchmarks = benchmarks.filter((b: BenchmarkItem) => b.status === 'completed')
  const avgSuccessRate = completedBenchmarks.length > 0 
    ? completedBenchmarks.reduce((sum: number, b: BenchmarkItem) => sum + b.successRate, 0) / completedBenchmarks.length
    : 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Activity className="w-6 h-6 mr-2 text-green-600" />
          Derniers Tests
        </h2>
        
        <button
          onClick={() => refresh()}
          className="text-sm text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50"
        >
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <Activity className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <div className="text-2xl font-bold text-blue-600">{benchmarks.length}</div>
              <div className="text-sm text-blue-700">Tests total</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <div className="text-2xl font-bold text-green-600">
                {avgSuccessRate.toFixed(1)}%
              </div>
              <div className="text-sm text-green-700">Succès moyen</div>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-purple-600 mr-2" />
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {completedBenchmarks.length}
              </div>
              <div className="text-sm text-purple-700">Complétés</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tests */}
      {recentBenchmarks.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun test trouvé</h3>
          <p className="text-gray-500">
            Lancez votre premier benchmark pour voir les résultats ici.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentBenchmarks.slice(0, 3).map((benchmark: BenchmarkItem) => (
            <BenchmarkCard key={benchmark.id} benchmark={benchmark} />
          ))}
        </div>
      )}

      {benchmarks.length > 3 && (
        <div className="mt-4 text-center">
          <button className="text-green-600 hover:text-green-700 text-sm font-medium">
            Voir tous les tests ({benchmarks.length})
          </button>
        </div>
      )}
    </div>
  )
}

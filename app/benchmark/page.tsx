'use client'

import { useState, useEffect } from 'react'
import { Play, Clock, Trophy, BarChart3, FileText, Plus, Search, Filter, Target } from 'lucide-react'
import BenchmarkRunner from '../../components/BenchmarkRunner'
import BenchmarkHistory from '../../components/BenchmarkHistory'
import BenchmarkRanking from '../../components/BenchmarkRanking'
import BenchmarkQuestionAnalysis from '../../components/BenchmarkQuestionAnalysis'

interface BenchmarkPageState {
  activeTab: 'run' | 'history' | 'ranking' | 'questions'
  selectedBenchmark?: any
}

export default function BenchmarkPage() {
  const [state, setState] = useState<BenchmarkPageState>({
    activeTab: 'run'
  })
  const [benchmarkData, setBenchmarkData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBenchmarkData()
  }, [])

  const loadBenchmarkData = async () => {
    try {
      const response = await fetch('/api/benchmark/history')
      if (response.ok) {
        const data = await response.json()
        setBenchmarkData(data.benchmarks || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des benchmarks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBenchmarkComplete = (result: any) => {
    setBenchmarkData(prev => [result, ...prev])
    setState(prev => ({ ...prev, activeTab: 'history', selectedBenchmark: result }))
  }

  const tabs = [
    { id: 'run', label: 'Nouveau Benchmark', icon: Play },
    { id: 'history', label: 'Historique & Résultats', icon: Clock },
    { id: 'ranking', label: 'Classement', icon: Trophy },
    { id: 'questions', label: 'Analyse par question', icon: Target }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Centre de Benchmark LLM</h1>
                <p className="mt-2 text-gray-600">
                  Évaluez et comparez les performances de vos modèles de langage
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total des tests</div>
                  <div className="text-2xl font-bold text-blue-600">{benchmarkData.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setState(prev => ({ ...prev, activeTab: tab.id as any }))}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    state.activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {state.activeTab === 'run' && (
          <BenchmarkRunner 
            onBenchmarkComplete={handleBenchmarkComplete}
            onDataUpdate={loadBenchmarkData}
          />
        )}
        
        {state.activeTab === 'history' && (
          <BenchmarkHistory 
            benchmarks={benchmarkData}
            onSelectBenchmark={(benchmark) => {
              // Pas besoin de changer d'onglet, l'historique peut tout afficher
              console.log('Benchmark sélectionné:', benchmark)
            }}
            onDataUpdate={loadBenchmarkData}
          />
        )}
        
        {state.activeTab === 'ranking' && (
          <BenchmarkRanking 
            benchmarks={benchmarkData}
            onSelectBenchmark={(benchmark) => {
              // Rediriger vers l'historique avec ce benchmark
              setState(prev => ({ ...prev, activeTab: 'history', selectedBenchmark: benchmark }))
            }}
          />
        )}
        
        {state.activeTab === 'questions' && (
          <BenchmarkQuestionAnalysis 
            benchmarks={benchmarkData}
          />
        )}
      </div>
    </div>
  )
}

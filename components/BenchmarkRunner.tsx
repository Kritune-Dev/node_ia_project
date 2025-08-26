'use client'

import { useState, useEffect } from 'react'
import { Play, Square, RefreshCw, CheckCircle, XCircle, Settings, AlertCircle } from 'lucide-react'

interface BenchmarkQuestion {
  id: string
  question: string
  category: string
  difficulty: string
}

interface BenchmarkRunnerProps {
  onBenchmarkComplete: (result: any) => void
  onDataUpdate: () => void
}

export default function BenchmarkRunner({ onBenchmarkComplete, onDataUpdate }: BenchmarkRunnerProps) {
  const [models, setModels] = useState<any[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [questions, setQuestions] = useState<BenchmarkQuestion[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [isRunning, setBenchmarkRunning] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, currentModel: '', currentQuestion: '' })
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadModels()
    loadQuestions()
  }, [])

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

  const loadQuestions = async () => {
    try {
      const response = await fetch('/api/benchmark/run')
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.available_questions || [])
        // Sélectionner quelques questions par défaut
        const defaultQuestions = data.available_questions?.slice(0, 4).map((q: any) => q.id) || []
        setSelectedQuestions(defaultQuestions)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleModelSelection = (modelName: string) => {
    setSelectedModels(prev => 
      prev.includes(modelName) 
        ? prev.filter(m => m !== modelName)
        : [...prev, modelName]
    )
  }

  const handleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(q => q !== questionId)
        : [...prev, questionId]
    )
  }

  const runBenchmark = async () => {
    if (selectedModels.length === 0 || selectedQuestions.length === 0) {
      alert('Veuillez sélectionner au moins un modèle et une question')
      return
    }

    setBenchmarkRunning(true)
    setProgress({ current: 0, total: selectedModels.length * selectedQuestions.length, currentModel: '', currentQuestion: '' })
    setResults(null)

    try {
      const response = await fetch('/api/benchmark/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          models: selectedModels,
          questionIds: selectedQuestions
        })
      })

      if (response.ok) {
        const benchmarkResults = await response.json()
        setResults(benchmarkResults)
        
        // Sauvegarder dans l'historique
        await fetch('/api/benchmark/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(benchmarkResults)
        })

        onBenchmarkComplete(benchmarkResults)
        onDataUpdate()
      } else {
        throw new Error('Erreur lors du benchmark')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'exécution du benchmark')
    } finally {
      setBenchmarkRunning(false)
    }
  }

  const stopBenchmark = () => {
    setBenchmarkRunning(false)
    setProgress({ current: 0, total: 0, currentModel: '', currentQuestion: '' })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'medical': return 'bg-blue-100 text-blue-800'
      case 'general': return 'bg-purple-100 text-purple-800'
      case 'coding': return 'bg-orange-100 text-orange-800'
      case 'reasoning': return 'bg-teal-100 text-teal-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
        <p className="text-gray-600">Chargement des modèles et questions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Configuration du benchmark */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold">Configuration du Benchmark</h2>
        </div>

        {/* Sélection des modèles */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Modèles à tester ({selectedModels.length} sélectionnés)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {models.map((model) => (
              <label
                key={model.name}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedModels.includes(model.name)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedModels.includes(model.name)}
                  onChange={() => handleModelSelection(model.name)}
                  className="rounded border-gray-300"
                />
                <div className="flex-1">
                  <div className="font-medium">{model.displayName || model.name}</div>
                  <div className="text-sm text-gray-500">{model.sizeFormatted}</div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  model.type === 'medical' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {model.type === 'medical' ? 'Médical' : 'Général'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Sélection des questions */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Questions de test ({selectedQuestions.length} sélectionnées)</h3>
          <div className="space-y-3">
            {questions.map((question) => (
              <label
                key={question.id}
                className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedQuestions.includes(question.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedQuestions.includes(question.id)}
                  onChange={() => handleQuestionSelection(question.id)}
                  className="rounded border-gray-300 mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium mb-1">{question.question}</div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(question.category)}`}>
                      {question.category}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Boutons de contrôle */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedModels.length} modèle(s) × {selectedQuestions.length} question(s) = {selectedModels.length * selectedQuestions.length} test(s)
          </div>
          <div className="flex items-center gap-3">
            {isRunning ? (
              <button
                onClick={stopBenchmark}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Arrêter
              </button>
            ) : (
              <button
                onClick={runBenchmark}
                disabled={selectedModels.length === 0 || selectedQuestions.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Lancer le Benchmark
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progression du benchmark */}
      {isRunning && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
            <h2 className="text-xl font-semibold">Benchmark en cours...</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progression globale</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            {progress.currentModel && (
              <div className="text-sm text-gray-600">
                <div>Modèle: <span className="font-medium">{progress.currentModel}</span></div>
                <div>Question: <span className="font-medium">{progress.currentQuestion}</span></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Résultats rapides */}
      {results && !isRunning && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-semibold">Benchmark terminé !</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{results.summary.successful_tests}</div>
              <div className="text-sm text-blue-600">Tests réussis</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{Math.round(results.summary.average_response_time)}ms</div>
              <div className="text-sm text-green-600">Temps moyen</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{Math.round(results.summary.average_tokens_per_second)}</div>
              <div className="text-sm text-purple-600">Tokens/sec moyen</div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-gray-600">Consultez l'onglet "Résultats" pour analyser en détail les performances.</p>
          </div>
        </div>
      )}
    </div>
  )
}

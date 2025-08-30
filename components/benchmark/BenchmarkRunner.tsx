'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, RotateCcw, Settings, ChevronDown, ChevronUp, Monitor, Eye, EyeOff, Minimize2, Maximize2, RefreshCw, AlertCircle, ArrowUpDown, Zap, Info, CheckCircle } from 'lucide-react'
import ModelDetailModal from '../Modal/ModelDetailModal'
import CustomQuestions, { CustomQuestion } from './CustomQuestions'

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
  
  // Paramètres avancés
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [temperature, setTemperature] = useState(0.8)
  const [seed, setSeed] = useState<number | null>(null)
  const [customTimeout, setCustomTimeout] = useState(90)
  const [useCustomParams, setUseCustomParams] = useState(false)

  // Fonction utilitaire pour formater le temps
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`
    } else {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      if (remainingSeconds === 0) {
        return `${minutes}min`
      } else {
        return `${minutes}min ${remainingSeconds}s`
      }
    }
  }
  const [progress, setProgress] = useState({ 
    current: 0, 
    total: 0, 
    currentModel: '', 
    currentQuestion: '',
    currentQuestionText: '',
    startTime: 0,
    estimatedTimeRemaining: 0
  })
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'type'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedModelDetail, setSelectedModelDetail] = useState<any>(null)
  const [showModelModal, setShowModelModal] = useState(false)
  
  // États pour les questions personnalisées
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([])
  const [useCustomQuestions, setUseCustomQuestions] = useState(false)
  const [showCustomQuestions, setShowCustomQuestions] = useState(false)

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
        
        // Sélectionner les tests de base par défaut + quelques autres
        const availableQuestions = data.available_questions || []
        const basicQuestions = availableQuestions.filter((q: any) => q.category === 'basic').map((q: any) => q.id)
        const otherQuestions = availableQuestions.filter((q: any) => q.category !== 'basic').slice(0, 2).map((q: any) => q.id)
        const defaultQuestions = [...basicQuestions, ...otherQuestions]
        
        setSelectedQuestions(defaultQuestions)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des questions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour gérer les questions personnalisées
  const handleCustomQuestionsChange = (questions: CustomQuestion[]) => {
    setCustomQuestions(questions)
  }

  const handleModelSelection = (modelName: string) => {
    setSelectedModels(prev => 
      prev.includes(modelName) 
        ? prev.filter(m => m !== modelName)
        : [...prev, modelName]
    )
  }

  const handleModelDetail = (model: any) => {
    setSelectedModelDetail(model)
    setShowModelModal(true)
  }

  const handleSort = (newSortBy: 'name' | 'size' | 'type') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('asc')
    }
  }

  const getSortedModels = () => {
    return [...models].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.displayName.localeCompare(b.displayName)
          break
        case 'size':
          comparison = (a.size || 0) - (b.size || 0)
          break
        case 'type':
          comparison = (a.type || '').localeCompare(b.type || '')
          break
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })
  }

  const handleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(q => q !== questionId)
        : [...prev, questionId]
    )
  }

  const selectAllModels = () => {
    const availableModels = models.filter(model => model.available).map(model => model.name)
    setSelectedModels(availableModels)
  }

  const selectAllQuestions = () => {
    setSelectedQuestions(questions.map(q => q.id))
  }

  const runFullBenchmark = async () => {
    // Sélectionner automatiquement tous les modèles disponibles et toutes les questions
    const availableModels = models.filter(model => model.available).map(model => model.name)
    const allQuestions = questions.map(q => q.id)
    
    if (availableModels.length === 0) {
      alert('Aucun modèle disponible pour le test')
      return
    }

    if (allQuestions.length === 0) {
      alert('Aucune question disponible pour le test')
      return
    }

    const totalTests = availableModels.length * allQuestions.length
    const confirmMessage = `Vous êtes sur le point de lancer un test complet avec ${availableModels.length} modèles et ${allQuestions.length} questions.\n\nCela représente ${totalTests} tests au total et peut prendre plusieurs minutes.\n\nVoulez-vous continuer ?`
    
    if (!confirm(confirmMessage)) {
      return
    }

    await runBenchmarkWithProgress(availableModels, allQuestions)
  }

  const runBenchmark = async () => {
    const questionsToUse = useCustomQuestions ? customQuestions.map(q => q.id) : selectedQuestions
    
    if (selectedModels.length === 0 || questionsToUse.length === 0) {
      if (useCustomQuestions && customQuestions.length === 0) {
        alert('Veuillez créer au moins une question personnalisée ou utiliser les questions prédéfinies')
      } else {
        alert('Veuillez sélectionner au moins un modèle et une question')
      }
      return
    }

    await runBenchmarkWithProgress(selectedModels, questionsToUse)
  }

  const runBenchmarkWithProgress = async (modelsToTest: string[], questionsToTest: string[]) => {
    setBenchmarkRunning(true)
    const totalTests = modelsToTest.length * questionsToTest.length
    setProgress({ 
      current: 0, 
      total: totalTests, 
      currentModel: '', 
      currentQuestion: '',
      currentQuestionText: '',
      startTime: Date.now(),
      estimatedTimeRemaining: 0
    })
    setResults(null)

    try {
      const response = await fetch('/api/benchmark/run-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          models: modelsToTest,
          questionIds: useCustomQuestions ? [] : questionsToTest,
          customQuestions: useCustomQuestions ? customQuestions : [],
          // Paramètres personnalisés
          customParams: useCustomParams ? {
            temperature: temperature,
            seed: seed,
            timeout: customTimeout * 1000 // Convertir en millisecondes
          } : null
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Pas de stream disponible')
      }

      const decoder = new TextDecoder()
      let benchmarkResults: any = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              switch (data.type) {
                case 'start':
                  console.log('Benchmark démarré:', data.benchmarkId)
                  break
                  
                case 'progress':
                  if (data.model && data.question) {
                    // Mise à jour du test en cours
                    setProgress(prev => ({
                      ...prev,
                      currentModel: data.model,
                      currentQuestion: data.question,
                      currentQuestionText: data.questionText || '',
                    }))
                  } else if (data.completed !== undefined) {
                    // Mise à jour de la progression globale
                    setProgress(prev => {
                      const elapsedTime = Date.now() - prev.startTime
                      const avgTimePerTest = data.completed > 0 ? elapsedTime / data.completed : 0
                      const remainingTests = data.total - data.completed
                      const estimatedTimeRemaining = avgTimePerTest * remainingTests
                      
                      return {
                        ...prev,
                        current: data.completed,
                        estimatedTimeRemaining: Math.round(estimatedTimeRemaining)
                      }
                    })
                  }
                  break
                  
                case 'result':
                  console.log(`Test terminé: ${data.model} - ${data.question}`, data.result)
                  break
                  
                case 'complete':
                  benchmarkResults = data.result
                  break
                  
                case 'error':
                  throw new Error(data.error)
              }
            } catch (e) {
              console.error('Erreur parsing SSE:', e)
            }
          }
        }
      }

      if (benchmarkResults) {
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
        
        // Message de succès pour le test complet
        if (modelsToTest.length > 1 && questionsToTest.length > 1) {
          alert(`Test complet terminé avec succès !\n\n${modelsToTest.length} modèles testés sur ${questionsToTest.length} questions.\nConsultez l'historique pour voir les résultats détaillés.`)
        }
      } else {
        throw new Error('Aucun résultat reçu')
      }

    } catch (error) {
      console.error('Erreur lors du benchmark:', error)
      alert(`Erreur lors du benchmark: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setBenchmarkRunning(false)
      setProgress({ 
        current: 0, 
        total: 0, 
        currentModel: '', 
        currentQuestion: '',
        currentQuestionText: '',
        startTime: 0,
        estimatedTimeRemaining: 0
      })
    }
  }

  const stopBenchmark = () => {
    setBenchmarkRunning(false)
    setProgress({ 
      current: 0, 
      total: 0, 
      currentModel: '', 
      currentQuestion: '',
      currentQuestionText: '',
      startTime: 0,
      estimatedTimeRemaining: 0
    })
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
      case 'basic': return 'bg-green-100 text-green-800'
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

        {/* Paramètres avancés */}
        <div className="mb-6 border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-medium text-gray-700">Paramètres avancés</h3>
            </div>
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              {showAdvancedSettings ? 'Masquer' : 'Afficher'}
              <Settings className="w-3 h-3" />
            </button>
          </div>

          {showAdvancedSettings && (
            <div className="space-y-4 pt-3 border-t">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="useCustomParams"
                  checked={useCustomParams}
                  onChange={(e) => setUseCustomParams(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="useCustomParams" className="text-sm font-medium text-gray-700">
                  Utiliser des paramètres personnalisés
                </label>
              </div>

              {useCustomParams && (
                <div className="space-y-4">
                  {/* Présets rapides */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Présets rapides
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setTemperature(0.1)
                          setSeed(42)
                          setCustomTimeout(60)
                        }}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                      >
                        Déterministe
                      </button>
                      <button
                        onClick={() => {
                          setTemperature(0.8)
                          setSeed(null)
                          setCustomTimeout(90)
                        }}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200"
                      >
                        Standard
                      </button>
                      <button
                        onClick={() => {
                          setTemperature(1.2)
                          setSeed(null)
                          setCustomTimeout(120)
                        }}
                        className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200"
                      >
                        Créatif
                      </button>
                      <button
                        onClick={() => {
                          setTemperature(0.8)
                          setSeed(null)
                          setCustomTimeout(300)
                        }}
                        className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200"
                      >
                        Test long
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg border">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Température
                        <span className="text-xs text-gray-500 ml-1">(0.0 - 2.0)</span>
                      </label>
                      <input
                        type="number"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        min="0"
                        max="2"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Précis</span>
                        <span>Créatif</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seed
                        <span className="text-xs text-gray-500 ml-1">(optionnel)</span>
                      </label>
                      <input
                        type="number"
                        value={seed || ''}
                        onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="Aléatoire"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Pour des résultats reproductibles
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timeout
                        <span className="text-xs text-gray-500 ml-1">(secondes)</span>
                      </label>
                      <input
                        type="number"
                        value={customTimeout}
                        onChange={(e) => setCustomTimeout(parseInt(e.target.value))}
                        min="30"
                        max="600"
                        step="30"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>30s</span>
                        <span>10min</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!useCustomParams && (
                <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                  <strong>Paramètres par défaut :</strong> Température: 0.8, Seed: aléatoire, Timeout: 90s
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configuration des questions */}
        <div className="mb-6 border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-medium text-gray-700">Type de questions</h3>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="questionType"
                  checked={!useCustomQuestions}
                  onChange={() => setUseCustomQuestions(false)}
                  className="text-blue-600"
                />
                <span className="text-sm font-medium">Questions prédéfinies</span>
                <span className="text-xs text-gray-500">({selectedQuestions.length} sélectionnées)</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="questionType"
                  checked={useCustomQuestions}
                  onChange={() => setUseCustomQuestions(true)}
                  className="text-blue-600"
                />
                <span className="text-sm font-medium">Questions personnalisées</span>
                <span className="text-xs text-gray-500">({customQuestions.length} créées)</span>
              </label>
            </div>

            {useCustomQuestions && (
              <div className="mt-3">
                <button
                  onClick={() => setShowCustomQuestions(!showCustomQuestions)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  {showCustomQuestions ? 'Masquer' : 'Gérer'} les questions personnalisées
                </button>
                {customQuestions.length === 0 && (
                  <p className="text-sm text-orange-600 mt-2">
                    Aucune question personnalisée créée. Cliquez sur "Gérer" pour en créer.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sélection des modèles */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-medium">Modèles à tester ({selectedModels.length} sélectionnés)</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  {models.filter(m => m.available).length} disponibles
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                  {models.length} total
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Trier par:</span>
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
              <button
                onClick={() => handleSort('type')}
                className={`flex items-center gap-1 px-2 py-1 text-sm rounded ${
                  sortBy === 'type' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Type
                {sortBy === 'type' && <ArrowUpDown className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {getSortedModels().map((model) => (
              <div
                key={model.name}
                className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                  selectedModels.includes(model.name)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <label className="flex items-center gap-3 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedModels.includes(model.name)}
                    onChange={() => handleModelSelection(model.name)}
                    className="rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{model.displayName || model.name}</span>
                      {model.hasNative && (
                        <div title="Optimisé natif">
                          <Zap className="w-4 h-4 text-yellow-500" />
                        </div>
                      )}
                    </div>
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
                <button
                  onClick={() => handleModelDetail(model)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Voir les détails du modèle"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sélection des questions */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Questions de test ({selectedQuestions.length} sélectionnées)</h3>
          
          {/* Tests de base mis en évidence */}
          {questions.filter(q => q.category === 'basic').length > 0 && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Tests de base (recommandés)
              </h4>
              <div className="space-y-2">
                {questions.filter(q => q.category === 'basic').map((question) => (
                  <label
                    key={question.id}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedQuestions.includes(question.id)
                        ? 'border-green-500 bg-green-100'
                        : 'border-green-300 hover:border-green-400 bg-white'
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
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Test de base
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
          )}

          {/* Autres questions */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Autres tests</h4>
            {questions.filter(q => q.category !== 'basic').map((question) => (
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
        <div className="space-y-4">
          {/* Boutons de sélection rapide */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Sélection rapide :</span>
              <button
                onClick={selectAllModels}
                disabled={isRunning}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Tous les modèles
              </button>
              <button
                onClick={selectAllQuestions}
                disabled={isRunning}
                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Toutes les questions
              </button>
            </div>
            <button
              onClick={runFullBenchmark}
              disabled={isRunning || models.filter(m => m.available).length === 0}
              title={`Tester automatiquement tous les ${models.filter(m => m.available).length} modèles disponibles sur toutes les ${questions.length} questions`}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium"
            >
              <Zap className="w-4 h-4" />
              Tester toutes les IA
              <span className="text-xs opacity-75">
                ({models.filter(m => m.available).length}×{questions.length})
              </span>
            </button>
          </div>

          {/* Boutons principaux */}
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
      </div>

      {/* Progression du benchmark */}
      {isRunning && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-6">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
            <h2 className="text-xl font-semibold">Benchmark en cours...</h2>
          </div>
          
          <div className="space-y-6">
            {/* Progression globale */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progression globale</span>
                <span>{progress.current} / {progress.total} ({Math.round((progress.current / progress.total) * 100) || 0}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Test en cours */}
            {progress.currentModel && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Test en cours
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Modèle :</span>
                    <span className="font-medium text-blue-700">{progress.currentModel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Question :</span>
                    <span className="font-medium text-blue-700">{progress.currentQuestion}</span>
                  </div>
                  {progress.currentQuestionText && (
                    <div className="mt-3 p-3 bg-white border border-blue-200 rounded">
                      <div className="text-xs text-gray-500 mb-1">Texte de la question :</div>
                      <div className="text-sm text-gray-700 line-clamp-2">{progress.currentQuestionText}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Statistiques en temps réel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-gray-900">{progress.current}</div>
                <div className="text-xs text-gray-500">Tests terminés</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-gray-900">{progress.total - progress.current}</div>
                <div className="text-xs text-gray-500">Tests restants</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {progress.startTime > 0 ? formatTime(Math.round((Date.now() - progress.startTime) / 1000)) : '0s'}
                </div>
                <div className="text-xs text-gray-500">Temps écoulé</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {progress.estimatedTimeRemaining > 0 ? formatTime(Math.round(progress.estimatedTimeRemaining / 1000)) : '?'}
                </div>
                <div className="text-xs text-gray-500">Temps restant</div>
              </div>
            </div>
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
              <div className="text-2xl font-bold text-green-600">
                {results.summary.average_response_time >= 1000 
                  ? formatTime(Math.round(results.summary.average_response_time / 1000))
                  : `${Math.round(results.summary.average_response_time)}ms`
                }
              </div>
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

      {/* Questions personnalisées */}
      {showCustomQuestions && (
        <CustomQuestions onQuestionsChange={handleCustomQuestionsChange} />
      )}

      {/* Modale de détails du modèle */}
      <ModelDetailModal
        model={selectedModelDetail}
        isVisible={showModelModal}
        onClose={() => setShowModelModal(false)}
      />
    </div>
  )
}

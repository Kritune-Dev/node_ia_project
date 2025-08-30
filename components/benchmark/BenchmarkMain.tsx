'use client'

import React, { useState, useEffect } from 'react'
import { Play, Settings, CheckCircle, Clock, AlertCircle, Info, Pause, Square } from 'lucide-react'
import { useModels, useBenchmarkHistory, useBenchmarkConfigs, useBenchmarkExecution } from '../../hooks/useApi'
import ModelDetailModal from '../Modal/ModelDetailModal'
import TestDetailModal from '../Modal/TestDetailModal'

interface BenchmarkExecutionState {
  isRunning: boolean
  currentBenchmarkId: string | null
  currentModel: string | null
  progress: number
  completedTests: number
  totalTests: number
  results: any[]
  errors: string[]
  executionId: string | null
  estimatedTimeRemaining: number
}

interface BenchmarkConfig {
  id: string
  name: string
  description: string
  estimatedTime: number
  questionCount: number
  difficulty: 'easy' | 'medium' | 'hard'
}

interface BenchmarkMainProps {
  onRunStart?: () => void
  onRunComplete?: (results: any) => void
}

const BenchmarkMain: React.FC<BenchmarkMainProps> = ({
  onRunStart,
  onRunComplete
}) => {
  // États pour la sélection
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<string[]>(['smoke_test'])
  
  // États pour l'exécution
  const [executionState, setExecutionState] = useState<BenchmarkExecutionState>({
    isRunning: false,
    currentBenchmarkId: null,
    currentModel: null,
    progress: 0,
    completedTests: 0,
    totalTests: 0,
    results: [],
    errors: [],
    executionId: null,
    estimatedTimeRemaining: 0
  })

  // États pour les modals
  const [selectedModelForModal, setSelectedModelForModal] = useState<any>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedTestForModal, setSelectedTestForModal] = useState<string | null>(null)
  const [isTestModalVisible, setIsTestModalVisible] = useState(false)

  // Hooks API
  const { models, isLoading: modelsLoading, error: modelsError } = useModels()
  const { benchmarks, refresh: refreshHistory } = useBenchmarkHistory()
  const { configs: availableBenchmarks, isLoading: configsLoading, error: configsError } = useBenchmarkConfigs()
  const { executeBenchmark: executeWithNewAPI } = useBenchmarkExecution()

  // Calculer le temps estimé total
  const getTotalEstimatedTime = (): number => {
    if (selectedBenchmarks.length === 0 || selectedModels.length === 0) return 0
    
    let totalSeconds = 0
    selectedBenchmarks.forEach(benchmarkId => {
      const config = availableBenchmarks.find((b: any) => b.id === benchmarkId)
      if (config) {
        totalSeconds += config.estimatedTime * selectedModels.length
      }
    })
    
    return totalSeconds
  }

  // Formater le temps en minutes/secondes
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}min ${secs}s`
    }
    return `${secs}s`
  }

  // Gestion de la sélection des modèles
  const handleModelToggle = (modelName: string) => {
    setSelectedModels(prev => {
      const newSelection = prev.includes(modelName)
        ? prev.filter(m => m !== modelName)
        : [...prev, modelName]
      
      console.log(`🤖 [MODEL-SELECTION] Toggle ${modelName}: ${prev.includes(modelName) ? 'DÉSÉLECTIONNÉ' : 'SÉLECTIONNÉ'}`)
      console.log(`🤖 [MODEL-SELECTION] Nouvelle sélection (${newSelection.length}):`, newSelection)
      
      return newSelection
    })
  }

  // Ouvrir le modal avec détails du modèle
  const handleModelDetails = (model: any, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedModelForModal(model)
    setIsModalVisible(true)
  }

  // Fermer le modal
  const handleCloseModal = () => {
    setIsModalVisible(false)
    setSelectedModelForModal(null)
  }

  // Ouvrir le modal avec détails du test
  const handleTestDetails = (benchmarkId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedTestForModal(benchmarkId)
    setIsTestModalVisible(true)
  }

  // Fermer le modal de test
  const handleCloseTestModal = () => {
    setIsTestModalVisible(false)
    setSelectedTestForModal(null)
  }

  // Gestion de la sélection des benchmarks
  const handleBenchmarkToggle = (benchmarkId: string) => {
    setSelectedBenchmarks(prev => {
      const newSelection = prev.includes(benchmarkId)
        ? prev.filter(b => b !== benchmarkId)
        : [...prev, benchmarkId]
      
      console.log(`🧪 [BENCHMARK-SELECTION] Toggle ${benchmarkId}: ${prev.includes(benchmarkId) ? 'DÉSÉLECTIONNÉ' : 'SÉLECTIONNÉ'}`)
      console.log(`🧪 [BENCHMARK-SELECTION] Nouvelle sélection (${newSelection.length}):`, newSelection)
      
      return newSelection
    })
  }

  // Sélectionner tous les modèles d'un type
  const selectModelsByType = (type: string) => {
    const modelsByType = models.filter((model: any) => model.type === type)
    const modelNames = modelsByType.map((model: any) => model.name)
    
    console.log(`🎯 [MODEL-SELECTION] Sélection par type "${type}":`, {
      modelsFiltered: modelsByType.length,
      modelNames
    })
    
    setSelectedModels(prev => {
      const newSelection = Array.from(new Set([...prev, ...modelNames]))
      console.log(`🎯 [MODEL-SELECTION] Nouvelle sélection complète (${newSelection.length}):`, newSelection)
      return newSelection
    })
  }

  // ****************************************************************************
  // 🎯 NOUVELLE LOGIQUE D'EXÉCUTION AVEC API MODERNE ET STREAMING
  // ****************************************************************************

  /**
   * 🚀 Exécuter les benchmarks avec streaming pour progression en temps réel
   */
  const executeBenchmarkWithNewAPI = async (benchmarkId: string, models: string[]) => {
    console.log(`🚀 [BENCHMARK-EXEC] ========== APPEL API ==========`)
    console.log(`🎯 [BENCHMARK-EXEC] BenchmarkId: ${benchmarkId}`)
    console.log(`🤖 [BENCHMARK-EXEC] Modèles (${models.length}):`, models)
    
    const requestBody = {
      benchmarkId,
      models,
      iterations: 1,
      saveResults: true,
      streaming: true
    }
    
    console.log(`📤 [BENCHMARK-EXEC] Corps de la requête:`, requestBody)
    
    try {
      // Utiliser le streaming pour avoir la progression en temps réel
      const response = await fetch('/api/benchmark/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(requestBody)
      })

      console.log(`📥 [BENCHMARK-EXEC] Réponse API - Status: ${response.status}, OK: ${response.ok}`)

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`)
      }

      // Lire le stream pour la progression en temps réel
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let finalResult = null
      let currentQuestionIndex = 0
      let totalQuestions = 0

      console.log(`📡 [BENCHMARK-EXEC] Début lecture du stream SSE...`)

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              console.log(`🏁 [BENCHMARK-EXEC] Fin du stream SSE`)
              break
            }

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            console.log(`📨 [BENCHMARK-EXEC] Chunk reçu (${lines.length} lignes):`, chunk)

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6))
                  console.log(`📡 [BENCHMARK-EXEC] SSE Event:`, data)

                  switch (data.type) {
                    case 'start':
                      totalQuestions = data.totalTests || (models.length * 6) // estimation
                      console.log(`🎬 [BENCHMARK-EXEC] START - Total questions: ${totalQuestions}`)
                      setExecutionState(prev => ({
                        ...prev,
                        totalTests: totalQuestions,
                        currentBenchmarkId: benchmarkId
                      }))
                      break

                    case 'model_start':
                      console.log(`🤖 [BENCHMARK-EXEC] MODEL_START - Modèle: ${data.model}`)
                      setExecutionState(prev => ({
                        ...prev,
                        currentModel: data.model
                      }))
                      break

                    case 'question_start':
                      console.log(`❓ [BENCHMARK-EXEC] QUESTION_START - Modèle: ${data.model}, Question: ${data.question}`)
                      setExecutionState(prev => ({
                        ...prev,
                        currentModel: data.model || prev.currentModel
                      }))
                      break

                    case 'question_complete':
                      currentQuestionIndex++
                      const progressPercent = totalQuestions > 0 
                        ? Math.round((currentQuestionIndex / totalQuestions) * 100)
                        : 0
                      
                      console.log(`✅ [BENCHMARK-EXEC] QUESTION_COMPLETE - ${currentQuestionIndex}/${totalQuestions} (${progressPercent}%)`)
                      
                      setExecutionState(prev => ({
                        ...prev,
                        completedTests: currentQuestionIndex,
                        progress: progressPercent
                      }))
                      break

                    case 'complete':
                      finalResult = data.results || data.result
                      console.log(`🎉 [BENCHMARK-EXEC] COMPLETE - Résultat final reçu`)
                      setExecutionState(prev => ({
                        ...prev,
                        progress: 100,
                        completedTests: totalQuestions
                      }))
                      break

                    case 'error':
                      console.error(`💥 [BENCHMARK-EXEC] ERROR:`, data.error)
                      throw new Error(data.error)
                      
                    default:
                      console.log(`🔍 [BENCHMARK-EXEC] Event non géré:`, data.type, data)
                  }
                } catch (e) {
                  console.warn(`🔍 [BENCHMARK-EXEC] Ligne SSE mal formée:`, line, e)
                }
              }
            }
          }
        } finally {
          reader.releaseLock()
        }
      }

      if (!finalResult) {
        console.error(`❌ [BENCHMARK-EXEC] Aucun résultat reçu via SSE`)
        throw new Error('Aucun résultat reçu via le streaming')
      }

      console.log(`✅ [BENCHMARK-EXEC] Benchmark ${benchmarkId} terminé avec succès`)
      console.log(`📊 [BENCHMARK-EXEC] Résultat final:`, finalResult)
      return finalResult
      
    } catch (error) {
      console.error(`❌ [BENCHMARK-EXEC] Erreur lors de l'exécution:`, error)
      throw error
    }
  }

  /**
   * 🎯 Lancer une série de benchmarks
   */
  const handleRunBenchmark = async () => {
    if (selectedModels.length === 0 || selectedBenchmarks.length === 0) {
      console.warn('⚠️ Aucun modèle ou benchmark sélectionné')
      return
    }

    // 📊 LOGS DÉTAILLÉS POUR DIAGNOSTIC
    console.log(`🚀 [BENCHMARK-MAIN] ========== DÉMARRAGE DES BENCHMARKS ==========`)
    console.log(`📋 [BENCHMARK-MAIN] Modèles sélectionnés (${selectedModels.length}):`, selectedModels)
    console.log(`🧪 [BENCHMARK-MAIN] Tests sélectionnés (${selectedBenchmarks.length}):`, selectedBenchmarks)
    
    // Détails des configurations
    selectedBenchmarks.forEach(benchmarkId => {
      const config = availableBenchmarks.find((b: any) => b.id === benchmarkId)
      console.log(`📝 [BENCHMARK-MAIN] Test "${benchmarkId}":`, {
        name: config?.name,
        description: config?.description,
        questionCount: config?.questionCount,
        estimatedTime: config?.estimatedTime
      })
    })
    
    // Calculer le nombre estimé de questions total
    const estimatedTotalQuestions = selectedBenchmarks.reduce((total, benchmarkId) => {
      const config = availableBenchmarks.find((b: any) => b.id === benchmarkId)
      const questions = (config?.questionCount || 6) * selectedModels.length
      console.log(`🔢 [BENCHMARK-MAIN] ${benchmarkId}: ${config?.questionCount || 6} questions × ${selectedModels.length} modèles = ${questions} questions`)
      return total + questions
    }, 0)

    console.log(`📊 [BENCHMARK-MAIN] TOTAL ESTIMÉ: ${estimatedTotalQuestions} questions`)
    console.log(`⏱️ [BENCHMARK-MAIN] Temps estimé total: ${formatTime(getTotalEstimatedTime())}`)
    console.log(`🚀 [BENCHMARK-MAIN] ========================================`)

    // Initialiser l'état d'exécution
    setExecutionState({
      isRunning: true,
      currentBenchmarkId: null,
      currentModel: null,
      progress: 0,
      completedTests: 0,
      totalTests: estimatedTotalQuestions,
      results: [],
      errors: [],
      executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      estimatedTimeRemaining: 0
    })
    
    onRunStart?.()

    try {
      const allResults: any[] = []
      let completedTests = 0

      for (const benchmarkId of selectedBenchmarks) {
        const config = availableBenchmarks.find((b: any) => b.id === benchmarkId)
        
        console.log(`🎯 [BENCHMARK-MAIN] ======= DÉBUT TEST: ${benchmarkId} =======`)
        console.log(`📝 [BENCHMARK-MAIN] Nom: ${config?.name || benchmarkId}`)
        console.log(`🤖 [BENCHMARK-MAIN] Modèles pour ce test:`, selectedModels)
        
        // Mettre à jour l'état actuel
        setExecutionState(prev => ({
          ...prev,
          currentBenchmarkId: benchmarkId,
          currentModel: selectedModels[0] || '',
        }))
        
        const startTime = Date.now()
        
        try {
          console.log(`📡 [BENCHMARK-MAIN] Envoi requête API pour ${benchmarkId}...`)
          const result = await executeBenchmarkWithNewAPI(benchmarkId, selectedModels)
          const endTime = Date.now()
          
          console.log(`✅ [BENCHMARK-MAIN] ${config?.name} terminé en ${endTime - startTime}ms`)
          console.log(`📊 [BENCHMARK-MAIN] Résultat du test:`, result)
          
          allResults.push({
            benchmarkId,
            result,
            duration: endTime - startTime,
            timestamp: new Date().toISOString()
          })
          
        } catch (error) {
          console.error(`❌ [BENCHMARK-MAIN] Erreur dans ${config?.name}:`, error)
          
          const errorResult = {
            benchmarkId,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
            duration: 0,
            timestamp: new Date().toISOString()
          }
          
          allResults.push(errorResult)
          
          // Ajouter l'erreur à l'état
          setExecutionState(prev => ({
            ...prev,
            errors: [...prev.errors, `${config?.name || benchmarkId}: ${errorResult.error}`]
          }))
        }

        completedTests++
        const progressPercent = Math.round((completedTests / selectedBenchmarks.length) * 100)
        
        console.log(`📈 [BENCHMARK-MAIN] Progression: ${completedTests}/${selectedBenchmarks.length} tests terminés (${progressPercent}%)`)
        
        // Mettre à jour le progrès
        setExecutionState(prev => ({
          ...prev,
          completedTests,
          progress: progressPercent,
          results: allResults
        }))
      }

      console.log(`🎉 [BENCHMARK-MAIN] ========== TOUS LES BENCHMARKS TERMINÉS ==========`)
      console.log(`📊 [BENCHMARK-MAIN] Résultats finaux: ${allResults.length} tests exécutés`)
      console.log(`📋 [BENCHMARK-MAIN] Détail des résultats:`, allResults)
      
      // Rafraîchir l'historique après un délai pour laisser l'API sauvegarder
      setTimeout(async () => {
        await refreshHistory()
        console.log(`🔄 [BENCHMARK-MAIN] Historique rafraîchi`)
      }, 1000)
      
      onRunComplete?.(allResults)

    } catch (error) {
      console.error('💥 [BENCHMARK-MAIN] Erreur globale:', error)
      
      setExecutionState(prev => ({
        ...prev,
        errors: [...prev.errors, `Erreur globale: ${error instanceof Error ? error.message : 'Erreur inconnue'}`]
      }))
    } finally {
      // Finaliser l'exécution
      setExecutionState(prev => ({
        ...prev,
        isRunning: false,
        currentBenchmarkId: null,
        currentModel: null
      }))
    }
  }





  /**
   * 🛑 Annuler l'exécution en cours
   */
  const handleCancelExecution = () => {
    console.log('🛑 [BENCHMARK-MAIN] Annulation de l\'exécution demandée')
    
    setExecutionState(prev => ({
      ...prev,
      isRunning: false,
      currentBenchmarkId: null,
      currentModel: null,
      errors: [...prev.errors, 'Exécution annulée par l\'utilisateur']
    }))
  }

  // Vérifier si on peut lancer les tests
  const canRunTests = !executionState.isRunning && selectedModels.length > 0 && selectedBenchmarks.length > 0

  // Formats d'affichage
  const getCurrentDisplayName = () => {
    if (executionState.currentBenchmarkId) {
      const config = availableBenchmarks.find((b: any) => b.id === executionState.currentBenchmarkId)
      return config?.name || executionState.currentBenchmarkId
    }
    return ''
  }

  return (
    <div className="space-y-8">
      {/* Section Modèles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Sélection des Modèles</h2>
            <p className="text-gray-600 mt-1">{selectedModels.length} modèle(s) sélectionné(s)</p>
          </div>
          
          {/* Boutons de sélection rapide */}
          <div className="flex space-x-2">
            <button
              onClick={() => selectModelsByType('rapide')}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors"
            >
              Rapides
            </button>
            <button
              onClick={() => selectModelsByType('medical')}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
            >
              Médicaux
            </button>
            <button
              onClick={() => selectModelsByType('general')}
              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors"
            >
              Généraux
            </button>
          </div>
        </div>

        {modelsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Chargement des modèles...</span>
          </div>
        ) : modelsError ? (
          <div className="text-red-600 p-4 bg-red-50 rounded-lg">
            Erreur lors du chargement des modèles: {modelsError.message}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model: any) => (
              <div
                key={model.name}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedModels.includes(model.name)
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => handleModelToggle(model.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{model.displayName || model.name}</h3>
                      <button
                        onClick={(e) => handleModelDetails(model, e)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        title="Voir les détails"
                      >
                        <Info className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        model.type === 'rapide' ? 'bg-green-100 text-green-700' :
                        model.type === 'medical' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {model.type}
                      </span>
                      <span className="text-xs text-gray-500">{model.parameters}</span>
                    </div>
                  </div>
                  {selectedModels.includes(model.name) && (
                    <CheckCircle className="w-5 h-5 text-blue-600 ml-2" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section Tests */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Types de Tests</h2>
            <p className="text-gray-600 mt-1">{selectedBenchmarks.length} test(s) sélectionné(s)</p>
          </div>
        </div>

        {configsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Chargement des configurations...</span>
          </div>
        ) : configsError ? (
          <div className="text-red-600 p-4 bg-red-50 rounded-lg">
            Erreur lors du chargement des configurations: {configsError.message}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableBenchmarks.map((benchmark: any) => (
            <div
              key={benchmark.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedBenchmarks.includes(benchmark.id)
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => handleBenchmarkToggle(benchmark.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{benchmark.name}</h3>
                    <button
                      onClick={(e) => handleTestDetails(benchmark.id, e)}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      title="Voir les détails du test"
                    >
                      <Info className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{benchmark.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">{formatTime(benchmark.estimatedTime)}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      benchmark.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      benchmark.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {benchmark.difficulty}
                    </span>
                  </div>
                </div>
                {selectedBenchmarks.includes(benchmark.id) && (
                  <CheckCircle className="w-5 h-5 text-blue-600 ml-2" />
                )}
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* Section Contrôles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Exécution des Tests</h3>
            <div className="flex items-center space-x-4 mt-2">
              <p className="text-sm text-gray-600">
                Temps estimé: <span className="font-medium">{formatTime(getTotalEstimatedTime())}</span>
              </p>
              {executionState.isRunning && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-600">
                    {getCurrentDisplayName()} - {executionState.progress}%
                  </span>
                </div>
              )}
              {executionState.errors.length > 0 && (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">
                    {executionState.errors.length} erreur(s)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            {executionState.isRunning ? (
              <button
                onClick={handleCancelExecution}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Square className="w-4 h-4" />
                <span>Arrêter</span>
              </button>
            ) : (
              <button
                onClick={handleRunBenchmark}
                disabled={!canRunTests}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Lancer les Tests</span>
              </button>
            )}
          </div>
        </div>

        {/* Barre de progression et informations détaillées */}
        {executionState.isRunning && (
          <div className="mt-4 space-y-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${executionState.progress}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                {executionState.completedTests} / {executionState.totalTests} questions terminées
              </span>
              <span>
                {executionState.progress}% complété
              </span>
            </div>
            
            {executionState.currentModel && (
              <div className="text-sm text-blue-600">
                Modèle en cours: <span className="font-medium">{executionState.currentModel}</span>
              </div>
            )}
          </div>
        )}

        {/* Affichage des erreurs */}
        {executionState.errors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">Erreurs détectées:</span>
            </div>
            <div className="space-y-1">
              {executionState.errors.slice(-3).map((error, index) => (
                <div key={index} className="text-xs text-red-600">
                  • {error}
                </div>
              ))}
              {executionState.errors.length > 3 && (
                <div className="text-xs text-red-500 italic">
                  ... et {executionState.errors.length - 3} autres erreurs
                </div>
              )}
            </div>
          </div>
        )}

        {/* Résumé des résultats */}
        {executionState.results.length > 0 && !executionState.isRunning && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-700">Exécution terminée:</span>
            </div>
            <div className="text-sm text-green-600">
              {executionState.results.length} benchmark(s) exécuté(s) avec succès
            </div>
          </div>
        )}
      </div>

      {/* Modal de détails du modèle */}
      <ModelDetailModal
        model={selectedModelForModal}
        isVisible={isModalVisible}
        onClose={handleCloseModal}
      />

      {/* Modal de détails du test */}
      <TestDetailModal
        testType={selectedTestForModal}
        isVisible={isTestModalVisible}
        onClose={handleCloseTestModal}
      />
    </div>
  )
}

export default BenchmarkMain

'use client'

import React, { useState, useEffect } from 'react'
import { Play, Settings, CheckCircle, Clock, AlertCircle, Info, Pause, Square } from 'lucide-react'
import { useModels, useBenchmarkHistory, useBenchmarkConfigs, useBenchmarkExecution } from '../../hooks/useApi'
import ModelDetailModalSimple from '../Modal/ModelDetailModal'
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
  const [selectedModelForDetails, setSelectedModelForDetails] = useState<string | null>(null)
  const [selectedTestForDetails, setSelectedTestForDetails] = useState<string | null>(null)
  const [showModelModal, setShowModelModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)

  // Hooks pour récupérer les données
  const { models: modelsData, isLoading: modelsLoading, error: modelsError } = useModels()
  const { configs: benchmarkConfigs, isLoading: configsLoading } = useBenchmarkConfigs()

  const availableModels = modelsData || []
  const availableBenchmarks = benchmarkConfigs || []

  // ****************************************************************************
  // 🎯 NOUVELLE LOGIQUE D'EXÉCUTION AVEC API v3.2.0 OPTIMISÉE
  // ****************************************************************************

  /**
   * 🚀 Exécuter les benchmarks avec la nouvelle API v3.2.0 (appel unique optimisé)
   */
  const executeBenchmarkWithNewAPI = async (benchmarkIds: string[], models: string[]) => {
    console.log(`🚀 [BENCHMARK-EXEC] ========== APPEL API v3.2.0 ==========`)
    console.log(`🎯 [BENCHMARK-EXEC] BenchmarkIds (${benchmarkIds.length}):`, benchmarkIds)
    console.log(`🤖 [BENCHMARK-EXEC] Modèles (${models.length}):`, models)
    
    const requestBody = {
      benchmarkIds,  // ✅ NOUVEAU: Support des benchmarks multiples
      models,
      streaming: true
    }
    
    console.log(`📤 [BENCHMARK-EXEC] Corps de la requête v3.2.0:`, requestBody)
    
    try {
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
      let completedQuestions = 0
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

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const eventData = JSON.parse(line.substring(6))
                  console.log(`📊 [BENCHMARK-EXEC] Événement SSE:`, eventData)

                  // Traitement des différents types d'événements
                  switch (eventData.type) {
                    case 'start':
                      totalQuestions = eventData.totalTests || 0
                      console.log(`🚀 [BENCHMARK-EXEC] Début benchmark - Total: ${totalQuestions} tests`)
                      setExecutionState(prev => ({
                        ...prev,
                        totalTests: totalQuestions,
                        progress: 0,
                        currentBenchmarkId: `Suite de ${benchmarkIds.length} benchmarks`,
                        currentModel: models[0] || ''
                      }))
                      break

                    case 'model_start':
                      console.log(`🤖 [BENCHMARK-EXEC] Début modèle: ${eventData.model}`)
                      setExecutionState(prev => ({
                        ...prev,
                        currentModel: eventData.model
                      }))
                      break

                    case 'series_start':
                      console.log(`📝 [BENCHMARK-EXEC] Début série: ${eventData.seriesName}`)
                      setExecutionState(prev => ({
                        ...prev,
                        currentBenchmarkId: `${eventData.model} - ${eventData.seriesName}`
                      }))
                      break

                    case 'question_complete':
                      completedQuestions++
                      const progressPercent = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0
                      console.log(`✅ [BENCHMARK-EXEC] Question terminée - Progression: ${completedQuestions}/${totalQuestions} (${progressPercent}%)`)
                      
                      setExecutionState(prev => ({
                        ...prev,
                        completedTests: completedQuestions,
                        progress: progressPercent
                      }))
                      break

                    case 'complete':
                      finalResult = eventData.results
                      console.log(`🎉 [BENCHMARK-EXEC] Benchmark terminé avec succès`)
                      break

                    case 'error':
                      console.error(`❌ [BENCHMARK-EXEC] Erreur SSE:`, eventData.error)
                      throw new Error(eventData.error)
                  }
                } catch (parseError) {
                  console.warn(`⚠️ [BENCHMARK-EXEC] Ligne SSE mal formée:`, line)
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

      console.log(`✅ [BENCHMARK-EXEC] Tous les benchmarks terminés avec succès`)
      return finalResult
      
    } catch (error) {
      console.error(`❌ [BENCHMARK-EXEC] Erreur lors de l'exécution:`, error)
      throw error
    }
  }

  /**
   * 🎯 Lancer une série de benchmarks (NOUVELLE VERSION OPTIMISÉE)
   */
  const handleRunBenchmark = async () => {
    if (selectedModels.length === 0 || selectedBenchmarks.length === 0) {
      console.warn('⚠️ Aucun modèle ou benchmark sélectionné')
      return
    }

    console.log(`🚀 [BENCHMARK-MAIN] ========== DÉMARRAGE OPTIMISÉ v3.2.0 ==========`)
    console.log(`📋 [BENCHMARK-MAIN] Modèles sélectionnés (${selectedModels.length}):`, selectedModels)
    console.log(`🧪 [BENCHMARK-MAIN] Tests sélectionnés (${selectedBenchmarks.length}):`, selectedBenchmarks)
    
    // Calculer le nombre estimé de questions total
    const estimatedTotalQuestions = selectedBenchmarks.reduce((total, benchmarkId) => {
      const config = availableBenchmarks.find((b: any) => b.id === benchmarkId)
      const questions = (config?.questionCount || 6) * selectedModels.length
      return total + questions
    }, 0)

    console.log(`📊 [BENCHMARK-MAIN] TOTAL ESTIMÉ: ${estimatedTotalQuestions} questions`)
    console.log(`🚀 [BENCHMARK-MAIN] *** APPEL UNIQUE API v3.2.0 ***`)

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
      const startTime = Date.now()
      
      console.log(`📡 [BENCHMARK-MAIN] ✨ APPEL API UNIQUE POUR TOUS LES BENCHMARKS ✨`)
      // ✅ NOUVELLE APPROCHE: UN SEUL APPEL POUR TOUS LES BENCHMARKS
      const result = await executeBenchmarkWithNewAPI(selectedBenchmarks, selectedModels)
      
      const endTime = Date.now()
      const totalDuration = endTime - startTime
      
      console.log(`✅ [BENCHMARK-MAIN] TOUS LES BENCHMARKS TERMINÉS en ${totalDuration}ms`)
      console.log(`📊 [BENCHMARK-MAIN] Résultat global:`, result)
      
      // Mettre à jour l'état final
      setExecutionState(prev => ({
        ...prev,
        isRunning: false,
        progress: 100,
        currentBenchmarkId: null,
        currentModel: null,
        results: [result]
      }))
      
      onRunComplete?.(result)
      
    } catch (error) {
      console.error(`❌ [BENCHMARK-MAIN] Erreur globale:`, error)
      setExecutionState(prev => ({
        ...prev,
        isRunning: false,
        errors: [...prev.errors, error instanceof Error ? error.message : 'Erreur inconnue']
      }))
    }
  }

  // ****************************************************************************
  // 🎯 FONCTIONS D'INTERFACE ET UTILITAIRES
  // ****************************************************************************

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  const getTotalEstimatedTime = (): number => {
    return selectedBenchmarks.reduce((total, benchmarkId) => {
      const config = availableBenchmarks.find((b: any) => b.id === benchmarkId)
      return total + (config?.estimatedTime || 30) * selectedModels.length
    }, 0)
  }

  const handleModelToggle = (modelName: string) => {
    setSelectedModels(prev => 
      prev.includes(modelName)
        ? prev.filter(m => m !== modelName)
        : [...prev, modelName]
    )
  }

  const handleBenchmarkToggle = (benchmarkId: string) => {
    setSelectedBenchmarks(prev => 
      prev.includes(benchmarkId)
        ? prev.filter(b => b !== benchmarkId)
        : [...prev, benchmarkId]
    )
  }

  const selectAllModels = () => {
    const availableModelNames = availableModels
      .filter((model: any) => model.status === 'ready')
      .map((model: any) => model.name)
    setSelectedModels(availableModelNames)
  }

  const selectAllBenchmarks = () => {
    setSelectedBenchmarks(availableBenchmarks.map((b: any) => b.id))
  }

  // Sélectionner tous les modèles d'un type (fonction de l'ancien design)
  const selectModelsByType = (type: string) => {
    const modelsByType = availableModels.filter((model: any) => model.type === type && model.status === 'ready')
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

  // Fonction pour obtenir la couleur du type de modèle
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'medical': return 'bg-blue-100 text-blue-800'
      case 'rapide': return 'bg-green-100 text-green-800'
      case 'general': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'medical': return 'Médical'
      case 'rapide': return 'Rapide'
      case 'general': return 'Général'
      default: return type
    }
  }

  if (modelsLoading || configsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des configurations...</p>
        </div>
      </div>
    )
  }

  if (modelsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">Erreur lors du chargement des modèles: {modelsError.message}</span>
        </div>
      </div>
    )
  }

  const loadedModels = availableModels.filter((model: any) => model.status === 'ready')

  return (
    <div className="space-y-8">

      {/* Sélection des modèles */}
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
            <button
              onClick={selectAllModels}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              Tout sélectionner
            </button>
          </div>
        </div>
        
        {loadedModels.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>Aucun modèle chargé disponible</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadedModels.map((model: any) => (
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
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(model.type)}`}>
                        {getTypeLabel(model.type)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="font-medium">{model.family}</span>
                        <span className="mx-1">•</span>
                        <span>{model.size}</span>
                      </div>
                      {model.benchmarkScore && (
                        <div className="flex items-center text-xs text-green-600">
                          <span className="font-medium">Score: {model.benchmarkScore}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedModelForDetails(model.name)
                        setShowModelModal(true)
                      }}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    {selectedModels.includes(model.name) && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {selectedModels.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>{selectedModels.length}</strong> modèle(s) sélectionné(s)
            </p>
          </div>
        )}
      </div>

      {/* Sélection des benchmarks */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Types de Tests</h2>
            <p className="text-gray-600 mt-1">{selectedBenchmarks.length} test(s) sélectionné(s)</p>
          </div>
          <button
            onClick={selectAllBenchmarks}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            Tout sélectionner
          </button>
        </div>
        
        {availableBenchmarks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>Aucun benchmark disponible</p>
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
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        benchmark.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        benchmark.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {benchmark.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{benchmark.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{formatTime(benchmark.estimatedTime * selectedModels.length)}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>{benchmark.questionCount} questions</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-3 flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTestForDetails(benchmark.id)
                        setShowTestModal(true)
                      }}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    {selectedBenchmarks.includes(benchmark.id) && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {selectedBenchmarks.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>{selectedBenchmarks.length}</strong> test(s) sélectionné(s) • 
              Temps estimé total: <strong>{formatTime(getTotalEstimatedTime())}</strong>
            </p>
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
                    {executionState.progress}%
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
            <button
              onClick={handleRunBenchmark}
              disabled={executionState.isRunning || selectedModels.length === 0 || selectedBenchmarks.length === 0}
              className={`px-6 py-2 rounded-lg font-medium text-white transition-colors flex items-center space-x-2 ${
                executionState.isRunning || selectedModels.length === 0 || selectedBenchmarks.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {executionState.isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Exécution en cours...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Lancer les Tests</span>
                </>
              )}
            </button>
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
            
            {executionState.currentBenchmarkId && (
              <div className="text-sm text-blue-600">
                Test en cours: <span className="font-medium">{executionState.currentBenchmarkId}</span>
              </div>
            )}
            
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

      {/* Modals */}
      {showModelModal && selectedModelForDetails && (
        <ModelDetailModalSimple
          model={availableModels.find((m: any) => m.name === selectedModelForDetails)}
          isVisible={showModelModal}
          onClose={() => {
            setShowModelModal(false)
            setSelectedModelForDetails(null)
          }}
        />
      )}

      {showTestModal && selectedTestForDetails && (
        <TestDetailModal
          testType={selectedTestForDetails}
          isVisible={showTestModal}
          onClose={() => {
            setShowTestModal(false)
            setSelectedTestForDetails(null)
          }}
        />
      )}
    </div>
  )
}

export default BenchmarkMain

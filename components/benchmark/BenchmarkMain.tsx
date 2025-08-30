'use client'

import React, { useState, useEffect } from 'react'
import { Play, Settings, CheckCircle, Clock, AlertCircle, Info } from 'lucide-react'
import { useModels, useBenchmarkHistory, useBenchmarkOperations, useBenchmarkConfigs } from '../../hooks/useApi'
import ModelDetailModal from '../Modal/ModelDetailModal'
import TestDetailModal from '../Modal/TestDetailModal'

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
  // États
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<string[]>(['smoke_test'])
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTest, setCurrentTest] = useState<string>('')
  const [selectedModelForModal, setSelectedModelForModal] = useState<any>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedTestForModal, setSelectedTestForModal] = useState<string | null>(null)
  const [isTestModalVisible, setIsTestModalVisible] = useState(false)

  // Hooks API
  const { models, isLoading: modelsLoading, error: modelsError } = useModels()
  const { benchmarks, refresh: refreshHistory } = useBenchmarkHistory()
  const { executeBenchmark } = useBenchmarkOperations()
  const { configs: availableBenchmarks, isLoading: configsLoading, error: configsError } = useBenchmarkConfigs()

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
    setSelectedModels(prev => 
      prev.includes(modelName)
        ? prev.filter(m => m !== modelName)
        : [...prev, modelName]
    )
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
    setSelectedBenchmarks(prev => 
      prev.includes(benchmarkId)
        ? prev.filter(b => b !== benchmarkId)
        : [...prev, benchmarkId]
    )
  }

  // Sélectionner tous les modèles d'un type
  const selectModelsByType = (type: string) => {
    const modelsByType = models.filter((model: any) => model.type === type)
    const modelNames = modelsByType.map((model: any) => model.name)
    setSelectedModels(prev => Array.from(new Set([...prev, ...modelNames])))
  }

  // Exécuter les benchmarks
  const handleRunBenchmark = async () => {
    if (selectedModels.length === 0 || selectedBenchmarks.length === 0) {
      console.warn('⚠️ Aucun modèle ou benchmark sélectionné')
      return
    }

    setIsRunning(true)
    setProgress(0)
    setCurrentTest('')
    
    console.log(`🚀 Démarrage des benchmarks:`)
    console.log(`- Modèles: ${selectedModels.join(', ')}`)
    console.log(`- Tests: ${selectedBenchmarks.join(', ')}`)
    
    onRunStart?.()

    try {
      const totalTests = selectedBenchmarks.length
      let completedTests = 0
      const allResults = []

      for (const benchmarkId of selectedBenchmarks) {
        const config = availableBenchmarks.find((b: any) => b.id === benchmarkId)
        setCurrentTest(config?.name || benchmarkId)
        
        console.log(`🔧 Exécution: ${config?.name || benchmarkId}`)
        
        const startTime = Date.now()
        
        try {
          const result = await executeBenchmark(selectedModels, [])
          const endTime = Date.now()
          
          allResults.push({
            benchmarkId,
            result,
            duration: endTime - startTime
          })
          
          console.log(`✅ ${config?.name} terminé en ${endTime - startTime}ms`)
          
        } catch (error) {
          console.error(`❌ Erreur dans ${config?.name}:`, error)
          allResults.push({
            benchmarkId,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
            duration: 0
          })
        }

        completedTests++
        setProgress(Math.round((completedTests / totalTests) * 100))
      }

      console.log(`🎉 Tous les benchmarks terminés!`)
      console.log(`📊 Résultats: ${allResults.length} tests exécutés`)
      
      // Rafraîchir l'historique
      await refreshHistory()
      
      onRunComplete?.(allResults)

    } catch (error) {
      console.error('💥 Erreur globale:', error)
    } finally {
      setIsRunning(false)
      setProgress(0)
      setCurrentTest('')
    }
  }

  // Test smoke rapide
  const handleQuickSmokeTest = async () => {
    if (selectedModels.length === 0) {
      console.warn('⚠️ Aucun modèle sélectionné pour le test smoke')
      return
    }

    console.log(`⚡ Test smoke rapide: ${selectedModels.join(', ')}`)
    
    // Temporairement sélectionner seulement le smoke test
    const originalSelection = selectedBenchmarks
    setSelectedBenchmarks(['smoke_test'])
    
    await handleRunBenchmark()
    
    // Restaurer la sélection originale
    setSelectedBenchmarks(originalSelection)
  }

  // Vérifier si on peut lancer les tests
  const canRunTests = !isRunning && selectedModels.length > 0 && selectedBenchmarks.length > 0

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
              {isRunning && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-600">
                    {currentTest && `${currentTest} - `}{progress}%
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleQuickSmokeTest}
              disabled={!canRunTests || selectedModels.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Test Rapide</span>
            </button>

            <button
              onClick={handleRunBenchmark}
              disabled={!canRunTests}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Lancer les Tests</span>
            </button>
          </div>
        </div>

        {/* Barre de progression */}
        {isRunning && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
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

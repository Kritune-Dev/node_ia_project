'use client'

import { useState, useEffect } from 'react'
import { X, Target, Thermometer, Shuffle, Clock, MessageSquare, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'

interface TestDetailModalProps {
  testType: string | null
  isVisible: boolean
  onClose: () => void
}

interface BenchmarkConfig {
  id: string
  name: string
  description: string
  estimatedTime: number
  questionCount: number
  difficulty: string
  category: string
  version: string
  testTypes: string[]
  questions: Array<{
    id: string
    text: string
    category?: string
    difficulty?: string
    expectedType?: string
    keywords?: string[]
    maxResponseLength?: number
  }>
  parameters: {
    temperature: number
    timeout: number
    maxTokens?: number
    seed?: number | null
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
  }
  scoring: {
    [key: string]: number
  }
  prompts?: {
    system?: string
    evaluation?: string
  }
}

export default function TestDetailModal({ testType, isVisible, onClose }: TestDetailModalProps) {
  const [config, setConfig] = useState<BenchmarkConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Récupérer la configuration depuis l'API
  useEffect(() => {
    if (!isVisible || !testType) {
      setConfig(null)
      return
    }

    const fetchConfig = async () => {
      setLoading(true)
      setError(null)
      
      try {
        console.log(`🔍 [MODAL] Récupération config pour ${testType}`)
        
        const response = await fetch('/api/benchmark/configs')
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Échec de récupération des configurations')
        }
        
        // Trouver la configuration spécifique
        const foundConfig = data.configs.find((config: any) => config.id === testType)
        
        if (!foundConfig) {
          throw new Error(`Configuration non trouvée pour ${testType}`)
        }
        
        setConfig(foundConfig)
        console.log(`✅ [MODAL] Configuration récupérée:`, foundConfig)
        
      } catch (err) {
        console.error(`💥 [MODAL] Erreur:`, err)
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [testType, isVisible])

  if (!isVisible || !testType) return null

  const getTestDisplayInfo = (type: string) => {
    const typeMap: Record<string, { icon: typeof Target, color: string, fallbackName: string }> = {
      'smoke_test': { icon: Target, color: 'green', fallbackName: 'Test Smoke' },
      'medical_test': { icon: Clock, color: 'blue', fallbackName: 'Test Médical' },
      'general_knowledge': { icon: MessageSquare, color: 'purple', fallbackName: 'Connaissances Générales' },
      'coding_test': { icon: CheckCircle, color: 'orange', fallbackName: 'Test de Code' }
    }
    
    return typeMap[type] || { icon: Target, color: 'gray', fallbackName: 'Test Inconnu' }
  }

  const displayInfo = getTestDisplayInfo(testType)
  const IconComponent = displayInfo.icon

  const getComplexityFromQuestions = (questionCount: number) => {
    if (questionCount <= 3) return { text: 'Faible', color: 'text-green-600 bg-green-100' }
    if (questionCount <= 5) return { text: 'Moyenne', color: 'text-yellow-600 bg-yellow-100' }
    if (questionCount <= 7) return { text: 'Élevée', color: 'text-orange-600 bg-orange-100' }
    return { text: 'Très Élevée', color: 'text-red-600 bg-red-100' }
  }

  const getEstimatedDuration = (questionCount: number, timeout: number) => {
    const totalTime = (questionCount * timeout) / 1000 // en secondes
    if (totalTime < 60) return `${Math.round(totalTime)}s`
    if (totalTime < 3600) return `${Math.round(totalTime / 60)}min`
    return `${Math.round(totalTime / 3600)}h`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg bg-${displayInfo.color}-100`}>
              <IconComponent className={`h-8 w-8 text-${displayInfo.color}-600`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {config?.name || displayInfo.fallbackName}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {config?.description || `Configuration ${testType}`}
              </p>
              {config && (
                <div className="flex items-center gap-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getComplexityFromQuestions(config.questions.length).color}`}>
                    {getComplexityFromQuestions(config.questions.length).text}
                  </span>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {getEstimatedDuration(config.questions.length, config.parameters.timeout)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white hover:bg-opacity-70 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Chargement de la configuration...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Erreur de chargement</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {config && (
            <div className="space-y-6">
              {/* Paramètres de test */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-orange-500" />
                  Paramètres de test
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="w-4 h-4 text-orange-600" />
                      <div className="text-sm text-orange-600">Température</div>
                    </div>
                    <div className="text-xl font-bold text-orange-900">{config.parameters.temperature}</div>
                    <div className="text-xs text-orange-700">Créativité des réponses</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Shuffle className="w-4 h-4 text-purple-600" />
                      <div className="text-sm text-purple-600">Seed</div>
                    </div>
                    <div className="text-xl font-bold text-purple-900">{config.parameters.seed || 'Aléatoire'}</div>
                    <div className="text-xs text-purple-700">Reproductibilité</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <div className="text-sm text-blue-600">Timeout</div>
                    </div>
                    <div className="text-xl font-bold text-blue-900">{Math.round(config.parameters.timeout / 1000)}s</div>
                    <div className="text-xs text-blue-700">Limite de temps</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                      <div className="text-sm text-green-600">Max Tokens</div>
                    </div>
                    <div className="text-xl font-bold text-green-900">{config.parameters.maxTokens || 500}</div>
                    <div className="text-xs text-green-700">Limite de longueur</div>
                  </div>
                </div>
              </div>

              {/* Informations supplémentaires */}
              {(config.version || config.testTypes) && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-500" />
                    Informations du test
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {config.version && (
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <div className="text-sm text-indigo-600 mb-1">Version</div>
                        <div className="font-bold text-indigo-900">{config.version}</div>
                      </div>
                    )}
                    {config.testTypes && (
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <div className="text-sm text-indigo-600 mb-1">Types de test</div>
                        <div className="font-bold text-indigo-900">{config.testTypes.join(', ')}</div>
                      </div>
                    )}
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                      <div className="text-sm text-indigo-600 mb-1">Complexité</div>
                      <div className="font-bold text-indigo-900">{config.difficulty}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Questions de test */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  Questions de test ({config.questions.length})
                </h3>
                <div className="space-y-3">
                  {config.questions.map((question, index) => (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800">{question.text}</p>
                          {(question.category || question.difficulty) && (
                            <div className="flex gap-2 mt-2">
                              {question.category && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                  {question.category}
                                </span>
                              )}
                              {question.difficulty && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                  {question.difficulty}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Critères de scoring */}
              {config.scoring && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-500" />
                    Système de notation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(config.scoring).map(([criterion, score]) => (
                      <div key={criterion} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                          <span className="text-purple-800 font-medium capitalize">{criterion.replace(/([A-Z])/g, ' $1')}</span>
                        </div>
                        <span className="text-purple-900 font-bold">{score} pts</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Système d'évaluation</span>
                    </div>
                    <div className="text-sm text-green-700 mt-2">
                      Les réponses sont évaluées selon plusieurs critères avec des scores spécifiques.
                      Plus le score est élevé, meilleure est la performance du modèle.
                    </div>
                  </div>
                </div>
              )}

              {/* Conseils d'optimisation */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-800">
                  <AlertTriangle className="w-5 h-5" />
                  Conseils d'utilisation
                </h3>
                <div className="text-sm text-blue-700 space-y-2">
                  {testType === 'smoke_test' && (
                    <>
                      <p>• Ce test est idéal pour vérifier rapidement qu'un modèle fonctionne correctement</p>
                      <p>• Utilisez-le comme premier test avant des évaluations plus poussées</p>
                      <p>• Un taux de réussite inférieur à 80% indique des problèmes de base</p>
                    </>
                  )}
                  {testType === 'general_knowledge' && (
                    <>
                      <p>• Ce test évalue la créativité et le raisonnement complexe</p>
                      <p>• Les résultats peuvent varier selon la température utilisée</p>
                      <p>• Analysez la cohérence et la pertinence des réponses</p>
                    </>
                  )}
                  {testType === 'medical_test' && (
                    <>
                      <p>• Test le plus exigeant, utilise de vraies données complexes</p>
                      <p>• Prend plus de temps mais donne les résultats les plus réalistes</p>
                      <p>• Essentiel pour valider les performances en production</p>
                    </>
                  )}
                  <p>• Configuration récupérée dynamiquement depuis l'API centralisée</p>
                  <p>• Les paramètres peuvent être ajustés dans benchmark-configs.json</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

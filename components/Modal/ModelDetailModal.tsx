'use client'

import { useState } from 'react'
import { 
  X, FileText, Settings, Brain, Globe, Zap, Star, Calendar, Target, 
  Github, ExternalLink, Clock, Trophy, BarChart3, 
  CheckCircle, AlertCircle, Play, History, TestTube, Award, Plus
} from 'lucide-react'
import { useModel, useModelBenchmarkData, useBenchmarkConfigs } from '../../hooks/useApi'
import { useModelConfig } from '../../hooks/useModelConfig'

interface SeriesScore {
  score: number
  comment: string
  timestamp: string
}

interface ModelDetailModalProps {
  model: any
  isVisible: boolean
  onClose: () => void
}

// Composant pour afficher et éditer le score d'une série
function SeriesScoreDisplay({ 
  seriesId, 
  score, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel,
  onDelete 
}: {
  seriesId: string
  score?: SeriesScore
  isEditing: boolean
  onEdit: () => void
  onSave: (score: number, comment: string) => void
  onCancel: () => void
  onDelete: () => void
}) {
  const [tempScore, setTempScore] = useState(score?.score || 0)
  const [tempComment, setTempComment] = useState(score?.comment || '')

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <input
          type="number"
          min="0"
          max="10"
          step="0.1"
          value={tempScore}
          onChange={(e) => setTempScore(parseFloat(e.target.value) || 0)}
          className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
        />
        <span>/10</span>
        <input
          type="text"
          placeholder="Commentaire..."
          value={tempComment}
          onChange={(e) => setTempComment(e.target.value)}
          className="w-32 px-2 py-1 border border-gray-300 rounded"
        />
        <button
          onClick={() => onSave(tempScore, tempComment)}
          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
        >
          ✓
        </button>
        <button
          onClick={onCancel}
          className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
        >
          ✕
        </button>
      </div>
    )
  }

  if (score) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-yellow-500" />
          <span className="font-medium text-yellow-600">{score.score}/10</span>
        </div>
        {score.comment && (
          <span className="text-gray-600 italic text-xs">"{score.comment}"</span>
        )}
        <button
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-800 text-xs"
        >
          ✏️
        </button>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800 text-xs"
        >
          🗑️
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={onEdit}
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600"
    >
      <Plus className="h-3 w-3" />
      Noter
    </button>
  )
}

export default function ModelDetailModalSimple({ model, isVisible, onClose }: ModelDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'infos' | 'benchmarks' | 'history' | 'config'>('infos')
  const [runningBenchmarks, setRunningBenchmarks] = useState<Set<string>>(new Set())
  const [scoringMode, setScoringMode] = useState<{ [key: string]: boolean }>({}) // Pour gérer l'affichage du formulaire de score

  const { model: completeData, isLoading: loading, error } = useModel(
    isVisible && model ? model.name : null
  )

  const { 
    data: benchmarkData, 
    isLoading: benchmarkLoading, 
    error: benchmarkError,
    mutate: refreshBenchmarkData
  } = useModelBenchmarkData(isVisible && model ? model.name : null)

  const { configs: benchmarkConfigs } = useBenchmarkConfigs()

  // Fonctions pour gérer les scores (intégrées dans l'API benchmark)
  const updateScore = async (seriesId: string, score: number, comment: string) => {
    if (!model?.name) return

    const response = await fetch(`/api/models/${encodeURIComponent(model.name)}/benchmark`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'scores',
        scores: {
          [seriesId]: {
            score,
            comment,
            isAutomatic: false,
            scoredBy: 'user',
            scoredAt: new Date().toISOString()
          }
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Erreur mise à jour score: ${response.status}`)
    }

    const result = await response.json()
    
    // Rafraîchir les données
    refreshBenchmarkData()
    
    return result
  }

  const deleteScore = async (seriesId: string) => {
    if (!model?.name) return

    const response = await fetch(`/api/models/${encodeURIComponent(model.name)}/benchmark?series=${encodeURIComponent(seriesId)}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error(`Erreur suppression score: ${response.status}`)
    }

    const result = await response.json()
    
    // Rafraîchir les données
    refreshBenchmarkData()
    
    return result
  }

  const { 
    config: modelConfig, 
    isConfigured, 
    loading: configLoading, 
    error: configError
  } = useModelConfig(isVisible && model ? model.name : null)

  if (!isVisible || !model) return null

  const getServiceIcon = (service: any) => {
    if (service?.isNative) {
      return <Zap className="h-4 w-4 text-yellow-500" />
    }
    return service?.type === 'docker' ? 
      <Brain className="h-4 w-4 text-blue-500" /> : 
      <Globe className="h-4 w-4 text-gray-500" />
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'medical': return 'bg-red-100 text-red-800'
      case 'rapide': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'medical': return 'Médical'
      case 'rapide': return 'Rapide'
      default: return 'Général'
    }
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}min`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const tabs = [
    { id: 'infos', label: 'Informations', icon: FileText },
    { id: 'benchmarks', label: 'Benchmarks', icon: TestTube },
    { id: 'history', label: 'Historique', icon: History },
    { id: 'config', label: 'Configuration', icon: Settings }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${completeData?.type === 'medical' ? 'bg-red-100' : completeData?.type === 'rapide' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
              {completeData?.type === 'medical' ? 
                <FileText className={`h-8 w-8 text-red-600`} /> :
                <Brain className={`h-8 w-8 ${completeData?.type === 'rapide' ? 'text-yellow-600' : 'text-blue-600'}`} />
              }
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {completeData?.displayName || model.displayName || model.name}
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getTypeColor(completeData?.type || 'general')}`}>
                  {getTypeLabel(completeData?.type || 'general')}
                </span>
                {completeData?.isRapid && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Rapide
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-500">{model.name}</p>
              {completeData && (
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    Paramètres: {completeData.parameters}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Famille: {completeData.family}
                  </span>
                  {benchmarkData && (
                    <span className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-green-500" />
                      Tests: {benchmarkData.history?.length || 0}
                    </span>
                  )}
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

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Chargement des données...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-600 mb-2">Erreur lors du chargement</div>
              <div className="text-gray-600">{error}</div>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Onglet Informations */}
              {activeTab === 'infos' && completeData && (
                <div className="space-y-6">
                  {/* Description */}
                  {completeData.description && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Description</h3>
                      <p className="text-gray-700 leading-relaxed">{completeData.description}</p>
                    </div>
                  )}

                  {/* Spécifications */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Spécifications</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500">Paramètres</div>
                        <div className="font-medium">{completeData.parameters}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500">Famille</div>
                        <div className="font-medium">{completeData.family}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500">Type</div>
                        <div className="font-medium">{getTypeLabel(completeData.type)}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500">Statut</div>
                        <div className="font-medium text-green-600">{completeData.status}</div>
                      </div>
                    </div>
                  </div>

                  {/* Spécialités */}
                  {completeData.specialties && completeData.specialties.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Spécialités</h3>
                      <div className="flex flex-wrap gap-2">
                        {completeData.specialties.map((specialty: string, index: number) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Métriques */}
                  {completeData.metrics && Object.keys(completeData.metrics).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Métriques de performance</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(completeData.metrics).map(([key, value]) => (
                          <div key={key} className="bg-green-50 p-3 rounded-lg">
                            <div className="text-sm text-green-600 capitalize">{key.replace('_', ' ')}</div>
                            <div className="font-medium">{String(value)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Links */}
                  {(completeData.github || completeData.website) && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Liens externes</h3>
                      <div className="flex gap-3">
                        {completeData.github && (
                          <a 
                            href={completeData.github} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            <Github className="w-4 h-4" />
                            GitHub
                          </a>
                        )}
                        {completeData.website && (
                          <a 
                            href={completeData.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Site web
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Benchmarks */}
              {activeTab === 'benchmarks' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Séries de tests disponibles</h3>
                    {benchmarkData && (
                      <div className="text-sm text-gray-500">
                        {Object.keys(benchmarkData.resultsSummary || {}).length} séries testées
                      </div>
                    )}
                  </div>

                  {benchmarkLoading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Chargement...</span>
                    </div>
                  )}

                  {/* Configurations de benchmark disponibles */}
                  <div>
                    <h4 className="font-medium mb-3 text-gray-900">Benchmarks disponibles</h4>
                    <div className="space-y-3">
                      {benchmarkConfigs.map((config: any) => {
                        // Logique de correspondance plus flexible
                        const findMatchingResult = () => {
                          if (!benchmarkData?.resultsSummary) return null
                          
                          // Correspondances exactes basées sur les données observées
                          const keyMappings: { [key: string]: string } = {
                            'smoke_test': 'test_rapide__smoke_',
                            'medical_test': 'tests_m_dicaux',
                            'general_knowledge': 'connaissances_g_n_rales',
                            'coding_test': 'tests_de_programmation'
                          }
                          
                          // Chercher une correspondance exacte dans notre mapping
                          const mappedKey = keyMappings[config.id]
                          if (mappedKey && benchmarkData.resultsSummary[mappedKey]) {
                            return { key: mappedKey, data: benchmarkData.resultsSummary[mappedKey] }
                          }
                          
                          // Fallback: chercher avec l'ID original ou transformé
                          const fallbackKeys = [
                            config.id,
                            config.id.replace(/[^a-zA-Z0-9]/g, '_')
                          ]
                          
                          for (const key of fallbackKeys) {
                            if (benchmarkData.resultsSummary[key]) {
                              return { key: key, data: benchmarkData.resultsSummary[key] }
                            }
                          }
                          
                          return null
                        }
                        
                        const matchingResult = findMatchingResult()
                        const hasBeenTested = !!matchingResult
                        const currentScore = benchmarkData?.scores?.[config.id] || null
                        const isShowingScoreForm = scoringMode[config.id] || false
                        
                        return (
                          <div key={config.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {hasBeenTested ? (
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                  )}
                                  <div>
                                    <h5 className="font-medium text-gray-900">{config.name}</h5>
                                    <p className="text-sm text-gray-600">{config.description}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-6 text-sm text-gray-500 ml-8">
                                  <span className="flex items-center gap-1">
                                    <TestTube className="w-4 h-4" />
                                    {config.questions?.length || config.questionCount || 0} questions
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    ~{config.estimatedTime || 0}s
                                  </span>
                                  
                                  {/* Composant de scoring intégré */}
                                  {hasBeenTested && (
                                    <SeriesScoreDisplay
                                      seriesId={config.id}
                                      score={currentScore}
                                      isEditing={isShowingScoreForm}
                                      onEdit={() => setScoringMode(prev => ({ ...prev, [config.id]: true }))}
                                      onSave={async (score, comment) => {
                                        await updateScore(config.id, score, comment)
                                        setScoringMode(prev => ({ ...prev, [config.id]: false }))
                                      }}
                                      onCancel={() => setScoringMode(prev => ({ ...prev, [config.id]: false }))}
                                      onDelete={async () => {
                                        await deleteScore(config.id)
                                      }}
                                    />
                                  )}
                                  
                                  {hasBeenTested && matchingResult && (
                                    <>
                                      <span className="flex items-center gap-1">
                                        <Trophy className="w-4 h-4 text-green-500" />
                                        Dernier test: <strong className="text-green-600">{matchingResult.data?.lastScore || 'N/A'}%</strong>
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {matchingResult.data?.lastExecution 
                                          ? formatDate(matchingResult.data.lastExecution)
                                          : 'N/A'
                                        }
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 ml-4">
                                {hasBeenTested && (
                                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                    Testé
                                  </span>
                                )}
                                
                                <button
                                onClick={async () => {
                                  console.log(`Lancement du benchmark: ${config.id} pour le modèle: ${model.name}`)
                                  
                                  // Marquer ce benchmark comme en cours d'exécution
                                  setRunningBenchmarks(prev => new Set(prev).add(config.id))
                                  
                                  try {
                                    // Préparer la requête pour l'API de benchmark
                                    const benchmarkRequest = {
                                      benchmarkIds: [config.id],
                                      models: [model.name],
                                      streaming: false // Pour l'instant, sans streaming
                                    }
                                    
                                    console.log('Envoi de la requête:', benchmarkRequest)
                                    
                                    // Appel de l'API d'exécution de benchmark
                                    const response = await fetch('/api/benchmark/execute', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify(benchmarkRequest)
                                    })
                                    
                                    if (!response.ok) {
                                      const errorData = await response.json()
                                      console.error('Erreur lors du lancement:', errorData)
                                      // TODO: Afficher une notification d'erreur
                                      return
                                    }
                                    
                                    const result = await response.json()
                                    console.log('Benchmark lancé avec succès:', result)
                                    
                                    // Rafraîchir les données du benchmark après exécution
                                    refreshBenchmarkData()
                                    
                                    // TODO: Afficher une notification de succès
                                    // TODO: Possiblement rediriger vers la page de résultats
                                    
                                  } catch (error) {
                                    console.error('Erreur lors du lancement du benchmark:', error)
                                    // TODO: Afficher une notification d'erreur
                                  } finally {
                                    // Retirer ce benchmark de la liste des benchmarks en cours
                                    setRunningBenchmarks(prev => {
                                      const newSet = new Set(prev)
                                      newSet.delete(config.id)
                                      return newSet
                                    })
                                  }
                                }}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                  runningBenchmarks.has(config.id)
                                    ? 'bg-orange-100 text-orange-700 cursor-not-allowed'
                                    : hasBeenTested 
                                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                                disabled={runningBenchmarks.has(config.id)}
                              >
                                <div className="flex items-center gap-2">
                                  {runningBenchmarks.has(config.id) ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                                      En cours...
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-4 h-4" />
                                      {hasBeenTested ? 'Relancer' : 'Lancer'}
                                    </>
                                  )}
                                </div>
                              </button>
                            </div>
                          </div>
                          
                          {/* Formulaire de scoring (affiché quand activé) */}
                          {isShowingScoreForm && (
                            <div className="border-t border-gray-200 p-4 bg-gray-50">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2">Noter : {config.name}</h4>
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="text-sm text-gray-700">Score :</span>
                                    {[1,2,3,4,5,6,7,8,9,10].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        className={`w-6 h-6 transition-colors ${
                                          star <= (currentScore?.score || 0)
                                            ? 'text-yellow-400 hover:text-yellow-500' 
                                            : 'text-gray-300 hover:text-yellow-300'
                                        }`}
                                        onClick={() => {
                                          const newScore = star === currentScore?.score ? 0 : star
                                          updateScore(config.id, newScore, currentScore?.comment || '')
                                            .then(() => setScoringMode(prev => ({ ...prev, [config.id]: false })))
                                            .catch(console.error)
                                        }}
                                      >
                                        <Star 
                                          className="w-full h-full" 
                                          fill={star <= (currentScore?.score || 0) ? 'currentColor' : 'none'}
                                        />
                                      </button>
                                    ))}
                                    <span className="ml-2 text-sm font-medium">
                                      {currentScore?.score || 0}/10
                                    </span>
                                  </div>
                                  <textarea
                                    placeholder="Commentaire (optionnel)..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
                                    rows={2}
                                    defaultValue={currentScore?.comment || ''}
                                    onBlur={(e) => {
                                      if (currentScore?.score) {
                                        updateScore(config.id, currentScore.score, e.target.value)
                                          .catch(console.error)
                                      }
                                    }}
                                  />
                                  <div className="flex justify-end gap-2 mt-3">
                                    <button
                                      onClick={() => setScoringMode(prev => ({ ...prev, [config.id]: false }))}
                                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        )
                      })}
                    </div>
                  </div>

                  {benchmarkData?.resultsSummary && Object.keys(benchmarkData.resultsSummary).length === 0 && (
                    <div className="text-center py-8">
                      <TestTube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <div className="text-gray-600 mb-2">Aucun benchmark effectué</div>
                      <div className="text-sm text-gray-500">
                        Ce modèle n'a pas encore été testé avec les benchmarks disponibles
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Historique */}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Historique des tests</h3>
                    {benchmarkData?.history && (
                      <div className="text-sm text-gray-500">
                        {benchmarkData.history.length} test(s) effectué(s)
                      </div>
                    )}
                  </div>

                  {benchmarkLoading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Chargement...</span>
                    </div>
                  )}

                  {benchmarkData?.history && benchmarkData.history.length > 0 ? (
                    <div className="space-y-4">
                      {benchmarkData.history.map((test: any, index: number) => (
                        <div key={test.benchmarkId || index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900">{test.name}</h4>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {formatDate(test.timestamp)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formatTime(test.duration)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-semibold ${test.successRate === 100 ? 'text-green-600' : test.successRate >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {test.successRate}%
                              </div>
                              <div className="text-sm text-gray-500">Succès</div>
                            </div>
                          </div>

                          {test.isCombinedBenchmark && test.includedBenchmarkNames && (
                            <div className="mb-3">
                              <div className="text-sm text-gray-600 mb-1">Séries incluses:</div>
                              <div className="flex flex-wrap gap-1">
                                {test.includedBenchmarkNames.map((name: string, idx: number) => (
                                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-gray-500">Questions</div>
                              <div className="font-medium">{test.questions?.length || 0}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Temps moyen</div>
                              <div className="font-medium">
                                {test.questions ? formatTime(test.questions.reduce((acc: number, q: any) => acc + (q.responseTime || 0), 0) / test.questions.length) : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">Tokens/sec</div>
                              <div className="font-medium">
                                {test.questions ? 
                                  (test.questions.reduce((acc: number, q: any) => acc + (q.tokensPerSecond || 0), 0) / test.questions.length).toFixed(1)
                                  : 'N/A'
                                }
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">ID Benchmark</div>
                              <div className="font-mono text-xs text-gray-600 truncate">
                                {test.benchmarkId}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <div className="text-gray-600 mb-2">Aucun historique de test</div>
                      <div className="text-sm text-gray-500">
                        Ce modèle n'a pas encore d'historique de tests enregistré
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Configuration */}
              {activeTab === 'config' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Configuration du modèle</h3>
                  </div>

                  {configLoading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Chargement...</span>
                    </div>
                  )}

                  {configError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-red-800 font-medium">Erreur de configuration</div>
                      <div className="text-red-600">{configError}</div>
                    </div>
                  )}

                  {!configLoading && !configError && (
                    <div className="text-center py-8">
                      <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <div className="text-gray-600 mb-4">
                        Configuration avancée disponible dans une prochaine version
                      </div>
                      <div className="text-sm text-gray-500">
                        Les paramètres de base sont chargés depuis models-config.json
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

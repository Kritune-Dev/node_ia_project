'use client'

import { useState, useEffect } from 'react'
import { X, FileText, BarChart3, Target, Calendar, Settings, Brain, Globe, Zap, CheckCircle, Github, ExternalLink, Edit2, Save, Trash2, PlusCircle, MinusCircle, Clock, AlertTriangle, Star, Edit, TrendingUp, XCircle, MessageSquare, Plus, Play } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useModelCompleteData } from '../../hooks/useModelCompleteData'
import { useModelConfig } from '../../hooks/useModelConfig'

interface ModelDetailModalProps {
  model: any
  isVisible: boolean
  onClose: () => void
}

export default function ModelDetailModal({ model, isVisible, onClose }: ModelDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'infos' | 'performance' | 'tests' | 'config'>('infos')
  const [isEditingComment, setIsEditingComment] = useState(false)
  const [tempComment, setTempComment] = useState('')
  const [isEditingConfig, setIsEditingConfig] = useState(false)
  const [tempConfig, setTempConfig] = useState<{
    displayName?: string
    description?: string
    type?: 'medical' | 'general'
    specialties?: string[]
    parameters?: string
    github?: string
    website?: string
    notes?: string
    metrics?: Record<string, string>
  }>({})

  const { data: completeData, loading, error, updateGlobalComment } = useModelCompleteData(
    isVisible && model ? model.name : null
  )

  const { 
    config: modelConfig, 
    isConfigured, 
    loading: configLoading, 
    error: configError,
    updateConfig,
    deleteConfig,
    refresh: refreshConfig
  } = useModelConfig(isVisible && model ? model.name : null)

  if (!isVisible || !model) return null

  const handleSaveConfig = async () => {
    const success = await updateConfig(tempConfig)
    if (success) {
      setIsEditingConfig(false)
      setTempConfig({})
    }
  }

  const handleCancelConfigEdit = () => {
    setTempConfig({})
    setIsEditingConfig(false)
  }

  const handleStartConfigEdit = () => {
    setTempConfig({
      displayName: modelConfig?.displayName || model.displayName || model.name,
      description: modelConfig?.description || model.description || '',
      type: modelConfig?.type || model.type || 'general',
      specialties: modelConfig?.specialties || model.specialties || [],
      parameters: modelConfig?.parameters || model.parameters || '',
      github: modelConfig?.github || model.github || '',
      website: modelConfig?.website || model.website || '',
      notes: modelConfig?.notes || model.notes || '',
      metrics: modelConfig?.metrics || {}
    })
    setIsEditingConfig(true)
  }

  const handleDeleteConfig = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette configuration ? Le modèle utilisera les valeurs par défaut.')) {
      await deleteConfig()
    }
  }

  // Fonction pour vérifier si une valeur vient de la config JSON ou du fallback
  const getValueWithSource = (configValue: any, fallbackValue: any) => {
    const hasConfigValue = configValue !== undefined && configValue !== null && configValue !== ''
    return {
      value: hasConfigValue ? configValue : fallbackValue,
      fromConfig: hasConfigValue,
      isEmpty: !hasConfigValue && (!fallbackValue || fallbackValue === '')
    }
  }

  const handleSaveComment = () => {
    updateGlobalComment(tempComment)
    setIsEditingComment(false)
  }

  const handleCancelEdit = () => {
    setTempComment(completeData?.globalComment || '')
    setIsEditingComment(false)
  }

  const handleStartEdit = () => {
    setTempComment(completeData?.globalComment || '')
    setIsEditingComment(true)
  }

  const getServiceIcon = (service: any) => {
    if (service.isNative) {
      return <Zap className="h-4 w-4 text-yellow-500" />
    }
    return service.type === 'docker' ? 
      <Brain className="h-4 w-4 text-blue-500" /> : 
      <Globe className="h-4 w-4 text-gray-500" />
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Jamais testé'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (milliseconds: number) => {
    if (milliseconds >= 1000) {
      return `${(milliseconds / 1000).toFixed(1)}s`
    }
    return `${Math.round(milliseconds)}ms`
  }

  const tabs = [
    { id: 'infos', label: 'Informations', icon: FileText },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'tests', label: 'Tests', icon: Target },
    { id: 'config', label: 'Configuration', icon: Settings }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${model.type === 'medical' ? 'bg-red-100' : 'bg-blue-100'}`}>
              {model.type === 'medical' ? 
                <FileText className={`h-8 w-8 ${model.type === 'medical' ? 'text-red-600' : 'text-blue-600'}`} /> :
                <Brain className={`h-8 w-8 ${model.type === 'medical' ? 'text-red-600' : 'text-blue-600'}`} />
              }
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {getValueWithSource(modelConfig?.displayName, model.displayName || model.name).value}
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  getValueWithSource(modelConfig?.type, model.type).value === 'medical' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {getValueWithSource(modelConfig?.type, model.type).value === 'medical' ? 'Médical' : 'Général'}
                </span>
                {(() => {
                  const sizeInGB = model.size ? model.size / (1024 * 1024 * 1024) : 0
                  return (sizeInGB < 2 || model.sizeFormatted?.includes('MB')) && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Rapide
                    </span>
                  )
                })()}
              </h2>
              <p className="text-sm text-gray-500">{model.name}</p>
              {completeData && (
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {completeData.totalTests} tests
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    {completeData.avgUserRating > 0 ? `${completeData.avgUserRating.toFixed(1)}/5` : 'Non noté'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Dernier test: {formatDate(completeData.lastTested)}
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
              {activeTab === 'infos' && (
                <div className="space-y-6">
                  {/* Description */}
                  {(() => {
                    const descData = getValueWithSource(modelConfig?.description, model.description)
                    return descData.value && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="text-lg font-semibold">Description</h3>
                          {!descData.fromConfig && (
                            <div title="Valeur générée automatiquement">
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            </div>
                          )}
                        </div>
                        <p className="text-gray-700 leading-relaxed">{descData.value}</p>
                      </div>
                    )
                  })()}

                  {/* Spécifications */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Spécifications</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                          <span>Type</span>
                          {!getValueWithSource(modelConfig?.type, model.type).fromConfig && (
                            <AlertTriangle className="w-3 h-3 text-orange-500" />
                          )}
                        </div>
                        <div className="font-medium">
                          {getValueWithSource(modelConfig?.type, model.type).value === 'medical' ? 'Médical' : 'Général'}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500">Taille</div>
                        <div className="font-medium">{completeData?.sizeFormatted || model.sizeFormatted || 'N/A'}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                          <span>Paramètres</span>
                          {!getValueWithSource(modelConfig?.parameters, model.parameters).fromConfig && (
                            <AlertTriangle className="w-3 h-3 text-orange-500" />
                          )}
                        </div>
                        <div className="font-medium">{getValueWithSource(modelConfig?.parameters, model.parameters).value || 'N/A'}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500">Benchmarks</div>
                        <div className="font-medium">{completeData?.totalBenchmarks || 0}</div>
                      </div>
                    </div>
                  </div>

                  {/* Spécialités */}
                  {(() => {
                    const specialtiesData = getValueWithSource(modelConfig?.specialties, model.specialties)
                    return specialtiesData.value && specialtiesData.value.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="text-lg font-semibold">Spécialités</h3>
                          {!specialtiesData.fromConfig && (
                            <div title="Valeurs générées automatiquement">
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {specialtiesData.value.map((specialty: string, index: number) => (
                            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Commentaire global */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">Commentaire global</h3>
                      <button
                        onClick={isEditingComment ? handleCancelEdit : handleStartEdit}
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                        title={isEditingComment ? "Annuler l'édition" : "Modifier le commentaire"}
                      >
                        {isEditingComment ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {isEditingComment ? (
                      <div className="space-y-3">
                        <textarea
                          value={tempComment}
                          onChange={(e) => setTempComment(e.target.value)}
                          placeholder="Ajoutez votre commentaire global sur ce modèle..."
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                          rows={4}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveComment}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            <Save className="w-4 h-4" />
                            Sauvegarder
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                          >
                            <X className="w-4 h-4" />
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg border min-h-[100px]">
                        {completeData?.globalComment ? (
                          <p className="text-gray-700 whitespace-pre-wrap">{completeData.globalComment}</p>
                        ) : (
                          <p className="text-gray-400 italic">
                            Aucun commentaire global. Cliquez sur l'icône d'édition pour en ajouter un.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Links */}
                  {(() => {
                    const githubData = getValueWithSource(modelConfig?.github, model.github)
                    const websiteData = getValueWithSource(modelConfig?.website, model.website)
                    return (githubData.value || websiteData.value) && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="text-lg font-semibold">Ressources</h3>
                          {(!githubData.fromConfig || !websiteData.fromConfig) && (
                            <div title="Certains liens générés automatiquement">
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {githubData.value && (
                            <a
                              href={githubData.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 p-3 border rounded-lg transition-colors ${
                                githubData.fromConfig ? 'border-gray-200 hover:bg-gray-50' : 'border-orange-200 bg-orange-50 hover:bg-orange-100'
                              }`}
                            >
                              <Github className="h-5 w-5 text-gray-600" />
                              <span className="text-sm font-medium">Code source</span>
                              {!githubData.fromConfig && <AlertTriangle className="w-3 h-3 text-orange-500" />}
                              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                            </a>
                          )}
                          {websiteData.value && (
                            <a
                              href={websiteData.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 p-3 border rounded-lg transition-colors ${
                                websiteData.fromConfig ? 'border-gray-200 hover:bg-gray-50' : 'border-orange-200 bg-orange-50 hover:bg-orange-100'
                              }`}
                            >
                              <Globe className="h-5 w-5 text-gray-600" />
                              <span className="text-sm font-medium">Site web</span>
                              {!websiteData.fromConfig && <AlertTriangle className="w-3 h-3 text-orange-500" />}
                              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {activeTab === 'performance' && completeData && (
                <div className="space-y-6">
                  {/* Statistiques principales */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Statistiques de performance</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-5 h-5 text-blue-600" />
                          <div className="text-sm text-blue-600">Taux de réussite</div>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">{Math.round(completeData.successRate)}%</div>
                        <div className="text-xs text-blue-700">{completeData.successfulTests}/{completeData.totalTests} tests</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-5 h-5 text-green-600" />
                          <div className="text-sm text-green-600">Temps moyen</div>
                        </div>
                        <div className="text-2xl font-bold text-green-900">{formatDuration(completeData.avgResponseTime)}</div>
                        <div className="text-xs text-green-700">par réponse</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                          <div className="text-sm text-purple-600">Vitesse</div>
                        </div>
                        <div className="text-2xl font-bold text-purple-900">{Math.round(completeData.avgTokensPerSecond)}</div>
                        <div className="text-xs text-purple-700">tokens/sec</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-5 h-5 text-yellow-600" />
                          <div className="text-sm text-yellow-600">Note moyenne</div>
                        </div>
                        <div className="text-2xl font-bold text-yellow-900">
                          {completeData.avgUserRating > 0 ? completeData.avgUserRating.toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-xs text-yellow-700">
                          {completeData.totalRatings > 0 ? `${completeData.totalRatings} notes` : 'Aucune note'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Séries de tests disponibles */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Séries de tests disponibles</h3>
                    <div className="space-y-3">
                      {[
                        { 
                          id: 'smoke', 
                          name: 'Tests Smoke', 
                          description: 'Tests de base rapides pour vérifier le fonctionnement',
                          estimatedTime: '2-3 min',
                          category: 'smoke'
                        },
                        { 
                          id: 'qualitative', 
                          name: 'Tests Qualitatifs', 
                          description: 'Évaluation approfondie de la qualité des réponses',
                          estimatedTime: '10-15 min',
                          category: 'qualitative'
                        },
                        { 
                          id: 'stability', 
                          name: 'Tests de Stabilité', 
                          description: 'Vérification de la consistance des réponses',
                          estimatedTime: '5-8 min',
                          category: 'stability'
                        },
                        { 
                          id: 'parameters', 
                          name: 'Tests Paramétriques', 
                          description: 'Tests avec différents paramètres de génération',
                          estimatedTime: '8-12 min',
                          category: 'parameters'
                        },
                        { 
                          id: 'prompt_alternatives', 
                          name: 'Variantes de Prompts', 
                          description: 'Tests avec différentes formulations de prompts',
                          estimatedTime: '6-10 min',
                          category: 'prompt'
                        },
                        { 
                          id: 'real_data', 
                          name: 'Données Réelles', 
                          description: 'Tests sur des cas cliniques authentiques',
                          estimatedTime: '15-20 min',
                          category: 'real'
                        }
                      ].map((testSerie) => {
                        // Recherche des tests correspondants à cette série
                        const relatedTests = completeData.benchmarkHistory.filter(test => 
                          test.category.toLowerCase().includes(testSerie.category.toLowerCase()) ||
                          testSerie.category.toLowerCase().includes(test.category.toLowerCase())
                        )
                        
                        const lastTest = relatedTests.length > 0 ? 
                          relatedTests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] : null
                        
                        const lastTestDate = lastTest ? new Date(lastTest.timestamp) : null
                        const averageRating = relatedTests.length > 0 ? 
                          relatedTests.filter(t => t.userRating).reduce((sum, t) => sum + (t.userRating || 0), 0) / relatedTests.filter(t => t.userRating).length : null

                        return (
                          <div key={testSerie.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold text-gray-900">{testSerie.name}</h4>
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                    {testSerie.estimatedTime}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">Dernier test:</span>
                                    <div className="font-medium">
                                      {lastTestDate ? (
                                        <span className="text-gray-900">
                                          {formatDistanceToNow(lastTestDate, { addSuffix: true, locale: fr })}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400">Jamais testé</span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <span className="text-gray-500">Note moyenne:</span>
                                    <div className="flex items-center gap-1">
                                      {averageRating ? (
                                        <>
                                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                          <span className="font-medium text-gray-900">{averageRating.toFixed(1)}/5</span>
                                          <span className="text-xs text-gray-500">({relatedTests.filter(t => t.userRating).length})</span>
                                        </>
                                      ) : (
                                        <span className="text-gray-400">Aucune note</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => {
                                  // TODO: Implémenter le lancement de test
                                  alert(`Lancement des ${testSerie.name} pour ${model.name}`)
                                }}
                                className="ml-4 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                              >
                                <Play className="w-4 h-4" />
                                Lancer
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Résultats par série de tests */}
                  {Object.keys(completeData.categories).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Résultats par série</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(completeData.categories).map(([category, count]) => (
                          <div key={category} className="bg-white border border-gray-200 p-3 rounded-lg hover:shadow-sm transition-shadow">
                            <div className="font-medium text-gray-900 capitalize text-sm">{category}</div>
                            <div className="text-xs text-gray-600 mt-1">{count} tests effectués</div>
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full" 
                                style={{ 
                                  width: `${Math.min((count / Math.max(...Object.values(completeData.categories))) * 100, 100)}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tests' && (
                <div className="space-y-6">
                  {completeData ? (
                    <>
                      {/* Statistiques globales */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-sm text-blue-600">Premier test</div>
                          <div className="font-medium">{formatDate(completeData.firstTested)}</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-sm text-green-600">Dernier test</div>
                          <div className="font-medium">{formatDate(completeData.lastTested)}</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="text-sm text-purple-600">Total benchmarks</div>
                          <div className="font-medium">{completeData.totalBenchmarks}</div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <div className="text-sm text-orange-600">Total tests</div>
                          <div className="font-medium">{completeData.totalTests}</div>
                        </div>
                      </div>

                      {/* Tests récents */}
                      {completeData.benchmarkHistory.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Tests récents</h3>
                          <div className="space-y-3">
                            {completeData.benchmarkHistory.slice(0, 5).map((result, index) => (
                              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 capitalize">{result.category}</div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      Question: {result.question || 'Test automatisé'}
                                    </div>
                                    {result.response && (
                                      <div className="text-sm text-gray-700 mt-2 p-2 bg-white rounded border">
                                        {result.response.length > 150 
                                          ? `${result.response.substring(0, 150)}...` 
                                          : result.response
                                        }
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-4 text-right">
                                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      result.success 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {result.success ? (
                                        <>
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Réussi
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="w-3 h-3 mr-1" />
                                          Échec
                                        </>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {formatDuration(result.responseTime)}
                                    </div>
                                    {result.tokensPerSecond && (
                                      <div className="text-xs text-gray-500">
                                        {Math.round(result.tokensPerSecond)} t/s
                                      </div>
                                    )}
                                    {result.userRating !== undefined && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                        <span className="text-xs text-gray-600">{result.userRating}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {result.timestamp && (
                                  <div className="text-xs text-gray-400 mt-2">
                                    {new Date(result.timestamp).toLocaleString('fr-FR')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Historique par benchmark */}
                      {completeData.benchmarkHistory.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Historique par benchmark</h3>
                          <div className="space-y-3">
                            {Object.entries(
                              completeData.benchmarkHistory.reduce((acc: any, test) => {
                                if (!acc[test.benchmarkId]) {
                                  acc[test.benchmarkId] = []
                                }
                                acc[test.benchmarkId].push(test)
                                return acc
                              }, {})
                            ).slice(0, 5).map(([benchmarkId, tests]: [string, any]) => {
                              const firstTest = tests[0]
                              const successCount = tests.filter((t: any) => t.success).length
                              const avgRating = tests.filter((t: any) => t.userRating).reduce((sum: number, t: any) => sum + t.userRating, 0) / tests.filter((t: any) => t.userRating).length || 0
                              
                              return (
                                <div key={benchmarkId} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium">Benchmark {benchmarkId.slice(-8)}</span>
                                      <span className="text-sm text-gray-500">{formatDate(firstTest.timestamp)}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                      <span className={`px-2 py-1 rounded-full text-xs ${
                                        successCount === tests.length ? 'bg-green-100 text-green-800' :
                                        successCount > tests.length / 2 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {successCount}/{tests.length} réussis
                                      </span>
                                      {avgRating > 0 && (
                                        <span className="flex items-center gap-1">
                                          <Star className="w-3 h-3 text-yellow-500" />
                                          {avgRating.toFixed(1)}/5
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                                    <span>{tests.length} questions testées</span>
                                    <span>Temps moyen: {formatDuration(tests.reduce((sum: number, t: any) => sum + t.responseTime, 0) / tests.length)}</span>
                                    <span>Vitesse: {Math.round(tests.reduce((sum: number, t: any) => sum + t.tokensPerSecond, 0) / tests.length)} t/s</span>
                                    <span>Catégories: {Array.from(new Set(tests.map((t: any) => t.category))).join(', ')}</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Analyse des erreurs */}
                      {completeData.benchmarkHistory.some(r => !r.success) && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Analyse des échecs</h3>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                              <h4 className="font-medium text-red-800">Problèmes détectés</h4>
                            </div>
                            <div className="space-y-2">
                              {completeData.benchmarkHistory
                                .filter(r => !r.success)
                                .slice(0, 3)
                                .map((result, index) => (
                                  <div key={index} className="text-sm text-red-700">
                                    • <span className="capitalize">{result.category}</span>: 
                                    {result.error ? ` ${result.error}` : ' Échec de génération'}
                                  </div>
                                ))
                              }
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Recommandations d'amélioration */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Recommandations</h3>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="space-y-2 text-sm text-blue-800">
                            {completeData.successRate < 70 && (
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span>Taux de réussite faible ({Math.round(completeData.successRate)}%). Vérifiez la configuration du modèle.</span>
                              </div>
                            )}
                            {completeData.avgResponseTime > 10000 && (
                              <div className="flex items-start gap-2">
                                <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span>Temps de réponse élevé ({formatDuration(completeData.avgResponseTime)}). Considérez optimiser les paramètres.</span>
                              </div>
                            )}
                            {completeData.avgUserRating < 3 && completeData.totalRatings > 0 && (
                              <div className="flex items-start gap-2">
                                <Star className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span>Note utilisateur faible ({completeData.avgUserRating.toFixed(1)}/5). Révisez la qualité des réponses.</span>
                              </div>
                            )}
                            {Object.keys(completeData.categories).length < 3 && (
                              <div className="flex items-start gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span>Peu de catégories testées. Lancez plus de séries de tests pour une évaluation complète.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-500 mb-4">Aucun test effectué pour ce modèle</div>
                      <button 
                        onClick={() => setActiveTab('performance')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Lancer des tests
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'config' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Configuration du modèle</h3>
                    <div className="flex gap-2">
                      {isConfigured && !isEditingConfig && (
                        <button
                          onClick={handleDeleteConfig}
                          className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer config
                        </button>
                      )}
                      {!isEditingConfig && (
                        <button
                          onClick={handleStartConfigEdit}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          {isConfigured ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          {isConfigured ? 'Modifier' : 'Créer config'}
                        </button>
                      )}
                    </div>
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
                    <>
                      {!isConfigured && !isEditingConfig && (
                        <div className="text-center py-8">
                          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune configuration</h3>
                          <p className="text-gray-600 mb-4">
                            Ce modèle utilise les valeurs détectées automatiquement. 
                            Créez une configuration pour personnaliser ses informations.
                          </p>
                          <button
                            onClick={handleStartConfigEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
                          >
                            <Plus className="w-4 h-4" />
                            Créer une configuration
                          </button>
                        </div>
                      )}

                      {isEditingConfig && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Nom d'affichage */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom d'affichage *
                              </label>
                              <input
                                type="text"
                                value={tempConfig.displayName || ''}
                                onChange={(e) => setTempConfig(prev => ({ ...prev, displayName: e.target.value }))}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                placeholder="ex: GPT-4 32K"
                              />
                            </div>

                            {/* Type */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type *
                              </label>
                              <select
                                value={tempConfig.type || 'general'}
                                onChange={(e) => setTempConfig(prev => ({ ...prev, type: e.target.value as 'medical' | 'general' }))}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                              >
                                <option value="general">Général</option>
                                <option value="medical">Médical</option>
                              </select>
                            </div>

                            {/* Paramètres */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Paramètres
                              </label>
                              <input
                                type="text"
                                value={tempConfig.parameters || ''}
                                onChange={(e) => setTempConfig(prev => ({ ...prev, parameters: e.target.value }))}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                placeholder="ex: 7B, 3.8B, 270M"
                              />
                            </div>

                            {/* GitHub */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                GitHub URL
                              </label>
                              <input
                                type="url"
                                value={tempConfig.github || ''}
                                onChange={(e) => setTempConfig(prev => ({ ...prev, github: e.target.value }))}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                placeholder="https://github.com/..."
                              />
                            </div>

                            {/* Website */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Site web
                              </label>
                              <input
                                type="url"
                                value={tempConfig.website || ''}
                                onChange={(e) => setTempConfig(prev => ({ ...prev, website: e.target.value }))}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                placeholder="https://huggingface.co/..."
                              />
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description *
                            </label>
                            <textarea
                              value={tempConfig.description || ''}
                              onChange={(e) => setTempConfig(prev => ({ ...prev, description: e.target.value }))}
                              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                              rows={3}
                              placeholder="Description détaillée du modèle..."
                            />
                          </div>

                          {/* Spécialités */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Spécialités
                            </label>
                            <input
                              type="text"
                              value={tempConfig.specialties ? tempConfig.specialties.join(', ') : ''}
                              onChange={(e) => setTempConfig(prev => ({ 
                                ...prev, 
                                specialties: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                              }))}
                              className="w-full p-2 border border-gray-300 rounded-lg"
                              placeholder="Spécialité 1, Spécialité 2, Spécialité 3..."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Séparez les spécialités par des virgules
                            </p>
                          </div>

                          {/* Notes */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Notes
                            </label>
                            <textarea
                              value={tempConfig.notes || ''}
                              onChange={(e) => setTempConfig(prev => ({ ...prev, notes: e.target.value }))}
                              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                              rows={2}
                              placeholder="Notes additionnelles..."
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3 pt-4 border-t">
                            <button
                              onClick={handleSaveConfig}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              <Save className="w-4 h-4" />
                              Sauvegarder
                            </button>
                            <button
                              onClick={handleCancelConfigEdit}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                            >
                              <X className="w-4 h-4" />
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}

                      {!isEditingConfig && isConfigured && modelConfig && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div>
                                <div className="text-sm font-medium text-gray-700">Nom d'affichage</div>
                                <div className="p-2 bg-gray-50 rounded">{modelConfig.displayName}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-700">Type</div>
                                <div className="p-2 bg-gray-50 rounded">{modelConfig.type === 'medical' ? 'Médical' : 'Général'}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-700">Paramètres</div>
                                <div className="p-2 bg-gray-50 rounded">{modelConfig.parameters || 'Non défini'}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-700">GitHub</div>
                                <div className="p-2 bg-gray-50 rounded">
                                  {modelConfig.github ? (
                                    <a href={modelConfig.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                      {modelConfig.github}
                                    </a>
                                  ) : (
                                    'Non défini'
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-700">Site web</div>
                                <div className="p-2 bg-gray-50 rounded">
                                  {modelConfig.website ? (
                                    <a href={modelConfig.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                      {modelConfig.website}
                                    </a>
                                  ) : (
                                    'Non défini'
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <div className="text-sm font-medium text-gray-700">Description</div>
                                <div className="p-3 bg-gray-50 rounded min-h-[100px]">{modelConfig.description}</div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-700">Spécialités</div>
                                <div className="p-2 bg-gray-50 rounded">
                                  {modelConfig.specialties.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {modelConfig.specialties.map((spec, i) => (
                                        <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                          {spec}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    'Aucune spécialité définie'
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-700">Notes</div>
                                <div className="p-3 bg-gray-50 rounded min-h-[60px]">{modelConfig.notes || 'Aucune note'}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
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

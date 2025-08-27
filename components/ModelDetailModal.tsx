'use client'

import { useState } from 'react'
import { X, ExternalLink, Github, FileText, Zap, Brain, Globe, BarChart3, Clock, Target, Star, Edit, Save, MessageSquare, TrendingUp, Calendar, Eye, CheckCircle, XCircle } from 'lucide-react'
import { useModelCompleteData } from '../hooks/useModelCompleteData'

interface ModelDetailModalProps {
  model: any
  isVisible: boolean
  onClose: () => void
}

export default function ModelDetailModal({ model, isVisible, onClose }: ModelDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'infos' | 'performance' | 'tests' | 'historique'>('infos')
  const [isEditingComment, setIsEditingComment] = useState(false)
  const [tempComment, setTempComment] = useState('')

  const { data: completeData, loading, error, updateGlobalComment } = useModelCompleteData(
    isVisible && model ? model.name : null
  )

  if (!isVisible || !model) return null

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
    { id: 'historique', label: 'Historique', icon: Calendar }
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
                {completeData?.displayName || model.displayName || model.name}
                {(completeData?.hasNative || model.hasNative) && (
                  <Zap className="h-6 w-6 text-yellow-500" />
                )}
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
                  {(completeData?.description || model.description) && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Description</h3>
                      <p className="text-gray-700 leading-relaxed">{completeData?.description || model.description}</p>
                    </div>
                  )}

                  {/* Spécifications */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Spécifications</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500">Type</div>
                        <div className="font-medium">
                          {(completeData?.type || model.type) === 'medical' ? 'Médical' : 'Général'}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500">Taille</div>
                        <div className="font-medium">{completeData?.sizeFormatted || model.sizeFormatted || 'N/A'}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500">Paramètres</div>
                        <div className="font-medium">{completeData?.parameters || model.parameters || 'N/A'}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500">Benchmarks</div>
                        <div className="font-medium">{completeData?.totalBenchmarks || 0}</div>
                      </div>
                    </div>
                  </div>

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

                  {/* Services */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Services disponibles</h3>
                    <div className="space-y-2">
                      {(completeData?.services || model.services || []).map((service: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          {getServiceIcon(service)}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{service.name}</p>
                            <p className="text-sm text-gray-500">{service.type === 'native' ? 'Performances optimales' : 'Service Docker'}</p>
                          </div>
                          {service.isNative && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              ⚡ Préféré
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Links */}
                  {((completeData?.github || model.github) || (completeData?.website || model.website)) && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Ressources</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(completeData?.github || model.github) && (
                          <a
                            href={completeData?.github || model.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Github className="h-5 w-5 text-gray-600" />
                            <span className="text-sm font-medium">Code source</span>
                            <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                          </a>
                        )}
                        {(completeData?.website || model.website) && (
                          <a
                            href={completeData?.website || model.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Globe className="h-5 w-5 text-gray-600" />
                            <span className="text-sm font-medium">Site web</span>
                            <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
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

                  {/* Catégories de tests */}
                  {Object.keys(completeData.categories).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Répartition par catégorie</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(completeData.categories).map(([category, count]) => (
                          <div key={category} className="bg-gray-50 p-3 rounded-lg">
                            <div className="font-medium text-gray-900 capitalize">{category}</div>
                            <div className="text-sm text-gray-600">{count} tests</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tests' && completeData && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Tests récents</h3>
                    <div className="text-sm text-gray-600">
                      {completeData.benchmarkHistory.length} tests au total
                    </div>
                  </div>

                  {completeData.benchmarkHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun test trouvé</h3>
                      <p className="text-gray-600">Ce modèle n'a pas encore été testé dans des benchmarks.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {completeData.benchmarkHistory.slice(0, 10).map((test, index) => (
                        <div key={`${test.benchmarkId}-${test.questionId}`} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {test.success ? 
                                  <CheckCircle className="w-4 h-4 text-green-500" /> : 
                                  <XCircle className="w-4 h-4 text-red-500" />
                                }
                                <span className="text-sm font-medium">
                                  {test.category.charAt(0).toUpperCase() + test.category.slice(1)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(test.timestamp)}
                                </span>
                              </div>
                              
                              <div className="text-sm text-gray-700 mb-2 line-clamp-2">
                                <strong>Q:</strong> {test.question}
                              </div>
                              
                              {test.success && (
                                <div className="text-xs text-gray-600 mb-2 line-clamp-3">
                                  <strong>R:</strong> {test.response}
                                </div>
                              )}
                              
                              {test.error && (
                                <div className="text-xs text-red-600 mb-2">
                                  <strong>Erreur:</strong> {test.error}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>{formatDuration(test.responseTime)}</span>
                                <span>{test.tokensGenerated} tokens</span>
                                <span>{Math.round(test.tokensPerSecond)} t/s</span>
                                {test.userRating && (
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500" />
                                    {test.userRating}/5
                                  </span>
                                )}
                              </div>
                              
                              {test.userComment && (
                                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                  <MessageSquare className="w-3 h-3 inline mr-1" />
                                  {test.userComment}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'historique' && completeData && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Historique des benchmarks</h3>
                    <div className="text-sm text-gray-600">
                      {completeData.totalBenchmarks} benchmarks
                    </div>
                  </div>

                  {completeData.totalBenchmarks === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun historique</h3>
                      <p className="text-gray-600">Ce modèle n'a pas encore participé à des benchmarks.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
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

                      {/* Grouper par benchmark */}
                      <div>
                        <h4 className="font-semibold mb-3">Historique par benchmark</h4>
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

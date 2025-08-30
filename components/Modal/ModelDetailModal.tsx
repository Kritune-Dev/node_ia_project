'use client'

import { useState } from 'react'
import { X, FileText, Settings, Brain, Globe, Zap, Star, Calendar, Target, Github, ExternalLink } from 'lucide-react'
import { useModel } from '../../hooks/useApi'
import { useModelConfig } from '../../hooks/useModelConfig'

interface ModelDetailModalProps {
  model: any
  isVisible: boolean
  onClose: () => void
}

export default function ModelDetailModalSimple({ model, isVisible, onClose }: ModelDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'infos' | 'config'>('infos')

  const { model: completeData, isLoading: loading, error } = useModel(
    isVisible && model ? model.name : null
  )

  const { 
    config: modelConfig, 
    isConfigured, 
    loading: configLoading, 
    error: configError,
    updateConfig,
    deleteConfig
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

  const tabs = [
    { id: 'infos', label: 'Informations', icon: FileText },
    { id: 'config', label: 'Configuration', icon: Settings }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
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

                  {/* Notes */}
                  {completeData.notes && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Notes</h3>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800">{completeData.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

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

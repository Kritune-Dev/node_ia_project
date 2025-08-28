'use client'

import React, { useState } from 'react'
import { CheckCircle, XCircle, RefreshCw, Zap, Brain, Grid, List } from 'lucide-react'
import ModelDetailModal from './ModelDetailModal'
import ModelFamilyView from './ModelFamilyView'
import ModelFilters from './ModelFilters'
import { useModelsData } from '../../hooks/useModelsData'

interface Model {
  name: string
  displayName: string
  creator: string
  description: string
  github: string | null
  website: string | null
  paper: string | null
  license: string
  specialties: string[]
  type: 'medical' | 'general'
  size: number | null
  sizeFormatted: string
  modified: string | null
  modifiedFormatted: string
  digest: string
  details: any
  available: boolean
  installed: boolean
  service: {
    name: string
    type: string
    isNative: boolean
  }
  services?: any[]
  hasNative?: boolean
  hasDocker?: boolean
}

export default function ModelStatus() {
  const { data, loading, error, refresh } = useModelsData()
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [viewMode, setViewMode] = useState<'families' | 'list'>('families')
  const [filters, setFilters] = useState<any>({})
  const [filteredModels, setFilteredModels] = useState<Model[]>([])
  const [filteredFamilies, setFilteredFamilies] = useState<any[]>([])
  const [showFastOnly, setShowFastOnly] = useState(false)

  // Fonction pour appliquer les filtres
  const applyFilters = (models: Model[], families: any[], activeFilters: any) => {
    let filtered = [...models]
    let filteredFam = [...families]

    // Filtre par mode rapide
    if (showFastOnly) {
      filtered = filtered.filter(model => {
        const sizeInGB = model.size ? model.size / (1024 * 1024 * 1024) : 0
        return sizeInGB < 2 || model.sizeFormatted?.includes('MB')
      })
    }

    // Filtre par services
    if (activeFilters.services && activeFilters.services.length > 0) {
      filtered = filtered.filter(model => 
        model.services?.some(service => activeFilters.services.includes(service.name))
      )
    }

    // Filtre par types
    if (activeFilters.types && activeFilters.types.length > 0) {
      filtered = filtered.filter(model => activeFilters.types.includes(model.type))
    }

    // Filtre par tailles
    if (activeFilters.sizes && activeFilters.sizes.length > 0) {
      const sizeRanges = data?.filter_options?.sizes || []
      filtered = filtered.filter(model => {
        const modelSize = model.size || 0
        return activeFilters.sizes.some((sizeLabel: string) => {
          const range = sizeRanges.find((r: any) => r.label === sizeLabel)
          return range && modelSize >= range.min && modelSize <= range.max
        })
      })
    }

    // Filtre par familles
    if (activeFilters.families && activeFilters.families.length > 0) {
      filtered = filtered.filter(model => {
        const family = model.name.split(':')[0]
        return activeFilters.families.includes(family)
      })
    }

    // Filtrer les familles aussi
    if (showFastOnly) {
      filteredFam = filteredFam.map(family => ({
        ...family,
        variants: family.variants.filter((variant: any) => {
          const sizeInGB = variant.size ? variant.size / (1024 * 1024 * 1024) : 0
          return sizeInGB < 2 || variant.sizeFormatted?.includes('MB')
        })
      })).filter(family => family.variants.length > 0)
    }

    if (activeFilters.families && activeFilters.families.length > 0) {
      filteredFam = filteredFam.filter(family => activeFilters.families.includes(family.family))
    } else {
      // Si pas de filtre de famille, filtrer les familles selon les autres critères
      const filteredModelNames = new Set(filtered.map(m => m.name.split(':')[0]))
      filteredFam = filteredFam.filter(family => filteredModelNames.has(family.family))
    }

    setFilteredModels(filtered)
    setFilteredFamilies(filteredFam)
  }

  // Appliquer les filtres quand les données ou les filtres changent
  React.useEffect(() => {
    if (data && data.models) {
      applyFilters(data.models.all, data.model_families || [], filters)
    }
  }, [data, filters, showFastOnly])

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  const handleModelClick = (model: Model) => {
    setSelectedModel(model)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedModel(null)
  }

  const getServiceIcons = (model: Model) => {
    return model.installed ? [
      <CheckCircle key="installed" className="w-4 h-4 text-green-500" />
    ] : []
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mr-3" />
          <span className="text-gray-600">Chargement des modèles...</span>
        </div>
      </div>
    )
  }

  if (error || data?.status === 'disconnected') {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b bg-red-50">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-800">
                {data?.instructions?.title || 'Service Ollama inaccessible'}
              </h3>
              <p className="text-sm text-red-600">{error || data?.error}</p>
            </div>
            <button
              onClick={refresh}
              className="ml-auto px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          </div>
        </div>

        {data?.instructions && (
          <div className="p-6">
            <h4 className="font-medium text-gray-900 mb-3">Instructions :</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              {data.instructions.steps.map((step: string, index: number) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
            
            {data.instructions.install_first_model && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">Installation d'un premier modèle :</h5>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  {data.instructions.install_first_model.map((step: string, index: number) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Modèles Ollama</h3>
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                <p className="text-sm text-gray-600">
                  {data.total} modèles disponibles
                </p>
                {data.medical_models > 0 && (
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    {data.medical_models} médica{data.medical_models !== 1 ? 'ux' : 'l'}
                  </span>
                )}
                {data.general_models > 0 && (
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {data.general_models} généra{data.general_models !== 1 ? 'ux' : 'l'}
                  </span>
                )}
                {data.fast_models > 0 && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Zap className="w-3 h-3" />
                    {data.fast_models} rapide{data.fast_models !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode rapide toggle */}
            <button
              onClick={() => setShowFastOnly(!showFastOnly)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                showFastOnly 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Zap className="w-4 h-4" />
              Mode rapide
            </button>

            {/* Boutons de vue */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('families')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                  viewMode === 'families' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
                Familles
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                  viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                Liste
              </button>
            </div>

            <button
              onClick={refresh}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {data.filter_options && (
          <div className="flex items-center gap-4">
            <ModelFilters
              filterOptions={data.filter_options}
              onFiltersChange={handleFiltersChange}
              activeFilters={filters}
            />
            
            <div className="text-sm text-gray-600">
              {showFastOnly ? 'Mode rapide: ' : ''}{filteredModels.length} modèle{filteredModels.length !== 1 ? 's' : ''} affiché{filteredModels.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        {viewMode === 'families' ? (
          <div className="space-y-4">
            {filteredFamilies.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-gray-500 font-medium mb-2">
                  {showFastOnly ? 'Aucun modèle rapide trouvé' : 'Aucune famille de modèles trouvée'}
                </h3>
                <p className="text-gray-400 text-sm">
                  {showFastOnly 
                    ? 'Essayez de désactiver le mode rapide ou d\'ajuster les filtres'
                    : 'Essayez d\'ajuster les filtres ou d\'installer des modèles'
                  }
                </p>
              </div>
            ) : (
              filteredFamilies.map((family, index) => (
                <ModelFamilyView
                  key={family.family}
                  family={family}
                  onModelClick={handleModelClick}
                  showFastOnly={showFastOnly}
                />
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredModels.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-gray-500 font-medium mb-2">Aucun modèle trouvé</h3>
                <p className="text-gray-400 text-sm">Essayez d'ajuster les filtres</p>
              </div>
            ) : (
              filteredModels.map((model, index) => (
                <div
                  key={model.name}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleModelClick(model)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {getServiceIcons(model)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{model.displayName}</h4>
                          {/* Indicateur de rapidité */}
                          {(() => {
                            const sizeInGB = model.size ? model.size / (1024 * 1024 * 1024) : 0
                            return (sizeInGB < 2 || model.sizeFormatted?.includes('MB')) && (
                              <div title="Modèle rapide">
                                <Zap className="w-4 h-4 text-green-500" />
                              </div>
                            )
                          })()}
                        </div>
                        <p className="text-sm text-gray-600">{model.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{model.sizeFormatted}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        model.type === 'medical' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {model.type === 'medical' ? 'Médical' : 'Général'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal des détails du modèle */}
      <ModelDetailModal 
        model={selectedModel}
        isVisible={showModal}
        onClose={closeModal}
      />
    </div>
  )
}

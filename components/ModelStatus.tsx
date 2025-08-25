'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Zap, Brain, Globe, Info, Grid, List } from 'lucide-react'
import ModelDetailModal from './ModelDetailModal'
import ModelFamilyView from './ModelFamilyView'
import ModelFilters from './ModelFilters'

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

interface ModelStatusData {
  status?: 'connected' | 'disconnected'
  docker_status?: 'offline'
  primary_service?: {
    name: string
    url: string
    type: string
  }
  available_services?: Array<{
    name: string
    url: string
    models_count: number
    type: string
  }>
  filter_options?: {
    services: Array<{
      name: string
      type: string
      count: number
    }>
    types: Array<{
      label: string
      value: string
      count: number
    }>
    sizes: Array<{
      label: string
      min: number
      max: number
      count: number
    }>
    families: Array<{
      name: string
      count: number
      type: string
    }>
  }
  model_families?: Array<{
    family: string
    baseInfo: any
    variants: Array<{
      name: string
      variant: string
      size: number
      sizeFormatted: string
      services: any[]
      hasNative: boolean
      hasDocker: boolean
      installed: boolean
    }>
  }>
  total: number
  medical_models: number
  general_models: number
  available_models: number
  models: {
    all: Model[]
    medical: Model[]
    general: Model[]
    installed: Model[]
    not_installed: Model[]
  }
  raw_models: any[]
  performance_note?: string
  timestamp: string
  error?: string
  instructions?: {
    title: string
    steps: string[]
    install_first_model: string[]
  }
}

export default function ModelStatus() {
  const [data, setData] = useState<ModelStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [viewMode, setViewMode] = useState<'families' | 'list'>('families')
  const [filters, setFilters] = useState<any>({})
  const [filteredModels, setFilteredModels] = useState<Model[]>([])
  const [filteredFamilies, setFilteredFamilies] = useState<any[]>([])

  // Fonction pour appliquer les filtres
  const applyFilters = (models: Model[], families: any[], activeFilters: any) => {
    let filtered = [...models]
    let filteredFam = [...families]

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
          const range = sizeRanges.find(r => r.label === sizeLabel)
          return range && modelSize >= range.min && modelSize < range.max
        })
      })
    }

    // Filtre par familles
    if (activeFilters.families && activeFilters.families.length > 0) {
      filtered = filtered.filter(model => {
        const familyName = model.name.split(':')[0]
        return activeFilters.families.includes(familyName)
      })
    }

    // Filtrer les familles aussi
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

  const fetchModelStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/models')
      const result = await response.json()
      
      if (!response.ok) {
        // Si l'API retourne une erreur avec des instructions
        if (result.instructions) {
          setError(`Docker inaccessible: ${result.error}`)
          setData({
            ...result,
            total: 0,
            medical_models: 0,
            general_models: 0,
            available_models: 0,
          })
        } else {
          throw new Error(result.error || `HTTP error! status: ${response.status}`)
        }
      } else {
        setData(result)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      
      // Données par défaut en cas d'erreur
      setData({
        status: 'disconnected',
        total: 0,
        medical_models: 0,
        general_models: 0,
        available_models: 0,
        models: {
          all: [],
          medical: [],
          general: [],
          installed: [],
          not_installed: []
        },
        raw_models: [],
        timestamp: new Date().toISOString(),
        error: errorMessage,
        instructions: {
          title: 'Services Docker non accessibles',
          steps: [
            'Vérifier que Docker Desktop est démarré',
            'Ouvrir un terminal dans le dossier du projet',
            'Exécuter: docker-compose up -d',
            'Attendre le démarrage complet (2-3 minutes)',
            'Actualiser cette page'
          ],
          install_first_model: [
            'Une fois Docker démarré, installer un modèle:',
            'docker exec ollama-medical ollama pull llama3.2:3b'
          ]
        }
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModelStatus()
  }, [])

  // Appliquer les filtres quand les données ou les filtres changent
  useEffect(() => {
    if (data && data.models) {
      applyFilters(data.models.all, data.model_families || [], filters)
    }
  }, [data, filters])

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
    const icons = []
    
    if (model.hasNative) {
      icons.push(
        <Zap key="native" className="w-4 h-4 text-yellow-500" />
      )
    }
    
    if (model.hasDocker) {
      icons.push(
        <Brain key="docker" className="w-4 h-4 text-blue-500" />
      )
    }
    
    return icons
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Statut des Modèles</h3>
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
        <div className="text-center py-8">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement des modèles...</p>
        </div>
      </div>
    )
  }

  if (error || data?.status === 'disconnected') {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Statut des Modèles LLM</h3>
            <button 
              onClick={fetchModelStatus}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Actualiser"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="text-center py-8">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-red-600 mb-2">
              Docker Ollama inaccessible
            </h4>
            <p className="text-gray-600 mb-6">
              {data?.error || error || 'Les services Docker ne sont pas accessibles'}
            </p>

            {data?.instructions && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left max-w-2xl mx-auto">
                <h5 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  {data.instructions.title}
                </h5>
                
                <div className="space-y-4">
                  <div>
                    <h6 className="font-medium text-blue-800 mb-2">Étapes de résolution :</h6>
                    <ol className="text-sm text-blue-700 space-y-1">
                      {data.instructions.steps.map((step, index) => (
                        <li key={index} className="flex items-start">
                          <span className="bg-blue-200 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <h6 className="font-medium text-blue-800 mb-2">Installation d'un premier modèle :</h6>
                    <div className="bg-blue-100 rounded p-3 font-mono text-sm text-blue-900">
                      {data.instructions.install_first_model.map((cmd, index) => (
                        <div key={index} className={index > 0 ? 'mt-1' : ''}>
                          {cmd.startsWith('docker') ? (
                            <code className="bg-blue-200 px-2 py-1 rounded">{cmd}</code>
                          ) : (
                            cmd
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={fetchModelStatus}
              className="mt-6 btn-primary"
            >
              Réessayer la connexion
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Statut des Modèles LLM</h3>
          <div className="flex items-center gap-2">
            {/* Sélecteur de mode d'affichage */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('families')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'families'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4 mr-1 inline" />
                Familles
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4 mr-1 inline" />
                Liste
              </button>
            </div>
            
            {/* Filtres */}
            {data.filter_options && (
              <ModelFilters
                filterOptions={data.filter_options}
                onFiltersChange={handleFiltersChange}
                activeFilters={filters}
              />
            )}
            
            <button 
              onClick={fetchModelStatus}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Actualiser"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              {(filteredModels.length > 0 ? filteredModels.length : data.models.all.length)} modèles disponibles
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              {(filteredModels.length > 0 ? filteredModels.filter(m => m.type === 'medical').length : data.medical_models)} médicaux
            </span>
          </div>
          {data.primary_service && (
            <div className="flex items-center space-x-2">
              {data.primary_service.type === 'native' ? (
                <Zap className="w-4 h-4 text-yellow-500" />
              ) : (
                <Brain className="w-4 h-4 text-blue-500" />
              )}
              <span className="text-sm text-gray-600">
                Service principal: {data.primary_service.name}
              </span>
            </div>
          )}
          <div className="text-sm text-gray-500">
            Dernière mise à jour : {formatDate(data.timestamp)}
          </div>
        </div>
        
        {data.performance_note && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            💡 {data.performance_note}
          </div>
        )}
      </div>

      <div className="p-6">
        {viewMode === 'families' && data.model_families ? (
          // Vue par familles
          <div className="space-y-4">
            {(filteredFamilies.length > 0 ? filteredFamilies : data.model_families).map((family) => (
              <ModelFamilyView
                key={family.family}
                family={family}
                onModelClick={handleModelClick}
              />
            ))}
            {filteredFamilies.length === 0 && Object.keys(filters).some(key => filters[key]?.length > 0) && (
              <div className="text-center py-8 text-gray-500">
                <p>Aucune famille de modèles ne correspond aux filtres sélectionnés.</p>
              </div>
            )}
          </div>
        ) : (
          // Vue en liste classique
          <div className="space-y-3">
            {(filteredModels.length > 0 ? filteredModels : data.models.all).map((model) => (
              <div 
                key={model.name}
                onClick={() => handleModelClick(model)}
                className="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md bg-green-50 border-green-200 hover:bg-green-100"
              >
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {model.displayName}
                        <div className="flex items-center gap-1">
                          {getServiceIcons(model)}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        model.type === 'medical' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {model.type === 'medical' ? 'Médical' : 'Général'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <span>{model.name}</span>
                      {model.creator && (
                        <span className="text-gray-400">• {model.creator}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span>{model.sizeFormatted}</span>
                      <span>• Modifié le {model.modifiedFormatted}</span>
                      {model.services && model.services.length > 1 && (
                        <span className="text-blue-600">• Disponible sur {model.services.length} services</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredModels.length === 0 && Object.keys(filters).some(key => filters[key]?.length > 0) && (
              <div className="text-center py-8 text-gray-500">
                <p>Aucun modèle ne correspond aux filtres sélectionnés.</p>
              </div>
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

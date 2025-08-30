'use client'

import React, { useState } from 'react'
import { CheckCircle, XCircle, RefreshCw, Brain, Cpu, Activity, Heart, Zap } from 'lucide-react'
import { useModels, useSystemHealth } from '../../hooks/useApi'
import ModelDetailModal from '../Modal/ModelDetailModal'

interface Model {
  name: string
  family: string
  size: string
  type: string
  displayName?: string
  status: string
  benchmarkScore?: number
  capabilities: string[]
  specialties?: string[]
  description?: string
}

interface ModelCardProps {
  model: Model
  onClick: () => void
}

function ModelCard({ model, onClick }: ModelCardProps) {
  const isReady = model.status === 'ready'
  
  // Utiliser le type de l'API au lieu de deviner
  const isMedical = model.type === 'medical'
  const isFast = model.type === 'rapide'
  
  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {isReady ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">{model.displayName || model.name}</h3>
              <div className="flex gap-1">
                {isMedical && (
                  <div className="flex items-center" title="Modèle médical">
                    <Heart className="w-3 h-3 text-red-500" />
                  </div>
                )}
                {isFast && (
                  <div className="flex items-center" title="Modèle rapide">
                    <Zap className="w-3 h-3 text-green-500" />
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500">{model.family} {isFast ? '• Modèle Rapide' : ''} {isMedical ? '• Modèle Médical' : ''}</p>
          </div>
        </div>
        
        {model.size && (
          <div className="text-right">
            <div className="text-lg font-semibold text-purple-600">
              {model.size}
            </div>
            <div className="text-xs text-gray-500">Paramètres</div>
          </div>
        )}
      </div>
    </div>
  )
}

interface ModelFamilyGroupProps {
  family: string
  models: Model[]
  onModelClick: (model: Model) => void
}

function ModelFamilyGroup({ family, models, onModelClick }: ModelFamilyGroupProps) {
  if (models.length === 0) return null
  
  // Stats de la famille basées sur les vrais types
  const medicalModels = models.filter(m => m.type === 'medical')
  const fastModels = models.filter(m => m.type === 'rapide')
  
  const hasMedical = medicalModels.length > 0
  const hasFast = fastModels.length > 0
  
  return (
    <div className="border rounded-lg bg-white">
      {/* En-tête de la famille */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  {family}
                  {hasMedical && (
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-red-600 font-medium">Médical</span>
                    </div>
                  )}
                  {hasFast && (
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">Rapide</span>
                    </div>
                  )}
                </h3>
              </div>
              
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <span>{models.length} modèle{models.length !== 1 ? 's' : ''}</span>
                {hasMedical && (
                  <>
                    <span>•</span>
                    <span className="text-red-600">{medicalModels.length} médical{medicalModels.length !== 1 ? 'ux' : ''}</span>
                  </>
                )}
                {hasFast && (
                  <>
                    <span>•</span>
                    <span className="text-green-600">{fastModels.length} rapide{fastModels.length !== 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-500">
              {models.length} variant{models.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Liste des modèles toujours visible */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((model: Model) => (
            <ModelCard 
              key={model.name} 
              model={model} 
              onClick={() => onModelClick(model)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ModelStatus() {
  const { models, count, isLoading, error, refresh } = useModels()
  const { isHealthy, services } = useSystemHealth()
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Brain className="w-6 h-6 mr-2 text-blue-600" />
            Modèles IA
          </h2>
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
        
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-20 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Brain className="w-6 h-6 mr-2 text-red-600" />
            Modèles IA
          </h2>
          <button
            onClick={() => refresh()}
            className="flex items-center text-sm text-red-600 hover:text-red-700"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Réessayer
          </button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">
            ❌ Erreur lors du chargement des modèles
          </p>
          <p className="text-red-600 text-xs mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  // Calcul des statistiques basées sur les vrais types de l'API
  const medicalModels = models.filter((m: Model) => m.type === 'medical')
  const fastModels = models.filter((m: Model) => m.type === 'rapide')

  // Groupement par famille
  const modelsByFamily = models.reduce((acc: Record<string, Model[]>, model: Model) => {
    const family = model.family || 'Inconnu'
    if (!acc[family]) {
      acc[family] = []
    }
    acc[family].push(model)
    return acc
  }, {})

  // Regrouper les familles avec un seul modèle dans "Modèles uniques"
  const uniqueModels: Model[] = []
  const multiFamilies: Record<string, Model[]> = {}
  
  Object.entries(modelsByFamily).forEach(([family, familyModels]) => {
    const typedFamilyModels = familyModels as Model[]
    if (typedFamilyModels.length === 1) {
      uniqueModels.push(...typedFamilyModels)
    } else {
      multiFamilies[family] = typedFamilyModels
    }
  })

  // Créer le tableau final des familles à afficher
  const finalFamilies: [string, Model[]][] = []
  
  // Ajouter les familles multi-modèles
  Object.entries(multiFamilies).forEach(([family, familyModels]) => {
    finalFamilies.push([family, familyModels])
  })
  
  // Ajouter les modèles uniques s'il y en a
  if (uniqueModels.length > 0) {
    finalFamilies.push(['Modèles uniques', uniqueModels])
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Brain className="w-6 h-6 mr-2 text-blue-600" />
          Modèles IA
        </h2>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">Statut système</div>
            <div className={`flex items-center text-sm font-medium ${
              isHealthy ? 'text-green-600' : 'text-red-600'
            }`}>
              {isHealthy ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  En ligne
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-1" />
                  Hors ligne
                </>
              )}
            </div>
          </div>
          
          <button
            onClick={() => refresh()}
            className="flex items-center text-sm text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats - Nouvelles métriques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <Cpu className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <div className="text-2xl font-bold text-blue-600">{count}</div>
              <div className="text-sm text-blue-700">Modèles total</div>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center">
            <Heart className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <div className="text-2xl font-bold text-red-600">{medicalModels.length}</div>
              <div className="text-sm text-red-700">Médicaux</div>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <Zap className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <div className="text-2xl font-bold text-green-600">{fastModels.length}</div>
              <div className="text-sm text-green-700">Rapides</div>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <Activity className="w-5 h-5 text-purple-600 mr-2" />
            <div>
              <div className="text-2xl font-bold text-purple-600">{finalFamilies.length}</div>
              <div className="text-sm text-purple-700">Familles</div>
            </div>
          </div>
        </div>
      </div>

      {/* Models by Family */}
      {models.length === 0 ? (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun modèle trouvé</h3>
          <p className="text-gray-500">
            Vérifiez que Ollama est démarré et que des modèles sont installés.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {finalFamilies.map(([family, familyModels]) => (
            <ModelFamilyGroup
              key={family}
              family={family}
              models={familyModels}
              onModelClick={(model) => setSelectedModel(model)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <ModelDetailModal
        model={selectedModel}
        isVisible={!!selectedModel}
        onClose={() => setSelectedModel(null)}
      />
    </div>
  )
}

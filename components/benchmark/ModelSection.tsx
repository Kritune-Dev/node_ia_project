'use client'

import React from 'react'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Zap, Globe, Brain, Info, CheckCircle, ArrowUpDown, AlertTriangle } from 'lucide-react'
import ModelDetailModal from '../Modal/ModelDetailModal'

type SortOption = 'name' | 'parameters' | 'type'
type SortDirection = 'asc' | 'desc'

interface ModelCardProps {
  model: any
  isSelected: boolean
  onToggle: (modelName: string) => void
  extractParameterNumber: (parameters: string) => number
}

function ModelCard({ model, isSelected, onToggle, extractParameterNumber }: ModelCardProps) {
  const [showDetailModal, setShowDetailModal] = useState(false)

  const getModelTypeColor = (type: string) => {
    switch (type) {
      case 'medical': return 'bg-red-100 text-red-700 border-red-200'
      case 'general': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'rapide': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getModelTypeLabel = (type: string) => {
    switch (type) {
      case 'medical': return 'Médical'
      case 'general': return 'Général'
      case 'rapide': return 'Rapide'
      default: return 'Général'
    }
  }

  const getModelTypeDescription = (type: string) => {
    switch (type) {
      case 'medical': return 'Spécialisé pour les domaines médicaux et de santé'
      case 'general': return 'Usage polyvalent pour diverses tâches'
      case 'rapide': return 'Optimisé pour des réponses rapides et efficaces'
      default: return 'Usage polyvalent pour diverses tâches'
    }
  }

  const getParametersDescription = (parameters: string) => {
    if (!parameters) return 'Nombre de paramètres non spécifié'
    
    const num = extractParameterNumber(parameters)
    if (num <= 1) return 'Très petit modèle, très rapide mais capacités limitées'
    if (num <= 3) return 'Petit modèle, rapide avec bonnes capacités de base'
    if (num <= 7) return 'Modèle moyen, bon équilibre performance/qualité'
    if (num <= 13) return 'Grand modèle, excellente qualité mais plus lent'
    if (num <= 30) return 'Très grand modèle, qualité supérieure'
    return 'Modèle géant, qualité exceptionnelle mais ressources importantes'
  }

  return (
    <>
      <div
        className={`
          relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group
          ${isSelected 
            ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]' 
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:scale-[1.01]'
          }
        `}
        onClick={() => onToggle(model.name)}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 leading-tight pr-2">
              {model.displayName || model.name}
            </h3>
            {isSelected && (
              <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
            )}
          </div>
          
          <p className="text-xs text-gray-500 font-mono mb-3 flex-1">
            {model.name}
          </p>
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span 
                className={`px-2 py-1 rounded-full font-medium cursor-help ${getModelTypeColor(model.type || 'general')}`}
                title={getModelTypeDescription(model.type)}
              >
                {getModelTypeLabel(model.type)}
              </span>
              <span 
                className="font-semibold text-gray-700 cursor-help"
                title={getParametersDescription(model.parameters)}
              >
                {model.parameters || 'N/A'}
              </span>
            </div>
            <button
              className="text-blue-600 hover:text-blue-800 font-medium"
              onClick={(e) => {
                e.stopPropagation()
                setShowDetailModal(true)
              }}
            >
              Détails
            </button>
          </div>
        </div>
      </div>
      
      <ModelDetailModal
        model={model}
        isVisible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </>
  )
}

interface ModelSectionProps {
  availableModels: any[] // Maintenant un tableau d'objets complets
  selectedModels: string[]
  onModelToggle: (modelName: string) => void
}

export default function ModelSection({ availableModels, selectedModels, onModelToggle }: ModelSectionProps) {
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Extraire le nombre de paramètres pour le tri
  const extractParameterNumber = (parameters: string) => {
    if (!parameters) return 0
    const match = parameters.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0
  }

  // Fonction de tri
  const sortModels = (models: any[]) => {
    return [...models].sort((a, b) => {
      // D'abord trier par sélection (sélectionnés en premier)
      const aSelected = selectedModels.includes(a.name)
      const bSelected = selectedModels.includes(b.name)
      
      if (aSelected && !bSelected) return -1
      if (!aSelected && bSelected) return 1
      
      // Ensuite trier selon le critère choisi
      let valueA, valueB

      switch (sortBy) {
        case 'parameters':
          // Extraire les nombres des paramètres pour le tri
          valueA = extractParameterNumber(a.parameters)
          valueB = extractParameterNumber(b.parameters)
          break
        case 'type':
          valueA = a.type || 'general'
          valueB = b.type || 'general'
          break
        case 'name':
        default:
          valueA = (a.displayName || a.name).toLowerCase()
          valueB = (b.displayName || b.name).toLowerCase()
          break
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  // Changer le tri
  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(option)
      setSortDirection('asc')
    }
  }

  const sortedModels = sortModels(availableModels)
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Modèles disponibles</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{selectedModels.length}</span>
            <span>modèle{selectedModels.length !== 1 ? 's' : ''} sélectionné{selectedModels.length !== 1 ? 's' : ''}</span>
          </div>
          
          {/* Options de tri */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Trier par:</span>
            {[
              { key: 'name' as SortOption, label: 'Nom' },
              { key: 'parameters' as SortOption, label: 'Paramètres' },
              { key: 'type' as SortOption, label: 'Type' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleSort(key)}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                  sortBy === key
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
                {sortBy === key && (
                  <ArrowUpDown className={`w-3 h-3 transition-transform ${
                    sortDirection === 'desc' ? 'rotate-180' : ''
                  }`} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Grille 3 colonnes cohérente avec les tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedModels.map((model) => (
          <ModelCard
            key={model.name}
            model={model}
            isSelected={selectedModels.includes(model.name)}
            onToggle={onModelToggle}
            extractParameterNumber={extractParameterNumber}
          />
        ))}
      </div>
      
      {/* Message si aucun modèle sélectionné */}
      {selectedModels.length === 0 && (
        <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800 text-sm font-medium">
              Veuillez sélectionner au moins un modèle pour lancer un benchmark
            </span>
          </div>
        </div>
      )}

      {/* Message si aucun modèle disponible */}
      {availableModels.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
            <div className="text-lg font-medium">Aucun modèle disponible</div>
            <div className="text-sm">Veuillez vérifier que les services Docker sont démarrés</div>
          </div>
        </div>
      )}
    </div>
  )
}

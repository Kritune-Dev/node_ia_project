'use client'

import { useState } from 'react'
import { CheckCircle, ChevronDown, ChevronRight, Zap, Info } from 'lucide-react'

interface ModelVariant {
  name: string
  variant: string
  size: number
  sizeFormatted: string
  parameters: string
  services: any[]
  hasNative: boolean
  hasDocker: boolean
  isFast?: boolean
}

interface ModelFamily {
  family: string
  baseInfo: any
  variants: ModelVariant[]
}

interface ModelFamilyViewProps {
  family: ModelFamily
  onModelClick: (model: any) => void
  showFastOnly?: boolean
}

export default function ModelFamilyView({ family, onModelClick, showFastOnly = false }: ModelFamilyViewProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Filtrer les variants selon le mode rapide
  const getFilteredVariants = () => {
    if (!showFastOnly) return family.variants
    
    return family.variants.filter(variant => {
      // Un modèle est considéré comme rapide s'il fait moins de 2GB
      const sizeInGB = variant.size ? variant.size / (1024 * 1024 * 1024) : 0
      return sizeInGB < 2 || variant.sizeFormatted.includes('MB')
    })
  }

  const getServiceIcons = (variant: ModelVariant) => {
    const icons = []
    
    // Indicateur de rapidité
    const sizeInGB = variant.size ? variant.size / (1024 * 1024 * 1024) : 0
    if (sizeInGB < 2 || variant.sizeFormatted.includes('MB')) {
      icons.push(
        <div key="fast" title="Modèle rapide" className="inline-block">
          <Zap className="w-3 h-3 text-green-500" />
        </div>
      )
    }
    
    return icons
  }

  const getVariantBadgeColor = (variant: ModelVariant) => {

    const sizeMatch = variant.parameters.match(/(\d+\.?\d*)([bm]?)/)
    if (!sizeMatch) return 'bg-gray-100 text-gray-800'
    
    const num = parseFloat(sizeMatch[1])
    const unit = sizeMatch[2]
    
    if (unit === 'b') {
      if (num <= 1) return 'bg-green-100 text-green-800' // Très rapide
      if (num <= 3) return 'bg-blue-100 text-blue-800'   // Rapide
      if (num <= 7) return 'bg-orange-100 text-orange-800' // Moyen
      return 'bg-red-100 text-red-800'                   // Lent
    }
    
    return 'bg-purple-100 text-purple-800' // Taille en MB (très rapide)
  }

  const filteredVariants = getFilteredVariants()
  const hasAnyFast = filteredVariants.some(v => {
    const sizeInGB = v.size ? v.size / (1024 * 1024 * 1024) : 0
    return sizeInGB < 2 || v.sizeFormatted.includes('MB')
  })
  const totalVariants = filteredVariants.length
  const hasVariants = totalVariants > 1

  // Si pas de variants, vérifier si le modèle de base peut être affiché
  const canShowBaseModel = !hasVariants && family.baseInfo
  const isBaseModelFast = family.baseInfo?.size ? 
    (family.baseInfo.size / (1024 * 1024 * 1024) < 2) || 
    family.baseInfo.sizeFormatted?.includes('MB') : false

  // Ne pas afficher si pas de variants après filtrage en mode rapide et pas de modèle de base rapide
  if (showFastOnly && totalVariants === 0 && (!canShowBaseModel || !isBaseModelFast)) {
    return null
  }

  return (
    <div className="border rounded-lg bg-white">
      {/* En-tête de la famille */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center text-gray-500">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  {family.baseInfo?.displayName || family.family}
                  {((hasAnyFast && showFastOnly) || (!hasVariants && isBaseModelFast && showFastOnly)) && (
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">Rapide</span>
                    </div>
                  )}
                  {((hasAnyFast && !showFastOnly) || (!hasVariants && isBaseModelFast && !showFastOnly)) && (
                    <Zap className="w-4 h-4 text-green-500" />
                  )}
                </h3>
              </div>
              
              <div className="text-sm text-gray-600 flex items-center gap-2">
                {hasVariants ? (
                  <span>{totalVariants} variant{totalVariants !== 1 ? 's' : ''}</span>
                ) : (
                  <span>Modèle unique</span>
                )}
                {family.baseInfo?.type && (
                  <>
                    <span>•</span>
                    <span className={`${family.baseInfo.type === 'medical' ? 'text-red-600' : 'text-blue-600'}`}>
                      {family.baseInfo.type === 'medical' ? 'Médical' : 'Général'}
                    </span>
                  </>
                )}
                {(hasAnyFast || (!hasVariants && isBaseModelFast)) && (
                  <>
                    <span>•</span>
                    <span className="text-green-600">
                      {hasVariants ? 'Modèles rapides disponibles' : 'Modèle rapide'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {hasVariants ? (
                <>
                  {filteredVariants.slice(0, 5).map((variant, index) => (
                    <span 
                      key={variant.name}
                      className={`px-2 py-1 text-xs font-medium rounded ${getVariantBadgeColor(variant)}`}
                    >
                      {variant.parameters}
                    </span>
                  ))}
                  {filteredVariants.length > 5 && (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600">
                      +{filteredVariants.length - 5}
                    </span>
                  )}
                </>
              ) : (
                // Afficher le badge du modèle de base
                family.baseInfo?.variant && (
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getVariantBadgeColor(family.baseInfo)}`}>
                    {family.baseInfo.parameters}
                  </span>
                )
              )}
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                onModelClick(family.baseInfo)
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Liste des variantes ou modèle unique (élargie) */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {hasVariants ? (
            // Afficher les variants
            filteredVariants.map((variant, index) => (
              <div 
                key={variant.name}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  index !== filteredVariants.length - 1 ? 'border-b border-gray-50' : ''
                }`}
                onClick={() => onModelClick({
                  ...family.baseInfo,
                  name: variant.name,
                  variant: variant.variant,
                  services: variant.services,
                  hasNative: variant.hasNative,
                  hasDocker: variant.hasDocker,
                  size: variant.size,
                  sizeFormatted: variant.sizeFormatted
                })}
              >
                <div className="flex items-center justify-between ml-7">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{variant.name}</span>
                        <div className="flex gap-1">
                          {getServiceIcons(variant)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {variant.sizeFormatted}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getVariantBadgeColor(variant)}`}>
                      {variant.parameters}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Afficher le modèle de base comme un élément unique
            canShowBaseModel && (
              <div 
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onModelClick(family.baseInfo)}
              >
                <div className="flex items-center justify-between ml-7">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{family.baseInfo.name || family.family}</span>
                        <div className="flex gap-1">
                          {isBaseModelFast && (
                            <div title="Modèle rapide" className="inline-block">
                              <Zap className="w-3 h-3 text-green-500" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {family.baseInfo.sizeFormatted || 'Taille non spécifiée'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {family.baseInfo.parameters && (
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getVariantBadgeColor(family.baseInfo)}`}>
                        {family.baseInfo.parameters}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}

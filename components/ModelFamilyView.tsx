'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, ChevronDown, ChevronRight, Zap, Brain, Info } from 'lucide-react'

interface ModelVariant {
  name: string
  variant: string
  size: number
  sizeFormatted: string
  services: any[]
  hasNative: boolean
  hasDocker: boolean
  installed: boolean
}

interface ModelFamily {
  family: string
  baseInfo: any
  variants: ModelVariant[]
}

interface ModelFamilyViewProps {
  family: ModelFamily
  onModelClick: (model: any) => void
}

export default function ModelFamilyView({ family, onModelClick }: ModelFamilyViewProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getServiceIcons = (variant: ModelVariant) => {
    const icons = []
    
    if (variant.hasNative) {
      icons.push(
        <Zap key="native" className="w-3 h-3 text-yellow-500" />
      )
    }
    
    if (variant.hasDocker) {
      icons.push(
        <Brain key="docker" className="w-3 h-3 text-blue-500" />
      )
    }
    
    return icons
  }

  const getVariantBadgeColor = (variant: string) => {
    const sizeMatch = variant.match(/(\d+\.?\d*)([bm]?)/)
    if (!sizeMatch) return 'bg-gray-100 text-gray-800'
    
    const num = parseFloat(sizeMatch[1])
    const unit = sizeMatch[2]
    
    if (unit === 'b') {
      if (num <= 1) return 'bg-green-100 text-green-800'
      if (num <= 3) return 'bg-blue-100 text-blue-800'
      if (num <= 7) return 'bg-orange-100 text-orange-800'
      return 'bg-red-100 text-red-800'
    }
    
    return 'bg-purple-100 text-purple-800'
  }

  const hasAnyNative = family.variants.some(v => v.hasNative)
  const installedCount = family.variants.filter(v => v.installed).length
  const totalVariants = family.variants.length

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
                  {family.baseInfo.displayName}
                  {hasAnyNative && (
                    <Zap className="w-4 h-4 text-yellow-500" />
                  )}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  family.baseInfo.type === 'medical' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {family.baseInfo.type === 'medical' ? 'Médical' : 'Général'}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <span>{family.baseInfo.creator}</span>
                <span>•</span>
                <span>{totalVariants} variante{totalVariants > 1 ? 's' : ''} disponible{totalVariants > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {family.variants.slice(0, 3).map((variant, index) => (
                <span 
                  key={index}
                  className={`px-2 py-1 text-xs font-medium rounded ${getVariantBadgeColor(variant.variant)}`}
                >
                  {variant.variant}
                </span>
              ))}
              {family.variants.length > 3 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  +{family.variants.length - 3}
                </span>
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

      {/* Liste des variantes (élargie) */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {family.variants.map((variant, index) => (
            <div 
              key={variant.name}
              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                index !== family.variants.length - 1 ? 'border-b border-gray-50' : ''
              }`}
              onClick={() => onModelClick({
                ...family.baseInfo,
                name: variant.name,
                variant: variant.variant,
                services: variant.services,
                hasNative: variant.hasNative,
                hasDocker: variant.hasDocker,
                installed: variant.installed,
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
                      <div className="flex items-center gap-1">
                        {getServiceIcons(variant)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Taille: {variant.sizeFormatted}
                      {variant.services && variant.services.length > 1 && (
                        <span className="text-blue-600 ml-2">
                          • {variant.services.length} services
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getVariantBadgeColor(variant.variant)}`}>
                    {variant.variant}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

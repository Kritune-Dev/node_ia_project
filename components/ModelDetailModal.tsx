'use client'

import { X, ExternalLink, Github, FileText, Zap, Brain, Globe } from 'lucide-react'

interface ModelDetailModalProps {
  model: any
  isVisible: boolean
  onClose: () => void
}

export default function ModelDetailModal({ model, isVisible, onClose }: ModelDetailModalProps) {
  if (!isVisible || !model) return null

  const getServiceIcon = (service: any) => {
    if (service.isNative) {
      return <Zap className="h-4 w-4 text-yellow-500" />
    }
    return service.type === 'docker' ? 
      <Brain className="h-4 w-4 text-blue-500" /> : 
      <Globe className="h-4 w-4 text-gray-500" />
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${model.type === 'medical' ? 'bg-red-100' : 'bg-blue-100'}`}>
              {model.type === 'medical' ? 
                <FileText className={`h-6 w-6 ${model.type === 'medical' ? 'text-red-600' : 'text-blue-600'}`} /> :
                <Brain className={`h-6 w-6 ${model.type === 'medical' ? 'text-red-600' : 'text-blue-600'}`} />
              }
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {model.displayName}
                {model.hasNative && (
                  <Zap className="h-5 w-5 text-yellow-500" />
                )}
              </h2>
              <p className="text-sm text-gray-500">{model.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Informations générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-1">Créateur</h4>
                <p className="text-gray-600">{model.creator}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-1">Type</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  model.type === 'medical' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {model.type === 'medical' ? 'Médical' : 'Général'}
                </span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-1">Taille</h4>
                <p className="text-gray-600">{model.sizeFormatted}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-1">License</h4>
                <p className="text-gray-600">{model.license}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Description</h3>
            <p className="text-gray-600 leading-relaxed">{model.description}</p>
          </div>

          {/* Specialties */}
          {model.specialties && model.specialties.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Spécialités</h3>
              <div className="flex flex-wrap gap-2">
                {model.specialties.map((specialty: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Services disponibles</h3>
            <div className="space-y-2">
              {model.services?.map((service: any, index: number) => (
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
          <div>
            <h3 className="text-lg font-semibold mb-3">Ressources</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {model.github && (
                <a
                  href={model.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Github className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">Code source</span>
                  <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                </a>
              )}
              {model.website && (
                <a
                  href={model.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Globe className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">Site web</span>
                  <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                </a>
              )}
              {model.paper && (
                <a
                  href={model.paper}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FileText className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">Article de recherche</span>
                  <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                </a>
              )}
            </div>
          </div>

          {/* Technical Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Détails techniques</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Dernière modification:</span>
                  <p className="text-gray-600">{model.modifiedFormatted}</p>
                </div>
                {model.digest && (
                  <div>
                    <span className="font-medium text-gray-700">Digest:</span>
                    <p className="text-gray-600 font-mono text-xs break-all">{model.digest.substring(0, 16)}...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

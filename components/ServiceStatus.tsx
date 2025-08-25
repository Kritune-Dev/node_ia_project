'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, RefreshCw, Brain, Globe, Zap } from 'lucide-react'

interface ServiceStatusData {
  ollama_medical: {
    status: 'connected' | 'disconnected' | 'error'
    message: string
    models_count?: number
    url: string
    type: string
  }
  ollama_translator: {
    status: 'connected' | 'disconnected' | 'error'
    message: string
    models_count?: number
    url: string
    type: string
  }
  ollama_native: {
    status: 'connected' | 'disconnected' | 'error'
    message: string
    models_count?: number
    url: string
    type: string
    preferred?: boolean
  }
  preferred_service: string | null
  timestamp: string
}

interface ServiceStatusProps {
  isVisible: boolean
  onClose: () => void
}

export default function ServiceStatus({ isVisible, onClose }: ServiceStatusProps) {
  const [data, setData] = useState<ServiceStatusData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchServiceStatus = async () => {
    try {
      setLoading(true)
      
      // URLs des services
      const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_BASE_URL || 'http://localhost:11434'
      const translatorUrl = process.env.NEXT_PUBLIC_TRANSLATOR_BASE_URL || 'http://localhost:11435'
      const nativeUrl = process.env.NEXT_PUBLIC_NATIVE_OLLAMA_URL || 'http://localhost:11436'
      
      const timestamp = new Date().toISOString()
      
      // Fonction pour tester un service Ollama
      const testOllamaService = async (url: string, serviceName: string, serviceType: string) => {
        try {
          const response = await fetch(`${url}/api/tags`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(3000)
          })

          if (response.ok) {
            const data = await response.json()
            return {
              status: 'connected' as const,
              message: `${serviceName} connecté - ${data.models?.length || 0} modèles`,
              models_count: data.models?.length || 0,
              url,
              type: serviceType
            }
          } else {
            return {
              status: 'error' as const,
              message: `Erreur HTTP ${response.status}: ${response.statusText}`,
              models_count: 0,
              url,
              type: serviceType
            }
          }
        } catch (error: any) {
          return {
            status: 'disconnected' as const,
            message: `${serviceName} non accessible`,
            models_count: 0,
            url,
            type: serviceType
          }
        }
      }

      // Tester tous les services en parallèle
      const [ollamaMedicalResult, ollamaTranslatorResult, ollama_nativeResult] = await Promise.all([
        testOllamaService(ollamaUrl, 'Docker Ollama Medical', 'docker'),
        testOllamaService(translatorUrl, 'Docker Traducteur', 'docker'),
        testOllamaService(nativeUrl, 'Ollama Natif', 'native')
      ])

      // Ajouter la propriété preferred pour le natif
      const ollama_nativeWithPreferred = {
        ...ollama_nativeResult,
        preferred: true,
        message: ollama_nativeResult.status === 'connected' 
          ? `${ollama_nativeResult.message} (⚡ Préféré)`
          : ollama_nativeResult.message
      }

      // Déterminer le service préféré
      const preferredService = ollama_nativeResult.status === 'connected' ? 'native' :
                              ollamaMedicalResult.status === 'connected' ? 'docker_medical' :
                              ollamaTranslatorResult.status === 'connected' ? 'docker_translator' : null

      setData({
        ollama_medical: ollamaMedicalResult,
        ollama_translator: ollamaTranslatorResult,
        ollama_native: ollama_nativeWithPreferred,
        preferred_service: preferredService,
        timestamp
      })
      
    } catch (error) {
      console.error('Erreur lors de la vérification des services:', error)
      setData({
        ollama_medical: { 
          status: 'error', 
          message: 'Erreur générale de connexion',
          models_count: 0,
          url: 'http://localhost:11434',
          type: 'docker'
        },
        ollama_translator: { 
          status: 'error', 
          message: 'Erreur générale de connexion',
          models_count: 0,
          url: 'http://localhost:11435',
          type: 'docker'
        },
        ollama_native: { 
          status: 'error', 
          message: 'Erreur générale de connexion',
          models_count: 0,
          url: 'http://localhost:11436',
          type: 'native',
          preferred: true
        },
        preferred_service: null,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isVisible) {
      fetchServiceStatus()
    }
  }, [isVisible])

  if (!isVisible) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'disconnected':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'error':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getServiceIcon = (type: string, preferred?: boolean) => {
    if (type === 'native' && preferred) {
      return <Zap className="h-5 w-5 text-yellow-500" />
    }
    return type === 'docker' ? <Brain className="h-5 w-5" /> : <Globe className="h-5 w-5" />
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">État des Services Ollama</h2>
            <p className="text-sm text-gray-500">
              Surveillance en temps réel • {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString('fr-FR') : 'Non disponible'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchServiceStatus}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Service préféré */}
        {data?.preferred_service && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-1">🎯 Service Recommandé</h3>
            <p className="text-sm text-blue-600">
              {data.preferred_service === 'native' ? 'Ollama Natif (Performances optimales)' :
               data.preferred_service === 'docker_medical' ? 'Docker Ollama Medical' :
               'Docker Traducteur (Fonctionnalité limitée)'}
            </p>
          </div>
        )}

        {/* Services */}
        <div className="space-y-4">
          {data ? (
            <>
              {/* Ollama Natif */}
              <div className={`border rounded-lg p-4 ${getStatusColor(data.ollama_native.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getServiceIcon(data.ollama_native.type, data.ollama_native.preferred)}
                    <div>
                      <h3 className="font-medium flex items-center gap-2">
                        Ollama Natif
                        {data.ollama_native.preferred && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">⚡ Préféré</span>
                        )}
                      </h3>
                      <p className="text-sm opacity-75">{data.ollama_native.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(data.ollama_native.status)}
                  </div>
                </div>
                <p className="text-sm mt-2 opacity-90">{data.ollama_native.message}</p>
              </div>

              {/* Docker Ollama Medical */}
              <div className={`border rounded-lg p-4 ${getStatusColor(data.ollama_medical.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getServiceIcon(data.ollama_medical.type)}
                    <div>
                      <h3 className="font-medium">Docker Ollama Medical</h3>
                      <p className="text-sm opacity-75">{data.ollama_medical.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(data.ollama_medical.status)}
                  </div>
                </div>
                <p className="text-sm mt-2 opacity-90">{data.ollama_medical.message}</p>
              </div>

              {/* Docker Traducteur */}
              <div className={`border rounded-lg p-4 ${getStatusColor(data.ollama_translator.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getServiceIcon(data.ollama_translator.type)}
                    <div>
                      <h3 className="font-medium">Docker Traducteur</h3>
                      <p className="text-sm opacity-75">{data.ollama_translator.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(data.ollama_translator.status)}
                  </div>
                </div>
                <p className="text-sm mt-2 opacity-90">{data.ollama_translator.message}</p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Vérification des services...</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-800 mb-2">💡 Instructions</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Ollama Natif:</strong> OLLAMA_HOST=127.0.0.1:11436 ollama serve</p>
            <p><strong>Docker:</strong> docker-compose up -d</p>
            <p><strong>Performances:</strong> Natif &gt; Docker Medical &gt; Docker Traducteur</p>
          </div>
        </div>

        {/* Pied de page */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

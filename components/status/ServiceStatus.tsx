'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, RefreshCw, Brain, Globe, Zap } from 'lucide-react'

interface ServiceStatusData {
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
      
      // URL d'Ollama natif
      const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_BASE_URL || 'http://localhost:11436'
      
      const timestamp = new Date().toISOString()
      
      // Tester Ollama
      try {
        const response = await fetch(`${ollamaUrl}/api/tags`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(3000)
        })

        if (response.ok) {
          const data = await response.json()
          setData({
            ollama_native: {
              status: 'connected' as const,
              message: `Ollama connecté - ${data.models?.length || 0} modèles`,
              models_count: data.models?.length || 0,
              url: ollamaUrl,
              type: 'native',
              preferred: true
            },
            preferred_service: 'native',
            timestamp
          })
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (error: any) {
        setData({
          ollama_native: {
            status: 'disconnected' as const,
            message: 'Ollama non accessible - Vérifiez qu\'il est démarré',
            models_count: 0,
            url: ollamaUrl,
            type: 'native',
            preferred: true
          },
          preferred_service: null,
          timestamp
        })
      }
      
    } catch (error) {
      console.error('Erreur lors de la vérification d\'Ollama:', error)
      setData({
        ollama_native: { 
          status: 'error', 
          message: 'Erreur de connexion',
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
            </>
          ) : (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Vérification d'Ollama...</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-800 mb-2">💡 Instructions</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Démarrer Ollama:</strong> OLLAMA_HOST=127.0.0.1:11436 ollama serve</p>
            <p><strong>Vérifier les modèles:</strong> ollama list</p>
            <p><strong>Port par défaut:</strong> 11436 (port personnalisé)</p>
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

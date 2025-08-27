import { useState, useEffect } from 'react'

interface ModelConfig {
  displayName: string
  description: string
  type: 'medical' | 'general'
  specialties: string[]
  parameters: string
  github: string
  website: string
  notes: string
  metrics: Record<string, string>
}

interface UseModelConfigResult {
  config: ModelConfig | null
  isConfigured: boolean
  loading: boolean
  error: string | null
  updateConfig: (newConfig: Partial<ModelConfig>) => Promise<boolean>
  deleteConfig: () => Promise<boolean>
  refresh: () => void
}

export function useModelConfig(modelName: string | null): UseModelConfigResult {
  const [config, setConfig] = useState<ModelConfig | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConfig = async () => {
    if (!modelName) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/models/config?model=${encodeURIComponent(modelName)}`)
      const data = await response.json()

      if (data.success) {
        setConfig(data.config)
        setIsConfigured(data.isConfigured)
      } else {
        setError(data.error || 'Erreur lors du chargement')
      }
    } catch (err) {
      setError('Erreur de connexion')
      console.error('Erreur fetch config:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = async (newConfig: Partial<ModelConfig>): Promise<boolean> => {
    if (!modelName) return false

    try {
      const fullConfig = { ...config, ...newConfig }
      
      const response = await fetch('/api/models/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelName,
          config: fullConfig
        })
      })

      const data = await response.json()

      if (data.success) {
        setConfig(data.config)
        setIsConfigured(true)
        setError(null)
        return true
      } else {
        setError(data.error || 'Erreur lors de la mise à jour')
        return false
      }
    } catch (err) {
      setError('Erreur de connexion')
      console.error('Erreur update config:', err)
      return false
    }
  }

  const deleteConfig = async (): Promise<boolean> => {
    if (!modelName) return false

    try {
      const response = await fetch(`/api/models/config?model=${encodeURIComponent(modelName)}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setConfig(null)
        setIsConfigured(false)
        setError(null)
        return true
      } else {
        setError(data.error || 'Erreur lors de la suppression')
        return false
      }
    } catch (err) {
      setError('Erreur de connexion')
      console.error('Erreur delete config:', err)
      return false
    }
  }

  const refresh = () => {
    fetchConfig()
  }

  useEffect(() => {
    fetchConfig()
  }, [modelName])

  return {
    config,
    isConfigured,
    loading,
    error,
    updateConfig,
    deleteConfig,
    refresh
  }
}

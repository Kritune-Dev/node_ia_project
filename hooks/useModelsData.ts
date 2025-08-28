import { useState, useEffect, useCallback } from 'react'
import ModelService from '../lib/services/modelService'

interface UseModelsDataReturn {
  data: any | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  invalidateCache: () => void
}

/**
 * Hook pour récupérer toutes les données des modèles
 */
export function useModelsData(): UseModelsDataReturn {
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const modelService = ModelService.getInstance()

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await modelService.getAllModelsData(forceRefresh)
      setData(result)
      
      if (!result) {
        setError('Impossible de charger les données des modèles')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      console.error('Erreur useModelsData:', err)
    } finally {
      setLoading(false)
    }
  }, [modelService])

  const refresh = useCallback(async () => {
    await loadData(true)
  }, [loadData])

  const invalidateCache = useCallback(() => {
    modelService.invalidateCache()
  }, [modelService])

  useEffect(() => {
    // S'abonner aux changements
    const unsubscribe = modelService.subscribe((newData) => {
      setData(newData)
      if (newData) {
        setLoading(false)
        setError(null)
      }
    })

    // Charger les données initiales
    loadData()

    return unsubscribe
  }, [loadData, modelService])

  return {
    data,
    loading,
    error,
    refresh,
    invalidateCache
  }
}

/**
 * Hook pour récupérer les familles de modèles avec filtres
 */
export function useModelFamilies(filters?: {
  showFastOnly?: boolean
  services?: string[]
  types?: string[]
  sizes?: string[]
  families?: string[]
}) {
  const [families, setFamilies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const modelService = ModelService.getInstance()

  const loadFamilies = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await modelService.getModelFamilies(filters)
      setFamilies(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      console.error('Erreur useModelFamilies:', err)
    } finally {
      setLoading(false)
    }
  }, [modelService, filters])

  useEffect(() => {
    loadFamilies()
  }, [loadFamilies])

  return {
    families,
    loading,
    error,
    refresh: loadFamilies
  }
}

/**
 * Hook pour récupérer les statistiques des modèles
 */
export function useModelStats() {
  const [stats, setStats] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const modelService = ModelService.getInstance()

  const loadStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await modelService.getStats()
      setStats(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      console.error('Erreur useModelStats:', err)
    } finally {
      setLoading(false)
    }
  }, [modelService])

  useEffect(() => {
    // S'abonner aux changements
    const unsubscribe = modelService.subscribe(() => {
      loadStats()
    })

    loadStats()

    return unsubscribe
  }, [loadStats, modelService])

  return {
    stats,
    loading,
    error,
    refresh: loadStats
  }
}

/**
 * Hook pour récupérer un modèle spécifique
 */
export function useModelData(modelName: string | null) {
  const [model, setModel] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const modelService = ModelService.getInstance()

  const loadModel = useCallback(async () => {
    if (!modelName) {
      setModel(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const result = await modelService.getModelData(modelName)
      setModel(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(errorMessage)
      console.error('Erreur useModelData:', err)
    } finally {
      setLoading(false)
    }
  }, [modelService, modelName])

  useEffect(() => {
    loadModel()
  }, [loadModel])

  return {
    model,
    loading,
    error,
    refresh: loadModel
  }
}

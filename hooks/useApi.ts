import useSWR from 'swr'

/**
 * 🎯 HOOKS SIMPLES pour les API calls - Nouvelle architecture RESTful
 * Utilise useSWR pour le cache automatique et la gestion d'état
 */

// Fetcher générique pour useSWR
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Erreur ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

/**
 * 🤖 Hook pour récupérer tous les modèles
 */
export function useModels() {
  const { data, error, isLoading, mutate } = useSWR('/api/models', fetcher, {
    refreshInterval: 30000, // Refresh toutes les 30s
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  })

  return {
    models: data?.models || [],
    count: data?.count || 0,
    isLoading,
    error,
    refresh: mutate
  }
}

/**
 * 🎯 Hook pour récupérer un modèle spécifique
 */
export function useModel(modelName: string | null) {
  const shouldFetch = !!modelName
  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? `/api/models/${encodeURIComponent(modelName)}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true
    }
  )

  return {
    model: data?.model || null,
    isLoading,
    error,
    refresh: mutate
  }
}

/**
 * 🏥 Hook pour vérifier la santé du système
 */
export function useSystemHealth() {
  const { data, error, isLoading, mutate } = useSWR('/api/health', fetcher, {
    refreshInterval: 10000, // Refresh toutes les 10s
    revalidateOnFocus: true,
    revalidateOnReconnect: true
  })

  return {
    isHealthy: data?.status === 'healthy',
    services: data?.services || {},
    status: data?.status || 'unknown',
    isLoading,
    error,
    refresh: mutate
  }
}

/**
 * 📋 Hook pour récupérer les configurations de benchmark
 */
export function useBenchmarkConfigs() {
  const { data, error, isLoading, mutate } = useSWR('/api/benchmark/configs', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  })

  return {
    configs: data?.configs || [],
    metadata: data?.metadata || {},
    isLoading,
    error,
    refresh: mutate
  }
}

/**
 * 🎯 Hook pour récupérer l'historique des benchmarks
 */
export function useBenchmarkHistory() {
  const { data, error, isLoading, mutate } = useSWR('/api/benchmark/history', fetcher, {
    refreshInterval: 60000, // Refresh toutes les minutes
    revalidateOnFocus: true
  })

  return {
    benchmarks: data?.benchmarks || [],
    count: data?.count || 0,
    lastUpdated: data?.lastUpdated,
    version: data?.version,
    isLoading,
    error,
    refresh: mutate
  }
}

/**
 * 📊 Hook pour récupérer les détails d'un benchmark
 */
export function useBenchmarkDetails(benchmarkId: string | null) {
  const shouldFetch = !!benchmarkId
  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? `/api/benchmark/history/${benchmarkId}` : null,
    fetcher,
    {
      revalidateOnFocus: false
    }
  )

  return {
    benchmark: data?.benchmark || null,
    isLoading,
    error: error?.message || null,
    refresh: mutate
  }
}

/**
 * ⚡ Hook pour générer du texte avec un modèle
 */
export function useGeneration() {
  const generateText = async (model: string, prompt: string, options: any = {}) => {
    const response = await fetch('/api/ollama/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        ...options
      })
    })

    if (!response.ok) {
      throw new Error(`Erreur génération: ${response.status}`)
    }

    return response.json()
  }

  return { generateText }
}

/**
 * 🔧 Hook utilitaire pour les opérations sur les modèles
 */
export function useModelOperations() {
  const updateModel = async (modelName: string, metadata: any) => {
    const response = await fetch(`/api/models/${encodeURIComponent(modelName)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata)
    })

    if (!response.ok) {
      throw new Error(`Erreur mise à jour: ${response.status}`)
    }

    return response.json()
  }

  const createModel = async (modelName: string, metadata: any) => {
    const response = await fetch(`/api/models/${encodeURIComponent(modelName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata)
    })

    if (!response.ok) {
      throw new Error(`Erreur création: ${response.status}`)
    }

    return response.json()
  }

  return { updateModel, createModel }
}

/**
 * 🎯 Hook pour l'état des tests en cours (pendingTest.json)
 */
export function usePendingTests() {
  const { data, error, isLoading, mutate } = useSWR('/api/benchmark/pending', fetcher, {
    refreshInterval: 2000, // Refresh toutes les 2s pendant les tests
    revalidateOnFocus: true
  })

  return {
    currentTest: data?.currentTest || null,
    queue: data?.queue || [],
    queueLength: data?.queueLength || 0,
    isRunning: data?.isRunning || false,
    history: data?.history || {},
    isLoading,
    error,
    refresh: mutate
  }
}

/**
 * 🚀 Hook unifié pour exécuter un benchmark avec tracking
 */
export function useBenchmarkExecution() {
  const startTest = async (benchmarkId: string, models: string[], estimatedDuration?: number) => {
    const response = await fetch('/api/benchmark/pending', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ benchmarkId, models, estimatedDuration })
    })

    if (!response.ok) {
      throw new Error(`Erreur démarrage test: ${response.status}`)
    }

    return response.json()
  }

  const updateTest = async (testId: string, updates: {
    progress?: any
    status?: string
    error?: string
    results?: any
  }) => {
    const response = await fetch('/api/benchmark/pending', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testId, ...updates })
    })

    if (!response.ok) {
      throw new Error(`Erreur mise à jour test: ${response.status}`)
    }

    return response.json()
  }

  const endTest = async (testId?: string, status: 'completed' | 'failed' | 'cancelled' = 'completed') => {
    const params = new URLSearchParams()
    if (testId) params.append('testId', testId)
    params.append('status', status)

    const response = await fetch(`/api/benchmark/pending?${params}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error(`Erreur fin test: ${response.status}`)
    }

    return response.json()
  }

  const executeBenchmark = async (
    benchmarkId: string, 
    models: string[], 
    options: {
      streaming?: boolean
      onProgress?: (data: any) => void
      onError?: (error: any) => void
    } = {}
  ) => {
    console.log(`🎯 [HOOK] Démarrage benchmark: ${benchmarkId} avec ${models.length} modèles`)
    
    try {
      // 1. Démarrer le tracking
      const { testId } = await startTest(benchmarkId, models)
      console.log(`✅ [HOOK] Test tracké avec l'ID: ${testId}`)
      
      // 2. Lancer l'exécution via l'API
      const response = await fetch('/api/benchmark/execute', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': options.streaming ? 'text/event-stream' : 'application/json'
        },
        body: JSON.stringify({
          benchmarkId,
          models,
          streaming: options.streaming || false
        })
      })

      if (!response.ok) {
        await endTest(testId, 'failed')
        throw new Error(`Erreur exécution: ${response.status}`)
      }

      // 3. Gestion streaming ou batch
      if (options.streaming && response.body) {
        return await handleStreamingResponse(response, testId, options.onProgress, updateTest, endTest)
      } else {
        const result = await response.json()
        await endTest(testId, 'completed')
        return result
      }
      
    } catch (error) {
      console.error('❌ [HOOK] Erreur exécution:', error)
      options.onError?.(error)
      throw error
    }
  }

  return { 
    executeBenchmark, 
    startTest, 
    updateTest, 
    endTest 
  }
}

/**
 * 📡 Gestion du streaming avec mise à jour du pending
 */
async function handleStreamingResponse(
  response: Response,
  testId: string,
  onProgress?: (data: any) => void,
  updateTest?: (testId: string, updates: any) => Promise<any>,
  endTest?: (testId?: string, status?: 'completed' | 'failed' | 'cancelled') => Promise<any>
) {
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let finalResult = null

  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6))
              
              // Mise à jour du tracking
              if (updateTest) {
                await updateTest(testId, {
                  progress: {
                    currentModel: data.model,
                    percentage: data.progress || 0
                  }
                })
              }
              
              // Callback de progression
              onProgress?.(data)
              
              if (data.type === 'complete') {
                finalResult = data.results
                if (endTest) {
                  await endTest(testId, 'completed')
                }
              }
              
              if (data.type === 'error') {
                if (endTest) {
                  await endTest(testId, 'failed')
                }
                throw new Error(data.error)
              }
              
            } catch (e) {
              console.warn('Ligne SSE mal formée:', line)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  return finalResult
}

/**
 * 🎯 Hook pour récupérer les données benchmark d'un modèle
 */
// Hook pour les données de benchmark d'un modèle spécifique
export const useModelBenchmarkData = (modelName: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    modelName ? `/api/models/${encodeURIComponent(modelName)}/benchmark` : null,
    fetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
    }
  )

  const updateNotes = async (notes: any) => {
    try {
      const response = await fetch(`/api/models/${encodeURIComponent(modelName)}/benchmark`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour des notes')
      }

      const result = await response.json()
      
      // Revalider les données
      mutate()
      
      return result
    } catch (error) {
      console.error('Erreur updateNotes:', error)
      throw error
    }
  }

  return {
    data: data?.data || null,
    error,
    isLoading,
    updateNotes,
    mutate
  }
}

/**
 * 📈 Hook pour les opérations sur les benchmarks
 */
export function useBenchmarkOperations() {
  const addBenchmark = async (benchmarkData: any) => {
    const response = await fetch('/api/benchmark/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(benchmarkData)
    })

    if (!response.ok) {
      throw new Error(`Erreur ajout benchmark: ${response.status}`)
    }

    return response.json()
  }

  const deleteBenchmark = async (benchmarkId: string, deleteFiles: boolean = false) => {
    const params = new URLSearchParams()
    params.append('id', benchmarkId)
    if (deleteFiles) params.append('deleteFiles', 'true')

    const response = await fetch(`/api/benchmark/history?${params}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error(`Erreur suppression: ${response.status}`)
    }

    return response.json()
  }

  const deleteAllBenchmarks = async (deleteFiles: boolean = false) => {
    const params = new URLSearchParams()
    if (deleteFiles) params.append('deleteFiles', 'true')

    const response = await fetch(`/api/benchmark/history?${params}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error(`Erreur suppression totale: ${response.status}`)
    }

    return response.json()
  }

  const addBenchmarkConfig = async (configData: any) => {
    const response = await fetch('/api/benchmark/configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configData)
    })

    if (!response.ok) {
      throw new Error(`Erreur ajout configuration: ${response.status}`)
    }

    return response.json()
  }

  return { addBenchmark, deleteBenchmark, deleteAllBenchmarks, addBenchmarkConfig }
}

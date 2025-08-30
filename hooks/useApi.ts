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
 * � Hook pour exécuter un benchmark avec la nouvelle API
 */
export function useBenchmarkExecution() {
  const executeBenchmark = async (benchmarkId: string, models: string[], options: {
    iterations?: number;
    saveResults?: boolean;
    streaming?: boolean;
  } = {}) => {
    const response = await fetch('/api/benchmark/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        benchmarkId,
        models,
        iterations: options.iterations || 1,
        saveResults: options.saveResults !== false
      })
    })

    if (!response.ok) {
      throw new Error(`Erreur exécution benchmark: ${response.status}`)
    }

    return response.json()
  }

  const executeBenchmarkStream = async (
    benchmarkId: string, 
    models: string[], 
    onProgress?: (data: any) => void
  ) => {
    const response = await fetch('/api/benchmark/execute', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        benchmarkId,
        models,
        streaming: true
      })
    })

    if (!response.ok) {
      throw new Error(`Erreur exécution benchmark stream: ${response.status}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (reader) {
      let result = null
      
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
                onProgress?.(data)
                
                if (data.type === 'complete') {
                  result = data.result
                }
              } catch (e) {
                // Ignorer les lignes mal formées
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
      
      return result
    }
    
    throw new Error('Impossible de lire le stream de réponse')
  }

  return { executeBenchmark, executeBenchmarkStream }
}

/**
 * �📈 Hook pour les opérations sur les benchmarks
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

  const deleteBenchmark = async (benchmarkId: string) => {
    const response = await fetch(`/api/benchmark/history/${benchmarkId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error(`Erreur suppression: ${response.status}`)
    }

    return response.json()
  }

  const executeB = async (models: string[], questions: any[]) => {
    const response = await fetch('/api/benchmark/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ models, questions })
    })

    if (!response.ok) {
      throw new Error(`Erreur exécution: ${response.status}`)
    }

    return response.json()
  }

  return { addBenchmark, addBenchmarkConfig, deleteBenchmark, executeBenchmark: executeB }
}

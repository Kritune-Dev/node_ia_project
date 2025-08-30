import { useState, useEffect } from 'react'

export interface ModelCompleteData {
  // Informations statiques
  name: string
  displayName: string
  description?: string
  type: 'medical' | 'general'
  size: number
  sizeFormatted: string
  parameters: string
  hasNative: boolean
  services: any[]
  github?: string
  website?: string
  
  // Statistiques de performance
  totalTests: number
  successfulTests: number
  avgResponseTime: number
  avgTokensPerSecond: number
  successRate: number
  avgUserRating: number
  totalRatings: number
  
  // Données temporelles
  lastTested: string
  firstTested: string
  totalBenchmarks: number
  
  // Historique des tests
  benchmarkHistory: BenchmarkResult[]
  
  // Commentaires et notes
  globalComment: string
  
  // Catégories de tests
  categories: { [key: string]: number }
  
  // Évolution des performances
  performanceHistory: PerformancePoint[]
}

export interface BenchmarkResult {
  benchmarkId: string
  timestamp: string
  category: string
  questionId: string
  question: string
  response: string
  success: boolean
  responseTime: number
  tokensGenerated: number
  tokensPerSecond: number
  userRating?: number
  userComment?: string
  error?: string
}

export interface PerformancePoint {
  date: string
  avgResponseTime: number
  avgTokensPerSecond: number
  successRate: number
  avgRating: number
}

export function useModelCompleteData(modelName: string | null) {
  const [data, setData] = useState<ModelCompleteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchModelData = async (name: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/models/${encodeURIComponent(name)}`)
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données du modèle')
      }
      
      const result = await response.json()
      
      if (result.success) {
        // Ajouter le commentaire global depuis localStorage
        const globalComments = JSON.parse(localStorage.getItem('globalModelComments') || '{}')
        const completeData = {
          ...result.data,
          globalComment: globalComments[name] || ''
        }
        setData(completeData)
      } else {
        throw new Error(result.error || 'Erreur inconnue')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const updateGlobalComment = (comment: string) => {
    if (!modelName || !data) return
    
    // Mettre à jour localStorage
    const globalComments = JSON.parse(localStorage.getItem('globalModelComments') || '{}')
    globalComments[modelName] = comment
    localStorage.setItem('globalModelComments', JSON.stringify(globalComments))
    
    // Mettre à jour l'état local
    setData(prev => prev ? { ...prev, globalComment: comment } : null)
  }

  useEffect(() => {
    if (modelName) {
      fetchModelData(modelName)
    } else {
      setData(null)
      setError(null)
    }
  }, [modelName])

  return {
    data,
    loading,
    error,
    refetch: () => modelName ? fetchModelData(modelName) : Promise.resolve(),
    updateGlobalComment
  }
}

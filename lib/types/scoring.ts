/**
 * 🎯 Types pour le système de scoring des benchmarks - Intégré dans les modèles
 */

export interface SeriesScore {
  score: number // 0-10
  isAutomatic: boolean
  comment: string
  scoredBy: 'user' | 'system'
  scoredAt: string // ISO date
  benchmarkId?: string // ID du benchmark ayant généré ce score
}

export interface ModelScores {
  [seriesId: string]: SeriesScore
}

export interface BenchmarkModelData {
  modelId: string
  displayName: string
  lastUpdated?: string
  notes: {
    [category: string]: string
  }
  scores: ModelScores // Nouveau champ pour les scores
  resultsSummary: {
    [key: string]: any
  }
  history: any[]
}

export interface SeriesScoreInput {
  seriesId: string
  score: number
  comment: string
  benchmarkId?: string
}

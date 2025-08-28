/**
 * Service centralisé pour gérer tous les appels API liés aux modèles
 * Évite les appels multiples et centralise la gestion des données
 */

interface ModelData {
  status: 'connected' | 'disconnected'
  primary_service?: {
    name: string
    url: string
    type: string
  }
  available_services?: Array<{
    name: string
    url: string
    models_count: number
    type: string
  }>
  filter_options?: {
    services: Array<{
      name: string
      type: string
      count: number
    }>
    types: Array<{
      label: string
      value: string
      count: number
    }>
    sizes: Array<{
      label: string
      min: number
      max: number
      count: number
    }>
    families: Array<{
      name: string
      count: number
      type: string
    }>
  }
  model_families?: Array<{
    family: string
    baseInfo: any
    variants: Array<{
      name: string
      variant: string
      size: number
      sizeFormatted: string
      services: any[]
      hasNative: boolean
      hasDocker: boolean
      installed: boolean
      isFast?: boolean
    }>
  }>
  total: number
  medical_models: number
  general_models: number
  fast_models: number
  available_models: number
  models: {
    all: any[]
    medical: any[]
    general: any[]
    fast: any[]
    installed: any[]
    not_installed: any[]
  }
  raw_models: any[]
  performance_note?: string
  timestamp: string
  error?: string
  instructions?: {
    title: string
    steps: string[]
    install_first_model: string[]
  }
}

class ModelService {
  private static instance: ModelService
  private cache: ModelData | null = null
  private lastFetch = 0
  private readonly CACHE_DURATION = 2 * 60 * 1000 // 2 minutes
  private isLoading = false
  private subscribers: Array<(data: ModelData | null) => void> = []

  static getInstance(): ModelService {
    if (!ModelService.instance) {
      ModelService.instance = new ModelService()
    }
    return ModelService.instance
  }

  /**
   * S'abonner aux changements de données
   */
  subscribe(callback: (data: ModelData | null) => void): () => void {
    this.subscribers.push(callback)
    
    // Envoyer les données actuelles si disponibles
    if (this.cache) {
      callback(this.cache)
    }

    // Retourner une fonction de désabonnement
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) {
        this.subscribers.splice(index, 1)
      }
    }
  }

  /**
   * Notifier tous les abonnés
   */
  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.cache))
  }

  /**
   * Vérifier si le cache est valide
   */
  private isCacheValid(): boolean {
    return this.cache !== null && (Date.now() - this.lastFetch) < this.CACHE_DURATION
  }

  /**
   * Récupérer toutes les données des modèles (avec cache)
   */
  async getAllModelsData(forceRefresh = false): Promise<ModelData | null> {
    // Si on a déjà un appel en cours, attendre
    if (this.isLoading && !forceRefresh) {
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!this.isLoading) {
            resolve(this.cache)
          } else {
            setTimeout(checkLoading, 100)
          }
        }
        checkLoading()
      })
    }

    // Utiliser le cache si valide et pas de rafraîchissement forcé
    if (this.isCacheValid() && !forceRefresh) {
      return this.cache
    }

    this.isLoading = true

    try {
      const response = await fetch('/api/models')
      const data = await response.json()
      
      if (response.ok) {
        // Enrichir les données avec des informations calculées
        const enrichedData = this.enrichModelData(data)
        
        this.cache = enrichedData
        this.lastFetch = Date.now()
        this.notifySubscribers()
        
        return enrichedData
      } else {
        console.error('Erreur API modèles:', data.error)
        return null
      }
    } catch (error) {
      console.error('Erreur lors du chargement des modèles:', error)
      return null
    } finally {
      this.isLoading = false
    }
  }

  /**
   * Enrichir les données avec des informations calculées
   */
  private enrichModelData(data: any): ModelData {
    // Calculer les modèles rapides
    const fastModels = data.models?.all?.filter((model: any) => {
      const sizeInGB = model.size ? model.size / (1024 * 1024 * 1024) : 0
      return sizeInGB < 2 || model.sizeFormatted?.includes('MB')
    }) || []

    // Enrichir les familles avec l'information "rapide"
    const enrichedFamilies = data.model_families?.map((family: any) => ({
      ...family,
      variants: family.variants.map((variant: any) => {
        const sizeInGB = variant.size ? variant.size / (1024 * 1024 * 1024) : 0
        return {
          ...variant,
          isFast: sizeInGB < 2 || variant.sizeFormatted?.includes('MB')
        }
      })
    })) || []

    return {
      ...data,
      fast_models: fastModels.length,
      models: {
        ...data.models,
        fast: fastModels
      },
      model_families: enrichedFamilies
    }
  }

  /**
   * Récupérer les données d'un modèle spécifique
   */
  async getModelData(modelName: string): Promise<any | null> {
    const allData = await this.getAllModelsData()
    if (!allData) return null

    return allData.models.all.find(model => model.name === modelName) || null
  }

  /**
   * Récupérer les familles de modèles avec filtres
   */
  async getModelFamilies(filters?: {
    showFastOnly?: boolean
    services?: string[]
    types?: string[]
    sizes?: string[]
    families?: string[]
  }): Promise<any[]> {
    const allData = await this.getAllModelsData()
    if (!allData || !allData.model_families) return []

    let families = allData.model_families

    // Filtrer par mode rapide
    if (filters?.showFastOnly) {
      families = families.map(family => ({
        ...family,
        variants: family.variants.filter(variant => variant.isFast)
      })).filter(family => family.variants.length > 0)
    }

    // Appliquer d'autres filtres si nécessaire
    if (filters?.types && filters.types.length > 0) {
      families = families.filter(family => 
        family.baseInfo && filters.types!.includes(family.baseInfo.type)
      )
    }

    return families
  }

  /**
   * Invalider le cache
   */
  invalidateCache(): void {
    this.cache = null
    this.lastFetch = 0
    this.notifySubscribers()
  }

  /**
   * Forcer le rafraîchissement des données
   */
  async refresh(): Promise<ModelData | null> {
    return this.getAllModelsData(true)
  }

  /**
   * Obtenir les statistiques rapides
   */
  async getStats(): Promise<{
    total: number
    medical: number
    general: number
    fast: number
    available: number
    status: string
  } | null> {
    const data = await this.getAllModelsData()
    if (!data) return null

    return {
      total: data.total,
      medical: data.medical_models,
      general: data.general_models,
      fast: data.fast_models,
      available: data.available_models,
      status: data.status
    }
  }
}

export default ModelService

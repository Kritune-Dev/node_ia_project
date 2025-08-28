import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Fonction pour charger la configuration des modèles
async function loadModelsConfig() {
  try {
    const configPath = path.join(process.cwd(), 'data', 'models-config.json')
    const configData = fs.readFileSync(configPath, 'utf8')
    return JSON.parse(configData)
  } catch (error) {
    console.warn('Configuration des modèles non trouvée, utilisation des valeurs par défaut')
    return null
  }
}

// Helper function pour extraire les paramètres du modèle depuis le nom
function extractModelParameters(modelName: string, size: number): string {
  // Extraire depuis le nom du modèle
  const name = modelName.toLowerCase()
  
  // Patterns pour extraire les paramètres
  const parameterPatterns = [
    /(\d+\.?\d*)[b]/i,  // 7b, 3b, 1.5b, etc.
    /(\d+\.?\d*)[m]/i,  // 400m, 1.1m, etc.
    /:(\d+\.?\d*[bm])/i, // après les deux points
  ]
  
  for (const pattern of parameterPatterns) {
    const match = name.match(pattern)
    if (match) {
      return match[1] + (match[0].includes('m') ? 'M' : 'B')
    }
  }
  
  // Si pas trouvé dans le nom, estimer depuis la taille
  if (size > 0) {
    const sizeInGB = Math.round(size / (1024 * 1024 * 1024))
    // Estimation approximative : 1GB ≈ 1-2B paramètres, 4GB ≈ 7B, etc.
    if (sizeInGB < 1) return '1B'
    if (sizeInGB < 2) return '1-2B'
    if (sizeInGB < 4) return '3B'
    if (sizeInGB < 6) return '7B'
    if (sizeInGB < 10) return '8B'
    if (sizeInGB < 20) return '13B'
    if (sizeInGB < 40) return '30B'
    return '70B+'
  }
  
  return 'N/A'
}

// Helper function pour résoudre les versions "latest" vers leur vraie version
function resolveLatestVersion(modelName: string, modelInfo: any): string {
  const baseName = modelName.split(':')[0]
  const tag = modelName.includes(':') ? modelName.split(':')[1] : 'latest'
  
  if (tag !== 'latest') {
    return tag
  }
  
  // Mapping des modèles latest vers leur vraie version
  const latestMappings: { [key: string]: string } = {
    'llama3.2': '3b',
    'llama3.1': '8b', 
    'llama3': '8b',
    'phi3': 'mini',
    'qwen2': '7b',
    'qwen2.5': '7b',
    'qwen3': '7b',
    'mistral': '7b',
    'gemma2': '9b',
    'gemma': '7b',
    'gemma3': '7b',
    'tinyllama': '1.1b',
    'deepseek-r1': '7b',
    'deepseek': '7b',
    'codegemma': '7b',
    'codellama': '7b',
    'meditron': '7b',
    'medllama2': '7b',
    'medgemma': '7b',
    'biomistral': '7b',
    'orca2': '7b',
    'solar': '10.7b',
    'starling-lm': '7b',
    'lastmass': '7b',
    'lastmass/qwen3_medical_grpo': '7b',
    'qwen3_medical_grpo': '7b'
  }
  
  // Vérifier si on a un mapping pour ce modèle
  const resolvedVersion = latestMappings[baseName] || latestMappings[baseName.replace(/[-_]/g, '')]
  
  if (resolvedVersion) {
    return resolvedVersion
  }
  
  // Si pas de mapping trouvé, essayer d'extraire depuis les métadonnées ou la taille
  if (modelInfo && modelInfo.size) {
    const params = extractModelParameters(modelName, modelInfo.size)
    if (params !== 'N/A') {
      return params.toLowerCase()
    }
  }
  
  return 'latest'
}

// Helper function pour récupérer les scores de benchmark d'un modèle
async function getModelBenchmarkScores(modelName: string): Promise<any> {
  try {
    const historyFile = path.join(process.cwd(), 'benchmark_results', 'history.json')
    
    if (!fs.existsSync(historyFile)) {
      return null
    }
    
    const historyData = JSON.parse(fs.readFileSync(historyFile, 'utf-8'))
    const benchmarks = historyData.benchmarks || []
    
    // Trouver les benchmarks contenant ce modèle
    const modelBenchmarks = benchmarks.filter((b: any) => 
      b.results && b.results[modelName]
    )
    
    if (modelBenchmarks.length === 0) {
      return null
    }
    
    // Calculer les scores moyens
    let totalTests = 0
    let successfulTests = 0
    let validResponseTimeTests = 0
    let totalResponseTime = 0
    let totalTokensPerSecond = 0
    let totalRating = 0
    let ratedTests = 0
    
    modelBenchmarks.forEach((benchmark: any) => {
      const modelResult = benchmark.results[modelName]
      if (modelResult) {
        const questions = Object.values(modelResult.questions || {}) as any[]
        
        questions.forEach((test: any) => {
          totalTests++
          if (test.success) {
            successfulTests++
            if (test.responseTime !== null && !test.isTimeout) {
              totalResponseTime += test.responseTime || 0
              validResponseTimeTests++
            }
            totalTokensPerSecond += test.tokensPerSecond || 0
          }
          
          if (test.user_rating && test.user_rating > 0) {
            totalRating += test.user_rating
            ratedTests++
          }
        })
      }
    })
    
    if (totalTests === 0) {
      return null
    }
    
    return {
      successRate: Math.round((successfulTests / totalTests) * 100),
      averageResponseTime: Math.round(totalResponseTime / validResponseTimeTests || 0),
      averageTokensPerSecond: Math.round((totalTokensPerSecond / successfulTests || 0) * 10) / 10,
      averageRating: ratedTests > 0 ? Math.round((totalRating / ratedTests) * 10) / 10 : null,
      totalTests,
      successfulTests,
      validResponseTimeTests,
      lastTested: modelBenchmarks[0]?.timestamp
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des scores:', error)
    return null
  }
}

async function getModelsFromService(url: string, serviceName: string): Promise<{ models: any[], serviceName: string, url: string } | null> {
  try {
    const response = await fetch(`${url}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(3000)
    })

    if (!response.ok) {
      console.log(`${serviceName} not available: ${response.status}`)
      return null
    }

    const data = await response.json()
    return {
      models: data.models || [],
      serviceName,
      url
    }
  } catch (error) {
    console.log(`${serviceName} connection failed:`, error)
    return null
  }
}

// Fonction de fallback pour enrichir les modèles sans config
function enrichModelFallback(name: string) {
  let modelInfo = {
    displayName: name,
    description: "Modèle de langage avancé",
    type: "general",
    specialties: [] as string[],
    parameters: "Inconnu",
    github: "",
    website: "",
    notes: "",
    creator: "Inconnu",
    license: "Inconnu"
  };

  return modelInfo;
}

export async function GET() {
  // URL pour Ollama natif
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11436'
  
  try {
    // Charger la configuration des modèles
    const modelsConfig = await loadModelsConfig()
    
    // Tester Ollama
    const ollamaResult = await getModelsFromService(ollamaUrl, 'Ollama')
    
    // Vérifier si Ollama est disponible
    const availableServices = ollamaResult ? [ollamaResult] : []
    
    if (availableServices.length === 0) {
      throw new Error('Service Ollama non disponible')
    }
    
    // Fonction pour obtenir des informations enrichies sur le modèle
    const getModelInfo = (model: any, serviceName: string, serviceType: string) => {
      const name = model.name
      
      // Utiliser la configuration JSON si disponible, sinon fallback
      let metadata;
      if (modelsConfig && modelsConfig.models[name]) {
        metadata = modelsConfig.models[name];
      } else {
        metadata = enrichModelFallback(name);
      }
      
      const sizeInGB = model.size ? (model.size / (1024 * 1024 * 1024)).toFixed(1) : 'N/A'
      
      // Résoudre la version "latest" vers la vraie version
      const originalTag = model.name.includes(':') ? model.name.split(':')[1] : 'latest'
      const resolvedTag = resolveLatestVersion(model.name, model)
      
      // Extraire les paramètres du modèle
      const parameters = metadata.parameters
      
      
      return {
        name: model.name,
        displayName: metadata.displayName,
        creator: metadata.creator || "Inconnu",
        description: metadata.description,
        github: metadata.github,
        website: metadata.website,
        paper: metadata.paper,
        license: metadata.license,
        specialties: metadata.specialties,
        type: metadata.type,
        size: model.size,
        sizeFormatted: `${sizeInGB} GB`,
        parameters: parameters,
        originalTag: originalTag,
        resolvedTag: resolvedTag,
        modified: model.modified_at,
        modifiedFormatted: model.modified_at ? new Date(model.modified_at).toLocaleDateString('fr-FR') : 'N/A',
        digest: model.digest || '',
        details: model,
        available: true,
        installed: true,
        notes: metadata.notes || "",
        metrics: metadata.metrics || {},
        service: {
          name: serviceName,
          type: serviceType,
          isNative: serviceType === 'native'
        }
      }
    }

    // Collecter tous les modèles de tous les services
    const modelMap = new Map()
    const digestMap = new Map()
    const modelFamilyMap = new Map()

    availableServices.forEach(service => {
      const serviceType = 'native'
      
      // Exclure les modèles du service traducteur de l'affichage
      if (service.serviceName.toLowerCase().includes('traducteur') || 
          service.serviceName.toLowerCase().includes('translator')) {
        return
      }
      
      service.models.forEach(model => {
        const modelInfo = getModelInfo(model, service.serviceName, serviceType)
        const modelKey = model.name
        const digest = model.digest || ''

        // Extraire la famille du modèle (nom sans version/taille)
        const familyName = model.name.split(':')[0]
        const variant = model.name.includes(':') ? model.name.split(':')[1] : 'latest'

        // Vérifier si ce digest existe déjà (doublon potentiel)
        if (digest && digestMap.has(digest)) {
          const existingModel = digestMap.get(digest)
          // Ajouter ce service au modèle existant si c'est le même modèle
          if (!existingModel.services) existingModel.services = [existingModel.service]
          existingModel.services.push(modelInfo.service)
          existingModel.hasNative = existingModel.hasNative || modelInfo.service.isNative
          existingModel.hasDocker = existingModel.hasDocker || !modelInfo.service.isNative
          
          // Si c'est un modèle latest et qu'il existe déjà une version avec taille, ignorer le latest
          if (variant === 'latest' && existingModel.variant !== 'latest') {
            return
          }
          // Si le modèle existant est latest et celui-ci a une taille spécifique, remplacer
          if (existingModel.variant === 'latest' && variant !== 'latest') {
            digestMap.set(digest, modelInfo)
            modelMap.set(modelKey, modelInfo)
          }
        } else {
          // Nouveau modèle unique
          const enrichedModel: any = {
            ...modelInfo,
            services: [modelInfo.service],
            hasNative: modelInfo.service.isNative,
            hasDocker: !modelInfo.service.isNative,
            family: familyName,
            variant: variant
          }
          
          if (digest) digestMap.set(digest, enrichedModel)
          modelMap.set(modelKey, enrichedModel)

          // Ajouter à la carte des familles
          if (!modelFamilyMap.has(familyName)) {
            modelFamilyMap.set(familyName, {
              family: familyName,
              baseInfo: enrichedModel,
              variants: []
            })
          }
          modelFamilyMap.get(familyName).variants.push({
            name: modelKey,
            variant: variant,
            parameters: enrichedModel.parameters,
            size: enrichedModel.size,
            sizeFormatted: enrichedModel.sizeFormatted,
            services: enrichedModel.services,
            hasNative: enrichedModel.hasNative,
            hasDocker: enrichedModel.hasDocker,
            installed: enrichedModel.installed,
            digest: digest
          })
        }
      })
    })

    const availableModels = Array.from(modelMap.values())
    
    // Ajouter les scores de benchmark à chaque modèle
    for (const model of availableModels) {
      try {
        model.benchmarkScores = await getModelBenchmarkScores(model.name)
      } catch (error) {
        console.warn(`Erreur lors de la récupération des scores pour ${model.name}:`, error)
        model.benchmarkScores = null
      }
    }
    
    const modelFamilies = Array.from(modelFamilyMap.values())
    
    // Trier les variantes par taille
    modelFamilies.forEach(family => {
      family.variants.sort((a: any, b: any) => {
        const getSizeNumber = (variant: string) => {
          const match = variant.match(/(\d+\.?\d*)([bm]?)/)
          if (!match) return 0
          const num = parseFloat(match[1])
          const unit = match[2]
          if (unit === 'b') return num
          if (unit === 'm') return num / 1000
          return num
        }
        
        return getSizeNumber(a.variant) - getSizeNumber(b.variant)
      })
    })

    // Séparer par type
    const medicalModels = availableModels.filter((m: any) => m.type === 'medical')
    const generalModels = availableModels.filter((m: any) => m.type === 'general')

    // Compter le total de modèles uniques
    const totalModels = availableModels.length
    
    // Utiliser uniquement les modèles installés
    const allModels = availableModels

    // Calculer les statistiques pour les filtres
    const serviceStats = availableServices.map(service => ({
      name: service.serviceName,
      type: 'native',
      count: availableModels.filter((m: any) => 
        m.services?.some((s: any) => s.name === service.serviceName)
      ).length
    }))

    const sizeRanges = [
      { label: '< 1GB', min: 0, max: 1000000000, count: 0 },
      { label: '1-3GB', min: 1000000000, max: 3000000000, count: 0 },
      { label: '3-7GB', min: 3000000000, max: 7000000000, count: 0 },
      { label: '7-15GB', min: 7000000000, max: 15000000000, count: 0 },
      { label: '> 15GB', min: 15000000000, max: Infinity, count: 0 }
    ]

    availableModels.forEach((model: any) => {
      const size = model.size || 0
      sizeRanges.forEach(range => {
        if (size >= range.min && size < range.max) {
          range.count++
        }
      })
    })

    // Calculer les modèles rapides (moins de 2GB)
    const fastModels = allModels.filter((model: any) => {
      const sizeInGB = model.size ? model.size / (1024 * 1024 * 1024) : 0
      return sizeInGB < 2 || model.sizeFormatted?.includes('MB')
    })

    // Enrichir les familles avec l'information "rapide"
    const enrichedModelFamilies = modelFamilies.map(family => ({
      ...family,
      variants: family.variants.map((variant: any) => {
        const sizeInGB = variant.size ? variant.size / (1024 * 1024 * 1024) : 0
        return {
          ...variant,
          isFast: sizeInGB < 2 || variant.sizeFormatted?.includes('MB')
        }
      })
    }))

    return NextResponse.json({
      status: 'connected',
      configLoaded: !!modelsConfig,
      primary_service: availableServices.length > 0 ? {
        name: availableServices[0].serviceName,
        url: availableServices[0].url,
        type: 'native'
      } : null,
      available_services: availableServices.map(service => ({
        name: service.serviceName,
        url: service.url,
        models_count: service.models.length,
        type: 'native'
      })),
      filter_options: {
        services: serviceStats,
        types: [
          { label: 'Médical', value: 'medical', count: medicalModels.length },
          { label: 'Général', value: 'general', count: generalModels.length }
        ],
        sizes: sizeRanges.filter(range => range.count > 0),
        families: modelFamilies.map(family => ({
          name: family.family,
          count: family.variants.length,
          type: family.baseInfo.type
        }))
      },
      total: totalModels,
      medical_models: medicalModels.length,
      general_models: generalModels.length,
      fast_models: fastModels.length,
      available_models: availableModels.length,
      model_families: enrichedModelFamilies,
      models: {
        all: allModels,
        medical: allModels.filter((m: any) => m?.type === 'medical'),
        general: allModels.filter((m: any) => m?.type === 'general'),
        fast: fastModels,
        installed: availableModels,
        not_installed: []
      },
      raw_models: Array.from(new Set(availableServices.flatMap(s => s.models))),
      performance_note: availableServices.length > 0 && 
        'native' ? 
        'Utilisation d\'Ollama natif - Performances optimales' :
        'Utilisation de Docker - Performances correctes',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Models API error:', error)
    
    let errorMessage = 'Erreur inconnue'
    let instructions: string[] = []

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout de connexion - Docker Ollama probablement arrêté'
        instructions = [
          'Démarrer Docker Desktop',
          'Exécuter: docker-compose up -d',
          'Attendre le démarrage complet des services',
          'Actualiser la page'
        ]
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Docker Ollama non accessible - Services arrêtés'
        instructions = [
          'Vérifier que Docker Desktop est démarré',
          'Dans le terminal, aller au dossier du projet',
          'Exécuter: docker-compose up -d',
          'Attendre quelques minutes pour le démarrage',
          'Réessayer'
        ]
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Impossible de se connecter aux services Ollama'
        instructions = [
          'Vérifier les services Docker: docker-compose ps',
          'Redémarrer si nécessaire: docker-compose restart',
          'Vérifier les logs: docker-compose logs ollama-medical'
        ]
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      {
        status: 'disconnected',
        error: errorMessage,
        docker_status: 'offline',
        configLoaded: false,
        models: {
          all: [],
          medical: [],
          general: [],
          installed: [],
          not_installed: []
        },
        instructions: {
          title: 'Comment résoudre ce problème',
          steps: instructions,
          install_first_model: [
            'Une fois Docker démarré, installer un premier modèle:',
            'docker exec ollama-medical ollama pull llama3.2:3b',
            'Ou pour un modèle médical:',
            'docker exec ollama-medical ollama pull meditron:latest'
          ]
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { model_name } = await request.json()
    
    if (!model_name) {
      return NextResponse.json(
        { error: 'Model name is required' },
        { status: 400 }
      )
    }

    // URLs des services dans l'ordre de préférence (natif d'abord)
    const services = [
      { url: process.env.NATIVE_OLLAMA_URL || 'http://localhost:11436', name: 'Ollama Natif', type: 'native' },
      { url: process.env.OLLAMA_BASE_URL || 'http://localhost:11434', name: 'Docker Ollama Medical', type: 'docker' },
    ]
    
    // Tester quel service est disponible (priorité au natif)
    let selectedService = null
    for (const service of services) {
      const testResult = await getModelsFromService(service.url, service.name)
      if (testResult) {
        selectedService = service
        break
      }
    }
    
    if (!selectedService) {
      throw new Error('Aucun service Ollama disponible pour installer le modèle')
    }
    
    // Installer le modèle sur le service sélectionné
    const response = await fetch(`${selectedService.url}/api/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: model_name,
        stream: false
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to install model: ${response.status}`)
    }

    return NextResponse.json({
      message: `Model ${model_name} installation started`,
      model: model_name,
      service_used: {
        name: selectedService.name,
        url: selectedService.url,
        type: selectedService.type
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Model installation error:', error)
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

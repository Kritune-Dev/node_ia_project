import { NextRequest, NextResponse } from 'next/server'

// Helper function pour tester et récupérer les modèles d'un service
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

export async function GET() {
  // URLs des services dans l'ordre de préférence (natif d'abord)
  const services = [
    { url: process.env.NATIVE_OLLAMA_URL || 'http://localhost:11436', name: 'Ollama Natif', type: 'native' },
    { url: process.env.OLLAMA_BASE_URL || 'http://localhost:11434', name: 'Docker Ollama Medical', type: 'docker' },
    { url: process.env.TRANSLATOR_BASE_URL || 'http://localhost:11435', name: 'Docker Ollama Translator', type: 'docker' }
  ]
  
  try {
    // Tester tous les services en parallèle
    const serviceResults = await Promise.all(
      services.map(service => getModelsFromService(service.url, service.name))
    )
    
    // Filtrer les services disponibles
    const availableServices = serviceResults.filter(result => result !== null)
    
    if (availableServices.length === 0) {
      throw new Error('Aucun service Ollama disponible')
    }
    
    // Base de données des informations sur les LLM
    const getModelMetadata = (modelName: string) => {
      const cleanName = modelName.split(':')[0].toLowerCase()
      const modelDatabase: Record<string, any> = {
        'llama3.2': {
          fullName: 'Llama 3.2',
          creator: 'Meta AI',
          description: 'Modèle de langage général de Meta, optimisé pour les conversations et le raisonnement',
          github: 'https://github.com/meta-llama/llama-models',
          website: 'https://ai.meta.com/llama/',
          paper: 'https://arxiv.org/abs/2407.21783',
          license: 'Llama 3.2 Community License',
          type: 'general',
          specialties: ['Conversation', 'Raisonnement', 'Code']
        },
        'meditron': {
          fullName: 'Meditron',
          creator: 'EPFL',
          description: 'LLM spécialisé en médecine, entraîné sur des textes médicaux',
          github: 'https://github.com/epfLLM/meditron',
          website: 'https://huggingface.co/epfl-llm/meditron-7b',
          paper: 'https://arxiv.org/abs/2311.16079',
          license: 'Apache 2.0',
          type: 'medical',
          specialties: ['Médecine', 'Diagnostic', 'Recherche médicale']
        },
        'biomistral': {
          fullName: 'BioMistral',
          creator: 'Mistral AI',
          description: 'Version biomédicale de Mistral, spécialisée en sciences de la vie',
          github: 'https://github.com/BioMistral/BioMistral',
          website: 'https://huggingface.co/BioMistral/BioMistral-7B',
          paper: 'https://arxiv.org/abs/2402.10373',
          license: 'Apache 2.0',
          type: 'medical',
          specialties: ['Biomédecine', 'Sciences de la vie', 'Recherche']
        },
        'medllama2': {
          fullName: 'MedLlama2',
          creator: 'Stanford AIMI',
          description: 'Llama2 fine-tuné pour les applications médicales',
          github: 'https://github.com/stanford-aimi/medllama2',
          website: 'https://huggingface.co/epfl-llm/medllama2-7b',
          paper: 'https://arxiv.org/abs/2309.05037',
          license: 'Custom Medical License',
          type: 'medical',
          specialties: ['Médecine clinique', 'Imagerie médicale']
        },
        'phi3': {
          fullName: 'Phi-3',
          creator: 'Microsoft',
          description: 'Petit modèle haute performance de Microsoft Research',
          github: 'https://github.com/microsoft/Phi-3CookBook',
          website: 'https://azure.microsoft.com/en-us/products/ai-services/phi-3',
          paper: 'https://arxiv.org/abs/2404.14219',
          license: 'MIT',
          type: 'general',
          specialties: ['Efficacité', 'Raisonnement', 'Code']
        },
        'qwen2': {
          fullName: 'Qwen2',
          creator: 'Alibaba Cloud',
          description: 'Modèle multilingue avec de fortes capacités en chinois et anglais',
          github: 'https://github.com/QwenLM/Qwen2',
          website: 'https://qwenlm.github.io/',
          paper: 'https://arxiv.org/abs/2407.10671',
          license: 'Apache 2.0',
          type: 'general',
          specialties: ['Multilingue', 'Mathématiques', 'Code']
        },
        'mistral': {
          fullName: 'Mistral 7B',
          creator: 'Mistral AI',
          description: 'Modèle français haute performance pour diverses tâches',
          github: 'https://github.com/mistralai/mistral-src',
          website: 'https://mistral.ai/',
          paper: 'https://arxiv.org/abs/2310.06825',
          license: 'Apache 2.0',
          type: 'general',
          specialties: ['Français', 'Raisonnement', 'Instruction following']
        },
        'gemma2': {
          fullName: 'Gemma 2',
          creator: 'Google DeepMind',
          description: 'Modèle open source basé sur Gemini de Google',
          github: 'https://github.com/google-deepmind/gemma',
          website: 'https://ai.google.dev/gemma',
          paper: 'https://arxiv.org/abs/2408.00118',
          license: 'Gemma Terms of Use',
          type: 'general',
          specialties: ['Sécurité', 'Raisonnement', 'Multilingue']
        },
        'tinyllama': {
          fullName: 'TinyLlama',
          creator: 'TinyLlama Team',
          description: 'Version compacte de Llama pour l\'edge computing',
          github: 'https://github.com/jzhang38/TinyLlama',
          website: 'https://huggingface.co/TinyLlama/TinyLlama-1.1B-Chat-v1.0',
          paper: 'https://arxiv.org/abs/2401.02385',
          license: 'Apache 2.0',
          type: 'general',
          specialties: ['Légèreté', 'Edge computing', 'Efficacité']
        },
        'orca2': {
          fullName: 'Orca 2',
          creator: 'Microsoft Research',
          description: 'Modèle entraîné avec des techniques de reasoning progressif',
          github: 'https://github.com/microsoft/Orca',
          website: 'https://huggingface.co/microsoft/Orca-2-7b',
          paper: 'https://arxiv.org/abs/2311.11045',
          license: 'Custom Microsoft License',
          type: 'general',
          specialties: ['Raisonnement', 'Step-by-step thinking', 'Logique']
        }
      }

      // Recherche par nom partiel
      for (const [key, metadata] of Object.entries(modelDatabase)) {
        if (cleanName.includes(key) || key.includes(cleanName.replace(/[_-]/g, ''))) {
          return metadata
        }
      }

      // Valeurs par défaut si non trouvé
      return {
        fullName: modelName.split(':')[0].replace(/[_-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        creator: 'Unknown',
        description: 'Informations non disponibles pour ce modèle',
        github: null,
        website: null,
        paper: null,
        license: 'Unknown',
        type: 'general',
        specialties: []
      }
    }

    // Fonction pour obtenir des informations enrichies sur le modèle
    const getModelInfo = (model: any, serviceName: string, serviceType: string) => {
      const metadata = getModelMetadata(model.name)
      const sizeInGB = model.size ? (model.size / (1024 * 1024 * 1024)).toFixed(1) : 'N/A'
      
      return {
        name: model.name,
        displayName: metadata.fullName,
        creator: metadata.creator,
        description: metadata.description,
        github: metadata.github,
        website: metadata.website,
        paper: metadata.paper,
        license: metadata.license,
        specialties: metadata.specialties,
        type: metadata.type,
        size: model.size,
        sizeFormatted: `${sizeInGB} GB`,
        modified: model.modified_at,
        modifiedFormatted: model.modified_at ? new Date(model.modified_at).toLocaleDateString('fr-FR') : 'N/A',
        digest: model.digest || '',
        details: model,
        available: true,
        installed: true,
        service: {
          name: serviceName,
          type: serviceType,
          isNative: serviceType === 'native'
        }
      }
    }

    // Collecter tous les modèles de tous les services
    const modelMap = new Map() // Pour éviter les doublons par digest
    const digestMap = new Map() // Pour détecter les doublons basés sur le digest
    const modelFamilyMap = new Map() // Pour regrouper les variantes d'un même modèle

    availableServices.forEach(service => {
      const serviceType = services.find(s => s.url === service.url)?.type || 'unknown'
      
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
    const modelFamilies = Array.from(modelFamilyMap.values())
    
    // Trier les variantes par taille
    modelFamilies.forEach(family => {
      family.variants.sort((a: any, b: any) => {
        // Extraire les tailles numériques des variantes (1b, 3b, 7b, etc.)
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
      type: services.find(s => s.url === service.url)?.type || 'unknown',
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

    return NextResponse.json({
      status: 'connected',
      primary_service: availableServices.length > 0 ? {
        name: availableServices[0].serviceName,
        url: availableServices[0].url,
        type: services.find(s => s.url === availableServices[0].url)?.type || 'unknown'
      } : null,
      available_services: availableServices.map(service => ({
        name: service.serviceName,
        url: service.url,
        models_count: service.models.length,
        type: services.find(s => s.url === service.url)?.type || 'unknown'
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
      available_models: availableModels.length,
      model_families: modelFamilies,
      models: {
        all: allModels,
        medical: allModels.filter((m: any) => m?.type === 'medical'),
        general: allModels.filter((m: any) => m?.type === 'general'),
        installed: availableModels,
        not_installed: []
      },
      raw_models: Array.from(new Set(availableServices.flatMap(s => s.models))),
      performance_note: availableServices.length > 0 && 
        services.find(s => s.url === availableServices[0].url)?.type === 'native' ? 
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
      { url: process.env.TRANSLATOR_BASE_URL || 'http://localhost:11435', name: 'Docker Ollama Translator', type: 'docker' }
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

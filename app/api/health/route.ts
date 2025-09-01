import { NextResponse } from 'next/server'

/**
 * 🏥 HEALTH API v3.2.1 - Service de monitoring avancé
 * GET /api/health - Vérification complète de l'état des services et APIs
 */

interface ApiEndpoint {
  path: string
  description: string
  version: string
  methods: string[]
  status: 'healthy' | 'unhealthy' | 'unknown'
  responseTime?: number
  error?: string
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'partial'
  services: {
    ollama: {
      healthy: boolean
      url: string
      error?: string
      models: number
      type: string
    }
  }
  apis: ApiEndpoint[]
  summary: {
    total: number
    healthy: number
    unhealthy: number
    avgResponseTime: number
  }
  timestamp: string
}

// Helper function pour tester une connexion avec une détection d'erreur stricte
async function testConnection(url: string, serviceName: string): Promise<{ healthy: boolean, error: string | null, models?: number }> {
  console.log(`🔍 [HEALTH-API] Test de connexion ${serviceName}: ${url}/api/tags`)
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 secondes timeout
    
    const response = await fetch(`${url}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      console.log(`❌ [HEALTH-API] ${serviceName} erreur HTTP: ${response.status} ${response.statusText}`)
      return {
        healthy: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }
    
    const data = await response.json()
    console.log(`✅ [HEALTH-API] ${serviceName} accessible - ${data.models?.length || 0} modèles`)
    return {
      healthy: true,
      error: null,
      models: data.models?.length || 0
    }
    
  } catch (error: any) {
    console.log(`❌ [HEALTH-API] ${serviceName} erreur de connexion:`, error.message || 'Erreur inconnue')
    
    // Gestion explicite des erreurs de connexion
    if (error.name === 'AbortError') {
      console.log(`⏱️ [HEALTH-API] ${serviceName} timeout`)
      return {
        healthy: false,
        error: 'Timeout - Service non accessible'
      }
    }
    
    if (error.cause?.code === 'ECONNREFUSED' || 
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('fetch failed') ||
        error.message?.includes('Failed to fetch')) {
      console.log(`🔌 [HEALTH-API] ${serviceName} connexion refusée`)
      return {
        healthy: false,
        error: `${serviceName} non démarré - Connexion refusée`
      }
    }
    
    return {
      healthy: false,
      error: error.message || 'Erreur de connexion inconnue'
    }
  }
}

// Helper function pour tester les APIs internes
async function testInternalApi(path: string, expectedMethods: string[] = ['GET']): Promise<{ 
  status: 'healthy' | 'unhealthy' | 'unknown'
  responseTime: number
  error?: string 
}> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
  const startTime = Date.now()
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    
    // Ajustements spécifiques pour certaines APIs
    let testUrl = `${baseUrl}${path}`
    if (path === '/api/models/config') {
      // Cette API nécessite un paramètre model, utilisons un modèle test
      testUrl += '?model=test'
    }
    
    // Test avec le premier method disponible (généralement GET)
    const response = await fetch(testUrl, {
      method: expectedMethods[0],
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime
    
    // Considérer 2xx, 4xx comme "healthy" (API répond), mais pas 5xx
    if (response.status >= 200 && response.status < 500) {
      return { status: 'healthy', responseTime }
    } else {
      return { 
        status: 'unhealthy', 
        responseTime,
        error: `HTTP ${response.status}` 
      }
    }
    
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    
    if (error.name === 'AbortError') {
      return { status: 'unhealthy', responseTime, error: 'Timeout' }
    }
    
    return { 
      status: 'unhealthy', 
      responseTime,
      error: error.message || 'Connection failed' 
    }
  }
}

// Définition des APIs à tester (excluant self pour éviter la récursion)
const API_ENDPOINTS: Omit<ApiEndpoint, 'status' | 'responseTime' | 'error'>[] = [
  {
    path: '/api/models',
    description: 'Gestion des modèles LLM disponibles',
    version: '3.2.0',
    methods: ['GET']
  },
  {
    path: '/api/models/config',
    description: 'Configuration globale des modèles',
    version: '3.2.0',
    methods: ['GET', 'PUT']
  },
  {
    path: '/api/benchmark/configs',
    description: 'Configurations de benchmarks disponibles',
    version: '3.2.0',
    methods: ['GET']
  },
  {
    path: '/api/benchmark/history',
    description: 'Historique des tests et résultats',
    version: '3.2.0',
    methods: ['GET', 'POST']
  },
  {
    path: '/api/ollama',
    description: 'Interface native avec Ollama',
    version: '1.0.0',
    methods: ['GET']
  },
  {
    path: '/api/ollama/health',
    description: 'Health check spécifique Ollama',
    version: '1.0.0',
    methods: ['GET']
  }
]

export async function GET() {
  console.log('🏥 [HEALTH-API] Vérification complète de l\'état des services et APIs')
  
  // URL pour Ollama natif
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11436'
  
  // Test de la connexion Ollama
  const ollamaResult = await testConnection(ollamaUrl, 'Ollama')

  // Test de toutes les APIs internes
  console.log('🔍 [HEALTH-API] Test des APIs internes...')
  const apiResults: ApiEndpoint[] = []
  
  for (const apiDef of API_ENDPOINTS) {
    console.log(`🧪 [HEALTH-API] Test ${apiDef.path}...`)
    const result = await testInternalApi(apiDef.path, apiDef.methods)
    
    apiResults.push({
      ...apiDef,
      status: result.status,
      responseTime: result.responseTime,
      error: result.error
    })
  }

  // Calcul des statistiques
  const healthyApis = apiResults.filter(api => api.status === 'healthy').length
  const unhealthyApis = apiResults.filter(api => api.status === 'unhealthy').length
  const avgResponseTime = Math.round(
    apiResults.reduce((sum, api) => sum + (api.responseTime || 0), 0) / apiResults.length
  )

  // Détermination du statut global
  let globalStatus: 'healthy' | 'unhealthy' | 'partial'
  if (!ollamaResult.healthy) {
    globalStatus = 'unhealthy'
  } else if (unhealthyApis === 0) {
    globalStatus = 'healthy'
  } else {
    globalStatus = 'partial'
  }

  const response: HealthResponse = {
    status: globalStatus,
    services: {
      ollama: {
        healthy: ollamaResult.healthy,
        url: ollamaUrl,
        error: ollamaResult.error || undefined,
        models: ollamaResult.models || 0,
        type: 'native'
      }
    },
    apis: apiResults,
    summary: {
      total: apiResults.length,
      healthy: healthyApis,
      unhealthy: unhealthyApis,
      avgResponseTime
    },
    timestamp: new Date().toISOString()
  }

  // Log du résumé
  console.log(`📊 [HEALTH-API] Résumé: ${healthyApis}/${apiResults.length} APIs opérationnelles, temps moyen: ${avgResponseTime}ms`)

  // Si Ollama n'est pas accessible, retourner 503
  if (!ollamaResult.healthy) {
    console.log('🚨 [HEALTH-API] Service indisponible - Ollama non accessible')
    return NextResponse.json(
      {
        ...response,
        message: 'Service Ollama non accessible',
        recommendations: {
          instructions: [
            '1. Vérifier qu\'Ollama est installé: ollama --version',
            '2. Démarrer Ollama: OLLAMA_HOST=127.0.0.1:11436 ollama serve',
            '3. Vérifier les modèles: ollama list',
            '4. Actualiser cette page'
          ]
        }
      },
      { status: 503 }
    )
  }

  // Réponse normale avec détails complets
  console.log(`✅ [HEALTH-API] Système opérationnel - ${ollamaResult.models} modèles, ${healthyApis}/${apiResults.length} APIs`)
  
  return NextResponse.json(response)
}

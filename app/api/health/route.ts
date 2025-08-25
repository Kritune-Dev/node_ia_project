import { NextResponse } from 'next/server'

// Helper function pour tester une connexion avec une détection d'erreur stricte
async function testConnection(url: string, serviceName: string): Promise<{ healthy: boolean, error: string | null, models?: number }> {
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
      return {
        healthy: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }
    
    const data = await response.json()
    return {
      healthy: true,
      error: null,
      models: data.models?.length || 0
    }
    
  } catch (error: any) {
    // Gestion explicite des erreurs de connexion
    if (error.name === 'AbortError') {
      return {
        healthy: false,
        error: 'Timeout - Service non accessible'
      }
    }
    
    if (error.cause?.code === 'ECONNREFUSED' || 
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('fetch failed') ||
        error.message?.includes('Failed to fetch')) {
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

export async function GET() {
  // URLs pour tous les services possibles
  const dockerOllamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  const dockerTranslatorUrl = process.env.TRANSLATOR_BASE_URL || 'http://localhost:11435'
  const nativeOllamaUrl = process.env.NATIVE_OLLAMA_URL || 'http://localhost:11436'
  
  // Test des connexions en parallèle
  const [dockerOllamaResult, dockerTranslatorResult, nativeOllamaResult] = await Promise.all([
    testConnection(dockerOllamaUrl, 'Docker Ollama Medical'),
    testConnection(dockerTranslatorUrl, 'Docker Ollama Translator'),
    testConnection(nativeOllamaUrl, 'Ollama Natif')
  ])

  // Compter les services actifs
  const activeServices = [dockerOllamaResult, dockerTranslatorResult, nativeOllamaResult]
    .filter(result => result.healthy).length
  
  const anyHealthy = activeServices > 0
  const preferredService = nativeOllamaResult.healthy ? 'native' : 
                          dockerOllamaResult.healthy ? 'docker_medical' : 
                          dockerTranslatorResult.healthy ? 'docker_translator' : null

  // Si aucun service n'est disponible, retourner 503
  if (!anyHealthy) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        services: {
          docker_ollama: {
            healthy: false,
            url: dockerOllamaUrl,
            error: dockerOllamaResult.error,
            models: 0,
          },
          docker_translator: {
            healthy: false,
            url: dockerTranslatorUrl,
            error: dockerTranslatorResult.error,
            models: 0,
          },
          native_ollama: {
            healthy: false,
            url: nativeOllamaUrl,
            error: nativeOllamaResult.error,
            models: 0,
          }
        },
        preferred_service: null,
        active_services_count: 0,
        message: 'Aucun service Ollama accessible',
        recommendations: {
          priority: 'Démarrer Ollama natif (meilleures performances)',
          fallback: 'Ou démarrer les services Docker',
          instructions: [
            '1. Installer Ollama natif: curl -fsSL https://ollama.ai/install.sh | sh',
            '2. Démarrer: OLLAMA_HOST=127.0.0.1:11436 ollama serve',
            '3. Ou Docker: docker-compose up -d',
            '4. Actualiser cette page'
          ]
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }

  // Réponse normale avec le statut réel
  const allHealthy = dockerOllamaResult.healthy && dockerTranslatorResult.healthy && nativeOllamaResult.healthy
  const status = allHealthy ? 'healthy' : activeServices >= 2 ? 'partial' : 'degraded'

  return NextResponse.json({
    status,
    services: {
      docker_ollama: {
        healthy: dockerOllamaResult.healthy,
        url: dockerOllamaUrl,
        error: dockerOllamaResult.error,
        models: dockerOllamaResult.models || 0,
        type: 'docker'
      },
      docker_translator: {
        healthy: dockerTranslatorResult.healthy,
        url: dockerTranslatorUrl,
        error: dockerTranslatorResult.error,
        models: dockerTranslatorResult.models || 0,
        type: 'docker'
      },
      native_ollama: {
        healthy: nativeOllamaResult.healthy,
        url: nativeOllamaUrl,
        error: nativeOllamaResult.error,
        models: nativeOllamaResult.models || 0,
        type: 'native',
        preferred: true  // Natif est préféré pour les performances
      }
    },
    preferred_service: preferredService,
    active_services_count: activeServices,
    performance_recommendation: nativeOllamaResult.healthy ? 
      'Utilisation d\'Ollama natif - Performances optimales' :
      dockerOllamaResult.healthy ? 
        'Utilisation de Docker - Performances correctes' :
        'Services limités - Performance dégradée',
    timestamp: new Date().toISOString(),
  })
}

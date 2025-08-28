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
  // URL pour Ollama natif
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11436'
  
  // Test de la connexion
  const ollamaResult = await testConnection(ollamaUrl, 'Ollama Natif')

  // Si Ollama n'est pas accessible, retourner 503
  if (!ollamaResult.healthy) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: {
          ollama: {
            healthy: false,
            url: ollamaUrl,
            error: ollamaResult.error,
            models: 0,
          }
        },
        message: 'Service Ollama non accessible',
        recommendations: {
          instructions: [
            '1. Vérifier qu\'Ollama est installé: ollama --version',
            '2. Démarrer Ollama: OLLAMA_HOST=127.0.0.1:11436 ollama serve',
            '3. Vérifier les modèles: ollama list',
            '4. Actualiser cette page'
          ]
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }

  // Réponse normale
  return NextResponse.json({
    status: 'healthy',
    service: {
      ollama: {
        healthy: ollamaResult.healthy,
        url: ollamaUrl,
        error: ollamaResult.error,
        models: ollamaResult.models || 0,
        type: 'native'
      }
    },
    performance_recommendation: 'Utilisation d\'Ollama natif - Performances optimales',
    timestamp: new Date().toISOString(),
  })
}

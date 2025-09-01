import { NextResponse } from 'next/server'

/**
 * 🏥 HEALTH API v3.0.0 - Service de monitoring
 * GET /api/health - Vérification de l'état des services
 */

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

export async function GET() {
  console.log('🏥 [HEALTH-API] Vérification de l\'état des services')
  
  // URL pour Ollama natif
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11436'
  
  // Test de la connexion
  const ollamaResult = await testConnection(ollamaUrl, 'Ollama')

  // Si Ollama n'est pas accessible, retourner 503
  if (!ollamaResult.healthy) {
    console.log('🚨 [HEALTH-API] Service indisponible - Ollama non accessible')
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
  console.log(`✅ [HEALTH-API] Tous les services opérationnels - ${ollamaResult.models} modèles disponibles`)
  
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

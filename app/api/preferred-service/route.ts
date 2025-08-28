import { NextResponse } from 'next/server'

// Helper function pour tester une connexion Ollama
async function testOllamaConnection(url: string): Promise<{ healthy: boolean, models?: number }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)
    
    const response = await fetch(`${url}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const data = await response.json()
      return {
        healthy: true,
        models: data.models?.length || 0
      }
    }
    return { healthy: false }
    
  } catch (error) {
    return { healthy: false }
  }
}

export async function GET() {
  // URL pour Ollama natif
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11436'
  
  // Tester la connexion Ollama
  const result = await testOllamaConnection(ollamaUrl)

  const preferredService = result.healthy ? {
    name: 'ollama',
    url: ollamaUrl,
    description: 'Ollama Natif (Performances optimales)',
    models: result.models,
    priority: 1
  } : null

  return NextResponse.json({
    preferred: preferredService,
    available_services: result.healthy ? [preferredService] : [],
    total_active: result.healthy ? 1 : 0,
    recommendation: result.healthy ? 
      'Utilisation d\'Ollama natif pour des performances optimales' :
      'Aucun service Ollama disponible - Vérifiez qu\'Ollama est démarré',
    timestamp: new Date().toISOString()
  })
}

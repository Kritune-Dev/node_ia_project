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
  // URLs des services dans l'ordre de préférence
  const services = [
    { 
      name: 'native', 
      url: process.env.NATIVE_OLLAMA_URL || 'http://localhost:11436',
      description: 'Ollama Natif (Performances optimales)',
      priority: 1
    },
    { 
      name: 'docker_medical', 
      url: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      description: 'Docker Ollama Medical',
      priority: 2
    },
    { 
      name: 'docker_translator', 
      url: process.env.TRANSLATOR_BASE_URL || 'http://localhost:11435',
      description: 'Docker Ollama Translator',
      priority: 3
    }
  ]

  // Tester tous les services
  const results = await Promise.all(
    services.map(async (service) => ({
      ...service,
      ...(await testOllamaConnection(service.url))
    }))
  )

  // Filtrer les services actifs et trier par priorité
  const activeServices = results.filter(service => service.healthy)
    .sort((a, b) => a.priority - b.priority)

  const preferredService = activeServices[0] || null

  return NextResponse.json({
    preferred: preferredService ? {
      name: preferredService.name,
      url: preferredService.url,
      description: preferredService.description,
      models: preferredService.models,
      priority: preferredService.priority
    } : null,
    available_services: activeServices.map(service => ({
      name: service.name,
      url: service.url,
      description: service.description,
      models: service.models,
      priority: service.priority
    })),
    total_active: activeServices.length,
    recommendation: preferredService?.name === 'native' ? 
      'Utilisation d\'Ollama natif pour des performances optimales' :
      preferredService?.name === 'docker_medical' ?
        'Utilisation de Docker Medical - Bon compromis' :
        preferredService?.name === 'docker_translator' ?
          'Utilisation de Docker Translator - Fonctionnalité limitée' :
          'Aucun service Ollama disponible',
    timestamp: new Date().toISOString()
  })
}

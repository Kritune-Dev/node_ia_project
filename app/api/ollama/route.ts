import { NextRequest, NextResponse } from 'next/server'

/**
 * 🔧 API Ollama - Couche d'abstraction technique
 * Service bas niveau pour communication directe avec Ollama
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

interface OllamaModel {
  name: string
  model: string
  modified_at: string
  size: number
  digest: string
  details: {
    parent_model: string
    format: string
    family: string
    families: string[]
    parameter_size: string
    quantization_level: string
  }
}

interface OllamaResponse {
  models: OllamaModel[]
}

/**
 * 🏥 Health check du service Ollama
 */
async function checkOllamaHealth(): Promise<{ healthy: boolean; error?: string; version?: string }> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/version`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return { healthy: false, error: `HTTP ${response.status}` }
    }

    const data = await response.json()
    return { healthy: true, version: data.version }
  } catch (error) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Connexion impossible' 
    }
  }
}

/**
 * 📋 Récupérer la liste brute des modèles depuis Ollama
 */
async function getOllamaModels(): Promise<{ success: boolean; models?: OllamaModel[]; error?: string }> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }

    const data: OllamaResponse = await response.json()
    return { success: true, models: data.models }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur lors de la récupération des modèles' 
    }
  }
}

/**
 * GET /api/ollama
 * Retourne le status + liste des modèles disponibles
 */
export async function GET() {
  try {
    // Vérifier la santé du service
    const healthCheck = await checkOllamaHealth()
    
    if (!healthCheck.healthy) {
      return NextResponse.json({
        healthy: false,
        error: healthCheck.error,
        baseUrl: OLLAMA_BASE_URL,
        models: [],
        suggestions: [
          'Vérifier qu\'Ollama est démarré: ollama serve',
          'Vérifier l\'URL de connexion dans .env',
          'Tester la connexion: curl http://localhost:11434/api/version'
        ]
      }, { status: 503 })
    }

    // Récupérer les modèles
    const modelsResult = await getOllamaModels()
    
    if (!modelsResult.success) {
      return NextResponse.json({
        healthy: true,
        version: healthCheck.version,
        baseUrl: OLLAMA_BASE_URL,
        models: [],
        error: modelsResult.error
      }, { status: 200 })
    }

    return NextResponse.json({
      healthy: true,
      version: healthCheck.version,
      baseUrl: OLLAMA_BASE_URL,
      totalModels: modelsResult.models?.length || 0,
      models: modelsResult.models || []
    })

  } catch (error) {
    console.error('Erreur API Ollama:', error)
    return NextResponse.json({
      healthy: false,
      error: 'Erreur interne du service',
      baseUrl: OLLAMA_BASE_URL,
      models: []
    }, { status: 500 })
  }
}

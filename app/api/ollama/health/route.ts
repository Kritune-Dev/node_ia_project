import { NextRequest, NextResponse } from 'next/server'

/**
 * 🏥 API Ollama Health - Status du service Ollama
 * Endpoint dédié pour le monitoring de santé
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

interface HealthStatus {
  healthy: boolean
  baseUrl: string
  version?: string
  error?: string
  responseTime: number
  timestamp: string
  models?: {
    total: number
    available: boolean
  }
}

/**
 * Test de connexion rapide à Ollama
 */
async function quickHealthCheck(): Promise<{ healthy: boolean; responseTime: number; version?: string; error?: string }> {
  const startTime = Date.now()
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

    const response = await fetch(`${OLLAMA_BASE_URL}/api/version`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    if (!response.ok) {
      return { 
        healthy: false, 
        responseTime, 
        error: `HTTP ${response.status}: ${response.statusText}` 
      }
    }

    const data = await response.json()
    return { 
      healthy: true, 
      responseTime, 
      version: data.version 
    }

  } catch (error) {
    const responseTime = Date.now() - startTime
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { healthy: false, responseTime, error: 'Timeout (>5s)' }
      }
      return { healthy: false, responseTime, error: error.message }
    }
    
    return { healthy: false, responseTime, error: 'Erreur de connexion inconnue' }
  }
}

/**
 * Test rapide de disponibilité des modèles
 */
async function checkModelsAvailability(): Promise<{ total: number; available: boolean }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3s timeout

    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      return { total: data.models?.length || 0, available: true }
    }
    
    return { total: 0, available: false }
  } catch {
    return { total: 0, available: false }
  }
}

/**
 * GET /api/ollama/health
 * Status de santé détaillé du service Ollama
 */
export async function GET() {
  const timestamp = new Date().toISOString()
  
  try {
    // Test de santé principal
    const healthCheck = await quickHealthCheck()
    
    // Test des modèles en parallèle (optionnel)
    const modelsCheck = healthCheck.healthy ? 
      await checkModelsAvailability() : 
      { total: 0, available: false }

    const status: HealthStatus = {
      healthy: healthCheck.healthy,
      baseUrl: OLLAMA_BASE_URL,
      version: healthCheck.version,
      error: healthCheck.error,
      responseTime: healthCheck.responseTime,
      timestamp,
      models: modelsCheck
    }

    // Retourner le bon code de statut
    if (!healthCheck.healthy) {
      return NextResponse.json(status, { status: 503 })
    }

    return NextResponse.json(status, { status: 200 })

  } catch (error) {
    console.error('❌ [OLLAMA-HEALTH] Erreur health check Ollama:', error)
    
    const errorStatus: HealthStatus = {
      healthy: false,
      baseUrl: OLLAMA_BASE_URL,
      error: 'Erreur interne du health check',
      responseTime: 0,
      timestamp,
      models: { total: 0, available: false }
    }

    return NextResponse.json(errorStatus, { status: 500 })
  }
}

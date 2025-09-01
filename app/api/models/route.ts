import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * 🎯 MODELS API v2.0 - Liste tous les modèles
 * GET /api/models - Retourne tous les modèles avec métadonnées enrichies
 */

interface ModelData {
  name: string
  family: string
  size: string
  type?: string
  displayName?: string
  lastUsed?: string
  status: 'ready' | 'loading' | 'error'
  description?: string
  capabilities?: string[]
  specialties?: string[]
  customMetadata?: Record<string, any>
}

/**
 * 📋 GET - Liste tous les modèles disponibles
 */
export async function GET() {
  console.log('🎯 [MODELS-API] Requête GET - Liste tous les modèles')
  
  try {
    // Récupération des modèles depuis le service Ollama centralisé
    const baseUrl = process.env.NODE_ENV === 'production' && process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    const ollamaResponse = await fetch(`${baseUrl}/api/ollama`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!ollamaResponse.ok) {
      throw new Error(`Erreur Ollama: ${ollamaResponse.status}`)
    }

    const ollamaData = await ollamaResponse.json()
    
    if (!ollamaData.healthy || !ollamaData.models) {
      throw new Error('Service Ollama indisponible ou aucun modèle')
    }

    // Chargement de la configuration des modèles
    let modelConfigs: Record<string, any> = {}
    try {
      const configPath = path.join(process.cwd(), 'data', 'models-config.json')
      const configFile = fs.readFileSync(configPath, 'utf8')
      const configData = JSON.parse(configFile)
      modelConfigs = configData.models || {}
    } catch (configError: any) {
      console.warn(`⚠️ [MODELS-API] Impossible de charger la configuration:`, configError?.message || 'Erreur inconnue')
    }

    // Enrichissement des modèles avec métadonnées
    const enrichedModels: ModelData[] = ollamaData.models.map((model: any) => {
      // Extraction du nom du modèle (gestion des formats string ou objet)
      const modelName = typeof model === 'string' ? model : model.name || model.model
      
      if (typeof modelName !== 'string') {
        console.warn(`⚠️ [MODELS-API] Format de modèle inattendu:`, model)
        return null
      }

      // Récupération de la configuration spécifique du modèle
      const modelConfig = modelConfigs[modelName] || {}
      
      // Extraction de la famille depuis le nom (premier mot avant ":")
      const familyMatch = modelName.split(':')[0]
      const family = familyMatch.includes('/') ? familyMatch.split('/')[1] : familyMatch

      // Extraction de la taille du modèle depuis le nom OU la config
      const sizeFromName = modelName.match(/:(\d+[bB]|\d+\.\d+[bB]|\d+m)/)
      const size = sizeFromName ? sizeFromName[1].toUpperCase() : (modelConfig.parameters || 'Unknown')

      return {
        name: modelName,
        family,
        size,
        type: modelConfig.type || 'general', // Ajout du type !
        displayName: modelConfig.displayName || modelName,
        status: 'ready' as const,
        lastUsed: new Date().toISOString(),
        description: modelConfig.description || `Modèle ${family} de taille ${size}`,
        capabilities: ['text-generation', 'conversation'],
        specialties: modelConfig.specialties || [],
        customMetadata: {}
      }
    }).filter(Boolean) // Supprime les entrées null

    console.log(`✅ [MODELS-API] ${enrichedModels.length} modèles enrichis retournés`)

    return NextResponse.json({
      success: true,
      models: enrichedModels,
      count: enrichedModels.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ [MODELS-API] Erreur:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      models: [],
      count: 0
    }, { status: 500 })
  }
}

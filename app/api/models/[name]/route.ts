import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

/**
 * 🎯 MODELS API v2.0 - Gestion d'un modèle spécifique
 * GET /api/models/[name] - Détails d'un modèle enrichi avec models-config.json
 * PUT /api/models/[name] - Modifier les métadonnées d'un modèle
 * POST /api/models/[name] - Créer/modifier les métadonnées d'un modèle
 */

const MODELS_CONFIG_FILE = path.join(process.cwd(), 'data', 'models-config.json')

interface ModelMetadata {
  name: string
  displayName?: string
  family?: string
  description?: string
  type?: 'medical' | 'general' | 'rapide'
  specialties?: string[]
  parameters?: string
  github?: string
  website?: string
  notes?: string
  metrics?: Record<string, string>
  capabilities?: string[]
  benchmarkScore?: number
  customMetadata?: Record<string, any>
  lastModified?: string
}

/**
 * 📖 Charger la configuration des modèles
 */
async function loadModelsConfig(): Promise<any> {
  try {
    const data = fs.readFileSync(MODELS_CONFIG_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.log('ℹ️ [MODELS-CONFIG] Fichier de configuration non trouvé')
    return { models: {}, categories: {} }
  }
}

/**
 *  GET - Détails d'un modèle spécifique enrichi
 */
export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  const modelName = decodeURIComponent(params.name)
  console.log(`🎯 [MODELS-API] GET pour le modèle: ${modelName}`)

  try {
    // Vérifier que le modèle existe dans Ollama
    const ollamaResponse = await fetch('http://localhost:3000/api/ollama', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!ollamaResponse.ok) {
      throw new Error('Service Ollama indisponible')
    }

    const ollamaData = await ollamaResponse.json()
    const modelExists = ollamaData.models?.some((model: any) => model.name === modelName)

    if (!modelExists) {
      return NextResponse.json({
        success: false,
        error: `Modèle '${modelName}' non trouvé`
      }, { status: 404 })
    }

    // Charger la configuration enrichie
    const modelsConfig = await loadModelsConfig()
    const modelConfig = modelsConfig.models?.[modelName] || {}

    // Extraction de la taille du modèle à partir du nom
    const sizeMatch = modelName.match(/:(\d+(?:\.\d+)?[bBmM]?)/)
    const sizeStr = sizeMatch ? sizeMatch[1].toUpperCase() : 'Unknown'
    
    // Calcul de la taille en bytes pour déterminer si c'est rapide
    let sizeInBytes = 0
    if (sizeStr.includes('B')) {
      const num = parseFloat(sizeStr.replace(/[bB]/i, ''))
      sizeInBytes = num * 1000000000 // Milliards de paramètres
    } else if (sizeStr.includes('M')) {
      const num = parseFloat(sizeStr.replace(/[mM]/i, ''))
      sizeInBytes = num * 1000000 // Millions de paramètres
    }

    // Détection de la famille
    const family = modelConfig.family || 
      modelName.split(':')[0] || 
      'unknown'

    // Détection du type basé sur la config ou la taille
    let type = modelConfig.type
    if (!type) {
      // Auto-détection basée sur la taille
      if (sizeInBytes > 0 && sizeInBytes < 2000000000) { // < 2B paramètres
        type = 'rapide'
      } else {
        type = 'general'
      }
    }

    const modelDetails = {
      name: modelName,
      displayName: modelConfig.displayName || modelName,
      description: modelConfig.description || `Modèle ${family} de taille ${sizeStr}`,
      type,
      family,
      size: sizeInBytes,
      sizeFormatted: sizeStr,
      parameters: modelConfig.parameters || sizeStr,
      specialties: modelConfig.specialties || [],
      github: modelConfig.github || '',
      website: modelConfig.website || '',
      metrics: modelConfig.metrics || {},
      notes: modelConfig.notes || '',
      status: 'ready',
      capabilities: ['text-generation', 'conversation'],
      customMetadata: {},
      lastModified: new Date().toISOString(),
      available: true,
      // Indicateur de rapidité basé sur la taille
      isRapid: sizeInBytes > 0 && sizeInBytes < 2000000000
    }

    console.log(`✅ [MODELS-API] Détails enrichis du modèle ${modelName} retournés`)

    return NextResponse.json({
      success: true,
      model: modelDetails,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`❌ [MODELS-API] Erreur pour le modèle ${modelName}:`, error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

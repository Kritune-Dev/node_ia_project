import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), 'data', 'models-config.json')

// Charger la configuration
function loadConfig() {
  try {
    const configData = fs.readFileSync(CONFIG_PATH, 'utf8')
    return JSON.parse(configData)
  } catch (error) {
    throw new Error('Impossible de charger la configuration')
  }
}

// Sauvegarder la configuration
function saveConfig(config: any) {
  try {
    config.config.lastUpdated = new Date().toISOString()
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8')
  } catch (error) {
    throw new Error('Impossible de sauvegarder la configuration')
  }
}

// GET: Récupérer la configuration d'un modèle
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modelName = searchParams.get('model')

    if (!modelName) {
      return NextResponse.json(
        { error: 'Nom du modèle requis' },
        { status: 400 }
      )
    }

    const config = loadConfig()
    const modelConfig = config.models[modelName]

    return NextResponse.json({
      success: true,
      modelName,
      config: modelConfig || null,
      isConfigured: !!modelConfig,
      availableFields: [
        'displayName',
        'description', 
        'type',
        'specialties',
        'parameters',
        'github',
        'website',
        'notes',
        'metrics'
      ]
    })

  } catch (error) {
    console.error('❌ [CONFIG-API] Erreur GET config:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

// PUT: Mettre à jour la configuration d'un modèle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { modelName, config: modelConfig } = body

    if (!modelName || !modelConfig) {
      return NextResponse.json(
        { error: 'Nom du modèle et configuration requis' },
        { status: 400 }
      )
    }

    const config = loadConfig()

    // Valider les champs obligatoires
    if (!modelConfig.displayName || !modelConfig.description || !modelConfig.type) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants: displayName, description, type' },
        { status: 400 }
      )
    }

    // Valider le type
    if (!['medical', 'general'].includes(modelConfig.type)) {
      return NextResponse.json(
        { error: 'Type invalide (doit être "medical" ou "general")' },
        { status: 400 }
      )
    }

    // Valider les spécialités
    if (modelConfig.specialties && !Array.isArray(modelConfig.specialties)) {
      return NextResponse.json(
        { error: 'Les spécialités doivent être un tableau' },
        { status: 400 }
      )
    }

    // Mettre à jour la configuration
    config.models[modelName] = {
      displayName: modelConfig.displayName.trim(),
      description: modelConfig.description.trim(),
      type: modelConfig.type,
      specialties: modelConfig.specialties || [],
      parameters: modelConfig.parameters || '',
      github: modelConfig.github || '',
      website: modelConfig.website || '',
      notes: modelConfig.notes || '',
      metrics: modelConfig.metrics || {}
    }

    saveConfig(config)

    return NextResponse.json({
      success: true,
      message: 'Configuration mise à jour avec succès',
      modelName,
      config: config.models[modelName]
    })

  } catch (error) {
    console.error('❌ [CONFIG-API] Erreur PUT config:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

// DELETE: Supprimer la configuration d'un modèle
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modelName = searchParams.get('model')

    if (!modelName) {
      return NextResponse.json(
        { error: 'Nom du modèle requis' },
        { status: 400 }
      )
    }

    const config = loadConfig()

    if (!config.models[modelName]) {
      return NextResponse.json(
        { error: 'Configuration non trouvée pour ce modèle' },
        { status: 404 }
      )
    }

    delete config.models[modelName]
    saveConfig(config)

    return NextResponse.json({
      success: true,
      message: 'Configuration supprimée avec succès',
      modelName
    })

  } catch (error) {
    console.error('❌ [CONFIG-API] Erreur DELETE config:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

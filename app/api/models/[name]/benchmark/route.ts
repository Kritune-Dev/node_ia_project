import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

/**
 * 🎯 BENCHMARK DATA API v1.0 - Gestion des données benchmark par modèle
 * GET /api/models/[name]/benchmark - Récupère les données benchmark d'un modèle
 * PUT /api/models/[name]/benchmark - Met à jour les données benchmark d'un modèle
 */

// Fonction pour trouver le fichier benchmark avec différentes variantes de nommage
function findBenchmarkFile(benchmarkDir: string, modelName: string): string | null {
  // Différentes variantes de nommage à essayer
  const variants = [
    // Variante 1: remplacer tous les caractères spéciaux par _
    modelName.replace(/[^a-zA-Z0-9_-]/g, '_'),
    // Variante 2: remplacer seulement : par _ et garder les points
    modelName.replace(/:/g, '_'),
    // Variante 3: nom exact
    modelName,
    // Variante 4: remplacer : par _ et . par _
    modelName.replace(/[:.]/g, '_')
  ]

  for (const variant of variants) {
    const filePath = path.join(benchmarkDir, `model_${variant}.json`)
    if (fs.existsSync(filePath)) {
      return filePath
    }
  }

  return null
}

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const modelName = decodeURIComponent(params.name)
    console.log(`📊 [BENCHMARK-API] GET pour le modèle: ${modelName}`)

    // Construire le chemin vers le fichier de données benchmark
    const benchmarkDir = path.join(process.cwd(), 'data', 'benchmark', 'models')
    const benchmarkFile = findBenchmarkFile(benchmarkDir, modelName)

    if (!benchmarkFile) {
      console.log(`❌ [BENCHMARK-API] Fichier non trouvé pour: ${modelName}`)
      console.log(`📂 [BENCHMARK-API] Fichiers disponibles:`, fs.readdirSync(benchmarkDir))
      return NextResponse.json({
        success: false,
        error: 'Aucune donnée benchmark trouvée pour ce modèle',
        data: null
      }, { status: 404 })
    }

    console.log(`📂 [BENCHMARK-API] Fichier trouvé: ${benchmarkFile}`)

    // Lire et parser le fichier
    const fileContent = fs.readFileSync(benchmarkFile, 'utf-8')
    const benchmarkData = JSON.parse(fileContent)

    console.log(`✅ [BENCHMARK-API] Données chargées pour: ${modelName}`)

    return NextResponse.json({
      success: true,
      data: benchmarkData,
      modelName: modelName
    })

  } catch (error) {
    console.error(`❌ [BENCHMARK-API] Erreur pour le modèle ${params.name}:`, error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const modelName = decodeURIComponent(params.name)
    const body = await request.json()
    
    console.log(`📝 [BENCHMARK-API] PUT pour le modèle: ${modelName}`)

    // Construire le chemin vers le fichier de données benchmark
    const benchmarkDir = path.join(process.cwd(), 'data', 'benchmark', 'models')
    
    // Assurer que le répertoire existe
    if (!fs.existsSync(benchmarkDir)) {
      fs.mkdirSync(benchmarkDir, { recursive: true })
    }
    
    let benchmarkFile = findBenchmarkFile(benchmarkDir, modelName)
    
    // Si le fichier n'existe pas, créer le chemin avec la variante standard
    if (!benchmarkFile) {
      const cleanModelName = modelName.replace(/[^a-zA-Z0-9_-]/g, '_')
      benchmarkFile = path.join(benchmarkDir, `model_${cleanModelName}.json`)
    }

    let currentData: any = {}
    
    // Charger les données existantes si le fichier existe
    if (fs.existsSync(benchmarkFile)) {
      const fileContent = fs.readFileSync(benchmarkFile, 'utf-8')
      currentData = JSON.parse(fileContent)
    } else {
      // Initialiser avec une structure de base
      currentData = {
        modelId: modelName,
        displayName: modelName,
        notes: {},
        scores: {}, // Nouveau champ pour les scores
        resultsSummary: {},
        history: []
      }
    }

    // Gérer les différents types de mise à jour
    if (body.type === 'notes' && body.notes) {
      currentData.notes = { ...currentData.notes, ...body.notes }
      console.log(`📝 [BENCHMARK-API] Notes mises à jour pour: ${modelName}`)
    } else if (body.type === 'scores' && body.scores) {
      // Nouvelle fonctionnalité: gestion des scores
      if (!currentData.scores) {
        currentData.scores = {}
      }
      currentData.scores = { ...currentData.scores, ...body.scores }
      console.log(`🏆 [BENCHMARK-API] Scores mis à jour pour: ${modelName}`)
    } else {
      // Mise à jour générale des données
      currentData = { ...currentData, ...body }
    }

    // Mettre à jour le timestamp de dernière modification
    currentData.lastUpdated = new Date().toISOString()

    // Sauvegarder le fichier
    fs.writeFileSync(benchmarkFile, JSON.stringify(currentData, null, 2))

    console.log(`✅ [BENCHMARK-API] Données sauvegardées pour: ${modelName}`)

    return NextResponse.json({
      success: true,
      message: 'Données mises à jour avec succès',
      data: currentData
    })

  } catch (error) {
    console.error(`❌ [BENCHMARK-API] Erreur PUT pour le modèle ${params.name}:`, error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const modelName = decodeURIComponent(params.name)
    const { searchParams } = new URL(request.url)
    const seriesId = searchParams.get('series')
    
    console.log(`🗑️ [BENCHMARK-API] DELETE score pour le modèle: ${modelName}, série: ${seriesId}`)

    if (!seriesId) {
      return NextResponse.json({
        success: false,
        error: 'Le paramètre "series" est requis pour supprimer un score'
      }, { status: 400 })
    }

    // Construire le chemin vers le fichier de données benchmark
    const benchmarkDir = path.join(process.cwd(), 'data', 'benchmark', 'models')
    const benchmarkFile = findBenchmarkFile(benchmarkDir, modelName)

    if (!benchmarkFile) {
      return NextResponse.json({
        success: false,
        error: 'Aucune donnée benchmark trouvée pour ce modèle'
      }, { status: 404 })
    }

    // Charger les données existantes
    const fileContent = fs.readFileSync(benchmarkFile, 'utf-8')
    const currentData = JSON.parse(fileContent)

    // Vérifier si le score existe
    if (!currentData.scores || !currentData.scores[seriesId]) {
      return NextResponse.json({
        success: false,
        error: `Aucun score trouvé pour la série ${seriesId}`
      }, { status: 404 })
    }

    // Supprimer le score
    delete currentData.scores[seriesId]
    currentData.lastUpdated = new Date().toISOString()

    // Sauvegarder le fichier
    fs.writeFileSync(benchmarkFile, JSON.stringify(currentData, null, 2))

    console.log(`✅ [BENCHMARK-API] Score supprimé pour: ${modelName} - ${seriesId}`)

    return NextResponse.json({
      success: true,
      message: `Score supprimé pour ${seriesId}`,
      data: currentData
    })

  } catch (error) {
    console.error(`❌ [BENCHMARK-API] Erreur DELETE pour le modèle ${params.name}:`, error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

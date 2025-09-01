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
    const benchmarkFile = findBenchmarkFile(benchmarkDir, modelName)

    // Vérifier si le fichier existe
    if (!benchmarkFile) {
      console.log(`❌ [BENCHMARK-API] Fichier non trouvé pour: ${modelName}`)
      return NextResponse.json({
        success: false,
        error: 'Aucune donnée benchmark trouvée pour ce modèle'
      }, { status: 404 })
    }

    // Lire les données existantes
    const fileContent = fs.readFileSync(benchmarkFile, 'utf-8')
    const existingData = JSON.parse(fileContent)

    // Fusionner avec les nouvelles données (en priorité les nouvelles)
    const updatedData = {
      ...existingData,
      ...body,
      lastUpdated: new Date().toISOString()
    }

    // Créer le répertoire s'il n'existe pas
    fs.mkdirSync(benchmarkDir, { recursive: true })

    // Écrire les données mises à jour
    fs.writeFileSync(benchmarkFile, JSON.stringify(updatedData, null, 2))

    console.log(`✅ [BENCHMARK-API] Données mises à jour pour: ${modelName}`)

    return NextResponse.json({
      success: true,
      data: updatedData,
      message: 'Données benchmark mises à jour avec succès'
    })

  } catch (error) {
    console.error(`❌ [BENCHMARK-API] Erreur PUT pour le modèle ${params.name}:`, error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

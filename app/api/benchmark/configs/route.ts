import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

/**
 * 📋 API BENCHMARK CONFIGS v2.0 - Configuration des types de tests
 * GET /api/benchmark/configs - Liste des configurations depuis benchmark-configs.json
 * POST /api/benchmark/configs - Ajouter une nouvelle configuration
 */

const BENCHMARK_CONFIGS_FILE = path.join(process.cwd(), 'data', 'benchmark-configs.json')

/**
 * 📖 Charger les configurations depuis le fichier JSON
 */
async function loadBenchmarkConfigs(): Promise<any> {
  try {
    const data = fs.readFileSync(BENCHMARK_CONFIGS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('❌ [BENCHMARK-CONFIGS] Erreur lecture fichier:', error)
    return { benchmarks: {}, metadata: {} }
  }
}

/**
 * 💾 Sauvegarder les configurations dans le fichier JSON
 */
async function saveBenchmarkConfigs(configs: any): Promise<void> {
  try {
    fs.writeFileSync(BENCHMARK_CONFIGS_FILE, JSON.stringify(configs, null, 2))
    console.log('✅ [BENCHMARK-CONFIGS] Fichier sauvegardé')
  } catch (error) {
    console.error('❌ [BENCHMARK-CONFIGS] Erreur sauvegarde:', error)
    throw error
  }
}

/**
 * GET - Récupérer toutes les configurations de benchmark
 */
export async function GET() {
  console.log('📋 [BENCHMARK-CONFIGS] GET - Récupération des configurations depuis JSON')

  try {
    const configData = await loadBenchmarkConfigs()
    const benchmarks = configData.benchmarks || {}
    
    // Convertir l'objet en tableau avec les informations essentielles
    const configs = Object.values(benchmarks).map((benchmark: any) => ({
      id: benchmark.id,
      name: benchmark.name,
      description: benchmark.description,
      estimatedTime: benchmark.parameters?.timeout ? Math.round(benchmark.parameters.timeout / 1000) : 60,
      questionCount: benchmark.questions?.length || 0,
      difficulty: benchmark.questions?.length <= 3 ? 'easy' : 
                  benchmark.questions?.length <= 5 ? 'medium' : 'hard',
      category: benchmark.testTypes?.[0] || 'general',
      version: benchmark.version || '1.0.0',
      testTypes: benchmark.testTypes || [],
      parameters: benchmark.parameters || {},
      questions: benchmark.questions || [],
      scoring: benchmark.scoring || {}
    }))

    console.log(`✅ [BENCHMARK-CONFIGS] ${configs.length} configurations retournées depuis JSON`)

    return NextResponse.json({
      success: true,
      configs,
      count: configs.length,
      metadata: configData.metadata || {},
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ [BENCHMARK-CONFIGS] Erreur:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

/**
 * POST - Ajouter une nouvelle configuration de benchmark
 */
export async function POST(request: Request) {
  console.log('📋 [BENCHMARK-CONFIGS] POST - Ajout d\'une nouvelle configuration')

  try {
    const newBenchmark = await request.json()
    
    // Validation des champs requis
    if (!newBenchmark.id || !newBenchmark.name || !newBenchmark.description) {
      return NextResponse.json({
        success: false,
        error: 'Champs requis manquants: id, name, description'
      }, { status: 400 })
    }

    // Charger les configurations existantes
    const configData = await loadBenchmarkConfigs()
    
    // Vérifier si l'ID existe déjà
    if (configData.benchmarks && configData.benchmarks[newBenchmark.id]) {
      return NextResponse.json({
        success: false,
        error: `Un benchmark avec l'ID '${newBenchmark.id}' existe déjà`
      }, { status: 409 })
    }

    // Préparer la nouvelle configuration avec des valeurs par défaut
    const benchmarkConfig = {
      id: newBenchmark.id,
      name: newBenchmark.name,
      description: newBenchmark.description,
      version: newBenchmark.version || "1.0.0",
      testTypes: newBenchmark.testTypes || ["qualitative"],
      parameters: {
        temperature: newBenchmark.parameters?.temperature || 0.3,
        seed: newBenchmark.parameters?.seed || Math.floor(Math.random() * 1000),
        timeout: newBenchmark.parameters?.timeout || 60000,
        maxTokens: newBenchmark.parameters?.maxTokens || 500,
        topP: newBenchmark.parameters?.topP || 0.9,
        ...newBenchmark.parameters
      },
      prompts: {
        system: newBenchmark.prompts?.system || "Tu es un assistant IA expert. Réponds avec précision et clarté.",
        evaluation: newBenchmark.prompts?.evaluation || "Évalue cette réponse sur une échelle de 1 à 10.",
        ...newBenchmark.prompts
      },
      questions: newBenchmark.questions || [],
      scoring: {
        excellent: 10,
        good: 8,
        average: 6,
        poor: 4,
        incorrect: 2,
        noResponse: 0,
        ...newBenchmark.scoring
      }
    }

    // Ajouter la nouvelle configuration
    if (!configData.benchmarks) {
      configData.benchmarks = {}
    }
    configData.benchmarks[newBenchmark.id] = benchmarkConfig

    // Mettre à jour les métadonnées
    if (!configData.metadata) {
      configData.metadata = {}
    }
    configData.metadata.lastUpdated = new Date().toISOString()
    configData.metadata.totalBenchmarks = Object.keys(configData.benchmarks).length

    // Sauvegarder dans le fichier
    await saveBenchmarkConfigs(configData)

    console.log(`✅ [BENCHMARK-CONFIGS] Nouveau benchmark '${newBenchmark.id}' ajouté`)

    return NextResponse.json({
      success: true,
      message: `Benchmark '${newBenchmark.id}' ajouté avec succès`,
      benchmark: benchmarkConfig,
      timestamp: new Date().toISOString()
    }, { status: 201 })

  } catch (error) {
    console.error('❌ [BENCHMARK-CONFIGS] Erreur POST:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

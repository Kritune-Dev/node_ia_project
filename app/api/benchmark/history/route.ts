import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const BENCHMARK_DIR = path.join(process.cwd(), 'benchmark_results')
const HISTORY_FILE = path.join(BENCHMARK_DIR, 'history.json')

// Assurer que le répertoire existe
function ensureBenchmarkDir() {
  if (!fs.existsSync(BENCHMARK_DIR)) {
    fs.mkdirSync(BENCHMARK_DIR, { recursive: true })
  }
}

// Charger l'historique des benchmarks
function loadBenchmarkHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf-8')
      return JSON.parse(data)
    }
    return { benchmarks: [] }
  } catch (error) {
    console.error('Erreur lors du chargement de l\'historique:', error)
    return { benchmarks: [] }
  }
}

// Sauvegarder l'historique des benchmarks
function saveBenchmarkHistory(data: any) {
  try {
    ensureBenchmarkDir()
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    return false
  }
}

export async function GET() {
  try {
    const history = loadBenchmarkHistory()
    
    // Trier par date (plus récent en premier)
    history.benchmarks.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return NextResponse.json(history)
  } catch (error) {
    console.error('Erreur API benchmark history:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement de l\'historique' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const benchmarkResult = await request.json()
    
    // Ajouter un ID unique et timestamp
    const enrichedResult = {
      ...benchmarkResult,
      id: `benchmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ratings: benchmarkResult.ratings || {},
      comments: benchmarkResult.comments || {}
    }

    const history = loadBenchmarkHistory()
    history.benchmarks.unshift(enrichedResult)

    // Limiter à 1000 benchmarks pour éviter les fichiers trop volumineux
    if (history.benchmarks.length > 1000) {
      history.benchmarks = history.benchmarks.slice(0, 1000)
    }

    const saved = saveBenchmarkHistory(history)
    
    if (!saved) {
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde' },
        { status: 500 }
      )
    }

    // Sauvegarder aussi le fichier détaillé
    const detailFile = path.join(BENCHMARK_DIR, `${enrichedResult.id}.json`)
    fs.writeFileSync(detailFile, JSON.stringify(enrichedResult, null, 2))

    return NextResponse.json({ 
      success: true, 
      benchmark: enrichedResult 
    })
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du benchmark:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde du benchmark' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { benchmarkId } = await request.json()
    
    if (!benchmarkId) {
      return NextResponse.json(
        { error: 'ID de benchmark requis' },
        { status: 400 }
      )
    }

    const history = loadBenchmarkHistory()
    const benchmarkIndex = history.benchmarks.findIndex(
      (b: any) => b.id === benchmarkId || b.benchmark_id === benchmarkId
    )
    
    if (benchmarkIndex === -1) {
      return NextResponse.json(
        { error: 'Benchmark non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer le benchmark de l'historique
    history.benchmarks.splice(benchmarkIndex, 1)
    
    const saved = saveBenchmarkHistory(history)
    
    if (!saved) {
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    // Supprimer aussi le fichier détaillé
    const detailFile = path.join(BENCHMARK_DIR, `${benchmarkId}.json`)
    if (fs.existsSync(detailFile)) {
      fs.unlinkSync(detailFile)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la suppression du benchmark:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du benchmark' },
      { status: 500 }
    )
  }
}

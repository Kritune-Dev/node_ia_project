import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const BENCHMARK_DIR = path.join(process.cwd(), 'benchmark_results')
const HISTORY_FILE = path.join(BENCHMARK_DIR, 'history.json')

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

function saveBenchmarkHistory(data: any) {
  try {
    if (!fs.existsSync(BENCHMARK_DIR)) {
      fs.mkdirSync(BENCHMARK_DIR, { recursive: true })
    }
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { benchmarkId, modelName, questionId, rating, comment } = await request.json()
    
    if (!benchmarkId || !modelName || !questionId) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    const history = loadBenchmarkHistory()
    const benchmarkIndex = history.benchmarks.findIndex((b: any) => b.id === benchmarkId || b.benchmark_id === benchmarkId)
    
    if (benchmarkIndex === -1) {
      return NextResponse.json(
        { error: 'Benchmark non trouvé' },
        { status: 404 }
      )
    }

    const benchmark = history.benchmarks[benchmarkIndex]
    
    // S'assurer que la structure existe
    if (!benchmark.results) benchmark.results = {}
    if (!benchmark.results[modelName]) {
      return NextResponse.json(
        { error: 'Modèle non trouvé dans ce benchmark' },
        { status: 404 }
      )
    }
    if (!benchmark.results[modelName].questions) benchmark.results[modelName].questions = {}
    if (!benchmark.results[modelName].questions[questionId]) {
      return NextResponse.json(
        { error: 'Question non trouvée pour ce modèle' },
        { status: 404 }
      )
    }

    // Mettre à jour la note et le commentaire
    if (rating !== undefined) {
      benchmark.results[modelName].questions[questionId].user_rating = rating
    }
    if (comment !== undefined) {
      benchmark.results[modelName].questions[questionId].user_comment = comment
    }

    // Ajouter un timestamp de modification
    benchmark.results[modelName].questions[questionId].last_updated = new Date().toISOString()

    // Sauvegarder
    history.benchmarks[benchmarkIndex] = benchmark
    const saved = saveBenchmarkHistory(history)
    
    if (!saved) {
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde' },
        { status: 500 }
      )
    }

    // Sauvegarder aussi le fichier détaillé si il existe
    const detailFile = path.join(BENCHMARK_DIR, `${benchmarkId}.json`)
    if (fs.existsSync(detailFile)) {
      fs.writeFileSync(detailFile, JSON.stringify(benchmark, null, 2))
    }

    return NextResponse.json({ 
      success: true,
      updated: {
        rating: benchmark.results[modelName].questions[questionId].user_rating,
        comment: benchmark.results[modelName].questions[questionId].user_comment
      }
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'évaluation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const benchmarkId = url.searchParams.get('benchmarkId')
    
    if (!benchmarkId) {
      return NextResponse.json(
        { error: 'ID de benchmark requis' },
        { status: 400 }
      )
    }

    const history = loadBenchmarkHistory()
    const benchmark = history.benchmarks.find((b: any) => b.id === benchmarkId || b.benchmark_id === benchmarkId)
    
    if (!benchmark) {
      return NextResponse.json(
        { error: 'Benchmark non trouvé' },
        { status: 404 }
      )
    }

    // Extraire toutes les évaluations
    const evaluations: any = {}
    
    Object.keys(benchmark.results || {}).forEach(modelName => {
      evaluations[modelName] = {}
      Object.keys(benchmark.results[modelName].questions || {}).forEach(questionId => {
        const question = benchmark.results[modelName].questions[questionId]
        evaluations[modelName][questionId] = {
          rating: question.user_rating,
          comment: question.user_comment,
          last_updated: question.last_updated
        }
      })
    })

    return NextResponse.json({
      benchmark_id: benchmarkId,
      evaluations
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des évaluations:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}

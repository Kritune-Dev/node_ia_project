import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface BenchmarkQuestion {
  id: string
  question: string
  category: string
  expectedType?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  expectedKeywords?: string[]
}

interface CustomQuestion {
  id: string
  question: string
  category: string
  expectedKeywords?: string[]
  createdAt: string
}

interface HistoryMetadata {
  id: string
  displayName: string
  timestamp: string
  testSeries: string
  totalModels: number
  totalQuestions: number
  models: Array<{
    name: string
    displayName: string
  }>
}

interface History {
  version: string
  metadata: HistoryMetadata[]
}

// Questions de benchmark prédéfinies
const BENCHMARK_QUESTIONS: BenchmarkQuestion[] = [
  // Tests de base
  {
    id: 'basic_1',
    question: 'Peux-tu me dire si tu fonctionnes correctement ? Réponds simplement par "Oui, je fonctionne correctement".',
    category: 'basic',
    expectedType: 'confirmation',
    difficulty: 'easy'
  },
  {
    id: 'basic_2',
    question: 'Peux-tu me parler en français ? Écris une phrase simple en français pour confirmer que tu comprends cette langue.',
    category: 'basic',
    expectedType: 'french_response',
    difficulty: 'easy'
  },
  // Tests médicaux
  {
    id: 'medical_1',
    question: 'Quels sont les symptômes principaux de l\'hypertension artérielle ?',
    category: 'medical',
    expectedType: 'list',
    difficulty: 'easy'
  },
  {
    id: 'medical_2',
    question: 'Expliquez le mécanisme d\'action des inhibiteurs de l\'ECA dans le traitement de l\'hypertension.',
    category: 'medical',
    expectedType: 'explanation',
    difficulty: 'medium'
  },
  {
    id: 'medical_3',
    question: 'Décrivez les étapes de la glycolyse et son importance dans le métabolisme cellulaire.',
    category: 'medical',
    expectedType: 'detailed_explanation',
    difficulty: 'hard'
  },
  // Tests généraux
  {
    id: 'general_1',
    question: 'Résumez les causes principales du réchauffement climatique.',
    category: 'general',
    expectedType: 'summary',
    difficulty: 'easy'
  },
  {
    id: 'general_2',
    question: 'Expliquez le concept de l\'intelligence artificielle et ses applications actuelles.',
    category: 'general',
    expectedType: 'explanation',
    difficulty: 'medium'
  },
  {
    id: 'coding_1',
    question: 'Écrivez une fonction Python qui calcule la suite de Fibonacci jusqu\'au n-ième terme.',
    category: 'coding',
    expectedType: 'code',
    difficulty: 'medium'
  },
  {
    id: 'reasoning_1',
    question: 'Si tous les A sont B, et tous les B sont C, que peut-on dire de la relation entre A et C ?',
    category: 'reasoning',
    expectedType: 'logical_reasoning',
    difficulty: 'easy'
  },
  {
    id: 'reasoning_2',
    question: 'Un train part de Paris à 14h00 à 120 km/h vers Lyon (450 km). Un autre train part de Lyon à 14h30 à 100 km/h vers Paris. À quelle heure et à quelle distance de Paris vont-ils se croiser ?',
    category: 'reasoning',
    expectedType: 'mathematical_problem',
    difficulty: 'hard'
  }
]

async function getServiceUrlForModel(modelName: string): Promise<string> {
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
}

async function testModelResponse(modelName: string, prompt: string, serviceUrl: string = '') {
  const startTime = Date.now()
  
  try {
    const baseUrl = serviceUrl || await getServiceUrlForModel(modelName)
    
    const response = await fetch(`${baseUrl}/api/ollama/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          max_tokens: 1000
        }
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Erreur de génération')
    }

    return {
      success: true,
      response: data.response || '',
      responseTime: data.performance?.responseTime || (Date.now() - startTime),
      tokensPerSecond: data.performance?.tokensPerSecond || 0,
      model: modelName,
      isTimeout: false
    }
  } catch (error) {
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    return {
      success: false,
      response: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      responseTime,
      tokensPerSecond: 0,
      model: modelName,
      isTimeout: responseTime > 30000
    }
  }
}

// Fonction pour sauvegarder les résultats avec le nouveau format v2.0
async function saveBenchmarkResults(results: any) {
  try {
        const benchmarkResultsDir = path.join(process.cwd(), 'data', 'benchmark_results')
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(benchmarkResultsDir)) {
      fs.mkdirSync(benchmarkResultsDir, { recursive: true })
    }

    // Sauvegarder le fichier détaillé
    const detailedFilePath = path.join(benchmarkResultsDir, `${results.id}.json`)
    fs.writeFileSync(detailedFilePath, JSON.stringify(results, null, 2))

    // Mettre à jour history.json avec le format v2.0
    const historyPath = path.join(benchmarkResultsDir, 'history.json')
    let history: History = { version: '2.0', metadata: [] }

    if (fs.existsSync(historyPath)) {
      const existingHistory = JSON.parse(fs.readFileSync(historyPath, 'utf8'))
      if (existingHistory.version === '2.0') {
        history = existingHistory
      }
    }

    // Ajouter les métadonnées légères
    const metadata: HistoryMetadata = {
      id: results.id,
      displayName: results.displayName,
      timestamp: results.timestamp,
      testSeries: results.testSeries,
      totalModels: Object.keys(results.results).length,
      totalQuestions: results.summary.total_tests,
      models: Object.keys(results.results).map(modelName => ({
        name: modelName,
        displayName: results.results[modelName].model_name || modelName
      }))
    }

    history.metadata.unshift(metadata)
    
    // Garder seulement les 50 derniers résultats
    if (history.metadata.length > 50) {
      history.metadata = history.metadata.slice(0, 50)
    }

    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2))
    
    return { success: true, benchmarkId: results.id }
  } catch (error) {
    console.error('❌ [BENCHMARK-API] Erreur lors de la sauvegarde:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' }
  }
}

export async function POST(request: NextRequest) {
  console.log('🎯 [BENCHMARK-API] Requête POST - Exécution de benchmark')
  
  try {
    const body = await request.json()
    const { 
      models, 
      categories, 
      questions: customQuestions, 
      testSeries = 'Test Standard',
      stream = false 
    } = body

    if (!models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un modèle doit être spécifié' },
        { status: 400 }
      )
    }

    // Déterminer les questions à tester
    let questionsToTest: BenchmarkQuestion[] = []
    
    if (customQuestions && customQuestions.length > 0) {
      questionsToTest = customQuestions.map((q: CustomQuestion) => ({
        id: q.id,
        question: q.question,
        category: q.category,
        expectedKeywords: q.expectedKeywords,
        difficulty: 'medium' as const
      }))
    } else {
      questionsToTest = categories ? 
        BENCHMARK_QUESTIONS.filter(q => categories.includes(q.category)) : 
        BENCHMARK_QUESTIONS
    }

    if (questionsToTest.length === 0) {
      return NextResponse.json(
        { error: 'Aucune question trouvée pour les catégories spécifiées' },
        { status: 400 }
      )
    }

    const benchmarkId = `benchmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date().toISOString()
    
    // Initialiser les résultats
    const results = {
      id: benchmarkId,
      displayName: testSeries,
      testSeries,
      timestamp,
      summary: {
        total_tests: questionsToTest.length * models.length,
        successful_tests: 0,
        failed_tests: 0,
        total_models: models.length,
        average_response_time: 0,
        average_tokens_per_second: 0,
        categories_tested: Array.from(new Set(questionsToTest.map(q => q.category))),
        models_tested: models
      },
      results: {} as any
    }

    // Mode streaming
    if (stream) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', benchmarkId, totalTests: results.summary.total_tests })}\n\n`))

            let totalResponseTime = 0
            let totalTokensPerSecond = 0
            let successfulTests = 0

            for (const modelName of models) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'model_start', model: modelName })}\n\n`))
              
              const serviceUrl = await getServiceUrlForModel(modelName)
              
              results.results[modelName] = {
                model_name: modelName,
                service_url: serviceUrl,
                total_response_time: 0,
                average_response_time: 0,
                total_tokens_per_second: 0,
                average_tokens_per_second: 0,
                success_rate: 0,
                questions: {}
              }

              let modelTotalTime = 0
              let modelTotalTokensPerSecond = 0
              let modelSuccessfulTests = 0

              for (const question of questionsToTest) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'question_start', 
                  model: modelName, 
                  questionId: question.id,
                  question: question.question 
                })}\n\n`))

                const testResult = await testModelResponse(modelName, question.question, serviceUrl)
                
                results.results[modelName].questions[question.id] = {
                  question: question.question,
                  category: question.category,
                  difficulty: question.difficulty,
                  ...testResult
                }

                if (testResult.success) {
                  modelSuccessfulTests++
                  successfulTests++
                  modelTotalTime += testResult.responseTime
                  modelTotalTokensPerSecond += testResult.tokensPerSecond
                  totalResponseTime += testResult.responseTime
                  totalTokensPerSecond += testResult.tokensPerSecond
                }

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'question_complete', 
                  model: modelName, 
                  questionId: question.id,
                  result: testResult
                })}\n\n`))
              }

              // Calculer les moyennes pour ce modèle
              results.results[modelName].total_response_time = modelTotalTime
              results.results[modelName].average_response_time = modelSuccessfulTests > 0 ? modelTotalTime / modelSuccessfulTests : 0
              results.results[modelName].total_tokens_per_second = modelTotalTokensPerSecond
              results.results[modelName].average_tokens_per_second = modelSuccessfulTests > 0 ? modelTotalTokensPerSecond / modelSuccessfulTests : 0
              results.results[modelName].success_rate = (modelSuccessfulTests / questionsToTest.length) * 100

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'model_complete', model: modelName, stats: results.results[modelName] })}\n\n`))
            }

            // Calculer les statistiques globales
            results.summary.successful_tests = successfulTests
            results.summary.failed_tests = results.summary.total_tests - successfulTests
            results.summary.average_response_time = successfulTests > 0 ? totalResponseTime / successfulTests : 0
            results.summary.average_tokens_per_second = successfulTests > 0 ? totalTokensPerSecond / successfulTests : 0

            // Sauvegarder les résultats
            const saveResult = await saveBenchmarkResults(results)
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'complete', 
              results,
              saved: saveResult.success,
              benchmarkId: saveResult.benchmarkId 
            })}\n\n`))
            
            controller.close()
          } catch (error) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              error: error instanceof Error ? error.message : 'Erreur inconnue' 
            })}\n\n`))
            controller.close()
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Mode non-streaming (batch)
    let totalResponseTime = 0
    let totalTokensPerSecond = 0
    let successfulTests = 0

    for (const modelName of models) {
      const serviceUrl = await getServiceUrlForModel(modelName)
      
      results.results[modelName] = {
        model_name: modelName,
        service_url: serviceUrl,
        total_response_time: 0,
        average_response_time: 0,
        total_tokens_per_second: 0,
        average_tokens_per_second: 0,
        success_rate: 0,
        questions: {}
      }

      let modelTotalTime = 0
      let modelTotalTokensPerSecond = 0
      let modelSuccessfulTests = 0

      for (const question of questionsToTest) {
        const testResult = await testModelResponse(modelName, question.question, serviceUrl)
        
        results.results[modelName].questions[question.id] = {
          question: question.question,
          category: question.category,
          difficulty: question.difficulty,
          ...testResult
        }

        if (testResult.success) {
          modelSuccessfulTests++
          successfulTests++
          modelTotalTime += testResult.responseTime
          modelTotalTokensPerSecond += testResult.tokensPerSecond
          totalResponseTime += testResult.responseTime
          totalTokensPerSecond += testResult.tokensPerSecond
        }
      }

      // Calculer les moyennes pour ce modèle
      results.results[modelName].total_response_time = modelTotalTime
      results.results[modelName].average_response_time = modelSuccessfulTests > 0 ? modelTotalTime / modelSuccessfulTests : 0
      results.results[modelName].total_tokens_per_second = modelTotalTokensPerSecond
      results.results[modelName].average_tokens_per_second = modelSuccessfulTests > 0 ? modelTotalTokensPerSecond / modelSuccessfulTests : 0
      results.results[modelName].success_rate = (modelSuccessfulTests / questionsToTest.length) * 100
    }

    // Calculer les statistiques globales
    results.summary.successful_tests = successfulTests
    results.summary.failed_tests = results.summary.total_tests - successfulTests
    results.summary.average_response_time = successfulTests > 0 ? totalResponseTime / successfulTests : 0
    results.summary.average_tokens_per_second = successfulTests > 0 ? totalTokensPerSecond / successfulTests : 0

    // Sauvegarder les résultats
    const saveResult = await saveBenchmarkResults(results)

    return NextResponse.json({
      ...results,
      saved: saveResult.success,
      benchmarkId: saveResult.benchmarkId
    })
  } catch (error) {
    console.error('❌ [BENCHMARK-API] Erreur lors du benchmark:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'exécution du benchmark' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const categories = Array.from(new Set(BENCHMARK_QUESTIONS.map(q => q.category)))
  const difficulties = Array.from(new Set(BENCHMARK_QUESTIONS.map(q => q.difficulty)))
  
  return NextResponse.json({
    available_questions: BENCHMARK_QUESTIONS,
    total_questions: BENCHMARK_QUESTIONS.length,
    categories,
    difficulties
  })
}

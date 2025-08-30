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

// Fonction pour sauvegarder les résultats avec le nouveau format v3.0
async function saveBenchmarkResults(results: any) {
  try {
    console.log('💾 [BENCHMARK-API] Sauvegarde des résultats...')
    
    const benchmarkResultsDir = path.join(process.cwd(), 'data', 'benchmark_results')
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(benchmarkResultsDir)) {
      fs.mkdirSync(benchmarkResultsDir, { recursive: true })
    }

    // Sauvegarder le fichier détaillé
    const detailedFilePath = path.join(benchmarkResultsDir, `${results.id}.json`)
    fs.writeFileSync(detailedFilePath, JSON.stringify(results, null, 2))
    console.log(`💾 [BENCHMARK-API] Fichier détaillé sauvé: ${results.id}.json`)

    // 🎯 NOUVEAU: Utiliser l'API moderne pour l'historique v3.0
    try {
      console.log('📡 [BENCHMARK-API] Mise à jour de l\'historique via API...')
      
      // Calculer le taux de succès
      const successRate = results.summary.successful_tests > 0 
        ? Math.round((results.summary.successful_tests / results.summary.total_tests) * 100)
        : 0

      // Extraire les noms d'affichage des modèles
      const modelsDisplayNames = Object.keys(results.results).map(modelName => 
        results.results[modelName].model_name || modelName
      )

      const historyEntry = {
        id: results.id,
        name: results.displayName || results.testSeries,
        duration: Math.round(results.summary.total_duration || 0), // 🕐 Utilise la vraie durée totale
        successRate,
        status: 'completed',
        modelsDisplayNames,
        testSeriesNames: [results.testSeries || results.displayName],
        modelCount: Object.keys(results.results).length,
        questionCount: results.summary.total_tests
      }

      console.log('📤 [BENCHMARK-API] Données pour l\'historique:', historyEntry)

      // Appel à l'API d'historique moderne
      const historyResponse = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : ''}/api/benchmark/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(historyEntry)
      })

      if (historyResponse.ok) {
        const historyResult = await historyResponse.json()
        console.log('✅ [BENCHMARK-API] Historique mis à jour avec succès:', historyResult)
      } else {
        console.error('❌ [BENCHMARK-API] Erreur mise à jour historique:', historyResponse.status)
      }
    } catch (historyError) {
      console.error('❌ [BENCHMARK-API] Erreur lors de la mise à jour de l\'historique:', historyError)
      // Continuer même si l'historique échoue
    }
    
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
      benchmarkId,
      models, 
      categories, 
      questions: customQuestions, 
      testSeries = 'Test Standard',
      streaming = false 
    } = body

    console.log('📋 [BENCHMARK-API] Paramètres reçus:', {
      benchmarkId,
      models: models?.length || 0,
      categories,
      hasCustomQuestions: !!customQuestions,
      streaming
    })

    if (!models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un modèle doit être spécifié' },
        { status: 400 }
      )
    }

    // 🎯 NOUVEAU: Charger les questions selon le benchmarkId
    let questionsToTest: BenchmarkQuestion[] = []
    let benchmarkConfig: any = null
    
    if (benchmarkId) {
      console.log(`🔧 [BENCHMARK-API] Chargement de la config pour: ${benchmarkId}`)
      
      // Charger la configuration depuis le fichier JSON
      try {
        const configPath = path.join(process.cwd(), 'data', 'benchmark-configs.json')
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        benchmarkConfig = configData.benchmarks[benchmarkId]
        
        if (benchmarkConfig) {
          console.log(`✅ [BENCHMARK-API] Config trouvée:`, benchmarkConfig)
          // Adapter le format des questions du fichier config
          questionsToTest = (benchmarkConfig.questions || []).map((q: any) => ({
            id: q.id,
            question: q.text || q.question, // Support des deux formats
            category: q.category,
            expectedType: q.expectedType,
            difficulty: q.difficulty || 'medium'
          }))
        } else {
          console.warn(`⚠️ [BENCHMARK-API] Config non trouvée pour ${benchmarkId}, utilisation des questions par défaut`)
          questionsToTest = BENCHMARK_QUESTIONS.slice(0, 6) // Limiter à 6 questions par défaut
        }
      } catch (error) {
        console.error(`❌ [BENCHMARK-API] Erreur chargement config:`, error)
        questionsToTest = BENCHMARK_QUESTIONS.slice(0, 6) // Fallback
      }
    } else if (customQuestions && customQuestions.length > 0) {
      console.log(`📝 [BENCHMARK-API] Utilisation de questions personnalisées (${customQuestions.length})`)
      questionsToTest = customQuestions.map((q: CustomQuestion) => ({
        id: q.id,
        question: q.question,
        category: q.category,
        expectedKeywords: q.expectedKeywords,
        difficulty: 'medium' as const
      }))
    } else {
      console.log(`📚 [BENCHMARK-API] Utilisation des questions par catégories`)
      questionsToTest = categories ? 
        BENCHMARK_QUESTIONS.filter(q => categories.includes(q.category)) : 
        BENCHMARK_QUESTIONS.slice(0, 6) // Limiter par défaut
    }

    console.log(`📊 [BENCHMARK-API] Questions sélectionnées: ${questionsToTest.length}`)
    questionsToTest.forEach((q, index) => {
      const questionText = q.question || 'Question sans texte'
      console.log(`  ${index + 1}. [${q.category}] ${questionText.substring(0, 50)}...`)
    })

    if (questionsToTest.length === 0) {
      return NextResponse.json(
        { error: 'Aucune question trouvée pour la configuration spécifiée' },
        { status: 400 }
      )
    }

    const executionId = `benchmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = new Date().toISOString()
    const benchmarkStartTime = Date.now() // 🕐 Timestamp de début du benchmark
    const finalTestSeries = benchmarkConfig?.name || testSeries
    
    // Initialiser les résultats
    const results = {
      id: executionId,
      displayName: finalTestSeries,
      testSeries: finalTestSeries,
      timestamp,
      startTime: benchmarkStartTime, // 🕐 Ajout du temps de début
      summary: {
        total_tests: questionsToTest.length * models.length,
        successful_tests: 0,
        failed_tests: 0,
        total_models: models.length,
        average_response_time: 0,
        average_tokens_per_second: 0,
        total_duration: 0, // 🕐 Durée totale du benchmark
        categories_tested: Array.from(new Set(questionsToTest.map(q => q.category))),
        models_tested: models
      },
      results: {} as any
    }

    console.log(`🚀 [BENCHMARK-API] Démarrage exécution: ${results.summary.total_tests} tests (${questionsToTest.length} questions × ${models.length} modèles)`)

    // Mode streaming
    if (streaming) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', benchmarkId: executionId, totalTests: results.summary.total_tests })}\n\n`))

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
            const benchmarkEndTime = Date.now() // 🕐 Timestamp de fin
            results.summary.total_duration = benchmarkEndTime - benchmarkStartTime // 🕐 Durée totale en ms
            results.summary.successful_tests = successfulTests
            results.summary.failed_tests = results.summary.total_tests - successfulTests
            results.summary.average_response_time = successfulTests > 0 ? totalResponseTime / successfulTests : 0
            results.summary.average_tokens_per_second = successfulTests > 0 ? totalTokensPerSecond / successfulTests : 0

            console.log(`⏱️ [BENCHMARK-API] Durée totale: ${results.summary.total_duration}ms (${Math.round(results.summary.total_duration / 1000)}s)`)

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
    const benchmarkEndTime = Date.now() // 🕐 Timestamp de fin
    results.summary.total_duration = benchmarkEndTime - benchmarkStartTime // 🕐 Durée totale en ms
    results.summary.successful_tests = successfulTests
    results.summary.failed_tests = results.summary.total_tests - successfulTests
    results.summary.average_response_time = successfulTests > 0 ? totalResponseTime / successfulTests : 0
    results.summary.average_tokens_per_second = successfulTests > 0 ? totalTokensPerSecond / successfulTests : 0

    console.log(`⏱️ [BENCHMARK-API] Durée totale: ${results.summary.total_duration}ms (${Math.round(results.summary.total_duration / 1000)}s)`)

    // Sauvegarder les résultats
    const saveResult = await saveBenchmarkResults(results)

    return NextResponse.json({
      ...results,
      saved: saveResult.success,
      benchmarkId: saveResult.benchmarkId
    })
  } catch (error) {
    console.error('❌ [BENCHMARK-API] Erreur lors du benchmark:', error)
    console.error('❌ [BENCHMARK-API] Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace')
    return NextResponse.json(
      { 
        error: 'Erreur lors de l\'exécution du benchmark',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
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

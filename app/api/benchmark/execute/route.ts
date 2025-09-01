import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * 🎯 BENCHMARK EXECUTE API v3.2.0 - Exécution de benchmarks multiples avec progression globale
 * POST /api/benchmark/execute - Exécuter un ou plusieurs benchmarks depuis leurs configurations
 * GET /api/benchmark/execute - Obtenir les configurations disponibles
 */

interface BenchmarkQuestion {
  id: string
  question: string
  category: string
  expectedType?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  expectedKeywords?: string[]
}

/**
 * 📖 Charger la configuration d'un benchmark depuis le fichier JSON
 */
async function loadBenchmarkConfig(benchmarkId: string): Promise<{
  config: any
  questions: BenchmarkQuestion[]
}> {
  try {
    console.log(`🔧 [BENCHMARK-API] Chargement configuration: ${benchmarkId}`)
    
    const configPath = path.join(process.cwd(), 'data', 'benchmark-configs.json')
    
    if (!fs.existsSync(configPath)) {
      throw new Error(`Fichier de configuration non trouvé: ${configPath}`)
    }
    
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    const benchmarkConfig = configData.benchmarks?.[benchmarkId]
    
    if (!benchmarkConfig) {
      throw new Error(`Configuration non trouvée pour le benchmark: ${benchmarkId}`)
    }
    
    if (!benchmarkConfig.questions || !Array.isArray(benchmarkConfig.questions)) {
      throw new Error(`Aucune question trouvée pour le benchmark: ${benchmarkId}`)
    }
    
    // Adapter le format des questions
    const questions: BenchmarkQuestion[] = benchmarkConfig.questions.map((q: any) => ({
      id: q.id,
      question: q.text || q.question,
      category: q.category,
      expectedType: q.expectedType,
      difficulty: q.difficulty || 'medium'
    }))
    
    console.log(`✅ [BENCHMARK-API] Configuration chargée: ${questions.length} questions`)
    
    return {
      config: benchmarkConfig,
      questions
    }
  } catch (error) {
    console.error(`❌ [BENCHMARK-API] Erreur chargement configuration:`, error)
    throw error
  }
}

/**
 * 📖 Charger plusieurs configurations de benchmarks et les combiner
 */
async function loadMultipleBenchmarkConfigs(benchmarkIds: string[]): Promise<{
  combinedConfig: any
  allQuestions: BenchmarkQuestion[]
  benchmarkDetails: Array<{ id: string; name: string; questions: BenchmarkQuestion[] }>
}> {
  try {
    console.log(`🔧 [BENCHMARK-API] Chargement de ${benchmarkIds.length} configurations:`, benchmarkIds)
    
    const benchmarkDetails: Array<{ id: string; name: string; questions: BenchmarkQuestion[] }> = []
    const allQuestions: BenchmarkQuestion[] = []
    const benchmarkNames: string[] = []
    
    for (const benchmarkId of benchmarkIds) {
      const { config, questions } = await loadBenchmarkConfig(benchmarkId)
      
      // Préfixer les IDs des questions pour éviter les conflits
      const prefixedQuestions = questions.map(q => ({
        ...q,
        id: `${benchmarkId}_${q.id}`,
        benchmarkId // Ajouter l'ID du benchmark source
      }))
      
      benchmarkDetails.push({
        id: benchmarkId,
        name: config.name || benchmarkId,
        questions: prefixedQuestions
      })
      
      allQuestions.push(...prefixedQuestions)
      benchmarkNames.push(config.name || benchmarkId)
    }
    
    // Créer une configuration combinée
    const combinedConfig = {
      id: benchmarkIds.join('_'),
      name: benchmarkIds.length > 1 ? `Suite: ${benchmarkNames.join(' + ')}` : benchmarkNames[0],
      description: `Benchmark combiné de ${benchmarkIds.length} série(s): ${benchmarkNames.join(', ')}`,
      benchmarkIds,
      benchmarkNames
    }
    
    console.log(`✅ [BENCHMARK-API] ${allQuestions.length} questions combinées de ${benchmarkIds.length} benchmarks`)
    
    return {
      combinedConfig,
      allQuestions,
      benchmarkDetails
    }
  } catch (error) {
    console.error(`❌ [BENCHMARK-API] Erreur chargement configurations multiples:`, error)
    throw error
  }
}

/**
 * 📋 Charger toutes les configurations disponibles
 */
async function loadAllBenchmarkConfigs(): Promise<any> {
  try {
    const configPath = path.join(process.cwd(), 'data', 'benchmark-configs.json')
    
    if (!fs.existsSync(configPath)) {
      throw new Error(`Fichier de configuration non trouvé: ${configPath}`)
    }
    
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    return configData
  } catch (error) {
    console.error(`❌ [BENCHMARK-API] Erreur chargement configurations:`, error)
    throw error
  }
}

async function getServiceUrlForModel(modelName: string): Promise<string> {
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
}

/**
 * 🧪 Tester la réponse d'un modèle à une question
 */
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

/**
 * ✅ Valider la requête de benchmark (support multiple)
 */
function validateBenchmarkRequest(body: any): { isValid: boolean; error?: string; data?: any } {
  const { benchmarkId, benchmarkIds, models, streaming = false } = body

  if (!models || !Array.isArray(models) || models.length === 0) {
    return { isValid: false, error: 'Au moins un modèle doit être spécifié' }
  }

  // Support des deux formats: benchmarkId unique ou benchmarkIds multiple
  let finalBenchmarkIds: string[] = []
  
  if (benchmarkIds && Array.isArray(benchmarkIds) && benchmarkIds.length > 0) {
    finalBenchmarkIds = benchmarkIds
  } else if (benchmarkId && typeof benchmarkId === 'string') {
    finalBenchmarkIds = [benchmarkId]
  } else {
    return { isValid: false, error: 'Au moins un benchmarkId doit être spécifié' }
  }

  return {
    isValid: true,
    data: { benchmarkIds: finalBenchmarkIds, models, streaming }
  }
}

/**
 * 🎯 Initialiser les résultats de benchmark (support multiple)
 */
function initializeBenchmarkResults(
  combinedConfig: any,
  allQuestions: BenchmarkQuestion[],
  models: string[]
) {
  const executionId = `benchmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const timestamp = new Date().toISOString()
  const benchmarkStartTime = Date.now()
  
  return {
    id: executionId,
    displayName: combinedConfig.name,
    testSeries: combinedConfig.name,
    benchmarkIds: combinedConfig.benchmarkIds || [combinedConfig.id],
    benchmarkNames: combinedConfig.benchmarkNames || [combinedConfig.name],
    timestamp,
    startTime: benchmarkStartTime,
    summary: {
      total_tests: allQuestions.length * models.length,
      successful_tests: 0,
      failed_tests: 0,
      total_models: models.length,
      average_response_time: 0,
      average_tokens_per_second: 0,
      total_duration: 0,
      categories_tested: Array.from(new Set(allQuestions.map(q => q.category))),
      models_tested: models,
      total_questions: allQuestions.length,
      benchmark_count: combinedConfig.benchmarkIds?.length || 1
    },
    results: {} as any
  }
}

/**
 * 📊 Calculer les statistiques finales
 */
function calculateFinalStatistics(
  results: any,
  benchmarkStartTime: number,
  successfulTests: number,
  totalResponseTime: number,
  totalTokensPerSecond: number
) {
  const benchmarkEndTime = Date.now()
  results.summary.total_duration = benchmarkEndTime - benchmarkStartTime
  results.summary.successful_tests = successfulTests
  results.summary.failed_tests = results.summary.total_tests - successfulTests
  results.summary.average_response_time = successfulTests > 0 ? totalResponseTime / successfulTests : 0
  results.summary.average_tokens_per_second = successfulTests > 0 ? totalTokensPerSecond / successfulTests : 0

  console.log(`⏱️ [BENCHMARK-API] Durée totale: ${results.summary.total_duration}ms (${Math.round(results.summary.total_duration / 1000)}s)`)
  
  return results
}

/**
 * 🔄 Exécuter les tests pour un modèle (optimisé pour benchmarks multiples)
 */
async function executeTestsForModel(
  modelName: string,
  benchmarkDetails: Array<{ id: string; name: string; questions: BenchmarkQuestion[] }>,
  allQuestions: BenchmarkQuestion[],
  results: any,
  streamController?: ReadableStreamDefaultController<Uint8Array>
) {
  const encoder = streamController ? new TextEncoder() : null
  
  if (streamController) {
    streamController.enqueue(encoder!.encode(`data: ${JSON.stringify({ type: 'model_start', model: modelName })}\n\n`))
  }
  
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

  // 🎯 NOUVELLE LOGIQUE: Exécuter série par série pour ce modèle
  if (benchmarkDetails.length > 1) {
    console.log(`📊 [BENCHMARK-API] ${modelName}: Exécution de ${benchmarkDetails.length} séries séquentiellement`)
    
    for (const benchmarkDetail of benchmarkDetails) {
      if (streamController) {
        streamController.enqueue(encoder!.encode(`data: ${JSON.stringify({ 
          type: 'series_start', 
          model: modelName, 
          seriesName: benchmarkDetail.name,
          seriesQuestionCount: benchmarkDetail.questions.length
        })}\n\n`))
      }
      
      console.log(`  📝 [${modelName}] Série: ${benchmarkDetail.name} (${benchmarkDetail.questions.length} questions)`)
      
      // Exécuter toutes les questions de cette série
      for (const question of benchmarkDetail.questions) {
        if (streamController) {
          streamController.enqueue(encoder!.encode(`data: ${JSON.stringify({ 
            type: 'question_start', 
            model: modelName, 
            questionId: question.id,
            question: question.question,
            series: benchmarkDetail.name
          })}\n\n`))
        }

        const testResult = await testModelResponse(modelName, question.question, serviceUrl)
        
        results.results[modelName].questions[question.id] = {
          question: question.question,
          category: question.category,
          difficulty: question.difficulty,
          series: benchmarkDetail.name,
          seriesId: benchmarkDetail.id,
          ...testResult
        }

        if (testResult.success) {
          modelSuccessfulTests++
          modelTotalTime += testResult.responseTime
          modelTotalTokensPerSecond += testResult.tokensPerSecond
        }

        if (streamController) {
          streamController.enqueue(encoder!.encode(`data: ${JSON.stringify({ 
            type: 'question_complete', 
            model: modelName, 
            questionId: question.id,
            result: testResult,
            series: benchmarkDetail.name
          })}\n\n`))
        }
      }
      
      if (streamController) {
        streamController.enqueue(encoder!.encode(`data: ${JSON.stringify({ 
          type: 'series_complete', 
          model: modelName, 
          seriesName: benchmarkDetail.name
        })}\n\n`))
      }
    }
  } else {
    // Série unique - logique simplifiée
    const questionsToTest = benchmarkDetails[0]?.questions || allQuestions
    
    for (const question of questionsToTest) {
      if (streamController) {
        streamController.enqueue(encoder!.encode(`data: ${JSON.stringify({ 
          type: 'question_start', 
          model: modelName, 
          questionId: question.id,
          question: question.question 
        })}\n\n`))
      }

      const testResult = await testModelResponse(modelName, question.question, serviceUrl)
      
      results.results[modelName].questions[question.id] = {
        question: question.question,
        category: question.category,
        difficulty: question.difficulty,
        ...testResult
      }

      if (testResult.success) {
        modelSuccessfulTests++
        modelTotalTime += testResult.responseTime
        modelTotalTokensPerSecond += testResult.tokensPerSecond
      }

      if (streamController) {
        streamController.enqueue(encoder!.encode(`data: ${JSON.stringify({ 
          type: 'question_complete', 
          model: modelName, 
          questionId: question.id,
          result: testResult
        })}\n\n`))
      }
    }
  }

  // Calculer les moyennes pour ce modèle
  const totalQuestions = allQuestions.length
  results.results[modelName].total_response_time = modelTotalTime
  results.results[modelName].average_response_time = modelSuccessfulTests > 0 ? modelTotalTime / modelSuccessfulTests : 0
  results.results[modelName].total_tokens_per_second = modelTotalTokensPerSecond
  results.results[modelName].average_tokens_per_second = modelSuccessfulTests > 0 ? modelTotalTokensPerSecond / modelSuccessfulTests : 0
  results.results[modelName].success_rate = (modelSuccessfulTests / totalQuestions) * 100

  if (streamController) {
    streamController.enqueue(encoder!.encode(`data: ${JSON.stringify({ type: 'model_complete', model: modelName, stats: results.results[modelName] })}\n\n`))
  }

  return {
    successfulTests: modelSuccessfulTests,
    totalTime: modelTotalTime,
    totalTokensPerSecond: modelTotalTokensPerSecond
  }
}

/**
 * 🌊 Exécuter le benchmark en mode streaming
 */
async function executeStreamingBenchmark(
  models: string[],
  benchmarkDetails: Array<{ id: string; name: string; questions: BenchmarkQuestion[] }>,
  allQuestions: BenchmarkQuestion[],
  results: any
): Promise<Response> {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'start', 
          benchmarkId: results.id, 
          totalTests: results.summary.total_tests 
        })}\n\n`))

        let totalResponseTime = 0
        let totalTokensPerSecond = 0
        let successfulTests = 0

        for (const modelName of models) {
          const modelStats = await executeTestsForModel(modelName, benchmarkDetails, allQuestions, results, controller)
          successfulTests += modelStats.successfulTests
          totalResponseTime += modelStats.totalTime
          totalTokensPerSecond += modelStats.totalTokensPerSecond
        }

        // Calculer les statistiques finales
        calculateFinalStatistics(results, results.startTime, successfulTests, totalResponseTime, totalTokensPerSecond)

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

/**
 * 📦 Exécuter le benchmark en mode batch
 */
async function executeBatchBenchmark(
  models: string[],
  benchmarkDetails: Array<{ id: string; name: string; questions: BenchmarkQuestion[] }>,
  allQuestions: BenchmarkQuestion[],
  results: any
) {
  let totalResponseTime = 0
  let totalTokensPerSecond = 0
  let successfulTests = 0

  for (const modelName of models) {
    const modelStats = await executeTestsForModel(modelName, benchmarkDetails, allQuestions, results)
    successfulTests += modelStats.successfulTests
    totalResponseTime += modelStats.totalTime
    totalTokensPerSecond += modelStats.totalTokensPerSecond
  }

  // Calculer les statistiques finales
  calculateFinalStatistics(results, results.startTime, successfulTests, totalResponseTime, totalTokensPerSecond)

  // Sauvegarder les résultats
  const saveResult = await saveBenchmarkResults(results)

  return {
    ...results,
    saved: saveResult.success,
    benchmarkId: saveResult.benchmarkId
  }
}

/**
 * 📁 Charger ou créer le fichier de données d'un modèle
 */
async function loadOrCreateModelData(modelId: string, displayName?: string): Promise<any> {
  try {
    const modelsDir = path.join(process.cwd(), 'data', 'benchmark', 'models')
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true })
    }

    const modelFilePath = path.join(modelsDir, `model_${modelId.replace(/[^a-zA-Z0-9.-]/g, '_')}.json`)
    
    if (fs.existsSync(modelFilePath)) {
      // Charger les données existantes
      const existingData = JSON.parse(fs.readFileSync(modelFilePath, 'utf-8'))
      return existingData
    } else {
      // Créer un nouveau fichier de modèle
      const newModelData = {
        modelId,
        displayName: displayName || modelId,
        notes: {
          generale: ""
        },
        resultsSummary: {},
        history: []
      }
      
      fs.writeFileSync(modelFilePath, JSON.stringify(newModelData, null, 2))
      console.log(`📁 [MODEL-DATA] Nouveau fichier créé pour ${modelId}`)
      
      return newModelData
    }
  } catch (error) {
    console.error(`❌ [MODEL-DATA] Erreur chargement données modèle ${modelId}:`, error)
    throw error
  }
}

/**
 * 💾 Sauvegarder les résultats d'un modèle dans son fichier dédié (support benchmarks multiples)
 */
async function saveModelResults(
  modelId: string,
  benchmarkId: string,
  benchmarkName: string,
  benchmarkResults: any,
  benchmarkIds?: string[],
  benchmarkNames?: string[]
): Promise<void> {
  try {
    console.log(`💾 [MODEL-DATA] Sauvegarde résultats pour ${modelId}...`)
    
    // Charger les données existantes du modèle
    const modelData = await loadOrCreateModelData(modelId, benchmarkResults.model_name)
    
    // Préparer l'entrée d'historique
    const historyEntry = {
      benchmarkId,
      name: benchmarkName,
      timestamp: new Date().toISOString(),
      duration: Math.round(benchmarkResults.total_response_time || 0),
      successRate: Math.round(benchmarkResults.success_rate || 0),
      // Ajouter les informations de benchmarks multiples si disponibles
      ...(benchmarkIds && benchmarkIds.length > 1 && {
        isCombinedBenchmark: true,
        includedBenchmarks: benchmarkIds,
        includedBenchmarkNames: benchmarkNames
      }),
      questions: Object.entries(benchmarkResults.questions || {}).map(([questionId, questionData]: [string, any]) => ({
        id: questionId,
        question: questionData.question?.substring(0, 100) + "..." || "Question inconnue",
        category: questionData.category || "unknown",
        difficulty: questionData.difficulty || "medium",
        response: questionData.response?.substring(0, 200) + "..." || "",
        success: questionData.success || false,
        responseTime: questionData.responseTime || 0,
        tokensPerSecond: questionData.tokensPerSecond || 0,
        // Ajouter l'origine du benchmark pour les questions préfixées
        ...(questionData.benchmarkId && { benchmarkId: questionData.benchmarkId })
      }))
    }
    
    // Ajouter à l'historique (garder les 50 derniers)
    modelData.history.unshift(historyEntry)
    if (modelData.history.length > 50) {
      modelData.history = modelData.history.slice(0, 50)
    }
    
    // Mettre à jour le résumé pour ce benchmark
    const benchmarkKey = benchmarkName.toLowerCase().replace(/[^a-z0-9]/g, '_')
    modelData.resultsSummary[benchmarkKey] = {
      lastScore: Math.round(benchmarkResults.success_rate || 0),
      lastExecution: new Date().toISOString(),
      historyIds: [benchmarkId, ...(modelData.resultsSummary[benchmarkKey]?.historyIds || [])].slice(0, 10) // Garder les 10 derniers
    }
    
    // Si c'est un benchmark combiné, mettre à jour aussi les résumés individuels
    if (benchmarkIds && benchmarkIds.length > 1 && benchmarkNames) {
      benchmarkIds.forEach((individualBenchmarkId, index) => {
        const individualBenchmarkName = benchmarkNames[index]
        const individualKey = individualBenchmarkName.toLowerCase().replace(/[^a-z0-9]/g, '_')
        
        // Calculer le score pour ce benchmark individuel
        const questionsForThisBenchmark = Object.entries(benchmarkResults.questions || {})
          .filter(([questionId]) => questionId.startsWith(`${individualBenchmarkId}_`))
        
        const successfulQuestions = questionsForThisBenchmark.filter(([, data]: [string, any]) => data.success).length
        const individualScore = questionsForThisBenchmark.length > 0 
          ? Math.round((successfulQuestions / questionsForThisBenchmark.length) * 100)
          : 0
        
        modelData.resultsSummary[individualKey] = {
          lastScore: individualScore,
          lastExecution: new Date().toISOString(),
          historyIds: [benchmarkId, ...(modelData.resultsSummary[individualKey]?.historyIds || [])].slice(0, 10)
        }
      })
    }
    
    // Sauvegarder le fichier
    const modelsDir = path.join(process.cwd(), 'data', 'benchmark', 'models')
    const modelFilePath = path.join(modelsDir, `model_${modelId.replace(/[^a-zA-Z0-9.-]/g, '_')}.json`)
    
    fs.writeFileSync(modelFilePath, JSON.stringify(modelData, null, 2))
    console.log(`✅ [MODEL-DATA] Données sauvées pour ${modelId}`)
    
  } catch (error) {
    console.error(`❌ [MODEL-DATA] Erreur sauvegarde modèle ${modelId}:`, error)
    // Ne pas faire échouer le benchmark si la sauvegarde modèle échoue
  }
}

// Fonction pour sauvegarder les résultats avec le nouveau format v3.1.0
async function saveBenchmarkResults(results: any) {
  try {
    console.log('💾 [BENCHMARK-API] Sauvegarde des résultats...')
    
    const benchmarkResultsDir = path.join(process.cwd(), 'data', 'benchmark', 'results')
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(benchmarkResultsDir)) {
      fs.mkdirSync(benchmarkResultsDir, { recursive: true })
    }

    // Sauvegarder le fichier détaillé
    const detailedFilePath = path.join(benchmarkResultsDir, `${results.id}.json`)
    fs.writeFileSync(detailedFilePath, JSON.stringify(results, null, 2))
    console.log(`💾 [BENCHMARK-API] Fichier détaillé sauvé: ${results.id}.json`)

    // � v3.1.0: Sauvegarder les résultats par modèle
    console.log('📁 [BENCHMARK-API] Sauvegarde par modèle...')
    for (const [modelId, modelResults] of Object.entries(results.results)) {
      await saveModelResults(
        modelId,
        results.id,
        results.displayName || results.testSeries,
        modelResults,
        results.benchmarkIds,
        results.benchmarkNames
      )
    }

    // 🎯 Utiliser l'API moderne pour l'historique v3.1.0
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
        testSeriesNames: results.benchmarkNames || [results.testSeries || results.displayName],
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
    
    // 🔍 Validation de la requête
    const validation = validateBenchmarkRequest(body)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    
    const { benchmarkIds, models, streaming } = validation.data!

    console.log('📋 [BENCHMARK-API] Paramètres reçus:', {
      benchmarkIds,
      benchmarkCount: benchmarkIds.length,
      models: models?.length || 0,
      streaming
    })

    // 🎯 Chargement des configurations (single ou multiple)
    let allQuestions: BenchmarkQuestion[] = []
    let combinedConfig: any = null
    let benchmarkDetails: Array<{ id: string; name: string; questions: BenchmarkQuestion[] }> = []
    
    try {
      if (benchmarkIds.length === 1) {
        // Un seul benchmark - utiliser l'ancienne logique
        const { config, questions } = await loadBenchmarkConfig(benchmarkIds[0])
        combinedConfig = {
          id: benchmarkIds[0],
          name: config.name || benchmarkIds[0],
          benchmarkIds: [benchmarkIds[0]],
          benchmarkNames: [config.name || benchmarkIds[0]]
        }
        allQuestions = questions
        benchmarkDetails = [{
          id: benchmarkIds[0],
          name: config.name || benchmarkIds[0],
          questions
        }]
      } else {
        // Plusieurs benchmarks - nouvelle logique combinée
        const result = await loadMultipleBenchmarkConfigs(benchmarkIds)
        combinedConfig = result.combinedConfig
        allQuestions = result.allQuestions
        benchmarkDetails = result.benchmarkDetails
      }
    } catch (error) {
      console.error(`❌ [BENCHMARK-API] Erreur configuration:`, error)
      return NextResponse.json(
        { 
          error: 'Configuration de benchmark invalide',
          details: error instanceof Error ? error.message : 'Erreur inconnue'
        },
        { status: 400 }
      )
    }

    console.log(`📊 [BENCHMARK-API] Questions sélectionnées: ${allQuestions.length} (${benchmarkIds.length} benchmark(s))`)
    
    // Afficher un résumé par benchmark
    benchmarkDetails.forEach((detail, index) => {
      console.log(`  ${index + 1}. [${detail.id}] ${detail.name}: ${detail.questions.length} questions`)
    })

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: 'Aucune question trouvée pour les configurations spécifiées' },
        { status: 400 }
      )
    }

    // 🎯 Initialisation des résultats
    const results = initializeBenchmarkResults(combinedConfig, allQuestions, models)
    
    console.log(`🚀 [BENCHMARK-API] Démarrage exécution: ${results.summary.total_tests} tests (${allQuestions.length} questions × ${models.length} modèles)`)

    // 🌊 Exécution selon le mode choisi
    if (streaming) {
      return await executeStreamingBenchmark(models, benchmarkDetails, allQuestions, results)
    } else {
      const finalResults = await executeBatchBenchmark(models, benchmarkDetails, allQuestions, results)
      return NextResponse.json(finalResults)
    }

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
  console.log('📋 [BENCHMARK-API] Requête GET - Configurations disponibles')
  
  try {
    const configData = await loadAllBenchmarkConfigs()
    const benchmarks = configData.benchmarks || {}
    
    // Extraire les catégories et difficultés depuis les configurations
    const allQuestions = Object.values(benchmarks).flatMap((benchmark: any) => 
      benchmark.questions || []
    )
    
    const categories = Array.from(new Set(allQuestions.map((q: any) => q.category)))
    const difficulties = Array.from(new Set(allQuestions.map((q: any) => q.difficulty)))
    
    console.log(`✅ [BENCHMARK-API] ${Object.keys(benchmarks).length} configurations disponibles`)
    
    return NextResponse.json({
      benchmarks: Object.keys(benchmarks),
      total_benchmarks: Object.keys(benchmarks).length,
      total_questions: allQuestions.length,
      categories,
      difficulties,
      configurations: benchmarks
    })
  } catch (error) {
    console.error('❌ [BENCHMARK-API] Erreur chargement configurations:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors du chargement des configurations',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

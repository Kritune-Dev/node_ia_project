import { NextRequest, NextResponse } from 'next/server'

interface BenchmarkQuestion {
  id: string
  question: string
  category: string
  expectedType: string
  difficulty: 'easy' | 'medium' | 'hard'
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

async function testModelResponse(modelName: string, prompt: string, serviceUrl: string = 'http://localhost:11434') {
  const startTime = Date.now()
  
  try {
    const response = await fetch(`${serviceUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        prompt: prompt,
        stream: false
      })
    })

    const endTime = Date.now()
    const responseTime = endTime - startTime

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        responseTime,
        tokensGenerated: 0,
        tokensPerSecond: 0,
        service_url: serviceUrl,
        full_url: `${serviceUrl}/api/generate`,
        request_payload: {
          model: modelName,
          prompt: prompt,
          stream: false
        }
      }
    }

    const result = await response.json()
    
    return {
      success: true,
      response: result.response || result.message || '',
      responseTime,
      tokensGenerated: result.eval_count || 0,
      tokensPerSecond: result.eval_count ? (result.eval_count / (responseTime / 1000)) : 0,
      service_url: serviceUrl,
      full_url: `${serviceUrl}/api/generate`
    }
  } catch (error) {
    const endTime = Date.now()
    const responseTime = endTime - startTime
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      responseTime,
      tokensGenerated: 0,
      tokensPerSecond: 0,
      service_url: serviceUrl,
      full_url: `${serviceUrl}/api/generate`,
      request_payload: {
        model: modelName,
        prompt: prompt,
        stream: false
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { models, questionIds, serviceUrls } = await request.json()
    
    if (!models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json(
        { error: 'Liste de modèles requise' },
        { status: 400 }
      )
    }

    // Sélectionner les questions à tester
    const questionsToTest = questionIds ? 
      BENCHMARK_QUESTIONS.filter(q => questionIds.includes(q.id)) :
      BENCHMARK_QUESTIONS

    if (questionsToTest.length === 0) {
      return NextResponse.json(
        { error: 'Aucune question valide trouvée' },
        { status: 400 }
      )
    }

    const results: any = {
      benchmark_id: `benchmark_${Date.now()}`,
      timestamp: new Date().toISOString(),
      models_tested: models.length,
      questions_tested: questionsToTest.length,
      results: {},
      summary: {
        total_tests: models.length * questionsToTest.length,
        successful_tests: 0,
        failed_tests: 0,
        average_response_time: 0,
        average_tokens_per_second: 0
      }
    }

    // Détecter le service approprié pour chaque modèle
    const getServiceUrlForModel = async (modelName: string): Promise<string> => {
      // Essayer d'abord le service natif (performances optimales)
      try {
        const nativeResponse = await fetch('http://localhost:11436/api/tags')
        if (nativeResponse.ok) {
          const nativeData = await nativeResponse.json()
          const nativeModels = nativeData.models?.map((m: any) => m.name) || []
          if (nativeModels.includes(modelName)) {
            return 'http://localhost:11436'
          }
        }
      } catch (error) {
        // Service natif non disponible
      }

      // Essayer le service Docker medical
      try {
        const dockerResponse = await fetch('http://localhost:11434/api/tags')
        if (dockerResponse.ok) {
          const dockerData = await dockerResponse.json()
          const dockerModels = dockerData.models?.map((m: any) => m.name) || []
          if (dockerModels.includes(modelName)) {
            return 'http://localhost:11434'
          }
        }
      } catch (error) {
        // Service Docker non disponible
      }

      // Essayer le service Docker translator en dernier recours
      try {
        const translatorResponse = await fetch('http://localhost:11435/api/tags')
        if (translatorResponse.ok) {
          const translatorData = await translatorResponse.json()
          const translatorModels = translatorData.models?.map((m: any) => m.name) || []
          if (translatorModels.includes(modelName)) {
            return 'http://localhost:11435'
          }
        }
      } catch (error) {
        // Service translator non disponible
      }

      // Retourner le service par défaut si aucun service ne contient le modèle
      return defaultServiceUrl
    }

    const defaultServiceUrl = process.env.NATIVE_OLLAMA_URL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    let totalResponseTime = 0
    let totalTokensPerSecond = 0
    let successfulTests = 0

    // Tester chaque modèle
    for (const model of models) {
      const modelName = typeof model === 'string' ? model : model.name
      const serviceUrl = serviceUrls?.[modelName] || await getServiceUrlForModel(modelName)
      
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

      // Tester chaque question
      for (const question of questionsToTest) {
        const testResult = await testModelResponse(modelName, question.question, serviceUrl)
        
        results.results[modelName].questions[question.id] = {
          question: question.question,
          category: question.category,
          difficulty: question.difficulty,
          ...testResult,
          user_rating: null,
          user_comment: null
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

    return NextResponse.json(results)
  } catch (error) {
    console.error('Erreur lors du benchmark:', error)
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

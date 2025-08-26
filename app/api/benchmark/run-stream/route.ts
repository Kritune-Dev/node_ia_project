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
    question: 'Quelles sont les principales causes du réchauffement climatique ?',
    category: 'general',
    expectedType: 'list',
    difficulty: 'easy'
  },
  {
    id: 'general_2',
    question: 'Expliquez le concept d\'intelligence artificielle et ses applications principales.',
    category: 'general',
    expectedType: 'explanation',
    difficulty: 'medium'
  },
  // Tests de programmation
  {
    id: 'coding_1',
    question: 'Écrivez une fonction Python qui calcule la suite de Fibonacci.',
    category: 'coding',
    expectedType: 'code',
    difficulty: 'medium'
  },
  // Tests de raisonnement
  {
    id: 'reasoning_1',
    question: 'Si tous les A sont B, et tous les B sont C, que peut-on dire des A par rapport aux C ? Expliquez votre raisonnement.',
    category: 'reasoning',
    expectedType: 'logical_reasoning',
    difficulty: 'medium'
  }
]

function getServiceUrlForModel(model: string): string {
  const medicalModels = ['meditron', 'medllama2', 'cniongolo/biomistral']
  const translatorModels = ['aya']
  
  if (medicalModels.some(med => model.includes(med))) {
    return 'http://localhost:11434'
  } else if (translatorModels.some(trans => model.includes(trans))) {
    return 'http://localhost:11435'
  } else {
    return 'http://localhost:11436'
  }
}

async function testModel(model: string, question: BenchmarkQuestion, writeFunction: (data: string) => Promise<void>) {
  const serviceUrl = getServiceUrlForModel(model)
  const startTime = Date.now()
  
  // Envoyer la mise à jour de progression
  await writeFunction(`data: ${JSON.stringify({
    type: 'progress',
    model: model,
    question: question.id,
    questionText: question.question,
    status: 'starting'
  })}\n\n`)

  try {
    const response = await fetch(`${serviceUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: question.question,
        stream: false
      }),
      signal: AbortSignal.timeout(30000) // Timeout de 30 secondes
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const endTime = Date.now()
    const responseTime = endTime - startTime
    const tokensGenerated = data.response?.length || 0
    const tokensPerSecond = tokensGenerated > 0 ? (tokensGenerated / (responseTime / 1000)) : 0

    const result = {
      success: true,
      response: data.response || '',
      responseTime,
      tokensGenerated,
      tokensPerSecond,
      question: question.question,
      category: question.category,
      difficulty: question.difficulty,
      service_url: serviceUrl
    }

    // Envoyer le résultat
    await writeFunction(`data: ${JSON.stringify({
      type: 'result',
      model: model,
      question: question.id,
      result: result
    })}\n\n`)

    return result
  } catch (error: any) {
    const endTime = Date.now()
    const responseTime = endTime - startTime

    const result = {
      success: false,
      error: error.message || 'Erreur inconnue',
      responseTime,
      tokensGenerated: 0,
      tokensPerSecond: 0,
      question: question.question,
      category: question.category,
      difficulty: question.difficulty,
      service_url: serviceUrl
    }

    // Envoyer l'erreur
    await writeFunction(`data: ${JSON.stringify({
      type: 'result',
      model: model,
      question: question.id,
      result: result
    })}\n\n`)

    return result
  }
}

export async function POST(request: NextRequest) {
  try {
    const { models, questionIds } = await request.json()

    if (!models || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json({ error: 'Liste de modèles requise' }, { status: 400 })
    }

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ error: 'Liste de questions requise' }, { status: 400 })
    }

    // Créer un stream pour les Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        const write = async (data: string) => {
          controller.enqueue(encoder.encode(data))
        }

        try {
          const benchmarkId = `benchmark_${Date.now()}`
          const questions = BENCHMARK_QUESTIONS.filter(q => questionIds.includes(q.id))
          const results: any = {}
          let completedTests = 0
          const totalTests = models.length * questions.length

          // Envoyer le début
          await write(`data: ${JSON.stringify({
            type: 'start',
            benchmarkId,
            totalTests,
            models,
            questions: questions.map(q => ({ id: q.id, text: q.question }))
          })}\n\n`)

          // Tester chaque modèle sur chaque question
          for (const model of models) {
            results[model] = {
              questions: {},
              total_response_time: 0,
              average_response_time: 0,
              average_tokens_per_second: 0,
              success_rate: 0
            }

            for (const question of questions) {
              const result = await testModel(model, question, write)
              results[model].questions[question.id] = result
              results[model].total_response_time += result.responseTime
              
              completedTests++
              
              // Envoyer la progression
              await write(`data: ${JSON.stringify({
                type: 'progress',
                completed: completedTests,
                total: totalTests,
                percentage: Math.round((completedTests / totalTests) * 100)
              })}\n\n`)
            }

            // Calculer les statistiques du modèle
            const modelQuestions = Object.values(results[model].questions) as any[]
            results[model].average_response_time = results[model].total_response_time / modelQuestions.length
            results[model].average_tokens_per_second = modelQuestions.reduce((sum: number, q: any) => sum + (q.tokensPerSecond || 0), 0) / modelQuestions.length
            results[model].success_rate = (modelQuestions.filter((q: any) => q.success).length / modelQuestions.length) * 100
          }

          // Calculer le résumé global
          const allTests = Object.values(results).flatMap((model: any) => Object.values(model.questions))
          const summary = {
            total_tests: allTests.length,
            successful_tests: allTests.filter((test: any) => test.success).length,
            failed_tests: allTests.filter((test: any) => !test.success).length,
            average_response_time: allTests.reduce((sum: number, test: any) => sum + test.responseTime, 0) / allTests.length,
            total_duration: allTests.reduce((sum: number, test: any) => sum + test.responseTime, 0)
          }

          const finalResult = {
            benchmark_id: benchmarkId,
            timestamp: new Date().toISOString(),
            models_tested: models.length,
            questions_tested: questions.length,
            results,
            summary
          }

          // Envoyer le résultat final
          await write(`data: ${JSON.stringify({
            type: 'complete',
            result: finalResult
          })}\n\n`)

        } catch (error) {
          await write(`data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          })}\n\n`)
        } finally {
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

  } catch (error) {
    console.error('Erreur lors du benchmark:', error)
    return NextResponse.json(
      { error: 'Erreur lors du benchmark' },
      { status: 500 }
    )
  }
}

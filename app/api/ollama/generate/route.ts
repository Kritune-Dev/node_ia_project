import { NextRequest, NextResponse } from 'next/server'

/**
 * 🎯 API Ollama Generate - Proxy pour génération de texte
 * Service technique pour communication directe avec Ollama
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

interface GenerateRequest {
  model: string
  prompt: string
  stream?: boolean
  options?: {
    temperature?: number
    top_p?: number
    top_k?: number
    max_tokens?: number
    stop?: string[]
  }
}

interface GenerateResponse {
  model: string
  created_at: string
  response: string
  done: boolean
  context?: number[]
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

/**
 * POST /api/ollama/generate
 * Proxy direct vers Ollama pour génération de texte
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json()
    
    // Validation des paramètres requis
    if (!body.model || !body.prompt) {
      return NextResponse.json({
        error: 'Les champs "model" et "prompt" sont requis',
        received: { model: !!body.model, prompt: !!body.prompt }
      }, { status: 400 })
    }

    const startTime = Date.now()

    // Préparer la requête Ollama
    const ollamaRequest = {
      model: body.model,
      prompt: body.prompt,
      stream: body.stream || false,
      options: {
        temperature: body.options?.temperature || 0.7,
        top_p: body.options?.top_p || 0.9,
        top_k: body.options?.top_k || 40,
        num_predict: body.options?.max_tokens || 1000,
        stop: body.options?.stop || []
      }
    }

    // Mode streaming
    if (body.stream) {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ollamaRequest),
      })

      if (!response.ok) {
        throw new Error(`Ollama HTTP error: ${response.status} ${response.statusText}`)
      }

      // Retourner le stream directement
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Mode non-streaming
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ollamaRequest),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Ollama HTTP error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data: GenerateResponse = await response.json()
    const endTime = Date.now()
    const responseTime = endTime - startTime

    // Calculer les métriques de performance
    const tokensEstimate = data.response ? data.response.length / 4 : 0
    const tokensPerSecond = responseTime > 0 ? (tokensEstimate / (responseTime / 1000)) : 0

    return NextResponse.json({
      success: true,
      model: data.model,
      response: data.response,
      done: data.done,
      
      // Métriques de performance
      performance: {
        responseTime,
        tokensEstimate: Math.round(tokensEstimate),
        tokensPerSecond: Math.round(tokensPerSecond * 100) / 100,
        promptEvalCount: data.prompt_eval_count,
        evalCount: data.eval_count,
        totalDuration: data.total_duration,
        evalDuration: data.eval_duration
      },
      
      // Métadonnées Ollama
      metadata: {
        created_at: data.created_at,
        load_duration: data.load_duration,
        prompt_eval_duration: data.prompt_eval_duration,
        context_length: data.context?.length || 0
      }
    })

  } catch (error) {
    console.error('❌ [OLLAMA-GENERATE] Erreur Ollama Generate:', error)
    
    // Distinguer les types d'erreurs
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        return NextResponse.json({
          success: false,
          error: 'Service Ollama non accessible',
          details: error.message,
          suggestions: [
            'Vérifier qu\'Ollama est démarré: ollama serve',
            'Vérifier l\'URL de connexion',
            'Tester: curl http://localhost:11434/api/version'
          ]
        }, { status: 503 })
      }
      
      if (error.message.includes('HTTP error')) {
        return NextResponse.json({
          success: false,
          error: 'Erreur du service Ollama',
          details: error.message,
          suggestions: [
            'Vérifier que le modèle existe: ollama list',
            'Télécharger le modèle: ollama pull <model_name>',
            'Vérifier les logs Ollama'
          ]
        }, { status: 502 })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Erreur interne lors de la génération',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

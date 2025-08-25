import { NextRequest, NextResponse } from 'next/server'

interface AnalysisRequest {
  text: string
  model?: string
  type: 'clinical' | 'orthopedic' | 'general'
  patient_context?: {
    age?: number
    gender?: string
    symptoms?: string[]
    history?: string
  }
}

interface AnalysisResponse {
  analysis: string
  confidence: number
  recommendations: string[]
  model_used: string
  processing_time: number
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json()
    const { text, model = 'meditron:latest', type, patient_context } = body

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required for analysis' },
        { status: 400 }
      )
    }

    const startTime = Date.now()
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

    // Construire le prompt selon le type d'analyse
    let systemPrompt = ''
    let userPrompt = ''

    switch (type) {
      case 'clinical':
        systemPrompt = `Tu es un assistant IA spécialisé en ostéopathie. Analyse les données cliniques suivantes avec expertise médicale. 
        Fournis une analyse structurée incluant :
        1. Évaluation clinique
        2. Hypothèses diagnostiques
        3. Recommandations thérapeutiques
        4. Tests complémentaires suggérés
        
        Reste factuel et précis. Indique toujours les limites de ton analyse.`
        
        userPrompt = `Données cliniques à analyser : ${text}`
        if (patient_context) {
          userPrompt += `\n\nContexte patient :`
          if (patient_context.age) userPrompt += `\n- Âge : ${patient_context.age} ans`
          if (patient_context.gender) userPrompt += `\n- Sexe : ${patient_context.gender}`
          if (patient_context.symptoms) userPrompt += `\n- Symptômes : ${patient_context.symptoms.join(', ')}`
          if (patient_context.history) userPrompt += `\n- Antécédents : ${patient_context.history}`
        }
        break

      case 'orthopedic':
        systemPrompt = `Tu es un expert en tests orthopédiques et ostéopathiques. Analyse le test orthopédique décrit.
        Structure ta réponse avec :
        1. Description du test
        2. Interprétation des résultats
        3. Structures anatomiques impliquées
        4. Signification clinique
        5. Tests complémentaires recommandés
        
        Sois précis dans l'interprétation des signes cliniques.`
        
        userPrompt = `Test orthopédique à analyser : ${text}`
        break

      default:
        systemPrompt = `Tu es un assistant médical spécialisé en ostéopathie. Réponds de manière professionnelle et précise.`
        userPrompt = text
    }

    // Requête à Ollama
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: userPrompt,
        system: systemPrompt,
        stream: false,
        options: {
          temperature: 0.3, // Plus conservateur pour analyses médicales
          top_p: 0.9,
          num_predict: 1000,
        }
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const data = await response.json()
    const processingTime = Date.now() - startTime

    // Extraire les recommandations du texte (simple regex)
    const analysisText = data.response || ''
    const recommendations = extractRecommendations(analysisText)
    
    // Calculer un score de confiance basé sur la longueur et structure de la réponse
    const confidence = calculateConfidence(analysisText, type)

    const result: AnalysisResponse = {
      analysis: analysisText,
      confidence,
      recommendations,
      model_used: model,
      processing_time: processingTime,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Analysis API error:', error)
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

function extractRecommendations(text: string): string[] {
  const recommendations: string[] = []
  
  // Rechercher des motifs communs de recommandations
  const patterns = [
    /recommand[eé](?:s)?[:\s]*([^\n.]+)/gi,
    /suggest[eé](?:s)?[:\s]*([^\n.]+)/gi,
    /il (?:faut|convient)[:\s]*([^\n.]+)/gi,
    /conseill[eé](?:s)?[:\s]*([^\n.]+)/gi,
  ]

  patterns.forEach(pattern => {
    const matches = Array.from(text.matchAll(pattern))
    for (const match of matches) {
      if (match[1]) {
        recommendations.push(match[1].trim())
      }
    }
  })

  return recommendations.slice(0, 5) // Limiter à 5 recommandations
}

function calculateConfidence(text: string, type: string): number {
  let confidence = 0.5 // Base confidence

  // Facteurs positifs
  if (text.length > 200) confidence += 0.2
  if (text.includes('diagnostic') || text.includes('analyse')) confidence += 0.1
  if (text.includes('recommand') || text.includes('suggest')) confidence += 0.1
  
  // Facteurs spécifiques au type
  if (type === 'clinical') {
    if (text.includes('symptôme') || text.includes('pathologie')) confidence += 0.1
  } else if (type === 'orthopedic') {
    if (text.includes('test') || text.includes('positif') || text.includes('négatif')) confidence += 0.1
  }

  // Facteurs négatifs
  if (text.length < 100) confidence -= 0.2
  if (text.includes('je ne sais pas') || text.includes('incertain')) confidence -= 0.2

  return Math.max(0.1, Math.min(1.0, confidence))
}

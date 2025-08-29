import { NextResponse } from 'next/server'

export async function GET() {
  console.log('[TEST] API de test appelée')
  
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11436'
  console.log(`[TEST] URL Ollama: ${ollamaUrl}`)
  
  try {
    console.log(`[TEST] Tentative de connexion à ${ollamaUrl}/api/tags`)
    
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    
    console.log(`[TEST] Réponse: status=${response.status}, ok=${response.ok}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log(`[TEST] Données:`, data)
      return NextResponse.json({
        status: 'success',
        connected: true,
        url: ollamaUrl,
        models: data.models?.length || 0,
        data: data
      })
    } else {
      console.log(`[TEST] Erreur HTTP: ${response.status}`)
      return NextResponse.json({
        status: 'error',
        connected: false,
        url: ollamaUrl,
        error: `HTTP ${response.status}`,
        models: 0
      })
    }
  } catch (error: any) {
    console.log(`[TEST] Exception:`, error)
    console.log(`[TEST] Error message: ${error.message}`)
    console.log(`[TEST] Error cause:`, error.cause)
    
    return NextResponse.json({
      status: 'error',
      connected: false,
      url: ollamaUrl,
      error: error.message,
      cause: error.cause,
      models: 0
    })
  }
}

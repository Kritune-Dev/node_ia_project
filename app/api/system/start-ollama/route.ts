import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'

export async function POST(request: NextRequest) {
  try {
    console.log('Tentative de démarrage du serveur Ollama...')
    
    // Utiliser les bonnes variables d'environnement pour Ollama
    const env = {
      ...process.env,
      OLLAMA_HOST: '127.0.0.1:11436',
      OLLAMA_ORIGINS: '*'
    }
    
    // Démarrer le serveur Ollama avec la bonne configuration
    const ollamaProcess = spawn('ollama', ['serve'], {
      env,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    // Capturer les logs pour debug
    let startupOutput = ''
    ollamaProcess.stdout?.on('data', (data) => {
      startupOutput += data.toString()
      console.log('Ollama stdout:', data.toString())
    })
    
    ollamaProcess.stderr?.on('data', (data) => {
      startupOutput += data.toString()
      console.log('Ollama stderr:', data.toString())
    })

    // Gérer les erreurs de démarrage
    ollamaProcess.on('error', (error) => {
      console.error('Erreur de démarrage Ollama:', error)
    })

    // Détacher le processus pour qu'il continue même si l'API se ferme
    ollamaProcess.unref()

    // Attendre un peu pour voir si le processus démarre correctement
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Vérifier si le processus est toujours en vie
    const isRunning = ollamaProcess.pid && !ollamaProcess.killed

    console.log(`Ollama PID: ${ollamaProcess.pid}, Running: ${isRunning}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Serveur Ollama démarré avec succès',
      pid: ollamaProcess.pid,
      host: '127.0.0.1:11436',
      output: startupOutput.slice(-500) // Derniers 500 caractères des logs
    })
  } catch (error) {
    console.error('Erreur lors du démarrage d\'Ollama:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Impossible de démarrer le serveur Ollama',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      suggestion: 'Vérifiez qu\'Ollama est installé: brew install ollama'
    }, { status: 500 })
  }
}

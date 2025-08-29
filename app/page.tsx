'use client'

import { useState, useEffect } from 'react'
import { Brain, Activity, BarChart3, FileText, Terminal, Play } from 'lucide-react'
import Link from 'next/link'
import ModelStatus from '@/components/models/ModelStatus'
import QuickAnalysis from '@/components/ui/QuickAnalysis'
import RecentResults from '@/components/ui/RecentResults'
import OllamaSetupGuide from '@/components/guides/OllamaSetupGuide'

export default function HomePage() {
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline' | 'error'>('offline')
  const [isLoading, setIsLoading] = useState(true)
  const [isStartingOllama, setIsStartingOllama] = useState(false)

  // Vérifier le statut du système Docker Ollama
  const checkSystemStatus = async () => {
    try {
      const response = await fetch('/api/health')
      
      if (response.ok) {
        // Vérifier aussi le contenu de la réponse
        const data = await response.json()
        if (data.status === 'healthy' && data.service?.ollama?.healthy) {
          setSystemStatus('online')
        } else {
          setSystemStatus('offline')
        }
      } else {
        // Status 503 ou autre erreur HTTP
        setSystemStatus('offline')
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error)
      setSystemStatus('offline')
    } finally {
      setIsLoading(false)
    }
  }

  const startOllamaServer = async () => {
    setIsStartingOllama(true)
    try {
      console.log('Démarrage d\'Ollama...')
      
      // Lancer la commande Ollama serve dans le terminal
      const response = await fetch('/api/system/start-ollama', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        console.log('Ollama démarré avec succès:', data)
        
        // Attendre un peu plus puis vérifier le statut plusieurs fois
        setTimeout(() => {
          checkSystemStatus()
        }, 2000)
        
        setTimeout(() => {
          checkSystemStatus()
        }, 5000)
        
        setTimeout(() => {
          checkSystemStatus()
        }, 8000)
      } else {
        console.error('Erreur lors du démarrage:', data)
        alert(`Erreur: ${data.error}\n${data.suggestion || ''}`)
      }
    } catch (error) {
      console.error('Erreur lors du démarrage d\'Ollama:', error)
      alert('Erreur de connexion lors du démarrage d\'Ollama')
    } finally {
      setIsStartingOllama(false)
    }
  }

  useEffect(() => {
    checkSystemStatus()
    // Vérifier le statut toutes les 30 secondes
    const interval = setInterval(checkSystemStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: Brain,
      title: 'Analyse IA Clinique',
      description: 'Évaluation des cas cliniques ostéopathiques par les LLM',
      href: '/analyse',
      color: 'text-medical-600',
      bgColor: 'bg-medical-50',
    },
    {
      icon: Activity,
      title: 'Tests Orthopédiques',
      description: 'Analyse des tests orthopédiques et interprétations IA',
      href: '/tests-ortho',
      color: 'text-osteo-600',
      bgColor: 'bg-osteo-50',
    },
    {
      icon: BarChart3,
      title: 'Benchmarks & Résultats',
      description: 'Comparaison des performances des modèles IA',
      href: '/benchmark',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: FileText,
      title: 'Documentation Mémoire',
      description: 'Méthodologie et documentation académique',
      href: '/documentation',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ]

  return (
    <>
      {/* Status Dashboard */}
      {systemStatus === 'offline' ? (
        // Affichage du guide Docker quand le système est hors ligne
        <div className="mb-8">
          {/* Bouton de démarrage Ollama */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-yellow-600" />
                <div>
                  <h3 className="font-medium text-yellow-800">Serveur Ollama hors ligne</h3>
                  <p className="text-sm text-yellow-700">
                    Le serveur Ollama n'est pas démarré. Cliquez pour le lancer automatiquement.
                    {isLoading && <span className="ml-2 text-yellow-600">🔄 Vérification...</span>}
                  </p>
                </div>
              </div>
              <button
                onClick={startOllamaServer}
                disabled={isStartingOllama || isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white rounded-lg transition-colors"
              >
                {isStartingOllama ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Démarrage en cours...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Démarrer Ollama
                  </>
                )}
              </button>
            </div>
          </div>
          <OllamaSetupGuide />
        </div>
      ) : (
        <>
          <div className="mb-8">
            <ModelStatus />
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {features.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href as any}
                className="group p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${feature.bgColor} mb-4 group-hover:scale-105 transition-transform`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <QuickAnalysis />
            </div>
            <div>
              <RecentResults />
            </div>
          </div>
        </>
      )}
    </>
  )
}

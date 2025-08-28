'use client'

import { useState, useEffect } from 'react'
import { Brain, Activity, BarChart3, FileText } from 'lucide-react'
import Link from 'next/link'
import ModelStatus from '@/components/models/ModelStatus'
import QuickAnalysis from '@/components/ui/QuickAnalysis'
import RecentResults from '@/components/ui/RecentResults'
import OllamaSetupGuide from '@/components/guides/OllamaSetupGuide'

export default function HomePage() {
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline' | 'error'>('offline')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Vérifier le statut du système Docker Ollama
    const checkSystemStatus = async () => {
      try {
        const response = await fetch('/api/health')
        if (response.ok) {
          setSystemStatus('online')
        } else {
          setSystemStatus('error')
        }
      } catch (error) {
        setSystemStatus('offline')
      } finally {
        setIsLoading(false)
      }
    }

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

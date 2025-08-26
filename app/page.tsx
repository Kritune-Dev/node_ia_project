'use client'

import { useState, useEffect } from 'react'
import { Brain, Activity, Stethoscope, BarChart3, FileText } from 'lucide-react'
import Link from 'next/link'
import ModelStatus from '@/components/ModelStatus'
import QuickAnalysis from '@/components/QuickAnalysis'
import RecentResults from '@/components/RecentResults'
import DockerSetupGuide from '@/components/DockerSetupGuide'
import ServiceStatus from '@/components/ServiceStatus'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline' | 'error'>('offline')
  const [showServiceStatus, setShowServiceStatus] = useState(false)

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-medical-500 rounded-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">IA Médicale Ostéopathie</h1>
                <p className="text-sm text-gray-500">Plateforme d'analyse clinique</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowServiceStatus(true)}
                className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-all hover:scale-105 ${
                  systemStatus === 'online' 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : systemStatus === 'error'
                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                }`}
                title="Cliquez pour voir le détail des services"
              >
                <div className={`w-2 h-2 rounded-full ${
                  systemStatus === 'online' 
                    ? 'bg-green-500' 
                    : systemStatus === 'error'
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
                }`} />
                {systemStatus === 'online' && 'Système en ligne'}
                {systemStatus === 'error' && 'Erreur système'}
                {systemStatus === 'offline' && 'Hors ligne'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Évaluation des LLM en Ostéopathie
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Analyse et comparaison des modèles d'intelligence artificielle pour la prise en charge 
            des données cliniques ostéopathiques et l'interprétation des tests orthopédiques.
          </p>
          <div className="mt-6 text-sm text-gray-500">
            Mémoire de fin d'études • 11 modèles LLM • Données cliniques anonymisées
          </div>
        </div>

        {/* Status Dashboard */}
        {systemStatus === 'offline' ? (
          // Affichage du guide Docker quand le système est hors ligne
          <div className="mb-8">
            <DockerSetupGuide />
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
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2024 IA Médicale Ostéopathie • Mémoire de fin d'études</p>
            <p className="mt-1">
              Plateforme d'évaluation des LLM pour l'analyse clinique ostéopathique
            </p>
          </div>
        </div>
      </footer>

      {/* Service Status Modal */}
      <ServiceStatus 
        isVisible={showServiceStatus}
        onClose={() => setShowServiceStatus(false)}
      />
    </div>
  )
}

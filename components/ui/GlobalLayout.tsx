'use client'

import { useState, useEffect } from 'react'
import { Stethoscope } from 'lucide-react'
import Link from 'next/link'
import ServiceStatus from '../status/ServiceStatus'

interface GlobalLayoutProps {
  children: React.ReactNode
}

export default function GlobalLayout({ children }: GlobalLayoutProps) {
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline' | 'error'>('offline')
  const [showServiceStatus, setShowServiceStatus] = useState(false)
  const [modelsCount, setModelsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSystemStatus()
    loadModelsCount()
    // Vérifier le statut toutes les 30 secondes
    const interval = setInterval(() => {
      checkSystemStatus()
      loadModelsCount()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

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
      setLoading(false)
    }
  }

  const loadModelsCount = async () => {
    try {
      const response = await fetch('/api/models')
      if (response.ok) {
        const data = await response.json()
        setModelsCount(data.models?.all?.length || 0)
      }
    } catch (error) {
      console.error('Erreur lors du chargement du nombre de modèles:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="flex items-center justify-center w-10 h-10 bg-medical-500 rounded-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">IA Médicale Ostéopathie</h1>
                <p className="text-sm text-gray-500">Plateforme d'analyse clinique</p>
              </div>
            </Link>
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
                <span>
                  {systemStatus === 'online' && 'Système en ligne'}
                  {systemStatus === 'error' && 'Erreur système'}
                  {systemStatus === 'offline' && 'Hors ligne'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Évaluation des LLM en Ostéopathie
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              Analyse et comparaison des modèles d'intelligence artificielle pour la prise en charge 
              des données cliniques ostéopathiques et l'interprétation des tests orthopédiques.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <span>Mémoire de fin d'études</span>
              <span>•</span>
              <span>
                {loading ? (
                  'Chargement...'
                ) : (
                  `${modelsCount} modèles LLM disponibles`
                )}
              </span>
              <span>•</span>
              <span>Données cliniques anonymisées</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2024 - 2025 IA Médicale Ostéopathie • Mémoire de fin d'études</p>
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

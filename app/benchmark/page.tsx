'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import BenchmarkHeader from '../../components/benchmark/BenchmarkHeader'
import BenchmarkMain from '../../components/benchmark/BenchmarkMain'

export default function BenchmarkPage() {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)

  const handleRunStart = () => {
    setIsRunning(true)
    console.log('🚀 Benchmark démarré')
  }

  const handleRunComplete = (results: any) => {
    setIsRunning(false)
    console.log('🎉 Benchmark terminé:', results)
    
    // Redirection vers les résultats si disponibles
    if (results && results.length > 0) {
      // Attendre 2 secondes puis rediriger vers l'historique
      setTimeout(() => {
        router.push('/benchmark/history' as any)
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <BenchmarkHeader
        title="Benchmark des Modèles IA"
        subtitle="Évaluez et comparez les performances de vos modèles"
        currentPage="main"
      />

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <BenchmarkMain
          onRunStart={handleRunStart}
          onRunComplete={handleRunComplete}
        />
      </div>

      {/* Statut en bas */}
      {isRunning && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border p-4 flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-gray-700 font-medium">Tests en cours...</span>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { FileText, Calendar, CheckCircle, Clock } from 'lucide-react'

interface AnalysisResult {
  id: string
  type: 'clinical' | 'orthopedic' | 'general'
  title: string
  confidence: number
  model: string
  timestamp: string
  status: 'completed' | 'processing' | 'failed'
}

export default function RecentResults() {
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simuler le chargement des résultats récents
    // TODO: Remplacer par un appel API réel
    const fetchResults = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // Données simulées
        setResults([
          {
            id: '1',
            type: 'clinical',
            title: 'Analyse lombalgie chronique',
            confidence: 0.89,
            model: 'meditron:latest',
            timestamp: '2024-01-20T10:30:00Z',
            status: 'completed'
          },
          {
            id: '2',
            type: 'orthopedic',
            title: 'Test Lasègue positif',
            confidence: 0.94,
            model: 'medllama2:latest',
            timestamp: '2024-01-20T09:45:00Z',
            status: 'completed'
          },
          {
            id: '3',
            type: 'clinical',
            title: 'Cervicalgie post-traumatique',
            confidence: 0.76,
            model: 'phi3:mini',
            timestamp: '2024-01-20T08:15:00Z',
            status: 'completed'
          },
          {
            id: '4',
            type: 'orthopedic',
            title: 'Test Patrick en cours...',
            confidence: 0,
            model: 'biomistral:latest',
            timestamp: '2024-01-20T11:00:00Z',
            status: 'processing'
          }
        ])
      } catch (error) {
        console.error('Erreur lors du chargement des résultats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [])

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'clinical': return 'text-medical-600 bg-medical-50'
      case 'orthopedic': return 'text-osteo-600 bg-osteo-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'processing': return <Clock className="w-4 h-4 text-yellow-600 animate-pulse" />
      case 'failed': return <Clock className="w-4 h-4 text-red-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `Il y a ${diffInMinutes}min`
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`
    } else {
      return date.toLocaleDateString('fr-FR')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyses Récentes</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-600" />
          Analyses Récentes
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Historique des dernières analyses effectuées
        </p>
      </div>

      <div className="p-6">
        {results.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune analyse récente</p>
            <p className="text-sm text-gray-400 mt-1">
              Les résultats de vos analyses apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="flex items-center space-x-4 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(result.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(result.type)}`}>
                      {result.type === 'clinical' ? 'Clinique' : 
                       result.type === 'orthopedic' ? 'Orthopédique' : 'Général'}
                    </span>
                    {result.status === 'completed' && (
                      <span className={`text-xs font-medium ${getConfidenceColor(result.confidence)}`}>
                        {Math.round(result.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {result.title}
                  </p>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                    <span>{result.model}</span>
                    <span>•</span>
                    <span>{formatDate(result.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t">
              <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
                Voir toutes les analyses →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

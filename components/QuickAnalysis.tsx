'use client'

import { useState, useEffect } from 'react'
import { Send, Bot, User, Loader2 } from 'lucide-react'

interface AnalysisResult {
  analysis: string
  confidence: number
  recommendations: string[]
  model_used: string
  processing_time: number
}

export default function QuickAnalysis() {
  const [input, setInput] = useState('')
  const [analysisType, setAnalysisType] = useState<'clinical' | 'orthopedic' | 'general'>('clinical')
  const [selectedModel, setSelectedModel] = useState('meditron:latest')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [modelsLoading, setModelsLoading] = useState(true)

  // Récupérer les modèles disponibles au chargement
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/models')
        const data = await response.json()
        
        if (response.ok && data.status === 'connected') {
          setAvailableModels(data.models.installed || [])
          
          // Sélectionner automatiquement un modèle médical si disponible
          const medicalModels = data.models.medical?.filter((m: any) => m.installed) || []
          if (medicalModels.length > 0) {
            setSelectedModel(medicalModels[0].name)
          } else if (data.models.installed.length > 0) {
            setSelectedModel(data.models.installed[0].name)
          }
        } else {
          // En cas d'erreur Docker, afficher un message informatif
          setAvailableModels([])
          if (data.error) {
            setError(`Docker inaccessible: ${data.error}`)
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des modèles:', error)
        setAvailableModels([])
        setError('Impossible de charger les modèles - Vérifiez que Docker est démarré')
      } finally {
        setModelsLoading(false)
      }
    }

    fetchModels()
  }, [])

  const handleAnalysis = async () => {
    if (!input.trim()) return

    if (availableModels.length === 0) {
      setError('Aucun modèle disponible - Vérifiez que Docker Ollama est démarré')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: input,
          model: selectedModel,
          type: analysisType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error && data.error.includes('ECONNREFUSED')) {
          throw new Error('Docker Ollama non accessible - Vérifiez que les services sont démarrés')
        } else {
          throw new Error(data.error || `HTTP error! status: ${response.status}`)
        }
      }

      setResult(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'analyse'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Bot className="w-5 h-5 mr-2 text-medical-600" />
          Analyse Rapide IA
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Analysez vos cas cliniques et tests orthopédiques instantanément
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'analyse
            </label>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500"
            >
              <option value="clinical">Analyse Clinique</option>
              <option value="orthopedic">Test Orthopédique</option>
              <option value="general">Analyse Générale</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modèle IA
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={modelsLoading || availableModels.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {modelsLoading ? (
                <option value="">Chargement des modèles...</option>
              ) : availableModels.length === 0 ? (
                <option value="">Aucun modèle disponible</option>
              ) : (
                <>
                  {/* Modèles médicaux en premier */}
                  <optgroup label="Modèles Médicaux">
                    {availableModels
                      .filter(model => model.type === 'medical')
                      .map(model => (
                        <option key={model.name} value={model.name}>
                          {model.displayName} ({model.sizeFormatted})
                        </option>
                      ))}
                  </optgroup>
                  
                  {/* Modèles généraux */}
                  <optgroup label="Modèles Généraux">
                    {availableModels
                      .filter(model => model.type === 'general')
                      .map(model => (
                        <option key={model.name} value={model.name}>
                          {model.displayName} ({model.sizeFormatted})
                        </option>
                      ))}
                  </optgroup>
                </>
              )}
            </select>
            {!modelsLoading && availableModels.length === 0 && (
              <p className="text-xs text-red-600 mt-1">
                Aucun modèle installé. Veuillez installer des modèles via le panneau de statut.
              </p>
            )}
          </div>
        </div>

        {/* Zone de saisie */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Texte à analyser
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              analysisType === 'clinical' 
                ? "Décrivez le cas clinique : symptômes, antécédents, examen physique..."
                : analysisType === 'orthopedic'
                ? "Décrivez le test orthopédique réalisé et ses résultats..."
                : "Entrez votre texte à analyser..."
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-medical-500 h-32 resize-none"
          />
        </div>

        {/* Bouton d'analyse */}
        <button
          onClick={handleAnalysis}
          disabled={loading || !input.trim()}
          className="w-full flex items-center justify-center space-x-2 bg-medical-600 text-white px-4 py-2 rounded-md hover:bg-medical-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyse en cours...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Analyser</span>
            </>
          )}
        </button>

        {/* Erreur */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Résultats */}
        {result && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Résultat de l'analyse</h4>
              <div className="flex items-center space-x-4 text-sm">
                <span className={`px-2 py-1 rounded-full font-medium ${getConfidenceColor(result.confidence)}`}>
                  Confiance: {Math.round(result.confidence * 100)}%
                </span>
                <span className="text-gray-500">
                  {result.processing_time}ms
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Bot className="w-5 h-5 text-medical-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    {result.model_used}
                  </p>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{result.analysis}</p>
                  </div>
                </div>
              </div>
            </div>

            {result.recommendations.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Recommandations</h5>
                <ul className="space-y-1">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="text-medical-600 mr-2">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

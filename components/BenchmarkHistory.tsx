'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, TrendingUp, Eye, Trash2, Search, Filter, ChevronDown, ChevronRight, AlertCircle, CheckCircle, XCircle, Copy, ExternalLink, Star, MessageSquare, Edit, Save, X } from 'lucide-react'

// Fonction pour formater les temps de réponse (affiche en ms si < 1s, sinon en format minute:seconde)
const formatResponseTime = (milliseconds: number) => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`
  } else {
    const seconds = Math.round(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds === 0 ? `${minutes}min` : `${minutes}min ${remainingSeconds}s`
  }
}

interface BenchmarkHistoryProps {
  benchmarks: any[]
  onSelectBenchmark: (benchmark: any) => void
  onDataUpdate: () => void
}

interface TestDetailProps {
  test: any
  modelName: string
  questionId: string
  benchmarkId: string
  isExpanded: boolean
  onToggle: () => void
}

// Interface pour le composant ModelSummary
interface ModelSummaryProps {
  modelName: string
  modelData: any
  benchmarkId: string
  isExpanded: boolean
  onToggle: () => void
  globalComment: string
  onGlobalCommentChange: (comment: string) => void
  expandedTests: {[key: string]: boolean}
  onTestToggle: (benchmarkId: string, modelName: string, questionId: string) => void
}

function TestDetail({ test, modelName, questionId, benchmarkId, isExpanded, onToggle }: TestDetailProps) {
  const [rating, setRating] = useState(test.user_rating || 0)
  const [comment, setComment] = useState(test.user_comment || '')
  const [saving, setSaving] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const saveRating = async (newRating: number) => {
    setRating(newRating)
    setSaving(true)

    try {
      const response = await fetch('/api/benchmark/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          benchmarkId,
          modelName,
          questionId,
          rating: newRating,
          comment
        })
      })

      if (!response.ok) {
        // Revenir à l'ancienne valeur en cas d'erreur
        setRating(test.user_rating || 0)
      }
    } catch (error) {
      console.error('Erreur:', error)
      setRating(test.user_rating || 0)
    } finally {
      setSaving(false)
    }
  }

  const saveComment = async () => {
    setSaving(true)

    try {
      const response = await fetch('/api/benchmark/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          benchmarkId,
          modelName,
          questionId,
          rating,
          comment
        })
      })

      if (!response.ok) {
        setComment(test.user_comment || '')
      }
    } catch (error) {
      console.error('Erreur:', error)
      setComment(test.user_comment || '')
    } finally {
      setSaving(false)
    }
  }

  const getStatusIcon = () => {
    if (test.success) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    } else {
      return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const renderQuickRating = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => saveRating(star)}
            disabled={saving}
            className={`transition-all duration-200 hover:scale-110 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={`Noter ${star}/5`}
          >
            <Star className="w-4 h-4 fill-current" />
          </button>
        ))}
        {saving && (
          <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin ml-1" />
        )}
      </div>
    )
  }

  const getTestName = (questionId: string) => {
    switch (questionId) {
      case 'basic_1': return 'Test de fonctionnement de l\'IA'
      case 'basic_2': return 'Test de communication en français'
      case 'medical_1': return 'Symptômes hypertension artérielle'
      case 'medical_2': return 'Mécanisme inhibiteurs ECA'
      case 'medical_3': return 'Étapes de la glycolyse'
      case 'general_1': return 'Causes réchauffement climatique'
      case 'general_2': return 'Concept intelligence artificielle'
      case 'coding_1': return 'Fonction Fibonacci Python'
      case 'reasoning_1': return 'Test de raisonnement logique'
      default: return questionId
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic': return 'bg-green-100 text-green-800'
      case 'medical': return 'bg-blue-100 text-blue-800'
      case 'general': return 'bg-purple-100 text-purple-800'
      case 'coding': return 'bg-orange-100 text-orange-800'
      case 'reasoning': return 'bg-teal-100 text-teal-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`border rounded-lg transition-all ${test.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-opacity-80 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          {getStatusIcon()}
          <div className="text-left flex-1">
            <div className="font-medium text-gray-900">{getTestName(questionId)}</div>
            <div className="text-xs text-gray-500">{questionId}</div>
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(test.category)}`}>
                {test.category}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(test.difficulty)}`}>
                {test.difficulty}
              </span>
              <span>{formatResponseTime(test.responseTime)}</span>
              {test.tokensPerSecond > 0 && (
                <span>{test.tokensPerSecond.toFixed(1)} tok/s</span>
              )}
            </div>
          </div>
          
          {/* Notation rapide - visible uniquement si le test a réussi */}
          {test.success && (
            <div className="flex items-center gap-3 mr-4" onClick={(e) => e.stopPropagation()}>
              <div className="text-xs text-gray-500">Note:</div>
              {renderQuickRating()}
            </div>
          )}
        </div>
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Question */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Question posée :</h4>
            <div className="bg-white p-3 rounded border border-gray-200">
              <p className="text-gray-700">{test.question}</p>
              <button
                onClick={() => copyToClipboard(test.question)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Copier
              </button>
            </div>
          </div>

          {/* Réponse ou Erreur */}
          {test.success ? (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Réponse de l'IA :</h4>
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap">{test.response}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(test.response)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copier
                  </button>
                  <span className="text-xs text-gray-500">
                    {test.tokensGenerated} tokens générés
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Erreur rencontrée :
              </h4>
              <div className="bg-red-50 p-3 rounded border border-red-200 space-y-3">
                <div>
                  <div className="text-xs text-red-600 font-medium mb-1">Message d'erreur :</div>
                  <p className="text-red-700 font-mono text-sm">{test.error}</p>
                </div>
                
                {/* Informations de débogage */}
                <div className="border-t border-red-200 pt-3">
                  <div className="text-xs text-red-600 font-medium mb-2">Informations de débogage :</div>
                  <div className="space-y-2 text-xs">
                    <div className="bg-red-100 p-2 rounded">
                      <div className="font-medium">Modèle demandé :</div>
                      <div className="font-mono">{modelName}</div>
                    </div>
                    <div className="bg-red-100 p-2 rounded">
                      <div className="font-medium">Service utilisé :</div>
                      <div className="font-mono">{test.service_url || 'http://localhost:11434 (par défaut)'}</div>
                    </div>
                    <div className="bg-red-100 p-2 rounded">
                      <div className="font-medium">URL complète appelée :</div>
                      <div className="font-mono">{test.service_url || 'http://localhost:11434'}/api/generate</div>
                    </div>
                    <div className="bg-red-100 p-2 rounded">
                      <div className="font-medium">Suggestion :</div>
                      <div className="text-red-700">
                        Vérifiez que le modèle <strong>{modelName}</strong> est disponible sur le service Ollama
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => copyToClipboard(`Erreur: ${test.error}\nModèle: ${modelName}\nService: ${test.service_url || 'http://localhost:11434'}`)}
                  className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copier informations de débogage
                </button>
              </div>
            </div>
          )}

          {/* Métriques de performance */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Métriques de performance :</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded border border-gray-200 text-center">
                <div className="text-lg font-semibold text-gray-900">{formatResponseTime(test.responseTime)}</div>
                <div className="text-xs text-gray-500">Temps de réponse</div>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200 text-center">
                <div className="text-lg font-semibold text-gray-900">{test.tokensGenerated}</div>
                <div className="text-xs text-gray-500">Tokens générés</div>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200 text-center">
                <div className="text-lg font-semibold text-gray-900">{test.tokensPerSecond.toFixed(1)}</div>
                <div className="text-xs text-gray-500">Tokens/seconde</div>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200 text-center">
                <div className={`text-lg font-semibold ${test.success ? 'text-green-600' : 'text-red-600'}`}>
                  {test.success ? 'Succès' : 'Échec'}
                </div>
                <div className="text-xs text-gray-500">Statut</div>
              </div>
            </div>
          </div>

          {/* Évaluation utilisateur */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Commentaire (optionnel) :</h4>
            <div className="bg-white p-3 rounded border border-gray-200">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onBlur={saveComment}
                placeholder="Ajoutez votre commentaire sur cette réponse..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="text-xs text-gray-500 mt-1">
                Le commentaire est sauvegardé automatiquement
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Nouveau composant pour le résumé des modèles avec notation globale
function ModelSummary({ 
  modelName, 
  modelData, 
  benchmarkId, 
  isExpanded, 
  onToggle, 
  globalComment, 
  onGlobalCommentChange,
  expandedTests,
  onTestToggle
}: ModelSummaryProps) {
  const [isEditingComment, setIsEditingComment] = useState(false)
  const [tempComment, setTempComment] = useState(globalComment)

  const handleSaveComment = () => {
    onGlobalCommentChange(tempComment)
    setIsEditingComment(false)
  }

  const handleCancelEdit = () => {
    setTempComment(globalComment)
    setIsEditingComment(false)
  }

  // Calculer la note moyenne basée sur les notes individuelles des tests
  const calculateAverageRating = () => {
    const testRatings = Object.values(modelData.questions || {})
      .map((test: any) => test.user_rating)
      .filter((rating: any) => rating && rating > 0)
    
    if (testRatings.length === 0) return 0
    
    const sum = testRatings.reduce((acc: number, rating: number) => acc + rating, 0)
    return Math.round((sum / testRatings.length) * 10) / 10 // Arrondi à 1 décimale
  }

  const displayRating = calculateAverageRating()

  return (
    <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h5 className="font-semibold text-lg text-gray-900">{modelName}</h5>
              <div className={`px-3 py-1 text-sm font-medium rounded-full ${
                modelData.success_rate >= 80 ? 'bg-green-100 text-green-800' :
                modelData.success_rate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {Math.round(modelData.success_rate || 0)}% réussite
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-3">
              <div>
                <div className="text-gray-600">Temps moyen</div>
                <div className="font-medium">{((modelData.average_response_time || 0) / 1000).toFixed(1)}s</div>
              </div>
              <div>
                <div className="text-gray-600">Tokens/sec</div>
                <div className="font-medium">{(modelData.average_tokens_per_second || 0).toFixed(1)}</div>
              </div>
              <div>
                <div className="text-gray-600">Tests réussis</div>
                <div className="font-medium">
                  {Object.values(modelData.questions || {}).filter((test: any) => test.success).length}/{Object.keys(modelData.questions || {}).length}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Temps total</div>
                <div className="font-medium">{Math.round((modelData.total_response_time || 0) / 1000)}s</div>
              </div>
              <div>
                <div className="text-gray-600">Note moyenne</div>
                <div className="font-medium flex items-center gap-1">
                  {displayRating > 0 ? (
                    <>
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{displayRating}/5</span>
                    </>
                  ) : (
                    <span className="text-gray-400">Non noté</span>
                  )}
                </div>
              </div>
            </div>

            {/* Commentaire global */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Commentaire global :</div>
                <button
                  onClick={() => setIsEditingComment(!isEditingComment)}
                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                  title={isEditingComment ? "Annuler l'édition" : "Modifier le commentaire"}
                >
                  {isEditingComment ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                </button>
              </div>
              
              {isEditingComment ? (
                <div className="space-y-2">
                  <textarea
                    value={tempComment}
                    onChange={(e) => setTempComment(e.target.value)}
                    placeholder="Ajoutez votre commentaire global sur ce modèle..."
                    className="w-full p-2 text-sm border border-gray-300 rounded-md resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveComment}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Save className="w-3 h-3" />
                      Sauvegarder
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      <X className="w-3 h-3" />
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-700 bg-white p-3 rounded-md border border-gray-200 min-h-[60px]">
                  {globalComment || (
                    <span className="text-gray-400 italic">
                      Aucun commentaire global. Cliquez sur l'icône d'édition pour en ajouter un.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={onToggle}
              className="p-2 text-gray-600 hover:bg-white hover:bg-opacity-70 rounded-lg transition-colors"
              title={isExpanded ? "Masquer les tests détaillés" : "Voir les tests détaillés"}
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Tests détaillés (expandable) */}
      {isExpanded && (
        <div className="p-4 space-y-3 bg-white">
          <div className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Tests détaillés ({Object.keys(modelData.questions || {}).length} tests)
          </div>
          
          {Object.entries(modelData.questions || {}).map(([questionId, test]: [string, any]) => {
            const testKey = `${benchmarkId}-${modelName}-${questionId}`
            return (
              <TestDetail
                key={`${modelName}-${questionId}`}
                test={test}
                modelName={modelName}
                questionId={questionId}
                benchmarkId={benchmarkId}
                isExpanded={expandedTests[testKey] || false}
                onToggle={() => onTestToggle(benchmarkId, modelName, questionId)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function BenchmarkHistory({ benchmarks, onSelectBenchmark, onDataUpdate }: BenchmarkHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'models' | 'questions' | 'success_rate'>('date')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [expandedTests, setExpandedTests] = useState<{ [key: string]: boolean }>({})
  const [selectedBenchmark, setSelectedBenchmark] = useState<string | null>(null)
  const [expandedModels, setExpandedModels] = useState<{[key: string]: boolean}>({})
  const [globalComments, setGlobalComments] = useState<{[key: string]: string}>({})
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [tempComment, setTempComment] = useState('')

  // Charger les commentaires globaux depuis localStorage
  useEffect(() => {
    const savedComments = localStorage.getItem('globalModelComments')
    
    if (savedComments) {
      try {
        setGlobalComments(JSON.parse(savedComments))
      } catch (e) {
        console.error('Erreur lors du chargement des commentaires globaux:', e)
      }
    }
  }, [])

  // Sauvegarder les commentaires globaux
  const saveGlobalComment = (modelKey: string, comment: string) => {
    const newComments = { ...globalComments, [modelKey]: comment }
    setGlobalComments(newComments)
    localStorage.setItem('globalModelComments', JSON.stringify(newComments))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const toggleTestExpansion = (benchmarkId: string, modelName: string, questionId: string) => {
    const key = `${benchmarkId}-${modelName}-${questionId}`
    setExpandedTests(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const toggleModelExpansion = (benchmarkId: string, modelName: string) => {
    const key = `${benchmarkId}-${modelName}`
    setExpandedModels(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const toggleBenchmarkExpansion = (benchmarkId: string) => {
    setSelectedBenchmark(prev => prev === benchmarkId ? null : benchmarkId)
  }

  const getSuccessRate = (benchmark: any) => {
    if (!benchmark.summary) return 0
    const total = benchmark.summary.total_tests || 0
    const successful = benchmark.summary.successful_tests || 0
    return total > 0 ? Math.round((successful / total) * 100) : 0
  }

  const getTopModel = (benchmark: any): { name: string; score: number } | null => {
    if (!benchmark.results) return null
    
    let bestModel: { name: string; score: number } | null = null
    let bestScore = -1
    
    Object.entries(benchmark.results).forEach(([modelName, data]: [string, any]) => {
      const score = data.success_rate || 0
      if (score > bestScore) {
        bestScore = score
        bestModel = { name: modelName, score }
      }
    })
    
    return bestModel
  }

  const deleteBenchmark = async (benchmarkId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce benchmark ?')) {
      return
    }

    try {
      const response = await fetch('/api/benchmark/history', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ benchmarkId })
      })

      if (response.ok) {
        onDataUpdate()
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const filteredBenchmarks = benchmarks
    .filter(benchmark => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          benchmark.benchmark_id?.toLowerCase().includes(searchLower) ||
          Object.keys(benchmark.results || {}).some(model => 
            model.toLowerCase().includes(searchLower)
          )
        )
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        case 'models':
          return (b.models_tested || 0) - (a.models_tested || 0)
        case 'questions':
          return (b.questions_tested || 0) - (a.questions_tested || 0)
        case 'success_rate':
          return getSuccessRate(b) - getSuccessRate(a)
        default:
          return 0
      }
    })

  if (benchmarks.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun benchmark trouvé</h3>
        <p className="text-gray-600">Lancez votre premier benchmark pour commencer à collecter des données.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par ID de benchmark ou modèle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Trier par date</option>
              <option value="models">Trier par nb. modèles</option>
              <option value="questions">Trier par nb. questions</option>
              <option value="success_rate">Trier par taux de réussite</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des benchmarks */}
      <div className="space-y-4">
        {filteredBenchmarks.map((benchmark) => {
          const successRate = getSuccessRate(benchmark)
          const topModel = getTopModel(benchmark)
          const totalDuration = Object.values(benchmark.results || {}).reduce(
            (sum: number, model: any) => sum + (model.total_response_time || 0), 0
          )

          return (
            <div
              key={benchmark.id || benchmark.benchmark_id}
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">
                      Benchmark {benchmark.benchmark_id || benchmark.id}
                    </h3>
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                      successRate >= 80 ? 'bg-green-100 text-green-800' :
                      successRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {successRate}% réussite
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(benchmark.timestamp)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(totalDuration)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Modèles testés</div>
                      <div className="font-medium">{benchmark.models_tested || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Questions</div>
                      <div className="font-medium">{benchmark.questions_tested || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Tests total</div>
                      <div className="font-medium">{benchmark.summary?.total_tests || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Meilleur modèle</div>
                      <div className="font-medium text-blue-600">
                        {topModel ? `${topModel.name} (${topModel.score}%)` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleBenchmarkExpansion(benchmark.id || benchmark.benchmark_id)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Voir les détails des tests"
                  >
                    {selectedBenchmark === (benchmark.id || benchmark.benchmark_id) ? 
                      <ChevronDown className="w-4 h-4" /> : 
                      <ChevronRight className="w-4 h-4" />
                    }
                  </button>
                  <button
                    onClick={() => onSelectBenchmark(benchmark)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Voir dans l'analyseur"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteBenchmark(benchmark.id || benchmark.benchmark_id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modèles testés */}
              <div>
                <div className="text-sm text-gray-500 mb-2">Modèles testés:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(benchmark.results || {}).map((modelName) => (
                    <span
                      key={modelName}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                    >
                      {modelName}
                    </span>
                  ))}
                </div>
              </div>

              {/* Détails des tests (expandable) */}
              {selectedBenchmark === (benchmark.id || benchmark.benchmark_id) && (
                <div className="mt-6 space-y-4">
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Détails des tests par modèle
                    </h4>
                    
                    {Object.entries(benchmark.results || {}).map(([modelName, modelData]: [string, any]) => {
                      const modelKey = `${benchmark.id || benchmark.benchmark_id}-${modelName}`
                      return (
                        <ModelSummary
                          key={modelName}
                          modelName={modelName}
                          modelData={modelData}
                          benchmarkId={benchmark.id || benchmark.benchmark_id}
                          isExpanded={expandedModels[modelKey] || false}
                          onToggle={() => toggleModelExpansion(benchmark.id || benchmark.benchmark_id, modelName)}
                          globalComment={globalComments[modelName] || ''}
                          onGlobalCommentChange={(comment) => saveGlobalComment(modelName, comment)}
                          expandedTests={expandedTests}
                          onTestToggle={toggleTestExpansion}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredBenchmarks.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucun benchmark ne correspond à votre recherche.</p>
        </div>
      )}
    </div>
  )
}

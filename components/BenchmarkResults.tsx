'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Star, MessageCircle, Save, Clock, Zap, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'

interface BenchmarkResultsProps {
  benchmark: any
  onBack: () => void
  onDataUpdate: () => void
}

export default function BenchmarkResults({ benchmark, onBack, onDataUpdate }: BenchmarkResultsProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [ratings, setRatings] = useState<{ [key: string]: number }>({})
  const [comments, setComments] = useState<{ [key: string]: string }>({})
  const [saving, setSaving] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (benchmark) {
      loadExistingRatings()
    }
  }, [benchmark])

  const loadExistingRatings = () => {
    if (!benchmark?.results) return

    const existingRatings: { [key: string]: number } = {}
    const existingComments: { [key: string]: string } = {}

    Object.entries(benchmark.results).forEach(([modelName, data]: [string, any]) => {
      Object.entries(data.questions || {}).forEach(([questionId, questionData]: [string, any]) => {
        const key = `${modelName}-${questionId}`
        if (questionData.user_rating) {
          existingRatings[key] = questionData.user_rating
        }
        if (questionData.user_comment) {
          existingComments[key] = questionData.user_comment
        }
      })
    })

    setRatings(existingRatings)
    setComments(existingComments)
  }

  const toggleQuestionExpanded = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const updateRating = (modelName: string, questionId: string, rating: number) => {
    const key = `${modelName}-${questionId}`
    setRatings(prev => ({ ...prev, [key]: rating }))
  }

  const updateComment = (modelName: string, questionId: string, comment: string) => {
    const key = `${modelName}-${questionId}`
    setComments(prev => ({ ...prev, [key]: comment }))
  }

  const saveRatingAndComment = async (modelName: string, questionId: string) => {
    const key = `${modelName}-${questionId}`
    const rating = ratings[key]
    const comment = comments[key]

    setSaving(prev => new Set(prev).add(key))

    try {
      const response = await fetch('/api/benchmark/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          benchmarkId: benchmark.id || benchmark.benchmark_id,
          modelName,
          questionId,
          rating,
          comment
        })
      })

      if (response.ok) {
        onDataUpdate()
      } else {
        alert('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(prev => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
    }
  }

  const renderStarRating = (modelName: string, questionId: string, currentRating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => updateRating(modelName, questionId, star)}
            className={`transition-colors ${
              star <= currentRating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
            }`}
          >
            <Star className="w-4 h-4 fill-current" />
          </button>
        ))}
        <span className="text-sm text-gray-600 ml-2">
          {currentRating > 0 ? `${currentRating}/5` : 'Non noté'}
        </span>
      </div>
    )
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

  const getSuccessRate = (modelData: any) => {
    const questions = Object.values(modelData.questions || {})
    const successful = questions.filter((q: any) => q.success).length
    return questions.length > 0 ? Math.round((successful / questions.length) * 100) : 0
  }

  if (!benchmark) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Sélectionnez un benchmark pour voir les résultats détaillés.</p>
      </div>
    )
  }

  const allQuestions = new Set<string>()
  Object.values(benchmark.results || {}).forEach((modelData: any) => {
    Object.keys(modelData.questions || {}).forEach(questionId => {
      allQuestions.add(questionId)
    })
  })

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'historique
          </button>
          <div className="text-sm text-gray-500">
            {formatDate(benchmark.timestamp)}
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-4">
          Résultats du Benchmark {benchmark.benchmark_id || benchmark.id}
        </h1>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{benchmark.models_tested || 0}</div>
            <div className="text-sm text-blue-600">Modèles testés</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{benchmark.questions_tested || 0}</div>
            <div className="text-sm text-green-600">Questions posées</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{benchmark.summary?.successful_tests || 0}</div>
            <div className="text-sm text-purple-600">Tests réussis</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(benchmark.summary?.average_response_time || 0)}ms
            </div>
            <div className="text-sm text-orange-600">Temps moyen</div>
          </div>
        </div>
      </div>

      {/* Résultats par modèle */}
      <div className="space-y-4">
        {Object.entries(benchmark.results || {}).map(([modelName, modelData]: [string, any]) => (
          <div key={modelName} className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{modelName}</h2>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Taux de réussite: <span className="font-medium">{getSuccessRate(modelData)}%</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Temps moyen: <span className="font-medium">{Math.round(modelData.average_response_time || 0)}ms</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Vitesse: <span className="font-medium">{Math.round(modelData.average_tokens_per_second || 0)} t/s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Questions pour ce modèle */}
            <div className="divide-y">
              {Object.entries(modelData.questions || {}).map(([questionId, questionData]: [string, any]) => {
                const isExpanded = expandedQuestions.has(questionId)
                const ratingKey = `${modelName}-${questionId}`
                const currentRating = ratings[ratingKey] || 0
                const currentComment = comments[ratingKey] || ''
                const isSaving = saving.has(ratingKey)

                return (
                  <div key={questionId} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{questionData.question}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            questionData.category === 'medical' ? 'bg-blue-100 text-blue-800' :
                            questionData.category === 'general' ? 'bg-purple-100 text-purple-800' :
                            questionData.category === 'coding' ? 'bg-orange-100 text-orange-800' :
                            'bg-teal-100 text-teal-800'
                          }`}>
                            {questionData.category}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            questionData.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            questionData.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {questionData.difficulty}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            {questionData.success ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span>{questionData.success ? 'Succès' : 'Échec'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{questionData.responseTime || 0}ms</span>
                          </div>
                          {questionData.tokensPerSecond > 0 && (
                            <div className="flex items-center gap-1">
                              <Zap className="w-4 h-4" />
                              <span>{Math.round(questionData.tokensPerSecond)} t/s</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleQuestionExpanded(questionId)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Réponse et évaluation */}
                    {isExpanded && (
                      <div className="space-y-4 pt-4 border-t">
                        {/* Réponse du modèle */}
                        {questionData.response && (
                          <div>
                            <h5 className="font-medium text-sm mb-2">Réponse du modèle:</h5>
                            <div className="bg-gray-50 p-3 rounded-lg text-sm">
                              {questionData.error ? (
                                <div className="text-red-600">{questionData.error}</div>
                              ) : (
                                <div className="whitespace-pre-wrap">{questionData.response}</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Système de notation */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h5 className="font-medium text-sm mb-3">Évaluation de la réponse</h5>
                          
                          <div className="space-y-3">
                            {/* Note étoilée */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Qualité de la réponse
                              </label>
                              {renderStarRating(modelName, questionId, currentRating)}
                            </div>

                            {/* Commentaire */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Commentaire
                              </label>
                              <textarea
                                value={currentComment}
                                onChange={(e) => updateComment(modelName, questionId, e.target.value)}
                                placeholder="Ajoutez votre commentaire sur la qualité de cette réponse..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                              />
                            </div>

                            {/* Bouton de sauvegarde */}
                            <button
                              onClick={() => saveRatingAndComment(modelName, questionId)}
                              disabled={isSaving}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                              {isSaving ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Sauvegarde...
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4" />
                                  Sauvegarder l'évaluation
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

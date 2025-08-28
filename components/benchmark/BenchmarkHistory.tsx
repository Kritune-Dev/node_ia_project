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

// Fonction pour mapper les questions selon le type de test et l'index
const getQuestionByTestTypeAndIndex = (testType: string, index: number): string => {
  const questionsByType: { [key: string]: string[] } = {
    'smoke': [
      'What is 2 + 2?',
      'Name three colors.',
      'Write a simple greeting.'
    ],
    'api_io': [
      'Test de charge avec 5 requêtes simultanées',
      'Mesure de la latence sous stress',
      'Évaluation de la stabilité des réponses',
      'Test de débit (throughput)',
      'Vérification de la cohérence des sorties'
    ],
    'qualitative': [
      'Questions de raisonnement complexe',
      'Tâches créatives et narratives',
      'Analyse et synthèse d\'informations',
      'Résolution de problèmes éthiques',
      'Évaluation de la cohérence logique'
    ],
    'stability': [
      'Répétition de la même question 5 fois',
      'Mesure de la variance des réponses',
      'Calcul du score de cohérence',
      'Détection des incohérences',
      'Évaluation de la stabilité temporelle'
    ],
    'parameter': [
      'Test avec température basse (0.1-0.3)',
      'Test avec température moyenne (0.4-0.7)',
      'Test avec température élevée (0.8-1.0)',
      'Comparaison des variations de seed',
      'Analyse de l\'impact des paramètres'
    ],
    'prompt_alternative': [
      'Formulation directe de la question',
      'Formulation polie et formelle',
      'Formulation concise et technique',
      'Formulation avec contexte ajouté',
      'Formulation inversée ou négative'
    ],
    'real_data': [
      'Analyse de documents PDF réels',
      'Traitement de code source complexe',
      'Extraction d\'informations de datasets',
      'Résumé d\'articles scientifiques',
      'Interprétation de données financières'
    ]
  };

  const questions = questionsByType[testType] || ['Question de test générique'];
  const questionIndex = index % questions.length;
  return questions[questionIndex];
};

// Fonction pour adapter le nouveau format modulaire vers l'ancien format pour l'affichage
const adaptModularBenchmarkForDisplay = (benchmark: any) => {
  if (!benchmark.results || !Array.isArray(benchmark.results)) {
    return benchmark; // Retourner tel quel si ce n'est pas le nouveau format
  }

  const adaptedResults: { [modelName: string]: any } = {};
  const modelStats: { [modelName: string]: { 
    successCount: number, 
    totalCount: number, 
    totalTime: number, 
    totalTokens: number,
    questions: { [questionId: string]: any }
  } } = {};

  // Noms de tests plus descriptifs basés sur le type de test
  const getTestName = (testType: string, questionId: string) => {
    const testTypeNames: { [key: string]: string } = {
      'smoke': 'Test Smoke - Validation fonctionnelle',
      'api_io': 'Test API/IO - Performance',
      'qualitative': 'Test Qualitatif - Évaluation de contenu',
      'stability': 'Test Stabilité - Cohérence',
      'parameter': 'Test Paramètres - Optimisation',
      'prompt_alternative': 'Test Alternatives - Robustesse',
      'real_data': 'Test Données Réelles - Contexte complexe'
    };
    return testTypeNames[testType] || `Test ${testType}`;
  };

  // Organiser les résultats par modèle et par série de tests
  const modelTestSeries: { [modelName: string]: { [testType: string]: any[] } } = {};
  
  benchmark.results.forEach((result: any, index: number) => {
    const modelName = result.modelName;
    const testType = result.testType;
    const questionId = result.questionId;
    
    if (!modelStats[modelName]) {
      modelStats[modelName] = {
        successCount: 0,
        totalCount: 0,
        totalTime: 0,
        totalTokens: 0,
        questions: {}
      };
    }

    if (!modelTestSeries[modelName]) {
      modelTestSeries[modelName] = {};
    }

    if (!modelTestSeries[modelName][testType]) {
      modelTestSeries[modelName][testType] = [];
    }

    const stats = modelStats[modelName];
    stats.totalCount++;
    
    const isSuccess = result.overallScore > 0 && !result.response?.response?.includes('ERROR');
    if (isSuccess) {
      stats.successCount++;
    }

    const responseTime = result.response?.responseTime || 0;
    stats.totalTime += responseTime;

    // Estimer les tokens générés (approximation basée sur la longueur de la réponse)
    const responseText = result.response?.response || '';
    const estimatedTokens = Math.max(1, Math.floor(responseText.length / 4));
    stats.totalTokens += estimatedTokens;

    // Récupérer la vraie question depuis les données du benchmark ou par mapping
    let actualQuestion = 'Question non disponible';
    
    // Essayer d'abord de trouver dans les données du benchmark
    if (benchmark.suite && benchmark.suite.questions) {
      const foundQuestion = benchmark.suite.questions.find((q: any) => q.id === questionId);
      if (foundQuestion) {
        actualQuestion = foundQuestion.text;
      }
    } else {
      // Mapping basé sur le type de test et l'index dans cette série
      const seriesIndex = modelTestSeries[modelName][testType].length;
      actualQuestion = getQuestionByTestTypeAndIndex(result.testType, seriesIndex);
    }
    
    // Créer l'objet test adapté avec la vraie question
    const adaptedTest = {
      question: actualQuestion, // Utiliser la vraie question
      testType: getTestName(result.testType, questionId), // Type de série de tests
      response: result.response?.response || '',
      responseTime: responseTime,
      tokensGenerated: estimatedTokens,
      tokensPerSecond: responseTime > 0 ? (estimatedTokens / (responseTime / 1000)) : 0,
      success: isSuccess,
      error: isSuccess ? null : (result.response?.response || 'Erreur inconnue'),
      category: result.testType || 'unknown',
      difficulty: 'medium',
      user_rating: 0,
      user_comment: '',
      overallScore: result.overallScore || 0,
      questionId: questionId
    };

    // Ajouter à la série de tests
    modelTestSeries[modelName][testType].push(adaptedTest);
    
    // Maintenir aussi l'ancien format pour compatibilité
    stats.questions[`test_${index}_${questionId.substring(0, 8)}`] = adaptedTest;
  });

  // Créer la structure adaptée
  Object.entries(modelStats).forEach(([modelName, stats]) => {
    const avgTokensPerSecond = stats.totalTime > 0 ? (stats.totalTokens / (stats.totalTime / 1000)) : 0;
    
    adaptedResults[modelName] = {
      success_rate: stats.totalCount > 0 ? (stats.successCount / stats.totalCount) * 100 : 0,
      average_response_time: stats.totalCount > 0 ? stats.totalTime / stats.totalCount : 0,
      average_tokens_per_second: avgTokensPerSecond,
      total_response_time: stats.totalTime,
      questions: stats.questions
    };
  });

  return {
    ...benchmark,
    results: adaptedResults,
    testSeries: modelTestSeries, // Ajouter les données regroupées par série
    models_tested: Object.keys(adaptedResults).length,
    questions_tested: benchmark.summary?.totalTests || 0,
    // S'assurer que nous avons les champs summary nécessaires
    summary: {
      ...benchmark.summary,
      total_tests: benchmark.summary?.totalTests || 0,
      successful_tests: benchmark.summary?.completedTests || 0
    }
  };
};

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
  expandedTests: {[key: string]: boolean}
  onTestToggle: (benchmarkId: string, modelName: string, questionId: string) => void
  testSeries?: { [testType: string]: any[] }
}

// Interface pour une série de tests
interface TestSeriesProps {
  testType: string
  tests: any[]
  modelName: string
  benchmarkId: string
  isExpanded: boolean
  onToggle: () => void
  expandedTests: {[key: string]: boolean}
  onTestToggle: (benchmarkId: string, modelName: string, questionId: string) => void
}

// Composant pour afficher une série de tests regroupée
function TestSeries({ testType, tests, modelName, benchmarkId, isExpanded, onToggle, expandedTests, onTestToggle }: TestSeriesProps) {
  const getTestTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'smoke': '⚡',
      'api_io': '📊',
      'qualitative': '🎯',
      'stability': '🔒',
      'parameter': '⚙️',
      'prompt_alternative': '🔄',
      'real_data': '📄'
    };
    return icons[type] || '🔧';
  };

  const getTestTypeName = (type: string) => {
    const names: { [key: string]: string } = {
      'smoke': 'Série Smoke Tests',
      'api_io': 'Série Tests API/IO',
      'qualitative': 'Série Tests Qualitatifs',
      'stability': 'Série Tests de Stabilité',
      'parameter': 'Série Tests de Paramètres',
      'prompt_alternative': 'Série Tests d\'Alternatives',
      'real_data': 'Série Tests Données Réelles'
    };
    return names[type] || `Série ${type}`;
  };

  // Calculer les métriques de la série
  const successCount = tests.filter(test => test.success).length;
  const successRate = tests.length > 0 ? (successCount / tests.length) * 100 : 0;
  const totalTime = tests.reduce((sum, test) => sum + test.responseTime, 0);
  const avgScore = tests.length > 0 ? tests.reduce((sum, test) => sum + (test.overallScore || 0), 0) / tests.length : 0;

  return (
    <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">{getTestTypeIcon(testType)}</span>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900">{getTestTypeName(testType)}</h4>
              <div className="text-sm text-gray-600">
                {tests.length} question{tests.length > 1 ? 's' : ''} • 
                {successCount}/{tests.length} réussite{successCount > 1 ? 's' : ''} • 
                Score moyen: {avgScore.toFixed(1)}/10
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 text-sm font-medium rounded-full ${
              successRate >= 80 ? 'bg-green-100 text-green-800' :
              successRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {Math.round(successRate)}%
            </div>
            <div className="text-sm text-gray-500">
              {formatResponseTime(totalTime)}
            </div>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 bg-white space-y-3">
          {tests.map((test, index) => {
            const testKey = `${benchmarkId}-${modelName}-${test.questionId}`
            return (
              <TestDetail
                key={`${testType}-${index}`}
                test={test}
                modelName={modelName}
                questionId={test.questionId}
                benchmarkId={benchmarkId}
                isExpanded={expandedTests[testKey] || false}
                onToggle={() => onTestToggle(benchmarkId, modelName, test.questionId)}
              />
            )
          })}
        </div>
      )}
    </div>
  );
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
    // Pour l'affichage de l'historique, on garde les noms génériques
    // car la vraie question est maintenant dans test.question
    if (questionId.includes('test_')) {
      return questionId; // Utiliser l'ID du test directement
    }
    
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
            <div className="font-medium text-gray-900">{test.testType || getTestName(questionId)}</div>
            <div className="text-sm text-blue-600 mt-1">{test.question}</div>
            <div className="text-xs text-gray-500">{questionId}</div>
            <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
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
              {test.overallScore && (
                <span className="text-purple-600 font-medium">Score: {test.overallScore}/10</span>
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
  expandedTests,
  onTestToggle,
  testSeries
}: ModelSummaryProps) {
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
          {testSeries ? (
            // Affichage par séries de tests regroupées
            <>
              <div className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Séries de tests ({Object.keys(testSeries).length} série{Object.keys(testSeries).length > 1 ? 's' : ''})
              </div>
              
              {Object.entries(testSeries).map(([testType, tests]: [string, any[]]) => {
                const seriesKey = `${benchmarkId}-${modelName}-${testType}`
                return (
                  <TestSeries
                    key={testType}
                    testType={testType}
                    tests={tests}
                    modelName={modelName}
                    benchmarkId={benchmarkId}
                    isExpanded={expandedTests[seriesKey] || false}
                    onToggle={() => onTestToggle(benchmarkId, modelName, testType)}
                    expandedTests={expandedTests}
                    onTestToggle={onTestToggle}
                  />
                )
              })}
            </>
          ) : (
            // Affichage classique pour l'ancien format
            <>
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
            </>
          )}
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

  const formatDate = (dateString: string) => {
    try {
      // Gestion des différents formats de date
      let date: Date;
      
      if (dateString.includes('T') || dateString.includes('Z')) {
        // Format ISO (2025-08-27T12:59:23.138Z)
        date = new Date(dateString);
      } else {
        // Autres formats
        date = new Date(dateString);
      }
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Erreur lors du formatage de la date:', dateString, error);
      return 'Date invalide';
    }
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

  const getFastestModel = (benchmark: any): { name: string; time: number } | null => {
    if (!benchmark.results) return null
    
    let fastestModel: { name: string; time: number } | null = null
    let bestTime = Infinity
    
    Object.entries(benchmark.results).forEach(([modelName, data]: [string, any]) => {
      const avgTime = data.average_response_time || Infinity
      if (avgTime < bestTime) {
        bestTime = avgTime
        fastestModel = { name: modelName, time: avgTime }
      }
    })
    
    return fastestModel
  }

  const getTestSeriesInfo = (benchmark: any): { uniqueSeries: string[], totalSeries: number } => {
    const allSeries = new Set<string>()
    
    // Si on a les données testSeries (nouveau format)
    if (benchmark.testSeries) {
      Object.values(benchmark.testSeries).forEach((modelSeries: any) => {
        Object.keys(modelSeries).forEach(testType => {
          allSeries.add(testType)
        })
      })
    } else if (benchmark.results) {
      // Sinon essayer d'extraire des résultats
      Object.values(benchmark.results).forEach((modelData: any) => {
        if (modelData.questions) {
          Object.values(modelData.questions).forEach((test: any) => {
            if (test.category) {
              allSeries.add(test.category)
            }
          })
        }
      })
    }
    
    return {
      uniqueSeries: Array.from(allSeries),
      totalSeries: allSeries.size
    }
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

  const cleanupEmptyBenchmarks = async () => {
    const emptyBenchmarks = benchmarks.filter(b => 
      !b.models_tested || b.models_tested === 0 || 
      !b.results || Object.keys(b.results).length === 0
    )
    
    if (emptyBenchmarks.length === 0) {
      alert('Aucun benchmark vide trouvé.')
      return
    }
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${emptyBenchmarks.length} benchmark(s) vide(s) ?`)) {
      return
    }

    try {
      for (const benchmark of emptyBenchmarks) {
        await fetch('/api/benchmark/history', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ benchmarkId: benchmark.id || benchmark.benchmark_id })
        })
      }
      
      onDataUpdate()
      alert(`${emptyBenchmarks.length} benchmark(s) vide(s) supprimé(s).`)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors du nettoyage des benchmarks vides')
    }
  }

  const filteredBenchmarks = benchmarks
    .map(benchmark => adaptModularBenchmarkForDisplay(benchmark)) // Adapter le format
    .filter(benchmark => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          benchmark.benchmark_id?.toLowerCase().includes(searchLower) ||
          benchmark.id?.toLowerCase().includes(searchLower) ||
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
            
            <button
              onClick={cleanupEmptyBenchmarks}
              className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
              title="Supprimer les benchmarks vides"
            >
              <Trash2 className="w-4 h-4" />
              Nettoyer
            </button>
          </div>
        </div>
      </div>

      {/* Liste des benchmarks */}
      <div className="space-y-4">
        {filteredBenchmarks.map((benchmark) => {
          const successRate = getSuccessRate(benchmark)
          const fastestModel = getFastestModel(benchmark)
          const testSeriesInfo = getTestSeriesInfo(benchmark)
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
                      <div className="text-gray-500">Séries de tests</div>
                      <div className="font-medium">{testSeriesInfo.totalSeries}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Tests total</div>
                      <div className="font-medium">{benchmark.summary?.total_tests || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Modèle le plus rapide</div>
                      <div className="font-medium text-blue-600">
                        {fastestModel ? `${fastestModel.name} (${(fastestModel.time / 1000).toFixed(1)}s)` : 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Affichage des séries de tests lancées */}
                  {testSeriesInfo.uniqueSeries.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm text-gray-500 mb-2">Séries de tests lancées:</div>
                      <div className="flex flex-wrap gap-2">
                        {testSeriesInfo.uniqueSeries.map((series) => {
                          const getSeriesDisplayName = (type: string) => {
                            const names: { [key: string]: string } = {
                              'smoke': '⚡ Smoke',
                              'api_io': '📊 API/IO',
                              'qualitative': '🎯 Qualitatif',
                              'stability': '🔒 Stabilité',
                              'parameter': '⚙️ Paramètres',
                              'prompt_alternative': '🔄 Alternatives',
                              'real_data': '📄 Données réelles',
                              'basic': '✅ Basique',
                              'medical': '🏥 Médical',
                              'general': '🌐 Général',
                              'coding': '💻 Code',
                              'reasoning': '🧠 Raisonnement'
                            };
                            return names[type] || `🔧 ${type}`;
                          };
                          
                          return (
                            <span
                              key={series}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                            >
                              {getSeriesDisplayName(series)}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Afficher un avertissement si le benchmark semble vide */}
                  {(!benchmark.models_tested || benchmark.models_tested === 0) && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Ce benchmark semble ne contenir aucun résultat de test.</span>
                      </div>
                    </div>
                  )}
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
                          expandedTests={expandedTests}
                          onTestToggle={toggleTestExpansion}
                          testSeries={benchmark.testSeries ? benchmark.testSeries[modelName] : undefined}
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

'use client'

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, Clock, Target, Award, TrendingUp, ExternalLink, XCircle, Filter, ChevronDown, ChevronUp, Hash, Users, FlaskConical, Info } from 'lucide-react';
import { useBenchmarkDetails } from '../../../../hooks/useApi';
import BenchmarkHeader from '../../../../components/benchmark/BenchmarkHeader';

interface ModelResult {
  model_name: string
  service_url: string
  total_response_time: number
  average_response_time: number
  total_tokens_per_second: number
  average_tokens_per_second: number
  success_rate: number
  questions: {
    [questionId: string]: QuestionResult
  }
}

interface QuestionResult {
  question: string
  category: string
  difficulty: string
  success: boolean
  response: string
  responseTime: number
  tokensPerSecond: number
  model: string
  isTimeout: boolean
  series?: string
  seriesId?: string
}
interface BenchmarkResult {
  id: string
  displayName: string
  testSeries: string
  timestamp: string
  startTime: number
  summary: {
    total_tests: number
    successful_tests: number
    failed_tests: number
    total_models: number
    average_response_time: number
    average_tokens_per_second: number
    total_duration: number
    categories_tested: string[]
    models_tested: string[]
  }
  results: {
    [modelName: string]: {
      model_name: string
      service_url: string
      total_response_time: number
      average_response_time: number
      total_tokens_per_second: number
      average_tokens_per_second: number
      success_rate: number
      questions: {
        [questionId: string]: QuestionResult
      }
    }
  }
}

export default function BenchmarkResultsPage() {
  const params = useParams();
  const benchmarkId = params.id as string;
  const { benchmark, isLoading, error } = useBenchmarkDetails(benchmarkId);
  
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const [expandedModelSeries, setExpandedModelSeries] = useState<Set<string>>(new Set());
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set());
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'success_rate' | 'response_time' | 'tokens_per_second'>('success_rate');
  const [activeSection, setActiveSection] = useState<string>('overview');

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    if (score >= 30) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getModelDisplayName = (modelName: string) => {
    // Extraire le nom du modèle de façon dynamique
    if (modelName.includes('/')) {
      // Pour les modèles avec namespace comme "PRFD/croissant-llm:latest"
      const parts = modelName.split('/');
      const modelPart = parts[parts.length - 1];
      return modelPart.split(':')[0].split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    
    if (modelName.includes(':')) {
      // Pour les modèles avec version comme "gemma3:1b"
      const [name, version] = modelName.split(':');
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
      const formattedVersion = version.toUpperCase();
      return `${formattedName} ${formattedVersion}`;
    }
    
    // Fallback: capitaliser simplement le nom
    return modelName.charAt(0).toUpperCase() + modelName.slice(1);
  };

  const toggleModelExpansion = (modelName: string) => {
    const newExpanded = new Set(expandedModels);
    if (newExpanded.has(modelName)) {
      newExpanded.delete(modelName);
    } else {
      newExpanded.add(modelName);
    }
    setExpandedModels(newExpanded);
  };

  const toggleModelSeriesExpansion = (modelName: string) => {
    const newExpanded = new Set(expandedModelSeries);
    if (newExpanded.has(modelName)) {
      newExpanded.delete(modelName);
    } else {
      newExpanded.add(modelName);
    }
    setExpandedModelSeries(newExpanded);
  };

  const toggleResponseExpansion = (responseId: string) => {
    const newExpanded = new Set(expandedResponses);
    if (newExpanded.has(responseId)) {
      newExpanded.delete(responseId);
    } else {
      newExpanded.add(responseId);
    }
    setExpandedResponses(newExpanded);
  };

  const isResponseLong = (response: string) => {
    // Considérer une réponse comme longue si elle fait plus de 2 lignes (environ 120 caractères)
    const lines = response.split('\n');
    return lines.length > 2 || response.length > 120;
  };

  const truncateResponse = (response: string, maxLength: number = 120) => {
    if (response.length <= maxLength) return response;
    return response.substring(0, maxLength) + '...';
  };

  // Obtenir les séries de tests pour un modèle spécifique
  const getModelSeries = (modelResult: ModelResult) => {
    const series = new Set<string>();
    Object.values(modelResult.questions).forEach(question => {
      if (question.series) {
        series.add(question.series);
      }
    });
    return Array.from(series);
  };

  // Obtenir les statistiques par série pour un modèle
  const getSeriesStats = (modelResult: ModelResult, seriesName: string) => {
    const seriesQuestions = Object.values(modelResult.questions).filter(q => q.series === seriesName);
    const successCount = seriesQuestions.filter(q => q.success).length;
    const totalTime = seriesQuestions.reduce((sum, q) => sum + q.responseTime, 0);
    const avgTokensPerSecond = seriesQuestions.length > 0 
      ? seriesQuestions.reduce((sum, q) => sum + q.tokensPerSecond, 0) / seriesQuestions.length 
      : 0;

    return {
      questionsCount: seriesQuestions.length,
      successRate: seriesQuestions.length > 0 ? (successCount / seriesQuestions.length) * 100 : 0,
      totalTime,
      avgTime: seriesQuestions.length > 0 ? totalTime / seriesQuestions.length : 0,
      avgTokensPerSecond
    };
  };

  // Obtenir les séries de tests uniques
  const getTestSeries = (benchmark: BenchmarkResult) => {
    if (!benchmark?.results) return [];
    const series = new Set<string>();
    
    Object.values(benchmark.results).forEach(modelResult => {
      Object.values(modelResult.questions).forEach(question => {
        if (question.series) {
          series.add(question.series);
        }
      });
    });
    
    return Array.from(series);
  };

  // Filtrer les résultats par série et modèle
  const getFilteredResults = (benchmark: BenchmarkResult) => {
    if (!benchmark?.results) return {};
    
    const filtered: typeof benchmark.results = {};
    
    Object.entries(benchmark.results).forEach(([modelName, modelResult]) => {
      // Filtrer par modèle
      if (selectedModel !== 'all' && modelName !== selectedModel) return;
      
      // Filtrer les questions par série
      const filteredQuestions: typeof modelResult.questions = {};
      Object.entries(modelResult.questions).forEach(([questionId, question]) => {
        if (selectedSeries === 'all' || question.series === selectedSeries) {
          filteredQuestions[questionId] = question;
        }
      });
      
      if (Object.keys(filteredQuestions).length > 0) {
        filtered[modelName] = {
          ...modelResult,
          questions: filteredQuestions
        };
      }
    });
    
    return filtered;
  };

  // Trier les modèles
  const getSortedModelEntries = (results: typeof benchmark.results) => {
    return Object.entries(results).sort(([, a], [, b]) => {
      switch (sortBy) {
        case 'success_rate':
          return (b as ModelResult).success_rate - (a as ModelResult).success_rate;
        case 'response_time':
          return (a as ModelResult).average_response_time - (b as ModelResult).average_response_time;
        case 'tokens_per_second':
          return (b as ModelResult).average_tokens_per_second - (a as ModelResult).average_tokens_per_second;
        default:
          return 0;
      }
    });
  };

  // Navigation par ancres
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Calculs des statistiques globales basées sur la vraie structure
  const calculateStats = (benchmark: BenchmarkResult) => {
    if (!benchmark || !benchmark.summary) return null;
    
    return {
      totalQuestions: benchmark.summary.total_tests,
      successfulQuestions: benchmark.summary.successful_tests,
      failedQuestions: benchmark.summary.failed_tests,
      avgResponseTime: benchmark.summary.average_response_time,
      avgTokensPerSecond: benchmark.summary.average_tokens_per_second,
      totalDuration: benchmark.summary.total_duration,
      modelsCount: benchmark.summary.total_models
    };
  };

  const stats = benchmark ? calculateStats(benchmark) : null;
  const testSeries = benchmark ? getTestSeries(benchmark) : [];
  const filteredResults = benchmark ? getFilteredResults(benchmark) : {};
  const sortedModelEntries = getSortedModelEntries(filteredResults);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <BenchmarkHeader
          title="📈 Résultats du Benchmark"
          subtitle="Chargement des résultats..."
          currentPage="results"
          showBackButton={true}
        />
        <div className="max-w-7xl mx-auto p-6 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">Chargement des résultats...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error || !benchmark) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <BenchmarkHeader
          title="📈 Résultats du Benchmark"
          subtitle="Erreur de chargement"
          currentPage="results"
          showBackButton={true}
        />
        <div className="max-w-7xl mx-auto p-6 flex items-center justify-center py-20">
          <div className="text-center">
            <XCircle className="w-32 h-32 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              {error || 'Résultat non trouvé'}
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <BenchmarkHeader
        title="📈 Résultats du Benchmark"
        subtitle={`Exécuté le ${formatDate(benchmark.timestamp)}`}
        currentPage="results"
        showBackButton={true}
      />

      <div className="max-w-7xl mx-auto p-6 space-y-8">

        {/* Vue d'ensemble et Filtres */}
        {stats && (
          <div id="overview" className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {/* Statistiques globales */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Vue d'ensemble</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-center mb-2">
                    <Target className="w-6 h-6 text-blue-600 mr-2" />
                    <div className="text-3xl font-bold text-blue-600">{stats.totalQuestions}</div>
                  </div>
                  <div className="text-sm text-blue-700 font-medium">Questions totales</div>
                </div>
                
                <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-center mb-2">
                    <Award className="w-6 h-6 text-green-600 mr-2" />
                    <div className="text-3xl font-bold text-green-600">{((stats.successfulQuestions / stats.totalQuestions) * 100).toFixed(1)}%</div>
                  </div>
                  <div className="text-sm text-green-700 font-medium">Taux de réussite</div>
                </div>
                
                <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="w-6 h-6 text-purple-600 mr-2" />
                    <div className="text-3xl font-bold text-purple-600">{formatResponseTime(stats.avgResponseTime)}</div>
                  </div>
                  <div className="text-sm text-purple-700 font-medium">Temps moyen</div>
                </div>
                
                <div className="text-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-6 h-6 text-gray-600 mr-2" />
                    <div className="text-3xl font-bold text-gray-600">{stats.modelsCount}</div>
                  </div>
                  <div className="text-sm text-gray-700 font-medium">Modèles testés</div>
                </div>
              </div>
            </div>

            {/* Filtres et tri */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🔍 Filtres & Tri</h3>
              
              {/* Filtre par série */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Séries de tests
                </label>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setSelectedSeries('all')}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedSeries === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Toutes
                  </button>
                  {testSeries.map(series => (
                    <button
                      key={series}
                      onClick={() => setSelectedSeries(series)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedSeries === series
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {series}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtre par modèle */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Modèles
                </label>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setSelectedModel('all')}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedModel === 'all'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Tous
                  </button>
                  {benchmark && Object.keys(benchmark.results).map(modelName => (
                    <button
                      key={modelName}
                      onClick={() => setSelectedModel(modelName)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedModel === modelName
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {getModelDisplayName(modelName)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tri */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Trier par
                </label>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setSortBy('success_rate')}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                      sortBy === 'success_rate'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🎯 Réussite
                  </button>
                  <button
                    onClick={() => setSortBy('response_time')}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                      sortBy === 'response_time'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ⚡ Temps
                  </button>
                  <button
                    onClick={() => setSortBy('tokens_per_second')}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                      sortBy === 'tokens_per_second'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🚀 Tokens/s
                  </button>
                </div>
              </div>

              {/* Résumé des filtres actifs */}
              {(selectedSeries !== 'all' || selectedModel !== 'all') && (
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs text-blue-800">
                    <strong>Filtres actifs:</strong>
                    {selectedSeries !== 'all' && (
                      <span className="ml-1 px-1 py-0.5 bg-blue-100 rounded text-xs">
                        {selectedSeries}
                      </span>
                    )}
                    {selectedModel !== 'all' && (
                      <span className="ml-1 px-1 py-0.5 bg-blue-100 rounded text-xs">
                        {getModelDisplayName(selectedModel)}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setSelectedSeries('all');
                        setSelectedModel('all');
                      }}
                      className="ml-2 text-blue-600 hover:text-blue-800 text-xs underline"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Résultats par modèle */}
        <div id="results" className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🤖 Résultats par Modèle</h2>
          
          {Object.keys(filteredResults).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Filter className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Aucun résultat ne correspond aux filtres sélectionnés.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedModelEntries.map(([modelName, modelResult], index) => {
                const result = modelResult as ModelResult
                const questionsCount = Object.keys(result.questions).length
                return (
                <div key={modelName} className="border border-gray-200 rounded-xl p-6">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleModelSeriesExpansion(modelName)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getModelDisplayName(modelName)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {questionsCount} questions • {formatResponseTime(result.total_response_time)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(result.success_rate)}`}>
                        {result.success_rate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {result.average_tokens_per_second.toFixed(1)} tok/s
                      </div>
                      <div className="text-sm text-purple-600">
                        {formatResponseTime(result.average_response_time)} moy.
                      </div>
                      {expandedModelSeries.has(modelName) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Séries de tests pour ce modèle */}
                  {expandedModelSeries.has(modelName) && (
                    <div className="mt-6 space-y-4">
                      <h4 className="text-md font-semibold text-gray-800">Séries de tests :</h4>
                      {getModelSeries(result).map(seriesName => {
                        const seriesStats = getSeriesStats(result, seriesName);
                        return (
                          <div key={seriesName} className="bg-gray-50 rounded-lg p-4 border">
                            <div 
                              className="flex items-center justify-between cursor-pointer"
                              onClick={() => toggleModelExpansion(`${modelName}-${seriesName}`)}
                            >
                              <div className="flex items-center gap-3">
                                <FlaskConical className="w-5 h-5 text-blue-600" />
                                <div>
                                  <h5 className="font-medium text-gray-900">{seriesName}</h5>
                                  <p className="text-sm text-gray-600">
                                    {seriesStats.questionsCount} questions
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(seriesStats.successRate)}`}>
                                  {seriesStats.successRate.toFixed(1)}%
                                </span>
                                <span className="text-xs text-gray-600">
                                  {formatResponseTime(seriesStats.avgTime)} moy.
                                </span>
                                <span className="text-xs text-blue-600">
                                  {seriesStats.avgTokensPerSecond.toFixed(1)} tok/s
                                </span>
                                {expandedModels.has(`${modelName}-${seriesName}`) ? (
                                  <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                            </div>

                            {/* Détails des questions de cette série */}
                            {expandedModels.has(`${modelName}-${seriesName}`) && (
                              <div className="mt-4 space-y-3">
                                {Object.entries(result.questions)
                                  .filter(([, q]) => q.series === seriesName)
                                  .map(([questionId, question], qIndex) => {
                                    const q = question as QuestionResult
                                    const responseId = `${modelName}-${seriesName}-${questionId}`;
                                    const isLong = isResponseLong(q.response);
                                    const isExpanded = expandedResponses.has(responseId);
                                    
                                    return (
                                    <div key={questionId} className="bg-white rounded p-3 border">
                                      <div className="flex justify-between items-start mb-2">
                                        <h6 className="font-medium text-gray-900 text-sm">Q{qIndex + 1}: {questionId}</h6>
                                        <div className="flex items-center gap-2">
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            q.success ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                                          }`}>
                                            {q.success ? '✓' : '✗'}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {formatResponseTime(q.responseTime)}
                                          </span>
                                        </div>
                                      </div>
                                      <p className="text-xs text-gray-600 mb-2 italic">{q.question}</p>
                                      <div className="text-xs text-gray-700">
                                        {isLong && !isExpanded ? (
                                          <>
                                            <div className="line-clamp-2">{truncateResponse(q.response)}</div>
                                            <button
                                              onClick={() => toggleResponseExpansion(responseId)}
                                              className="text-blue-600 hover:text-blue-800 mt-1 text-xs underline"
                                            >
                                              Voir la réponse complète
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            <div className="whitespace-pre-wrap">{q.response}</div>
                                            {isLong && (
                                              <button
                                                onClick={() => toggleResponseExpansion(responseId)}
                                                className="text-blue-600 hover:text-blue-800 mt-1 text-xs underline"
                                              >
                                                Réduire
                                              </button>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    )
                                  })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                )
              })}
            </div>
          )}
        </div>
        {/* Résultats par série de tests */}
        <div id="series" className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Résultats par Série de Tests</h2>
          
          {testSeries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FlaskConical className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Aucune série de tests détectée dans ce benchmark.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {testSeries.map((seriesName, index) => {
                // Calculer les stats globales pour cette série
                const seriesData = Object.entries(benchmark?.results || {}).map(([modelName, modelResult]) => {
                  const seriesStats = getSeriesStats(modelResult as ModelResult, seriesName);
                  return {
                    modelName,
                    ...seriesStats
                  };
                }).filter(data => data.questionsCount > 0);

                const totalQuestions = seriesData.reduce((sum, data) => sum + data.questionsCount, 0);
                const avgSuccessRate = seriesData.length > 0 
                  ? seriesData.reduce((sum, data) => sum + data.successRate, 0) / seriesData.length 
                  : 0;
                const avgResponseTime = seriesData.length > 0 
                  ? seriesData.reduce((sum, data) => sum + data.avgTime, 0) / seriesData.length 
                  : 0;

                return (
                  <div key={seriesName} className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-blue-600' :
                          index === 1 ? 'bg-green-600' :
                          index === 2 ? 'bg-purple-600' : 'bg-orange-600'
                        }`}>
                          <FlaskConical className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{seriesName}</h3>
                          <p className="text-sm text-gray-600">
                            {seriesData.length} modèles • {totalQuestions} questions au total
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className={`px-4 py-2 rounded-full text-sm font-medium ${getScoreColor(avgSuccessRate)}`}>
                          {avgSuccessRate.toFixed(1)}% moy.
                        </div>
                        <div className="text-sm text-purple-600">
                          {formatResponseTime(avgResponseTime)} moy.
                        </div>
                      </div>
                    </div>

                    {/* Classement des modèles pour cette série */}
                    <div className="space-y-3">
                      <h4 className="text-md font-semibold text-gray-800">Classement des modèles :</h4>
                      {seriesData
                        .sort((a, b) => b.successRate - a.successRate)
                        .map((data, modelIndex) => (
                          <div key={data.modelName} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                modelIndex === 0 ? 'bg-yellow-500' :
                                modelIndex === 1 ? 'bg-gray-400' :
                                modelIndex === 2 ? 'bg-orange-600' : 'bg-blue-500'
                              }`}>
                                {modelIndex + 1}
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-900">
                                  {getModelDisplayName(data.modelName)}
                                </h5>
                                <p className="text-xs text-gray-600">
                                  {data.questionsCount} questions
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getScoreColor(data.successRate)}`}>
                                {data.successRate.toFixed(1)}%
                              </span>
                              <span className="text-xs text-gray-600">
                                {formatResponseTime(data.avgTime)}
                              </span>
                              <span className="text-xs text-blue-600">
                                {data.avgTokensPerSecond.toFixed(1)} tok/s
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
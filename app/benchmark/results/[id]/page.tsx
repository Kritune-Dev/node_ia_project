'use client'

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, Clock, Target, Award, TrendingUp, ExternalLink, XCircle } from 'lucide-react';
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
        [questionId: string]: {
          question: string
          category: string
          difficulty: string
          success: boolean
          response: string
          responseTime: number
          tokensPerSecond: number
          model: string
          isTimeout: boolean
        }
      }
    }
  }
}

export default function BenchmarkResultsPage() {
  const params = useParams();
  const benchmarkId = params.id as string;
  const { benchmark, isLoading, error } = useBenchmarkDetails(benchmarkId);
  
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());

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

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    if (score >= 30) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getModelDisplayName = (modelName: string) => {
    const modelNames = {
      'gemma3:270m': 'Gemma3 270M',
      'gemma3:1b': 'Gemma3 1B',
      'tinyllama:1.1b': 'TinyLlama 1.1B',
      'qwen3:0.6b': 'Qwen3 600M',
      'qwen3:1.7b': 'Qwen3 1.7B',
      'deepseek-r1:1.5b': 'DeepSeek R1 1.5B',
      'PRFD/croissant-llm:latest': 'Croissant LLM'
    };
    return modelNames[modelName as keyof typeof modelNames] || modelName;
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
        {/* Statistiques globales */}
        {stats && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
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
                  <div className="text-3xl font-bold text-purple-600">{Math.round(stats.avgResponseTime)}</div>
                </div>
                <div className="text-sm text-purple-700 font-medium">Temps moyen (ms)</div>
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
        )}

        {/* Résultats par modèle */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🤖 Résultats par Modèle</h2>
          <div className="space-y-6">
            {Object.entries(benchmark.results)
              .sort(([, a], [, b]) => (b as ModelResult).success_rate - (a as ModelResult).success_rate)
              .map(([modelName, modelResult], index) => {
                const result = modelResult as ModelResult
                return (
              <div key={modelName} className="border border-gray-200 rounded-xl p-6">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleModelExpansion(modelName)}
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
                        {Object.keys(result.questions).length} questions • {formatDuration(result.total_response_time)}
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
                    <ExternalLink className={`w-5 h-5 text-gray-400 transform transition-transform ${
                      expandedModels.has(modelName) ? 'rotate-90' : ''
                    }`} />
                  </div>
                </div>

                {/* Détails des questions */}
                {expandedModels.has(modelName) && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-md font-semibold text-gray-800">Détails des questions :</h4>
                    {Object.entries(result.questions).map(([questionId, question], qIndex) => {
                      const q = question as QuestionResult
                      return (
                      <div key={questionId} className="bg-gray-50 rounded-lg p-4 border">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">Q{qIndex + 1}: {questionId}</h5>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              q.success ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                            }`}>
                              {q.success ? '✓ Réussi' : '✗ Échoué'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDuration(q.responseTime)}
                            </span>
                            <span className="text-xs text-blue-600">
                              {q.tokensPerSecond.toFixed(1)} tok/s
                            </span>
                          </div>
                        </div>
                        <div className="mb-2">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            q.category === 'basic' ? 'bg-blue-100 text-blue-800' :
                            q.category === 'medical' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {q.category}
                          </span>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                            q.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                            q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {q.difficulty}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2 font-medium">Question :</p>
                        <p className="text-sm text-gray-600 mb-3 italic">{q.question}</p>
                        <div className="bg-white rounded p-3 border">
                          <p className="text-sm text-gray-800 font-medium mb-1">Réponse :</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.response}</p>
                        </div>
                      </div>
                      )
                    })}
                  </div>
                )}
              </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
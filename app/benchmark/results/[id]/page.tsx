'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Target, 
  TrendingUp, 
  Clock, 
  Activity, 
  ChevronDown, 
  Brain,
  CheckCircle,
  XCircle,
  AlertCircle,
  Award,
  BarChart3,
  Timer,
  Zap
} from 'lucide-react';
import { useBenchmark } from '../../../../hooks/useBenchmark';
import { useModelConfig } from '../../../../hooks/useModelConfig';

interface TestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  testType: string;
  testConfig: any;
}

function TestDetailModal({ isOpen, onClose, testType, testConfig }: TestDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Détails du Test: {testType}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Paramètres utilisés:</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Température:</span>
                <span className="font-medium">{testConfig?.temperature || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Seed:</span>
                <span className="font-medium">{testConfig?.seed || 'Aléatoire'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Timeout:</span>
                <span className="font-medium">{testConfig?.timeout || '90s'}</span>
              </div>
              {testConfig?.maxTokens && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Tokens:</span>
                  <span className="font-medium">{testConfig.maxTokens}</span>
                </div>
              )}
            </div>
          </div>
          
          {testConfig?.prompt && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Prompt associé:</h4>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{testConfig.prompt}</p>
              </div>
            </div>
          )}
          
          {testConfig?.expectedType && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Type de réponse attendu:</h4>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                {testConfig.expectedType}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BenchmarkResultsPage() {
  const router = useRouter();
  const params = useParams();
  const { executionHistory, currentExecution } = useBenchmark();
  const [selectedExecution, setSelectedExecution] = useState<any>(null);
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const [showAllRankings, setShowAllRankings] = useState(false);
  const [testModalConfig, setTestModalConfig] = useState<{isOpen: boolean, testType: string, config: any}>({
    isOpen: false,
    testType: '',
    config: null
  });

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `${minutes}min ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatDuration = (durationMs: number): string => {
    if (durationMs < 1000) {
      return `${durationMs}ms`;
    }
    return formatTime(Math.round(durationMs / 1000));
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    if (score >= 4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getTestTypeLabel = (testType: string) => {
    const labels: { [key: string]: string } = {
      'smoke': '💨 Test Rapide',
      'qualitative': '📝 Qualité',
      'stability': '🔒 Stabilité',
      'api_io': '⚡ Performance API',
      'real_data': '📊 Données Réelles',
      'parameter': '⚙️ Paramètres',
      'prompt_alternative': '🔄 Prompts Alternatifs'
    };
    return labels[testType] || testType;
  };

  const getModelDisplayName = (modelName: string) => {
    // Configuration des noms d'affichage des modèles
    const modelDisplayNames: { [key: string]: string } = {
      'PRFD/croissant-llm:latest': 'Croissant LLM',
      'meditron:latest': 'Meditron 7b',
      'cniongolo/biomistral:latest': 'BioMistral 7b',
      'medllama2:latest': 'MedLlama2 7b',
      'alibayram/medgemma:4b': 'MedGemma 4b',
      'lastmass/Qwen3_Medical_GRPO:latest': 'Qwen3 Medical GRPO',
      'microsoft/DialoGPT-medium': 'DialoGPT Medium',
      'huggingface/CodeBERTa-small-v1': 'CodeBERTa Small'
    };
    return modelDisplayNames[modelName] || modelName;
  };

  const getQuestionText = (questionId: string) => {
    // Mapping des IDs vers les intitulés des questions
    const questionTexts: { [key: string]: string } = {
      'basic_1': 'Test de fonctionnement de l\'IA',
      'basic_2': 'Test de communication en français',
      'medical_1': 'Symptômes hypertension artérielle',
      'medical_2': 'Mécanisme inhibiteurs ECA',
      'medical_3': 'Étapes de la glycolyse',
      'general_1': 'Causes réchauffement climatique',
      'general_2': 'Concept intelligence artificielle',
      'coding_1': 'Fonction Fibonacci Python',
      'reasoning_1': 'Test de raisonnement logique'
    };
    return questionTexts[questionId] || questionId;
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
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

  const openTestModal = (testType: string, config: any) => {
    setTestModalConfig({
      isOpen: true,
      testType,
      config
    });
  };

  const closeTestModal = () => {
    setTestModalConfig({
      isOpen: false,
      testType: '',
      config: null
    });
  };

  useEffect(() => {
    const resultId = params.id as string;
    
    if (resultId === 'latest' && currentExecution) {
      setSelectedExecution(currentExecution);
    } else if (resultId && executionHistory.length > 0) {
      const execution = executionHistory.find(exec => exec.id === resultId);
      if (execution) {
        setSelectedExecution(execution);
      } else {
        // Si on ne trouve pas l'exécution, rediriger vers l'historique
        router.push('/benchmark/history');
      }
    }
  }, [params.id, executionHistory, currentExecution, router]);

  if (!selectedExecution) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Chargement des résultats...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* En-tête */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/benchmark')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour au Benchmark
              </button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                  📈 Résultats du Test
                </h1>
                <p className="text-lg text-gray-600">
                  {selectedExecution.suiteName || 'Benchmark Test'} - {new Date(selectedExecution.startTime).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {/* Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/benchmark')}
                className="px-4 py-2 rounded-lg font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Benchmark
              </button>
              <button
                onClick={() => router.push('/benchmark/history')}
                className="px-4 py-2 rounded-lg font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Historique
              </button>
              <button
                onClick={() => router.push('/benchmark/ranking')}
                className="px-4 py-2 rounded-lg font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Classement
              </button>
            </div>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Vue d'ensemble</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-blue-600 mr-2" />
                <div className="text-3xl font-bold text-blue-600">{selectedExecution.summary?.completedTests || 0}</div>
              </div>
              <div className="text-sm text-blue-700 font-medium">Tests complétés</div>
            </div>
            <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-6 h-6 text-purple-600 mr-2" />
                <div className="text-3xl font-bold text-purple-600">{selectedExecution.summary?.totalTests || 0}</div>
              </div>
              <div className="text-sm text-purple-700 font-medium">Tests totaux</div>
            </div>
            <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-center mb-2">
                <Award className="w-6 h-6 text-green-600 mr-2" />
                <div className="text-3xl font-bold text-green-600">
                  {selectedExecution.summary?.averageScore?.toFixed(1) || '0.0'}
                </div>
              </div>
              <div className="text-sm text-green-700 font-medium">Score moyen</div>
            </div>
            <div className="text-center bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="w-6 h-6 text-red-600 mr-2" />
                <div className="text-3xl font-bold text-red-600">{selectedExecution.summary?.failedTests || 0}</div>
              </div>
              <div className="text-sm text-red-700 font-medium">Échecs</div>
            </div>
          </div>

          {/* Durée d'exécution et statut */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-1">
                <Timer className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Durée d'exécution</span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {selectedExecution.startedAt && selectedExecution.completedAt ? 
                  formatDuration(new Date(selectedExecution.completedAt).getTime() - new Date(selectedExecution.startedAt).getTime()) :
                  'En cours...'
                }
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Statut</span>
              </div>
              <div className={`text-lg font-bold ${
                selectedExecution.status === 'completed' ? 'text-green-600' :
                selectedExecution.status === 'failed' ? 'text-red-600' :
                selectedExecution.status === 'running' ? 'text-blue-600' :
                'text-gray-600'
              }`}>
                {selectedExecution.status === 'completed' ? '✅ Terminé' :
                 selectedExecution.status === 'failed' ? '❌ Échoué' :
                 selectedExecution.status === 'running' ? '🔄 En cours' :
                 selectedExecution.status}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Progression</span>
              </div>
              <div className="text-lg font-bold text-gray-900">{selectedExecution.progress || 0}%</div>
            </div>
          </div>

          {/* Boutons de navigation rapide */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-sm font-medium text-blue-800 mb-3">Navigation rapide :</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => scrollToSection('classement-modeles')}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-all"
              >
                🏆 Classement des modèles
              </button>
              <button
                onClick={() => scrollToSection('performance-tests')}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-all"
              >
                📊 Performance par tests
              </button>
              <button
                onClick={() => scrollToSection('resultats-detailles')}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-all"
              >
                🔍 Résultats détaillés
              </button>
            </div>
          </div>
        </div>

        {/* Classement des modèles si disponible */}
        {selectedExecution.summary?.modelRankings && selectedExecution.summary.modelRankings.length > 1 && (
          <div id="classement-modeles" className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🏆 Classement des Modèles</h2>
            <div className="space-y-4">
              {/* Afficher le top 3 par défaut */}
              {selectedExecution.summary.modelRankings
                .slice(0, showAllRankings ? undefined : 3)
                .map((ranking: any, index: number) => (
                <div key={ranking.modelName} className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                  index === 0 ? 'border-yellow-300 bg-yellow-50' :
                  index === 1 ? 'border-gray-300 bg-gray-50' :
                  index === 2 ? 'border-orange-300 bg-orange-50' :
                  'border-gray-200 bg-white'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-500 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {ranking.rank}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{getModelDisplayName(ranking.modelName)}</div>
                      <div className="text-sm text-gray-600">
                        Score moyen: {ranking.averageScore?.toFixed(1) || '0.0'}/10
                      </div>
                    </div>
                  </div>
                  {index === 0 && (
                    <div className="text-2xl">🥇</div>
                  )}
                  {index === 1 && (
                    <div className="text-2xl">🥈</div>
                  )}
                  {index === 2 && (
                    <div className="text-2xl">🥉</div>
                  )}
                </div>
              ))}
              
              {/* Bouton pour afficher tous les classements si plus de 3 */}
              {selectedExecution.summary.modelRankings.length > 3 && (
                <div className="text-center">
                  <button
                    onClick={() => setShowAllRankings(!showAllRankings)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all font-medium"
                  >
                    {showAllRankings ? 'Voir moins' : `Voir tous les modèles (${selectedExecution.summary.modelRankings.length})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance par type de test */}
        {selectedExecution.summary?.testTypePerformance && (
          <div id="performance-tests" className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Performance par Type de Test</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(selectedExecution.summary.testTypePerformance).map(([testType, performance]: [string, any]) => (
                <div key={testType} className="bg-gray-50 rounded-lg p-4 border hover:bg-gray-100 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold text-gray-800">{getTestTypeLabel(testType)}</span>
                    </div>
                    <button
                      onClick={() => openTestModal(testType, {
                        temperature: 0.8,
                        seed: 'random',
                        timeout: '90s',
                        prompt: `Configuration par défaut pour les tests de type ${testType}`,
                        expectedType: testType
                      })}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-all"
                    >
                      ⚙️ Voir config
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Score moyen:</span>
                      <span className="font-semibold">{performance.averageScore?.toFixed(1) || '0.0'}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Taux de completion:</span>
                      <span className="font-semibold">{performance.completionRate || 0}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Détails par modèle */}
        <div id="resultats-detailles" className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🔍 Résultats Détaillés par Modèle</h2>
          <div className="space-y-6">
            {selectedExecution.results && (() => {
              // Grouper les résultats par modèle
              const resultsByModel = selectedExecution.results.reduce((acc: any, result: any) => {
                if (!acc[result.modelName]) {
                  acc[result.modelName] = [];
                }
                acc[result.modelName].push(result);
                return acc;
              }, {});

              return Object.entries(resultsByModel).map(([modelName, results]: [string, any]) => {
                const validResults = Array.isArray(results) ? results.filter(r => r && typeof r === 'object') : [];
                
                // Calculs sécurisés
                const totalTests = validResults.length;
                const totalScore = validResults.reduce((acc, r) => acc + (r.overallScore || 0), 0);
                const averageScore = totalTests > 0 ? (totalScore / totalTests) : 0;
                const totalDuration = validResults.reduce((acc, r) => acc + (r.response?.responseTime || 0), 0);
                const successfulTests = validResults.filter(r => (r.overallScore || 0) >= 6).length;
                const failedTests = totalTests - successfulTests;
                const isExpanded = expandedModels.has(modelName);
                
                return (
                  <div key={modelName} className="border border-gray-200 rounded-lg bg-gradient-to-r from-gray-50 to-white">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Brain className="w-6 h-6 text-blue-500" />
                          <h3 className="font-bold text-gray-900 text-xl">{getModelDisplayName(modelName)}</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(averageScore)}`}>
                            Score: {averageScore.toFixed(1)}/10
                          </div>
                          {successfulTests > 0 && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              ✅ {successfulTests} réussis
                            </span>
                          )}
                          {failedTests > 0 && (
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                              ❌ {failedTests} échoués
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-blue-500" />
                            <span className="text-gray-600 font-medium text-sm">Tests exécutés</span>
                          </div>
                          <div className="text-xl font-bold text-blue-600">{totalTests}</div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="text-gray-600 font-medium text-sm">Score moyen</span>
                          </div>
                          <div className="text-xl font-bold text-green-600">
                            {averageScore.toFixed(1)}/10
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border border-orange-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span className="text-gray-600 font-medium text-sm">Temps total</span>
                          </div>
                          <div className="text-xl font-bold text-orange-600">
                            {formatDuration(totalDuration)}
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-purple-500" />
                            <span className="text-gray-600 font-medium text-sm">Taux de réussite</span>
                          </div>
                          <div className="text-xl font-bold text-purple-600">
                            {totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0}%
                          </div>
                        </div>
                      </div>
                      
                      {/* Bouton pour afficher/masquer les détails */}
                      <button
                        onClick={() => toggleModelExpansion(modelName)}
                        className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center gap-2 p-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-all"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        {isExpanded ? 'Masquer' : 'Voir'} les détails des tests ({validResults.length})
                      </button>
                      
                      {/* Détails des tests individuels */}
                      {isExpanded && (
                        <div className="mt-4 space-y-3">
                          {validResults.map((result, index) => (
                            <div key={result.id || index} className="bg-white border rounded-lg p-4 shadow-sm">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="font-medium text-gray-800">
                                    Test #{index + 1}
                                  </div>
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                    {getTestTypeLabel(result.testType)}
                                  </span>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(result.overallScore || 0)}`}>
                                  {result.overallScore || 0}/10
                                </div>
                              </div>
                              
                              {/* Métriques spécifiques selon le type de test */}
                              {result.smokeMetrics && (
                                <div className="mb-3">
                                  <div className="text-sm font-medium text-gray-700 mb-2">Métriques Smoke Test:</div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                    <div className={`flex items-center gap-1 ${result.smokeMetrics.basicFunctionality ? 'text-green-600' : 'text-red-600'}`}>
                                      {result.smokeMetrics.basicFunctionality ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                      Fonctionnel
                                    </div>
                                    <div className={`flex items-center gap-1 ${result.smokeMetrics.responseCompleteness ? 'text-green-600' : 'text-red-600'}`}>
                                      {result.smokeMetrics.responseCompleteness ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                      Complet
                                    </div>
                                    <div className={`flex items-center gap-1 ${result.smokeMetrics.noErrors ? 'text-green-600' : 'text-red-600'}`}>
                                      {result.smokeMetrics.noErrors ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                      Sans erreur
                                    </div>
                                    <div className={`flex items-center gap-1 ${result.smokeMetrics.withinTimeLimit ? 'text-green-600' : 'text-red-600'}`}>
                                      {result.smokeMetrics.withinTimeLimit ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                      Dans les temps
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              <div className="space-y-2 text-sm">
                                <div className="text-gray-600">
                                  <strong>Question:</strong> {getQuestionText(result.questionId)}
                                </div>
                                <div className="text-gray-600">
                                  <strong>Réponse:</strong> {result.response?.response ? 
                                    (result.response.response.length > 150 ? result.response.response.substring(0, 150) + '...' : result.response.response) 
                                    : 'Aucune réponse'
                                  }
                                </div>
                                <div className="flex justify-between text-gray-500 text-xs pt-2 border-t">
                                  <span>Durée: {formatDuration(result.response?.responseTime || 0)}</span>
                                  <span>Tokens: {result.response?.tokenCount || 0}</span>
                                  <span>Temp: {result.response?.temperature || 0}</span>
                                  {result.response?.timestamp && (
                                    <span>
                                      {new Date(result.response.timestamp).toLocaleTimeString()}
                                    </span>
                                  )}
                                </div>
                                {result.notes && (
                                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                    <strong>Notes:</strong> {result.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
            
            {/* Message si aucun résultat */}
            {(!selectedExecution.results || selectedExecution.results.length === 0) && (
              <div className="text-center py-12 text-gray-500">
                <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Aucun résultat disponible</h3>
                <p>Ce benchmark n'a pas encore de résultats détaillés.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal pour les détails des tests */}
        <TestDetailModal
          isOpen={testModalConfig.isOpen}
          onClose={closeTestModal}
          testType={testModalConfig.testType}
          testConfig={testModalConfig.config}
        />
      </div>
    </div>
  );
}

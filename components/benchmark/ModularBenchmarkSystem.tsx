'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  Settings, 
  FileText, 
  TrendingUp, 
  Clock, 
  Target, 
  Zap,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Brain,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

import { useBenchmark, useBenchmarkQuestions } from '../../hooks/useBenchmark';
import { BenchmarkTestType, BenchmarkExecution, BenchmarkQuestion, QuestionCategory, DifficultyLevel } from '../../lib/types/benchmark';
import ModelSection from './ModelSection';
import TestDetailModal from './TestDetailModal';
import CustomQuestions from './CustomQuestions';

const ModularBenchmarkSystem: React.FC = () => {
  const {
    isRunning,
    progress,
    error,
    currentExecution,
    executionHistory,
    startBenchmark,
    stopBenchmark,
    createQuickSmokeTest,
    createBenchmarkSuite,
    getDefaultConfiguration
  } = useBenchmark();

  const { createQuestion, getDefaultQuestions } = useBenchmarkQuestions();

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `${minutes}min ${secs}s`;
    }
    return `${secs}s`;
  };

  // Ordre des tests de performance (du plus rapide au plus lent)
  const orderedTestTypes = [
    BenchmarkTestType.SMOKE,           // 1 - Le plus rapide
    BenchmarkTestType.API_IO,          // 2 - Tests d'entrée/sortie
    BenchmarkTestType.QUALITATIVE,     // 3 - Tests qualitatifs
    BenchmarkTestType.STABILITY,       // 4 - Tests de stabilité
    BenchmarkTestType.PARAMETER,       // 5 - Tests de paramètres
    BenchmarkTestType.PROMPT_ALTERNATIVE, // 6 - Tests d'alternatives de prompt
    BenchmarkTestType.REAL_DATA        // 7 - Le plus lent (données réelles)
  ];

  const [selectedTestTypes, setSelectedTestTypes] = useState<BenchmarkTestType[]>([BenchmarkTestType.SMOKE]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<any[]>([]); // Changer en tableau d'objets complets
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);
  const [showCustomQuestions, setShowCustomQuestions] = useState<boolean>(false);
  const [selectedTestDetail, setSelectedTestDetail] = useState<BenchmarkTestType | null>(null);
  const [suiteConfig, setSuiteConfig] = useState({
    name: 'Test Benchmark',
    description: 'Test personnalisé des modèles LLM',
    comments: ''
  });

  // Charger les modèles disponibles
  useEffect(() => {
    const fetchModels = async () => {
      try {
        console.log('Tentative de chargement des modèles...'); // Debug
        const response = await fetch('/api/models');
        const data = await response.json();
        
        console.log('Réponse API modèles:', data); // Debug
        
        if (response.ok && data.models && data.models.all) {
          // Conserver les objets complets des modèles
          console.log('Modèles trouvés:', data.models.all); // Debug
          setAvailableModels(data.models.all);
        } else if (data.error) {
          console.log('Erreur API:', data.error); // Debug
          setAvailableModels([]);
        } else {
          console.log('Structure de données inattendue:', data); // Debug
          setAvailableModels([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des modèles:', error);
        // Ajouter des modèles de test en cas d'erreur avec structure complète
        setAvailableModels([
          { name: 'llama3.2:3b', displayName: 'Llama 3.2 3B', type: 'rapide', parameters: '3B', specialties: ['Usage général'] },
          { name: 'llama3.1:8b', displayName: 'Llama 3.1 8B', type: 'general', parameters: '8B', specialties: ['Conversation', 'Instructions'] },
          { name: 'mistral:7b', displayName: 'Mistral 7B', type: 'general', parameters: '7B', specialties: ['Français', 'Usage général'] },
          { name: 'qwen2.5:7b', displayName: 'Qwen 2.5 7B', type: 'medical', parameters: '7B', specialties: ['Multilingue', 'Raisonnement'] }
        ]);
      }
    };

    fetchModels();
  }, []);

  // Générer automatiquement la description du benchmark
  useEffect(() => {
    if (selectedTestTypes.length > 0 && selectedModels.length > 0) {
      const testNames = selectedTestTypes.map(test => test.replace('_', ' ').toLowerCase()).join(', ');
      const modelNames = selectedModels.join(', ');
      const autoDescription = `Benchmark automatisé incluant ${selectedTestTypes.length} type${selectedTestTypes.length > 1 ? 's' : ''} de test${selectedTestTypes.length > 1 ? 's' : ''} (${testNames}) sur ${selectedModels.length} modèle${selectedModels.length > 1 ? 's' : ''} (${modelNames}).`;
      
      setSuiteConfig(prev => ({
        ...prev,
        description: autoDescription
      }));
    }
  }, [selectedTestTypes, selectedModels]);

  const canRunBenchmark = () => {
    if (selectedTestTypes.length === 0 || selectedModels.length === 0) {
      return false;
    }
    return !isRunning;
  };

  const handleRunBenchmark = async () => {
    if (!canRunBenchmark()) return;

    // Générer les questions par défaut pour les types de tests sélectionnés
    const questions: BenchmarkQuestion[] = [];
    for (const testType of selectedTestTypes) {
      // Créer des questions de base pour chaque type de test
      const baseQuestions = [
        'Test de base pour ' + testType.replace('_', ' '),
        'Question de validation pour ' + testType.replace('_', ' '),
        'Évaluation pour ' + testType.replace('_', ' ')
      ].map(q => createQuestion(q, QuestionCategory.LANGUAGE_UNDERSTANDING, DifficultyLevel.MEDIUM));
      questions.push(...baseQuestions);
    }

    // Ajouter les questions personnalisées si spécifiées
    if (customQuestions.length > 0) {
      const customQuestionsList = customQuestions.map(cq => 
        createQuestion(cq.question, QuestionCategory.LANGUAGE_UNDERSTANDING, DifficultyLevel.MEDIUM)
      );
      questions.push(...customQuestionsList);
    }

            // Utiliser la fonction createBenchmarkSuite pour créer une suite valide
    const suite = createBenchmarkSuite({
      name: suiteConfig.name,
      description: suiteConfig.description,
      testTypes: selectedTestTypes,
      questions,
      models: selectedModels,
      configuration: getDefaultConfiguration()
    });    await startBenchmark(suite);
  };

  const handleQuickSmokeTest = async () => {
    if (selectedModels.length === 0) return;
    await createQuickSmokeTest(selectedModels);
  };

  const handleModelToggle = (modelName: string) => {
    setSelectedModels(prev => 
      prev.includes(modelName)
        ? prev.filter(m => m !== modelName)
        : [...prev, modelName]
    );
  };

  const getTestTypeIcon = (type: BenchmarkTestType) => {
    const icons = {
      [BenchmarkTestType.QUALITATIVE]: <FileText className="w-4 h-4" />,
      [BenchmarkTestType.STABILITY]: <Target className="w-4 h-4" />,
      [BenchmarkTestType.API_IO]: <BarChart3 className="w-4 h-4" />,
      [BenchmarkTestType.REAL_DATA]: <TrendingUp className="w-4 h-4" />,
      [BenchmarkTestType.PARAMETER]: <Settings className="w-4 h-4" />,
      [BenchmarkTestType.PROMPT_ALTERNATIVE]: <FileText className="w-4 h-4" />,
      [BenchmarkTestType.SMOKE]: <Zap className="w-4 h-4" />
    };
    return icons[type] || <Settings className="w-4 h-4" />;
  };

  const getTestTypeDescription = (type: BenchmarkTestType) => {
    const descriptions = {
      [BenchmarkTestType.QUALITATIVE]: "Évalue la qualité, pertinence et cohérence des réponses",
      [BenchmarkTestType.STABILITY]: "Teste la consistance des réponses sur plusieurs itérations",
      [BenchmarkTestType.API_IO]: "Mesure les performances, la latence et le débit",
      [BenchmarkTestType.REAL_DATA]: "Tests avec données contextuelles réelles",
      [BenchmarkTestType.PARAMETER]: "Optimise les paramètres du modèle",
      [BenchmarkTestType.PROMPT_ALTERNATIVE]: "Compare différentes formulations de prompts",
      [BenchmarkTestType.SMOKE]: "Tests rapides de validation fonctionnelle"
    };
    return descriptions[type] || "Test spécialisé";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-24">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* En-tête amélioré */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                🚀 Système de Benchmark Modulaire
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                Évaluez vos modèles LLM avec 7 types de tests spécialisés
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  Tests modulaires
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  Analyse intelligente
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  Temps réel
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modèles disponibles en haut */}
        <ModelSection
          availableModels={availableModels}
          selectedModels={selectedModels}
          onModelToggle={handleModelToggle}
        />

        {/* Types de tests */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Types de tests</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{selectedTestTypes.length}</span>
              <span>test{selectedTestTypes.length !== 1 ? 's' : ''} sélectionné{selectedTestTypes.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          
          {/* Grille cohérente avec les modèles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orderedTestTypes.map((testType, index) => (
              <div
                key={testType}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group
                  ${selectedTestTypes.includes(testType) 
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:scale-[1.01]'
                  }
                `}
                onClick={() => {
                  if (selectedTestTypes.includes(testType)) {
                    setSelectedTestTypes(prev => prev.filter(t => t !== testType));
                  } else {
                    setSelectedTestTypes(prev => [...prev, testType]);
                  }
                }}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 leading-tight">
                      {testType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                    {selectedTestTypes.includes(testType) && (
                      <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 flex-1">
                    {getTestTypeDescription(testType)}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span 
                      className={`px-2 py-1 rounded-full font-medium ${
                        index === 0 ? 'bg-green-100 text-green-700' :
                        index === orderedTestTypes.length - 1 ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {index === 0 ? '⚡ Rapide' : 
                       index === orderedTestTypes.length - 1 ? '🐌 Long' : '⚖️ Modéré'}
                    </span>
                    <button
                      className="text-blue-600 hover:text-blue-800 font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTestDetail(testType);
                      }}
                    >
                      Détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Message d'aide */}
          {selectedTestTypes.length === 0 && (
            <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">Aucun test sélectionné</h4>
                  <p className="text-sm text-yellow-700">
                    Cliquez sur les cartes ci-dessus pour sélectionner les types de tests à exécuter
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Configuration du test */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800">Configuration du Test</h3>
          </div>
          
          <div className="space-y-6">
            {/* Nom et description */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du benchmark
                </label>
                <input
                  type="text"
                  value={suiteConfig.name}
                  onChange={(e) => setSuiteConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Test de performance des modèles"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commentaires
                </label>
                <input
                  type="text"
                  value={suiteConfig.comments}
                  onChange={(e) => setSuiteConfig(prev => ({ ...prev, comments: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Commentaires optionnels"
                />
              </div>
            </div>
            
            {/* Description automatique */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (générée automatiquement)
              </label>
              <textarea
                value={suiteConfig.description}
                onChange={(e) => setSuiteConfig(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="La description sera générée automatiquement en fonction de vos sélections..."
              />
            </div>
            
            {/* Toggle pour questions personnalisées */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800">Questions personnalisées</h4>
                <p className="text-sm text-gray-600">Ajouter vos propres questions au benchmark</p>
              </div>
              <button
                onClick={() => setShowCustomQuestions(!showCustomQuestions)}
                className={`p-2 rounded-lg transition-colors ${
                  showCustomQuestions 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                }`}
              >
                {showCustomQuestions ? (
                  <ToggleRight className="w-6 h-6" />
                ) : (
                  <ToggleLeft className="w-6 h-6" />
                )}
              </button>
            </div>
            
            {/* Questions personnalisées */}
            {showCustomQuestions && (
              <CustomQuestions
                onQuestionsChange={setCustomQuestions}
              />
            )}
          </div>
        </div>
      </div>

      {/* Barre de contrôle fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50">
        {/* Barre de progression intégrée */}
        {(isRunning || currentExecution) && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-2 border-b border-gray-200">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-4">
                {isRunning ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-bounce"></div>
                    <span className="text-sm font-medium text-gray-700">Test en cours...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Test terminé !</span>
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Progression</span>
                    <span className="text-blue-600 font-bold">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {currentExecution && currentExecution.summary && (
                  <div className="flex gap-4 text-xs">
                    <span className="text-blue-600 font-semibold">
                      {currentExecution.summary.completedTests}/{currentExecution.summary.totalTests}
                    </span>
                    <span className="text-green-600 font-semibold">
                      {currentExecution.summary.averageScore.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              {/* Résumé de la sélection */}
              <div className="flex items-center gap-6">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Sélection: </span>
                  <span className="text-blue-600 font-semibold">
                    {selectedModels.length} modèle{selectedModels.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-gray-500 mx-2">•</span>
                  <span className="text-purple-600 font-semibold">
                    {selectedTestTypes.length} test{selectedTestTypes.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {selectedTestTypes.length > 0 && selectedModels.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Temps estimé: </span>
                    <span className="text-orange-600 font-semibold">
                      {formatTime(Math.ceil((selectedTestTypes.length * selectedModels.length * 2) / 60) * 60)}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleQuickSmokeTest}
                  disabled={selectedModels.length === 0 || isRunning}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    selectedModels.length === 0 || isRunning
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-yellow-500 text-white hover:bg-yellow-600 hover:shadow-lg'
                  }`}
                >
                  <Zap className="w-4 h-4 inline mr-2" />
                  Test Smoke Rapide
                </button>
                
                {isRunning ? (
                  <button
                    onClick={stopBenchmark}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all hover:shadow-lg"
                  >
                    <Square className="w-4 h-4 inline mr-2" />
                    Arrêter
                  </button>
                ) : (
                  <button
                    onClick={handleRunBenchmark}
                    disabled={!canRunBenchmark()}
                    className={`px-6 py-2 rounded-lg font-medium transition-all ${
                      canRunBenchmark()
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 hover:shadow-lg'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-4 h-4 inline mr-2" />
                    Lancer le Benchmark
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal pour les détails de test */}
      <TestDetailModal
        testType={selectedTestDetail}
        isVisible={selectedTestDetail !== null}
        onClose={() => setSelectedTestDetail(null)}
      />
    </div>
  );
};

export default ModularBenchmarkSystem;
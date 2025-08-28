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
  ToggleRight,
  History,
  Trophy,
  ArrowLeft,
  Terminal,
  ChevronDown,
  ChevronUp,
  Activity
} from 'lucide-react';

import { useBenchmark, useBenchmarkQuestions } from '../../hooks/useBenchmark';
import { BenchmarkTestType, BenchmarkExecution, BenchmarkQuestion, QuestionCategory, DifficultyLevel } from '../../lib/types/benchmark';
import ModelSection from './ModelSection';
import TestDetailModal from './TestDetailModal';
import CustomQuestions from './CustomQuestions';
import BenchmarkHistory from './BenchmarkHistory';
import BenchmarkRanking from './BenchmarkRanking';

type ViewMode = 'benchmark' | 'history' | 'ranking' | 'results';

const ModularBenchmarkSystem: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('benchmark');
  const [selectedBenchmark, setSelectedBenchmark] = useState<any>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  
  // États pour le suivi du temps
  const [benchmarkStartTime, setBenchmarkStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>(0);
  
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
    getDefaultConfiguration,
    reloadHistory,
    setLogCallback
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

  // Fonctions de gestion du terminal
  const addTerminalLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    setTerminalLogs(prev => [...prev, logEntry]);
  };

  const clearTerminalLogs = () => {
    setTerminalLogs([]);
  };

  // Configurer le callback de logging détaillé
  useEffect(() => {
    setLogCallback(addTerminalLog);
  }, [setLogCallback]);

  const toggleTerminal = () => {
    setIsTerminalOpen(prev => !prev);
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

  // Surveiller l'état du benchmark et ajouter des logs
  useEffect(() => {
    if (isRunning && benchmarkStartTime === 0) {
      // Démarrer le benchmark seulement si ce n'est pas déjà démarré
      setBenchmarkStartTime(Date.now());
      addTerminalLog('Benchmark en cours d\'exécution...', 'info');
    } else if (isRunning && benchmarkStartTime > 0) {
      // Benchmark déjà en cours, juste ajouter un log
      addTerminalLog('Continuation du benchmark...', 'info');
    } else if (!isRunning && currentExecution && progress === 100) {
      // Benchmark terminé
      addTerminalLog('Benchmark terminé avec succès!', 'success');
      addTerminalLog(`Tests complétés: ${currentExecution.summary?.completedTests || 0}/${currentExecution.summary?.totalTests || 0}`, 'success');
      addTerminalLog(`Score moyen: ${currentExecution.summary?.averageScore?.toFixed(1) || '0.0'}`, 'success');
      
      // Réinitialiser automatiquement les temps après 30 secondes pour ne pas encombrer
      const resetTimeout = setTimeout(() => {
        setBenchmarkStartTime(0);
        setElapsedTime(0);
        setEstimatedTimeRemaining(0);
      }, 30000);
      
      return () => clearTimeout(resetTimeout);
    } else if (!isRunning && benchmarkStartTime > 0 && progress < 100) {
      // Benchmark arrêté avant la fin
      addTerminalLog('Benchmark arrêté par l\'utilisateur', 'warning');
      setBenchmarkStartTime(0);
      setElapsedTime(0);
      setEstimatedTimeRemaining(0);
    }
  }, [isRunning, progress, currentExecution, benchmarkStartTime]);

  // Mettre à jour le temps écoulé et le temps restant
  useEffect(() => {
    if (!isRunning || benchmarkStartTime === 0) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - benchmarkStartTime) / 1000);
      setElapsedTime(elapsed);
      
      // Calculer le temps restant basé sur la progression
      if (progress > 0 && progress < 100) {
        const totalEstimatedTime = (elapsed / progress) * 100;
        const remaining = Math.max(0, totalEstimatedTime - elapsed);
        setEstimatedTimeRemaining(Math.floor(remaining));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRunning, benchmarkStartTime, progress]);

  // Surveiller les erreurs et les afficher dans le terminal
  useEffect(() => {
    if (error) {
      addTerminalLog(`Erreur: ${error}`, 'error');
    }
  }, [error]);

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

    // Réinitialiser les temps avant de lancer un nouveau benchmark
    clearProgressDisplay();

    // Ajouter des logs sans ouvrir automatiquement le terminal
    addTerminalLog('Initialisation du benchmark...', 'info');
    addTerminalLog(`Modèles sélectionnés: ${selectedModels.join(', ')}`, 'info');
    addTerminalLog(`Types de tests: ${selectedTestTypes.join(', ')}`, 'info');

    // Générer les questions par défaut pour les types de tests sélectionnés
    const questions: BenchmarkQuestion[] = [];
    for (const testType of selectedTestTypes) {
      addTerminalLog(`Génération des questions pour ${testType}...`, 'info');
      
      // Utiliser les questions spécifiques à chaque type de test
      if (testType === BenchmarkTestType.SMOKE) {
        // Utiliser les vraies questions du SmokeTestExecutor
        const smokeQuestions = [
          createQuestion('What is 2 + 2?', QuestionCategory.LANGUAGE_UNDERSTANDING, DifficultyLevel.EASY),
          createQuestion('Name three colors.', QuestionCategory.LANGUAGE_UNDERSTANDING, DifficultyLevel.EASY),
          createQuestion('Write a simple greeting.', QuestionCategory.LANGUAGE_UNDERSTANDING, DifficultyLevel.EASY)
        ];
        questions.push(...smokeQuestions);
      } else {
        // Pour les autres types de tests, créer des questions de base appropriées
        const baseQuestions = [
          `Analysez ce cas : Comment évalueriez-vous l'efficacité d'un traitement médical ?`,
          `Raisonnement : Expliquez les étapes pour résoudre un problème complexe.`,
          `Créativité : Proposez une solution innovante à un défi environnemental.`
        ].map(q => createQuestion(q, QuestionCategory.LANGUAGE_UNDERSTANDING, DifficultyLevel.MEDIUM));
        questions.push(...baseQuestions);
      }
    }

    // Ajouter les questions personnalisées si spécifiées
    if (customQuestions.length > 0) {
      addTerminalLog(`Ajout de ${customQuestions.length} questions personnalisées...`, 'info');
      const customQuestionsList = customQuestions.map(cq => 
        createQuestion(cq.question, QuestionCategory.LANGUAGE_UNDERSTANDING, DifficultyLevel.MEDIUM)
      );
      questions.push(...customQuestionsList);
    }

    // Utiliser la fonction createBenchmarkSuite pour créer une suite valide
    addTerminalLog('Création de la suite de tests...', 'info');
    const suite = createBenchmarkSuite({
      name: suiteConfig.name,
      description: suiteConfig.description,
      testTypes: selectedTestTypes,
      questions,
      models: selectedModels,
      configuration: getDefaultConfiguration()
    });
    
    addTerminalLog('Lancement du benchmark...', 'success');
    await startBenchmark(suite);
  };

  const handleQuickSmokeTest = async () => {
    if (selectedModels.length === 0) return;
    
    // Réinitialiser les temps avant de lancer un nouveau test
    clearProgressDisplay();
    
    // Ajouter des logs sans ouvrir automatiquement le terminal
    addTerminalLog('Lancement du test Smoke rapide...', 'info');
    addTerminalLog(`Modèles sélectionnés: ${selectedModels.join(', ')}`, 'info');
    addTerminalLog('Test de validation fonctionnelle en cours...', 'info');
    
    await createQuickSmokeTest(selectedModels);
    addTerminalLog('Test Smoke terminé avec succès!', 'success');
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

  const getTestTypeQuestionCount = (type: BenchmarkTestType): number => {
    const questionCounts = {
      [BenchmarkTestType.SMOKE]: 3,
      [BenchmarkTestType.API_IO]: 5,
      [BenchmarkTestType.QUALITATIVE]: 5,
      [BenchmarkTestType.STABILITY]: 5,
      [BenchmarkTestType.PARAMETER]: 5,
      [BenchmarkTestType.PROMPT_ALTERNATIVE]: 5,
      [BenchmarkTestType.REAL_DATA]: 5
    };
    return questionCounts[type] || 3;
  };

  const getTestTypeTimeout = (type: BenchmarkTestType): number => {
    const timeouts = {
      [BenchmarkTestType.SMOKE]: 30,           // 30 secondes
      [BenchmarkTestType.API_IO]: 60,          // 60 secondes
      [BenchmarkTestType.QUALITATIVE]: 120,    // 120 secondes
      [BenchmarkTestType.STABILITY]: 90,       // 90 secondes
      [BenchmarkTestType.PARAMETER]: 75,       // 75 secondes
      [BenchmarkTestType.PROMPT_ALTERNATIVE]: 90, // 90 secondes
      [BenchmarkTestType.REAL_DATA]: 180       // 180 secondes
    };
    return timeouts[type] || 30;
  };

  const calculateEstimatedTime = (): number => {
    if (selectedTestTypes.length === 0 || selectedModels.length === 0) {
      return 0;
    }
    
    let totalSeconds = 0;
    for (const testType of selectedTestTypes) {
      const questionCount = getTestTypeQuestionCount(testType);
      const timeoutPerQuestion = getTestTypeTimeout(testType);
      const modelsCount = selectedModels.length;
      
      // Calcul: timeout × questions × modèles pour chaque type de test
      totalSeconds += timeoutPerQuestion * questionCount * modelsCount;
    }
    
    // Ajouter 10% de marge pour les temps de traitement
    return Math.ceil(totalSeconds * 1.1);
  };

  const clearProgressDisplay = () => {
    setBenchmarkStartTime(0);
    setElapsedTime(0);
    setEstimatedTimeRemaining(0);
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
            
            {/* Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  clearProgressDisplay();
                  setCurrentView('benchmark');
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentView === 'benchmark'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Benchmark
              </button>
              <button
                onClick={() => {
                  clearProgressDisplay();
                  setCurrentView('history');
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentView === 'history'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <History className="w-4 h-4 inline mr-2" />
                Historique
              </button>
              <button
                onClick={() => {
                  clearProgressDisplay();
                  setCurrentView('ranking');
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentView === 'ranking'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Trophy className="w-4 h-4 inline mr-2" />
                Classement
              </button>
            </div>
          </div>
        </div>

        {/* Contenu conditionnel selon la vue */}
        {currentView === 'benchmark' && (
          <div>
            {/* Modèles disponibles en haut */}
            <ModelSection
              availableModels={availableModels}
              selectedModels={selectedModels}
              onModelToggle={handleModelToggle}
            />

            {/* Types de tests */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Série de tests disponibles</h2>
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
                    <div>
                      <h3 className="font-semibold text-gray-900 leading-tight">
                        {testType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {getTestTypeQuestionCount(testType)} tests
                        </span>
                      </div>
                    </div>
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
      )}

      {/* Barre de contrôle fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50">
        {/* Barre de progression intégrée */}
        {(isRunning || (currentExecution && benchmarkStartTime > 0)) && (
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
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">Progression</span>
                      {isRunning && (
                        <>
                          <span className="text-blue-600">
                            ⏱️ {formatTime(elapsedTime)}
                          </span>
                          {estimatedTimeRemaining > 0 && (
                            <span className="text-orange-600">
                              ⏳ ~{formatTime(estimatedTimeRemaining)}
                            </span>
                          )}
                        </>
                      )}
                    </div>
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

                {/* Boutons quand terminé */}
                {!isRunning && currentExecution && progress === 100 && (
                  <div className="flex gap-2">
                    <button
                      onClick={clearProgressDisplay}
                      className="px-3 py-2 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-all shadow-lg"
                      title="Réinitialiser les temps affichés"
                    >
                      🔄 Reset
                    </button>
                    <button
                      onClick={() => {
                        // Réinitialiser les temps et la progression
                        clearProgressDisplay();
                        // Aller à la vue des résultats
                        setCurrentView('results');
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-blue-600 transition-all shadow-lg"
                    >
                      Voir les résultats
                    </button>
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
                    {selectedTestTypes.length} série de test{selectedTestTypes.length > 1 ? 's' : ''}
                  </span>
                  {selectedTestTypes.length > 0 && (
                    <>
                      <span className="text-gray-500 mx-2">•</span>
                      <span className="text-green-600 font-semibold">
                        {selectedTestTypes.reduce((total, type) => total + getTestTypeQuestionCount(type) * selectedModels.length, 0)} tests
                      </span>
                    </>
                  )}
                  {selectedTestTypes.length > 0 && selectedModels.length > 0 && (
                  <>
                    <span className="text-gray-500 mx-2">•</span>
                    <span className="font-medium">Temps estimé: </span>
                    <span className="text-orange-600 font-semibold">
                      {formatTime(calculateEstimatedTime())}
                    </span>
                  </>
                )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Bouton Terminal */}
                <button
                  onClick={toggleTerminal}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all relative ${
                    isTerminalOpen
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Ouvrir/Fermer le terminal"
                >
                  <Terminal className="w-4 h-4 inline mr-2" />
                  Terminal
                  {terminalLogs.length > 0 && !isTerminalOpen && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                      <Activity className="w-2 h-2 text-white" />
                    </div>
                  )}
                </button>
                
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


        {/* Vue Historique */}
        {currentView === 'history' && (
          <BenchmarkHistory 
            benchmarks={executionHistory} 
            onSelectBenchmark={(benchmark) => {
              setSelectedBenchmark(benchmark);
              setCurrentView('results');
            }}
            onDataUpdate={async () => {
              // Recharger l'historique depuis l'API après suppression
              try {
                await reloadHistory();
                addTerminalLog('✅ Historique actualisé après suppression', 'success');
              } catch (error) {
                addTerminalLog('❌ Erreur lors de l\'actualisation de l\'historique', 'error');
              }
            }}
          />
        )}

        {/* Vue Classement */}
        {currentView === 'ranking' && (
          <BenchmarkRanking 
            benchmarks={executionHistory}
            onSelectBenchmark={(benchmark) => {
              setSelectedBenchmark(benchmark);
              setCurrentView('results');
            }}
          />
        )}

        {/* Vue Résultats */}
        {currentView === 'results' && (selectedBenchmark || currentExecution) && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setCurrentView('benchmark')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
              <h2 className="text-2xl font-bold text-gray-900">Résultats du test</h2>
            </div>
            
            {(() => {
              const execution = selectedBenchmark || currentExecution;
              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="text-center bg-gray-50 rounded-xl p-6">
                      <div className="text-3xl font-bold text-blue-600">{execution.summary?.completedTests || 0}</div>
                      <div className="text-sm text-gray-600 font-medium">Tests complétés</div>
                    </div>
                    <div className="text-center bg-gray-50 rounded-xl p-6">
                      <div className="text-3xl font-bold text-purple-600">{execution.summary?.totalTests || 0}</div>
                      <div className="text-sm text-gray-600 font-medium">Tests totaux</div>
                    </div>
                    <div className="text-center bg-gray-50 rounded-xl p-6">
                      <div className="text-3xl font-bold text-green-600">
                        {execution.summary?.averageScore.toFixed(1) || '0.0'}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">Score moyen</div>
                    </div>
                    <div className="text-center bg-gray-50 rounded-xl p-6">
                      <div className="text-3xl font-bold text-red-600">{execution.summary?.failedTests || 0}</div>
                      <div className="text-sm text-gray-600 font-medium">Échecs</div>
                    </div>
                  </div>

                  {/* Détails des résultats */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Détails par modèle</h3>
                    {execution.results && Object.entries(execution.results).map(([modelName, results]) => (
                      <div key={modelName} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{modelName}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Tests: </span>
                            <span className="font-medium">{Array.isArray(results) ? results.length : 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Score moyen: </span>
                            <span className="font-medium text-green-600">
                              {Array.isArray(results) && results.length > 0 
                                ? (results.reduce((acc: number, r: any) => acc + (r.score || 0), 0) / results.length).toFixed(1)
                                : '0.0'
                              }
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Temps total: </span>
                            <span className="font-medium">
                              {Array.isArray(results) 
                                ? formatTime(results.reduce((acc: number, r: any) => acc + (r.duration || 0), 0))
                                : '0s'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Terminal pliable */}
      {isTerminalOpen && (
        <div className="fixed bottom-20 right-6 w-96 max-h-80 bg-gray-900 rounded-lg shadow-2xl z-50 overflow-hidden">
          {/* En-tête du terminal */}
          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-green-400" />
              <span className="text-white text-sm font-medium">Console de Benchmark</span>
              <div className="flex gap-1 ml-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearTerminalLogs}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded transition-colors"
                title="Effacer les logs"
              >
                Clear
              </button>
              <button
                onClick={toggleTerminal}
                className="text-gray-400 hover:text-white"
                title="Fermer le terminal"
              >
                {isTerminalOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {/* Contenu du terminal */}
          <div className="p-3 h-64 overflow-y-auto bg-gray-900 font-mono text-sm">
            {terminalLogs.length === 0 ? (
              <div className="text-gray-500 italic">
                $ En attente d'actions de benchmark...
              </div>
            ) : (
              terminalLogs.map((log, index) => (
                <div 
                  key={index} 
                  className={`mb-1 ${
                    log.includes('ERROR') ? 'text-red-400' :
                    log.includes('SUCCESS') ? 'text-green-400' :
                    log.includes('WARNING') ? 'text-yellow-400' :
                    'text-gray-300'
                  }`}
                >
                  $ {log}
                </div>
              ))
            )}
            {/* Auto-scroll vers le bas */}
            <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
          </div>
        </div>
      )}

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
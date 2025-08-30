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
  Terminal,
  ChevronDown,
  ChevronUp,
  Activity,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useBenchmark } from '../../hooks/useBenchmark';
import ModelSection from './ModelSection';
import TestDetailModal from '../Modal/TestDetailModal';

const BenchmarkMain: React.FC = () => {
  const router = useRouter();
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  
  // États pour le suivi du temps
  const [benchmarkStartTime, setBenchmarkStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>(0);
  const [isLocalRunning, setIsLocalRunning] = useState<boolean>(false);
  const [localProgress, setLocalProgress] = useState<number>(0);
  const [showExitWarning, setShowExitWarning] = useState<boolean>(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  
  const {
    isRunning,
    progress,
    error,
    currentExecution,
    executionHistory,
    startBenchmark,
    stopBenchmark,
    reloadHistory,
    setLogCallback
  } = useBenchmark();

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

  const [availableTestTypes, setAvailableTestTypes] = useState<Array<{
    id: string;
    name: string;
    description: string;
    questions: Array<any>;
    parameters: any;
  }>>([]);
  const [loadingTestTypes, setLoadingTestTypes] = useState(false);

  const [selectedTestTypes, setSelectedTestTypes] = useState<string[]>(['smoke_test']);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [selectedTestDetail, setSelectedTestDetail] = useState<string | null>(null);

  // Charger les types de tests disponibles depuis l'API
  useEffect(() => {
    const fetchTestTypes = async () => {
      setLoadingTestTypes(true);
      try {
        console.log('🔍 Chargement des types de tests depuis l\'API...');
        
        // Liste des types de tests à récupérer (ordre de performance)
        const testTypeIds = [
          'smoke_test',           // 1 - Le plus rapide
          'medical_test',         // 2 - Tests médicaux
          'general_knowledge',    // 3 - Connaissances générales  
          'coding_test'           // 4 - Tests de code
        ];
        
        const testTypesData = [];
        
        for (const testId of testTypeIds) {
          try {
            const response = await fetch(`/api/benchmark/config?benchmarkId=${testId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                testTypesData.push({
                  id: testId,
                  name: data.data.name,
                  description: data.data.description,
                  questions: data.data.questions,
                  parameters: data.data.parameters,
                  testTypes: data.data.testTypes
                });
              }
            }
          } catch (error) {
            console.warn(`Échec du chargement de ${testId}:`, error);
          }
        }
        
        setAvailableTestTypes(testTypesData);
        console.log(`✅ ${testTypesData.length} types de tests chargés`);
        
      } catch (error) {
        console.error('Erreur lors du chargement des types de tests:', error);
        // Fallback vers des types de base si l'API échoue
        setAvailableTestTypes([
          {
            id: 'smoke_test',
            name: 'Test Smoke',
            description: 'Tests rapides de validation fonctionnelle',
            questions: [],
            parameters: { timeout: 30000 }
          }
        ]);
      } finally {
        setLoadingTestTypes(false);
      }
    };

    fetchTestTypes();
  }, []);

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
    // Ne pas interférer si on utilise notre système local
    if (isLocalRunning) return;
    
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
      
      // Redirection automatique vers la page des résultats après 2 secondes
      const redirectTimeout = setTimeout(() => {
        addTerminalLog('🎯 Redirection automatique vers les résultats...', 'info');
        router.push(`/benchmark/results/${currentExecution.id || 'latest'}`);
      }, 2000);
      
      // Réinitialiser automatiquement les temps après 30 secondes pour ne pas encombrer
      const resetTimeout = setTimeout(() => {
        setBenchmarkStartTime(0);
        setElapsedTime(0);
        setEstimatedTimeRemaining(0);
      }, 30000);
      
      return () => {
        clearTimeout(redirectTimeout);
        clearTimeout(resetTimeout);
      };
    } else if (!isRunning && !isLocalRunning && benchmarkStartTime > 0 && progress < 100) {
      // Benchmark arrêté avant la fin (seulement si ce n'est pas notre système local)
      addTerminalLog('Benchmark arrêté par l\'utilisateur', 'warning');
      setBenchmarkStartTime(0);
      setElapsedTime(0);
      setEstimatedTimeRemaining(0);
    }
  }, [isRunning, progress, currentExecution, benchmarkStartTime, router, isLocalRunning]);

  // Gestion de la navigation pendant les tests
  const handleNavigation = (path: string) => {
    if (isLocalRunning || isRunning) {
      setPendingNavigation(path);
      setShowExitWarning(true);
    } else {
      router.push(path as any);
    }
  };

  const confirmNavigation = () => {
    if (pendingNavigation) {
      setIsLocalRunning(false);
      setLocalProgress(0);
      setBenchmarkStartTime(0);
      router.push(pendingNavigation as any);
    }
    setShowExitWarning(false);
    setPendingNavigation(null);
  };

  const cancelNavigation = () => {
    setShowExitWarning(false);
    setPendingNavigation(null);
  };

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

  const canRunBenchmark = () => {
    if (selectedTestTypes.length === 0 || selectedModels.length === 0) {
      return false;
    }
    return !isLocalRunning && !isRunning;
  };

  const handleRunBenchmark = async () => {
    if (!canRunBenchmark()) return;

    // Réinitialiser les temps et marquer comme en cours
    clearProgressDisplay();
    setBenchmarkStartTime(Date.now());
    setIsLocalRunning(true);
    setLocalProgress(0);

    // Ajouter des logs sans ouvrir automatiquement le terminal
    addTerminalLog('Initialisation du benchmark...', 'info');
    addTerminalLog(`Modèles sélectionnés: ${selectedModels.join(', ')}`, 'info');
    addTerminalLog(`Types de tests: ${selectedTestTypes.join(', ')}`, 'info');

    // Exécuter les benchmarks via l'API
    try {
      let completedTests = 0;
      const totalTests = selectedTestTypes.length;
      let allResults = [];

      addTerminalLog(`📊 Début de l'exécution de ${totalTests} test(s)`, 'info');

      for (const testTypeId of selectedTestTypes) {
        addTerminalLog(`🔧 Début du benchmark ${testTypeId}... (${completedTests + 1}/${totalTests})`, 'info');
        
        const startTime = Date.now();
        const execution = await fetch('/api/benchmark/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            benchmarkId: testTypeId,
            models: selectedModels,
            iterations: 1,
            saveResults: true
          })
        });

        const endTime = Date.now();
        addTerminalLog(`⏱️ Requête API terminée en ${endTime - startTime}ms`, 'info');

        if (execution.ok) {
          const result = await execution.json();
          addTerminalLog(`📨 Réponse API reçue: ${result.success ? 'succès' : 'échec'}`, 'info');
          
          if (result.success) {
            completedTests++;
            allResults.push(result);
            const newProgress = (completedTests / totalTests) * 100;
            setLocalProgress(newProgress);
            addTerminalLog(`✅ Benchmark ${testTypeId} terminé avec succès!`, 'success');
            addTerminalLog(`📊 Score moyen: ${result.data.results[0]?.overallScore || 'N/A'}`, 'info');
            addTerminalLog(`📈 Progression: ${completedTests}/${totalTests} tests complétés (${newProgress.toFixed(0)}%)`, 'info');
            
            // Petite pause pour voir la progression
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            addTerminalLog(`❌ Erreur lors du benchmark ${testTypeId}: ${result.error}`, 'error');
          }
        } else {
          addTerminalLog(`❌ Erreur HTTP ${execution.status} lors du benchmark ${testTypeId}`, 'error');
        }
      }
      
      addTerminalLog('🎉 Tous les benchmarks terminés!', 'success');
      
      // Redirection immédiate vers l'historique des résultats
      if (allResults.length > 0) {
        addTerminalLog('🎯 Redirection vers l\'historique des résultats...', 'info');
        setTimeout(() => {
          router.push('/benchmark/history' as any);
        }, 1000);
      }
      
    } catch (error) {
      addTerminalLog(`💥 Erreur lors de l'exécution: ${error}`, 'error');
    } finally {
      // Réinitialiser les états
      setIsLocalRunning(false);
      setLocalProgress(0);
      setBenchmarkStartTime(0);
      setElapsedTime(0);
      setEstimatedTimeRemaining(0);
    }
  };

  const handleQuickSmokeTest = async () => {
    if (selectedModels.length === 0) return;
    
    // Réinitialiser les temps avant de lancer un nouveau test
    clearProgressDisplay();
    
    // Ajouter des logs sans ouvrir automatiquement le terminal
    addTerminalLog('Lancement du test Smoke rapide...', 'info');
    addTerminalLog(`Modèles sélectionnés: ${selectedModels.join(', ')}`, 'info');
    addTerminalLog('Test de validation fonctionnelle en cours...', 'info');
    
    try {
      const execution = await fetch('/api/benchmark/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          benchmarkId: 'smoke_test',
          models: selectedModels,
          iterations: 1,
          saveResults: true
        })
      });

      if (execution.ok) {
        const result = await execution.json();
        if (result.success) {
          addTerminalLog('✅ Test Smoke terminé avec succès!', 'success');
          addTerminalLog(`📊 Score moyen: ${result.data.results[0]?.overallScore || 'N/A'}`, 'info');
        } else {
          addTerminalLog(`❌ Erreur lors du test Smoke: ${result.error}`, 'error');
        }
      }
    } catch (error) {
      addTerminalLog(`💥 Erreur lors du test Smoke: ${error}`, 'error');
    }
  };

  const handleModelToggle = (modelName: string) => {
    setSelectedModels(prev => 
      prev.includes(modelName)
        ? prev.filter(m => m !== modelName)
        : [...prev, modelName]
    );
  };

  const getTestTypeQuestionCount = (testId: string): number => {
    const testType = availableTestTypes.find(t => t.id === testId);
    return testType?.questions.length || 3;
  };

  const getTestTypeTimeout = (testId: string): number => {
    const testType = availableTestTypes.find(t => t.id === testId);
    return testType?.parameters?.timeout ? Math.round(testType.parameters.timeout / 1000) : 30;
  };

  const calculateEstimatedTime = (): number => {
    if (selectedTestTypes.length === 0 || selectedModels.length === 0) {
      return 0;
    }
    
    let totalSeconds = 0;
    for (const testTypeId of selectedTestTypes) {
      const questionCount = getTestTypeQuestionCount(testTypeId);
      const timeoutPerQuestion = getTestTypeTimeout(testTypeId);
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
                onClick={() => handleNavigation('/benchmark')}
                className="px-4 py-2 rounded-lg font-medium transition-all bg-blue-500 text-white shadow-lg"
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Benchmark
              </button>
              <button
                onClick={() => handleNavigation('/benchmark/history')}
                className="px-4 py-2 rounded-lg font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <History className="w-4 h-4 inline mr-2" />
                Historique
              </button>
              <button
                onClick={() => handleNavigation('/benchmark/ranking')}
                className="px-4 py-2 rounded-lg font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <Trophy className="w-4 h-4 inline mr-2" />
                Classement
              </button>
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
            <h2 className="text-2xl font-bold text-gray-900">Série de tests disponibles</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{selectedTestTypes.length}</span>
              <span>test{selectedTestTypes.length !== 1 ? 's' : ''} sélectionné{selectedTestTypes.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          
          {/* Grille cohérente avec les modèles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingTestTypes ? (
              <div className="col-span-full flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Chargement des types de tests...</span>
              </div>
            ) : availableTestTypes.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                Aucun type de test disponible
              </div>
            ) : (
              availableTestTypes.map((testType, index) => (
                <div
                  key={testType.id}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group
                    ${selectedTestTypes.includes(testType.id) 
                      ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:scale-[1.01]'
                    }
                  `}
                  onClick={() => {
                    if (selectedTestTypes.includes(testType.id)) {
                      setSelectedTestTypes(prev => prev.filter(t => t !== testType.id));
                    } else {
                      setSelectedTestTypes(prev => [...prev, testType.id]);
                    }
                  }}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 leading-tight">
                          {testType.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {testType.questions.length} tests
                          </span>
                        </div>
                      </div>
                      {selectedTestTypes.includes(testType.id) && (
                        <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 flex-1">
                      {testType.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span 
                        className={`px-2 py-1 rounded-full font-medium ${
                          index === 0 ? 'bg-green-100 text-green-700' :
                          index === availableTestTypes.length - 1 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {index === 0 ? '⚡ Rapide' : 
                         index === availableTestTypes.length - 1 ? '🐌 Long' : '⚖️ Modéré'}
                      </span>
                      <button
                        className="text-blue-600 hover:text-blue-800 font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTestDetail(testType.id);
                        }}
                      >
                        Détails
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
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
      </div>

      {/* Barre de contrôle fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50">
        {/* Barre de progression intégrée */}
        {(isLocalRunning || isRunning || (currentExecution && benchmarkStartTime > 0)) && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-2 border-b border-gray-200">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-4">
                {(isLocalRunning || isRunning) ? (
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
                      {(isLocalRunning || isRunning) && (
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
                    <span className="text-blue-600 font-bold">{isLocalRunning ? localProgress.toFixed(0) : progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${isLocalRunning ? localProgress : progress}%` }}
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
                        // Aller à la page de résultats avec l'ID
                        router.push(`/benchmark/results/${currentExecution.id || 'latest'}`);
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
                  disabled={selectedModels.length === 0 || isLocalRunning || isRunning}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    selectedModels.length === 0 || isLocalRunning || isRunning
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-yellow-500 text-white hover:bg-yellow-600 hover:shadow-lg'
                  }`}
                >
                  <Zap className="w-4 h-4 inline mr-2" />
                  Test Smoke Rapide
                </button>
                
                {(isLocalRunning || isRunning) ? (
                  <button
                    onClick={() => {
                      if (isRunning) stopBenchmark();
                      if (isLocalRunning) setIsLocalRunning(false);
                    }}
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

      {/* Modal d'avertissement pour navigation pendant test */}
      {showExitWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={cancelNavigation}>
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-yellow-100">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Test en cours</h3>
                <p className="text-sm text-gray-600">Un benchmark est actuellement en cours d'exécution</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Si vous quittez cette page maintenant, le test en cours sera interrompu et les résultats partiels seront perdus.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelNavigation}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Rester sur la page
              </button>
              <button
                onClick={confirmNavigation}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Quitter quand même
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BenchmarkMain;

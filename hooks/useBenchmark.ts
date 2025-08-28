import { useState, useCallback, useRef, useEffect } from 'react';
import {
  BenchmarkSuite,
  BenchmarkExecution,
  BenchmarkResult,
  BenchmarkTestType,
  BenchmarkQuestion,
  BenchmarkConfiguration,
  QuestionCategory,
  DifficultyLevel
} from '../lib/types/benchmark';
import { BenchmarkManager } from '../lib/BenchmarkManager';
import { SmokeTestExecutor, QuickSmokeTestSuite } from '../lib/executors/SmokeTestExecutor';

export interface UseBenchmarkReturn {
  // État du benchmark
  currentExecution: BenchmarkExecution | null;
  isRunning: boolean;
  progress: number;
  error: string | null;
  
  // Actions
  startBenchmark: (suite: BenchmarkSuite) => Promise<void>;
  stopBenchmark: () => Promise<void>;
  createQuickSmokeTest: (models: string[]) => Promise<void>;
  
  // Utilitaires
  createBenchmarkSuite: (params: CreateSuiteParams) => BenchmarkSuite;
  getDefaultConfiguration: () => BenchmarkConfiguration;
  getEstimatedDuration: (suite: BenchmarkSuite) => number;
  
  // Historique
  executionHistory: BenchmarkExecution[];
  addToHistory: (execution: BenchmarkExecution) => void;
  clearHistory: () => void;
  reloadHistory: () => Promise<void>;
  
  // Configuration des callbacks
  setLogCallback: (callback: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void) => void;
}

export interface CreateSuiteParams {
  name: string;
  description: string;
  testTypes: BenchmarkTestType[];
  questions: BenchmarkQuestion[];
  models: string[];
  configuration?: Partial<BenchmarkConfiguration>;
}

export function useBenchmark(): UseBenchmarkReturn {
  const [currentExecution, setCurrentExecution] = useState<BenchmarkExecution | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionHistory, setExecutionHistory] = useState<BenchmarkExecution[]>([]);
  
  const benchmarkManagerRef = useRef<BenchmarkManager | null>(null);
  
  // Initialiser le manager
  useEffect(() => {
    if (!benchmarkManagerRef.current) {
      const manager = new BenchmarkManager();
      
      // Configurer les callbacks
      manager.onProgressUpdate = (execution: BenchmarkExecution) => {
        setCurrentExecution({ ...execution });
      };
      
      benchmarkManagerRef.current = manager;
    }
  }, []);
  
  // Fonction pour charger l'historique depuis l'API serveur
  const loadHistoryFromServer = useCallback(async () => {
    try {
      const response = await fetch('/api/benchmark/history');
      if (response.ok) {
        const data = await response.json();
        setExecutionHistory(data.benchmarks || []);
      } else {
        // Fallback vers localStorage si l'API échoue
        const saved = localStorage.getItem('benchmark_history');
        if (saved) {
          const history = JSON.parse(saved);
          setExecutionHistory(history);
        }
      }
    } catch (error) {
      console.warn('Failed to load benchmark history from server, using localStorage:', error);
      try {
        const saved = localStorage.getItem('benchmark_history');
        if (saved) {
          const history = JSON.parse(saved);
          setExecutionHistory(history);
        }
      } catch (localError) {
        console.warn('Failed to load benchmark history from localStorage:', localError);
      }
    }
  }, []);

  // Charger l'historique depuis l'API serveur au démarrage
  useEffect(() => {
    loadHistoryFromServer();
  }, [loadHistoryFromServer]);
  
  // Sauvegarder l'historique vers l'API serveur et localStorage
  const saveHistory = useCallback(async (history: BenchmarkExecution[]) => {
    // Toujours sauvegarder en localStorage comme backup
    try {
      localStorage.setItem('benchmark_history', JSON.stringify(history.slice(-10))); // Garder les 10 derniers localement
    } catch (error) {
      console.warn('Failed to save benchmark history to localStorage:', error);
    }
  }, []);

  // Sauvegarder un nouveau benchmark individuel sur le serveur
  const saveBenchmarkToServer = useCallback(async (execution: BenchmarkExecution) => {
    try {
      const response = await fetch('/api/benchmark/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(execution) // Envoyer le benchmark individuel directement
      });

      if (!response.ok) {
        console.warn('Failed to save benchmark to server');
        return false;
      }
      return true;
    } catch (error) {
      console.warn('Failed to save benchmark to server:', error);
      return false;
    }
  }, []);
  
  const startBenchmark = useCallback(async (suite: BenchmarkSuite) => {
    if (!benchmarkManagerRef.current) {
      throw new Error('Benchmark manager not initialized');
    }
    
    try {
      setError(null);
      setIsRunning(true);
      
      const execution = await benchmarkManagerRef.current.executeBenchmarkSuite(suite);
      
      setCurrentExecution(execution);
      setIsRunning(false);
      
      // Ajouter à l'historique local
      const newHistory = [...executionHistory, execution];
      setExecutionHistory(newHistory);
      
      // Sauvegarder localement et sur le serveur
      await saveHistory(newHistory);
      await saveBenchmarkToServer(execution);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
      setIsRunning(false);
      setCurrentExecution(null);
    }
  }, [executionHistory, saveHistory]);
  
  const stopBenchmark = useCallback(async () => {
    if (benchmarkManagerRef.current) {
      await benchmarkManagerRef.current.cancelExecution();
      setIsRunning(false);
      setCurrentExecution(null);
    }
  }, []);
  
  const createQuickSmokeTest = useCallback(async (models: string[]) => {
    const questions = QuickSmokeTestSuite.getEssentialQuestions();
    const configuration = QuickSmokeTestSuite.getBasicConfiguration();
    
    const suite: BenchmarkSuite = {
      id: crypto.randomUUID(),
      name: 'Test Smoke Rapide',
      description: 'Test rapide pour vérifier le fonctionnement de base des modèles',
      testTypes: [BenchmarkTestType.SMOKE],
      questions,
      models,
      configuration,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await startBenchmark(suite);
  }, [startBenchmark]);
  
  const createBenchmarkSuite = useCallback((params: CreateSuiteParams): BenchmarkSuite => {
    const defaultConfig = getDefaultConfiguration();
    
    return {
      id: crypto.randomUUID(),
      name: params.name,
      description: params.description,
      testTypes: params.testTypes,
      questions: params.questions,
      models: params.models,
      configuration: { ...defaultConfig, ...params.configuration },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }, []);
  
  const getDefaultConfiguration = useCallback((): BenchmarkConfiguration => {
    return {
      maxConcurrentTests: 3,
      timeoutMs: 30000,
      retryCount: 2,
      qualitative: {
        humanEvaluationRequired: false,
        autoEvaluationWeight: 1.0
      },
      stability: {
        iterationCount: 5,
        consistencyThreshold: 0.7
      },
      apiIo: {
        concurrentRequests: 5,
        loadTestDuration: 30000
      },
      realData: {
        contextSize: 1000
      },
      parameter: {
        temperatureRange: [0.1, 1.0],
        temperatureSteps: 5,
        otherParams: {
          max_tokens: [150, 300, 500],
          top_p: [0.8, 0.9, 1.0]
        }
      },
      promptAlternative: {
        promptVariants: [],
        evaluationMethod: 'quality'
      },
      smoke: {
        timeLimit: 30000, // 30 secondes pour les modèles plus gros
        basicChecks: ['proper_length', 'no_repetition', 'contains_punctuation']
      }
    };
  }, []);
  
  const getEstimatedDuration = useCallback((suite: BenchmarkSuite): number => {
    if (benchmarkManagerRef.current) {
      return benchmarkManagerRef.current.getEstimatedDuration(suite);
    }
    return 0;
  }, []);
  
  const addToHistory = useCallback((execution: BenchmarkExecution) => {
    const newHistory = [...executionHistory, execution];
    setExecutionHistory(newHistory);
    saveHistory(newHistory);
    saveBenchmarkToServer(execution);
  }, [executionHistory, saveHistory, saveBenchmarkToServer]);
  
  const clearHistory = useCallback(() => {
    setExecutionHistory([]);
    localStorage.removeItem('benchmark_history');
  }, []);
  
  // Fonction pour configurer le callback de logging
  const setLogCallback = useCallback((callback: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void) => {
    if (benchmarkManagerRef.current) {
      benchmarkManagerRef.current.onDetailedLog = callback;
    }
  }, []);
  
  return {
    currentExecution,
    isRunning,
    progress: currentExecution?.progress || 0,
    error,
    startBenchmark,
    stopBenchmark,
    createQuickSmokeTest,
    createBenchmarkSuite,
    getDefaultConfiguration,
    getEstimatedDuration,
    executionHistory,
    addToHistory,
    clearHistory,
    reloadHistory: loadHistoryFromServer,
    setLogCallback
  };
}

// Hook utilitaire pour créer des questions de benchmark
export function useBenchmarkQuestions() {
  const createQuestion = useCallback((
    text: string,
    category: QuestionCategory,
    difficulty: DifficultyLevel,
    options?: {
      expectedAnswerLength?: number;
      keywords?: string[];
      context?: string;
      evaluationCriteria?: string[];
      baselineAnswer?: string;
    }
  ): BenchmarkQuestion => {
    return {
      id: crypto.randomUUID(),
      text,
      category,
      difficulty,
      expectedAnswerLength: options?.expectedAnswerLength,
      keywords: options?.keywords,
      context: options?.context,
      evaluationCriteria: options?.evaluationCriteria,
      baselineAnswer: options?.baselineAnswer,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }, []);
  
  const createQuestionSet = useCallback((
    questions: Array<{
      text: string;
      category: QuestionCategory;
      difficulty: DifficultyLevel;
      options?: any;
    }>
  ): BenchmarkQuestion[] => {
    return questions.map(q => createQuestion(q.text, q.category, q.difficulty, q.options));
  }, [createQuestion]);
  
  // Questions prédéfinies par catégorie
  const getDefaultQuestions = useCallback((category?: QuestionCategory): BenchmarkQuestion[] => {
    const allQuestions = [
      {
        text: "Expliquez le concept de machine learning en termes simples.",
        category: QuestionCategory.TECHNICAL_ANALYSIS,
        difficulty: DifficultyLevel.MEDIUM,
        options: {
          expectedAnswerLength: 300,
          keywords: ['apprentissage', 'données', 'modèle', 'prédiction'],
          evaluationCriteria: ['Clarté', 'Précision technique', 'Exemples concrets']
        }
      },
      {
        text: "Résolvez cette équation: 2x + 5 = 13",
        category: QuestionCategory.MATH_PROBLEM,
        difficulty: DifficultyLevel.EASY,
        options: {
          expectedAnswerLength: 50,
          baselineAnswer: "x = 4",
          evaluationCriteria: ['Résultat correct', 'Démarche logique']
        }
      },
      {
        text: "Écrivez une courte histoire sur un robot qui découvre l'amitié.",
        category: QuestionCategory.CREATIVE_WRITING,
        difficulty: DifficultyLevel.MEDIUM,
        options: {
          expectedAnswerLength: 500,
          keywords: ['robot', 'amitié', 'découverte'],
          evaluationCriteria: ['Créativité', 'Cohérence narrative', 'Émotion']
        }
      },
      {
        text: "Quelle est la capitale de la France?",
        category: QuestionCategory.FACTUAL_KNOWLEDGE,
        difficulty: DifficultyLevel.EASY,
        options: {
          expectedAnswerLength: 10,
          baselineAnswer: "Paris",
          evaluationCriteria: ['Exactitude factuelle']
        }
      },
      {
        text: "Analysez les avantages et inconvénients de l'intelligence artificielle dans la médecine.",
        category: QuestionCategory.ETHICAL_REASONING,
        difficulty: DifficultyLevel.HARD,
        options: {
          expectedAnswerLength: 600,
          keywords: ['IA', 'médecine', 'avantages', 'inconvénients', 'éthique'],
          evaluationCriteria: ['Équilibre des arguments', 'Considérations éthiques', 'Exemples concrets']
        }
      }
    ];
    
    const filtered = category 
      ? allQuestions.filter(q => q.category === category)
      : allQuestions;
    
    return filtered.map(q => createQuestion(q.text, q.category, q.difficulty, q.options));
  }, [createQuestion]);
  
  return {
    createQuestion,
    createQuestionSet,
    getDefaultQuestions
  };
}

// Hook pour les métriques et l'analyse des résultats
export function useBenchmarkAnalysis() {
  const analyzeResults = useCallback((execution: BenchmarkExecution) => {
    const { results, summary } = execution;
    
    return {
      overview: {
        totalTests: summary.totalTests,
        completedTests: summary.completedTests,
        successRate: summary.completedTests / summary.totalTests * 100,
        averageScore: summary.averageScore
      },
      modelPerformance: summary.modelRankings,
      categoryBreakdown: summary.categoryPerformance,
      testTypeBreakdown: summary.testTypePerformance,
      timeAnalysis: {
        totalDuration: execution.completedAt && execution.startedAt 
          ? execution.completedAt.getTime() - execution.startedAt.getTime()
          : 0,
        averageResponseTime: results.length > 0 
          ? results.reduce((sum, r) => sum + r.response.responseTime, 0) / results.length
          : 0
      }
    };
  }, []);
  
  const compareExecutions = useCallback((exec1: BenchmarkExecution, exec2: BenchmarkExecution) => {
    const analysis1 = analyzeResults(exec1);
    const analysis2 = analyzeResults(exec2);
    
    return {
      scoreDifference: analysis2.overview.averageScore - analysis1.overview.averageScore,
      successRateDifference: analysis2.overview.successRate - analysis1.overview.successRate,
      timeDifference: analysis2.timeAnalysis.totalDuration - analysis1.timeAnalysis.totalDuration,
      modelRankingChanges: compareModelRankings(
        analysis1.modelPerformance, 
        analysis2.modelPerformance
      )
    };
  }, [analyzeResults]);
  
  const compareModelRankings = (rankings1: any[], rankings2: any[]) => {
    const changes = [];
    
    for (const model2 of rankings2) {
      const model1 = rankings1.find(m => m.modelName === model2.modelName);
      if (model1) {
        const rankChange = model1.rank - model2.rank;
        const scoreChange = model2.averageScore - model1.averageScore;
        
        changes.push({
          modelName: model2.modelName,
          rankChange,
          scoreChange,
          trend: rankChange > 0 ? 'improved' : rankChange < 0 ? 'declined' : 'stable'
        });
      }
    }
    
    return changes;
  };
  
  return {
    analyzeResults,
    compareExecutions
  };
}

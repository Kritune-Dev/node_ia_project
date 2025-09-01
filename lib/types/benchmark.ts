// Types et interfaces pour le système de benchmark modulaire

export enum BenchmarkTestType {
  QUALITATIVE = 'qualitative',
  STABILITY = 'stability',
  API_IO = 'api_io',
  REAL_DATA = 'real_data',
  PARAMETER = 'parameter',
  PROMPT_ALTERNATIVE = 'prompt_alternative',
  SMOKE = 'smoke'
}

export enum QuestionCategory {
  LOGICAL_REASONING = 'logical_reasoning',
  CREATIVE_WRITING = 'creative_writing',
  FACTUAL_KNOWLEDGE = 'factual_knowledge',
  MATH_PROBLEM = 'math_problem',
  CODE_GENERATION = 'code_generation',
  LANGUAGE_UNDERSTANDING = 'language_understanding',
  ETHICAL_REASONING = 'ethical_reasoning',
  TECHNICAL_ANALYSIS = 'technical_analysis'
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert'
}

export interface BenchmarkQuestion {
  id: string;
  text: string;
  category: QuestionCategory;
  difficulty: DifficultyLevel;
  expectedAnswerLength?: number;
  keywords?: string[];
  context?: string;
  evaluationCriteria?: string[];
  baselineAnswer?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelResponse {
  id: string;
  modelName: string;
  response: string;
  responseTime: number;
  tokenCount?: number;
  temperature?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface QualitativeMetrics {
  relevance: number; // 0-10
  coherence: number; // 0-10
  accuracy: number; // 0-10
  completeness: number; // 0-10
  creativity?: number; // 0-10 (pour les questions créatives)
  technicalDepth?: number; // 0-10 (pour les questions techniques)
}

export interface StabilityMetrics {
  consistency: number; // 0-10
  variability: number; // écart-type des réponses
  convergenceRate: number; // % de réponses similaires
  outlierCount: number;
}

export interface ApiIoMetrics {
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  errorRate: number; // %
  throughput: number; // requêtes/seconde
  successRate: number; // %
}

export interface RealDataMetrics {
  relevanceToContext: number; // 0-10
  practicalApplicability: number; // 0-10
  dataHandlingAccuracy: number; // 0-10
  realWorldViability: number; // 0-10
}

export interface ParameterMetrics {
  temperatureImpact: number;
  consistencyAcrossParams: number;
  optimalParameters: Record<string, any>;
  parameterSensitivity: Record<string, number>;
}

export interface PromptAlternativeMetrics {
  bestPromptVariant: string;
  promptSensitivity: number;
  consistencyAcrossPrompts: number;
  improvementFromOptimization: number;
}

export interface SmokeMetrics {
  basicFunctionality: boolean;
  responseCompleteness: boolean;
  noErrors: boolean;
  withinTimeLimit: boolean;
}

export interface BenchmarkResult {
  id: string;
  questionId: string;
  modelName: string;
  testType: BenchmarkTestType;
  response: ModelResponse;
  qualitativeMetrics?: QualitativeMetrics;
  stabilityMetrics?: StabilityMetrics;
  apiIoMetrics?: ApiIoMetrics;
  realDataMetrics?: RealDataMetrics;
  parameterMetrics?: ParameterMetrics;
  promptAlternativeMetrics?: PromptAlternativeMetrics;
  smokeMetrics?: SmokeMetrics;
  overallScore: number;
  notes?: string;
  evaluatedAt: Date;
  evaluatedBy?: string; // 'auto' | 'manual' | evaluator name
}

export interface BenchmarkConfigItem {
  id: string;
  name: string;
  description: string;
  estimatedTime: number; // en secondes
  questionCount: number;
  difficulty: DifficultyLevel;
  category: string;
  version: string;
  testTypes: BenchmarkTestType[];
  parameters: {
    temperature: number;
    seed: number;
    timeout: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  prompts: {
    system: string;
    evaluation: string;
  };
  questions: Array<{
    id: string;
    text: string;
    category: string;
    expectedType: string;
    difficulty: DifficultyLevel;
    expectedResponse?: string;
    keywords: string[];
    maxResponseLength: number;
  }>;
  scoring: Record<string, number>;
}

export interface BenchmarkSuite {
  id: string;
  name: string;
  description: string;
  testTypes: BenchmarkTestType[];
  questions: BenchmarkQuestion[];
  models: string[];
  configuration: BenchmarkConfiguration;
  createdAt: Date;
  updatedAt: Date;
}

export interface BenchmarkConfiguration {
  // Configuration globale
  maxConcurrentTests: number;
  timeoutMs: number;
  retryCount: number;
  
  // Configuration par type de test
  qualitative: {
    humanEvaluationRequired: boolean;
    autoEvaluationWeight: number;
  };
  
  stability: {
    iterationCount: number;
    consistencyThreshold: number;
  };
  
  apiIo: {
    concurrentRequests: number;
    loadTestDuration: number;
  };
  
  realData: {
    dataSourceUrl?: string;
    contextSize: number;
  };
  
  parameter: {
    temperatureRange: [number, number];
    temperatureSteps: number;
    otherParams: Record<string, any[]>;
  };
  
  promptAlternative: {
    promptVariants: string[];
    evaluationMethod: 'similarity' | 'quality' | 'both';
  };
  
  smoke: {
    timeLimit: number;
    basicChecks: string[];
  };
}

export interface BenchmarkExecution {
  id: string;
  suiteId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  startedAt: Date;
  completedAt?: Date;
  results: BenchmarkResult[];
  errors: string[];
  summary: BenchmarkSummary;
}

export interface BenchmarkSummary {
  totalTests: number;
  completedTests: number;
  failedTests: number;
  averageScore: number;
  modelRankings: Array<{
    modelName: string;
    averageScore: number;
    rank: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  categoryPerformance: Record<QuestionCategory, {
    averageScore: number;
    bestModel: string;
    worstModel: string;
  }>;
  testTypePerformance: Record<BenchmarkTestType, {
    averageScore: number;
    completionRate: number;
  }>;
}

// Types pour les hooks et contextes
export interface BenchmarkContextType {
  currentExecution: BenchmarkExecution | null;
  executionHistory: BenchmarkExecution[];
  isRunning: boolean;
  startBenchmark: (suite: BenchmarkSuite) => Promise<void>;
  stopBenchmark: () => Promise<void>;
  pauseBenchmark: () => Promise<void>;
  resumeBenchmark: () => Promise<void>;
  loadExecution: (id: string) => Promise<BenchmarkExecution>;
  deleteExecution: (id: string) => Promise<void>;
}

export interface TestExecutorInterface {
  execute(
    question: BenchmarkQuestion,
    models: string[],
    config: BenchmarkConfiguration
  ): Promise<BenchmarkResult[]>;
  
  validateConfig(config: BenchmarkConfiguration): boolean;
  getRequiredModels(): string[];
  getEstimatedDuration(questionCount: number, modelCount: number): number;
}

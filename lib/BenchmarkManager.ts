import {
  BenchmarkQuestion,
  BenchmarkResult,
  BenchmarkConfiguration,
  BenchmarkTestType,
  BenchmarkSuite,
  BenchmarkExecution,
  BenchmarkSummary,
  TestExecutorInterface
} from './types/benchmark';

import { QualitativeTestExecutor } from './executors/QualitativeTestExecutor';
import { StabilityTestExecutor } from './executors/StabilityTestExecutor';
import { ApiIoTestExecutor } from './executors/ApiIoTestExecutor';
import { RealDataTestExecutor } from './executors/RealDataTestExecutor';
import { ParameterTestExecutor } from './executors/ParameterTestExecutor';
import { PromptAlternativeTestExecutor } from './executors/PromptAlternativeTestExecutor';
import { SmokeTestExecutor } from './executors/SmokeTestExecutor';

// Gestionnaire principal du système de benchmark
export class BenchmarkManager {
  private executors: Map<BenchmarkTestType, TestExecutorInterface>;
  private currentExecution: BenchmarkExecution | null = null;
  
  constructor() {
    this.executors = new Map<BenchmarkTestType, TestExecutorInterface>();
    this.executors.set(BenchmarkTestType.QUALITATIVE, new QualitativeTestExecutor());
    this.executors.set(BenchmarkTestType.STABILITY, new StabilityTestExecutor());
    this.executors.set(BenchmarkTestType.API_IO, new ApiIoTestExecutor());
    this.executors.set(BenchmarkTestType.REAL_DATA, new RealDataTestExecutor());
    this.executors.set(BenchmarkTestType.PARAMETER, new ParameterTestExecutor());
    this.executors.set(BenchmarkTestType.PROMPT_ALTERNATIVE, new PromptAlternativeTestExecutor());
    this.executors.set(BenchmarkTestType.SMOKE, new SmokeTestExecutor());
  }
  
  async executeBenchmarkSuite(suite: BenchmarkSuite): Promise<BenchmarkExecution> {
    console.log(`Starting benchmark execution for suite: ${suite.name}`);
    
    // Créer une nouvelle exécution
    const execution: BenchmarkExecution = {
      id: crypto.randomUUID(),
      suiteId: suite.id,
      status: 'running',
      progress: 0,
      startedAt: new Date(),
      results: [],
      errors: [],
      summary: this.initializeSummary()
    };
    
    this.currentExecution = execution;
    
    try {
      // Valider la configuration
      this.validateSuite(suite);
      
      // Calculer le nombre total de tests
      const totalTests = this.calculateTotalTests(suite);
      execution.summary.totalTests = totalTests;
      
      let completedTests = 0;
      
      // Exécuter chaque type de test
      for (const testType of suite.testTypes) {
        const executor = this.executors.get(testType);
        if (!executor) {
          throw new Error(`No executor found for test type: ${testType}`);
        }
        
        console.log(`Executing ${testType} tests...`);
        
        // Exécuter les tests pour chaque question
        for (const question of suite.questions) {
          try {
            const results = await executor.execute(question, suite.models, suite.configuration);
            execution.results.push(...results);
            
            completedTests += results.length;
            execution.progress = Math.round((completedTests / totalTests) * 100);
            execution.summary.completedTests = completedTests;
            
            // Callback de progression si défini
            this.onProgressUpdate?.(execution);
            
          } catch (error) {
            const errorMessage = `Failed to execute ${testType} test for question ${question.id}: ${error}`;
            execution.errors.push(errorMessage);
            execution.summary.failedTests++;
            console.error(errorMessage);
          }
        }
      }
      
      // Finaliser l'exécution
      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.summary = this.generateSummary(execution.results, suite);
      
      console.log(`Benchmark execution completed: ${execution.id}`);
      
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.errors.push(`Execution failed: ${error}`);
      console.error(`Benchmark execution failed:`, error);
    }
    
    this.currentExecution = null;
    return execution;
  }
  
  async executeSingleTest(
    testType: BenchmarkTestType,
    question: BenchmarkQuestion,
    models: string[],
    config: BenchmarkConfiguration
  ): Promise<BenchmarkResult[]> {
    const executor = this.executors.get(testType);
    if (!executor) {
      throw new Error(`No executor found for test type: ${testType}`);
    }
    
    return await executor.execute(question, models, config);
  }
  
  getEstimatedDuration(suite: BenchmarkSuite): number {
    let totalDuration = 0;
    
    for (const testType of suite.testTypes) {
      const executor = this.executors.get(testType);
      if (executor) {
        const questionCount = suite.questions.length;
        const modelCount = suite.models.length;
        totalDuration += executor.getEstimatedDuration(questionCount, modelCount);
      }
    }
    
    return totalDuration;
  }
  
  getRequiredModels(suite: BenchmarkSuite): string[] {
    const requiredModels = new Set<string>();
    
    for (const testType of suite.testTypes) {
      const executor = this.executors.get(testType);
      if (executor) {
        executor.getRequiredModels().forEach(model => requiredModels.add(model));
      }
    }
    
    return Array.from(requiredModels);
  }
  
  validateSuite(suite: BenchmarkSuite): void {
    // Validations de base
    if (!suite.questions || suite.questions.length === 0) {
      throw new Error('Benchmark suite must contain at least one question');
    }
    
    if (!suite.models || suite.models.length === 0) {
      throw new Error('Benchmark suite must specify at least one model');
    }
    
    if (!suite.testTypes || suite.testTypes.length === 0) {
      throw new Error('Benchmark suite must specify at least one test type');
    }
    
    // Valider la configuration pour chaque type de test
    for (const testType of suite.testTypes) {
      const executor = this.executors.get(testType);
      if (!executor) {
        throw new Error(`Invalid test type: ${testType}`);
      }
      
      if (!executor.validateConfig(suite.configuration)) {
        throw new Error(`Invalid configuration for test type: ${testType}`);
      }
    }
    
    // Vérifier les modèles requis
    const requiredModels = this.getRequiredModels(suite);
    const missingModels = requiredModels.filter((model: string) => !suite.models.includes(model));
    
    if (missingModels.length > 0) {
      console.warn(`Warning: Missing recommended models for optimal testing: ${missingModels.join(', ')}`);
    }
  }
  
  private calculateTotalTests(suite: BenchmarkSuite): number {
    return suite.questions.length * suite.models.length * suite.testTypes.length;
  }
  
  private initializeSummary(): BenchmarkSummary {
    return {
      totalTests: 0,
      completedTests: 0,
      failedTests: 0,
      averageScore: 0,
      modelRankings: [],
      categoryPerformance: {} as any,
      testTypePerformance: {} as any
    };
  }
  
  private generateSummary(results: BenchmarkResult[], suite: BenchmarkSuite): BenchmarkSummary {
    const summary = this.initializeSummary();
    
    // Statistiques de base
    summary.totalTests = results.length;
    summary.completedTests = results.filter(r => r.overallScore > 0).length;
    summary.failedTests = results.filter(r => r.overallScore === 0).length;
    
    // Score moyen
    const validResults = results.filter(r => r.overallScore > 0);
    summary.averageScore = validResults.length > 0 
      ? validResults.reduce((sum, r) => sum + r.overallScore, 0) / validResults.length 
      : 0;
    
    // Classement des modèles
    summary.modelRankings = this.calculateModelRankings(results, suite.models);
    
    // Performance par catégorie
    summary.categoryPerformance = this.calculateCategoryPerformance(results, suite.questions);
    
    // Performance par type de test
    summary.testTypePerformance = this.calculateTestTypePerformance(results, suite.testTypes);
    
    return summary;
  }
  
  private calculateModelRankings(results: BenchmarkResult[], models: string[]) {
    const modelStats = new Map<string, { scores: number[], totalTests: number }>();
    
    // Initialiser les stats pour chaque modèle
    for (const model of models) {
      modelStats.set(model, { scores: [], totalTests: 0 });
    }
    
    // Collecter les scores
    for (const result of results) {
      const stats = modelStats.get(result.modelName);
      if (stats) {
        stats.scores.push(result.overallScore);
        stats.totalTests++;
      }
    }
    
    // Calculer les classements
    const rankings = Array.from(modelStats.entries()).map(([modelName, stats]) => {
      const averageScore = stats.scores.length > 0 
        ? stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length 
        : 0;
      
      return {
        modelName,
        averageScore,
        rank: 0, // Sera calculé après tri
        strengths: this.identifyModelStrengths(results, modelName),
        weaknesses: this.identifyModelWeaknesses(results, modelName)
      };
    });
    
    // Trier et assigner les rangs
    rankings.sort((a, b) => b.averageScore - a.averageScore);
    rankings.forEach((ranking, index) => {
      ranking.rank = index + 1;
    });
    
    return rankings;
  }
  
  private identifyModelStrengths(results: BenchmarkResult[], modelName: string): string[] {
    const modelResults = results.filter(r => r.modelName === modelName);
    const strengths: string[] = [];
    
    // Analyser les performances par type de test
    const testTypeScores = new Map<BenchmarkTestType, number[]>();
    
    for (const result of modelResults) {
      if (!testTypeScores.has(result.testType)) {
        testTypeScores.set(result.testType, []);
      }
      testTypeScores.get(result.testType)!.push(result.overallScore);
    }
    
    // Identifier les forces
    const testTypeEntries = Array.from(testTypeScores.entries());
    for (const [testType, scores] of testTypeEntries) {
      const avgScore = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
      if (avgScore >= 8) {
        strengths.push(this.getTestTypeDisplayName(testType));
      }
    }
    
    return strengths;
  }
  
  private identifyModelWeaknesses(results: BenchmarkResult[], modelName: string): string[] {
    const modelResults = results.filter(r => r.modelName === modelName);
    const weaknesses: string[] = [];
    
    // Analyser les performances par type de test
    const testTypeScores = new Map<BenchmarkTestType, number[]>();
    
    for (const result of modelResults) {
      if (!testTypeScores.has(result.testType)) {
        testTypeScores.set(result.testType, []);
      }
      testTypeScores.get(result.testType)!.push(result.overallScore);
    }
    
    // Identifier les faiblesses
    const weaknessTestTypeEntries = Array.from(testTypeScores.entries());
    for (const [testType, scores] of weaknessTestTypeEntries) {
      const avgScore = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
      if (avgScore <= 4) {
        weaknesses.push(this.getTestTypeDisplayName(testType));
      }
    }
    
    return weaknesses;
  }
  
  private calculateCategoryPerformance(results: BenchmarkResult[], questions: BenchmarkQuestion[]) {
    const categoryPerf: any = {};
    
    // Grouper par catégorie
    for (const question of questions) {
      const categoryResults = results.filter(r => r.questionId === question.id);
      
      if (categoryResults.length > 0) {
        const scores = categoryResults.map(r => r.overallScore);
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        
        // Trouver le meilleur et pire modèle pour cette catégorie
        const bestResult = categoryResults.reduce((best, current) => 
          current.overallScore > best.overallScore ? current : best
        );
        const worstResult = categoryResults.reduce((worst, current) => 
          current.overallScore < worst.overallScore ? current : worst
        );
        
        categoryPerf[question.category] = {
          averageScore: avgScore,
          bestModel: bestResult.modelName,
          worstModel: worstResult.modelName
        };
      }
    }
    
    return categoryPerf;
  }
  
  private calculateTestTypePerformance(results: BenchmarkResult[], testTypes: BenchmarkTestType[]) {
    const testTypePerf: any = {};
    
    for (const testType of testTypes) {
      const typeResults = results.filter(r => r.testType === testType);
      
      if (typeResults.length > 0) {
        const scores = typeResults.map(r => r.overallScore);
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const completionRate = (typeResults.filter(r => r.overallScore > 0).length / typeResults.length) * 100;
        
        testTypePerf[testType] = {
          averageScore: avgScore,
          completionRate: completionRate
        };
      }
    }
    
    return testTypePerf;
  }
  
  private getTestTypeDisplayName(testType: BenchmarkTestType): string {
    const displayNames = {
      [BenchmarkTestType.QUALITATIVE]: 'Tests Qualitatifs',
      [BenchmarkTestType.STABILITY]: 'Tests de Stabilité',
      [BenchmarkTestType.API_IO]: 'Tests API/I-O',
      [BenchmarkTestType.REAL_DATA]: 'Tests sur Données Réelles',
      [BenchmarkTestType.PARAMETER]: 'Tests de Paramétrage',
      [BenchmarkTestType.PROMPT_ALTERNATIVE]: 'Tests de Prompts Alternatifs',
      [BenchmarkTestType.SMOKE]: 'Tests Smoke'
    };
    
    return displayNames[testType] || testType;
  }
  
  // Callbacks pour les événements
  public onProgressUpdate?: (execution: BenchmarkExecution) => void;
  public onTestCompleted?: (result: BenchmarkResult) => void;
  public onExecutionCompleted?: (execution: BenchmarkExecution) => void;
  
  // Méthodes utilitaires
  getCurrentExecution(): BenchmarkExecution | null {
    return this.currentExecution;
  }
  
  async cancelExecution(): Promise<void> {
    if (this.currentExecution) {
      this.currentExecution.status = 'cancelled';
      this.currentExecution.completedAt = new Date();
      this.currentExecution = null;
    }
  }
  
  getAvailableTestTypes(): BenchmarkTestType[] {
    return Array.from(this.executors.keys());
  }
}

import {
  BenchmarkQuestion,
  BenchmarkResult,
  BenchmarkConfiguration,
  BenchmarkTestType,
  ModelResponse,
  ApiIoMetrics
} from '../types/benchmark';
import { BaseTestExecutor } from './QualitativeTestExecutor';

// 3️⃣ Tests API / I-O
export class ApiIoTestExecutor extends BaseTestExecutor {
  constructor() {
    super(BenchmarkTestType.API_IO);
  }
  
  async execute(
    question: BenchmarkQuestion,
    models: string[],
    config: BenchmarkConfiguration
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    
    for (const modelName of models) {
      try {
        const metrics = await this.runPerformanceTests(modelName, question, config);
        const overallScore = this.calculateApiIoScore(metrics);
        
        // Effectuer un appel normal pour obtenir une réponse représentative
        const response = await this.callModel(modelName, question.text);
        
        results.push({
          ...this.createBaseResult(question, response),
          apiIoMetrics: metrics,
          overallScore,
          notes: `Performance API évaluée avec ${config.apiIo.concurrentRequests} requêtes concurrentes`
        });
      } catch (error) {
        console.error(`API/IO test failed for ${modelName}:`, error);
        
        // Créer un résultat d'échec
        results.push({
          id: crypto.randomUUID(),
          questionId: question.id,
          modelName,
          testType: this.testType,
          response: {
            id: crypto.randomUUID(),
            modelName,
            response: 'ERROR: Test failed',
            responseTime: 0,
            timestamp: new Date()
          },
          apiIoMetrics: {
            averageResponseTime: 0,
            maxResponseTime: 0,
            minResponseTime: 0,
            errorRate: 100,
            throughput: 0,
            successRate: 0
          },
          overallScore: 0,
          evaluatedAt: new Date(),
          evaluatedBy: 'auto',
          notes: `Test échoué: ${error}`
        });
      }
    }
    
    return results;
  }
  
  private async runPerformanceTests(
    modelName: string,
    question: BenchmarkQuestion,
    config: BenchmarkConfiguration
  ): Promise<ApiIoMetrics> {
    const concurrentRequests = config.apiIo.concurrentRequests || 5;
    const loadTestDuration = config.apiIo.loadTestDuration || 30000; // 30 secondes
    
    console.log(`Starting API/IO test for ${modelName} with ${concurrentRequests} concurrent requests`);
    
    // Test de charge
    const loadTestResults = await this.runLoadTest(
      modelName,
      question.text,
      concurrentRequests,
      loadTestDuration
    );
    
    // Test de stress (augmentation progressive)
    const stressTestResults = await this.runStressTest(
      modelName,
      question.text
    );
    
    // Combiner les résultats
    return this.aggregatePerformanceMetrics(loadTestResults, stressTestResults);
  }
  
  private async runLoadTest(
    modelName: string,
    prompt: string,
    concurrentRequests: number,
    duration: number
  ): Promise<PerformanceTestResult> {
    const results: RequestResult[] = [];
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    const runConcurrentBatch = async (): Promise<RequestResult[]> => {
      const promises = Array(concurrentRequests).fill(null).map(async (_, index) => {
        const requestStartTime = Date.now();
        try {
          const response = await this.callModelWithTimeout(modelName, prompt, 10000); // 10s timeout
          return {
            success: true,
            responseTime: Date.now() - requestStartTime,
            error: null,
            timestamp: new Date()
          };
        } catch (error) {
          return {
            success: false,
            responseTime: Date.now() - requestStartTime,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date()
          };
        }
      });
      
      return Promise.all(promises);
    };
    
    // Exécuter des batches concurrents jusqu'à atteindre la durée
    while (Date.now() < endTime) {
      const batchResults = await runConcurrentBatch();
      results.push(...batchResults);
      
      // Petit délai entre les batches pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return {
      totalRequests: results.length,
      successfulRequests: results.filter(r => r.success).length,
      failedRequests: results.filter(r => !r.success).length,
      responseTimes: results.map(r => r.responseTime),
      duration: Date.now() - startTime,
      errors: results.filter(r => !r.success).map(r => r.error || 'Unknown error')
    };
  }
  
  private async runStressTest(
    modelName: string,
    prompt: string
  ): Promise<PerformanceTestResult> {
    const results: RequestResult[] = [];
    let currentConcurrency = 1;
    const maxConcurrency = 10;
    const incrementStep = 1;
    const testDurationPerLevel = 5000; // 5 secondes par niveau
    
    while (currentConcurrency <= maxConcurrency) {
      console.log(`Stress test level: ${currentConcurrency} concurrent requests`);
      
      const levelStartTime = Date.now();
      const levelEndTime = levelStartTime + testDurationPerLevel;
      
      while (Date.now() < levelEndTime) {
        const promises = Array(currentConcurrency).fill(null).map(async () => {
          const requestStartTime = Date.now();
          try {
            await this.callModelWithTimeout(modelName, prompt, 8000);
            return {
              success: true,
              responseTime: Date.now() - requestStartTime,
              error: null,
              timestamp: new Date()
            };
          } catch (error) {
            return {
              success: false,
              responseTime: Date.now() - requestStartTime,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date()
            };
          }
        });
        
        const batchResults = await Promise.all(promises);
        results.push(...batchResults);
        
        // Vérifier si le taux d'erreur devient trop élevé
        const recentResults = results.slice(-20); // 20 derniers résultats
        const recentErrorRate = recentResults.filter(r => !r.success).length / recentResults.length;
        
        if (recentErrorRate > 0.5) {
          console.log(`High error rate detected at concurrency ${currentConcurrency}, stopping stress test`);
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      currentConcurrency += incrementStep;
    }
    
    return {
      totalRequests: results.length,
      successfulRequests: results.filter(r => r.success).length,
      failedRequests: results.filter(r => !r.success).length,
      responseTimes: results.map(r => r.responseTime),
      duration: 0, // Sera calculé dans l'agrégation
      errors: results.filter(r => !r.success).map(r => r.error || 'Unknown error')
    };
  }
  
  private async callModelWithTimeout(
    modelName: string,
    prompt: string,
    timeoutMs: number
  ): Promise<ModelResponse> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);
      
      try {
        const response = await this.callModel(modelName, prompt);
        clearTimeout(timeout);
        resolve(response);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }
  
  private aggregatePerformanceMetrics(
    loadTest: PerformanceTestResult,
    stressTest: PerformanceTestResult
  ): ApiIoMetrics {
    // Combiner les résultats des deux tests
    const allResponseTimes = [...loadTest.responseTimes, ...stressTest.responseTimes];
    const totalRequests = loadTest.totalRequests + stressTest.totalRequests;
    const totalSuccessful = loadTest.successfulRequests + stressTest.successfulRequests;
    const totalFailed = loadTest.failedRequests + stressTest.failedRequests;
    
    return {
      averageResponseTime: allResponseTimes.length > 0 
        ? allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length 
        : 0,
      maxResponseTime: allResponseTimes.length > 0 
        ? Math.max(...allResponseTimes) 
        : 0,
      minResponseTime: allResponseTimes.length > 0 
        ? Math.min(...allResponseTimes) 
        : 0,
      errorRate: totalRequests > 0 
        ? (totalFailed / totalRequests) * 100 
        : 0,
      throughput: loadTest.duration > 0 
        ? (loadTest.successfulRequests / loadTest.duration) * 1000 // requêtes/seconde
        : 0,
      successRate: totalRequests > 0 
        ? (totalSuccessful / totalRequests) * 100 
        : 0
    };
  }
  
  private calculateApiIoScore(metrics: ApiIoMetrics): number {
    // Scoring basé sur plusieurs critères
    let score = 10;
    
    // Pénalité pour temps de réponse élevé
    if (metrics.averageResponseTime > 5000) { // > 5s
      score -= 3;
    } else if (metrics.averageResponseTime > 3000) { // > 3s
      score -= 2;
    } else if (metrics.averageResponseTime > 1000) { // > 1s
      score -= 1;
    }
    
    // Pénalité pour taux d'erreur
    if (metrics.errorRate > 20) {
      score -= 4;
    } else if (metrics.errorRate > 10) {
      score -= 3;
    } else if (metrics.errorRate > 5) {
      score -= 2;
    } else if (metrics.errorRate > 1) {
      score -= 1;
    }
    
    // Pénalité pour faible throughput
    if (metrics.throughput < 0.1) { // < 0.1 req/s
      score -= 2;
    } else if (metrics.throughput < 0.5) { // < 0.5 req/s
      score -= 1;
    }
    
    // Bonus pour excellent taux de succès
    if (metrics.successRate > 95) {
      score += 1;
    }
    
    // Bonus pour temps de réponse très rapide
    if (metrics.averageResponseTime < 500) {
      score += 1;
    }
    
    return Math.max(0, Math.min(10, score));
  }
  
  validateConfig(config: BenchmarkConfiguration): boolean {
    return config.apiIo !== undefined &&
           typeof config.apiIo.concurrentRequests === 'number' &&
           config.apiIo.concurrentRequests > 0 &&
           typeof config.apiIo.loadTestDuration === 'number' &&
           config.apiIo.loadTestDuration > 0;
  }
  
  getEstimatedDuration(questionCount: number, modelCount: number): number {
    // Durée plus longue pour les tests de performance
    const loadTestDuration = 30000; // 30s par défaut
    const stressTestDuration = 50000; // ~50s par défaut
    const totalTestDuration = loadTestDuration + stressTestDuration;
    
    return questionCount * modelCount * totalTestDuration;
  }
  
  getRequiredModels(): string[] {
    // Les tests API/IO peuvent être effectués sur n'importe quel modèle
    return [];
  }
}

// Interfaces utilitaires pour les tests de performance
interface RequestResult {
  success: boolean;
  responseTime: number;
  error: string | null;
  timestamp: Date;
}

interface PerformanceTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  responseTimes: number[];
  duration: number;
  errors: string[];
}

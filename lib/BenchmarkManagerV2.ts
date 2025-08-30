/**
 * 🎯 NOUVEAU BENCHMARK MANAGER - Version Centralisée
 * 
 * Ce manager utilise la configuration centralisée JSON et les nouvelles APIs
 * pour éliminer tout hardcoding et simplifier l'architecture
 */

import {
  BenchmarkTestType,
  BenchmarkExecution,
  BenchmarkSummary,
  BenchmarkResult
} from './types/benchmark';

/**
 * 🔧 Interface pour les résultats d'exécution simplifiés
 */
interface SimplifiedBenchmarkExecution {
  id: string;
  benchmarkId: string;
  models: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  results: BenchmarkResult[];
  errors: string[];
  summary: SimplifiedBenchmarkSummary;
}

/**
 * 🔧 Interface simplifiée pour le résumé
 */
interface SimplifiedBenchmarkSummary {
  totalTests: number;
  completedTests: number;
  failedTests: number;
  averageScore: number;
  totalExecutionTime: number;
  modelsAnalyzed: number;
  questionsAnalyzed: number;
  testTypesExecuted: number;
}

/**
 * 🎯 Classe BenchmarkManager refactorisée
 * Plus simple, plus modulaire, sans hardcoding
 */
export class BenchmarkManager {
  private currentExecution: SimplifiedBenchmarkExecution | null = null;
  
  // Callbacks pour les logs et progression
  public onProgressUpdate?: (execution: SimplifiedBenchmarkExecution) => void;
  public onDetailedLog?: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  
  constructor() {
    console.log('🎯 [BENCHMARK-MANAGER] Initialisation du nouveau BenchmarkManager centralisé');
  }
  
  /**
   * 🔧 Obtenir la liste des benchmarks disponibles
   */
  async getAvailableBenchmarks(): Promise<any[]> {
    try {
      console.log('📂 [BENCHMARK-MANAGER] Récupération des benchmarks disponibles');
      
      const response = await fetch('/api/benchmark/config');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch benchmarks: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch benchmarks');
      }
      
      const benchmarks = Object.entries(data.data.benchmarks).map(([id, config]: [string, any]) => ({
        id,
        name: config.name,
        description: config.description,
        testTypes: config.testTypes,
        questionCount: config.questions.length,
        version: config.version
      }));
      
      console.log(`✅ [BENCHMARK-MANAGER] ${benchmarks.length} benchmarks disponibles`);
      return benchmarks;
      
    } catch (error) {
      console.error('💥 [BENCHMARK-MANAGER] Erreur lors de la récupération des benchmarks:', error);
      throw error;
    }
  }
  
  /**
   * 🎯 Exécuter un benchmark avec la nouvelle API centralisée
   */
  async executeBenchmark(
    benchmarkId: string,
    models: string[],
    options: {
      iterations?: number;
      saveResults?: boolean;
      customConfig?: {
        temperature?: number;
        maxTokens?: number;
        timeout?: number;
      };
    } = {}
  ): Promise<SimplifiedBenchmarkExecution> {
    
    console.log(`🚀 [BENCHMARK-MANAGER] Démarrage benchmark "${benchmarkId}" pour ${models.length} modèles`);
    this.onDetailedLog?.(`🎯 Démarrage du benchmark "${benchmarkId}"`, 'info');
    this.onDetailedLog?.(`🤖 Modèles: ${models.join(', ')}`, 'info');
    
    // Créer une nouvelle exécution
    const execution: SimplifiedBenchmarkExecution = {
      id: crypto.randomUUID(),
      benchmarkId,
      models,
      status: 'running',
      progress: 0,
      startedAt: new Date(),
      results: [],
      errors: [],
      summary: this.initializeSummary()
    };
    
    this.currentExecution = execution;
    
    try {
      // Appeler l'API d'exécution centralisée
      this.onDetailedLog?.('🔄 Envoi de la requête d\'exécution...', 'info');
      
      const response = await fetch('/api/benchmark/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          benchmarkId,
          models,
          iterations: options.iterations || 1,
          saveResults: options.saveResults !== false,
          customConfig: options.customConfig
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Benchmark execution failed');
      }
      
      // Traiter les résultats
      const apiResults = data.data.results;
      
      this.onDetailedLog?.(`📊 ${apiResults.length} résultats reçus`, 'success');
      
      // Convertir les résultats API en format interne
      execution.results = apiResults.map((result: any) => this.convertApiResultToBenchmarkResult(result));
      
      // Finaliser l'exécution
      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.progress = 100;
      execution.summary = this.generateSummaryFromApiResults(apiResults);
      
      this.onDetailedLog?.('🎉 Benchmark terminé avec succès!', 'success');
      this.onDetailedLog?.(`📈 Score moyen: ${execution.summary.averageScore.toFixed(1)}/100`, 'info');
      
      console.log(`✅ [BENCHMARK-MANAGER] Benchmark "${benchmarkId}" terminé avec succès`);
      
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.progress = 0;
      execution.errors.push(`Execution failed: ${error}`);
      
      this.onDetailedLog?.(`💥 Erreur: ${error}`, 'error');
      console.error(`💥 [BENCHMARK-MANAGER] Erreur lors de l'exécution:`, error);
    }
    
    this.currentExecution = null;
    this.onProgressUpdate?.(execution);
    
    return execution;
  }
  
  /**
   * 🔧 Obtenir l'exécution en cours
   */
  getCurrentExecution(): SimplifiedBenchmarkExecution | null {
    return this.currentExecution;
  }
  
  /**
   * 🔧 Annuler l'exécution en cours (si possible)
   */
  cancelCurrentExecution(): boolean {
    if (this.currentExecution && this.currentExecution.status === 'running') {
      this.currentExecution.status = 'failed';
      this.currentExecution.completedAt = new Date();
      this.currentExecution.errors.push('Execution cancelled by user');
      
      console.log('🛑 [BENCHMARK-MANAGER] Exécution annulée par l\'utilisateur');
      this.onDetailedLog?.('🛑 Exécution annulée', 'warning');
      
      this.currentExecution = null;
      return true;
    }
    
    return false;
  }
  
  /**
   * 🔧 Récupérer l'historique des exécutions
   */
  async getBenchmarkHistory(): Promise<any[]> {
    try {
      console.log('📋 [BENCHMARK-MANAGER] Récupération de l\'historique');
      
      const response = await fetch('/api/benchmark/history');
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ [BENCHMARK-MANAGER] ${data.length || 0} entrées d'historique récupérées`);
        return data;
      } else {
        console.log('⚠️ [BENCHMARK-MANAGER] Aucun historique trouvé');
        return [];
      }
      
    } catch (error) {
      console.error('💥 [BENCHMARK-MANAGER] Erreur récupération historique:', error);
      return [];
    }
  }
  
  /**
   * 🔧 Convertir un résultat API en BenchmarkResult
   */
  private convertApiResultToBenchmarkResult(apiResult: any): BenchmarkResult {
    return {
      id: crypto.randomUUID(),
      questionId: apiResult.benchmarkId,
      modelName: apiResult.model,
      testType: BenchmarkTestType.QUALITATIVE, // Par défaut, pourrait être dérivé de la config
      response: {
        id: crypto.randomUUID(),
        modelName: apiResult.model,
        response: apiResult.results.map((r: any) => r.response).join('\n'),
        responseTime: apiResult.duration,
        timestamp: new Date(apiResult.startTime)
      },
      overallScore: apiResult.overallScore,
      evaluatedAt: new Date(apiResult.startTime),
      evaluatedBy: 'auto'
    };
  }
  
  /**
   * 🔧 Générer un résumé à partir des résultats API
   */
  private generateSummaryFromApiResults(apiResults: any[]): SimplifiedBenchmarkSummary {
    const totalTests = apiResults.reduce((sum, result) => sum + result.metadata.totalQuestions, 0);
    const successfulTests = apiResults.reduce((sum, result) => sum + result.metadata.successfulQuestions, 0);
    const failedTests = totalTests - successfulTests;
    
    const averageScore = apiResults.reduce((sum, result) => sum + result.overallScore, 0) / apiResults.length;
    const totalExecutionTime = apiResults.reduce((sum, result) => sum + result.duration, 0);
    
    return {
      totalTests,
      completedTests: totalTests,
      failedTests,
      averageScore,
      totalExecutionTime,
      modelsAnalyzed: Array.from(new Set(apiResults.map(r => r.model))).length,
      questionsAnalyzed: apiResults.length > 0 ? apiResults[0].metadata.totalQuestions : 0,
      testTypesExecuted: 1 // Simplifié pour l'instant
    };
  }
  
  /**
   * 🔧 Initialiser un résumé vide
   */
  private initializeSummary(): SimplifiedBenchmarkSummary {
    return {
      totalTests: 0,
      completedTests: 0,
      failedTests: 0,
      averageScore: 0,
      totalExecutionTime: 0,
      modelsAnalyzed: 0,
      questionsAnalyzed: 0,
      testTypesExecuted: 0
    };
  }
  
  /**
   * 🔧 Obtenir les statistiques détaillées d'une exécution
   */
  getExecutionStats(execution: SimplifiedBenchmarkExecution): {
    modelsStats: Map<string, { score: number; questionsAnswered: number }>;
    categoryStats: Map<string, { averageScore: number; totalQuestions: number }>;
    difficultyStats: Map<string, { averageScore: number; totalQuestions: number }>;
  } {
    const modelsStats = new Map();
    const categoryStats = new Map();
    const difficultyStats = new Map();
    
    // Traiter chaque résultat pour construire les stats
    execution.results.forEach(result => {
      // Stats par modèle
      if (!modelsStats.has(result.modelName)) {
        modelsStats.set(result.modelName, { score: 0, questionsAnswered: 0 });
      }
      const modelStat = modelsStats.get(result.modelName);
      modelStat.score += result.overallScore;
      modelStat.questionsAnswered++;
    });
    
    // Calculer les moyennes
    modelsStats.forEach((stat, model) => {
      stat.score = stat.score / stat.questionsAnswered;
    });
    
    return {
      modelsStats,
      categoryStats,
      difficultyStats
    };
  }
  
  /**
   * 🔧 Valider qu'un modèle est disponible
   */
  async validateModel(modelName: string): Promise<boolean> {
    try {
      console.log(`🔍 [BENCHMARK-MANAGER] Validation du modèle: ${modelName}`);
      
      const response = await fetch('/api/models');
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      const availableModels = data.models || [];
      
      const isValid = availableModels.some((model: any) => 
        model.name === modelName || model.id === modelName
      );
      
      console.log(`${isValid ? '✅' : '❌'} [BENCHMARK-MANAGER] Modèle ${modelName}: ${isValid ? 'valide' : 'non trouvé'}`);
      
      return isValid;
      
    } catch (error) {
      console.error(`💥 [BENCHMARK-MANAGER] Erreur validation modèle ${modelName}:`, error);
      return false;
    }
  }
}

// Export de l'instance singleton
export const benchmarkManager = new BenchmarkManager();

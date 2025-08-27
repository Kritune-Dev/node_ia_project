import {
  BenchmarkQuestion,
  BenchmarkResult,
  BenchmarkConfiguration,
  BenchmarkTestType,
  ModelResponse,
  ParameterMetrics
} from '../types/benchmark';
import { BaseTestExecutor } from './QualitativeTestExecutor';

// 5️⃣ Tests de Paramétrage
export class ParameterTestExecutor extends BaseTestExecutor {
  constructor() {
    super(BenchmarkTestType.PARAMETER);
  }
  
  async execute(
    question: BenchmarkQuestion,
    models: string[],
    config: BenchmarkConfiguration
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    
    for (const modelName of models) {
      try {
        const metrics = await this.runParameterSweep(modelName, question, config);
        const overallScore = this.calculateParameterScore(metrics);
        
        // Utiliser les paramètres optimaux pour la réponse finale
        const optimalResponse = await this.callModel(
          modelName, 
          question.text, 
          metrics.optimalParameters
        );
        
        results.push({
          ...this.createBaseResult(question, optimalResponse),
          parameterMetrics: metrics,
          overallScore,
          notes: `Paramètres optimaux trouvés: ${JSON.stringify(metrics.optimalParameters)}`
        });
      } catch (error) {
        console.error(`Parameter test failed for ${modelName}:`, error);
      }
    }
    
    return results;
  }
  
  private async runParameterSweep(
    modelName: string,
    question: BenchmarkQuestion,
    config: BenchmarkConfiguration
  ): Promise<ParameterMetrics> {
    // Définir la grille de paramètres à tester
    const parameterGrid = this.createParameterGrid(config);
    const results: ParameterTestResult[] = [];
    
    // Tester chaque combinaison de paramètres
    for (const parameterSet of parameterGrid) {
      try {
        const responses = await this.testParameterSet(modelName, question, parameterSet);
        const quality = this.evaluateResponseQuality(responses, question);
        const consistency = this.evaluateConsistency(responses);
        
        results.push({
          parameters: parameterSet,
          responses,
          quality,
          consistency,
          averageResponseTime: responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length
        });
      } catch (error) {
        console.warn(`Parameter set failed:`, parameterSet, error);
      }
    }
    
    return this.analyzeParameterResults(results);
  }
  
  private createParameterGrid(config: BenchmarkConfiguration): Record<string, any>[] {
    const { parameter } = config;
    const grid: Record<string, any>[] = [];
    
    // Créer une grille de températures
    const [minTemp, maxTemp] = parameter.temperatureRange;
    const tempSteps = parameter.temperatureSteps;
    const tempStep = (maxTemp - minTemp) / (tempSteps - 1);
    
    const temperatures = Array.from({ length: tempSteps }, (_, i) => 
      Number((minTemp + i * tempStep).toFixed(2))
    );
    
    // Combiner avec d'autres paramètres
    const otherParamKeys = Object.keys(parameter.otherParams);
    
    if (otherParamKeys.length === 0) {
      // Seulement la température
      return temperatures.map(temp => ({ temperature: temp }));
    }
    
    // Combiner température avec un autre paramètre (pour limiter la complexité)
    const firstOtherParam = otherParamKeys[0];
    const firstOtherValues = parameter.otherParams[firstOtherParam];
    
    for (const temp of temperatures) {
      for (const otherValue of firstOtherValues) {
        grid.push({
          temperature: temp,
          [firstOtherParam]: otherValue
        });
      }
    }
    
    return grid;
  }
  
  private async testParameterSet(
    modelName: string,
    question: BenchmarkQuestion,
    parameters: Record<string, any>,
    iterations: number = 3
  ): Promise<ModelResponse[]> {
    const responses: ModelResponse[] = [];
    
    for (let i = 0; i < iterations; i++) {
      try {
        const response = await this.callModel(modelName, question.text, parameters);
        responses.push(response);
        
        // Petit délai entre les appels
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.warn(`Parameter test iteration ${i + 1} failed:`, error);
      }
    }
    
    return responses;
  }
  
  private evaluateResponseQuality(responses: ModelResponse[], question: BenchmarkQuestion): number {
    if (responses.length === 0) return 0;
    
    let totalQuality = 0;
    
    for (const response of responses) {
      let quality = 5; // Score de base
      
      // Évaluer la longueur appropriée
      const expectedLength = question.expectedAnswerLength || 200;
      const lengthRatio = response.response.length / expectedLength;
      
      if (lengthRatio >= 0.5 && lengthRatio <= 2.0) {
        quality += 2; // Longueur appropriée
      }
      
      // Évaluer la cohérence du texte
      const sentences = response.response.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length >= 2) {
        quality += 1; // Structure en phrases
      }
      
      // Vérifier la présence de mots-clés pertinents
      if (question.keywords) {
        const responseText = response.response.toLowerCase();
        const keywordMatches = question.keywords.filter(keyword => 
          responseText.includes(keyword.toLowerCase())
        );
        quality += (keywordMatches.length / question.keywords.length) * 2;
      }
      
      totalQuality += quality;
    }
    
    return totalQuality / responses.length;
  }
  
  private evaluateConsistency(responses: ModelResponse[]): number {
    if (responses.length < 2) return 10; // Parfait si une seule réponse
    
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        const similarity = this.calculateTextSimilarity(responses[i].response, responses[j].response);
        totalSimilarity += similarity;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? (totalSimilarity / comparisons) * 10 : 10;
  }
  
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = this.tokenize(text1);
    const words2 = this.tokenize(text2);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = words1.filter(word => set2.has(word));
    const union = [...words1, ...words2.filter(word => !set1.has(word))];
    
    return union.length > 0 ? intersection.length / union.length : 1;
  }
  
  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }
  
  private analyzeParameterResults(results: ParameterTestResult[]): ParameterMetrics {
    if (results.length === 0) {
      throw new Error('No parameter test results to analyze');
    }
    
    // Trouver les paramètres optimaux
    const bestResult = results.reduce((best, current) => {
      const bestScore = (best.quality * 0.7) + (best.consistency * 0.3);
      const currentScore = (current.quality * 0.7) + (current.consistency * 0.3);
      return currentScore > bestScore ? current : best;
    });
    
    // Calculer l'impact de la température
    const temperatureImpact = this.calculateTemperatureImpact(results);
    
    // Calculer la sensibilité aux paramètres
    const parameterSensitivity = this.calculateParameterSensitivity(results);
    
    // Calculer la consistance globale
    const consistencyValues = results.map(r => r.consistency);
    const consistencyAcrossParams = consistencyValues.reduce((sum, val) => sum + val, 0) / consistencyValues.length;
    
    return {
      temperatureImpact,
      consistencyAcrossParams,
      optimalParameters: bestResult.parameters,
      parameterSensitivity
    };
  }
  
  private calculateTemperatureImpact(results: ParameterTestResult[]): number {
    // Grouper les résultats par température
    const tempGroups = new Map<number, ParameterTestResult[]>();
    
    for (const result of results) {
      const temp = result.parameters.temperature;
      if (!tempGroups.has(temp)) {
        tempGroups.set(temp, []);
      }
      tempGroups.get(temp)!.push(result);
    }
    
    if (tempGroups.size < 2) return 0; // Pas assez de variations
    
    // Calculer la variance des scores de qualité entre températures
    const tempScores = Array.from(tempGroups.entries()).map(([temp, results]) => {
      const avgQuality = results.reduce((sum, r) => sum + r.quality, 0) / results.length;
      return { temp, quality: avgQuality };
    });
    
    const qualities = tempScores.map(ts => ts.quality);
    const avgQuality = qualities.reduce((sum, q) => sum + q, 0) / qualities.length;
    const variance = qualities.reduce((sum, q) => sum + Math.pow(q - avgQuality, 2), 0) / qualities.length;
    
    // Normaliser l'impact (0-10)
    return Math.min(10, variance * 2);
  }
  
  private calculateParameterSensitivity(results: ParameterTestResult[]): Record<string, number> {
    const sensitivity: Record<string, number> = {};
    
    // Analyser chaque paramètre
    const paramNames = Object.keys(results[0]?.parameters || {});
    
    for (const paramName of paramNames) {
      const paramValues = new Map<any, ParameterTestResult[]>();
      
      // Grouper par valeur de paramètre
      for (const result of results) {
        const value = result.parameters[paramName];
        if (!paramValues.has(value)) {
          paramValues.set(value, []);
        }
        paramValues.get(value)!.push(result);
      }
      
      if (paramValues.size >= 2) {
        // Calculer la variance des scores
        const valueScores = Array.from(paramValues.entries()).map(([value, results]) => {
          const avgScore = results.reduce((sum, r) => sum + r.quality, 0) / results.length;
          return avgScore;
        });
        
        const avgScore = valueScores.reduce((sum, s) => sum + s, 0) / valueScores.length;
        const variance = valueScores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / valueScores.length;
        
        sensitivity[paramName] = Math.min(10, variance * 2);
      } else {
        sensitivity[paramName] = 0;
      }
    }
    
    return sensitivity;
  }
  
  private calculateParameterScore(metrics: ParameterMetrics): number {
    // Score basé sur l'optimisation des paramètres
    let score = 5; // Score de base
    
    // Bonus pour une température optimale trouvée
    const optimalTemp = metrics.optimalParameters.temperature;
    if (optimalTemp >= 0.3 && optimalTemp <= 0.8) {
      score += 2; // Température dans une plage raisonnable
    }
    
    // Bonus pour la consistance
    if (metrics.consistencyAcrossParams >= 7) {
      score += 2;
    } else if (metrics.consistencyAcrossParams >= 5) {
      score += 1;
    }
    
    // Bonus pour une sensibilité appropriée (ni trop sensible, ni trop rigide)
    const avgSensitivity = Object.values(metrics.parameterSensitivity)
      .reduce((sum, val) => sum + val, 0) / Object.values(metrics.parameterSensitivity).length;
    
    if (avgSensitivity >= 2 && avgSensitivity <= 6) {
      score += 1; // Sensibilité modérée = bon
    }
    
    return Math.min(10, Math.max(0, score));
  }
  
  validateConfig(config: BenchmarkConfiguration): boolean {
    return config.parameter !== undefined &&
           Array.isArray(config.parameter.temperatureRange) &&
           config.parameter.temperatureRange.length === 2 &&
           typeof config.parameter.temperatureSteps === 'number' &&
           config.parameter.temperatureSteps > 1 &&
           typeof config.parameter.otherParams === 'object';
  }
  
  getEstimatedDuration(questionCount: number, modelCount: number): number {
    // Très long car teste plusieurs combinaisons de paramètres
    const tempSteps = 5; // Par défaut
    const otherParamCombinations = 3; // Par défaut
    const iterations = 3; // Par combinaison
    
    return questionCount * modelCount * tempSteps * otherParamCombinations * iterations * 30000; // 30s par test
  }
  
  getRequiredModels(): string[] {
    // Recommander des modèles qui supportent la variation de paramètres
    return ['llama2:7b', 'mistral:7b'];
  }
}

// Interface pour les résultats de test de paramètres
interface ParameterTestResult {
  parameters: Record<string, any>;
  responses: ModelResponse[];
  quality: number;
  consistency: number;
  averageResponseTime: number;
}

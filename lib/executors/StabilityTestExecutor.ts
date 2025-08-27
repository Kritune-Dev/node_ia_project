import {
  BenchmarkQuestion,
  BenchmarkResult,
  BenchmarkConfiguration,
  BenchmarkTestType,
  ModelResponse,
  StabilityMetrics
} from '../types/benchmark';
import { BaseTestExecutor } from './QualitativeTestExecutor';

// 2️⃣ Tests de Stabilité
export class StabilityTestExecutor extends BaseTestExecutor {
  constructor() {
    super(BenchmarkTestType.STABILITY);
  }
  
  async execute(
    question: BenchmarkQuestion,
    models: string[],
    config: BenchmarkConfiguration
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    const iterationCount = config.stability.iterationCount || 5;
    
    for (const modelName of models) {
      try {
        const responses = await this.runMultipleIterations(
          modelName,
          question,
          iterationCount
        );
        
        const metrics = this.evaluateStability(responses, config);
        const overallScore = this.calculateStabilityScore(metrics);
        
        // Utiliser la première réponse comme réponse représentative
        const representativeResponse = responses[0];
        
        results.push({
          ...this.createBaseResult(question, representativeResponse),
          stabilityMetrics: metrics,
          overallScore,
          notes: `Stabilité évaluée sur ${iterationCount} itérations`
        });
      } catch (error) {
        console.error(`Stability test failed for ${modelName}:`, error);
      }
    }
    
    return results;
  }
  
  private async runMultipleIterations(
    modelName: string,
    question: BenchmarkQuestion,
    iterationCount: number
  ): Promise<ModelResponse[]> {
    const responses: ModelResponse[] = [];
    
    for (let i = 0; i < iterationCount; i++) {
      try {
        // Légère variation des paramètres pour tester la stabilité
        const temperature = 0.7 + (Math.random() - 0.5) * 0.2; // Variation de ±0.1
        
        const response = await this.callModel(modelName, question.text, {
          temperature,
          seed: Math.floor(Math.random() * 1000000) // Seed aléatoire
        });
        
        responses.push(response);
        
        // Petit délai entre les appels pour éviter la surcharge
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn(`Iteration ${i + 1} failed for ${modelName}:`, error);
      }
    }
    
    if (responses.length === 0) {
      throw new Error(`No successful responses for ${modelName}`);
    }
    
    return responses;
  }
  
  private evaluateStability(
    responses: ModelResponse[],
    config: BenchmarkConfiguration
  ): StabilityMetrics {
    const responseTexts = responses.map(r => r.response);
    const responseTimes = responses.map(r => r.responseTime);
    
    return {
      consistency: this.calculateConsistency(responseTexts, config),
      variability: this.calculateVariability(responseTexts),
      convergenceRate: this.calculateConvergenceRate(responseTexts, config),
      outlierCount: this.countOutliers(responseTimes)
    };
  }
  
  private calculateConsistency(
    responses: string[],
    config: BenchmarkConfiguration
  ): number {
    if (responses.length < 2) return 10;
    
    const threshold = config.stability.consistencyThreshold || 0.7;
    let totalSimilarity = 0;
    let comparisons = 0;
    
    // Comparer chaque réponse avec toutes les autres
    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        const similarity = this.calculateTextSimilarity(responses[i], responses[j]);
        totalSimilarity += similarity;
        comparisons++;
      }
    }
    
    const averageSimilarity = totalSimilarity / comparisons;
    
    // Convertir en score 0-10
    return Math.min(10, (averageSimilarity / threshold) * 10);
  }
  
  private calculateVariability(responses: string[]): number {
    if (responses.length < 2) return 0;
    
    // Calculer la variabilité basée sur la longueur des réponses
    const lengths = responses.map(r => r.length);
    const meanLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    
    const variance = lengths.reduce((acc, length) => {
      return acc + Math.pow(length - meanLength, 2);
    }, 0) / lengths.length;
    
    const standardDeviation = Math.sqrt(variance);
    
    // Normaliser par rapport à la longueur moyenne
    return meanLength > 0 ? (standardDeviation / meanLength) * 100 : 0;
  }
  
  private calculateConvergenceRate(
    responses: string[],
    config: BenchmarkConfiguration
  ): number {
    if (responses.length < 3) return 100;
    
    const threshold = config.stability.consistencyThreshold || 0.7;
    let convergentResponses = 0;
    
    // Grouper les réponses similaires
    const groups: string[][] = [];
    
    for (const response of responses) {
      let foundGroup = false;
      
      for (const group of groups) {
        const similarity = this.calculateTextSimilarity(response, group[0]);
        if (similarity >= threshold) {
          group.push(response);
          foundGroup = true;
          break;
        }
      }
      
      if (!foundGroup) {
        groups.push([response]);
      }
    }
    
    // Le groupe le plus large représente la convergence
    const largestGroup = Math.max(...groups.map(g => g.length));
    return (largestGroup / responses.length) * 100;
  }
  
  private countOutliers(responseTimes: number[]): number {
    if (responseTimes.length < 3) return 0;
    
    // Calculer Q1, Q3 et IQR
    const sorted = [...responseTimes].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return responseTimes.filter(time => time < lowerBound || time > upperBound).length;
  }
  
  private calculateTextSimilarity(text1: string, text2: string): number {
    // Similarity basée sur les mots communs (Jaccard similarity)
    const words1 = new Set(this.tokenize(text1));
    const words2 = new Set(this.tokenize(text2));
    
    const words1Array = Array.from(words1);
    const words2Array = Array.from(words2);
    
    const intersection = new Set(words1Array.filter(word => words2.has(word)));
    const union = new Set([...words1Array, ...words2Array]);
    
    if (union.size === 0) return 1; // Deux textes vides sont identiques
    
    const jaccardSimilarity = intersection.size / union.size;
    
    // Ajouter une composante basée sur la similarité de longueur
    const lengthSimilarity = 1 - Math.abs(text1.length - text2.length) / Math.max(text1.length, text2.length);
    
    // Combiner les deux métriques
    return (jaccardSimilarity * 0.8) + (lengthSimilarity * 0.2);
  }
  
  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }
  
  private calculateStabilityScore(metrics: StabilityMetrics): number {
    // Pondération des métriques
    const weights = {
      consistency: 0.4,
      convergenceRate: 0.3,
      variability: 0.2,  // Inversé : moins de variabilité = meilleur score
      outlierCount: 0.1  // Inversé : moins d'outliers = meilleur score
    };
    
    // Normaliser les métriques
    const normalizedConsistency = Math.min(10, metrics.consistency);
    const normalizedConvergence = (metrics.convergenceRate / 100) * 10;
    const normalizedVariability = Math.max(0, 10 - (metrics.variability / 10)); // Inverser
    const normalizedOutliers = Math.max(0, 10 - metrics.outlierCount); // Inverser
    
    const score = 
      normalizedConsistency * weights.consistency +
      normalizedConvergence * weights.convergenceRate +
      normalizedVariability * weights.variability +
      normalizedOutliers * weights.outlierCount;
    
    return Math.round(score * 10) / 10;
  }
  
  validateConfig(config: BenchmarkConfiguration): boolean {
    return config.stability !== undefined &&
           typeof config.stability.iterationCount === 'number' &&
           config.stability.iterationCount > 1 &&
           typeof config.stability.consistencyThreshold === 'number' &&
           config.stability.consistencyThreshold > 0 &&
           config.stability.consistencyThreshold <= 1;
  }
  
  getEstimatedDuration(questionCount: number, modelCount: number): number {
    // Plus long car multiple itérations par test
    const iterationCount = 5; // Valeur par défaut
    return questionCount * modelCount * iterationCount * 35000; // 35s par itération
  }
  
  getRequiredModels(): string[] {
    // Les tests de stabilité nécessitent au moins un modèle déterministe pour calibration
    return ['llama2:7b']; // Modèle de référence recommandé
  }
}

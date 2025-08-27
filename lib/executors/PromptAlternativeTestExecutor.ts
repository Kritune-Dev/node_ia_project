import {
  BenchmarkQuestion,
  BenchmarkResult,
  BenchmarkConfiguration,
  BenchmarkTestType,
  ModelResponse,
  PromptAlternativeMetrics
} from '../types/benchmark';
import { BaseTestExecutor } from './QualitativeTestExecutor';

// 6️⃣ Tests avec Prompts Alternatifs
export class PromptAlternativeTestExecutor extends BaseTestExecutor {
  constructor() {
    super(BenchmarkTestType.PROMPT_ALTERNATIVE);
  }
  
  async execute(
    question: BenchmarkQuestion,
    models: string[],
    config: BenchmarkConfiguration
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    
    for (const modelName of models) {
      try {
        const metrics = await this.runPromptVariationTests(modelName, question, config);
        const overallScore = this.calculatePromptAlternativeScore(metrics);
        
        // Utiliser le meilleur prompt pour la réponse finale
        const bestPrompt = metrics.bestPromptVariant;
        const finalResponse = await this.callModel(modelName, bestPrompt);
        
        results.push({
          ...this.createBaseResult(question, finalResponse),
          promptAlternativeMetrics: metrics,
          overallScore,
          notes: `Meilleur prompt trouvé: "${this.truncatePrompt(bestPrompt)}"`
        });
      } catch (error) {
        console.error(`Prompt alternative test failed for ${modelName}:`, error);
      }
    }
    
    return results;
  }
  
  private async runPromptVariationTests(
    modelName: string,
    question: BenchmarkQuestion,
    config: BenchmarkConfiguration
  ): Promise<PromptAlternativeMetrics> {
    // Générer des variations de prompt
    const promptVariants = this.generatePromptVariants(question, config);
    const results: PromptTestResult[] = [];
    
    for (const variant of promptVariants) {
      try {
        const responses = await this.testPromptVariant(modelName, variant);
        const quality = this.evaluatePromptQuality(responses, question);
        const consistency = this.evaluatePromptConsistency(responses);
        
        results.push({
          prompt: variant.prompt,
          variant: variant.type,
          responses,
          quality,
          consistency,
          averageResponseTime: responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length
        });
      } catch (error) {
        console.warn(`Prompt variant failed:`, variant.type, error);
      }
    }
    
    return this.analyzePromptResults(results, config);
  }
  
  private generatePromptVariants(
    question: BenchmarkQuestion,
    config: BenchmarkConfiguration
  ): PromptVariant[] {
    const basePrompt = question.text;
    const variants: PromptVariant[] = [];
    
    // Si des variantes sont spécifiées dans la config, les utiliser
    if (config.promptAlternative.promptVariants && config.promptAlternative.promptVariants.length > 0) {
      for (const variantTemplate of config.promptAlternative.promptVariants) {
        variants.push({
          type: 'custom',
          prompt: variantTemplate.replace('{question}', basePrompt)
        });
      }
    } else {
      // Générer des variantes automatiquement
      variants.push(...this.generateAutomaticVariants(basePrompt, question));
    }
    
    // Toujours inclure le prompt original
    variants.unshift({
      type: 'original',
      prompt: basePrompt
    });
    
    return variants;
  }
  
  private generateAutomaticVariants(basePrompt: string, question: BenchmarkQuestion): PromptVariant[] {
    const variants: PromptVariant[] = [];
    
    // 1. Style direct et concis
    variants.push({
      type: 'direct',
      prompt: `Please answer directly: ${basePrompt}`
    });
    
    // 2. Style explicatif détaillé
    variants.push({
      type: 'detailed',
      prompt: `Please provide a detailed explanation for the following question. Include your reasoning process and consider multiple perspectives: ${basePrompt}`
    });
    
    // 3. Style step-by-step
    variants.push({
      type: 'step_by_step',
      prompt: `Let's approach this step by step. ${basePrompt}\n\nPlease break down your answer into clear steps.`
    });
    
    // 4. Style avec contraintes
    variants.push({
      type: 'constrained',
      prompt: `${basePrompt}\n\nPlease provide a concise answer in 2-3 sentences, focusing on the most important points.`
    });
    
    // 5. Style créatif (pour certaines catégories)
    if (question.category === 'creative_writing') {
      variants.push({
        type: 'creative',
        prompt: `Use your imagination and creativity to answer: ${basePrompt}\n\nFeel free to be original and think outside the box.`
      });
    }
    
    // 6. Style analytique (pour questions techniques)
    if (question.category === 'technical_analysis' || question.category === 'math_problem') {
      variants.push({
        type: 'analytical',
        prompt: `Analyze the following question systematically: ${basePrompt}\n\nProvide a logical, well-structured analysis with supporting evidence.`
      });
    }
    
    // 7. Style conversationnel
    variants.push({
      type: 'conversational',
      prompt: `I'd like to discuss this question with you: ${basePrompt}\n\nWhat are your thoughts on this?`
    });
    
    // 8. Style avec contexte
    variants.push({
      type: 'contextual',
      prompt: `Context: You are an expert assistant helping to answer this question.\n\nQuestion: ${basePrompt}\n\nPlease provide your expert response.`
    });
    
    return variants;
  }
  
  private async testPromptVariant(
    modelName: string,
    variant: PromptVariant,
    iterations: number = 2
  ): Promise<ModelResponse[]> {
    const responses: ModelResponse[] = [];
    
    for (let i = 0; i < iterations; i++) {
      try {
        const response = await this.callModel(modelName, variant.prompt, {
          temperature: 0.7 // Température modérée pour la comparaison
        });
        responses.push(response);
        
        // Petit délai entre les appels
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.warn(`Prompt variant iteration ${i + 1} failed:`, error);
      }
    }
    
    return responses;
  }
  
  private evaluatePromptQuality(responses: ModelResponse[], question: BenchmarkQuestion): number {
    if (responses.length === 0) return 0;
    
    let totalQuality = 0;
    
    for (const response of responses) {
      let quality = this.calculateResponseQuality(response, question);
      totalQuality += quality;
    }
    
    return totalQuality / responses.length;
  }
  
  private calculateResponseQuality(response: ModelResponse, question: BenchmarkQuestion): number {
    let quality = 5; // Score de base
    
    // Évaluer la pertinence
    quality += this.evaluateRelevance(response, question);
    
    // Évaluer la complétude
    quality += this.evaluateCompleteness(response, question);
    
    // Évaluer la clarté
    quality += this.evaluateClarity(response);
    
    return Math.min(10, quality);
  }
  
  private evaluateRelevance(response: ModelResponse, question: BenchmarkQuestion): number {
    const responseText = response.response.toLowerCase();
    
    // Vérifier la présence de mots-clés
    let relevanceScore = 0;
    if (question.keywords) {
      const keywordMatches = question.keywords.filter(keyword => 
        responseText.includes(keyword.toLowerCase())
      );
      relevanceScore = (keywordMatches.length / question.keywords.length) * 2;
    } else {
      // Heuristique basée sur les mots de la question
      const questionWords = this.extractKeywords(question.text);
      const responseWords = this.extractKeywords(response.response);
      const overlap = questionWords.filter(word => responseWords.includes(word));
      relevanceScore = Math.min(2, (overlap.length / questionWords.length) * 2);
    }
    
    return relevanceScore;
  }
  
  private evaluateCompleteness(response: ModelResponse, question: BenchmarkQuestion): number {
    const expectedLength = question.expectedAnswerLength || 200;
    const actualLength = response.response.length;
    
    // Score basé sur la longueur appropriée
    let completenessScore = 0;
    if (actualLength >= expectedLength * 0.7 && actualLength <= expectedLength * 2) {
      completenessScore = 2;
    } else if (actualLength >= expectedLength * 0.5 && actualLength <= expectedLength * 3) {
      completenessScore = 1;
    }
    
    return completenessScore;
  }
  
  private evaluateClarity(response: ModelResponse): number {
    const text = response.response;
    let clarityScore = 0;
    
    // Vérifier la structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 2) {
      clarityScore += 0.5;
    }
    
    // Vérifier la présence de connecteurs logiques
    const connectors = ['however', 'therefore', 'because', 'since', 'although', 'moreover'];
    const hasConnectors = connectors.some(conn => text.toLowerCase().includes(conn));
    if (hasConnectors) {
      clarityScore += 0.5;
    }
    
    // Vérifier l'absence de répétitions excessives
    const repetitionPenalty = this.detectRepetitions(text);
    clarityScore -= repetitionPenalty * 0.5;
    
    return Math.max(0, Math.min(1, clarityScore));
  }
  
  private extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));
  }
  
  private isStopWord(word: string): boolean {
    const stopWords = new Set(['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'their', 'said', 'each', 'which', 'what', 'were', 'when', 'where', 'more', 'some', 'like', 'into', 'time', 'very', 'only', 'other']);
    return stopWords.has(word);
  }
  
  private detectRepetitions(text: string): number {
    const sentences = text.split(/[.!?]+/);
    const seen = new Set();
    let repetitions = 0;
    
    for (const sentence of sentences) {
      const normalized = sentence.trim().toLowerCase();
      if (normalized.length > 10) {
        if (seen.has(normalized)) {
          repetitions++;
        }
        seen.add(normalized);
      }
    }
    
    return repetitions;
  }
  
  private evaluatePromptConsistency(responses: ModelResponse[]): number {
    if (responses.length < 2) return 10;
    
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
    const words1 = this.extractKeywords(text1);
    const words2 = this.extractKeywords(text2);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = words1.filter(word => set2.has(word));
    const union = [...words1, ...words2.filter(word => !set1.has(word))];
    
    return union.length > 0 ? intersection.length / union.length : 1;
  }
  
  private analyzePromptResults(
    results: PromptTestResult[],
    config: BenchmarkConfiguration
  ): PromptAlternativeMetrics {
    if (results.length === 0) {
      throw new Error('No prompt test results to analyze');
    }
    
    // Trouver le meilleur prompt
    const evaluationMethod = config.promptAlternative.evaluationMethod || 'quality';
    const bestResult = this.findBestPrompt(results, evaluationMethod);
    
    // Calculer la sensibilité aux prompts
    const promptSensitivity = this.calculatePromptSensitivity(results);
    
    // Calculer la consistance globale
    const consistencyValues = results.map(r => r.consistency);
    const consistencyAcrossPrompts = consistencyValues.reduce((sum, val) => sum + val, 0) / consistencyValues.length;
    
    // Calculer l'amélioration par rapport au prompt original
    const originalResult = results.find(r => r.variant === 'original');
    const improvementFromOptimization = originalResult ? 
      ((bestResult.quality - originalResult.quality) / originalResult.quality) * 100 : 0;
    
    return {
      bestPromptVariant: bestResult.prompt,
      promptSensitivity,
      consistencyAcrossPrompts,
      improvementFromOptimization: Math.max(0, improvementFromOptimization)
    };
  }
  
  private findBestPrompt(results: PromptTestResult[], method: string): PromptTestResult {
    switch (method) {
      case 'similarity':
        return results.reduce((best, current) => 
          current.consistency > best.consistency ? current : best
        );
      case 'both':
        return results.reduce((best, current) => {
          const bestScore = (best.quality * 0.7) + (best.consistency * 0.3);
          const currentScore = (current.quality * 0.7) + (current.consistency * 0.3);
          return currentScore > bestScore ? current : best;
        });
      default: // 'quality'
        return results.reduce((best, current) => 
          current.quality > best.quality ? current : best
        );
    }
  }
  
  private calculatePromptSensitivity(results: PromptTestResult[]): number {
    if (results.length < 2) return 0;
    
    const qualities = results.map(r => r.quality);
    const avgQuality = qualities.reduce((sum, q) => sum + q, 0) / qualities.length;
    const variance = qualities.reduce((sum, q) => sum + Math.pow(q - avgQuality, 2), 0) / qualities.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Normaliser en score 0-10
    return Math.min(10, standardDeviation * 2);
  }
  
  private calculatePromptAlternativeScore(metrics: PromptAlternativeMetrics): number {
    let score = 5; // Score de base
    
    // Bonus pour l'amélioration par optimisation
    if (metrics.improvementFromOptimization > 20) {
      score += 3;
    } else if (metrics.improvementFromOptimization > 10) {
      score += 2;
    } else if (metrics.improvementFromOptimization > 5) {
      score += 1;
    }
    
    // Bonus pour une bonne consistance
    if (metrics.consistencyAcrossPrompts >= 7) {
      score += 2;
    } else if (metrics.consistencyAcrossPrompts >= 5) {
      score += 1;
    }
    
    // Ajustement basé sur la sensibilité
    if (metrics.promptSensitivity >= 3 && metrics.promptSensitivity <= 7) {
      score += 1; // Sensibilité modérée est bonne
    }
    
    return Math.min(10, Math.max(0, score));
  }
  
  private truncatePrompt(prompt: string): string {
    return prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt;
  }
  
  validateConfig(config: BenchmarkConfiguration): boolean {
    return config.promptAlternative !== undefined &&
           Array.isArray(config.promptAlternative.promptVariants) &&
           typeof config.promptAlternative.evaluationMethod === 'string' &&
           ['similarity', 'quality', 'both'].includes(config.promptAlternative.evaluationMethod);
  }
  
  getEstimatedDuration(questionCount: number, modelCount: number): number {
    // Durée longue car teste plusieurs variantes de prompt
    const promptVariants = 8; // Nombre moyen de variantes
    const iterations = 2; // Par variante
    
    return questionCount * modelCount * promptVariants * iterations * 25000; // 25s par test
  }
  
  getRequiredModels(): string[] {
    // Les tests de prompt peuvent être effectués sur tous les modèles
    return [];
  }
}

// Interfaces utilitaires
interface PromptVariant {
  type: string;
  prompt: string;
}

interface PromptTestResult {
  prompt: string;
  variant: string;
  responses: ModelResponse[];
  quality: number;
  consistency: number;
  averageResponseTime: number;
}

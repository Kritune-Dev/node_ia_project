import {
  BenchmarkQuestion,
  BenchmarkResult,
  BenchmarkConfiguration,
  BenchmarkTestType,
  ModelResponse,
  TestExecutorInterface,
  QualitativeMetrics,
  StabilityMetrics,
  ApiIoMetrics,
  RealDataMetrics,
  ParameterMetrics,
  PromptAlternativeMetrics,
  SmokeMetrics
} from '../types/benchmark';

// Classe de base abstraite pour tous les exécuteurs de tests
export abstract class BaseTestExecutor implements TestExecutorInterface {
  protected testType: BenchmarkTestType;
  
  constructor(testType: BenchmarkTestType) {
    this.testType = testType;
  }
  
  abstract execute(
    question: BenchmarkQuestion,
    models: string[],
    config: BenchmarkConfiguration
  ): Promise<BenchmarkResult[]>;
  
  abstract validateConfig(config: BenchmarkConfiguration): boolean;
  
  getRequiredModels(): string[] {
    return []; // Par défaut, aucun modèle spécifique requis
  }
  
  getEstimatedDuration(questionCount: number, modelCount: number): number {
    return questionCount * modelCount * 30000; // 30s par test par défaut
  }
  
  protected async callModel(
    modelName: string,
    prompt: string,
    parameters?: Record<string, any>
  ): Promise<ModelResponse> {
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: prompt,
          model: modelName,
          type: 'general', // Type par défaut pour les benchmarks
          ...parameters
        })
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      return {
        id: crypto.randomUUID(),
        modelName,
        response: data.analysis || data.response,
        responseTime,
        tokenCount: data.tokenCount || Math.floor((data.analysis || '').length / 4), // Estimation basique
        temperature: parameters?.temperature,
        timestamp: new Date(),
        metadata: { confidence: data.confidence, ...data.metadata }
      };
    } catch (error) {
      throw new Error(`Failed to call model ${modelName}: ${error}`);
    }
  }
  
  protected createBaseResult(
    question: BenchmarkQuestion,
    response: ModelResponse
  ): Omit<BenchmarkResult, 'overallScore'> {
    return {
      id: crypto.randomUUID(),
      questionId: question.id,
      modelName: response.modelName,
      testType: this.testType,
      response,
      evaluatedAt: new Date(),
      evaluatedBy: 'auto'
    };
  }
}

// 1️⃣ Tests Qualitatifs
export class QualitativeTestExecutor extends BaseTestExecutor {
  constructor() {
    super(BenchmarkTestType.QUALITATIVE);
  }
  
  async execute(
    question: BenchmarkQuestion,
    models: string[],
    config: BenchmarkConfiguration
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    
    for (const modelName of models) {
      try {
        const response = await this.callModel(modelName, question.text);
        const metrics = await this.evaluateQuality(question, response);
        const overallScore = this.calculateQualitativeScore(metrics);
        
        results.push({
          ...this.createBaseResult(question, response),
          qualitativeMetrics: metrics,
          overallScore
        });
      } catch (error) {
        console.error(`Qualitative test failed for ${modelName}:`, error);
      }
    }
    
    return results;
  }
  
  private async evaluateQuality(
    question: BenchmarkQuestion,
    response: ModelResponse
  ): Promise<QualitativeMetrics> {
    // Évaluation automatique basée sur des heuristiques
    const metrics: QualitativeMetrics = {
      relevance: this.evaluateRelevance(question, response),
      coherence: this.evaluateCoherence(response),
      accuracy: this.evaluateAccuracy(question, response),
      completeness: this.evaluateCompleteness(question, response)
    };
    
    // Ajout de métriques spécifiques selon la catégorie
    if (question.category === 'creative_writing') {
      metrics.creativity = this.evaluateCreativity(response);
    }
    
    if (question.category === 'technical_analysis') {
      metrics.technicalDepth = this.evaluateTechnicalDepth(response);
    }
    
    return metrics;
  }
  
  private evaluateRelevance(question: BenchmarkQuestion, response: ModelResponse): number {
    const questionKeywords = question.keywords || this.extractKeywords(question.text);
    const responseText = response.response.toLowerCase();
    
    let relevanceScore = 0;
    const totalKeywords = questionKeywords.length;
    
    for (const keyword of questionKeywords) {
      if (responseText.includes(keyword.toLowerCase())) {
        relevanceScore++;
      }
    }
    
    // Score basé sur la présence de mots-clés + longueur appropriée
    const keywordScore = (relevanceScore / totalKeywords) * 8;
    const lengthScore = this.evaluateAppropriateLength(question, response) * 2;
    
    return Math.min(10, keywordScore + lengthScore);
  }
  
  private evaluateCoherence(response: ModelResponse): number {
    const text = response.response;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length < 2) return 5; // Trop court pour évaluer
    
    // Vérification de la structure logique
    let coherenceScore = 5; // Score de base
    
    // Bonus pour une structure claire
    if (text.includes('\n') || text.includes('-') || text.includes('1.')) {
      coherenceScore += 2;
    }
    
    // Bonus pour des connecteurs logiques
    const connectors = ['donc', 'ainsi', 'par conséquent', 'cependant', 'néanmoins', 'furthermore', 'however', 'therefore'];
    const connectorCount = connectors.filter(conn => text.toLowerCase().includes(conn)).length;
    coherenceScore += Math.min(2, connectorCount * 0.5);
    
    // Pénalité pour répétitions excessives
    const repetitionPenalty = this.detectRepetitions(text);
    coherenceScore -= repetitionPenalty;
    
    return Math.max(0, Math.min(10, coherenceScore));
  }
  
  private evaluateAccuracy(question: BenchmarkQuestion, response: ModelResponse): number {
    // Si on a une réponse de référence, comparaison
    if (question.baselineAnswer) {
      return this.compareWithBaseline(response.response, question.baselineAnswer);
    }
    
    // Sinon, vérifications générales
    let accuracyScore = 7; // Score de base pour une réponse plausible
    
    // Vérification de faits évidents incorrects
    const factualErrors = this.detectFactualErrors(response.response);
    accuracyScore -= factualErrors * 2;
    
    // Vérification de la cohérence interne
    const internalConsistency = this.checkInternalConsistency(response.response);
    accuracyScore += internalConsistency;
    
    return Math.max(0, Math.min(10, accuracyScore));
  }
  
  private evaluateCompleteness(question: BenchmarkQuestion, response: ModelResponse): number {
    const expectedLength = question.expectedAnswerLength || 200;
    const actualLength = response.response.length;
    
    // Score basé sur la longueur appropriée
    let lengthScore = 0;
    if (actualLength < expectedLength * 0.5) {
      lengthScore = 3; // Trop court
    } else if (actualLength > expectedLength * 3) {
      lengthScore = 6; // Trop long
    } else {
      lengthScore = 9; // Longueur appropriée
    }
    
    // Score basé sur la couverture des critères d'évaluation
    let criteriaScore = 0;
    if (question.evaluationCriteria) {
      const coveredCriteria = question.evaluationCriteria.filter(criteria =>
        response.response.toLowerCase().includes(criteria.toLowerCase())
      );
      criteriaScore = (coveredCriteria.length / question.evaluationCriteria.length) * 10;
    }
    
    return question.evaluationCriteria ? criteriaScore : lengthScore;
  }
  
  private evaluateCreativity(response: ModelResponse): number {
    const text = response.response;
    let creativityScore = 5;
    
    // Bonus pour la variété de vocabulaire
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const vocabularyVariety = uniqueWords.size / words.length;
    creativityScore += vocabularyVariety * 3;
    
    // Bonus pour les métaphores et expressions imagées
    const figurativeLanguage = this.detectFigurativeLanguage(text);
    creativityScore += figurativeLanguage;
    
    // Bonus pour l'originalité (absence de phrases clichées)
    const originalityBonus = this.evaluateOriginality(text);
    creativityScore += originalityBonus;
    
    return Math.min(10, creativityScore);
  }
  
  private evaluateTechnicalDepth(response: ModelResponse): number {
    const text = response.response;
    let depthScore = 5;
    
    // Bonus pour les termes techniques
    const technicalTerms = this.countTechnicalTerms(text);
    depthScore += Math.min(2, technicalTerms * 0.1);
    
    // Bonus pour les exemples concrets
    const examples = this.countExamples(text);
    depthScore += Math.min(2, examples * 0.5);
    
    // Bonus pour la structure détaillée
    if (text.includes('```') || text.includes('```')) {
      depthScore += 1; // Code examples
    }
    
    return Math.min(10, depthScore);
  }
  
  private calculateQualitativeScore(metrics: QualitativeMetrics): number {
    const weights = {
      relevance: 0.3,
      coherence: 0.25,
      accuracy: 0.25,
      completeness: 0.2
    };
    
    let score = 0;
    score += metrics.relevance * weights.relevance;
    score += metrics.coherence * weights.coherence;
    score += metrics.accuracy * weights.accuracy;
    score += metrics.completeness * weights.completeness;
    
    // Bonus pour créativité et profondeur technique si applicable
    if (metrics.creativity) {
      score = (score * 0.9) + (metrics.creativity * 0.1);
    }
    
    if (metrics.technicalDepth) {
      score = (score * 0.9) + (metrics.technicalDepth * 0.1);
    }
    
    return Math.round(score * 10) / 10;
  }
  
  // Méthodes utilitaires
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const stopWords = new Set(['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'their', 'said', 'each', 'which', 'what', 'were', 'when', 'where', 'more', 'some', 'like', 'into', 'time', 'very', 'only', 'other', 'pour', 'avec', 'dans', 'plus', 'tout', 'sont', 'cette', 'être', 'faire', 'leur', 'bien', 'nous', 'vous', 'mais', 'donc']);
    
    return words.filter(word => !stopWords.has(word));
  }
  
  private evaluateAppropriateLength(question: BenchmarkQuestion, response: ModelResponse): number {
    const expectedLength = question.expectedAnswerLength || 200;
    const actualLength = response.response.length;
    const ratio = actualLength / expectedLength;
    
    if (ratio < 0.3) return 1;
    if (ratio < 0.5) return 3;
    if (ratio < 0.8) return 5;
    if (ratio <= 1.2) return 10;
    if (ratio <= 2.0) return 8;
    if (ratio <= 3.0) return 5;
    return 2;
  }
  
  private detectRepetitions(text: string): number {
    const sentences = text.split(/[.!?]+/);
    const repetitions = new Set();
    let penalty = 0;
    
    for (const sentence of sentences) {
      const normalized = sentence.trim().toLowerCase();
      if (normalized.length > 10) {
        if (repetitions.has(normalized)) {
          penalty += 1;
        }
        repetitions.add(normalized);
      }
    }
    
    return Math.min(3, penalty * 0.5);
  }
  
  private compareWithBaseline(response: string, baseline: string): number {
    // Comparaison simple basée sur la similarité des mots-clés
    const responseWords = this.extractKeywords(response);
    const baselineWords = this.extractKeywords(baseline);
    
    const intersection = responseWords.filter(word => baselineWords.includes(word));
    const similarity = intersection.length / Math.max(responseWords.length, baselineWords.length);
    
    return Math.min(10, similarity * 10);
  }
  
  private detectFactualErrors(text: string): number {
    // Détection simple d'erreurs factuelles évidentes
    const errors = [
      /paris.*capital.*spain/i,
      /2\s*\+\s*2\s*=\s*5/,
      /sun.*revolves.*earth/i,
      /water.*boils.*0.*celsius/i
    ];
    
    return errors.filter(pattern => pattern.test(text)).length;
  }
  
  private checkInternalConsistency(text: string): number {
    // Vérification basique de cohérence interne
    // Retourne un bonus de 0 à 1
    
    // Vérifier les contradictions évidentes
    const contradictionPatterns = [
      { positive: /yes|oui|correct/i, negative: /no|non|incorrect/i },
      { positive: /always|toujours/i, negative: /never|jamais/i },
      { positive: /all|tous/i, negative: /none|aucun/i }
    ];
    
    for (const pattern of contradictionPatterns) {
      if (pattern.positive.test(text) && pattern.negative.test(text)) {
        return -0.5; // Pénalité pour contradiction
      }
    }
    
    return 0.5; // Bonus pour cohérence apparente
  }
  
  private detectFigurativeLanguage(text: string): number {
    const patterns = [
      /like a|as a|comme un|tel qu/i,
      /metaphor|simile|métaphore/i,
      /imagine|imagery|imaginez/i
    ];
    
    return patterns.filter(pattern => pattern.test(text)).length * 0.5;
  }
  
  private evaluateOriginality(text: string): number {
    const cliches = [
      /at the end of the day/i,
      /think outside the box/i,
      /it is what it is/i,
      /c'est la vie/i,
      /comme on dit/i
    ];
    
    const clicheCount = cliches.filter(pattern => pattern.test(text)).length;
    return Math.max(0, 1 - clicheCount * 0.3);
  }
  
  private countTechnicalTerms(text: string): number {
    const technicalPatterns = [
      /algorithm|fonction|variable|parameter/i,
      /implementation|architecture|design pattern/i,
      /database|api|framework|library/i,
      /optimization|performance|scalability/i
    ];
    
    return technicalPatterns.filter(pattern => pattern.test(text)).length;
  }
  
  private countExamples(text: string): number {
    const examplePatterns = [
      /for example|par exemple/i,
      /such as|comme/i,
      /instance|cas/i,
      /e\.g\.|p\.ex\./i
    ];
    
    return examplePatterns.filter(pattern => pattern.test(text)).length;
  }
  
  validateConfig(config: BenchmarkConfiguration): boolean {
    return config.qualitative !== undefined &&
           typeof config.qualitative.humanEvaluationRequired === 'boolean' &&
           typeof config.qualitative.autoEvaluationWeight === 'number';
  }
  
  getEstimatedDuration(questionCount: number, modelCount: number): number {
    return questionCount * modelCount * 45000; // 45s par test qualitatif
  }
}

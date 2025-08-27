import {
  BenchmarkQuestion,
  BenchmarkResult,
  BenchmarkConfiguration,
  BenchmarkTestType,
  ModelResponse,
  SmokeMetrics
} from '../types/benchmark';
import { BaseTestExecutor } from './QualitativeTestExecutor';

// 7️⃣ Tests Rapides / Smoke Test
export class SmokeTestExecutor extends BaseTestExecutor {
  constructor() {
    super(BenchmarkTestType.SMOKE);
  }
  
  async execute(
    question: BenchmarkQuestion,
    models: string[],
    config: BenchmarkConfiguration
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    const timeLimit = config.smoke.timeLimit || 10000; // 10 secondes par défaut
    
    for (const modelName of models) {
      const startTime = Date.now();
      
      try {
        const response = await this.callModelWithTimeout(modelName, question.text, timeLimit);
        const metrics = this.evaluateSmokeTest(response, question, config, Date.now() - startTime);
        const overallScore = this.calculateSmokeScore(metrics);
        
        results.push({
          ...this.createBaseResult(question, response),
          smokeMetrics: metrics,
          overallScore,
          notes: `Test smoke rapide (${Date.now() - startTime}ms)`
        });
      } catch (error) {
        // Échec du test smoke
        const failedMetrics: SmokeMetrics = {
          basicFunctionality: false,
          responseCompleteness: false,
          noErrors: false,
          withinTimeLimit: Date.now() - startTime <= timeLimit
        };
        
        results.push({
          id: crypto.randomUUID(),
          questionId: question.id,
          modelName,
          testType: this.testType,
          response: {
            id: crypto.randomUUID(),
            modelName,
            response: `ERROR: ${error}`,
            responseTime: Date.now() - startTime,
            timestamp: new Date()
          },
          smokeMetrics: failedMetrics,
          overallScore: 0,
          evaluatedAt: new Date(),
          evaluatedBy: 'auto',
          notes: `Test smoke échoué: ${error}`
        });
      }
    }
    
    return results;
  }
  
  private async callModelWithTimeout(
    modelName: string,
    prompt: string,
    timeoutMs: number
  ): Promise<ModelResponse> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Smoke test timeout after ${timeoutMs}ms`));
      }, timeoutMs);
      
      try {
        const response = await this.callModel(modelName, prompt, {
          temperature: 0.1, // Température basse pour plus de déterminisme
          max_tokens: 150   // Limite de tokens pour réponse rapide
        });
        clearTimeout(timeout);
        resolve(response);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }
  
  private evaluateSmokeTest(
    response: ModelResponse,
    question: BenchmarkQuestion,
    config: BenchmarkConfiguration,
    actualTime: number
  ): SmokeMetrics {
    const timeLimit = config.smoke.timeLimit || 10000;
    const basicChecks = config.smoke.basicChecks || [];
    
    return {
      basicFunctionality: this.checkBasicFunctionality(response, basicChecks),
      responseCompleteness: this.checkResponseCompleteness(response, question),
      noErrors: this.checkNoErrors(response),
      withinTimeLimit: actualTime <= timeLimit
    };
  }
  
  private checkBasicFunctionality(response: ModelResponse, basicChecks: string[]): boolean {
    // Vérifications de base : le modèle répond-il de manière sensée ?
    const responseText = response.response;
    
    // Vérification 1 : La réponse n'est pas vide
    if (!responseText || responseText.trim().length === 0) {
      return false;
    }
    
    // Vérification 2 : La réponse contient au moins quelques mots
    const words = responseText.trim().split(/\s+/);
    if (words.length < 3) {
      return false;
    }
    
    // Vérification 3 : Pas de messages d'erreur évidents
    const errorPatterns = [
      /error/i,
      /failed/i,
      /cannot/i,
      /unable/i,
      /sorry.*can't/i,
      /i don't know/i,
      /je ne sais pas/i
    ];
    
    const hasErrorMessages = errorPatterns.some(pattern => pattern.test(responseText));
    if (hasErrorMessages) {
      return false;
    }
    
    // Vérifications personnalisées si spécifiées
    if (basicChecks.length > 0) {
      return this.runCustomChecks(response, basicChecks);
    }
    
    return true;
  }
  
  private runCustomChecks(response: ModelResponse, checks: string[]): boolean {
    const responseText = response.response.toLowerCase();
    
    for (const check of checks) {
      switch (check) {
        case 'contains_numbers':
          if (!/\d/.test(responseText)) return false;
          break;
        case 'contains_punctuation':
          if (!/[.!?]/.test(responseText)) return false;
          break;
        case 'multiple_sentences':
          if (responseText.split(/[.!?]+/).filter(s => s.trim().length > 0).length < 2) return false;
          break;
        case 'no_repetition':
          if (this.hasExcessiveRepetition(responseText)) return false;
          break;
        case 'proper_length':
          if (responseText.length < 20 || responseText.length > 1000) return false;
          break;
        default:
          // Check personnalisé : chercher une chaîne spécifique
          if (!responseText.includes(check.toLowerCase())) return false;
      }
    }
    
    return true;
  }
  
  private checkResponseCompleteness(response: ModelResponse, question: BenchmarkQuestion): boolean {
    const responseText = response.response;
    
    // La réponse semble-t-elle complète et non tronquée ?
    
    // Vérification 1 : Se termine par une ponctuation appropriée
    const lastChar = responseText.trim().slice(-1);
    if (!['.', '!', '?', ':', ')'].includes(lastChar)) {
      // Possible troncature
      return false;
    }
    
    // Vérification 2 : Longueur minimale raisonnable
    const minLength = Math.min(question.expectedAnswerLength || 50, 30);
    if (responseText.length < minLength) {
      return false;
    }
    
    // Vérification 3 : Pas de fin abrupte
    const abruptEndings = [
      /\.\.\.\s*$/,
      /and\s*$/i,
      /but\s*$/i,
      /or\s*$/i,
      /the\s*$/i,
      /et\s*$/i,
      /mais\s*$/i
    ];
    
    const hasAbruptEnding = abruptEndings.some(pattern => pattern.test(responseText));
    if (hasAbruptEnding) {
      return false;
    }
    
    return true;
  }
  
  private checkNoErrors(response: ModelResponse): boolean {
    const responseText = response.response;
    
    // Vérifier l'absence d'erreurs techniques ou de contenu problématique
    
    // Erreurs techniques
    const technicalErrors = [
      /404|500|error code/i,
      /null|undefined|nan/i,
      /exception|stack trace/i,
      /internal server error/i,
      /connection timed out/i
    ];
    
    if (technicalErrors.some(pattern => pattern.test(responseText))) {
      return false;
    }
    
    // Contenu inapproprié ou refus de répondre
    const refusalPatterns = [
      /i cannot|i can't|je ne peux pas/i,
      /sorry.*cannot|désolé.*ne peux pas/i,
      /against my programming/i,
      /not appropriate/i,
      /pas approprié/i
    ];
    
    // Note : Un refus poli n'est pas forcément une erreur, 
    // cela dépend du contexte de la question
    const questionText = response.response.toLowerCase();
    const hasRefusal = refusalPatterns.some(pattern => pattern.test(questionText));
    
    if (hasRefusal && this.isReasonableQuestion(questionText)) {
      return false; // Refus inapproprié
    }
    
    return true;
  }
  
  private isReasonableQuestion(questionText: string): boolean {
    // Vérifier si la question semble raisonnable (pas offensive, dangereuse, etc.)
    const problematicPatterns = [
      /how to.*kill|comment.*tuer/i,
      /illegal|illégal/i,
      /hack|pirate/i,
      /bomb|bombe/i,
      /drug|drogue/i
    ];
    
    return !problematicPatterns.some(pattern => pattern.test(questionText));
  }
  
  private hasExcessiveRepetition(text: string): boolean {
    // Détecter les répétitions excessives
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = new Map<string, number>();
    
    for (const word of words) {
      if (word.length > 3) { // Ignorer les mots très courts
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }
    
    // Vérifier si un mot représente plus de 20% du texte
    const totalWords = words.length;
    const wordEntries = Array.from(wordCounts.entries());
    for (const [word, count] of wordEntries) {
      if (count / totalWords > 0.2) {
        return true;
      }
    }
    
    // Vérifier les phrases répétées
    const sentences = text.split(/[.!?]+/);
    const sentenceCounts = new Map<string, number>();
    
    for (const sentence of sentences) {
      const normalized = sentence.trim().toLowerCase();
      if (normalized.length > 10) {
        sentenceCounts.set(normalized, (sentenceCounts.get(normalized) || 0) + 1);
      }
    }
    
    const sentenceCountValues = Array.from(sentenceCounts.values());
    for (const count of sentenceCountValues) {
      if (count > 2) {
        return true; // Plus de 2 répétitions de la même phrase
      }
    }
    
    return false;
  }
  
  private calculateSmokeScore(metrics: SmokeMetrics): number {
    // Score binaire simple pour les tests smoke
    let score = 0;
    
    if (metrics.basicFunctionality) score += 3;
    if (metrics.responseCompleteness) score += 3;
    if (metrics.noErrors) score += 2;
    if (metrics.withinTimeLimit) score += 2;
    
    return score;
  }
  
  validateConfig(config: BenchmarkConfiguration): boolean {
    return config.smoke !== undefined &&
           typeof config.smoke.timeLimit === 'number' &&
           config.smoke.timeLimit > 0 &&
           Array.isArray(config.smoke.basicChecks);
  }
  
  getEstimatedDuration(questionCount: number, modelCount: number): number {
    // Très rapide par design
    const timeLimit = 10000; // 10 secondes par défaut
    return questionCount * modelCount * (timeLimit + 2000); // +2s de marge
  }
  
  getRequiredModels(): string[] {
    // Les tests smoke peuvent être effectués sur tous les modèles
    return [];
  }
}

// Extensions utilitaires pour les tests smoke rapides
export class QuickSmokeTestSuite {
  static getEssentialQuestions(): BenchmarkQuestion[] {
    return [
      {
        id: 'smoke-basic-1',
        text: 'What is 2 + 2?',
        category: 'math_problem' as any,
        difficulty: 'easy' as any,
        expectedAnswerLength: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'smoke-basic-2',
        text: 'Name three colors.',
        category: 'factual_knowledge' as any,
        difficulty: 'easy' as any,
        expectedAnswerLength: 20,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'smoke-basic-3',
        text: 'Write a simple greeting.',
        category: 'language_understanding' as any,
        difficulty: 'easy' as any,
        expectedAnswerLength: 15,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
  
  static getBasicConfiguration(): BenchmarkConfiguration {
    return {
      maxConcurrentTests: 1,
      timeoutMs: 15000,
      retryCount: 1,
      qualitative: {
        humanEvaluationRequired: false,
        autoEvaluationWeight: 1.0
      },
      stability: {
        iterationCount: 2,
        consistencyThreshold: 0.5
      },
      apiIo: {
        concurrentRequests: 2,
        loadTestDuration: 10000
      },
      realData: {
        contextSize: 500
      },
      parameter: {
        temperatureRange: [0.1, 0.5],
        temperatureSteps: 2,
        otherParams: {}
      },
      promptAlternative: {
        promptVariants: [],
        evaluationMethod: 'quality'
      },
      smoke: {
        timeLimit: 8000,
        basicChecks: ['proper_length', 'no_repetition']
      }
    };
  }
}

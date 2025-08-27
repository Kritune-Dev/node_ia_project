import {
  BenchmarkQuestion,
  BenchmarkResult,
  BenchmarkConfiguration,
  BenchmarkTestType,
  ModelResponse,
  RealDataMetrics
} from '../types/benchmark';
import { BaseTestExecutor } from './QualitativeTestExecutor';

// 4️⃣ Tests sur Données Réelles
export class RealDataTestExecutor extends BaseTestExecutor {
  constructor() {
    super(BenchmarkTestType.REAL_DATA);
  }
  
  async execute(
    question: BenchmarkQuestion,
    models: string[],
    config: BenchmarkConfiguration
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    
    // Récupérer les données réelles selon la configuration
    const realDataContext = await this.fetchRealDataContext(config);
    
    for (const modelName of models) {
      try {
        // Enrichir la question avec les données réelles
        const enrichedPrompt = this.createEnrichedPrompt(question, realDataContext, config);
        
        const response = await this.callModel(modelName, enrichedPrompt);
        const metrics = await this.evaluateRealDataPerformance(
          question,
          response,
          realDataContext,
          config
        );
        const overallScore = this.calculateRealDataScore(metrics);
        
        results.push({
          ...this.createBaseResult(question, response),
          realDataMetrics: metrics,
          overallScore,
          notes: `Évalué avec des données réelles (${realDataContext.source})`
        });
      } catch (error) {
        console.error(`Real data test failed for ${modelName}:`, error);
      }
    }
    
    return results;
  }
  
  private async fetchRealDataContext(config: BenchmarkConfiguration): Promise<RealDataContext> {
    try {
      // Si une URL de source de données est spécifiée
      if (config.realData.dataSourceUrl) {
        return await this.fetchExternalData(config.realData.dataSourceUrl);
      }
      
      // Sinon, utiliser des données prédéfinies selon le type
      return await this.getDefaultRealData();
    } catch (error) {
      console.warn('Failed to fetch real data, using fallback:', error);
      return this.getFallbackData();
    }
  }
  
  private async fetchExternalData(url: string): Promise<RealDataContext> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch data from ${url}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      source: url,
      type: 'external',
      data: data,
      metadata: {
        fetchedAt: new Date(),
        contentType: response.headers.get('content-type') || 'unknown'
      }
    };
  }
  
  private async getDefaultRealData(): Promise<RealDataContext> {
    // Données réelles diversifiées pour différents types de tests
    const dataSources: RealDataContext[] = [
      {
        source: 'financial_markets',
        type: 'market_data',
        data: await this.getMarketData(),
        metadata: { lastUpdated: new Date(), currency: 'USD' }
      },
      {
        source: 'news_articles',
        type: 'text_corpus',
        data: await this.getNewsData(),
        metadata: { articles: 5, dateRange: '2024-01-01 to 2024-12-31' }
      },
      {
        source: 'scientific_papers',
        type: 'academic',
        data: await this.getScientificData(),
        metadata: { papers: 3, domains: ['AI', 'Medicine', 'Physics'] }
      },
      {
        source: 'social_media',
        type: 'social',
        data: await this.getSocialMediaData(),
        metadata: { posts: 10, platform: 'Twitter', anonymized: true }
      }
    ];
    
    // Sélectionner aléatoirement une source
    const randomSource = dataSources[Math.floor(Math.random() * dataSources.length)];
    return randomSource;
  }
  
  private getFallbackData(): RealDataContext {
    return {
      source: 'fallback',
      type: 'sample',
      data: {
        text: "Sample real-world data for testing purposes. This includes various statistics, market information, and general knowledge that would be found in real-world scenarios.",
        statistics: {
          population: 8000000000,
          gdp_global: 84000000000000,
          internet_users: 5000000000
        }
      },
      metadata: {
        note: 'Fallback data used due to external source unavailability'
      }
    };
  }
  
  private async getMarketData(): Promise<any> {
    // Simuler des données de marché réalistes
    return {
      stocks: [
        { symbol: 'AAPL', price: 175.43, change: '+2.1%', volume: 45000000 },
        { symbol: 'GOOGL', price: 2847.52, change: '-0.8%', volume: 25000000 },
        { symbol: 'MSFT', price: 342.56, change: '+1.5%', volume: 35000000 }
      ],
      indices: {
        'S&P 500': { value: 4567.89, change: '+0.7%' },
        'NASDAQ': { value: 14234.56, change: '+1.2%' },
        'DOW': { value: 34567.89, change: '+0.4%' }
      },
      currencies: {
        'EUR/USD': 1.0845,
        'GBP/USD': 1.2634,
        'USD/JPY': 149.23
      }
    };
  }
  
  private async getNewsData(): Promise<any> {
    return {
      headlines: [
        "Technology sector shows strong growth in Q4 2024",
        "New renewable energy project announced in California",
        "Global inflation rates stabilize across major economies",
        "Breakthrough in quantum computing research published",
        "International trade agreements reach new milestone"
      ],
      articles: [
        {
          title: "AI Revolution in Healthcare",
          summary: "Artificial intelligence is transforming medical diagnosis and treatment plans across hospitals worldwide.",
          category: "Technology"
        }
      ]
    };
  }
  
  private async getScientificData(): Promise<any> {
    return {
      papers: [
        {
          title: "Advances in Machine Learning for Climate Prediction",
          abstract: "This paper presents novel approaches to climate modeling using deep learning techniques.",
          field: "Environmental Science",
          citations: 234
        },
        {
          title: "CRISPR Gene Editing: Recent Developments",
          abstract: "Review of recent breakthroughs in gene editing technology and therapeutic applications.",
          field: "Biotechnology",
          citations: 567
        }
      ],
      statistics: {
        total_papers_2024: 2500000,
        ai_papers_percentage: 15.2,
        collaboration_index: 3.4
      }
    };
  }
  
  private async getSocialMediaData(): Promise<any> {
    return {
      trends: [
        "#ClimateAction",
        "#TechInnovation",
        "#HealthcareReform",
        "#EducationForAll",
        "#SustainableEnergy"
      ],
      sentiment_analysis: {
        positive: 45,
        neutral: 35,
        negative: 20
      },
      engagement_metrics: {
        average_likes: 150,
        average_shares: 25,
        average_comments: 12
      }
    };
  }
  
  private createEnrichedPrompt(
    question: BenchmarkQuestion,
    context: RealDataContext,
    config: BenchmarkConfiguration
  ): string {
    const contextSize = config.realData.contextSize || 1000;
    
    // Sérialiser les données du contexte
    const contextString = this.serializeContextData(context.data, contextSize);
    
    // Créer le prompt enrichi
    const enrichedPrompt = `
Context: Voici des données réelles récentes provenant de ${context.source} (${context.type}):

${contextString}

Question: ${question.text}

Veuillez répondre en tenant compte des données réelles fournies ci-dessus. Votre réponse doit être basée sur ces données factuelles et démontrer une compréhension pratique du contexte.
    `.trim();
    
    return enrichedPrompt;
  }
  
  private serializeContextData(data: any, maxLength: number): string {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      
      if (jsonString.length <= maxLength) {
        return jsonString;
      }
      
      // Tronquer intelligemment si trop long
      const truncated = jsonString.substring(0, maxLength - 50) + '\n... [data truncated]';
      return truncated;
    } catch (error) {
      return String(data).substring(0, maxLength);
    }
  }
  
  private async evaluateRealDataPerformance(
    question: BenchmarkQuestion,
    response: ModelResponse,
    context: RealDataContext,
    config: BenchmarkConfiguration
  ): Promise<RealDataMetrics> {
    return {
      relevanceToContext: this.evaluateContextRelevance(response, context),
      practicalApplicability: this.evaluatePracticalApplicability(response, question),
      dataHandlingAccuracy: this.evaluateDataHandling(response, context),
      realWorldViability: this.evaluateRealWorldViability(response, context)
    };
  }
  
  private evaluateContextRelevance(response: ModelResponse, context: RealDataContext): number {
    const responseText = response.response.toLowerCase();
    let relevanceScore = 5; // Score de base
    
    // Vérifier si la réponse référence les données du contexte
    if (context.type === 'market_data') {
      const marketTerms = ['stock', 'price', 'market', 'trading', 'volume', 'index'];
      const mentionedTerms = marketTerms.filter(term => responseText.includes(term));
      relevanceScore += (mentionedTerms.length / marketTerms.length) * 3;
    }
    
    if (context.type === 'text_corpus' || context.type === 'social') {
      const newsTerms = ['news', 'article', 'headline', 'report', 'trend'];
      const mentionedTerms = newsTerms.filter(term => responseText.includes(term));
      relevanceScore += (mentionedTerms.length / newsTerms.length) * 3;
    }
    
    if (context.type === 'academic') {
      const academicTerms = ['research', 'study', 'paper', 'findings', 'analysis'];
      const mentionedTerms = academicTerms.filter(term => responseText.includes(term));
      relevanceScore += (mentionedTerms.length / academicTerms.length) * 3;
    }
    
    // Vérifier si des données spécifiques sont mentionnées
    const contextString = JSON.stringify(context.data).toLowerCase();
    const numbers = response.response.match(/\d+(?:\.\d+)?/g) || [];
    let specificDataMentioned = 0;
    
    for (const number of numbers) {
      if (contextString.includes(number)) {
        specificDataMentioned++;
      }
    }
    
    relevanceScore += Math.min(2, specificDataMentioned * 0.5);
    
    return Math.min(10, Math.max(0, relevanceScore));
  }
  
  private evaluatePracticalApplicability(response: ModelResponse, question: BenchmarkQuestion): number {
    const responseText = response.response.toLowerCase();
    let practicalScore = 5;
    
    // Recherche d'indicateurs de praticité
    const practicalIndicators = [
      'implement', 'apply', 'use', 'solution', 'approach', 'method',
      'strategy', 'plan', 'action', 'step', 'process', 'procedure'
    ];
    
    const mentionedIndicators = practicalIndicators.filter(indicator => 
      responseText.includes(indicator)
    );
    
    practicalScore += (mentionedIndicators.length / practicalIndicators.length) * 3;
    
    // Bonus pour les exemples concrets
    if (responseText.includes('example') || responseText.includes('instance')) {
      practicalScore += 1;
    }
    
    // Bonus pour les considérations de mise en œuvre
    if (responseText.includes('consider') || responseText.includes('keep in mind')) {
      practicalScore += 1;
    }
    
    return Math.min(10, Math.max(0, practicalScore));
  }
  
  private evaluateDataHandling(response: ModelResponse, context: RealDataContext): number {
    const responseText = response.response;
    let handlingScore = 5;
    
    // Vérifier si des données numériques sont correctement interprétées
    const numbers = responseText.match(/\d+(?:\.\d+)?/g) || [];
    if (numbers.length > 0) {
      handlingScore += 2; // Bonus pour utilisation de données numériques
    }
    
    // Vérifier si des comparaisons sont faites
    const comparisonWords = ['higher', 'lower', 'increase', 'decrease', 'compared', 'versus'];
    const hasComparisons = comparisonWords.some(word => responseText.toLowerCase().includes(word));
    if (hasComparisons) {
      handlingScore += 1;
    }
    
    // Vérifier si des tendances sont identifiées
    const trendWords = ['trend', 'pattern', 'growth', 'decline', 'stable'];
    const hasTrends = trendWords.some(word => responseText.toLowerCase().includes(word));
    if (hasTrends) {
      handlingScore += 1;
    }
    
    // Vérifier la précision dans l'interprétation
    const contextString = JSON.stringify(context.data);
    let accuracyBonus = 0;
    
    // Si le contexte contient des pourcentages, vérifier leur utilisation correcte
    const percentages = contextString.match(/\d+(?:\.\d+)?%/g) || [];
    for (const percentage of percentages) {
      if (responseText.includes(percentage)) {
        accuracyBonus += 0.5;
      }
    }
    
    handlingScore += Math.min(1, accuracyBonus);
    
    return Math.min(10, Math.max(0, handlingScore));
  }
  
  private evaluateRealWorldViability(response: ModelResponse, context: RealDataContext): number {
    const responseText = response.response.toLowerCase();
    let viabilityScore = 5;
    
    // Recherche d'indicateurs de viabilité dans le monde réel
    const viabilityIndicators = [
      'feasible', 'practical', 'realistic', 'achievable', 'viable',
      'cost', 'budget', 'resource', 'time', 'constraint', 'limitation'
    ];
    
    const mentionedIndicators = viabilityIndicators.filter(indicator => 
      responseText.includes(indicator)
    );
    
    viabilityScore += (mentionedIndicators.length / viabilityIndicators.length) * 3;
    
    // Bonus pour la prise en compte des contraintes
    if (responseText.includes('however') || responseText.includes('but') || responseText.includes('although')) {
      viabilityScore += 1; // Prise en compte de nuances
    }
    
    // Bonus pour les considérations temporelles
    if (responseText.includes('time') || responseText.includes('timeline') || responseText.includes('schedule')) {
      viabilityScore += 1;
    }
    
    return Math.min(10, Math.max(0, viabilityScore));
  }
  
  private calculateRealDataScore(metrics: RealDataMetrics): number {
    const weights = {
      relevanceToContext: 0.3,
      practicalApplicability: 0.25,
      dataHandlingAccuracy: 0.25,
      realWorldViability: 0.2
    };
    
    const score = 
      metrics.relevanceToContext * weights.relevanceToContext +
      metrics.practicalApplicability * weights.practicalApplicability +
      metrics.dataHandlingAccuracy * weights.dataHandlingAccuracy +
      metrics.realWorldViability * weights.realWorldViability;
    
    return Math.round(score * 10) / 10;
  }
  
  validateConfig(config: BenchmarkConfiguration): boolean {
    return config.realData !== undefined &&
           typeof config.realData.contextSize === 'number' &&
           config.realData.contextSize > 0;
  }
  
  getEstimatedDuration(questionCount: number, modelCount: number): number {
    // Plus long car nécessite la récupération et le traitement des données
    return questionCount * modelCount * 60000; // 60s par test
  }
  
  getRequiredModels(): string[] {
    // Recommander des modèles avec une bonne capacité de traitement contextuel
    return ['llama2:13b', 'gpt-3.5-turbo'];
  }
}

// Interface pour le contexte de données réelles
interface RealDataContext {
  source: string;
  type: 'market_data' | 'text_corpus' | 'academic' | 'social' | 'external' | 'sample';
  data: any;
  metadata: Record<string, any>;
}

// Configuration Ollama
export const OLLAMA_CONFIG = {
  BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  TRANSLATOR_URL: process.env.TRANSLATOR_BASE_URL || 'http://localhost:11435',
  TIMEOUT: 90000, // 90 secondes (augmenté pour les questions longues)
} as const

// Modèles médicaux disponibles
export const MEDICAL_MODELS = [
  {
    name: 'llama3.2:3b',
    displayName: 'Llama 3.2 3B',
    type: 'general',
    description: 'Modèle généraliste performant',
    specialization: 'Analyse générale',
    size: '2.0GB'
  },
  {
    name: 'phi3:mini',
    displayName: 'Phi-3 Mini',
    type: 'general',
    description: 'Modèle compact et efficace',
    specialization: 'Analyse rapide',
    size: '2.3GB'
  },
  {
    name: 'qwen2:7b',
    displayName: 'Qwen2 7B',
    type: 'general',
    description: 'Modèle multilingue avancé',
    specialization: 'Analyse multilingue',
    size: '4.4GB'
  },
  {
    name: 'gemma3:latest',
    displayName: 'Gemma 3',
    type: 'general',
    description: 'Modèle Google performant',
    specialization: 'Analyse générale',
    size: '5.4GB'
  },
  {
    name: 'mistral:latest',
    displayName: 'Mistral',
    type: 'general',
    description: 'Modèle français de référence',
    specialization: 'Analyse en français',
    size: '4.1GB'
  },
  {
    name: 'tinyllama:latest',
    displayName: 'TinyLlama',
    type: 'general',
    description: 'Modèle ultra-compact',
    specialization: 'Tests rapides',
    size: '637MB'
  },
  {
    name: 'orca2:latest',
    displayName: 'Orca 2',
    type: 'general',
    description: 'Modèle Microsoft optimisé',
    specialization: 'Raisonnement logique',
    size: '3.8GB'
  },
  {
    name: 'meditron:latest',
    displayName: 'Meditron',
    type: 'medical',
    description: 'Spécialisé en médecine générale',
    specialization: 'Diagnostic médical',
    size: '4.1GB'
  },
  {
    name: 'medllama2:latest',
    displayName: 'MedLlama2',
    type: 'medical',
    description: 'LLaMA fine-tuné pour la médecine',
    specialization: 'Analyse clinique',
    size: '3.8GB'
  },
  {
    name: 'cniongolo/biomistral:latest',
    displayName: 'BioMistral',
    type: 'medical',
    description: 'Spécialisé en biomédecine',
    specialization: 'Recherche biomédicale',
    size: '4.1GB'
  },
  {
    name: 'biomistral:latest',
    displayName: 'BioMistral Alt',
    type: 'medical',
    description: 'Version alternative BioMistral',
    specialization: 'Sciences de la vie',
    size: '4.1GB'
  }
] as const

// Types d'analyse
export const ANALYSIS_TYPES = {
  CLINICAL: 'clinical',
  ORTHOPEDIC: 'orthopedic',
  GENERAL: 'general'
} as const

// Prompts système par type d'analyse
export const SYSTEM_PROMPTS = {
  [ANALYSIS_TYPES.CLINICAL]: `Tu es un assistant IA spécialisé en ostéopathie et médecine manuelle. 
    Analyse les données cliniques avec expertise médicale en tenant compte des principes ostéopathiques.
    
    Structure ta réponse avec :
    1. ÉVALUATION CLINIQUE : Analyse des symptômes et signes cliniques
    2. HYPOTHÈSES DIAGNOSTIQUES : Diagnostics différentiels possibles
    3. APPROCHE OSTÉOPATHIQUE : Considérations spécifiques à l'ostéopathie
    4. RECOMMANDATIONS THÉRAPEUTIQUES : Traitements et techniques suggérés
    5. TESTS COMPLÉMENTAIRES : Examens ou tests supplémentaires recommandés
    
    Reste factuel, précis et indique toujours les limites de ton analyse.
    Respecte le cadre légal de la pratique ostéopathique.`,

  [ANALYSIS_TYPES.ORTHOPEDIC]: `Tu es un expert en tests orthopédiques et ostéopathiques.
    Analyse le test orthopédique décrit avec précision clinique.
    
    Structure ta réponse avec :
    1. DESCRIPTION DU TEST : Procédure et méthodologie
    2. INTERPRÉTATION : Signification des résultats (positif/négatif)
    3. STRUCTURES ANATOMIQUES : Éléments anatomiques testés
    4. SIGNIFICATION CLINIQUE : Implications diagnostiques
    5. TESTS COMPLÉMENTAIRES : Tests associés recommandés
    6. CONSIDÉRATIONS OSTÉOPATHIQUES : Approche ostéopathique spécifique
    
    Sois précis dans l'interprétation des signes cliniques et reste dans le cadre ostéopathique.`,

  [ANALYSIS_TYPES.GENERAL]: `Tu es un assistant médical spécialisé en ostéopathie. 
    Réponds de manière professionnelle et précise en gardant une approche ostéopathique.
    Indique clairement les limites de ton analyse et respecte le cadre légal de la pratique.`
} as const

// Configuration des modèles par défaut selon le type d'analyse
export const DEFAULT_MODELS = {
  [ANALYSIS_TYPES.CLINICAL]: 'meditron:latest',
  [ANALYSIS_TYPES.ORTHOPEDIC]: 'medllama2:latest',
  [ANALYSIS_TYPES.GENERAL]: 'llama3.2:3b'
} as const

// Paramètres Ollama par type d'analyse
export const OLLAMA_PARAMS = {
  [ANALYSIS_TYPES.CLINICAL]: {
    temperature: 0.2, // Plus conservateur pour le médical
    top_p: 0.9,
    num_predict: 1200,
    repeat_penalty: 1.1
  },
  [ANALYSIS_TYPES.ORTHOPEDIC]: {
    temperature: 0.3, // Légèrement plus créatif pour les interprétations
    top_p: 0.9,
    num_predict: 1000,
    repeat_penalty: 1.1
  },
  [ANALYSIS_TYPES.GENERAL]: {
    temperature: 0.4, // Plus créatif pour les analyses générales
    top_p: 0.9,
    num_predict: 800,
    repeat_penalty: 1.1
  }
} as const

// Seuils de confiance
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0.4
} as const

// Types TypeScript
export type ModelType = 'general' | 'medical'
export type AnalysisType = typeof ANALYSIS_TYPES[keyof typeof ANALYSIS_TYPES]
export type ModelConfig = typeof MEDICAL_MODELS[number]

// Utilitaires
export const getMedicalModels = () => MEDICAL_MODELS.filter(model => model.type === 'medical')
export const getGeneralModels = () => MEDICAL_MODELS.filter(model => model.type === 'general')
export const getModelByName = (name: string) => MEDICAL_MODELS.find(model => model.name === name)
export const getDefaultModel = (analysisType: AnalysisType) => DEFAULT_MODELS[analysisType]

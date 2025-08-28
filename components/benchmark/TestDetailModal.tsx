'use client'

import { useState } from 'react'
import { X, Target, Thermometer, Shuffle, Clock, MessageSquare, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { BenchmarkTestType } from '../../lib/types/benchmark'

interface TestDetailModalProps {
  testType: BenchmarkTestType | null
  isVisible: boolean
  onClose: () => void
}

export default function TestDetailModal({ testType, isVisible, onClose }: TestDetailModalProps) {
  if (!isVisible || !testType) return null

  const getTestDetails = (type: BenchmarkTestType) => {
    switch (type) {
      case BenchmarkTestType.SMOKE:
        return {
          name: 'Série Smoke Tests',
          description: 'Tests rapides de fonctionnement de base avec 3 questions essentielles',
          temperature: 0.1,
          seed: 42,
          timeout: 30,
          questions: [
            'What is 2 + 2?',
            'Name three colors.',
            'Write a simple greeting.'
          ],
          estimatedDuration: '15-30 secondes',
          complexity: 'Faible'
        }
      case BenchmarkTestType.API_IO:
        return {
          name: 'Série Tests API/I-O',
          description: 'Tests de performance en charge avec requêtes concurrentes',
          temperature: 0.3,
          seed: 123,
          timeout: 60,
          questions: [
            'Test de charge avec 5 requêtes simultanées',
            'Mesure de la latence sous stress',
            'Évaluation de la stabilité des réponses',
            'Test de débit (throughput)',
            'Vérification de la cohérence des sorties'
          ],
          estimatedDuration: '2-5 minutes',
          complexity: 'Moyenne'
        }
      case BenchmarkTestType.QUALITATIVE:
        return {
          name: 'Série Tests Qualitatifs',
          description: 'Évaluation de la qualité, créativité et pertinence des réponses',
          temperature: 0.7,
          seed: null,
          timeout: 120,
          questions: [
            'Questions de raisonnement complexe',
            'Tâches créatives et narratives',
            'Analyse et synthèse d\'informations',
            'Résolution de problèmes éthiques',
            'Évaluation de la cohérence logique'
          ],
          estimatedDuration: '5-10 minutes',
          complexity: 'Élevée'
        }
      case BenchmarkTestType.STABILITY:
        return {
          name: 'Série Tests de Stabilité',
          description: 'Tests répétés (5 itérations) pour mesurer la cohérence des réponses',
          temperature: 0.5,
          seed: 456,
          timeout: 90,
          questions: [
            'Répétition de la même question 5 fois',
            'Mesure de la variance des réponses',
            'Calcul du score de cohérence',
            'Détection des incohérences',
            'Évaluation de la stabilité temporelle'
          ],
          estimatedDuration: '8-15 minutes',
          complexity: 'Moyenne-Élevée'
        }
      case BenchmarkTestType.PARAMETER:
        return {
          name: 'Série Tests de Paramètres',
          description: 'Tests avec différents paramètres (température, seed) sur 5-10 variations',
          temperature: 'Variable (0.1-1.0)',
          seed: 'Variable',
          timeout: 75,
          questions: [
            'Test avec température basse (0.1-0.3)',
            'Test avec température moyenne (0.4-0.7)',
            'Test avec température élevée (0.8-1.0)',
            'Comparaison des variations de seed',
            'Analyse de l\'impact des paramètres'
          ],
          estimatedDuration: '6-12 minutes',
          complexity: 'Élevée'
        }
      case BenchmarkTestType.PROMPT_ALTERNATIVE:
        return {
          name: 'Série Tests d\'Alternatives de Prompt',
          description: 'Même question formulée de 3-5 façons différentes pour tester la robustesse',
          temperature: 0.4,
          seed: 789,
          timeout: 90,
          questions: [
            'Formulation directe de la question',
            'Formulation polie et formelle',
            'Formulation concise et technique',
            'Formulation avec contexte ajouté',
            'Formulation inversée ou négative'
          ],
          estimatedDuration: '7-15 minutes',
          complexity: 'Élevée'
        }
      case BenchmarkTestType.REAL_DATA:
        return {
          name: 'Série Tests avec Données Réelles',
          description: 'Tests avec vrais documents, code source et données complexes (contexte 1000+ tokens)',
          temperature: 0.6,
          seed: 999,
          timeout: 180,
          questions: [
            'Analyse de documents PDF réels',
            'Traitement de code source complexe',
            'Extraction d\'informations de datasets',
            'Résumé d\'articles scientifiques',
            'Interprétation de données financières'
          ],
          estimatedDuration: '15-30 minutes',
          complexity: 'Très Élevée'
        }
      default:
        return {
          name: 'Série Inconnue',
          description: 'Type de série de tests non reconnu',
          temperature: 0.5,
          seed: null,
          timeout: 60,
          questions: [],
          estimatedDuration: 'Inconnu',
          complexity: 'Inconnue'
        }
    }
  }

  const details = getTestDetails(testType)

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Faible': return 'text-green-600 bg-green-100'
      case 'Moyenne': return 'text-yellow-600 bg-yellow-100'
      case 'Moyenne-Élevée': return 'text-orange-600 bg-orange-100'
      case 'Élevée': return 'text-red-600 bg-red-100'
      case 'Très Élevée': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-100">
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{details.name}</h2>
              <p className="text-sm text-gray-600 mt-1">{details.description}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getComplexityColor(details.complexity)}`}>
                  {details.complexity}
                </span>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {details.estimatedDuration}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white hover:bg-opacity-70 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Paramètres de test */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-orange-500" />
                Paramètres de test
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="w-4 h-4 text-orange-600" />
                    <div className="text-sm text-orange-600">Température</div>
                  </div>
                  <div className="text-xl font-bold text-orange-900">{details.temperature}</div>
                  <div className="text-xs text-orange-700">Créativité des réponses</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shuffle className="w-4 h-4 text-purple-600" />
                    <div className="text-sm text-purple-600">Seed</div>
                  </div>
                  <div className="text-xl font-bold text-purple-900">{details.seed || 'Aléatoire'}</div>
                  <div className="text-xs text-purple-700">Reproductibilité</div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div className="text-sm text-blue-600">Timeout</div>
                  </div>
                  <div className="text-xl font-bold text-blue-900">{details.timeout}s</div>
                  <div className="text-xs text-blue-700">Limite de temps</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                    <div className="text-sm text-green-600">Questions</div>
                  </div>
                  <div className="text-xl font-bold text-green-900">{details.questions.length}</div>
                  <div className="text-xs text-green-700">Total à tester</div>
                </div>
              </div>
            </div>

            {/* Questions de test */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                Questions de test
              </h3>
              <div className="space-y-3">
                {details.questions.map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800">{question}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Métriques évaluées */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Métriques évaluées</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">Taux de réussite</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-800 font-medium">Temps de réponse</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                    <Target className="w-5 h-5 text-purple-600" />
                    <span className="text-purple-800 font-medium">Pertinence des réponses</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-yellow-600" />
                    <span className="text-yellow-800 font-medium">Qualité du contenu</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                    <Shuffle className="w-5 h-5 text-orange-600" />
                    <span className="text-orange-800 font-medium">Cohérence</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800 font-medium">Détection d'erreurs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Conseils d'optimisation */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-800">
                <AlertTriangle className="w-5 h-5" />
                Conseils d'optimisation
              </h3>
              <div className="text-sm text-blue-700 space-y-2">
                {testType === BenchmarkTestType.SMOKE && (
                  <>
                    <p>• Ce test est idéal pour vérifier rapidement qu'un modèle fonctionne correctement</p>
                    <p>• Utilisez-le comme premier test avant des évaluations plus poussées</p>
                    <p>• Un taux de réussite inférieur à 80% indique des problèmes de base</p>
                  </>
                )}
                {testType === BenchmarkTestType.QUALITATIVE && (
                  <>
                    <p>• Ce test évalue la créativité et le raisonnement complexe</p>
                    <p>• Les résultats peuvent varier selon la température utilisée</p>
                    <p>• Analysez la cohérence et la pertinence des réponses</p>
                  </>
                )}
                {testType === BenchmarkTestType.REAL_DATA && (
                  <>
                    <p>• Test le plus exigeant, utilise de vraies données complexes</p>
                    <p>• Prend plus de temps mais donne les résultats les plus réalistes</p>
                    <p>• Essentiel pour valider les performances en production</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

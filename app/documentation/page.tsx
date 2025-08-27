'use client'

import { useState } from 'react'
import { 
  Book, 
  FileText, 
  Code, 
  Database, 
  Settings, 
  Users, 
  Target,
  Brain,
  BarChart3,
  Download,
  ExternalLink,
  ChevronRight,
  ChevronDown
} from 'lucide-react'

interface Section {
  id: string
  title: string
  icon: any
  content: React.ReactNode
}

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('introduction')
  const [expandedSections, setExpandedSections] = useState<string[]>(['introduction'])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const sections: Section[] = [
    {
      id: 'introduction',
      title: 'Introduction',
      icon: Book,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Projet de Mémoire : IA et Ostéopathie</h2>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Brain className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Ce projet explore l'application des Large Language Models (LLM) dans le domaine de l'ostéopathie, 
                  en évaluant leur capacité à analyser des cas cliniques et à fournir des diagnostics pertinents.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Objectifs du Projet</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <Target className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  Évaluer les performances des LLM sur des cas cliniques ostéopathiques
                </li>
                <li className="flex items-start">
                  <Target className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  Comparer différents modèles d'IA (Ollama, OpenAI, etc.)
                </li>
                <li className="flex items-start">
                  <Target className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  Développer un système de benchmark automatisé
                </li>
                <li className="flex items-start">
                  <Target className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  Analyser la pertinence clinique des réponses IA
                </li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Méthodologie</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <BarChart3 className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  Tests automatisés sur différents modèles LLM
                </li>
                <li className="flex items-start">
                  <BarChart3 className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  Évaluation qualitative par des praticiens
                </li>
                <li className="flex items-start">
                  <BarChart3 className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  Analyse comparative des performances
                </li>
                <li className="flex items-start">
                  <BarChart3 className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  Documentation des résultats et recommandations
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'architecture',
      title: 'Architecture Technique',
      icon: Code,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Architecture du Système</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stack Technologique</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Frontend</span>
                  <span className="text-sm text-gray-600">Next.js 14 + TypeScript</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Styling</span>
                  <span className="text-sm text-gray-600">Tailwind CSS</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">LLM Local</span>
                  <span className="text-sm text-gray-600">Ollama + Docker</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">API</span>
                  <span className="text-sm text-gray-600">REST + WebSockets</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Storage</span>
                  <span className="text-sm text-gray-600">JSON + LocalStorage</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Composants Principaux</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-blue-400 pl-3">
                  <div className="font-medium text-gray-900">BenchmarkRunner</div>
                  <div className="text-sm text-gray-600">Orchestration des tests automatisés</div>
                </div>
                <div className="border-l-4 border-green-400 pl-3">
                  <div className="font-medium text-gray-900">ModelStatus</div>
                  <div className="text-sm text-gray-600">Surveillance des modèles disponibles</div>
                </div>
                <div className="border-l-4 border-purple-400 pl-3">
                  <div className="font-medium text-gray-900">QuickAnalysis</div>
                  <div className="text-sm text-gray-600">Interface d'analyse rapide</div>
                </div>
                <div className="border-l-4 border-orange-400 pl-3">
                  <div className="font-medium text-gray-900">BenchmarkHistory</div>
                  <div className="text-sm text-gray-600">Historique et comparaisons</div>
                </div>
                <div className="border-l-4 border-red-400 pl-3">
                  <div className="font-medium text-gray-900">CustomQuestions</div>
                  <div className="text-sm text-gray-600">Gestion des questions personnalisées</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Flux de Données</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="font-medium text-gray-900">Interface Utilisateur</div>
                <div className="text-sm text-gray-600">Saisie des cas cliniques</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Brain className="w-6 h-6 text-green-600" />
                </div>
                <div className="font-medium text-gray-900">Traitement IA</div>
                <div className="text-sm text-gray-600">Analyse par les LLM</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="font-medium text-gray-900">Résultats</div>
                <div className="text-sm text-gray-600">Analyse et comparaison</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'modeles',
      title: 'Modèles LLM Testés',
      icon: Brain,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Modèles d'IA Évalués</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Brain className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">LLaMA 3.2</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Taille:</span>
                  <span className="font-medium">3B paramètres</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Spécialité:</span>
                  <span className="font-medium">Usage général</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Performance:</span>
                  <span className="font-medium text-green-600">Excellente</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">DeepSeek R1</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Taille:</span>
                  <span className="font-medium">1.5B paramètres</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Spécialité:</span>
                  <span className="font-medium">Raisonnement</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Performance:</span>
                  <span className="font-medium text-yellow-600">Bonne</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Brain className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Qwen 3</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Taille:</span>
                  <span className="font-medium">1.7B paramètres</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Spécialité:</span>
                  <span className="font-medium">Multilingue</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Performance:</span>
                  <span className="font-medium text-yellow-600">Correcte</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Settings className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Critères d'Évaluation</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Précision du diagnostic</li>
                    <li>Pertinence des recommandations thérapeutiques</li>
                    <li>Cohérence anatomique et physiologique</li>
                    <li>Temps de réponse et efficacité</li>
                    <li>Capacité de raisonnement clinique</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'modeles-complets',
      title: 'Catalogue des Modèles',
      icon: Database,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">📚 Catalogue Complet des Modèles LLM</h2>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center mb-3">
              <Database className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Vue d'ensemble</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Ce projet utilise actuellement <strong>20 modèles LLM différents</strong> installés localement via Ollama. 
              Cette diversité permet une évaluation comparative approfondie des capacités d'analyse clinique 
              selon différentes architectures et spécialisations.
            </p>
          </div>

          {/* Statistiques des modèles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">20</div>
              <div className="text-sm text-gray-600">Modèles installés</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">6</div>
              <div className="text-sm text-gray-600">Spécialisés médecine</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">47.6 GB</div>
              <div className="text-sm text-gray-600">Espace total utilisé</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">0.3-8B</div>
              <div className="text-sm text-gray-600">Gamme paramètres</div>
            </div>
          </div>

          {/* Modèles spécialisés en médecine */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">🏥 Modèles Spécialisés Médecine</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-red-600 font-bold text-sm">MED</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Meditron</h4>
                    <p className="text-sm text-gray-600">3.8 GB - Modèle médical général</p>
                  </div>
                </div>
                <div className="text-sm text-gray-700">
                  <p><strong>Spécialité:</strong> Diagnostic médical général</p>
                  <p><strong>Architecture:</strong> LLaMA fine-tuned</p>
                  <p><strong>Usage:</strong> Cas cliniques complexes</p>
                </div>
              </div>

              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-green-600 font-bold text-sm">BIO</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">BioMistral</h4>
                    <p className="text-sm text-gray-600">4.4 GB - Biomédical spécialisé</p>
                  </div>
                </div>
                <div className="text-sm text-gray-700">
                  <p><strong>Spécialité:</strong> Recherche biomédicale</p>
                  <p><strong>Architecture:</strong> Mistral fine-tuned</p>
                  <p><strong>Usage:</strong> Analyses scientifiques</p>
                </div>
              </div>

              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold text-sm">ML2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">MedLLaMA2</h4>
                    <p className="text-sm text-gray-600">3.8 GB - LLaMA médical</p>
                  </div>
                </div>
                <div className="text-sm text-gray-700">
                  <p><strong>Spécialité:</strong> Questions médicales</p>
                  <p><strong>Architecture:</strong> LLaMA2 médical</p>
                  <p><strong>Usage:</strong> Q&A médical</p>
                </div>
              </div>

              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-purple-600 font-bold text-sm">MG</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">MedGemma</h4>
                    <p className="text-sm text-gray-600">2.5 GB - Gemma médical</p>
                  </div>
                </div>
                <div className="text-sm text-gray-700">
                  <p><strong>Spécialité:</strong> Médecine générale</p>
                  <p><strong>Architecture:</strong> Gemma fine-tuned</p>
                  <p><strong>Usage:</strong> Diagnostic primaire</p>
                </div>
              </div>

              <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-yellow-600 font-bold text-sm">QM</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Qwen3 Medical</h4>
                    <p className="text-sm text-gray-600">2.5 GB - Qwen médical GRPO</p>
                  </div>
                </div>
                <div className="text-sm text-gray-700">
                  <p><strong>Spécialité:</strong> Médecine orientale/occidentale</p>
                  <p><strong>Architecture:</strong> Qwen3 GRPO</p>
                  <p><strong>Usage:</strong> Approches thérapeutiques</p>
                </div>
              </div>

              <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-indigo-600 font-bold text-sm">CR</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Croissant LLM</h4>
                    <p className="text-sm text-gray-600">1.4 GB - Modèle français</p>
                  </div>
                </div>
                <div className="text-sm text-gray-700">
                  <p><strong>Spécialité:</strong> Français médical</p>
                  <p><strong>Architecture:</strong> Spécialisé français</p>
                  <p><strong>Usage:</strong> Terminologie française</p>
                </div>
              </div>
            </div>
          </div>

          {/* Modèles généralistes */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">🧠 Modèles Généralistes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Série Qwen */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center mr-2">
                    <span className="text-blue-600 text-xs font-bold">Q</span>
                  </span>
                  Série Qwen (5 modèles)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Qwen3 8B</span>
                    <span className="text-gray-600">5.2 GB</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Qwen3 4B</span>
                    <span className="text-gray-600">2.5 GB</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Qwen3 1.7B</span>
                    <span className="text-gray-600">1.4 GB</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Qwen3 0.6B</span>
                    <span className="text-gray-600">522 MB</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Qwen2 7B</span>
                    <span className="text-gray-600">4.4 GB</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">Excellentes performances multilingues, optimisés pour le raisonnement</p>
              </div>

              {/* Série Gemma */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-6 h-6 bg-green-100 rounded flex items-center justify-center mr-2">
                    <span className="text-green-600 text-xs font-bold">G</span>
                  </span>
                  Série Gemma (3 modèles)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Gemma3 Latest</span>
                    <span className="text-gray-600">3.3 GB</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Gemma3 1B</span>
                    <span className="text-gray-600">815 MB</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Gemma3 270M</span>
                    <span className="text-gray-600">291 MB</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">Modèles Google, équilibre performance/efficacité</p>
              </div>

              {/* Autres modèles */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center mr-2">
                    <span className="text-purple-600 text-xs font-bold">D</span>
                  </span>
                  Série DeepSeek (2 modèles)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>DeepSeek-R1 7B</span>
                    <span className="text-gray-600">4.7 GB</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>DeepSeek-R1 1.5B</span>
                    <span className="text-gray-600">1.1 GB</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">Spécialisés dans le raisonnement complexe et la logique</p>
              </div>

              {/* Divers */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center mr-2">
                    <span className="text-orange-600 text-xs font-bold">M</span>
                  </span>
                  Autres Modèles (4 modèles)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Mistral Latest</span>
                    <span className="text-gray-600">4.4 GB</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>LLaMA3.2 3B</span>
                    <span className="text-gray-600">2.0 GB</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Phi3 3.8B</span>
                    <span className="text-gray-600">2.2 GB</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>TinyLLaMA 1.1B</span>
                    <span className="text-gray-600">637 MB</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">Modèles de référence pour comparaisons de base</p>
              </div>
            </div>
          </div>

          {/* Critères de sélection et usage */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">📊 Critères de Sélection et Usage</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">🎯 Critères de Performance</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    <span><strong>Temps de réponse:</strong> &lt; 60 secondes par analyse</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    <span><strong>Cohérence clinique:</strong> Terminologie médicale correcte</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    <span><strong>Ressources système:</strong> Compatible CPU uniquement</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    <span><strong>Multilingue:</strong> Français/Anglais médical</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">🔄 Usage dans les Benchmarks</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    <span><strong>Tests principaux:</strong> 3-5 modèles sélectionnés</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    <span><strong>Tests comparatifs:</strong> Tous les modèles médicaux</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    <span><strong>Tests de référence:</strong> Modèles généralistes</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    <span><strong>Tests de performance:</strong> Différentes tailles</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommandations d'usage */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">💡 Recommandations d'Usage par Cas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h4 className="font-medium text-blue-800 mb-2">🎯 Diagnostic Précis</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• Meditron (généraliste)</div>
                  <div>• BioMistral (recherche)</div>
                  <div>• MedLLaMA2 (Q&A)</div>
                </div>
              </div>
              
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h4 className="font-medium text-green-800 mb-2">⚡ Performance Rapide</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <div>• Gemma3 270M (ultra-rapide)</div>
                  <div>• Qwen3 0.6B (léger)</div>
                  <div>• TinyLLaMA (baseline)</div>
                </div>
              </div>
              
              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <h4 className="font-medium text-purple-800 mb-2">🧠 Raisonnement Complexe</h4>
                <div className="text-sm text-purple-700 space-y-1">
                  <div>• DeepSeek-R1 7B (logique)</div>
                  <div>• Qwen3 8B (multilingue)</div>
                  <div>• Mistral (général)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'methodologie',
      title: 'Matériel et Méthode',
      icon: FileText,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">🌐 Matériel et Méthode du Projet</h2>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <p className="text-gray-700 leading-relaxed">
              Cette section détaille la méthodologie mise en œuvre pour développer et évaluer l'application des 
              Large Language Models dans le domaine ostéopathique, en respectant les standards scientifiques 
              et les contraintes éthiques du secteur médical.
            </p>
          </div>

          {/* Étape 1 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Mise en place de l'environnement technique</h3>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">🔧 Ce qui a été fait :</h4>
              <p className="text-gray-700 mb-3">Installation de Docker et Ollama</p>
              
              <h4 className="font-medium text-gray-900 mb-2">💡 Pourquoi :</h4>
              <ul className="space-y-2 text-gray-700 mb-3">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-1">•</span>
                  <strong>Docker</strong> permet de créer un espace de travail isolé (« une boîte fermée ») où l'on peut installer et tester des logiciels sans risque pour l'ordinateur
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-1">•</span>
                  <strong>Ollama</strong> est un outil qui permet de faire tourner facilement des modèles d'intelligence artificielle (LLM) en local, directement sur l'ordinateur, sans avoir besoin d'Internet
                </li>
              </ul>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-3">
                <h4 className="font-medium text-green-800 mb-1">🎯 Intérêt pour le mémoire :</h4>
                <p className="text-green-700">Cela garantit que les tests d'IA seront indépendants, sécurisés et reproductibles.</p>
              </div>
            </div>
          </div>

          {/* Étape 2 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-purple-600 font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Choix et téléchargement des modèles d'IA (LLM)</h3>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">🔧 Ce qui a été fait :</h4>
              <p className="text-gray-700 mb-3">Téléchargement de 11 modèles différents d'IA</p>
              
              <h4 className="font-medium text-gray-900 mb-2">📋 Critères de sélection :</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-900 mb-1">💻 Compatibilité</div>
                  <div className="text-sm text-gray-600">Fonctionnement sur ordinateur sans carte graphique spécialisée</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-900 mb-1">🔒 Autonomie</div>
                  <div className="text-sm text-gray-600">Capacité à tourner en local (pas besoin de connexion Internet)</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-900 mb-1">🏥 Spécialisation</div>
                  <div className="text-sm text-gray-600">Existence de modèles spécialisés en santé/médecine</div>
                </div>
              </div>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-3">
                <h4 className="font-medium text-green-800 mb-1">🎯 Intérêt pour le mémoire :</h4>
                <p className="text-green-700">Permet de comparer plusieurs IA et de voir lesquelles sont les plus adaptées pour analyser les données ostéopathiques.</p>
              </div>
            </div>
          </div>

          {/* Étape 3 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-green-600 font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Mise en place des modèles dans Docker</h3>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">🔧 Ce qui a été fait :</h4>
              <p className="text-gray-700 mb-3">Installation des IA dans un conteneur Docker</p>
              
              <h4 className="font-medium text-gray-900 mb-2">💡 Pourquoi :</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="font-medium text-red-800 mb-2">🔐 Sécurité</div>
                  <div className="text-sm text-red-700">Le conteneur ne communique pas avec Internet → sécurité et respect du RGPD (protection des données patients)</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="font-medium text-blue-800 mb-2">⚖️ Stabilité</div>
                  <div className="text-sm text-blue-700">Environnement stable : tous les tests se font toujours dans les mêmes conditions</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="font-medium text-purple-800 mb-2">📈 Scalabilité</div>
                  <div className="text-sm text-purple-700">Facilite les tests sur d'autres ordinateurs ou avec plus de données, facile à reproduire</div>
                </div>
              </div>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-3">
                <h4 className="font-medium text-green-800 mb-1">🎯 Intérêt pour le mémoire :</h4>
                <p className="text-green-700">Assurer que les résultats sont fiables et utilisables dans un cadre scientifique.</p>
              </div>
            </div>
          </div>

          {/* Étape 4 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-yellow-600 font-bold">4</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Premières interactions avec les IA</h3>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">🔧 Ce qui a été fait :</h4>
              <p className="text-gray-700 mb-3">Tests simples pour comprendre :</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="font-medium text-gray-900 mb-2">💬 Communication</div>
                  <div className="text-sm text-gray-600">Comment dialoguer avec un LLM</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="font-medium text-gray-900 mb-2">⚙️ Paramètres</div>
                  <div className="text-sm text-gray-600">Quels paramètres influencent ses réponses (précision, temps de réponse, style de réponse)</div>
                </div>
              </div>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-3">
                <h4 className="font-medium text-green-800 mb-1">🎯 Intérêt pour le mémoire :</h4>
                <p className="text-green-700">L'étudiant peut expliquer le fonctionnement de base d'une IA et comment elle produit ses réponses.</p>
              </div>
            </div>
          </div>

          {/* Étape 5 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-orange-600 font-bold">5</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Benchmark des modèles d'IA</h3>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">🔧 Ce qui a été fait :</h4>
              <p className="text-gray-700 mb-3">Comparaison des 11 IA sur différents critères :</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="font-medium text-blue-800 mb-2">⚡ Temps de réponse</div>
                  <div className="text-sm text-blue-700">Évaluation de la rapidité de traitement</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="font-medium text-purple-800 mb-2">🎯 Pertinence des réponses</div>
                  <div className="text-sm text-purple-700">Qualité médicale et logique des analyses</div>
                </div>
              </div>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-3">
                <h4 className="font-medium text-green-800 mb-1">🎯 Intérêt pour le mémoire :</h4>
                <p className="text-green-700">Montrer objectivement quelles IA sont les plus efficaces et les plus adaptées pour une utilisation en ostéopathie.</p>
              </div>
            </div>
          </div>

          {/* Étape 6 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-red-600 font-bold">6</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Création d'un site web pour interagir avec les IA 
                <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full ml-2">(en cours)</span>
              </h3>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">🔧 Ce qui est en cours :</h4>
              <p className="text-gray-700 mb-3">Développement d'une interface web simple où :</p>
              
              <div className="space-y-3 mb-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="font-medium text-gray-900 mb-2">📁 Input</div>
                  <div className="text-sm text-gray-600">On peut envoyer un fichier de données patients (ex. fichier Excel ou CSV)</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="font-medium text-gray-900 mb-2">🤖 Traitement IA</div>
                  <div className="text-sm text-gray-600">L'IA analyse et donne en retour :</div>
                  <ul className="list-disc list-inside text-xs text-gray-500 mt-1 ml-4">
                    <li>Les tests orthopédiques pertinents à réaliser</li>
                    <li>Une indication sur la prise en charge (ostéopathique ou besoin d'orientation médicale)</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-green-50 border-l-4 border-green-400 p-3">
                <h4 className="font-medium text-green-800 mb-2">🎯 Intérêt pour le mémoire :</h4>
                <ul className="space-y-1 text-green-700 text-sm">
                  <li>• Rendre l'outil utilisable par un ostéopathe sans connaissances techniques</li>
                  <li>• Montrer la faisabilité concrète du projet dans un contexte de recherche appliquée</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Conclusion */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">🎯 Conclusion : Pourquoi tout ça est important pour l'étudiant</h3>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">📝 En résumé :</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-700">
                    <span className="text-green-500 mr-2">✓</span>
                    Environnement sécurisé et reproductible (Docker + local)
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <span className="text-green-500 mr-2">✓</span>
                    Sélection de plusieurs IA adaptées à la santé
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-700">
                    <span className="text-green-500 mr-2">✓</span>
                    Tests et comparaisons objectives (benchmark)
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <span className="text-green-500 mr-2">✓</span>
                    Outil concret utilisable par les praticiens
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">👉 Valeur pour la défense du projet :</h4>
              <p className="text-blue-700 text-sm leading-relaxed">
                L'étudiant pourra défendre son projet en expliquant que non seulement c'est techniquement faisable, 
                mais que les choix faits respectent la <strong>confidentialité</strong>, la <strong>rigueur scientifique</strong> 
                et la <strong>praticité clinique</strong>.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'benchmark',
      title: 'Système de Benchmark',
      icon: BarChart3,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Méthodologie de Benchmark</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Types de Questions</h3>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-semibold text-sm">B</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Questions Basiques</div>
                    <div className="text-sm text-gray-600">Tests de fonctionnement et de compréhension</div>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-red-50 rounded-lg">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-red-600 font-semibold text-sm">M</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Questions Médicales</div>
                    <div className="text-sm text-gray-600">Cas cliniques et diagnostics ostéopathiques</div>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-green-600 font-semibold text-sm">G</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Questions Générales</div>
                    <div className="text-sm text-gray-600">Connaissances générales et raisonnement</div>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-600 font-semibold text-sm">C</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Questions de Code</div>
                    <div className="text-sm text-gray-600">Capacités de programmation et logique</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Métriques d'Évaluation</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-400 pl-4">
                  <div className="font-medium text-gray-900">Temps de Réponse</div>
                  <div className="text-sm text-gray-600">Mesure de la rapidité de traitement</div>
                </div>
                <div className="border-l-4 border-green-400 pl-4">
                  <div className="font-medium text-gray-900">Taux de Succès</div>
                  <div className="text-sm text-gray-600">Pourcentage de réponses valides</div>
                </div>
                <div className="border-l-4 border-yellow-400 pl-4">
                  <div className="font-medium text-gray-900">Tokens par Seconde</div>
                  <div className="text-sm text-gray-600">Vitesse de génération de texte</div>
                </div>
                <div className="border-l-4 border-purple-400 pl-4">
                  <div className="font-medium text-gray-900">Qualité Clinique</div>
                  <div className="text-sm text-gray-600">Évaluation par notation manuelle</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Processus de Test Automatisé</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div className="font-medium text-gray-900">Sélection</div>
                <div className="text-sm text-gray-600">Choix des modèles et questions</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div className="font-medium text-gray-900">Exécution</div>
                <div className="text-sm text-gray-600">Tests parallèles automatisés</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-yellow-600 font-bold">3</span>
                </div>
                <div className="font-medium text-gray-900">Collecte</div>
                <div className="text-sm text-gray-600">Enregistrement des métriques</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-purple-600 font-bold">4</span>
                </div>
                <div className="font-medium text-gray-900">Analyse</div>
                <div className="text-sm text-gray-600">Comparaison et rapport</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'resultats',
      title: 'Résultats et Analyses',
      icon: FileText,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Résultats Préliminaires</h2>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Observations Principales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Points Positifs</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    LLaMA 3.2 montre la meilleure cohérence clinique
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Capacité à identifier des patterns anatomiques
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Bonne compréhension du vocabulaire médical
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    Temps de réponse acceptable en local
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Défis Identifiés</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">⚠</span>
                    Variabilité selon la complexité du cas
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">⚠</span>
                    Tendance à sur-diagnostiquer
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">⚠</span>
                    Difficultés avec les cas atypiques
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">⚠</span>
                    Besoin de validation clinique systématique
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">85%</div>
              <div className="text-sm text-gray-600">Taux de réussite moyen</div>
              <div className="text-xs text-gray-500 mt-1">sur questions basiques</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">67%</div>
              <div className="text-sm text-gray-600">Précision diagnostique</div>
              <div className="text-xs text-gray-500 mt-1">sur cas cliniques</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">32s</div>
              <div className="text-sm text-gray-600">Temps moyen</div>
              <div className="text-xs text-gray-500 mt-1">par analyse complète</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommandations</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">1</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Amélioration du Dataset</div>
                  <div className="text-sm text-gray-600">Enrichir la base de cas cliniques avec des exemples validés</div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-green-600 text-xs font-bold">2</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Fine-tuning Spécialisé</div>
                  <div className="text-sm text-gray-600">Adapter les modèles aux spécificités ostéopathiques</div>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-yellow-600 text-xs font-bold">3</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Validation Clinique</div>
                  <div className="text-sm text-gray-600">Collaboration avec des praticiens expérimentés</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'installation',
      title: 'Installation et Configuration',
      icon: Settings,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Guide d'Installation</h2>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Settings className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Prérequis Système</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Docker Desktop installé et configuré</li>
                    <li>Node.js 18+ et npm/yarn</li>
                    <li>Au moins 8GB de RAM disponible</li>
                    <li>20GB d'espace disque libre</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Installation Ollama</h3>
              <div className="space-y-3">
                <div className="bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-sm">
                  <div># Installation via Docker</div>
                  <div>docker pull ollama/ollama</div>
                  <div className="mt-2"># Démarrage du service</div>
                  <div>docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama</div>
                </div>
                <div className="text-sm text-gray-600">
                  Ceci installe et démarre le service Ollama en mode conteneur
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Installation des Modèles</h3>
              <div className="space-y-3">
                <div className="bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-sm">
                  <div># Modèles recommandés</div>
                  <div>ollama pull llama3.2:3b</div>
                  <div>ollama pull deepseek-r1:1.5b</div>
                  <div>ollama pull qwen3:1.7b</div>
                </div>
                <div className="text-sm text-gray-600">
                  Ces commandes téléchargent les modèles principaux utilisés dans les tests
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration de l'Application</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">1. Clone du Repository</h4>
                <div className="bg-gray-900 rounded-lg p-3 text-green-400 font-mono text-sm">
                  git clone https://github.com/your-repo/medical-llm-osteopathy.git
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">2. Installation des Dépendances</h4>
                <div className="bg-gray-900 rounded-lg p-3 text-green-400 font-mono text-sm">
                  <div>cd medical-llm-osteopathy</div>
                  <div>npm install</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">3. Configuration Environnement</h4>
                <div className="bg-gray-900 rounded-lg p-3 text-green-400 font-mono text-sm">
                  <div># Créer .env.local</div>
                  <div>OLLAMA_URL=http://localhost:11434</div>
                  <div>NEXT_PUBLIC_APP_ENV=development</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">4. Lancement</h4>
                <div className="bg-gray-900 rounded-lg p-3 text-green-400 font-mono text-sm">
                  <div># Mode développement</div>
                  <div>npm run dev</div>
                  <div className="mt-2"># Mode production</div>
                  <div>npm run build && npm start</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Vérification de l'Installation</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center">
                <span className="text-blue-500 mr-2">•</span>
                Accéder à http://localhost:3000 pour l'interface web
              </div>
              <div className="flex items-center">
                <span className="text-blue-500 mr-2">•</span>
                Vérifier que les modèles apparaissent dans le dashboard
              </div>
              <div className="flex items-center">
                <span className="text-blue-500 mr-2">•</span>
                Tester une analyse rapide pour valider la communication
              </div>
              <div className="flex items-center">
                <span className="text-blue-500 mr-2">•</span>
                Lancer un petit benchmark pour confirmer le fonctionnement
              </div>
            </div>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Book className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Documentation</h1>
                <p className="text-sm text-gray-500">Projet IA & Ostéopathie</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <Download size={16} className="mr-2" />
                Export PDF
              </button>
              <a 
                href="/benchmark" 
                className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                <ExternalLink size={16} className="mr-2" />
                Benchmark
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sommaire</h2>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <section.icon className="h-4 w-4 mr-3" />
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              {sections.find(s => s.id === activeSection)?.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

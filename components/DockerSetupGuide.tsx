'use client'

import { useState } from 'react'
import { Container, Terminal, CheckCircle, Copy, ExternalLink } from 'lucide-react'

export default function DockerSetupGuide() {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCommand(text)
    setTimeout(() => setCopiedCommand(null), 2000)
  }

  const commands = [
    {
      title: 'Démarrer les services Docker',
      command: 'docker-compose up -d',
      description: 'Lance tous les services Ollama en arrière-plan'
    },
    {
      title: 'Vérifier le statut des services',
      command: 'docker-compose ps',
      description: 'Affiche l\'état des conteneurs Docker'
    },
    {
      title: 'Installer un premier modèle (rapide)',
      command: 'docker exec ollama-medical ollama pull llama3.2:3b',
      description: 'Installe Llama 3.2 3B (modèle compact ~2GB)'
    },
    {
      title: 'Installer un modèle médical spécialisé',
      command: 'docker exec ollama-medical ollama pull meditron:latest',
      description: 'Installe Meditron (spécialisé médical ~4GB)'
    },
    {
      title: 'Lister les modèles installés',
      command: 'docker exec ollama-medical ollama list',
      description: 'Affiche tous les modèles disponibles'
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center mb-6">
        <div className="bg-blue-100 p-3 rounded-lg mr-4">
          <Container className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Guide d'installation Docker + Ollama
          </h3>
          <p className="text-gray-600">
            Configuration requise pour utiliser les modèles IA
          </p>
        </div>
      </div>

      {/* Prérequis */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">Prérequis</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-yellow-600" />
            Docker Desktop installé et démarré
          </li>
          <li className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-yellow-600" />
            Au moins 8GB de RAM disponible
          </li>
          <li className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-yellow-600" />
            10-20GB d'espace disque libre
          </li>
        </ul>
        <a 
          href="https://www.docker.com/products/docker-desktop/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center mt-3 text-yellow-800 hover:text-yellow-900 font-medium text-sm"
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Télécharger Docker Desktop
        </a>
      </div>

      {/* Commandes */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center">
          <Terminal className="w-5 h-5 mr-2 text-gray-600" />
          Commandes d'installation
        </h4>
        
        {commands.map((cmd, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-gray-900">{cmd.title}</h5>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                Étape {index + 1}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{cmd.description}</p>
            
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                {cmd.command}
              </code>
              <button
                onClick={() => copyToClipboard(cmd.command)}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Copier la commande"
              >
                {copiedCommand === cmd.command ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Instructions supplémentaires */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Notes importantes</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Le premier démarrage peut prendre 2-3 minutes</li>
          <li>• L'installation d'un modèle peut prendre 5-15 minutes selon la taille</li>
          <li>• Les modèles sont téléchargés une seule fois et conservés</li>
          <li>• Vous pouvez arrêter les services avec: <code className="bg-blue-100 px-1 rounded">docker-compose down</code></li>
        </ul>
      </div>

      {/* Script automatique */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="font-semibold text-green-900 mb-2">Script d'installation automatique</h4>
        <p className="text-sm text-green-800 mb-3">
          Vous pouvez aussi utiliser le script d'installation automatique des modèles :
        </p>
        <div className="flex items-center space-x-2">
          <code className="flex-1 bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
            npm run models:install
          </code>
          <button
            onClick={() => copyToClipboard('npm run models:install')}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            {copiedCommand === 'npm run models:install' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Home, ArrowLeft, Search, Bot } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Animation */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-blue-600 mb-4">404</div>
          <div className="flex justify-center space-x-2 mb-4">
            <Bot className="w-8 h-8 text-blue-500 animate-bounce" />
            <Search className="w-8 h-8 text-gray-400 animate-pulse" />
          </div>
        </div>

        {/* Error Message */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Page non trouvée
          </h1>
          <p className="text-gray-600 mb-6">
            Désolé, la page que vous recherchez n'existe pas. 
            Elle a peut-être été déplacée ou supprimée.
          </p>
          
          {/* Suggestions */}
          <div className="text-left space-y-2 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Que voulez-vous faire ?</p>
            
            <Link href="/" className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group">
              <Home className="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <div className="font-medium text-blue-900">Retour à l'accueil</div>
                <div className="text-sm text-blue-600">Voir le dashboard principal</div>
              </div>
            </Link>
            
            <Link href="/benchmark" className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group">
              <Bot className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <div className="font-medium text-green-900">Tests & Benchmarks</div>
                <div className="text-sm text-green-600">Tester les modèles IA</div>
              </div>
            </Link>
            
            <Link href="/documentation" className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group">
              <Search className="w-5 h-5 text-purple-600 mr-3" />
              <div>
                <div className="font-medium text-purple-900">Documentation</div>
                <div className="text-sm text-purple-600">Guide et API</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Back Button */}
        <button 
          onClick={() => window.history.back()}
          className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la page précédente
        </button>

        {/* Footer */}
        <div className="mt-8 text-sm text-gray-500">
          <p>Besoin d'aide ? Consultez la documentation ou vérifiez l'URL.</p>
        </div>
      </div>
    </div>
  )
}

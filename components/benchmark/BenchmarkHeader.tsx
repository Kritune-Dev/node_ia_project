'use client'

import React from 'react'
import { ArrowLeft, BarChart3, History, Trophy } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BenchmarkHeaderProps {
  title: string
  subtitle?: string
  currentPage?: 'main' | 'history' | 'ranking' | 'results'
  showBackButton?: boolean
  onBack?: () => void
}

const BenchmarkHeader: React.FC<BenchmarkHeaderProps> = ({
  title,
  subtitle,
  currentPage = 'main',
  showBackButton = false,
  onBack
}) => {
  const router = useRouter()

  const handleNavigation = (path: string) => {
    router.push(path as any)
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Navigation et titre */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Navigation rapide */}
          <div className="flex space-x-2">
            <button
              onClick={() => handleNavigation('/benchmark')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm font-medium ${
                currentPage === 'main'
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Benchmark</span>
            </button>
            
            <button
              onClick={() => handleNavigation('/benchmark/history')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm font-medium ${
                currentPage === 'history'
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Historique</span>
            </button>
            
            <button
              onClick={() => handleNavigation('/benchmark/ranking')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm font-medium ${
                currentPage === 'ranking'
                  ? 'bg-blue-100 text-blue-700 shadow-sm'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Classement</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BenchmarkHeader

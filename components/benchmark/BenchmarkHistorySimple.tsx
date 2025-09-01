'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, TrendingUp, ExternalLink, CheckCircle, XCircle, AlertCircle, RefreshCw, Trash2, MoreVertical, Play } from 'lucide-react'
import { useBenchmarkHistory, useBenchmarkOperations } from '../../hooks/useApi'

interface BenchmarkSummary {
  id: string
  name: string
  timestamp: string
  duration: number
  successRate: number
  status: 'completed' | 'failed' | 'running'
  modelsDisplayNames: string[]
  testSeriesNames: string[]
  modelCount: number
  questionCount: number
}

interface ModelInfo {
  name: string
  type: string
}

export default function BenchmarkHistorySimple() {
  const router = useRouter()
  
  // Utilisation des hooks API modernes
  const { benchmarks, isLoading, error, refresh } = useBenchmarkHistory()
  const { deleteBenchmark, deleteAllBenchmarks } = useBenchmarkOperations()
  
  // États locaux
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())
  const [deletingBenchmarks, setDeletingBenchmarks] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  
  // Filtres multiples
  const [selectedModelTypes, setSelectedModelTypes] = useState<string[]>([])
  const [selectedBenchmarkIds, setSelectedBenchmarkIds] = useState<string[]>([])
  const [availableModelTypes] = useState<string[]>(['medical', 'general', 'rapide'])
  const [availableBenchmarkIds, setAvailableBenchmarkIds] = useState<string[]>([])

  useEffect(() => {
    if (benchmarks && benchmarks.length > 0) {
      // Extraire les séries de tests uniques
      const benchmarkIdsSet = new Set<string>()
      benchmarks.forEach((benchmark: BenchmarkSummary) => {
        benchmark.testSeriesNames?.forEach(name => benchmarkIdsSet.add(name))
      })
      setAvailableBenchmarkIds(Array.from(benchmarkIdsSet))
    }
  }, [benchmarks])

  // Fermer les menus quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      setExpandedMenus(new Set())
    }
    
    if (expandedMenus.size > 0) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [expandedMenus])

  const handleResultClick = (benchmark: BenchmarkSummary) => {
    // Utilise l'ID pour la navigation vers les résultats
    router.push(`/benchmark/results/${benchmark.id}`)
  }

  const handleDeleteBenchmark = async (benchmarkId: string, deleteFiles: boolean = false) => {
    try {
      setDeletingBenchmarks(prev => {
        const newSet = new Set(prev)
        newSet.add(benchmarkId)
        return newSet
      })
      await deleteBenchmark(benchmarkId, deleteFiles)
      await refresh() // Actualiser la liste
      setShowDeleteConfirm(null)
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression du benchmark')
    } finally {
      setDeletingBenchmarks(prev => {
        const newSet = new Set(prev)
        newSet.delete(benchmarkId)
        return newSet
      })
    }
  }

  const toggleMenu = (benchmarkId: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev)
      if (newSet.has(benchmarkId)) {
        newSet.delete(benchmarkId)
      } else {
        newSet.add(benchmarkId)
      }
      return newSet
    })
  }

  const filteredAndSortedBenchmarks = (benchmarks || [])
    .filter((benchmark: BenchmarkSummary) => {
      // Filtre par types de modèles (basé sur les displayNames des modèles)
      const matchesModelTypes = selectedModelTypes.length === 0 || 
                                selectedModelTypes.some(type => {
                                  // Pour le moment, on simplifie en supposant que les noms contiennent des indices
                                  return benchmark.modelsDisplayNames?.some((modelName: string) => {
                                    const lowerName = modelName.toLowerCase()
                                    return (type === 'medical' && (lowerName.includes('med') || lowerName.includes('bio'))) ||
                                           (type === 'general' && !lowerName.includes('med') && !lowerName.includes('bio') && !lowerName.includes('tiny') && !lowerName.includes('270m') && !lowerName.includes('600m') && !lowerName.includes('1b') && !lowerName.includes('1.5b')) ||
                                           (type === 'rapide' && (lowerName.includes('tiny') || lowerName.includes('270m') || lowerName.includes('600m') || lowerName.includes('1b') || lowerName.includes('1.5b')))
                                  }) || false
                                })
      
      // Filtre par séries de tests
      const matchesBenchmarkIds = selectedBenchmarkIds.length === 0 ||
                                  selectedBenchmarkIds.some(name => benchmark.testSeriesNames?.includes(name))
      
      return matchesModelTypes && matchesBenchmarkIds
    })
    .sort((a: BenchmarkSummary, b: BenchmarkSummary) => {
      // Tri par date uniquement (plus récent en premier)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

  // Créer la liste combinée avec les tests en cours
  const allItems = []

  
  // Ajouter les benchmarks terminés
  allItems.push(...filteredAndSortedBenchmarks)

  const toggleModelType = (type: string) => {
    setSelectedModelTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const toggleBenchmarkId = (id: string) => {
    setSelectedBenchmarkIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const clearAllFilters = () => {
    setSelectedModelTypes([])
    setSelectedBenchmarkIds([])
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (milliseconds?: number) => {
    if (!milliseconds) return 'N/A'
    // Convertir les millisecondes en secondes
    const seconds = Math.round(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      case 'running':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'failed':
        return <XCircle className="w-4 h-4" />
      case 'running':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Chargement de l'historique...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center py-12">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => refresh()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      {/* En-tête avec filtres */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              📊 Historique des Benchmarks
            </h2>
            <p className="text-gray-600">
              {(benchmarks || []).length} benchmark(s) trouvé(s)
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => refresh()}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Actualiser"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="mt-6 space-y-4">
          {/* Filtres par types de modèles */}
          {availableModelTypes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Types de modèles:</h4>
              <div className="flex flex-wrap gap-2">
                {availableModelTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => toggleModelType(type)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedModelTypes.includes(type)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type === 'rapide' ? '⚡ Rapide' : 
                     type === 'medical' ? '🏥 Médical' : 
                     type === 'general' ? '🔧 Général' : type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filtres par séries de tests */}
          {availableBenchmarkIds.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Séries de tests:</h4>
              <div className="flex flex-wrap gap-2">
                {availableBenchmarkIds.map(name => (
                  <button
                    key={name}
                    onClick={() => toggleBenchmarkId(name)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedBenchmarkIds.includes(name)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    title={name} // Le nom complet est déjà disponible
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bouton de réinitialisation */}
          {(selectedModelTypes.length > 0 || selectedBenchmarkIds.length > 0) && (
            <div className="flex justify-end">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Liste des benchmarks */}
      {allItems.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun benchmark trouvé
          </h3>
          <p className="text-gray-600">
            {selectedModelTypes.length > 0 || selectedBenchmarkIds.length > 0
              ? 'Essayez de modifier vos filtres de recherche'
              : 'Aucun benchmark n\'a encore été exécuté'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {allItems.map((item: any) => (
            <div
              key={item.id}
              className={`border border-gray-200 rounded-xl p-6 transition-all ${
                item.isCurrentTest 
                  ? 'border-blue-300 bg-blue-50 shadow-lg'
                  : 'hover:shadow-lg cursor-pointer hover:border-blue-300'
              }`}
              onClick={item.isCurrentTest ? undefined : () => handleResultClick(item)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {item.isCurrentTest && (
                      <Play className="w-5 h-5 text-blue-600 animate-pulse" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.name}
                      {item.isCurrentTest && ' (En cours)'}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      {item.status === 'completed' ? 'Terminé' : 
                       item.status === 'failed' ? 'Échoué' : 'En cours'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(item.timestamp)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <TrendingUp className="w-4 h-4" />
                      <span>
                        {item.isCurrentTest 
                          ? 'En cours...' 
                          : `${item.successRate.toFixed(1)}% moyenne`}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(item.duration)}</span>
                    </div>
                  </div>

                  {/* Badges des modèles */}
                  {item.modelsDisplayNames && item.modelsDisplayNames.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-medium text-gray-500 mb-2">Modèles testés:</h4>
                      <div className="flex flex-wrap gap-2">
                        {item.modelsDisplayNames.map((modelDisplayName: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium"
                          >
                            {modelDisplayName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Badges des séries de tests */}
                  {item.testSeriesNames && item.testSeriesNames.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-medium text-gray-500 mb-2">Séries de tests:</h4>
                      <div className="flex flex-wrap gap-2">
                        {item.testSeriesNames.map((seriesName: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium"
                          >
                            {seriesName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                <div className="ml-4 flex items-center gap-2">
                  {!item.isCurrentTest && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleMenu(item.id)
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {/* Menu contextuel */}
                      {expandedMenus.has(item.id) && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowDeleteConfirm(item.id)
                              toggleMenu(item.id)
                            }}
                            className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                            disabled={deletingBenchmarks.has(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            {deletingBenchmarks.has(item.id) ? 'Suppression...' : 'Supprimer'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!item.isCurrentTest && <ExternalLink className="w-5 h-5 text-gray-400" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer ce benchmark ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteBenchmark(showDeleteConfirm, false)}
                className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                disabled={deletingBenchmarks.has(showDeleteConfirm)}
              >
                {deletingBenchmarks.has(showDeleteConfirm) ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

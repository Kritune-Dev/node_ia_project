'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Clock, Activity } from 'lucide-react'

interface StatData {
  totalAnalyses: number
  successRate: number
  avgProcessingTime: number
  activeModels: number
}

export default function StatsDashboard() {
  const [stats, setStats] = useState<StatData>({
    totalAnalyses: 0,
    successRate: 0,
    avgProcessingTime: 0,
    activeModels: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simuler le chargement des statistiques
    // TODO: Remplacer par un appel API réel
    const fetchStats = async () => {
      try {
        // Simulation de données
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setStats({
          totalAnalyses: 147,
          successRate: 94.2,
          avgProcessingTime: 2.3,
          activeModels: 8,
        })
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    unit, 
    color = 'text-blue-600',
    bgColor = 'bg-blue-50' 
  }: {
    icon: any
    title: string
    value: string | number
    unit?: string
    color?: string
    bgColor?: string
  }) => (
    <div className="p-4 bg-white rounded-lg border">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <div className="flex items-baseline">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          {unit && <span className="ml-1 text-sm text-gray-500">{unit}</span>}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
          Statistiques
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Performance du système en temps réel
        </p>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          <StatCard
            icon={Activity}
            title="Analyses Totales"
            value={stats.totalAnalyses}
            color="text-green-600"
            bgColor="bg-green-50"
          />
          
          <StatCard
            icon={TrendingUp}
            title="Taux de Succès"
            value={stats.successRate}
            unit="%"
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          
          <StatCard
            icon={Clock}
            title="Temps Moyen"
            value={stats.avgProcessingTime}
            unit="s"
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
          
          <StatCard
            icon={BarChart3}
            title="Modèles Actifs"
            value={stats.activeModels}
            color="text-orange-600"
            bgColor="bg-orange-50"
          />
        </div>

        {/* Graphique de tendance simple */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Activité des 7 derniers jours
          </h4>
          <div className="flex items-end space-x-1 h-16">
            {[12, 19, 15, 27, 22, 34, 28].map((height, index) => (
              <div
                key={index}
                className="flex-1 bg-medical-200 rounded-t"
                style={{ height: `${(height / 34) * 100}%` }}
                title={`Jour ${index + 1}: ${height} analyses`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Il y a 7j</span>
            <span>Aujourd'hui</span>
          </div>
        </div>
      </div>
    </div>
  )
}

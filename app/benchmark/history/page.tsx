'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { History, ArrowLeft } from 'lucide-react';
import { useBenchmark } from '../../../hooks/useBenchmark';
import BenchmarkHistory from '../../../components/benchmark/BenchmarkHistory';

export default function BenchmarkHistoryPage() {
  const router = useRouter();
  const { executionHistory, reloadHistory } = useBenchmark();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* En-tête */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/benchmark')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                  📊 Historique des Benchmarks
                </h1>
                <p className="text-lg text-gray-600">
                  Consultez et analysez vos benchmarks précédents
                </p>
              </div>
            </div>
            
            {/* Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/benchmark')}
                className="px-4 py-2 rounded-lg font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Benchmark
              </button>
              <button
                onClick={() => router.push('/benchmark/history')}
                className="px-4 py-2 rounded-lg font-medium transition-all bg-blue-500 text-white shadow-lg"
              >
                <History className="w-4 h-4 inline mr-2" />
                Historique
              </button>
              <button
                onClick={() => router.push('/benchmark/ranking')}
                className="px-4 py-2 rounded-lg font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Classement
              </button>
            </div>
          </div>
        </div>

        {/* Contenu de l'historique */}
        <BenchmarkHistory 
          benchmarks={executionHistory} 
          onSelectBenchmark={(benchmark) => {
            router.push(`/benchmark/results/${benchmark.id}`);
          }}
          onDataUpdate={async () => {
            try {
              await reloadHistory();
            } catch (error) {
              console.error('Erreur lors de l\'actualisation de l\'historique:', error);
            }
          }}
        />
      </div>
    </div>
  );
}

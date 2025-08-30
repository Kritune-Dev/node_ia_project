'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, ArrowLeft, Settings, History } from 'lucide-react';
import { useBenchmarkHistory } from '../../../hooks/useApi';
import BenchmarkRanking from '../../../components/benchmark/BenchmarkRanking';

export default function BenchmarkRankingPage() {
  const router = useRouter();
  const { benchmarks } = useBenchmarkHistory();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* En-tête amélioré */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                🏆 Classement des Modèles
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                Comparez les performances de vos modèles LLM
              </p>
            </div>
            
            {/* Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/benchmark')}
                className="px-4 py-2 rounded-lg font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Benchmark
              </button>
              <button
                onClick={() => router.push('/benchmark/history')}
                className="px-4 py-2 rounded-lg font-medium transition-all bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <History className="w-4 h-4 inline mr-2" />
                Historique
              </button>
              <button
                onClick={() => router.push('/benchmark/ranking')}
                className="px-4 py-2 rounded-lg font-medium transition-all bg-blue-500 text-white shadow-lg"
              >
                <Trophy className="w-4 h-4 inline mr-2" />
                Classement
              </button>
            </div>
          </div>
        </div>

        {/* Contenu du classement */}
        <BenchmarkRanking 
          benchmarks={benchmarks || []}
          onSelectBenchmark={(benchmark) => {
            router.push(`/benchmark/results/${benchmark.id}`);
          }}
        />
      </div>
    </div>
  );
}

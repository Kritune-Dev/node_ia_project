'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { useBenchmarkHistory } from '../../../hooks/useApi';
import BenchmarkRanking from '../../../components/benchmark/BenchmarkRanking';
import BenchmarkHeader from '../../../components/benchmark/BenchmarkHeader';

export default function BenchmarkRankingPage() {
  const router = useRouter();
  const { benchmarks } = useBenchmarkHistory();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header unifié */}
      <BenchmarkHeader
        title="🏆 Classement des Modèles"
        subtitle="Comparez les performances de vos modèles LLM"
        currentPage="ranking"
      />
      
      <div className="max-w-7xl mx-auto p-6">
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

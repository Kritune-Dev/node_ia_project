'use client'

import React from 'react';
import BenchmarkHeader from '../../../components/benchmark/BenchmarkHeader';
import BenchmarkHistorySimple from '../../../components/benchmark/BenchmarkHistorySimple';

export default function BenchmarkHistoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <BenchmarkHeader
        title="📖 Historique des Benchmarks"
        subtitle="Consultez l'historique complet de vos tests et performances"
        currentPage="history"
      />
      
      <div className="max-w-7xl mx-auto p-6">
        <BenchmarkHistorySimple />
      </div>
    </div>
  );
}

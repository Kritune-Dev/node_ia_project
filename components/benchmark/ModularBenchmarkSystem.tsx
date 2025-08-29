'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Ce composant redirige maintenant vers la nouvelle structure de pages
const ModularBenchmarkSystem: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirection vers la nouvelle page benchmark
    router.push('/benchmark');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Redirection vers le nouveau système...</h2>
        <p className="text-gray-500 mt-2">
          Le système de benchmark a été refactorisé avec de nouvelles URLs plus claires.
        </p>
      </div>
    </div>
  );
};

export default ModularBenchmarkSystem;
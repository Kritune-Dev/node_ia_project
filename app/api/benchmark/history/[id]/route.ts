import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * 🎯 BENCHMARK HISTORY API v3.0 - Détails d'un benchmark
 * GET /api/benchmark/history/[id] - Résultats complets d'un benchmark
 * DELETE /api/benchmark/history/[id] - Supprimer un benchmark spécifique
 */

const BENCHMARK_DIR = path.join(process.cwd(), 'data', 'benchmark');
const RESULTS_DIR = path.join(BENCHMARK_DIR, 'results');

/**
 * 📖 GET - Résultats complets d'un benchmark spécifique
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`🎯 [HISTORY-API] Requête GET pour benchmark ID: ${params.id}`);
  
  try {
    const { id } = params;
    
    if (!id) {
      console.log('❌ [HISTORY-API] ID de benchmark manquant');
      return NextResponse.json({
        success: false,
        error: 'Benchmark ID is required'
      }, { status: 400 });
    }

    // Chercher le fichier correspondant
    const benchmarkFile = path.join(RESULTS_DIR, `${id}.json`);
    
    try {
      const data = await readFile(benchmarkFile, 'utf-8');
      const benchmarkData = JSON.parse(data);
      
      console.log(`✅ [HISTORY-API] Benchmark ${id} trouvé et retourné`);
      
      return NextResponse.json({
        success: true,
        benchmark: benchmarkData,
        timestamp: new Date().toISOString()
      });
      
    } catch (fileError) {
      console.log(`❌ [HISTORY-API] Fichier benchmark ${id}.json non trouvé`);
      
      return NextResponse.json({
        success: false,
        error: `Benchmark avec l'ID '${id}' non trouvé`
      }, { status: 404 });
    }

  } catch (error) {
    console.error(`❌ [HISTORY-API] Erreur pour benchmark ${params.id}:`, error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

/**
 * 🗑️ DELETE - Supprimer un benchmark spécifique
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`🎯 [HISTORY-API] Requête DELETE pour benchmark ID: ${params.id}`);
  
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Benchmark ID is required'
      }, { status: 400 });
    }

    // Importer fs dynamiquement pour les opérations de suppression
    const fs = await import('fs');
    
    // Supprimer le fichier de résultats
    const benchmarkFile = path.join(RESULTS_DIR, `${id}.json`);
    
    try {
      await fs.promises.unlink(benchmarkFile);
      console.log(`🗑️ [HISTORY-API] Fichier ${id}.json supprimé`);
    } catch (fileError) {
      console.log(`⚠️ [HISTORY-API] Fichier ${id}.json non trouvé`);
    }

    // Supprimer l'entrée de l'historique
    const historyFile = path.join(BENCHMARK_DIR, 'history.json');
    
    try {
      const historyData = await fs.promises.readFile(historyFile, 'utf-8');
      const history = JSON.parse(historyData);
      
      const originalLength = history.benchmarks.length;
      history.benchmarks = history.benchmarks.filter((b: any) => b.id !== id);
      
      if (history.benchmarks.length < originalLength) {
        history.lastUpdated = new Date().toISOString();
        await fs.promises.writeFile(historyFile, JSON.stringify(history, null, 2));
        console.log(`✅ [HISTORY-API] Benchmark ${id} supprimé de l'historique`);
      } else {
        console.log(`⚠️ [HISTORY-API] Benchmark ${id} non trouvé dans l'historique`);
      }
      
    } catch (historyError) {
      console.warn('⚠️ [HISTORY-API] Erreur lors de la mise à jour de l\'historique:', historyError);
    }

    return NextResponse.json({
      success: true,
      message: `Benchmark '${id}' supprimé`,
      id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ [HISTORY-API] Erreur DELETE pour benchmark ${params.id}:`, error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

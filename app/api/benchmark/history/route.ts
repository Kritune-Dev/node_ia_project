import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * 🎯 BENCHMARK HISTORY API v3.0 - RESTful
 * GET /api/benchmark/history - Liste avec métadonnées légères
 * POST /api/benchmark/history - Ajouter un benchmark
 * DELETE /api/benchmark/history - Supprimer tous les benchmarks
 */

interface BenchmarkHistoryItem {
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

interface HistoryFile {
  version: string
  lastUpdated: string
  benchmarks: BenchmarkHistoryItem[]
}

const BENCHMARK_DIR = path.join(process.cwd(), 'data', 'benchmark_results');
const HISTORY_FILE = path.join(BENCHMARK_DIR, 'history.json');

/**
 * 🔧 Assurer que le répertoire existe
 */
function ensureBenchmarkDir() {
  if (!fs.existsSync(BENCHMARK_DIR)) {
    console.log('📁 [HISTORY-API] Création du répertoire benchmark_results');
    fs.mkdirSync(BENCHMARK_DIR, { recursive: true });
  }
}

/**
 * 📖 Charger le fichier history.json
 */
function loadHistoryFile(): HistoryFile {
  try {
    ensureBenchmarkDir();
    
    if (!fs.existsSync(HISTORY_FILE)) {
      console.log('📝 [HISTORY-API] Création d\'un nouveau fichier history.json');
      const defaultHistory: HistoryFile = {
        version: "3.0.0",
        lastUpdated: new Date().toISOString(),
        benchmarks: []
      }
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(defaultHistory, null, 2));
      return defaultHistory;
    }

    const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
    const history = JSON.parse(data) as HistoryFile;
    
    return history;
  } catch (error) {
    console.error('❌ [HISTORY-API] Erreur lors du chargement de l\'historique:', error);
    const defaultHistory: HistoryFile = {
      version: "3.0.0",
      lastUpdated: new Date().toISOString(),
      benchmarks: []
    }
    return defaultHistory;
  }
}

/**
 * 💾 Sauvegarder le fichier history.json
 */
function saveHistoryFile(history: HistoryFile): void {
  try {
    ensureBenchmarkDir();
    history.lastUpdated = new Date().toISOString();
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    console.log('✅ [HISTORY-API] Historique sauvegardé');
  } catch (error) {
    console.error('❌ [HISTORY-API] Erreur lors de la sauvegarde:', error);
    throw error;
  }
}

/**
 * 📋 GET - Liste avec métadonnées légères
 */
export async function GET(request: NextRequest) {
  console.log('🎯 [HISTORY-API] Requête GET - Liste des benchmarks');
  
  try {
    const history = loadHistoryFile();
    
    // Tri par timestamp décroissant (plus récent en premier)
    const sortedBenchmarks = [...history.benchmarks].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    console.log(`✅ [HISTORY-API] ${sortedBenchmarks.length} benchmarks retournés`);

    return NextResponse.json({
      success: true,
      benchmarks: sortedBenchmarks,
      count: sortedBenchmarks.length,
      version: history.version,
      lastUpdated: history.lastUpdated,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [HISTORY-API] Erreur GET:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      benchmarks: [],
      count: 0
    }, { status: 500 });
  }
}

/**
 * ➕ POST - Ajouter un benchmark dans l'historique
 */
export async function POST(request: NextRequest) {
  console.log('🎯 [HISTORY-API] Requête POST - Ajouter un benchmark');
  
  try {
    const body = await request.json();
    const {
      id,
      name,
      duration,
      successRate,
      status = 'completed',
      modelsDisplayNames = [],
      testSeriesNames = [],
      modelCount,
      questionCount
    } = body;

    // Validation des données requises
    if (!id || !name || duration === undefined || successRate === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Données manquantes: id, name, duration et successRate sont requis'
      }, { status: 400 });
    }

    const history = loadHistoryFile();
    
    // Vérifier si le benchmark existe déjà
    const existingIndex = history.benchmarks.findIndex(b => b.id === id);
    
    const newBenchmark: BenchmarkHistoryItem = {
      id,
      name,
      timestamp: new Date().toISOString(),
      duration,
      successRate,
      status,
      modelsDisplayNames,
      testSeriesNames,
      modelCount: modelCount || modelsDisplayNames.length,
      questionCount: questionCount || 0
    };

    if (existingIndex >= 0) {
      // Mettre à jour le benchmark existant
      history.benchmarks[existingIndex] = newBenchmark;
      console.log(`✅ [HISTORY-API] Benchmark ${id} mis à jour`);
    } else {
      // Ajouter un nouveau benchmark
      history.benchmarks.push(newBenchmark);
      console.log(`✅ [HISTORY-API] Nouveau benchmark ${id} ajouté`);
    }

    saveHistoryFile(history);

    return NextResponse.json({
      success: true,
      message: existingIndex >= 0 ? 'Benchmark mis à jour' : 'Benchmark ajouté',
      benchmark: newBenchmark,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [HISTORY-API] Erreur POST:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

/**
 * 🗑️ DELETE - Supprimer tous les benchmarks
 */
export async function DELETE(request: NextRequest) {
  console.log('🎯 [HISTORY-API] Requête DELETE - Suppression de tous les benchmarks');
  
  try {
    const history = loadHistoryFile();
    const deletedCount = history.benchmarks.length;
    
    // Vider l'historique
    history.benchmarks = [];
    saveHistoryFile(history);

    // Optionnel: supprimer aussi les fichiers de résultats
    const url = new URL(request.url);
    const deleteFiles = url.searchParams.get('deleteFiles') === 'true';
    
    if (deleteFiles) {
      try {
        const files = fs.readdirSync(BENCHMARK_DIR);
        const benchmarkFiles = files.filter(file => 
          file.startsWith('benchmark_') && file.endsWith('.json') && file !== 'history.json'
        );
        
        benchmarkFiles.forEach(file => {
          const filePath = path.join(BENCHMARK_DIR, file);
          fs.unlinkSync(filePath);
        });
        
        console.log(`🗑️ [HISTORY-API] ${benchmarkFiles.length} fichiers de résultats supprimés`);
      } catch (fileError) {
        console.warn('⚠️ [HISTORY-API] Erreur lors de la suppression des fichiers:', fileError);
      }
    }

    console.log(`✅ [HISTORY-API] ${deletedCount} benchmarks supprimés`);

    return NextResponse.json({
      success: true,
      message: `${deletedCount} benchmarks supprimés`,
      deletedCount,
      filesDeleted: deleteFiles,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [HISTORY-API] Erreur DELETE:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

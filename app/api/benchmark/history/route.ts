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

const BENCHMARK_DIR = path.join(process.cwd(), 'data', 'benchmark');
const RESULTS_DIR = path.join(BENCHMARK_DIR, 'results');
const MODELS_DIR = path.join(BENCHMARK_DIR, 'models');
const HISTORY_FILE = path.join(BENCHMARK_DIR, 'history.json');

/**
 * 🔧 Assurer que le répertoire existe
 */
function ensureBenchmarkDir() {
  if (!fs.existsSync(BENCHMARK_DIR)) {
    console.log('📁 [HISTORY-API] Création du répertoire benchmark');
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
    const parsedData = JSON.parse(data);
    
    // Migration depuis l'ancien format
    if (parsedData.metadata && !parsedData.benchmarks) {
      console.log('🔄 [HISTORY-API] Migration de l\'ancien format vers le nouveau');
      const migratedBenchmarks: BenchmarkHistoryItem[] = parsedData.metadata.map((item: any) => ({
        id: item.id,
        name: item.displayName || item.testSeries || 'Benchmark',
        timestamp: item.timestamp,
        duration: 0, // Pas disponible dans l'ancien format
        successRate: 0, // Pas disponible dans l'ancien format
        status: 'completed' as const,
        modelsDisplayNames: item.models?.map((m: any) => m.displayName || m.name) || [],
        testSeriesNames: [item.testSeries || 'Test Standard'],
        modelCount: item.totalModels || 0,
        questionCount: item.totalQuestions || 0
      }));
      
      const migratedHistory: HistoryFile = {
        version: "3.0.0",
        lastUpdated: new Date().toISOString(),
        benchmarks: migratedBenchmarks
      };
      
      // Sauvegarder le format migré
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(migratedHistory, null, 2));
      console.log(`✅ [HISTORY-API] Migration terminée: ${migratedBenchmarks.length} benchmarks migrés`);
      
      return migratedHistory;
    }
    
    // Vérifier que benchmarks existe et est un tableau
    if (!parsedData.benchmarks || !Array.isArray(parsedData.benchmarks)) {
      console.log('⚠️ [HISTORY-API] Structure invalide, réinitialisation');
      const defaultHistory: HistoryFile = {
        version: "3.0.0",
        lastUpdated: new Date().toISOString(),
        benchmarks: []
      }
      return defaultHistory;
    }
    
    return parsedData as HistoryFile;
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
 * 🧹 Nettoyer les fichiers de modèles en supprimant les entrées d'un benchmark
 */
function cleanModelFiles(benchmarkId: string): void {
  try {
    if (!fs.existsSync(MODELS_DIR)) {
      console.log('📁 [HISTORY-API] Dossier models inexistant, rien à nettoyer');
      return;
    }

    const modelFiles = fs.readdirSync(MODELS_DIR)
      .filter(file => file.startsWith('model_') && file.endsWith('.json'));

    let totalCleaned = 0;
    
    for (const file of modelFiles) {
      const filePath = path.join(MODELS_DIR, file);
      
      try {
        const modelData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        if (modelData.history && Array.isArray(modelData.history)) {
          const originalLength = modelData.history.length;
          
          // Supprimer toutes les entrées avec ce benchmarkId
          modelData.history = modelData.history.filter((entry: any) => 
            entry.benchmarkId !== benchmarkId
          );
          
          const newLength = modelData.history.length;
          const removed = originalLength - newLength;
          
          if (removed > 0) {
            // Sauvegarder le fichier modifié
            fs.writeFileSync(filePath, JSON.stringify(modelData, null, 2));
            console.log(`🧹 [HISTORY-API] ${file}: ${removed} entrée(s) supprimée(s)`);
            totalCleaned += removed;
          }
        }
        
        // Nettoyer aussi le résumé si nécessaire
        if (modelData.resultsSummary && typeof modelData.resultsSummary === 'object') {
          let summaryModified = false;
          
          for (const [key, summary] of Object.entries(modelData.resultsSummary)) {
            if (summary && typeof summary === 'object' && 'historyIds' in summary) {
              const historyIds = (summary as any).historyIds;
              if (Array.isArray(historyIds)) {
                const originalIds = historyIds.length;
                (summary as any).historyIds = historyIds.filter((id: string) => id !== benchmarkId);
                if ((summary as any).historyIds.length < originalIds) {
                  summaryModified = true;
                }
              }
            }
          }
          
          if (summaryModified) {
            fs.writeFileSync(filePath, JSON.stringify(modelData, null, 2));
            console.log(`🧹 [HISTORY-API] ${file}: résumé mis à jour`);
          }
        }
        
      } catch (fileError) {
        console.warn(`⚠️ [HISTORY-API] Erreur lors du nettoyage de ${file}:`, fileError);
      }
    }
    
    console.log(`✅ [HISTORY-API] Nettoyage terminé: ${totalCleaned} entrée(s) supprimée(s) dans ${modelFiles.length} fichier(s) de modèles`);
    
  } catch (error) {
    console.error('❌ [HISTORY-API] Erreur lors du nettoyage des fichiers de modèles:', error);
    // Ne pas faire échouer la suppression si le nettoyage des modèles échoue
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
 * 🗑️ DELETE - Supprimer tous les benchmarks ou un benchmark spécifique
 */
export async function DELETE(request: NextRequest) {
  console.log('🎯 [HISTORY-API] Requête DELETE');
  
  try {
    const url = new URL(request.url);
    const benchmarkId = url.searchParams.get('id');
    const deleteFiles = url.searchParams.get('deleteFiles') === 'true';
    
    const history = loadHistoryFile();
    
    if (benchmarkId) {
      // Suppression d'un benchmark spécifique
      console.log(`🗑️ [HISTORY-API] Suppression du benchmark: ${benchmarkId}`);
      
      const initialCount = history.benchmarks.length;
      history.benchmarks = history.benchmarks.filter(b => b.id !== benchmarkId);
      const finalCount = history.benchmarks.length;
      
      if (initialCount === finalCount) {
        return NextResponse.json({
          success: false,
          error: `Benchmark ${benchmarkId} non trouvé`
        }, { status: 404 });
      }
      
      saveHistoryFile(history);
      
      // Nettoyer les fichiers de modèles (toujours fait)
      cleanModelFiles(benchmarkId);
      
      // Optionnel: supprimer aussi le fichier de résultats correspondant
      if (deleteFiles) {
        try {
          const resultFilePath = path.join(RESULTS_DIR, `${benchmarkId}.json`);
          if (fs.existsSync(resultFilePath)) {
            fs.unlinkSync(resultFilePath);
            console.log(`🗑️ [HISTORY-API] Fichier de résultats supprimé: ${benchmarkId}.json`);
          }
        } catch (fileError) {
          console.warn('⚠️ [HISTORY-API] Erreur lors de la suppression du fichier:', fileError);
        }
      }
      
      console.log(`✅ [HISTORY-API] Benchmark ${benchmarkId} supprimé`);
      
      return NextResponse.json({
        success: true,
        message: `Benchmark ${benchmarkId} supprimé`,
        deletedId: benchmarkId,
        fileDeleted: deleteFiles,
        timestamp: new Date().toISOString()
      });
      
    } else {
      // Suppression de tous les benchmarks (comportement existant)
      console.log('🗑️ [HISTORY-API] Suppression de tous les benchmarks');
      
      const deletedCount = history.benchmarks.length;
      
      // Vider l'historique
      history.benchmarks = [];
      saveHistoryFile(history);

      // Nettoyer tous les fichiers de modèles (toujours fait)
      try {
        if (fs.existsSync(MODELS_DIR)) {
          const modelFiles = fs.readdirSync(MODELS_DIR)
            .filter(file => file.startsWith('model_') && file.endsWith('.json'));
          
          let totalCleaned = 0;
          
          for (const file of modelFiles) {
            const filePath = path.join(MODELS_DIR, file);
            
            try {
              const modelData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
              
              if (modelData.history && Array.isArray(modelData.history)) {
                const originalLength = modelData.history.length;
                modelData.history = []; // Vider complètement l'historique
                totalCleaned += originalLength;
              }
              
              // Vider aussi les résumés
              if (modelData.resultsSummary) {
                modelData.resultsSummary = {};
              }
              
              fs.writeFileSync(filePath, JSON.stringify(modelData, null, 2));
              console.log(`🧹 [HISTORY-API] ${file}: historique vidé`);
              
            } catch (fileError) {
              console.warn(`⚠️ [HISTORY-API] Erreur lors du nettoyage de ${file}:`, fileError);
            }
          }
          
          console.log(`✅ [HISTORY-API] Nettoyage total: ${totalCleaned} entrée(s) supprimée(s) dans ${modelFiles.length} fichier(s) de modèles`);
        }
      } catch (cleanError) {
        console.warn('⚠️ [HISTORY-API] Erreur lors du nettoyage des modèles:', cleanError);
      }

      // Optionnel: supprimer aussi les fichiers de résultats
      if (deleteFiles) {
        try {
          const files = fs.readdirSync(RESULTS_DIR);
          const benchmarkFiles = files.filter(file => 
            file.startsWith('benchmark_') && file.endsWith('.json')
          );
          
          benchmarkFiles.forEach(file => {
            const filePath = path.join(RESULTS_DIR, file);
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
    }

  } catch (error) {
    console.error('❌ [HISTORY-API] Erreur DELETE:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

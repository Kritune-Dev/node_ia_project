#!/bin/bash

# 🛠️ Script de développement pour Medical LLM Platform
# Usage: ./scripts/dev.sh [command]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Fonction pour récupérer le status des APIs
get_apis_status() {
    local base_url="${1:-http://localhost:3000}"
    
    # Tenter de récupérer le health check
    local health_response=$(curl -s "$base_url/api/health" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$health_response" ]; then
        # Parser les informations avec jq si disponible
        if command -v jq &> /dev/null; then
            local status=$(echo "$health_response" | jq -r '.status // "unknown"')
            local total=$(echo "$health_response" | jq -r '.summary.total // 0')
            local healthy=$(echo "$health_response" | jq -r '.summary.healthy // 0')
            local avg_time=$(echo "$health_response" | jq -r '.summary.avgResponseTime // 0')
            local ollama_models=$(echo "$health_response" | jq -r '.services.ollama.models // 0')
            
            echo ""
            log_info "🏥 Status des APIs:"
            
            case "$status" in
                "healthy")
                    echo "🟢 Système: Tous les services opérationnels"
                    ;;
                "partial")
                    echo "🟡 Système: Fonctionnement partiel"
                    ;;
                "unhealthy")
                    echo "🔴 Système: Services indisponibles"
                    ;;
                *)
                    echo "⚪ Système: Status inconnu"
                    ;;
            esac
            
            echo "📊 APIs: $healthy/$total opérationnelles (avg: ${avg_time}ms)"
            echo "🤖 Modèles Ollama: $ollama_models disponibles"
            
            # Afficher le détail des APIs si possible
            echo ""
            echo "📋 Détail des APIs:"
            echo "$health_response" | jq -r '.apis[] | 
                if .status == "healthy" then
                    "  🟢 \(.path) (v\(.version)) - \(.description) [\(.methods | join(","))] \(.responseTime)ms"
                elif .status == "unhealthy" then
                    "  🔴 \(.path) (v\(.version)) - \(.description) [\(.methods | join(","))] \(.error // "Error")"
                else
                    "  ⚪ \(.path) (v\(.version)) - \(.description) [\(.methods | join(","))] Unknown"
                end'
        else
            echo ""
            log_info "🏥 Status des APIs: (installer 'jq' pour plus de détails)"
            echo "📊 Health check: ✅ Accessible"
        fi
    else
        echo ""
        log_warning "🏥 Status des APIs: ❌ Non accessible"
        echo "💡 Démarrez le serveur avec './scripts/dev.sh start'"
    fi
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

show_help() {
    echo "🛠️  Medical LLM Platform - Script de développement"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands disponibles:"
    echo "  start, dev     - Démarrer le serveur de développement"
    echo "  build          - Builder le projet"
    echo "  test           - Lancer les tests"
    echo "  lint           - Vérifier le linting"
    echo "  lint:fix       - Corriger automatiquement le linting"
    echo "  install        - Installer les dépendances"
    echo "  clean          - Nettoyer les fichiers de build"
    echo "  setup          - Configuration initiale du projet"
    echo "  check          - Vérifications complètes (lint + build + test)"
    echo "  status         - Status git et informations projet avec APIs"
    echo "  health         - Health check détaillé des services et APIs"
    echo "  help           - Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 start       # Démarrer en mode développement"
    echo "  $0 check       # Vérifications complètes avant commit"
    echo "  $0 setup       # Configuration initiale"
}

# Commande par défaut
COMMAND=${1:-dev}

case $COMMAND in
    "start"|"dev")
        log_info "🚀 Démarrage du serveur de développement..."
        npm run dev
        ;;
    
    "build")
        log_info "🔨 Build du projet..."
        npm run build
        if [ $? -eq 0 ]; then
            log_success "Build réussi!"
        else
            log_error "Échec du build"
            exit 1
        fi
        ;;
    
    "test")
        log_info "🧪 Exécution des tests..."
        if [ -f "jest.config.js" ]; then
            npm test
        else
            log_warning "Aucune configuration de test trouvée"
        fi
        ;;
    
    "lint")
        log_info "🧹 Vérification du linting..."
        npm run lint
        ;;
    
    "lint:fix")
        log_info "🔧 Correction automatique du linting..."
        npm run lint -- --fix
        log_success "Linting corrigé!"
        ;;
    
    "install")
        log_info "📦 Installation des dépendances..."
        npm install
        log_success "Dépendances installées!"
        ;;
    
    "clean")
        log_info "🧹 Nettoyage des fichiers de build..."
        rm -rf .next
        rm -rf dist
        rm -rf build
        npm run build > /dev/null 2>&1 || true
        log_success "Nettoyage terminé!"
        ;;
    
    "setup")
        log_info "⚙️  Configuration initiale du projet..."
        
        # Vérifier Node.js
        if ! command -v node &> /dev/null; then
            log_error "Node.js n'est pas installé"
            exit 1
        fi
        
        NODE_VERSION=$(node --version)
        log_info "Node.js version: $NODE_VERSION"
        
        # Installer les dépendances
        log_info "📦 Installation des dépendances..."
        npm install
        
        # Copier le fichier d'environnement
        if [ ! -f ".env.local" ]; then
            if [ -f ".env.local.example" ]; then
                log_info "📝 Création du fichier .env.local..."
                cp .env.local.example .env.local
                log_warning "N'oubliez pas de configurer vos variables d'environnement dans .env.local"
            fi
        fi
        
        # Build initial
        log_info "🔨 Build initial..."
        npm run build
        
        log_success "Configuration terminée! Vous pouvez maintenant lancer 'npm run dev'"
        ;;
    
    "check")
        log_info "🔍 Vérifications complètes..."
        
        # Linting
        log_info "1/3 - Vérification du linting..."
        npm run lint
        
        # Build
        log_info "2/3 - Build du projet..."
        npm run build
        
        # Tests (si disponibles)
        log_info "3/3 - Tests..."
        if [ -f "jest.config.js" ]; then
            npm test
        else
            log_info "Aucun test configuré, on passe..."
        fi
        
        log_success "Toutes les vérifications sont passées! ✨"
        ;;
    
    "status")
        log_info "📊 Status du projet..."
        echo ""
        
        # Version du projet
        VERSION=$(grep '"version"' package.json | sed 's/.*"version": "\(.*\)".*/\1/')
        echo "📦 Version: $VERSION"
        
        # Branche Git
        BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "Pas de git")
        echo "🌿 Branche: $BRANCH"
        
        # Status Git
        if command -v git &> /dev/null && [ -d ".git" ]; then
            echo ""
            log_info "Git status:"
            git status --short
            
            # Vérifier s'il y a des commits en avance/retard
            if [ "$BRANCH" != "HEAD" ]; then
                AHEAD=$(git rev-list --count origin/$BRANCH..$BRANCH 2>/dev/null || echo "0")
                BEHIND=$(git rev-list --count $BRANCH..origin/$BRANCH 2>/dev/null || echo "0")
                
                if [ "$AHEAD" -gt 0 ]; then
                    echo "📤 $AHEAD commit(s) en avance sur origin/$BRANCH"
                fi
                
                if [ "$BEHIND" -gt 0 ]; then
                    echo "📥 $BEHIND commit(s) en retard sur origin/$BRANCH"
                fi
            fi
        fi
        
        # Informations Node.js
        echo ""
        log_info "Environnement:"
        echo "🟢 Node.js: $(node --version)"
        echo "📦 npm: $(npm --version)"
        
        # Vérifier .env.local
        if [ -f ".env.local" ]; then
            echo "⚙️  .env.local: ✅"
        else
            echo "⚙️  .env.local: ❌ (utilisez './scripts/dev.sh setup')"
        fi
        
        # Status des APIs
        get_apis_status
        ;;
    
    "health")
        log_info "🏥 Vérification complète de la santé du système..."
        
        # Vérifier si le serveur tourne
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            log_success "Serveur de développement accessible"
            
            # Afficher le health check détaillé
            echo ""
            log_info "📊 Rapport de santé détaillé:"
            curl -s http://localhost:3000/api/health | jq '.' 2>/dev/null || curl -s http://localhost:3000/api/health
        else
            log_error "Serveur de développement non accessible"
            echo "💡 Démarrez-le avec './scripts/dev.sh start'"
        fi
        ;;
    
    "help"|"-h"|"--help")
        show_help
        ;;
    
    *)
        log_error "Commande inconnue: $COMMAND"
        echo ""
        show_help
        exit 1
        ;;
esac

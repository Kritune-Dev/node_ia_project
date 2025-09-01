#!/bin/bash

# 🚀 Script de release pour Medical LLM Platform
# Usage: ./scripts/release.sh <version> [major|minor|patch]

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

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier les arguments
if [ $# -lt 1 ]; then
    log_error "Usage: $0 <version> [major|minor|patch]"
    log_info "Exemple: $0 3.3.0 minor"
    exit 1
fi

VERSION=$1
RELEASE_TYPE=${2:-patch}

log_info "🚀 Démarrage du processus de release v$VERSION ($RELEASE_TYPE)"

# Vérifier qu'on est sur la branche main
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    log_error "Vous devez être sur la branche 'main' pour faire une release"
    log_info "Branche actuelle: $CURRENT_BRANCH"
    exit 1
fi

# Vérifier que le working directory est clean
if [ -n "$(git status --porcelain)" ]; then
    log_error "Le working directory doit être clean avant une release"
    log_info "Veuillez committer ou stasher vos changements"
    exit 1
fi

# Mettre à jour depuis origin/main
log_info "📥 Mise à jour depuis origin/main..."
git pull origin main

# Mettre à jour la version dans package.json
log_info "📝 Mise à jour de la version dans package.json..."
sed -i.bak "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json
rm package.json.bak

# Mettre à jour le CHANGELOG
log_info "📋 Mise à jour du CHANGELOG..."
CURRENT_DATE=$(date +%Y-%m-%d)
CHANGELOG_HEADER="## [$VERSION] - $CURRENT_DATE"

if ! grep -q "$CHANGELOG_HEADER" CHANGELOG.md; then
    # Créer une section temporaire dans le CHANGELOG
    {
        echo "# Changelog"
        echo ""
        echo "$CHANGELOG_HEADER"
        echo ""
        echo "### ✨ Nouvelles fonctionnalités"
        echo "- [À compléter] Ajoutez vos nouvelles fonctionnalités ici"
        echo ""
        echo "### 🔧 Améliorations"
        echo "- [À compléter] Ajoutez vos améliorations ici"
        echo ""
        echo "### 🐛 Corrections de bugs"
        echo "- [À compléter] Ajoutez vos corrections ici"
        echo ""
        echo "---"
        echo ""
        tail -n +2 CHANGELOG.md
    } > CHANGELOG.md.tmp && mv CHANGELOG.md.tmp CHANGELOG.md
    
    log_warning "CHANGELOG mis à jour avec une structure de base"
    log_info "Veuillez éditer CHANGELOG.md pour ajouter les détails de cette release"
    
    # Ouvrir l'éditeur pour permettre de modifier le CHANGELOG
    ${EDITOR:-nano} CHANGELOG.md
fi

# Mettre à jour le README avec la nouvelle version
log_info "📖 Mise à jour du README..."
sed -i.bak "s/v[0-9]\+\.[0-9]\+\.[0-9]\+/v$VERSION/g" README.md
rm README.md.bak

# Build et tests
log_info "🔨 Build du projet..."
npm run build

if [ $? -ne 0 ]; then
    log_error "Échec du build"
    exit 1
fi

log_success "Build réussi"

# Linting
log_info "🧹 Vérification du linting..."
npm run lint

if [ $? -ne 0 ]; then
    log_warning "Problèmes de linting détectés, mais on continue..."
fi

# Commit des changements de version
log_info "📝 Commit des changements de version..."
git add package.json CHANGELOG.md README.md
git commit -m "🔖 Bump version to v$VERSION

- Updated package.json version
- Updated CHANGELOG.md with release notes
- Updated README.md with new version references

Release type: $RELEASE_TYPE"

# Créer le tag
log_info "🏷️  Création du tag v$VERSION..."
git tag -a "v$VERSION" -m "Release v$VERSION

Release type: $RELEASE_TYPE
Date: $CURRENT_DATE

See CHANGELOG.md for detailed release notes."

# Push vers origin
log_info "📤 Push vers origin..."
git push origin main
git push origin "v$VERSION"

# Afficher les informations de la release
log_success "🎉 Release v$VERSION créée avec succès!"
echo ""
log_info "📋 Résumé de la release:"
echo "  - Version: $VERSION"
echo "  - Type: $RELEASE_TYPE"
echo "  - Branche: main"
echo "  - Tag: v$VERSION"
echo "  - Date: $CURRENT_DATE"
echo ""
log_info "🔗 Liens utiles:"
echo "  - Repository: https://github.com/Kritune-Dev/node_ia_project"
echo "  - Tag: https://github.com/Kritune-Dev/node_ia_project/releases/tag/v$VERSION"
echo "  - Commits: https://github.com/Kritune-Dev/node_ia_project/compare/...v$VERSION"
echo ""
log_info "📝 Prochaines étapes:"
echo "  1. Créer une GitHub Release avec les notes du CHANGELOG"
echo "  2. Déployer en production si nécessaire"
echo "  3. Communiquer la release à l'équipe"
echo ""
log_success "✨ Release terminée!"

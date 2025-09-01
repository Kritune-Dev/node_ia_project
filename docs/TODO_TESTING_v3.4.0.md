# TODO List v3.4.0 - Système de tests et documentation

## 🎯 Objectifs principaux

- [ ] Mise en place d'une suite de tests complète et robuste
- [ ] Documentation API automatisée et maintenue
- [ ] Intégration CI/CD avec validation automatique
- [ ] Amélioration de la qualité et maintenabilité du code

## 🧪 Tests Framework Setup

### Jest + Testing Configuration

- [ ] **Installation dépendances tests**
  - [ ] `jest`, `@types/jest`
  - [ ] `supertest`, `@types/supertest`
  - [ ] `@testing-library/react`, `@testing-library/jest-dom`
  - [ ] `jest-environment-jsdom`
- [ ] **Configuration Jest**
  - [ ] `jest.config.js` avec Next.js integration
  - [ ] Setup files pour tests API et React
  - [ ] Mocks pour services externes (Ollama)
  - [ ] Coverage configuration (80%+ target)

### Test Structure

- [ ] **Dossier `tests/` complet**
  ```
  tests/
  ├── api/                 # Tests API endpoints
  ├── components/          # Tests composants React
  ├── utils/               # Helpers et mocks
  ├── e2e/                 # Tests end-to-end
  └── setup/               # Configuration globale
  ```

## 🔍 Tests API (Priority 1)

### Core APIs Testing

- [ ] **Health API (`/api/health`)**
  - [ ] Test status healthy/unhealthy/partial
  - [ ] Validation structure response
  - [ ] Test services.ollama detection
  - [ ] Test APIs array completeness
  - [ ] Performance/timeout testing

- [ ] **Models API (`/api/models`)**
  - [ ] Test models list retrieval
  - [ ] Test model filtering/search
  - [ ] Test error handling (Ollama down)
  - [ ] Validation model object structure

- [ ] **Models Config API (`/api/models/config`)**
  - [ ] Test GET with valid model parameter
  - [ ] Test GET without parameter (400 expected)
  - [ ] Test PUT configuration update
  - [ ] Test config file persistence

- [ ] **Benchmark APIs**
  - [ ] `/api/benchmark/configs` - Test configurations list
  - [ ] `/api/benchmark/history` - Test history retrieval/storage
  - [ ] `/api/models/[name]/benchmark` - Test scoring CRUD operations

### Advanced API Testing

- [ ] **Integration tests**
  - [ ] Complete benchmark execution flow
  - [ ] Scoring system end-to-end
  - [ ] File system operations (JSON persistence)
  - [ ] Error recovery scenarios

## 🎨 Tests Components (Priority 2)

### Core Components

- [ ] **ModelStatusSimple**
  - [ ] Test models loading state
  - [ ] Test models display/rendering
  - [ ] Test error handling
  - [ ] Test click interactions

- [ ] **ModelDetailModal**
  - [ ] Test 4 tabs navigation
  - [ ] Test scoring system integration
  - [ ] Test benchmark launching
  - [ ] Test modal open/close

- [ ] **Health Monitoring**
  - [ ] Test status detection logic
  - [ ] Test OllamaSetupGuide display
  - [ ] Test real-time updates

### Utility Components

- [ ] **SeriesScoreDisplay/Input**
  - [ ] Test score editing workflow
  - [ ] Test save/cancel/delete operations
  - [ ] Test validation (0-10 range)

## 📚 Documentation API (Priority 2)

### Auto-Documentation System

- [ ] **JSDoc standardization**
  - [ ] Documenter tous les endpoints avec JSDoc
  - [ ] Format standardisé pour params/responses
  - [ ] Exemples curl pour chaque endpoint
  - [ ] Codes d'erreur documentés

- [ ] **Script de génération**
  - [ ] Parser JSDoc depuis les routes
  - [ ] Génération Markdown automatique
  - [ ] Intégration dans docs/ folder
  - [ ] Update du README principal

- [ ] **Documentation structure**
  ```
  docs/
  ├── api/
  │   ├── health.md
  │   ├── models.md
  │   ├── benchmark.md
  │   └── README.md
  ├── testing/
  │   ├── setup.md
  │   ├── running-tests.md
  │   └── coverage.md
  └── development/
      ├── contributing.md
      └── architecture.md
  ```

## 🔄 CI/CD Integration (Priority 3)

### Pre-commit Hooks

- [ ] **Husky setup**
  - [ ] Install husky + lint-staged
  - [ ] Pre-commit: tests rapides + lint
  - [ ] Pre-push: suite complète tests API

### GitHub Actions

- [ ] **Workflow CI**
  - [ ] Tests sur PR/push main
  - [ ] Multiple Node.js versions testing
  - [ ] Coverage reporting
  - [ ] Documentation generation

- [ ] **Scripts package.json**
  ```json
  {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:api": "jest tests/api",
    "test:components": "jest tests/components",
    "test:coverage": "jest --coverage",
    "test:e2e": "jest tests/e2e",
    "docs:generate": "node scripts/generate-docs.js"
  }
  ```

## 🛡️ Quality Assurance

### Code Coverage

- [ ] **Coverage targets**
  - [ ] APIs: 90%+ coverage
  - [ ] Components: 80%+ coverage
  - [ ] Utils: 95%+ coverage
  - [ ] Integration coverage reporting

### Performance Testing

- [ ] **API Performance**
  - [ ] Response time benchmarks (<100ms)
  - [ ] Load testing endpoints critiques
  - [ ] Memory usage monitoring
  - [ ] Concurrent requests handling

## 🚀 Tools & Scripts Enhancement

### Development Scripts

- [ ] **`./scripts/dev.sh` updates**
  - [ ] `./scripts/dev.sh test` - Run test suite
  - [ ] `./scripts/dev.sh test-watch` - Watch mode
  - [ ] `./scripts/dev.sh coverage` - Coverage report
  - [ ] `./scripts/dev.sh docs` - Generate documentation

### Testing Utilities

- [ ] **Mock system**
  - [ ] Ollama service mocks
  - [ ] File system mocks pour tests
  - [ ] API response fixtures
  - [ ] Test data generators

## 📋 Implementation Phases

### Phase 1: Foundation (Week 1)

- [ ] Jest setup + configuration
- [ ] Basic API tests (health, models)
- [ ] Test scripts in package.json
- [ ] Documentation structure

### Phase 2: Complete API Coverage (Week 2)

- [ ] All endpoints tested
- [ ] Integration tests
- [ ] JSDoc documentation
- [ ] Auto-doc generation

### Phase 3: Components & E2E (Week 3)

- [ ] React components testing
- [ ] End-to-end scenarios
- [ ] Performance benchmarks
- [ ] Coverage optimization

### Phase 4: CI/CD & Quality (Week 4)

- [ ] GitHub Actions setup
- [ ] Pre-commit hooks
- [ ] Coverage reporting
- [ ] Documentation publishing

## 🎯 Success Criteria

### Quality Metrics

- [ ] **90%+ API test coverage**
- [ ] **80%+ component test coverage**
- [ ] **All endpoints documented**
- [ ] **CI/CD pipeline fonctionnel**
- [ ] **Sub-100ms API response times**

### Developer Experience

- [ ] **One-command testing** (`npm test`)
- [ ] **Clear error messages** and debugging
- [ ] **Auto-updating documentation**
- [ ] **Fast feedback loop** (<30s test run)

### Maintenance

- [ ] **Tests run in CI/CD**
- [ ] **Documentation always current**
- [ ] **Easy to add new tests**
- [ ] **Clear testing guidelines**

---

## 📝 Notes Implementation

### Git Strategy

- [ ] **Branch `feature/testing-v3.4.0`**
- [ ] **Small, focused commits** par feature
- [ ] **PR reviews** avec tests validation
- [ ] **Documentation** updated avec chaque PR

### Dependencies Impact

- [ ] **Zero runtime impact** (devDependencies only)
- [ ] **Fast CI builds** (<5min)
- [ ] **Minimal maintenance overhead**

### Team Guidelines

- [ ] **Testing conventions** documented
- [ ] **Mock strategies** standardized
- [ ] **Coverage expectations** clear
- [ ] **Review process** defined

---

**Target Release**: v3.4.0  
**Estimated Duration**: 3-4 weeks  
**Priority**: High (Foundation for long-term maintainability)

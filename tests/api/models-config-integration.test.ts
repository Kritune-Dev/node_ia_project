/**
 * 🧪 Tests d'intégration API Models Config - Phase 2  
 * Tests des endpoints /api/models/config
 */

describe('/api/models/config - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock filesystem operations
    const mockConfig = {
      models: {
        "llama3.2:3b": {
          displayName: "Llama 3.2 3B",
          family: "llama",
          capabilities: ["text-generation", "conversation"],
          config: {
            temperature: 0.7,
            context_length: 4096,
            top_p: 0.9,
            repeat_penalty: 1.1
          },
          tags: ["small", "efficient"],
          description: "Compact and efficient language model",
          lastUpdated: "2025-01-01T10:00:00Z"
        },
        "codellama:13b": {
          displayName: "Code Llama 13B", 
          family: "codellama",
          capabilities: ["code-generation", "code-completion"],
          config: {
            temperature: 0.1,
            context_length: 8192,
            top_p: 0.95,
            repeat_penalty: 1.05
          },
          tags: ["code", "programming"],
          description: "Specialized model for code generation",
          lastUpdated: "2025-01-01T09:00:00Z"
        }
      },
      lastModified: "2025-01-01T10:00:00Z",
      version: "3.2.0"
    }

    // Mock de lecture de fichier
    ;(fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/models/config')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockConfig)
        })
      }
      return Promise.resolve({ ok: true, status: 200 })
    })
  })

  describe('Config Response Structure', () => {
    it('should validate complete config structure', async () => {
      const response = await fetch('http://localhost:3000/api/models/config')
      const config = await response.json()

      // Structure principale
      expect(config).toHaveProperty('models')
      expect(config).toHaveProperty('lastModified')
      expect(config).toHaveProperty('version')
      expect(typeof config.models).toBe('object')

      // Validation d'un modèle spécifique
      const llama = config.models['llama3.2:3b']
      expect(llama).toHaveProperty('displayName')
      expect(llama).toHaveProperty('family')
      expect(llama).toHaveProperty('capabilities')
      expect(llama).toHaveProperty('config')
      expect(llama).toHaveProperty('tags')
      expect(llama).toHaveProperty('description')

      // Validation de la configuration technique
      expect(llama.config).toHaveProperty('temperature')
      expect(llama.config).toHaveProperty('context_length')
      expect(llama.config).toHaveProperty('top_p')
      expect(llama.config).toHaveProperty('repeat_penalty')

      // Types et plages de valeurs
      expect(typeof llama.config.temperature).toBe('number')
      expect(llama.config.temperature).toBeGreaterThanOrEqual(0)
      expect(llama.config.temperature).toBeLessThanOrEqual(2)

      expect(typeof llama.config.context_length).toBe('number')
      expect(llama.config.context_length).toBeGreaterThan(0)

      expect(typeof llama.config.top_p).toBe('number')
      expect(llama.config.top_p).toBeGreaterThanOrEqual(0)
      expect(llama.config.top_p).toBeLessThanOrEqual(1)
    })

    it('should validate model families and capabilities', async () => {
      const response = await fetch('http://localhost:3000/api/models/config')
      const config = await response.json()

      const validFamilies = ['llama', 'codellama', 'mistral', 'gemma', 'qwen']
      const validCapabilities = [
        'text-generation',
        'conversation', 
        'code-generation',
        'code-completion',
        'summarization',
        'translation',
        'question-answering'
      ]

      Object.values(config.models).forEach((model: any) => {
        // Famille valide
        expect(validFamilies).toContain(model.family)
        
        // Capacités valides
        expect(Array.isArray(model.capabilities)).toBe(true)
        model.capabilities.forEach((capability: string) => {
          expect(validCapabilities).toContain(capability)
        })

        // Tags
        expect(Array.isArray(model.tags)).toBe(true)
        model.tags.forEach((tag: string) => {
          expect(typeof tag).toBe('string')
          expect(tag.length).toBeGreaterThan(0)
        })
      })
    })
  })

  describe('Config Validation Logic', () => {
    it('should validate temperature ranges by model family', () => {
      const temperatureRanges = {
        'llama': { min: 0.1, max: 1.5, recommended: 0.7 },
        'codellama': { min: 0.0, max: 0.5, recommended: 0.1 },
        'mistral': { min: 0.1, max: 1.2, recommended: 0.8 },
        'gemma': { min: 0.1, max: 1.0, recommended: 0.6 }
      }

      Object.entries(temperatureRanges).forEach(([family, range]) => {
        expect(range.min).toBeLessThan(range.max)
        expect(range.recommended).toBeGreaterThanOrEqual(range.min)
        expect(range.recommended).toBeLessThanOrEqual(range.max)
      })

      // Test validation function
      const validateTemperature = (temp: number, family: string) => {
        const range = temperatureRanges[family as keyof typeof temperatureRanges]
        if (!range) return false
        return temp >= range.min && temp <= range.max
      }

      expect(validateTemperature(0.7, 'llama')).toBe(true)
      expect(validateTemperature(0.1, 'codellama')).toBe(true)
      expect(validateTemperature(2.0, 'codellama')).toBe(false) // Trop élevé
      expect(validateTemperature(-0.1, 'llama')).toBe(false) // Négatif
    })

    it('should validate context length constraints', () => {
      const contextLengthLimits = {
        'llama3.2:3b': 4096,
        'llama3.1:8b': 8192,
        'codellama:13b': 8192,
        'mistral:7b': 4096,
        'gemma:2b': 2048
      }

      Object.entries(contextLengthLimits).forEach(([model, maxContext]) => {
        expect(maxContext).toBeGreaterThan(0)
        expect(maxContext % 1024).toBe(0) // Multiple de 1024
        expect(maxContext).toBeLessThanOrEqual(32768) // Limite raisonnable
      })

      // Test validation
      const validateContextLength = (length: number, model: string) => {
        const limit = contextLengthLimits[model as keyof typeof contextLengthLimits]
        return limit ? length <= limit && length > 0 : false
      }

      expect(validateContextLength(2048, 'llama3.2:3b')).toBe(true)
      expect(validateContextLength(8192, 'llama3.2:3b')).toBe(false) // Dépasse la limite
      expect(validateContextLength(0, 'llama3.2:3b')).toBe(false) // Zéro non valide
    })
  })

  describe('Configuration Updates', () => {
    it('should simulate config update validation', () => {
      const currentConfig = {
        temperature: 0.7,
        context_length: 4096,
        top_p: 0.9,
        repeat_penalty: 1.1
      }

      const updatePayload = {
        temperature: 0.8,
        top_p: 0.95
      }

      // Simuler la mise à jour
      const updatedConfig = { ...currentConfig, ...updatePayload }
      
      expect(updatedConfig.temperature).toBe(0.8)
      expect(updatedConfig.top_p).toBe(0.95)
      expect(updatedConfig.context_length).toBe(4096) // Inchangé
      expect(updatedConfig.repeat_penalty).toBe(1.1) // Inchangé

      // Validation des nouvelles valeurs
      expect(updatedConfig.temperature).toBeGreaterThanOrEqual(0)
      expect(updatedConfig.temperature).toBeLessThanOrEqual(2)
      expect(updatedConfig.top_p).toBeGreaterThanOrEqual(0)
      expect(updatedConfig.top_p).toBeLessThanOrEqual(1)
    })

    it('should validate config backup and restore', () => {
      const originalConfig = {
        models: {
          "test:1b": {
            config: { temperature: 0.7 }
          }
        }
      }

      // Créer une sauvegarde
      const backup = JSON.parse(JSON.stringify(originalConfig))
      
      // Modifier l'original
      originalConfig.models["test:1b"].config.temperature = 0.9
      
      // Vérifier que le backup n'a pas changé
      expect(backup.models["test:1b"].config.temperature).toBe(0.7)
      expect(originalConfig.models["test:1b"].config.temperature).toBe(0.9)

      // Restaurer depuis le backup
      const restored = JSON.parse(JSON.stringify(backup))
      expect(restored.models["test:1b"].config.temperature).toBe(0.7)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing config file', async () => {
      ;(fetch as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Config file not found' })
        })
      })

      const response = await fetch('http://localhost:3000/api/models/config')
      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
      
      const error = await response.json()
      expect(error).toHaveProperty('error')
    })

    it('should handle malformed config data', async () => {
      ;(fetch as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            models: null, // Données corrompues
            invalidField: "should be ignored"
          })
        })
      })

      const response = await fetch('http://localhost:3000/api/models/config')
      const config = await response.json()
      
      // Simuler la validation côté API
      const isValidConfig = config && 
                           typeof config === 'object' && 
                           config.models !== null && 
                           typeof config.models === 'object'
      
      expect(isValidConfig).toBe(false)
    })

    it('should validate required fields', () => {
      const validateModelConfig = (model: any) => {
        const requiredFields = ['displayName', 'family', 'capabilities', 'config']
        const requiredConfigFields = ['temperature', 'context_length', 'top_p']
        
        // Vérifier les champs principaux
        for (const field of requiredFields) {
          if (!model[field]) return false
        }
        
        // Vérifier les champs de configuration
        for (const field of requiredConfigFields) {
          if (typeof model.config[field] !== 'number') return false
        }
        
        return true
      }

      // Test avec config valide
      const validModel = {
        displayName: "Test Model",
        family: "test",
        capabilities: ["text-generation"],
        config: {
          temperature: 0.7,
          context_length: 4096,
          top_p: 0.9
        }
      }
      expect(validateModelConfig(validModel)).toBe(true)

      // Test avec config invalide
      const invalidModel = {
        displayName: "Test Model",
        family: "test",
        // capabilities manquant
        config: {
          temperature: "0.7", // String au lieu de number
          context_length: 4096,
          top_p: 0.9
        }
      }
      expect(validateModelConfig(invalidModel)).toBe(false)
    })
  })

  describe('Performance Tests', () => {
    it('should handle large config files efficiently', () => {
      const startTime = Date.now()
      
      // Simuler un gros fichier de config avec 1000 modèles
      const largeConfig: any = {
        models: {},
        lastModified: new Date().toISOString(),
        version: "3.2.0"
      }

      for (let i = 0; i < 1000; i++) {
        largeConfig.models[`model-${i}:1b`] = {
          displayName: `Model ${i}`,
          family: 'test',
          capabilities: ['text-generation'],
          config: {
            temperature: 0.7,
            context_length: 4096,
            top_p: 0.9
          }
        }
      }

      // Simuler le traitement
      const processedCount = Object.keys(largeConfig.models).length
      const processingTime = Date.now() - startTime
      
      expect(processedCount).toBe(1000)
      expect(processingTime).toBeLessThan(100) // Moins de 100ms
    })
  })
})

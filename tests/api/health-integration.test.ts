/**
 * 🧪 Tests d'intégration API Health - Phase 2
 * Tests avec serveur Next.js réel et appels HTTP
 */

import { spawn, ChildProcess } from 'child_process'
import fetch from 'node-fetch'

describe('/api/health - Integration Tests', () => {
  let serverProcess: ChildProcess
  const BASE_URL = 'http://localhost:3001' // Port différent pour éviter les conflits

  beforeAll(async () => {
    // Démarrer un serveur Next.js pour les tests
    console.log('🚀 Démarrage serveur Next.js pour tests d\'intégration...')
    
    serverProcess = spawn('npm', ['run', 'dev'], {
      env: { ...process.env, PORT: '3001' },
      stdio: 'pipe'
    })

    // Attendre que le serveur soit prêt
    await new Promise((resolve) => {
      const checkServer = async () => {
        try {
          const response = await fetch(`${BASE_URL}/api/health`)
          if (response.status === 200) {
            console.log('✅ Serveur Next.js prêt pour les tests')
            resolve(true)
          }
        } catch (error) {
          // Serveur pas encore prêt
          setTimeout(checkServer, 1000)
        }
      }
      setTimeout(checkServer, 3000) // Premier essai après 3s
    })
  }, 30000) // Timeout de 30s pour le démarrage

  afterAll(async () => {
    if (serverProcess) {
      console.log('🛑 Arrêt du serveur de test')
      serverProcess.kill()
    }
  })

  describe('Real API Health Tests', () => {
    it('should return health status with real server', async () => {
      const response = await fetch(`${BASE_URL}/api/health`)
      
      expect([200, 503]).toContain(response.status) // 200 si Ollama up, 503 si down
      
      const data = await response.json()
      
      // Structure obligatoire
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('services')
      expect(data).toHaveProperty('apis')
      expect(data).toHaveProperty('summary')
      expect(data).toHaveProperty('timestamp')

      // Validation des services
      expect(data.services).toHaveProperty('ollama')
      expect(typeof data.services.ollama.healthy).toBe('boolean')
      expect(typeof data.services.ollama.url).toBe('string')
      expect(typeof data.services.ollama.models).toBe('number')
      expect(data.services.ollama.type).toBe('native')

      // Validation des APIs
      expect(Array.isArray(data.apis)).toBe(true)
      expect(data.apis.length).toBe(6) // 6 APIs attendues

      const expectedApis = [
        '/api/models',
        '/api/models/config',
        '/api/benchmark/configs',
        '/api/benchmark/history',
        '/api/ollama',
        '/api/ollama/health'
      ]

      expectedApis.forEach(expectedPath => {
        const api = data.apis.find((a: any) => a.path === expectedPath)
        expect(api).toBeDefined()
        expect(api.version).toMatch(/^\d+\.\d+\.\d+$/)
        expect(['healthy', 'unhealthy', 'unknown']).toContain(api.status)
        expect(typeof api.responseTime).toBe('number')
      })

      // Validation du summary
      expect(data.summary.total).toBe(6)
      expect(data.summary.healthy + data.summary.unhealthy).toBe(data.summary.total)
      expect(typeof data.summary.avgResponseTime).toBe('number')

      // Validation timestamp
      const timestamp = new Date(data.timestamp)
      expect(timestamp).toBeInstanceOf(Date)
      expect(timestamp.toISOString()).toBe(data.timestamp)
    }, 10000)

    it('should return consistent data across multiple calls', async () => {
      const calls = await Promise.all([
        fetch(`${BASE_URL}/api/health`),
        fetch(`${BASE_URL}/api/health`),
        fetch(`${BASE_URL}/api/health`)
      ])

      const responses = await Promise.all(calls.map(call => call.json()))

      // Tous les appels doivent avoir la même structure
      responses.forEach(data => {
        expect(data).toHaveProperty('status')
        expect(data).toHaveProperty('services')
        expect(data).toHaveProperty('apis')
        expect(data.apis.length).toBe(6)
      })

      // Le statut Ollama doit être cohérent
      const ollamaStatuses = responses.map(r => r.services.ollama.healthy)
      expect(ollamaStatuses.every(status => status === ollamaStatuses[0])).toBe(true)
    }, 15000)

    it('should have reasonable response times', async () => {
      const startTime = Date.now()
      const response = await fetch(`${BASE_URL}/api/health`)
      const endTime = Date.now()
      
      const responseTime = endTime - startTime
      expect(responseTime).toBeLessThan(5000) // Moins de 5 secondes
      
      expect([200, 503]).toContain(response.status)
      
      const data = await response.json()
      data.apis.forEach((api: any) => {
        expect(api.responseTime).toBeLessThan(3000) // Chaque API < 3s
      })
    }, 10000)
  })

  describe('Error Handling Integration', () => {
    it('should handle invalid HTTP methods gracefully', async () => {
      const methods = ['POST', 'PUT', 'DELETE', 'PATCH']
      
      for (const method of methods) {
        const response = await fetch(`${BASE_URL}/api/health`, { method })
        expect(response.status).toBe(405) // Method Not Allowed
      }
    })

    it('should return valid JSON even when services are down', async () => {
      const response = await fetch(`${BASE_URL}/api/health`)
      expect(response.headers.get('content-type')).toContain('application/json')
      
      const data = await response.json()
      expect(typeof data).toBe('object')
      expect(data).not.toBe(null)
    })
  })

  describe('Performance Integration', () => {
    it('should handle concurrent requests', async () => {
      const concurrentCalls = 5
      const promises = Array(concurrentCalls).fill(null).map(() => 
        fetch(`${BASE_URL}/api/health`)
      )

      const responses = await Promise.all(promises)
      
      // Tous les appels doivent réussir
      responses.forEach(response => {
        expect([200, 503]).toContain(response.status)
      })

      const data = await Promise.all(responses.map(r => r.json()))
      
      // Structure cohérente pour tous
      data.forEach(result => {
        expect(result.apis.length).toBe(6)
        expect(typeof result.summary.avgResponseTime).toBe('number')
      })
    }, 20000)
  })
})

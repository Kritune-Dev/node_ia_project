/**
 * 🧪 Tests Jest - Configuration de base
 * Test simple pour valider Jest et les mocks
 */

describe('Jest Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should have Jest configured correctly', () => {
    expect(true).toBe(true)
  })

  it('should have environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test')
    expect(process.env.OLLAMA_BASE_URL).toBe('http://localhost:11436')
  })

  it('should have global mocks available', () => {
    expect(fetch).toBeDefined()
    expect(jest.isMockFunction(fetch)).toBe(true)
  })

  it('should have polyfills available', () => {
    expect(TextEncoder).toBeDefined()
    expect(TextDecoder).toBeDefined()
  })

  it('should be able to mock fetch', async () => {
    // Mock simple de fetch
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: 'test successful' })
    })

    const response = await fetch('/test')
    expect(response.ok).toBe(true)
    
    const data = await response.json()
    expect(data.message).toBe('test successful')
  })

  it('should be able to test async operations', async () => {
    const mockPromise = new Promise(resolve => {
      setTimeout(() => resolve('async test'), 10)
    })

    const result = await mockPromise
    expect(result).toBe('async test')
  })

  it('should support TypeScript types', () => {
    interface TestInterface {
      name: string
      value: number
    }

    const testObject: TestInterface = {
      name: 'test',
      value: 42
    }

    expect(testObject.name).toBe('test')
    expect(testObject.value).toBe(42)
  })
})

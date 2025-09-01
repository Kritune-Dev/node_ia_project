/**
 * Jest Setup File
 * Configuration globale pour les tests Jest
 */

import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfills pour l'environnement Node.js
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Next.js modules
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock fetch globalement 
global.fetch = jest.fn()

// Variables d'environnement pour les tests
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000'
process.env.OLLAMA_BASE_URL = 'http://localhost:11436'

// Nettoyer les mocks entre les tests
beforeEach(() => {
  jest.clearAllMocks()
})

// Supprimer les warnings de console pendant les tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  console.error = jest.fn()
  console.warn = jest.fn()
})

afterAll(() => {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

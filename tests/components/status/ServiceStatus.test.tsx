/**
 * 🧪 Tests ServiceStatus Component - Phase 3
 * Tests du composant de monitoring des services
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import ServiceStatus from '@/components/status/ServiceStatus'

// Mock des icônes
jest.mock('lucide-react', () => ({
  CheckCircle: ({ className, ...props }: any) => <div className={className} data-testid="check-circle" {...props} />,
  XCircle: ({ className, ...props }: any) => <div className={className} data-testid="x-circle" {...props} />,
  AlertCircle: ({ className, ...props }: any) => <div className={className} data-testid="alert-circle" {...props} />,
  RefreshCw: ({ className, ...props }: any) => <div className={className} data-testid="refresh-cw" {...props} />,
  Server: ({ className, ...props }: any) => <div className={className} data-testid="server" {...props} />,
}))

// Helper pour mocker fetch
const mockFetch = (response: any, status = 200) => {
  const mockResponse = {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response)
  }
  ;(fetch as jest.Mock).mockResolvedValueOnce(mockResponse)
}

// Mock des icônes Lucide React
jest.mock('lucide-react', () => ({
  CheckCircle: ({ className }: { className: string }) => <div data-testid="check-circle" className={className} />,
  XCircle: ({ className }: { className: string }) => <div data-testid="x-circle" className={className} />,
  RefreshCw: ({ className }: { className: string }) => <div data-testid="refresh-cw" className={className} />,
  Brain: ({ className }: { className: string }) => <div data-testid="brain" className={className} />,
  Globe: ({ className }: { className: string }) => <div data-testid="globe" className={className} />,
  Zap: ({ className }: { className: string }) => <div data-testid="zap" className={className} />
}))

// Mock de AbortSignal.timeout pour Node.js
global.AbortSignal = {
  ...global.AbortSignal,
  timeout: jest.fn(() => ({
    aborted: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
} as any

describe('ServiceStatus Component', () => {
  const defaultProps = {
    isVisible: true,
    onClose: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset des variables d'environnement
    process.env.NEXT_PUBLIC_OLLAMA_BASE_URL = 'http://localhost:11436'
  })

  describe('Rendering Tests', () => {
    it('should not render when isVisible is false', () => {
      render(<ServiceStatus isVisible={false} onClose={jest.fn()} />)
      
      expect(screen.queryByText('État des Services Ollama')).not.toBeInTheDocument()
    })

    it('should render when isVisible is true', () => {
      // Mock successful Ollama response
      mockFetch({
        models: [
          { name: 'llama3.2:3b' },
          { name: 'codellama:13b' }
        ]
      })

      render(<ServiceStatus {...defaultProps} />)
      
      expect(screen.getByText('État des Services Ollama')).toBeInTheDocument()
      expect(screen.getByText(/Surveillance en temps réel/)).toBeInTheDocument()
    })

    it('should show loading state initially', () => {
      // Mock delayed response
      mockFetch(new Promise(resolve => setTimeout(resolve, 1000)))

      render(<ServiceStatus {...defaultProps} />)
      
      expect(screen.getByText('État des Services Ollama')).toBeInTheDocument()
    })
  })

  describe('Ollama Connection Tests', () => {
    it('should display connected status when Ollama is available', async () => {
      const mockModels = {
        models: [
          { name: 'llama3.2:3b' },
          { name: 'codellama:13b' },
          { name: 'mistral:7b' }
        ]
      }

      mockFetch(mockModels, 200)

      render(<ServiceStatus {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Ollama connecté - 3 modèles/)).toBeInTheDocument()
      })

      // Vérifier l'icône de succès dans la zone de service status
      const serviceStatus = screen.getByText('Ollama Natif').closest('div')
      expect(serviceStatus).toBeInTheDocument()
    })

    it('should display disconnected status when Ollama is unavailable', async () => {
      // Mock failed fetch
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('ECONNREFUSED'))

      render(<ServiceStatus {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Ollama non accessible/)).toBeInTheDocument()
      })

      // Vérifier que le service Ollama Natif est affiché
      expect(screen.getByText('Ollama Natif')).toBeInTheDocument()
    })

    it('should display error status for HTTP errors', async () => {
      mockFetch({ error: 'Internal Server Error' }, 500)

      render(<ServiceStatus {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Ollama non accessible/)).toBeInTheDocument()
      })

      expect(screen.getByText('Ollama Natif')).toBeInTheDocument()
    })

    it('should handle empty models list', async () => {
      mockFetch({ models: [] }, 200)

      render(<ServiceStatus {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Ollama connecté - 0 modèles/)).toBeInTheDocument()
      })

      expect(screen.getByText('Ollama Natif')).toBeInTheDocument()
    })
  })

  describe('User Interaction Tests', () => {
    it('should call onClose when clicking outside modal', async () => {
      const onCloseMock = jest.fn()
      mockFetch({ models: [] })

      const user = userEvent.setup()
      render(<ServiceStatus isVisible={true} onClose={onCloseMock} />)

      // Attendre que le contenu se charge
      await waitFor(() => {
        expect(screen.getByText('État des Services Ollama')).toBeInTheDocument()
      })

      // Cliquer sur le backdrop (div avec background noir)
      const backdrop = screen.getByText('État des Services Ollama').closest('[class*="fixed inset-0"]')
      expect(backdrop).toBeInTheDocument()
      await user.click(backdrop!)

      expect(onCloseMock).toHaveBeenCalledTimes(1)
    })

    it('should not call onClose when clicking inside modal', async () => {
      const onCloseMock = jest.fn()
      mockFetch({ models: [] })

      const user = userEvent.setup()
      render(<ServiceStatus isVisible={true} onClose={onCloseMock} />)

      await waitFor(() => {
        expect(screen.getByText('État des Services Ollama')).toBeInTheDocument()
      })

      // Cliquer à l'intérieur du modal
      const modalContent = screen.getByText('État des Services Ollama')
      await user.click(modalContent)

      expect(onCloseMock).not.toHaveBeenCalled()
    })

    it('should refresh data when refresh button is clicked', async () => {
      // Premier appel
      mockFetch({ models: [{ name: 'model1' }] })

      const user = userEvent.setup()
      render(<ServiceStatus {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/1 modèles/)).toBeInTheDocument()
      })

      // Reset et nouveau mock pour le deuxième appel
      jest.clearAllMocks()
      mockFetch({ models: [{ name: 'model1' }, { name: 'model2' }] })

      // Trouver le bouton refresh par son icône
      const refreshButtons = screen.getAllByRole('button')
      const refreshBtn = refreshButtons.find(btn => 
        btn.querySelector('[data-testid="refresh-cw"]')
      )
      
      expect(refreshBtn).toBeInTheDocument()
      await user.click(refreshBtn!)

      await waitFor(() => {
        expect(screen.getByText(/2 modèles/)).toBeInTheDocument()
      })

      // Vérifier que fetch a été appelé de nouveau
      expect(fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Status Display Tests', () => {
    it('should show correct status colors for different states', async () => {
      mockFetch({ models: [] })

      render(<ServiceStatus {...defaultProps} />)

      await waitFor(() => {
        // Vérifier que le service est affiché avec le bon état
        expect(screen.getByText('Ollama Natif')).toBeInTheDocument()
        expect(screen.getByText((content, element) => {
          return content.includes('Ollama connecté') && content.includes('modèles')
        })).toBeInTheDocument()
      })
    })

    it('should display service type indicator', async () => {
      mockFetch({ models: [] })

      render(<ServiceStatus {...defaultProps} />)

      await waitFor(() => {
        // Vérifier l'icône Zap pour service natif préféré
        expect(screen.getByTestId('zap')).toBeInTheDocument()
      })
    })

    it('should show timestamp in French format', async () => {
      mockFetch({ models: [] })

      render(<ServiceStatus {...defaultProps} />)

      await waitFor(() => {
        // Vérifier qu'un timestamp est affiché
        const timestampRegex = /\d{2}:\d{2}:\d{2}/
        expect(screen.getByText(timestampRegex)).toBeInTheDocument()
      })
    })
  })

  describe('Environment Configuration Tests', () => {
    it('should use custom OLLAMA_BASE_URL when provided', async () => {
      process.env.NEXT_PUBLIC_OLLAMA_BASE_URL = 'http://custom-ollama:11436'
      
      mockFetch({ models: [] })

      render(<ServiceStatus {...defaultProps} />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://custom-ollama:11436/api/tags',
          expect.any(Object)
        )
      })
    })

    it('should fallback to localhost when no env var is set', async () => {
      delete process.env.NEXT_PUBLIC_OLLAMA_BASE_URL
      
      mockFetch({ models: [] })

      render(<ServiceStatus {...defaultProps} />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:11436/api/tags',
          expect.any(Object)
        )
      })
    })
  })

  describe('Error Handling Tests', () => {
    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Timeout')
      timeoutError.name = 'AbortError'
      ;(fetch as jest.Mock).mockRejectedValueOnce(timeoutError)

      render(<ServiceStatus {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText((content, element) => {
          return content.includes('Ollama non accessible')
        })).toBeInTheDocument()
      })
    })

    it('should handle JSON parsing errors', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON'))
      })

      render(<ServiceStatus {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText((content, element) => {
          return content.includes('Ollama non accessible')
        })).toBeInTheDocument()
      })
    })

    it('should handle malformed response data', async () => {
      // Mock response with null models should still work
      mockFetch({ invalid: 'response', models: null })

      render(<ServiceStatus {...defaultProps} />)

      await waitFor(() => {
        // Should handle null models gracefully
        expect(screen.getByText((content, element) => {
          return content.includes('Ollama connecté') && content.includes('modèles')
        })).toBeInTheDocument()
      })
    })
  })

  describe('Performance Tests', () => {
    it('should not fetch data when not visible', () => {
      render(<ServiceStatus isVisible={false} onClose={jest.fn()} />)
      
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should only fetch once when becoming visible', async () => {
      mockFetch({ models: [] })

      const { rerender } = render(<ServiceStatus isVisible={false} onClose={jest.fn()} />)
      
      expect(fetch).not.toHaveBeenCalled()

      rerender(<ServiceStatus isVisible={true} onClose={jest.fn()} />)
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1)
      })
    })
  })
})

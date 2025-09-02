/**
 * 🧪 Tests ModelStatusSimple Component - Phase 3
 * Tests du composant d'affichage simplifié des modèles
 */

import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import ModelStatusSimple from '@/components/models/ModelStatusSimple'

// Mock des hooks useApi
const mockUseModels = jest.fn()
const mockUseSystemHealth = jest.fn()

jest.mock('@/hooks/useApi', () => ({
  useModels: () => mockUseModels(),
  useSystemHealth: () => mockUseSystemHealth()
}))

// Mock des icônes Lucide React
jest.mock('lucide-react', () => ({
  CheckCircle: ({ className }: { className: string }) => <div data-testid="check-circle" className={className} />,
  XCircle: ({ className }: { className: string }) => <div data-testid="x-circle" className={className} />,
  RefreshCw: ({ className }: { className: string }) => <div data-testid="refresh-cw" className={className} />,
  Brain: ({ className }: { className: string }) => <div data-testid="brain" className={className} />,
  Cpu: ({ className }: { className: string }) => <div data-testid="cpu" className={className} />,
  Activity: ({ className }: { className: string }) => <div data-testid="activity" className={className} />,
  Heart: ({ className }: { className: string }) => <div data-testid="heart" className={className} />,
  Zap: ({ className }: { className: string }) => <div data-testid="zap" className={className} />
}))

// Mock du composant ModelDetailModal
jest.mock('@/components/Modal/ModelDetailModal', () => {
  return function MockModelDetailModal({ model, isVisible, onClose }: any) {
    if (!isVisible) return null
    return (
      <div data-testid="model-detail-modal">
        <div>Model: {model?.name}</div>
        <button onClick={onClose}>Fermer</button>
      </div>
    )
  }
})

describe('ModelStatusSimple Component', () => {
  const mockModelsData = {
    models: [
      {
        name: 'llama3.2:3b',
        family: 'Llama',
        size: '3B',
        type: 'medical',
        displayName: 'Llama 3.2 Medical',
        status: 'ready',
        capabilities: ['text-generation', 'medical-analysis'],
        specialties: ['osteopathy', 'diagnosis']
      },
      {
        name: 'codellama:13b',
        family: 'Llama',
        size: '13B',
        type: 'rapide',
        displayName: 'CodeLlama Fast',
        status: 'ready',
        capabilities: ['code-generation'],
        specialties: []
      },
      {
        name: 'mistral:7b',
        family: 'Mistral',
        size: '7B',
        type: 'general',
        displayName: 'Mistral 7B',
        status: 'ready',
        capabilities: ['text-generation'],
        specialties: []
      }
    ],
    count: 3,
    isLoading: false,
    error: null,
    refresh: jest.fn()
  }

  const mockHealthData = {
    isHealthy: true,
    services: {
      ollama: { status: 'connected', message: 'OK' }
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseModels.mockReturnValue(mockModelsData)
    mockUseSystemHealth.mockReturnValue(mockHealthData)
  })

  describe('Rendering Tests', () => {
    it('should render the component with basic structure', () => {
      render(<ModelStatusSimple />)
      
      expect(screen.getByText('Modèles IA')).toBeInTheDocument()
      expect(screen.getByTestId('brain')).toBeInTheDocument()
      expect(screen.getByText('Actualiser')).toBeInTheDocument()
    })

    it('should display loading state', () => {
      mockUseModels.mockReturnValue({ ...mockModelsData, isLoading: true })

      render(<ModelStatusSimple />)
      
      expect(screen.getByTestId('refresh-cw')).toHaveClass('animate-spin')
    })

    it('should display error state', () => {
      const errorData = {
        ...mockModelsData,
        isLoading: false,
        error: new Error('Connection failed'),
        models: []
      }

      mockUseModels.mockReturnValue(errorData)

      render(<ModelStatusSimple />)
      
      expect(screen.getByText('❌ Erreur lors du chargement des modèles')).toBeInTheDocument()
      expect(screen.getByText('Connection failed')).toBeInTheDocument()
      expect(screen.getByText('Réessayer')).toBeInTheDocument()
    })
  })

  describe('Statistics Display Tests', () => {
    it('should display model statistics correctly', () => {
      render(<ModelStatusSimple />)
      
      // Total models (3)
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('Modèles total')).toBeInTheDocument()
      
      // Medical models (1) - find parent container with bg-red-50
      const medicalContainer = screen.getByText('Médicaux').closest('.bg-red-50') as HTMLElement
      expect(medicalContainer).toBeInTheDocument()
      expect(within(medicalContainer).getByText('1')).toBeInTheDocument()
      
      // Fast models (1) - find parent container with bg-green-50
      const fastContainer = screen.getByText('Rapides').closest('.bg-green-50') as HTMLElement
      expect(fastContainer).toBeInTheDocument()
      expect(within(fastContainer).getByText('1')).toBeInTheDocument()
      
      // Model families (2)
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('Familles')).toBeInTheDocument()
    })

    it('should display system health status', () => {
      render(<ModelStatusSimple />)
      
      expect(screen.getByText('Statut système')).toBeInTheDocument()
      expect(screen.getByText('En ligne')).toBeInTheDocument()
      
      // Look for check-circle specifically in the system status area
      const systemStatusSection = screen.getByText('En ligne').closest('div') as HTMLElement
      expect(within(systemStatusSection).getByTestId('check-circle')).toBeInTheDocument()
    })

    it('should display offline status when unhealthy', () => {
      mockUseSystemHealth.mockReturnValue({ ...mockHealthData, isHealthy: false })

      render(<ModelStatusSimple />)
      
      expect(screen.getByText('Hors ligne')).toBeInTheDocument()
      expect(screen.getByTestId('x-circle')).toBeInTheDocument()
    })
  })

  describe('Model Family Groups Tests', () => {
    it('should group models by family correctly', () => {
      render(<ModelStatusSimple />)
      
      // Should show Llama family (2 models)
      expect(screen.getByText('Llama')).toBeInTheDocument()
      expect(screen.getByText('2 modèles')).toBeInTheDocument()
      
      // Should show unique models group (1 Mistral model)
      expect(screen.getByText('Modèles uniques')).toBeInTheDocument()
    })

    it('should display medical and fast model indicators in families', () => {
      render(<ModelStatusSimple />)
      
      // Check for medical indicator in Llama family
      expect(screen.getByText('Médical')).toBeInTheDocument()
      expect(screen.getByText('1 médical')).toBeInTheDocument()
      
      // Check for fast indicator in Llama family
      expect(screen.getByText('Rapide')).toBeInTheDocument()
      expect(screen.getByText('1 rapide')).toBeInTheDocument()
    })

    it('should display individual model cards', () => {
      render(<ModelStatusSimple />)
      
      // Check individual model display names
      expect(screen.getByText('Llama 3.2 Medical')).toBeInTheDocument()
      expect(screen.getByText('CodeLlama Fast')).toBeInTheDocument()
      expect(screen.getByText('Mistral 7B')).toBeInTheDocument()
      
      // Check model sizes
      expect(screen.getByText('3B')).toBeInTheDocument()
      expect(screen.getByText('13B')).toBeInTheDocument()
      expect(screen.getByText('7B')).toBeInTheDocument()
    })
  })

  describe('User Interaction Tests', () => {
    it('should call refresh function when refresh button is clicked', async () => {
      const refreshMock = jest.fn()
      const mockData = { ...mockModelsData, refresh: refreshMock }
      
      mockUseModels.mockReturnValue(mockData)

      const user = userEvent.setup()
      render(<ModelStatusSimple />)
      
      const refreshButton = screen.getByText('Actualiser')
      await user.click(refreshButton)
      
      expect(refreshMock).toHaveBeenCalledTimes(1)
    })

    it('should call refresh function when retry button is clicked in error state', async () => {
      const refreshMock = jest.fn()
      const errorData = {
        ...mockModelsData,
        isLoading: false,
        error: new Error('Connection failed'),
        models: [],
        refresh: refreshMock
      }

      mockUseModels.mockReturnValue(errorData)

      const user = userEvent.setup()
      render(<ModelStatusSimple />)
      
      const retryButton = screen.getByText('Réessayer')
      await user.click(retryButton)
      
      expect(refreshMock).toHaveBeenCalledTimes(1)
    })

    it('should open model detail modal when model card is clicked', async () => {
      const user = userEvent.setup()
      render(<ModelStatusSimple />)
      
      // Click on a model card
      const modelCard = screen.getByText('Llama 3.2 Medical').closest('div')
      expect(modelCard).toBeInTheDocument()
      await user.click(modelCard!)
      
      // Check if modal opens
      expect(screen.getByTestId('model-detail-modal')).toBeInTheDocument()
      expect(screen.getByText('Model: llama3.2:3b')).toBeInTheDocument()
    })

    it('should close model detail modal when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<ModelStatusSimple />)
      
      // Open modal
      const modelCard = screen.getByText('Llama 3.2 Medical').closest('div')
      await user.click(modelCard!)
      
      expect(screen.getByTestId('model-detail-modal')).toBeInTheDocument()
      
      // Close modal
      const closeButton = screen.getByText('Fermer')
      await user.click(closeButton)
      
      expect(screen.queryByTestId('model-detail-modal')).not.toBeInTheDocument()
    })
  })

  describe('Empty State Tests', () => {
    it('should display empty state when no models are available', () => {
      mockUseModels.mockReturnValue({ ...mockModelsData, models: [], count: 0 })

      render(<ModelStatusSimple />)
      
      expect(screen.getByText('Aucun modèle trouvé')).toBeInTheDocument()
      expect(screen.getByText('Vérifiez que Ollama est démarré et que des modèles sont installés.')).toBeInTheDocument()
    })
  })

  describe('Model Type Indicators Tests', () => {
    it('should display heart icon for medical models', () => {
      render(<ModelStatusSimple />)
      
      // Should have heart icons for medical models (in stats and in model cards)
      const heartIcons = screen.getAllByTestId('heart')
      expect(heartIcons.length).toBeGreaterThan(0)
    })

    it('should display zap icon for fast models', () => {
      render(<ModelStatusSimple />)
      
      // Should have zap icons for fast models (in stats and in model cards)
      const zapIcons = screen.getAllByTestId('zap')
      expect(zapIcons.length).toBeGreaterThan(0)
    })

    it('should display type labels in model descriptions', () => {
      render(<ModelStatusSimple />)
      
      expect(screen.getByText((content, element) => {
        return content.includes('Modèle Médical')
      })).toBeInTheDocument()
      
      expect(screen.getByText((content, element) => {
        return content.includes('Modèle Rapide')
      })).toBeInTheDocument()
    })
  })

  describe('Performance Tests', () => {
    it('should handle large number of models efficiently', () => {
      const largeModelsList = Array.from({ length: 50 }, (_, i) => ({
        name: `model-${i}`,
        family: `Family-${Math.floor(i / 10)}`,
        size: `${i + 1}B`,
        type: i % 3 === 0 ? 'medical' : i % 3 === 1 ? 'rapide' : 'general',
        displayName: `Model ${i}`,
        status: 'ready',
        capabilities: ['text-generation'],
        specialties: []
      }))

      mockUseModels.mockReturnValue({ ...mockModelsData, models: largeModelsList, count: 50 })

      render(<ModelStatusSimple />)
      
      expect(screen.getByText('50')).toBeInTheDocument()
      expect(screen.getByText('Modèles total')).toBeInTheDocument()
    })
  })
})

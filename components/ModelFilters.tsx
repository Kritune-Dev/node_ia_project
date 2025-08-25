'use client'

import { useState } from 'react'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'

interface FilterOptions {
  services: Array<{
    name: string
    type: string
    count: number
  }>
  types: Array<{
    label: string
    value: string
    count: number
  }>
  sizes: Array<{
    label: string
    min: number
    max: number
    count: number
  }>
  families: Array<{
    name: string
    count: number
    type: string
  }>
}

interface ModelFiltersProps {
  filterOptions: FilterOptions
  onFiltersChange: (filters: any) => void
  activeFilters: any
}

export default function ModelFilters({ filterOptions, onFiltersChange, activeFilters }: ModelFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    services: false,
    types: true,
    sizes: false,
    families: false
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }))
  }

  const handleFilterChange = (category: string, value: string, checked: boolean) => {
    const newFilters = { ...activeFilters }
    
    if (!newFilters[category]) newFilters[category] = []
    
    if (checked) {
      if (!newFilters[category].includes(value)) {
        newFilters[category].push(value)
      }
    } else {
      newFilters[category] = newFilters[category].filter((item: string) => item !== value)
    }
    
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((total: number, filters: any) => {
      return total + (Array.isArray(filters) ? filters.length : 0)
    }, 0)
  }

  const activeCount = getActiveFilterCount()

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Filter className="w-4 h-4" />
        <span>Filtres</span>
        {activeCount > 0 && (
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            {activeCount}
          </span>
        )}
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filtres</h3>
              <div className="flex items-center gap-2">
                {activeCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Effacer tout
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Services */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection('services')}
                className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-2"
              >
                <span>Services</span>
                {expandedSections.services ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedSections.services && (
                <div className="space-y-2 ml-2">
                  {filterOptions.services.map(service => (
                    <label key={service.name} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={activeFilters.services?.includes(service.name) || false}
                        onChange={(e) => handleFilterChange('services', service.name, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="flex-1">{service.name}</span>
                      <span className="text-gray-500">({service.count})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Types */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection('types')}
                className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-2"
              >
                <span>Types</span>
                {expandedSections.types ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedSections.types && (
                <div className="space-y-2 ml-2">
                  {filterOptions.types.map(type => (
                    <label key={type.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={activeFilters.types?.includes(type.value) || false}
                        onChange={(e) => handleFilterChange('types', type.value, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="flex-1">{type.label}</span>
                      <span className="text-gray-500">({type.count})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Tailles */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection('sizes')}
                className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-2"
              >
                <span>Tailles</span>
                {expandedSections.sizes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedSections.sizes && (
                <div className="space-y-2 ml-2">
                  {filterOptions.sizes.map(size => (
                    <label key={size.label} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={activeFilters.sizes?.includes(size.label) || false}
                        onChange={(e) => handleFilterChange('sizes', size.label, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="flex-1">{size.label}</span>
                      <span className="text-gray-500">({size.count})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Familles */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection('families')}
                className="flex items-center justify-between w-full text-left font-medium text-gray-700 mb-2"
              >
                <span>Familles</span>
                {expandedSections.families ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedSections.families && (
                <div className="space-y-2 ml-2 max-h-32 overflow-y-auto">
                  {filterOptions.families.map(family => (
                    <label key={family.name} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={activeFilters.families?.includes(family.name) || false}
                        onChange={(e) => handleFilterChange('families', family.name, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="flex-1">{family.name}</span>
                      <span className={`px-1.5 py-0.5 text-xs rounded ${
                        family.type === 'medical' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {family.type}
                      </span>
                      <span className="text-gray-500">({family.count})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

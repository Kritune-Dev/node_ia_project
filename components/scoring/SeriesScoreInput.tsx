'use client'

import { useState } from 'react'
import { Star, Save, X, MessageSquare } from 'lucide-react'
import { SeriesScore } from '../../lib/types/scoring'

interface SeriesScoreInputProps {
  seriesId: string
  seriesName: string
  modelName: string
  currentScore?: SeriesScore | null
  onSave: (score: number, comment: string) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export default function SeriesScoreInput({
  seriesId,
  seriesName,
  modelName,
  currentScore,
  onSave,
  onCancel,
  isLoading = false
}: SeriesScoreInputProps) {
  const [score, setScore] = useState(currentScore?.score || 0)
  const [comment, setComment] = useState(currentScore?.comment || '')
  const [hoveredStar, setHoveredStar] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await onSave(score, comment)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const renderStars = () => {
    const stars = []
    const displayScore = hoveredStar || score
    
    for (let i = 1; i <= 10; i++) {
      const isFilled = i <= displayScore
      const isHalf = i === Math.ceil(displayScore) && displayScore % 1 !== 0
      
      stars.push(
        <button
          key={i}
          type="button"
          className={`w-6 h-6 transition-colors ${
            isFilled 
              ? 'text-yellow-400 hover:text-yellow-500' 
              : 'text-gray-300 hover:text-yellow-300'
          }`}
          onMouseEnter={() => setHoveredStar(i)}
          onMouseLeave={() => setHoveredStar(0)}
          onClick={() => setScore(i)}
          disabled={isLoading || isSaving}
        >
          <Star 
            className="w-full h-full" 
            fill={isFilled ? 'currentColor' : 'none'}
          />
        </button>
      )
    }
    
    return stars
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">Noter : {seriesName}</h4>
          <p className="text-sm text-gray-500">Modèle : {modelName}</p>
        </div>
        {currentScore && (
          <div className="text-xs text-gray-400">
            {currentScore.isAutomatic ? '🤖 Auto' : '👤 Manuel'} • {new Date(currentScore.scoredAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Notation par étoiles */}
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-gray-700 mr-2">Score :</span>
          <div className="flex items-center gap-1">
            {renderStars()}
          </div>
          <span className="ml-2 text-sm text-gray-600 font-medium">
            {score}/10
          </span>
        </div>
        
        {/* Indicateurs de niveau */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            1-3 Faible
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            4-6 Moyen
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            7-10 Excellent
          </span>
        </div>
      </div>

      {/* Commentaire */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Remarques (optionnel)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Commentaires sur la performance de cette série de tests..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          disabled={isLoading || isSaving}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isLoading || isSaving}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <X className="w-4 h-4 inline mr-1" />
            Annuler
          </button>
        )}
        
        <button
          onClick={handleSave}
          disabled={isLoading || isSaving || score === 0}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Sauvegarder
            </>
          )}
        </button>
      </div>
    </div>
  )
}

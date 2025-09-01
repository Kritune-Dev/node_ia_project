'use client'

import { Star, Edit, Trash2, Clock, User, Bot } from 'lucide-react'
import { SeriesScore } from '../../lib/types/scoring'

interface SeriesScoreDisplayProps {
  seriesId: string
  seriesName: string
  score: SeriesScore
  onEdit?: () => void
  onDelete?: () => void
  isCompact?: boolean
}

export default function SeriesScoreDisplay({
  seriesId,
  seriesName,
  score,
  onEdit,
  onDelete,
  isCompact = false
}: SeriesScoreDisplayProps) {
  
  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 7) return 'text-green-600'
    if (scoreValue >= 4) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (scoreValue: number) => {
    if (scoreValue >= 7) return 'Excellent'
    if (scoreValue >= 4) return 'Moyen'
    return 'Faible'
  }

  const renderStars = (scoreValue: number, size = 'w-4 h-4') => {
    const stars = []
    for (let i = 1; i <= 10; i++) {
      stars.push(
        <Star
          key={i}
          className={`${size} ${i <= scoreValue ? 'text-yellow-400' : 'text-gray-300'}`}
          fill={i <= scoreValue ? 'currentColor' : 'none'}
        />
      )
    }
    return stars
  }

  if (isCompact) {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="flex items-center gap-1">
          <span className={`font-bold text-lg ${getScoreColor(score.score)}`}>
            {score.score}/10
          </span>
          <div className="flex items-center gap-0.5">
            {renderStars(score.score, 'w-3 h-3')}
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {score.isAutomatic ? (
            <Bot className="w-3 h-3" />
          ) : (
            <User className="w-3 h-3" />
          )}
          <Clock className="w-3 h-3" />
          {new Date(score.scoredAt).toLocaleDateString()}
        </div>

        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1 ml-auto">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Modifier le score"
              >
                <Edit className="w-3 h-3" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Supprimer le score"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">{seriesName}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`font-bold text-xl ${getScoreColor(score.score)}`}>
              {score.score}/10
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              score.score >= 7 
                ? 'bg-green-100 text-green-700'
                : score.score >= 4
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {getScoreLabel(score.score)}
            </span>
          </div>
        </div>

        {(onEdit || onDelete) && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors hover:bg-blue-50 rounded"
                title="Modifier le score"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors hover:bg-red-50 rounded"
                title="Supprimer le score"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Étoiles visuelles */}
      <div className="flex items-center gap-1">
        {renderStars(score.score)}
      </div>

      {/* Commentaire */}
      {score.comment && (
        <div className="bg-white p-3 rounded border">
          <p className="text-sm text-gray-700 italic">"{score.comment}"</p>
        </div>
      )}

      {/* Métadonnées */}
      <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
        <div className="flex items-center gap-1">
          {score.isAutomatic ? (
            <>
              <Bot className="w-3 h-3" />
              Score automatique
            </>
          ) : (
            <>
              <User className="w-3 h-3" />
              Score manuel
            </>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(score.scoredAt).toLocaleString()}
        </div>

        {score.benchmarkId && (
          <div className="text-xs text-blue-600">
            Benchmark: {score.benchmarkId}
          </div>
        )}
      </div>
    </div>
  )
}

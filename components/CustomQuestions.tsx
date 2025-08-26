'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'

export interface CustomQuestion {
  id: string
  question: string
  category: string
  expectedKeywords?: string[]
  createdAt: string
}

interface CustomQuestionsProps {
  onQuestionsChange: (questions: CustomQuestion[]) => void
}

export default function CustomQuestions({ onQuestionsChange }: CustomQuestionsProps) {
  const [questions, setQuestions] = useState<CustomQuestion[]>([])
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    category: 'Général',
    expectedKeywords: ''
  })

  const categories = [
    'Général',
    'Médical',
    'Technique',
    'Diagnostic',
    'Traitement',
    'Anatomie',
    'Pharmacologie',
    'Éthique',
    'Personnalisé'
  ]

  // Charger les questions depuis localStorage
  useEffect(() => {
    const savedQuestions = localStorage.getItem('customQuestions')
    if (savedQuestions) {
      try {
        const parsed = JSON.parse(savedQuestions)
        setQuestions(parsed)
        onQuestionsChange(parsed)
      } catch (error) {
        console.error('Erreur lors du chargement des questions:', error)
      }
    }
  }, [onQuestionsChange])

  // Sauvegarder les questions dans localStorage
  const saveQuestions = (newQuestions: CustomQuestion[]) => {
    localStorage.setItem('customQuestions', JSON.stringify(newQuestions))
    setQuestions(newQuestions)
    onQuestionsChange(newQuestions)
  }

  const addQuestion = () => {
    if (!newQuestion.question.trim()) return

    const question: CustomQuestion = {
      id: Date.now().toString(),
      question: newQuestion.question.trim(),
      category: newQuestion.category,
      expectedKeywords: newQuestion.expectedKeywords
        ? newQuestion.expectedKeywords.split(',').map(k => k.trim()).filter(k => k)
        : undefined,
      createdAt: new Date().toISOString()
    }

    const updatedQuestions = [...questions, question]
    saveQuestions(updatedQuestions)
    
    setNewQuestion({ question: '', category: 'Général', expectedKeywords: '' })
    setIsAddingQuestion(false)
  }

  const updateQuestion = (id: string, updatedData: Partial<CustomQuestion>) => {
    const updatedQuestions = questions.map(q => 
      q.id === id ? { ...q, ...updatedData } : q
    )
    saveQuestions(updatedQuestions)
    setEditingId(null)
  }

  const deleteQuestion = (id: string) => {
    const updatedQuestions = questions.filter(q => q.id !== id)
    saveQuestions(updatedQuestions)
  }

  const exportQuestions = () => {
    const dataStr = JSON.stringify(questions, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `questions-personnalisees-${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  const importQuestions = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        if (Array.isArray(imported)) {
          const mergedQuestions = [...questions, ...imported.map(q => ({
            ...q,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
          }))]
          saveQuestions(mergedQuestions)
        }
      } catch (error) {
        alert('Erreur lors de l\'importation du fichier')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Questions Personnalisées ({questions.length})
        </h2>
        <div className="flex gap-2">
          {questions.length > 0 && (
            <button
              onClick={exportQuestions}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Exporter
            </button>
          )}
          <label className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer">
            Importer
            <input
              type="file"
              accept=".json"
              onChange={importQuestions}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setIsAddingQuestion(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {isAddingQuestion && (
        <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
          <h3 className="font-medium text-gray-900 mb-3">Nouvelle Question</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question
              </label>
              <textarea
                value={newQuestion.question}
                onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                placeholder="Saisissez votre question..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={newQuestion.category}
                  onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mots-clés attendus (optionnel)
                </label>
                <input
                  type="text"
                  value={newQuestion.expectedKeywords}
                  onChange={(e) => setNewQuestion({ ...newQuestion, expectedKeywords: e.target.value })}
                  placeholder="mot1, mot2, mot3..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save size={16} />
                Sauvegarder
              </button>
              <button
                onClick={() => {
                  setIsAddingQuestion(false)
                  setNewQuestion({ question: '', category: 'Général', expectedKeywords: '' })
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                <X size={16} />
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des questions */}
      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Aucune question personnalisée</p>
            <p className="text-sm">Cliquez sur "Ajouter" pour créer votre première question</p>
          </div>
        ) : (
          questions.map((question) => (
            <div key={question.id} className="border border-gray-200 rounded-lg p-4">
              {editingId === question.id ? (
                <EditQuestionForm
                  question={question}
                  categories={categories}
                  onSave={(updatedData) => updateQuestion(question.id, updatedData)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {question.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(question.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-900 mb-2">{question.question}</p>
                    {question.expectedKeywords && question.expectedKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-gray-600">Mots-clés:</span>
                        {question.expectedKeywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditingId(question.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteQuestion(question.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

interface EditQuestionFormProps {
  question: CustomQuestion
  categories: string[]
  onSave: (data: Partial<CustomQuestion>) => void
  onCancel: () => void
}

function EditQuestionForm({ question, categories, onSave, onCancel }: EditQuestionFormProps) {
  const [editData, setEditData] = useState({
    question: question.question,
    category: question.category,
    expectedKeywords: question.expectedKeywords?.join(', ') || ''
  })

  const handleSave = () => {
    onSave({
      question: editData.question,
      category: editData.category,
      expectedKeywords: editData.expectedKeywords
        ? editData.expectedKeywords.split(',').map(k => k.trim()).filter(k => k)
        : undefined
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question
        </label>
        <textarea
          value={editData.question}
          onChange={(e) => setEditData({ ...editData, question: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catégorie
          </label>
          <select
            value={editData.category}
            onChange={(e) => setEditData({ ...editData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mots-clés attendus
          </label>
          <input
            type="text"
            value={editData.expectedKeywords}
            onChange={(e) => setEditData({ ...editData, expectedKeywords: e.target.value })}
            placeholder="mot1, mot2, mot3..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Save size={16} />
          Sauvegarder
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
          <X size={16} />
          Annuler
        </button>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, RefreshCw } from 'lucide-react'
import { useModels, useGeneration } from '../hooks/useApi'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  model?: string
}

interface Model {
  name: string
  status: string
  size: string
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedModel, setSelectedModel] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { models, isLoading: modelsLoading } = useModels()
  const { generateText } = useGeneration()

  // Scroll to bottom only when a new message is added by user interaction
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Select first ready model by default
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      const readyModel = models.find((m: Model) => m.status === 'ready')
      if (readyModel) {
        setSelectedModel(readyModel.name)
      }
    }
  }, [models, selectedModel])

  const handleSend = async () => {
    if (!input.trim() || !selectedModel || isGenerating) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsGenerating(true)
    
    // Scroll to bottom after adding user message
    setTimeout(scrollToBottom, 100)

    try {
      const response = await generateText(selectedModel, input)
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response || 'Désolé, je n\'ai pas pu générer de réponse.',
        timestamp: new Date(),
        model: selectedModel
      }

      setMessages(prev => [...prev, assistantMessage])
      // Scroll to bottom after adding assistant message
      setTimeout(scrollToBottom, 100)
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        timestamp: new Date(),
        model: selectedModel
      }

      setMessages(prev => [...prev, errorMessage])
      // Scroll to bottom after adding error message
      setTimeout(scrollToBottom, 100)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const readyModels = models.filter((m: Model) => m.status === 'ready')

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Bot className="w-6 h-6 mr-2 text-blue-600" />
          Chat IA
        </h2>
        
        <div className="flex items-center space-x-3">
          {/* Model Selector */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={modelsLoading || readyModels.length === 0}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {readyModels.length === 0 ? (
              <option value="">Aucun modèle disponible</option>
            ) : (
              readyModels.map((model: Model) => (
                <option key={model.name} value={model.name}>
                  {model.name} ({model.size})
                </option>
              ))
            )}
          </select>
          
          <button
            onClick={clearChat}
            disabled={messages.length === 0}
            className="flex items-center text-sm text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Reset
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-lg font-medium">Commencez une conversation</p>
              <p className="text-sm">Posez une question à l'IA</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <div className="flex items-start space-x-2">
                  {message.role === 'assistant' && (
                    <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  )}
                  {message.role === 'user' && (
                    <User className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-100" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className={`text-xs mt-2 flex items-center space-x-2 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      {message.model && message.role === 'assistant' && (
                        <span>• {message.model}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4" />
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">En train de réfléchir...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 pt-4">
        {readyModels.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              ⚠️ Aucun modèle disponible. Vérifiez qu'Ollama est démarré et que des modèles sont installés.
            </p>
          </div>
        ) : (
          <div className="flex space-x-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message... (Shift+Enter pour nouvelle ligne)"
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={2}
              disabled={isGenerating}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !selectedModel || isGenerating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

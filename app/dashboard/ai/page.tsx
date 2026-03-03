// app/dashboard/ai/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Mic, Bot, User, Loader2 } from 'lucide-react'

export default function AIPage() {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: 'Assalam-o-Alaikum! I am Rambo, your AI property manager. I can help you with:\n\n• Check room availability\n• Create new bookings\n• Process payments (JazzCash/EasyPaisa)\n• Generate reports\n• Answer guest queries\n\nTry asking: "Kya aaj Room 101 available hai?" or "Show me today\'s revenue"'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, sessionId: 'default' })
      })

      const data = await response.json()
      
      setMessages(prev => [...prev, { role: 'ai', content: data.response }])
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }])
    }
    
    setLoading(false)
  }

  const quickQuestions = [
    'Available rooms today?',
    'New booking',
    'Today\'s revenue',
    'Check-out list',
    'JazzCash payment'
  ]

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Rambo AI Assistant</h1>
            <p className="text-sm text-white/80">Online • Supports English & Urdu</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.role === 'ai' ? 'bg-primary-600 text-white' : 'bg-gray-300'
            }`}>
              {message.role === 'ai' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div className={`max-w-[80%] p-3 rounded-2xl ${
              message.role === 'ai' 
                ? 'bg-gray-100 rounded-tl-none' 
                : 'bg-primary-600 text-white rounded-tr-none'
            }`}>
              <p className="whitespace-pre-line text-sm">{message.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      <div className="px-4 py-2 border-t bg-gray-50 overflow-x-auto">
        <div className="flex gap-2">
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => {
                setInput(q)
                setTimeout(sendMessage, 100)
              }}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs whitespace-nowrap hover:bg-primary-50 hover:border-primary-300 transition"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`p-3 rounded-full transition ${
              isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message in English or Urdu..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          Press Enter to send • Rambo AI powered by GPT-4
        </p>
      </div>
    </div>
  )
}

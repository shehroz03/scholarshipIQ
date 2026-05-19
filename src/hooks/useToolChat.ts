import { useState, useEffect, useCallback } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  created_at?: string
  type?: string
  data?: any
}

export const TOOL_TYPES = {
  GENERAL: 'general',
  SOP_REVIEW: 'sop_review',
  UNIVERSITY_EMAIL: 'university_email',
  VISA_GUIDE: 'visa_guide',
  MOCK_INTERVIEW: 'mock_interview',
  FINANCIAL_PLAN: 'financial_plan'
} as const

export function useToolChat(toolType: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

  const getToken = () => {
    return localStorage.getItem('access_token') || 
           localStorage.getItem('token') ||
           sessionStorage.getItem('access_token')
  }

  const loadSession = useCallback(async () => {
    if (!toolType) return
    
    setIsInitializing(true)
    setError(null)
    
    try {
      const token = getToken()
      if (!token) {
        setError('Not authenticated')
        setIsInitializing(false)
        return
      }
      
      const res = await fetch(
        `${API_BASE_URL}/consultant/session/${toolType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || `HTTP ${res.status}`)
      }
      
      const data = await res.json()
      setSessionId(data.session_id)
      setMessages(data.messages || [])
      
    } catch (err: any) {
      console.error('Session load error:', err)
      setError(err.message)
    } finally {
      setIsInitializing(false)
    }
  }, [toolType])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return
    
    const token = getToken()
    if (!token) {
      setError('Not authenticated. Please log in again.')
      return
    }

    // If session not loaded yet, try to load it first
    let activeSessionId = sessionId
    if (!activeSessionId) {
      try {
        const res = await fetch(`${API_BASE_URL}/consultant/session/${toolType}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
        if (res.ok) {
          const data = await res.json()
          activeSessionId = data.session_id
          setSessionId(data.session_id)
          setMessages(data.messages || [])
        }
      } catch {
        // Continue anyway — backend will create session automatically
      }
    }
    
    const userMsg: Message = { role: 'user', content }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch(
        `${API_BASE_URL}/consultant/session/${toolType}/message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            content, 
            session_id: activeSessionId 
          })
        }
      )
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || `Server error (${res.status})`)
      }
      
      const data = await res.json()

      // If we got a new session_id back, save it
      if (data.session_id && !sessionId) {
        setSessionId(data.session_id)
      }

      setMessages(prev => {
        if (prev.length > 0) {
          const lastMsg = prev[prev.length - 1]
          if (lastMsg.role === 'assistant' && lastMsg.content === data.content) {
            return prev
          }
        }
        return [...prev, {
          role: 'assistant',
          content: data.content,
          type: data.type || toolType
        }]
      })
      
    } catch (err: any) {
      console.error('Send message error:', err)
      setError(err.message || 'Failed to send message. Please try again.')
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  const clearSession = async () => {
    const token = getToken()
    if (!token) return
    
    try {
      await fetch(
        `${API_BASE_URL}/consultant/session/${toolType}`,
        { 
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}` 
          }
        }
      )
    } catch (err) {
      console.error('Clear session error:', err)
    }
    
    setMessages([])
    setSessionId(null)
    loadSession()
  }

  return { 
    messages, 
    sendMessage, 
    clearSession, 
    isLoading, 
    isInitializing,
    error,
    sessionId
  }
}

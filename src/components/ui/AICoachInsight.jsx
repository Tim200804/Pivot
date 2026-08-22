import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, RefreshCw, AlertCircle, MessageSquare, Send, Trash2, X } from 'lucide-react'
import { getAICoachInsight, getAIChatResponse, loadChatHistory, saveChatHistory, clearChatHistory, getFallbackInsight } from '../../utils/aiCoach'

const AICoachInsight = memo(function AICoachInsight({ athlete, checkin, deferInitialInsight = true }) {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [insightRequested, setInsightRequested] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const isVisibleRef = useRef(false)

  const generateInitialInsight = useCallback(async () => {
    setInsightRequested(true)
    setLoading(true)
    setError(false)
    setErrorMessage('')
    try {
      const result = await getAICoachInsight(athlete, checkin)
      setMessages([{
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: result.text,
        isDemo: result.isDemo,
        timestamp: Date.now(),
      }])
    } catch (err) {
      setError(true)
      setErrorMessage(err?.message || 'Unable to generate insight.')
    }
    setLoading(false)
  }, [athlete, checkin])

  // Load history on mount; defer AI call until visible (A1)
  useEffect(() => {
    const history = loadChatHistory(athlete.id)
    if (history.length > 0) {
      setMessages(history)
      setInsightRequested(true)
    } else if (!deferInitialInsight) {
      generateInitialInsight()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athlete.id, deferInitialInsight])

  useEffect(() => {
    if (!deferInitialInsight || insightRequested) return
    const el = containerRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      generateInitialInsight()
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(e => e.isIntersecting) && !isVisibleRef.current) {
          isVisibleRef.current = true
          generateInitialInsight()
          observer.disconnect()
        }
      },
      { rootMargin: '80px', threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [deferInitialInsight, insightRequested, generateInitialInsight])

  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(athlete.id, messages)
    }
  }, [messages, athlete.id])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, isChatOpen])

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isChatOpen])

  const handleSend = useCallback(async () => {
    const text = inputValue.trim()
    if (!text || loading) return

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    }
    const assistantId = `ai-${Date.now()}`

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputValue('')
    setLoading(true)
    setError(false)
    setErrorMessage('')

    try {
      const result = await getAIChatResponse(athlete, checkin, updatedMessages)
      setMessages(prev => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          text: result.text,
          isDemo: result.isDemo,
          timestamp: Date.now(),
        },
      ])
    } catch (err) {
      setError(true)
      setErrorMessage(
        err?.status === 429 || /rate limit|busy|concurrency/i.test(err?.message || '')
          ? 'AI is busy (rate limit). Wait a second and try again.'
          : (err?.message || 'Something went wrong. Please try again.')
      )
    }
    setLoading(false)
  }, [inputValue, loading, messages, athlete, checkin])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleClear = useCallback(() => {
    clearChatHistory(athlete.id)
    setMessages([])
    generateInitialInsight()
  }, [athlete.id, generateInitialInsight])

  const lastInsight = messages.find(m => m.role === 'assistant')?.text || ''
  const placeholderInsight = getFallbackInsight(athlete, checkin)

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="glass-card p-5 border-l-4 border-l-violet-500 relative overflow-hidden"
    >
      {/* Background gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
              <Sparkles size={16} className="text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-sm font-semibold text-pivot-700 dark:text-slate-300">
              AI Coach Insight
            </h3>
            {messages.some(m => m.role === 'assistant' && m.isDemo) && (
              <span className="text-[10px] font-medium bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">
                Offline fallback
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={generateInitialInsight}
              disabled={loading}
              className="p-1.5 rounded-lg hover:bg-pivot-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              title="Regenerate insight"
            >
              <RefreshCw size={14} className={`text-pivot-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsChatOpen(v => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-xs font-medium hover:bg-violet-200 dark:hover:bg-violet-900/40 transition-colors"
            >
              <MessageSquare size={13} />
              {isChatOpen ? 'Close' : 'Chat'}
            </button>
          </div>
        </div>

        {/* Collapsed insight preview */}
        <AnimatePresence mode="wait">
          {!isChatOpen && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {loading && messages.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-pivot-600 dark:text-slate-300 leading-relaxed">{placeholderInsight}</p>
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-violet-400"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-pivot-400 dark:text-slate-500">Loading personalized insight…</span>
                  </div>
                </div>
              ) : !insightRequested && messages.length === 0 ? (
                <p className="text-sm text-pivot-600 dark:text-slate-300 leading-relaxed">{placeholderInsight}</p>
              ) : error ? (
                <div className="flex items-center gap-2 text-sm text-pivot-500 dark:text-slate-400">
                  <AlertCircle size={16} className="text-amber-500" />
                  <span>Unable to generate insight. Please try again.</span>
                </div>
              ) : (
                <>
                  <p className="text-sm text-pivot-600 dark:text-slate-300 leading-relaxed">
                    {lastInsight}
                  </p>
                  {messages[0]?.isDemo && (
                    <p className="text-[10px] text-pivot-400 dark:text-slate-500 italic">
                      (AI API unavailable — showing fallback insight)
                    </p>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded chat panel */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-3 px-1 border-t border-pivot-100 dark:border-slate-700/50">
                {/* Chat messages */}
                <div
                  ref={messagesContainerRef}
                  className="h-64 overflow-y-auto px-1 space-y-3 mb-3 custom-scrollbar"
                >
                  {messages.length === 0 && loading ? (
                    <div className="flex items-center justify-center h-full gap-2 text-sm text-pivot-400">
                      <RefreshCw size={14} className="animate-spin" />
                      Starting conversation...
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx === messages.length - 1 ? 0 : 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-violet-600 text-white rounded-br-md'
                              : 'bg-pivot-50 dark:bg-slate-700/50 text-pivot-700 dark:text-slate-200 rounded-bl-md border border-pivot-100 dark:border-slate-600/30'
                          }`}
                        >
                          {msg.text}
                          {msg.role === 'assistant' && msg.streaming && (
                            <span className="inline-block w-1.5 h-3.5 ml-0.5 align-middle bg-violet-400 animate-pulse" />
                          )}
                          {msg.role === 'assistant' && msg.isDemo && (
                            <span className="block mt-1 text-[10px] opacity-60 italic">
                              (Offline fallback)
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                  {loading && !messages.some(m => m.streaming) && (
                    <div className="flex justify-start">
                      <div className="bg-pivot-50 dark:bg-slate-700/50 px-4 py-3 rounded-2xl rounded-bl-md border border-pivot-100 dark:border-slate-600/30 flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-violet-400"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {error && (
                    <div className="flex justify-center">
                      <span className="text-xs text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full">
                        {errorMessage || 'Something went wrong. Please try again.'}
                      </span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="flex items-end gap-2 px-1">
                  <div className="flex-1 relative min-w-0">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask your AI coach anything..."
                      rows={1}
                      className="w-full resize-none max-h-24 bg-pivot-50 dark:bg-slate-800/50 border border-pivot-100 dark:border-slate-700 rounded-2xl px-4 py-2.5 pr-10 text-sm text-pivot-700 dark:text-slate-200 placeholder:text-pivot-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
                      style={{ minHeight: '42px' }}
                    />
                    {inputValue.length > 0 && (
                      <button
                        onClick={() => setInputValue('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-pivot-200 dark:hover:bg-slate-600 text-pivot-400"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || loading}
                    className="p-2.5 rounded-2xl bg-violet-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-violet-700 transition-colors shadow-md"
                  >
                    <Send size={16} />
                  </button>
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-pivot-400 dark:text-slate-500">
                    {messages.some(m => m.role === 'assistant' && m.isDemo)
                      ? 'AI unavailable — showing rule-based fallback'
                      : 'Powered by Kimi AI · Conversations are private'}
                  </span>
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1 text-[10px] text-pivot-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={11} />
                    Clear chat
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
})

export default AICoachInsight

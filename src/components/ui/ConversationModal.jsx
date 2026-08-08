import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageCircle, Loader2 } from 'lucide-react'
import { useUser } from '../../context/UserContext'
import { apiGetConversation, apiSendMessage, apiMarkMessageRead } from '../../config/api'

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ConversationModal({ otherUser, onClose }) {
  const { user: me } = useUser()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const loadConversation = useCallback(async () => {
    if (!otherUser?.id) return
    setLoading(true)
    setError('')
    try {
      const data = await apiGetConversation(otherUser.id)
      setMessages(data.messages || [])
    } catch (err) {
      setError(err.message || 'Failed to load conversation')
    } finally {
      setLoading(false)
    }
  }, [otherUser?.id])

  useEffect(() => {
    loadConversation()
    inputRef.current?.focus()
  }, [loadConversation])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = body.trim()
    if (!text || sending || !otherUser?.id) return
    setSending(true)
    try {
      await apiSendMessage({
        recipientId: otherUser.id,
        body: text,
      })
      setBody('')
      await loadConversation()
    } catch (err) {
      setError(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Mark unread messages from the other user as read when they become visible
  useEffect(() => {
    if (!messages.length || !me?.id) return
    messages.forEach((msg) => {
      if (!msg.isSender && !msg.readAt) {
        apiMarkMessageRead(msg.id).catch(() => {})
      }
    })
  }, [messages, me?.id])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card rounded-2xl shadow-2xl border border-pivot-200 dark:border-slate-600 w-full max-w-lg flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-pivot-100 dark:border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-blue to-blue-600 text-white flex items-center justify-center text-sm font-bold">
              {(otherUser?.name || '?').charAt(0)}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-pivot-900 dark:text-white">
                {otherUser?.name || 'Unknown'}
              </h3>
              <p className="text-[11px] text-pivot-400 capitalize">
                {otherUser?.role || ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-pivot-400 hover:bg-pivot-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar min-h-[300px]">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 size={24} className="text-accent-blue animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <MessageCircle size={40} className="text-pivot-300 mb-3" />
              <p className="text-sm text-pivot-500 dark:text-slate-400">
                No messages yet.
              </p>
              <p className="text-xs text-pivot-400 mt-1">
                Start the conversation with {otherUser?.name}.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.isSender
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-accent-blue text-white rounded-br-md'
                        : 'bg-white dark:bg-slate-800 border border-pivot-100 dark:border-slate-600 text-pivot-900 dark:text-slate-100 rounded-bl-md'
                    }`}
                  >
                    {msg.subject && (
                      <p className={`text-[11px] font-medium mb-1 ${isMe ? 'text-blue-100' : 'text-pivot-500 dark:text-slate-400'}`}>
                        {msg.subject}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.body}</p>
                    <p className={`text-[10px] mt-1.5 text-right ${isMe ? 'text-blue-100' : 'text-pivot-400 dark:text-slate-500'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="p-4 border-t border-pivot-100 dark:border-slate-700/30">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={body}
              onChange={(e) => { setBody(e.target.value); setError('') }}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${otherUser?.name || ''}…`}
              rows={2}
              className="flex-1 px-3 py-2 rounded-xl border border-pivot-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-pivot-900 dark:text-white placeholder-pivot-400 focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue resize-none"
            />
            <button
              onClick={handleSend}
              disabled={sending || !body.trim()}
              className="p-2.5 rounded-xl bg-accent-teal text-white hover:bg-teal-600 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <p className="text-[10px] text-pivot-400 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

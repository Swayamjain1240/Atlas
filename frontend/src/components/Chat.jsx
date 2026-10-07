import React from 'react'

export default function Chat() {
  const [messages, setMessages] = React.useState([
    {
      role: 'assistant',
      content: "Hello! I'm Atlas, your personal AI. I can help you find anything across your digital life.\n\nTry asking me:\n- \"What did I work on last week?\"\n- \"Find that article about AI agents\"\n- \"Summarize my notes from today\"",
    },
  ])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const messagesEndRef = React.useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/v1/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('atlas_api_key') || ''}`,
        },
        body: JSON.stringify({ query: input.trim() }),
      })
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.data?.answer || data.error?.message || 'No response',
          sources: data.data?.sources || [],
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Connection error. Make sure Atlas server is running on port 8741.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 chat-enter ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-atlas-500/20 flex items-center justify-center shrink-0">
                <span className="text-sm">🧠</span>
              </div>
            )}
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-atlas-500/20 text-gray-100 border border-atlas-500/20'
                  : 'glass text-gray-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-dark-500">
                  <div className="text-xs text-gray-500 mb-1">Sources:</div>
                  {msg.sources.slice(0, 3).map((src, j) => (
                    <div key={j} className="text-xs text-atlas-400 truncate">
                      {src.metadata?.title || src.metadata?.source_path || 'Unknown'}
                      <span className="text-gray-600 ml-1">
                        ({(src.score * 100).toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-dark-600 flex items-center justify-center shrink-0">
                <span className="text-sm">👤</span>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 chat-enter">
            <div className="w-8 h-8 rounded-lg bg-atlas-500/20 flex items-center justify-center shrink-0">
              <span className="text-sm">🧠</span>
            </div>
            <div className="glass rounded-2xl px-4 py-3">
              <div className="flex gap-1.5">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="shrink-0 p-4 border-t border-dark-500">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Atlas anything..."
            className="flex-1 glass rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-atlas-500/40 transition-colors"
            disabled={loading}
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-xl bg-atlas-500/20 border border-atlas-500/30 text-atlas-300 text-sm hover:bg-atlas-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

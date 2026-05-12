import { useRef, useEffect, useState } from 'react'

function Citation({ page, pdf_id }) {
  const url = 'http://localhost:8000/pdf-file/' + pdf_id + '#page=' + page
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      style={{
        fontSize: 11,
        padding: '2px 8px',
        background: '#EAF3DE',
        color: '#3B6D11',
        borderRadius: 20,
        textDecoration: 'none',
        fontWeight: 500
      }}
    >
      Page {page}
    </a>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      maxWidth: '88%',
      alignSelf: isUser ? 'flex-end' : 'flex-start'
    }}>
      <div style={{
        padding: '10px 14px',
        borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
        fontSize: 13,
        lineHeight: 1.65,
        background: isUser ? '#E6F1FB' : '#f5f5f3',
        color: isUser ? '#0C447C' : '#1a1a1a',
        border: isUser ? 'none' : '0.5px solid #e5e5e3',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}>
        {msg.text}
      </div>

      {msg.citations && msg.citations.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
          {msg.citations.map((c, i) => (
            <Citation key={i} page={c.page} pdf_id={c.pdf_id} />
          ))}
        </div>
      )}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{
      padding: '10px 14px',
      background: '#f5f5f3',
      border: '0.5px solid #e5e5e3',
      borderRadius: '12px 12px 12px 2px',
      display: 'flex',
      gap: 5,
      alignItems: 'center',
      alignSelf: 'flex-start'
    }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#aaa',
          animation: 'bounce 1.2s ease-in-out ' + (i * 0.2) + 's infinite'
        }} />
      ))}
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.8);opacity:.5}40%{transform:scale(1.2);opacity:1}}`}</style>
    </div>
  )
}

export default function ChatPanel({ messages, loading, onQuery, activePdf }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  const submit = () => {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    onQuery(q)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        padding: '14px 16px',
        borderBottom: '0.5px solid #e5e5e3',
        fontSize: 13,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0
      }}>
        Chat
        {activePdf
          ? (
            <span style={{
              fontSize: 11,
              padding: '2px 8px',
              background: '#E6F1FB',
              color: '#0C447C',
              borderRadius: 20
            }}>
              {activePdf.filename}
            </span>
          )
          : (
            <span style={{
              fontSize: 11,
              padding: '2px 8px',
              background: '#f0f0ee',
              color: '#666',
              borderRadius: 20
            }}>
              All PDFs
            </span>
          )
        }
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#aaa',
            fontSize: 13,
            textAlign: 'center',
            gap: 8,
            marginTop: 80
          }}>
            <div style={{ fontSize: 32 }}>📄</div>
            <p>Upload a PDF and ask a question.<br />Images from the document will appear on the right.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
        ))}

        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <div style={{
        padding: '12px 16px',
        borderTop: '0.5px solid #e5e5e3',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
        flexShrink: 0
      }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask a question about your PDF... (Enter to send)"
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            border: '0.5px solid #d0d0cc',
            borderRadius: 8,
            padding: '9px 12px',
            fontSize: 13,
            fontFamily: 'inherit',
            background: '#fff',
            color: '#1a1a1a',
            outline: 'none',
            lineHeight: 1.5,
            minHeight: 38,
            maxHeight: 120,
            overflowY: 'auto'
          }}
        />
        <button
          onClick={submit}
          disabled={loading || !input.trim()}
          style={{
            width: 38,
            height: 38,
            border: '0.5px solid #d0d0cc',
            borderRadius: 8,
            background: (input.trim() && !loading) ? '#1a1a1a' : '#f0f0ee',
            color: (input.trim() && !loading) ? '#fff' : '#aaa',
            cursor: (input.trim() && !loading) ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
            flexShrink: 0,
            fontSize: 18
          }}
        >
          ↑
        </button>
      </div>
    </div>
  )
}

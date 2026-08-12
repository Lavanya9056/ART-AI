import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const SUGGESTIONS = [
  'What should I check after finding open SSH?',
  'Explain SQL injection and how to test for it',
  'How do I assess MFA coverage?',
  'Summarize common web app vulnerabilities',
  'What is privilege escalation?',
  'Help me write a remediation plan',
];

export default function ChatPage({ token }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello. I am the ART-AI Pentest Copilot, powered by Pollinations AI. Ask me anything about vulnerability analysis, attack vectors, remediation strategies, or security best practices. All guidance is for authorized security testing only.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState('checking');
  const bottomRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/chat/status`)
      .then(r => setChatStatus(r.data.status))
      .catch(() => setChatStatus('offline'));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = text?.trim() || draft.trim();
    if (!msg || loading) return;
    setDraft('');

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build history for context (last 10 messages)
      const history = [...messages, userMsg]
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await axios.post(`${API}/chat/message`,
        { messages: history },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.data.content,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch (err) {
      const detail = err.response?.data?.detail || 'AI service unavailable. Check backend connectivity and retry.';
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Error: ${detail}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      content: 'Conversation cleared. How can I assist with your security assessment?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  };

  return (
    <div className="page" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      <div className="page-header">
        <div>
          <div className="eyebrow">ART-AI / Intelligence</div>
          <h2>Pentest Copilot</h2>
          <p className="sub">AI-powered security guidance — authorized testing only.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.78rem', color: 'var(--t2)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: chatStatus === 'online' ? 'var(--ok)' : chatStatus === 'checking' ? 'var(--warn)' : 'var(--err)', display: 'inline-block' }} />
            {chatStatus === 'online' ? 'Pollinations AI Online' : chatStatus === 'checking' ? 'Checking...' : 'AI Offline'}
          </span>
          <button className="btn btn-outline btn-sm" onClick={clearChat} disabled={loading}>Clear</button>
        </div>
      </div>

      {chatStatus === 'offline' && (
        <div className="msg err">
          AI service is offline. The Pollinations text API may be temporarily unavailable. Messages will show errors until connectivity is restored.
        </div>
      )}

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 0 12px', marginBottom: 12 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div className={`chat-msg ${msg.role}`} style={msg.isError ? { borderColor: 'rgba(239,68,68,.3)', background: 'rgba(239,68,68,.08)' } : {}}>
                {msg.content}
              </div>
              <span style={{ fontSize: '.68rem', color: 'var(--t3)', marginTop: 3, paddingInline: 4 }}>
                {msg.role === 'user' ? 'You' : 'Copilot'} · {msg.time}
              </span>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className="chat-msg assistant" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                <span style={{ color: 'var(--t3)', fontSize: '.82rem' }}>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        <div className="suggestions">
          {SUGGESTIONS.map(s => (
            <button key={s} className="sugg-btn" disabled={loading} onClick={() => send(s)}>{s}</button>
          ))}
        </div>

        {/* Composer */}
        <div className="chat-composer">
          <textarea
            className="chat-textarea"
            placeholder="Ask the copilot about vulnerabilities, attack paths, or remediation..."
            value={draft}
            rows={2}
            disabled={loading}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
            }}
          />
          <button className="btn btn-primary" style={{ alignSelf: 'flex-end', minWidth: 80 }}
            disabled={loading || !draft.trim()} onClick={() => send()}>
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

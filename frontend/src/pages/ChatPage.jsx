import { useState } from 'react';

export default function ChatPage({ token }) {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'What should I try after discovering an open SSH service?'
    },
    {
      id: 2,
      role: 'user',
      text: 'Check the banner, validate credentials, inspect version-specific exposure, and capture a proof-of-concept.'
    },
    {
      id: 3,
      role: 'assistant',
      text: 'I’d prioritize a fingerprinted banner check first, then validate authentication paths and any known weak spots.'
    }
  ]);

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    const userMessage = { id: Date.now(), role: 'user', text: trimmed };
    const reply = getAssistantReply(trimmed);

    setMessages((prev) => [...prev, userMessage, reply]);
    setDraft('');
  };

  const getAssistantReply = (text) => {
    const normalized = text.toLowerCase();

    if (normalized.includes('credential')) {
      return {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'I’d verify the exposed service, check for weak auth paths, and confirm whether the current access path is still viable.'
      };
    }

    if (normalized.includes('service')) {
      return {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'I’d fingerprint the service, review its version profile, and map any known exposure points before moving deeper.'
      };
    }

    return {
      id: Date.now() + 1,
      role: 'assistant',
      text: 'I’d trace the current lead, verify the evidence, and prioritize the most defensible next action.'
    };
  };

  return (
    <div className="page-card chat-page">
      <div className="chat-header">
        <div>
          <div className="eyebrow">Assistant</div>
          <h2>Pentest Copilot</h2>
        </div>
        <span className="chat-status">Online</span>
      </div>
      <p>Ask for target-specific guidance, exploit ideas, or next-step recommendations.</p>
      <p className="status-text" style={{ marginTop: '8px' }}>
        {token ? 'Authenticated operator session active.' : 'Running in guest mode.'}
      </p>

      <div className="chat-box">
        {messages.map((message) => (
          <div key={message.id} className={`chat-bubble ${message.role}`}>
            {message.text}
          </div>
        ))}
      </div>

      <div className="suggestion-row">
        {['Validate credentials', 'Inspect exposed services', 'Suggest next step'].map((item) => (
          <button
            key={item}
            className="sample-btn"
            type="button"
            onClick={() => setDraft(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="chat-composer">
        <textarea
          rows={3}
          placeholder="Ask the copilot for the next move..."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
        />
        <button className="generate-btn" type="button" onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

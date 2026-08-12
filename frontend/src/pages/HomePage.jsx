import { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function HomePage({ token }) {
  const [aiStatus, setAiStatus] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');

  useEffect(() => {
    axios.get(`${API}/ai/status`)
      .then(r => setAiStatus(r.data))
      .catch(() => setAiStatus({ status: 'offline', mode: 'unavailable', capabilities: [] }));
  }, []);

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true); setGenStatus('Synthesizing...'); setImageUrl('');
    try {
      const res = await axios.post(`${API}/ai/generate`, { prompt },
        { headers: { Authorization: `Bearer ${token}` } });
      setImageUrl(res.data.image_url); setGenStatus('Image generated.');
    } catch (err) {
      setGenStatus(err.response?.data?.detail || 'Generation failed. Retry.');
    } finally { setGenerating(false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">ART-AI / Overview</div>
          <h2>Command Center</h2>
          <p className="sub">Autonomous red team intelligence platform.</p>
        </div>
        <span className="badge badge-info">v1.0</span>
      </div>

      <div className="metric-grid">
        {[
          { val: '5', label: 'Active Modules', sub: 'Scanner, Sim, Compliance, Chat, Studio' },
          { val: aiStatus?.status === 'online' ? 'UP' : '--', label: 'AI Engine',
            sub: aiStatus?.mode || 'checking', color: aiStatus?.status === 'online' ? 'var(--ok)' : 'var(--t2)' },
          { val: '4', label: 'Sandbox Envs', sub: 'DVWA, JuiceShop, Metasploitable, Custom' },
          { val: '13', label: 'Compliance Checks', sub: 'Access, Network, App, Data, Monitor' },
        ].map(m => (
          <div key={m.label} className="metric-card">
            <div className="metric-val" style={m.color ? { color: m.color } : {}}>{m.val}</div>
            <div className="metric-label">{m.label}</div>
            <div className="metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="disclaimer">
        For authorized security testing, educational research, and controlled sandboxed environments only.
        Never target systems without explicit written permission.
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Platform Capabilities</div>
          {[
            ['Network Scanner', 'TCP port scan with risk assessment on authorized targets'],
            ['RL Simulation', 'Q-learning attack simulation in sandboxed environments'],
            ['Compliance Report', 'Static analysis of 13 security controls'],
            ['AI Copilot', 'Pentest guidance powered by Pollinations text AI'],
            ['Image Studio', 'AI image generation via Pollinations engine'],
          ].map(([title, desc]) => (
            <div key={title} style={{ display:'flex', gap:10, padding:'9px 0', borderBottom:'1px solid var(--bd)' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--cyan)', marginTop:6, flexShrink:0 }} />
              <div>
                <div style={{ fontSize:'.855rem', fontWeight:600, color:'var(--t1)' }}>{title}</div>
                <div style={{ fontSize:'.78rem', color:'var(--t2)', marginTop:2 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">AI Image Studio</div>
          <p style={{ fontSize:'.82rem', color:'var(--t2)', marginBottom:14 }}>
            Generate images using the Pollinations AI engine.
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
            {['Cyberpunk city at dawn', 'Quantum network visualization', 'Abstract threat map'].map(s => (
              <button key={s} className="sugg-btn" onClick={() => setPrompt(s)}>{s}</button>
            ))}
          </div>
          <textarea className="chat-textarea" style={{ width:'100%', marginBottom:10 }}
            placeholder="Describe the image to generate..." value={prompt} rows={3}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); } }}
          />
          <button className="btn btn-primary" style={{ width:'100%' }}
            onClick={generate} disabled={generating || !prompt.trim()}>
            {generating ? 'Generating...' : 'Generate Image'}
          </button>
          {genStatus && <p style={{ fontSize:'.8rem', color:'var(--t2)', marginTop:8 }}>{genStatus}</p>}
          {imageUrl && (
            <div style={{ marginTop:12, borderRadius:12, overflow:'hidden', border:'1px solid var(--bd)' }}>
              <img src={imageUrl} alt="Generated" style={{ width:'100%', display:'block' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

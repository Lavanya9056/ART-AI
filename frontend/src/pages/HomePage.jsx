import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const samples = [
  'A cinematic cyberpunk skyline at dawn',
  'A luxury sci-fi botanical garden',
  'An orbiting palace above neon oceans'
];

const metrics = [
  { label: 'Signal Strength', value: '99.2%' },
  { label: 'Render Queue', value: '3' },
  { label: 'Models Active', value: '12' }
];

const featureCards = [
  { title: 'Network Scanner', blurb: 'Discover ports, services, and exposed assets in seconds.' },
  { title: 'Vulnerability Scanner', blurb: 'Surface risks with layered intelligence and evidence-backed diagnostics.' },
  { title: 'Exploit Generator', blurb: 'Create payloads and vectors for controlled simulations.' },
  { title: 'AI Assistant', blurb: 'Let the copilot guide your next move with strategic suggestions.' }
];

export default function HomePage({ token }) {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Ready for a new signal.');
  const [aiStatus, setAiStatus] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/ai/status`);
        setAiStatus(response.data);
      } catch (error) {
        setAiStatus({ status: 'offline', capabilities: ['unavailable'] });
        console.error(error);
      }
    };

    fetchStatus();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setStatus('Enter a prompt to begin.');
      return;
    }

    setLoading(true);
    setStatus('Synthesizing your vision...');

    try {
      const response = await axios.post(
        `${API_BASE_URL}/ai/generate`,
        { prompt },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setImageUrl(response.data.image_url || '');
      setStatus('Vision rendered with precision.');
    } catch (error) {
      setStatus('Transmission failed. Please retry.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-shell">
      <section className="hero-copy">
        <div className="eyebrow">ART-AI / 2035 Interface</div>
        <h1>Autonomous red teaming, reimagined for the modern era.</h1>
        <p>
          A premium operating surface for intelligent reconnaissance, vulnerability analysis, exploit generation, and AI-guided decision support.
        </p>

        <div className="metric-grid">
          {metrics.map((metric) => (
            <div key={metric.label} className="metric-card">
              <div className="metric-value">{metric.value}</div>
              <div className="metric-label">{metric.label}</div>
            </div>
          ))}
        </div>

        <div className="feature-grid">
          {featureCards.map((card) => (
            <div key={card.title} className="feature-card">
              <h3>{card.title}</h3>
              <p>{card.blurb}</p>
            </div>
          ))}
        </div>

        <div className="feature-card" style={{ marginTop: '16px' }}>
          <h3>Threat Summary</h3>
          <p>3 active exposures • 1 pending remediation • 2 high-confidence findings</p>
        </div>

        <div className="feature-card pulse-panel" style={{ marginTop: '16px' }}>
          <div className="pulse-header">
            <h3>Network Pulse</h3>
            <span>24 nodes</span>
          </div>
          <div className="pulse-bars" aria-label="Network pulse indicator">
            {[32, 56, 44, 78, 61, 90].map((height, index) => (
              <div key={index} className="pulse-bar" style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>

        <div className="feature-card" style={{ marginTop: '16px' }}>
          <h3>Recent Findings</h3>
          <ul>
            <li>Open SSH service exposed on 22/tcp</li>
            <li>MFA gap detected on admin panel</li>
            <li>Outdated TLS configuration detected</li>
          </ul>
        </div>

        <div className="feature-card" style={{ marginTop: '16px' }}>
          <h3>Posture Trend</h3>
          <div className="trend-row">
            <span>Improving</span>
            <svg className="trend-sparkline" viewBox="0 0 120 40" role="img" aria-label="Posture trend sparkline">
              <path d="M0 30 C 20 26, 28 18, 40 20 S 70 36, 82 24 S 108 10, 120 8" />
            </svg>
            <strong>82%</strong>
          </div>
        </div>

        {aiStatus && (
          <div className="feature-card" style={{ marginTop: '16px' }}>
            <h3>AI Core Status</h3>
            <p>
              State: <strong>{aiStatus.status}</strong> · Mode: <strong>{aiStatus.mode}</strong>
            </p>
            <p>{aiStatus.capabilities?.join(' • ')}</p>
          </div>
        )}
      </section>

      <section className="control-panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Prompt Engine</div>
            <h2>Command your vision</h2>
          </div>
          <div className={`status-pill ${loading ? 'working' : 'live'}`}>
            <span className={`status-dot ${loading ? 'working' : 'live'}`} />
            {loading ? 'Working' : 'Live'}
          </div>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to create"
          rows={5}
        />

        <div className="sample-row">
          {samples.map((sample) => (
            <button
              key={sample}
              className="sample-btn"
              type="button"
              onClick={() => setPrompt(sample)}
            >
              {sample}
            </button>
          ))}
        </div>

        <button className="generate-btn" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Rendering...' : 'Generate Image'}
        </button>

        <p className="status-text">{status}</p>

        {imageUrl && (
          <div className="result-frame">
            <img src={imageUrl} alt="Generated AI art" className="result-image" />
          </div>
        )}
      </section>
    </div>
  );
}

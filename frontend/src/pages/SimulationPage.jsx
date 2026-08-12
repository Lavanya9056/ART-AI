import { useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const ENVS = ['DVWA', 'JuiceShop', 'Metasploitable', 'CustomAPI'];

export default function SimulationPage({ token }) {
  const [environment, setEnvironment] = useState('DVWA');
  const [iterations, setIterations] = useState(100);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const runSim = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await axios.post(`${API}/simulate/run`,
        { environment, iterations: Number(iterations) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Simulation failed. Retry.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">ART-AI / Simulation</div>
          <h2>RL Attack Simulation</h2>
          <p className="sub">Q-learning agent explores attack paths in a sandboxed environment.</p>
        </div>
      </div>

      <div className="disclaimer">
        Simulation runs in controlled sandboxed environments only (DVWA, JuiceShop, Metasploitable, Custom).
      </div>

      <div className="card">
        <div className="card-title">Simulation Configuration</div>
        <div className="form-row">
          <div style={{ flex: 2 }}>
            <label style={{ fontSize: '.78rem', color: 'var(--t2)', display: 'block', marginBottom: 5 }}>Target Environment</label>
            <select className="select" value={environment} onChange={e => setEnvironment(e.target.value)}>
              {ENVS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '.78rem', color: 'var(--t2)', display: 'block', marginBottom: 5 }}>Iterations (1–500)</label>
            <input className="input" type="number" min={1} max={500} value={iterations}
              onChange={e => setIterations(e.target.value)} />
          </div>
          <div style={{ paddingTop: 22 }}>
            <button className="btn btn-primary" onClick={runSim} disabled={loading}>
              {loading ? 'Running...' : 'Run Simulation'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="msg err">{error}</div>}

      {loading && (
        <div className="state-box">
          <div className="spinner" />
          <div className="state-title">Running Q-learning simulation...</div>
          <div className="state-sub">Agent exploring {iterations} iterations in {environment}.</div>
        </div>
      )}

      {result && !loading && (
        <>
          <div className="metric-grid">
            {[
              { val: result.iterations, label: 'Iterations', sub: result.environment },
              { val: `${result.success_rate}%`, label: 'Success Rate', color: result.success_rate > 50 ? 'var(--ok)' : 'var(--warn)' },
              { val: result.total_reward.toFixed(1), label: 'Total Reward', sub: `best: ${result.best_reward.toFixed(1)}` },
              { val: result.final_epsilon.toFixed(3), label: 'Final Epsilon', sub: 'exploration rate' },
            ].map(m => (
              <div key={m.label} className="metric-card">
                <div className="metric-val" style={m.color ? { color: m.color } : {}}>{m.val}</div>
                <div className="metric-label">{m.label}</div>
                {m.sub && <div className="metric-sub">{m.sub}</div>}
              </div>
            ))}
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-title">Best Attack Path</div>
              {result.best_path?.length > 0 ? (
                <div className="path-list">
                  {result.best_path.map((step, i) => (
                    <span key={i} className="path-node">{step.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--t2)', fontSize: '.85rem' }}>No successful path found in this run.</p>
              )}
            </div>

            <div className="card">
              <div className="card-title">RL Parameters</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '.85rem' }}>
                {[
                  ['Algorithm', 'Q-Learning'],
                  ['Environment', result.environment_description],
                  ['Learning Rate (α)', result.learning_rate],
                  ['Discount Factor (γ)', result.discount_factor],
                  ['Final Exploration (ε)', result.final_epsilon],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--bd)' }}>
                    <span style={{ color: 'var(--t2)' }}>{k}</span>
                    <strong style={{ color: 'var(--t1)' }}>{v}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Recent Events</div>
            <div className="event-stream">
              {(result.recent_events || []).slice(-30).reverse().map((ev, i) => (
                <div key={i} className={`event-item ${ev.outcome}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <strong style={{ color: 'var(--t1)', fontSize: '.82rem' }}>
                      {ev.action.replace(/_/g, ' ')}
                    </strong>
                    <span style={{ fontSize: '.72rem', color: 'var(--t3)' }}>
                      #{ev.iteration} · ε={ev.epsilon}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: '.78rem', color: 'var(--t2)' }}>
                    <span>
                      Outcome: <strong style={{ color: ev.outcome === 'success' ? 'var(--ok)' : 'var(--err)' }}>
                        {ev.outcome}
                      </strong>
                    </span>
                    <span>Reward: <strong style={{ color: ev.reward >= 0 ? 'var(--ok)' : 'var(--err)' }}>
                      {ev.reward > 0 ? '+' : ''}{ev.reward}
                    </strong></span>
                    <span>State: {ev.state}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Action Distribution</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(result.action_distribution || {})
                .sort((a, b) => b[1] - a[1])
                .map(([action, count]) => {
                  const max = Math.max(...Object.values(result.action_distribution));
                  const pct = max > 0 ? (count / max) * 100 : 0;
                  return (
                    <div key={action}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', marginBottom: 3 }}>
                        <span style={{ color: 'var(--t2)' }}>{action.replace(/_/g, ' ')}</span>
                        <span style={{ color: 'var(--t1)' }}>{count}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}

      {!result && !loading && !error && (
        <div className="state-box">
          <div className="state-icon">⬡</div>
          <div className="state-title">No simulation run yet</div>
          <div className="state-sub">Select a sandboxed environment, set iterations, and click Run Simulation.</div>
        </div>
      )}
    </div>
  );
}

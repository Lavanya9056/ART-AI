import { useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const RISK_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3, Info: 4 };

function RiskBadge({ risk }) {
  return <span className={`badge badge-${risk.toLowerCase()}`}>{risk}</span>;
}

export default function ScannerPage({ token }) {
  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState('quick');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  const runScan = async () => {
    if (!target.trim()) { setError('Enter a target hostname or IP.'); return; }
    setLoading(true); setError(''); setResult(null); setExpanded(null);
    try {
      const res = await axios.post(`${API}/scan/run`,
        { target: target.trim(), scan_type: scanType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.error) setError(res.data.error);
      else setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Scan failed. Check the target and retry.');
    } finally { setLoading(false); }
  };

  const sorted = result?.results?.slice().sort((a, b) =>
    (RISK_ORDER[a.risk] ?? 9) - (RISK_ORDER[b.risk] ?? 9)) ?? [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">ART-AI / Scanner</div>
          <h2>Network Scanner</h2>
          <p className="sub">TCP port scan with service identification and risk assessment.</p>
        </div>
      </div>

      <div className="disclaimer">
        Authorized targets only — only scan systems you own or have explicit written permission to test.
      </div>

      <div className="card">
        <div className="card-title">Scan Configuration</div>
        <div className="form-row">
          <div style={{ flex: 2 }}>
            <label style={{ fontSize: '.78rem', color: 'var(--t2)', display: 'block', marginBottom: 5 }}>Target (hostname or IP)</label>
            <input className="input" placeholder="e.g. 127.0.0.1 or localhost"
              value={target} onChange={e => setTarget(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runScan()} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '.78rem', color: 'var(--t2)', display: 'block', marginBottom: 5 }}>Scan Type</label>
            <select className="select" value={scanType} onChange={e => setScanType(e.target.value)}>
              <option value="quick">Quick (14 ports)</option>
              <option value="full">Full (22 ports)</option>
            </select>
          </div>
          <div style={{ paddingTop: 22 }}>
            <button className="btn btn-primary" onClick={runScan} disabled={loading || !target.trim()}>
              {loading ? 'Scanning...' : 'Run Scan'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="msg err">{error}</div>}

      {loading && (
        <div className="state-box">
          <div className="spinner" />
          <div className="state-title">Scanning {target}...</div>
          <div className="state-sub">Probing ports. This may take 15–30 seconds depending on target and network.</div>
        </div>
      )}

      {result && !loading && (
        <>
          <div className="metric-grid">
            {[
              { val: result.open_count, label: 'Open Ports', sub: `of ${result.ports_scanned} scanned` },
              { val: result.summary.critical, label: 'Critical', color: result.summary.critical > 0 ? 'var(--crit)' : undefined },
              { val: result.summary.high, label: 'High', color: result.summary.high > 0 ? 'var(--high)' : undefined },
              { val: result.summary.medium + result.summary.low, label: 'Med / Low' },
            ].map(m => (
              <div key={m.label} className="metric-card">
                <div className="metric-val" style={m.color ? { color: m.color } : {}}>{m.val}</div>
                <div className="metric-label">{m.label}</div>
                {m.sub && <div className="metric-sub">{m.sub}</div>}
              </div>
            ))}
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div className="card-title" style={{ margin: 0 }}>
                Results — {result.target} ({result.resolved_ip})
              </div>
              <span style={{ fontSize: '.75rem', color: 'var(--t3)' }}>{result.scan_type} scan</span>
            </div>

            {sorted.length === 0 ? (
              <div className="state-box">
                <div className="state-icon">✓</div>
                <div className="state-title">No open ports found</div>
                <div className="state-sub">All scanned ports are closed or filtered on this target.</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Port</th><th>Protocol</th><th>Service</th><th>State</th><th>Risk</th><th>Banner</th></tr>
                  </thead>
                  <tbody>
                    {sorted.map(row => (
                      <>
                        <tr key={row.port} style={{ cursor: 'pointer' }}
                          onClick={() => setExpanded(expanded === row.port ? null : row.port)}>
                          <td><strong>{row.port}</strong></td>
                          <td className="td-muted">{row.protocol}</td>
                          <td><strong>{row.service}</strong></td>
                          <td><span className="badge badge-low">open</span></td>
                          <td><RiskBadge risk={row.risk} /></td>
                          <td className="td-muted" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {row.banner || '—'}
                          </td>
                        </tr>
                        {expanded === row.port && (
                          <tr key={`${row.port}-exp`}>
                            <td colSpan={6} style={{ background: 'rgba(34,211,238,0.04)', padding: '12px 16px' }}>
                              <div style={{ fontSize: '.82rem', color: 'var(--t2)', lineHeight: 1.6 }}>
                                <strong style={{ color: 'var(--t1)' }}>Finding:</strong> {row.notes}
                              </div>
                              {row.banner && (
                                <div style={{ marginTop: 6, fontSize: '.78rem', color: 'var(--t3)', fontFamily: 'monospace' }}>
                                  Banner: {row.banner}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {!result && !loading && !error && (
        <div className="state-box">
          <div className="state-icon">⬡</div>
          <div className="state-title">No scan results yet</div>
          <div className="state-sub">Enter an authorized target above and click Run Scan to begin port discovery.</div>
        </div>
      )}
    </div>
  );
}
